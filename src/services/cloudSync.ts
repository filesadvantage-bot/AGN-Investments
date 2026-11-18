import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  GatewayProvider,
  OrderRecord,
  OrderTotals,
  PlantPlacement,
  PlantPortionOption,
  Product
} from '../types/pos';

const SAFE_ID_REGEX = /[^a-zA-Z0-9_-]/g;

export function sanitizeFirestoreId(rawId: string): string {
  const cleaned = rawId.replace(SAFE_ID_REGEX, '-').slice(0, 128);
  return cleaned || 'item-1';
}

function clampString(value: string | undefined, maxLength: number, fallback = ''): string {
  const raw = (value ?? fallback).trim();
  return raw.slice(0, maxLength);
}

async function ensureBoundedImageString(imageSrc: string | undefined): Promise<string> {
  if (!imageSrc) return '';
  if (imageSrc.length <= 245000) return imageSrc;
  if (!imageSrc.startsWith('data:image/')) {
    return imageSrc.slice(0, 245000);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 480;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.68);
      resolve(compressed.length <= 248000 ? compressed : '');
    };
    img.onerror = () => resolve('');
    img.src = imageSrc;
  });
}

export async function ensureUserProfileSynced(user: User, storeName: string): Promise<void> {
  const uid = sanitizeFirestoreId(user.uid);
  const publicPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;
  const publicRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'info');

  const safeDisplayName = clampString(user.displayName || user.email?.split('@')[0] || 'Aqua Nest User', 120, 'Aqua Nest User');
  const safePhotoUrl = clampString(user.photoURL || '', 1024, '');
  const safeStoreName = clampString(storeName, 120, 'Aqua Nest') || 'Aqua Nest';
  const safeEmail = clampString(user.email || '', 254, '');

  let existsSnap = false;
  try {
    const snap = await getDoc(publicRef);
    existsSnap = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, publicPath);
  }

  if (!existsSnap) {
    try {
      const batch = writeBatch(db);
      batch.set(publicRef, {
        uid,
        displayName: safeDisplayName,
        photoURL: safePhotoUrl,
        storeName: safeStoreName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      if (safeEmail.length >= 3) {
        batch.set(privateRef, {
          uid,
          email: safeEmail,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${publicPath} + ${privatePath}`);
    }
  } else {
    try {
      await updateDoc(publicRef, {
        displayName: safeDisplayName,
        photoURL: safePhotoUrl,
        storeName: safeStoreName,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, publicPath);
    }
  }
}

export interface CloudProductPatch {
  id: string;
  product: Product;
  isDeleted: boolean;
}

export function subscribeUserCustomProducts(
  uid: string,
  onUpdate: (patches: CloudProductPatch[]) => void
): () => void {
  const safeUid = sanitizeFirestoreId(uid);
  const colPath = `users/${safeUid}/customProducts`;
  const q = query(collection(db, 'users', safeUid, 'customProducts'), where('ownerId', '==', safeUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const patches: CloudProductPatch[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const portions: PlantPortionOption[] = [];
        if (typeof d.option1Label === 'string' && d.option1Label.trim()) {
          portions.push({ label: d.option1Label, priceDelta: Number(d.option1Delta) || 0 });
        }
        if (typeof d.option2Label === 'string' && d.option2Label.trim()) {
          portions.push({ label: d.option2Label, priceDelta: Number(d.option2Delta) || 0 });
        }
        if (typeof d.option3Label === 'string' && d.option3Label.trim()) {
          portions.push({ label: d.option3Label, priceDelta: Number(d.option3Delta) || 0 });
        }

        const price = Math.max(0, Number(d.price) || 0);
        const orig = Number(d.originalPrice) || 0;
        const placementRaw = typeof d.placement === 'string' ? d.placement : '';
        const validPlacements: PlantPlacement[] = ['Foreground', 'Midground', 'Background', 'Floating'];
        const placement = validPlacements.includes(placementRaw as PlantPlacement)
          ? (placementRaw as PlantPlacement)
          : undefined;

        const product: Product = {
          id: String(d.id || docSnap.id),
          name: String(d.name || 'Custom Plant'),
          scientificName: d.scientificName ? String(d.scientificName) : undefined,
          careNote: d.careNote ? String(d.careNote) : undefined,
          price,
          originalPrice: orig > price ? orig : undefined,
          stock: Math.max(0, Math.floor(Number(d.stock) || 0)),
          sku: String(d.sku || 'AQN-CUSTOM'),
          department: String(d.department || 'Aquarium Plants'),
          category: String(d.category || 'Custom'),
          placement,
          brand: d.brand ? String(d.brand) : undefined,
          icon: '🌿',
          image: d.image ? String(d.image) : undefined,
          portionOptions: portions.length > 0 ? portions : undefined
        };

        return {
          id: product.id,
          product,
          isDeleted: Boolean(d.isDeleted)
        };
      });
      onUpdate(patches);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

export async function saveCustomProductToCloud(uid: string, product: Product, isDeleted = false): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const safeProdId = sanitizeFirestoreId(product.id);
  const docPath = `users/${safeUid}/customProducts/${safeProdId}`;
  const docRef = doc(db, 'users', safeUid, 'customProducts', safeProdId);

  const boundedImage = await ensureBoundedImageString(product.image);
  const opts = product.portionOptions || [];

  const mutableFields = {
    name: clampString(product.name, 140, 'Custom Item') || 'Custom Item',
    scientificName: clampString(product.scientificName, 140, ''),
    careNote: clampString(product.careNote, 500, ''),
    price: Math.min(10000000, Math.max(0, Number(product.price) || 0)),
    originalPrice: Math.min(10000000, Math.max(0, Number(product.originalPrice) || 0)),
    stock: Math.min(1000000, Math.max(0, Math.floor(Number(product.stock) || 0))),
    sku: clampString(product.sku, 64, 'AQN-SKU') || 'AQN-SKU',
    department: clampString(product.department, 80, 'Aquarium Plants') || 'Aquarium Plants',
    category: clampString(product.category, 80, 'Custom') || 'Custom',
    placement: product.placement || '',
    brand: clampString(product.brand, 80, ''),
    image: boundedImage,
    option1Label: clampString(opts[0]?.label, 80, ''),
    option1Delta: Math.min(1000000, Math.max(-1000000, Number(opts[0]?.priceDelta) || 0)),
    option2Label: clampString(opts[1]?.label, 80, ''),
    option2Delta: Math.min(1000000, Math.max(-1000000, Number(opts[1]?.priceDelta) || 0)),
    option3Label: clampString(opts[2]?.label, 80, ''),
    option3Delta: Math.min(1000000, Math.max(-1000000, Number(opts[2]?.priceDelta) || 0)),
    isDeleted
  };

  let existsSnap = false;
  try {
    const snap = await getDoc(docRef);
    existsSnap = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }

  if (!existsSnap) {
    try {
      await setDoc(docRef, {
        id: safeProdId,
        ownerId: safeUid,
        ...mutableFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  } else {
    try {
      await updateDoc(docRef, {
        ...mutableFields,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  }
}

export async function saveOrderToCloud(uid: string, order: OrderRecord): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const safeOrderId = sanitizeFirestoreId(order.id);
  const docPath = `users/${safeUid}/orders/${safeOrderId}`;
  const docRef = doc(db, 'users', safeUid, 'orders', safeOrderId);

  const itemSummary = clampString(
    order.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
    600,
    'Aquascaping Order'
  ) || 'Aquascaping Order';
  const itemCount = Math.max(1, order.items.reduce((sum, i) => sum + i.quantity, 0));

  try {
    await setDoc(docRef, {
      id: safeOrderId,
      ownerId: safeUid,
      customerName: clampString(order.customerName, 120, 'Walk-in Aquascaper') || 'Walk-in Aquascaper',
      orderNote: clampString(order.orderNote, 400, ''),
      itemSummary,
      itemCount: Math.min(10000, itemCount),
      subtotal: Math.min(100000000, Math.max(0, Number(order.subtotal) || 0)),
      discountLabel: 'Rs. 0.00',
      discountAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      deliveryFee: Math.min(100000, Math.max(0, Number(order.deliveryFee) || 0)),
      deliveryMode: order.deliveryInfo?.mode === 'pickup' ? 'pickup' : 'ncm',
      deliveryPartner: clampString(order.deliveryInfo?.partnerName, 80, 'Nepal Can Move') || 'Nepal Can Move',
      deliveryDestination: clampString(order.deliveryInfo?.destination, 80, ''),
      trackingCode: clampString(order.deliveryInfo?.trackingCode, 40, ''),
      total: Math.min(100000000, Math.max(0, Number(order.total) || 0)),
      paymentMethod: clampString(order.paymentMethod, 80, 'Cash') || 'Cash',
      paymentDetails: clampString(order.paymentDetails, 240, ''),
      status: 'Paid',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export function subscribeUserCloudOrders(
  uid: string,
  onCountUpdate: (count: number) => void
): () => void {
  const safeUid = sanitizeFirestoreId(uid);
  const colPath = `users/${safeUid}/orders`;
  const q = query(collection(db, 'users', safeUid, 'orders'), where('ownerId', '==', safeUid));

  return onSnapshot(
    q,
    (snap) => {
      onCountUpdate(snap.size);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
}

export interface ActiveGoogleAccount {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  mode: 'firebase' | 'keyless';
  token?: string;
}

export interface BackendHealthStatus {
  status: string;
  apiKeyRequired?: boolean;
  service: string;
  runtime: string;
  firebaseProjectId: string;
  ncmHubCount: number;
}

export async function fetchBackendApiHealth(): Promise<BackendHealthStatus | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return (await res.json()) as BackendHealthStatus;
  } catch {
    return null;
  }
}

export async function signInKeylessGoogleViaBackend(
  displayName: string,
  email: string
): Promise<ActiveGoogleAccount> {
  const res = await fetch('/api/auth/keyless-google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email })
  });

  const data = (await res.json()) as {
    authenticated?: boolean;
    error?: string;
    token?: string;
    user?: { uid: string; email: string; name: string; picture?: string };
  };

  if (!res.ok || !data.authenticated || !data.user || !data.token) {
    throw new Error(data.error || 'Unable to create Google session.');
  }

  return {
    uid: data.user.uid,
    displayName: data.user.name,
    email: data.user.email,
    photoURL: data.user.picture || '',
    mode: 'keyless',
    token: data.token
  };
}

export async function verifyBackendAuthSession(user: User): Promise<boolean> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/auth/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      }
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function verifyKeylessBackendSession(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { authenticated?: boolean };
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export interface BackendGatewayInitResponse {
  provider: GatewayProvider;
  merchantCode?: string;
  transactionUuid?: string;
  signature?: string;
  purchaseOrderId?: string;
  amountPaisa?: number;
}

export async function initiateGatewayViaBackend(
  provider: GatewayProvider,
  orderTotals: OrderTotals,
  storeName: string
): Promise<BackendGatewayInitResponse | null> {
  try {
    const endpoint =
      provider === 'esewa'
        ? '/api/payments/esewa/initiate'
        : '/api/payments/khalti/initiate';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtotal: orderTotals.subtotal,
        deliveryFee: orderTotals.deliveryFee,
        total: orderTotals.total,
        storeName
      })
    });
    if (!res.ok) return null;
    return (await res.json()) as BackendGatewayInitResponse;
  } catch {
    return null;
  }
}
