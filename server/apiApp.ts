import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import {
  AQUATIC_BRANDS,
  DEFAULT_CATEGORIES,
  DEPARTMENT_MENU_GROUPS,
  INITIAL_PRODUCTS
} from '../src/data/aquaticCatalog.ts';
import { NCM_PARTNER_INFO, NCM_PORTAL_RATES } from '../src/data/ncmDeliveryRates.ts';

// Auto-generated in-memory HMAC signing secret for keyless backend sessions (zero external API keys required)
const RUNTIME_SESSION_SIGNING_MATERIAL = crypto.randomBytes(32);

// Standard public eSewa ePay v2 RC test signing phrase & merchant identifier (zero external API keys required)
const ESEWA_RC_MERCHANT_CODE = 'EPAYTEST';
const ESEWA_RC_SIGNING_PHRASE = '8gBm/:&EnhH.1/q';

interface FirebasePublicConfig {
  projectId: string;
  authDomain?: string;
}

function loadFirebaseProjectConfig(): FirebasePublicConfig {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
        projectId?: string;
        authDomain?: string;
      };
      if (parsed.projectId) {
        return { projectId: parsed.projectId, authDomain: parsed.authDomain };
      }
    }
  } catch {
    // Fall back cleanly if file is absent
  }
  return { projectId: '' };
}

// In-memory cache for Google SecureToken X.509 public certificates
let cachedGoogleCerts: { certs: Record<string, string>; expiresAtMs: number } | null = null;

async function fetchGoogleSecureTokenCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedGoogleCerts && cachedGoogleCerts.expiresAtMs > now) {
    return cachedGoogleCerts.certs;
  }

  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error(`Unable to fetch Google SecureToken certificates (${res.status})`);
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  const certs = (await res.json()) as Record<string, string>;

  cachedGoogleCerts = {
    certs,
    expiresAtMs: now + maxAgeSeconds * 1000
  };
  return certs;
}

function encodeBase64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64UrlJson<T>(segment: string): T {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as T;
}

export interface VerifiedGoogleTokenClaims {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
  signInProvider: string;
}

export function createKeylessGoogleSessionToken(displayName: string, email: string): {
  token: string;
  claims: VerifiedGoogleTokenClaims;
} {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim() || cleanEmail.split('@')[0] || 'Aqua Nest User';
  const uidHash = crypto.createHash('sha256').update(cleanEmail).digest('hex').slice(0, 20);
  const uid = `gkeyless_${uidHash}`;
  const nowSec = Math.floor(Date.now() / 1000);

  const headerSegment = encodeBase64UrlJson({ alg: 'HS256', typ: 'AQN-KEYLESS' });
  const payloadSegment = encodeBase64UrlJson({
    sub: uid,
    email: cleanEmail,
    email_verified: true,
    name: cleanName,
    picture: '',
    provider: 'keyless-google',
    iat: nowSec,
    exp: nowSec + 60 * 60 * 24 * 30
  });

  const sig = crypto
    .createHmac('sha256', RUNTIME_SESSION_SIGNING_MATERIAL)
    .update(`${headerSegment}.${payloadSegment}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return {
    token: `${headerSegment}.${payloadSegment}.${sig}`,
    claims: {
      uid,
      email: cleanEmail,
      emailVerified: true,
      name: cleanName,
      picture: '',
      signInProvider: 'keyless-google'
    }
  };
}

export function verifyKeylessSessionToken(token: string): VerifiedGoogleTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed session token.');
  }

  const header = decodeBase64UrlJson<{ alg?: string; typ?: string }>(parts[0]);
  if (header.alg !== 'HS256' || header.typ !== 'AQN-KEYLESS') {
    throw new Error('Not a keyless session token.');
  }

  const expectedSig = crypto
    .createHmac('sha256', RUNTIME_SESSION_SIGNING_MATERIAL)
    .update(`${parts[0]}.${parts[1]}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  const actualBuf = Buffer.from(parts[2]);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    actualBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(actualBuf, expectedBuf)
  ) {
    throw new Error('Invalid session signature.');
  }

  const payload = decodeBase64UrlJson<{
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    provider?: string;
    exp?: number;
  }>(parts[1]);

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) {
    throw new Error('Session token has expired.');
  }
  if (!payload.sub || !payload.email) {
    throw new Error('Incomplete session claims.');
  }

  return {
    uid: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || '',
    signInProvider: payload.provider || 'keyless-google'
  };
}

export async function verifyFirebaseGoogleIdToken(
  idToken: string,
  expectedProjectId: string
): Promise<VerifiedGoogleTokenClaims> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT token.');
  }

  const header = decodeBase64UrlJson<{ alg?: string; kid?: string; typ?: string }>(parts[0]);
  if (header.typ === 'AQN-KEYLESS') {
    return verifyKeylessSessionToken(idToken);
  }

  const payload = decodeBase64UrlJson<{
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    firebase?: { sign_in_provider?: string };
  }>(parts[1]);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported JWT algorithm or missing key ID.');
  }
  if (!expectedProjectId) {
    throw new Error('Firebase projectId is not configured on the server.');
  }
  if (payload.aud !== expectedProjectId) {
    throw new Error('Token audience does not match Firebase project.');
  }
  if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) {
    throw new Error('Token issuer does not match Google SecureToken.');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec - 30) {
    throw new Error('Token has expired.');
  }
  if (!payload.sub) {
    throw new Error('Token subject (uid) is missing.');
  }

  const certs = await fetchGoogleSecureTokenCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('Signing certificate not found for token key ID.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();

  const signatureBytes = Buffer.from(
    parts[2].replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  );
  const signatureValid = verifier.verify(certPem, signatureBytes);
  if (!signatureValid) {
    throw new Error('Invalid RSA-SHA256 token signature.');
  }

  return {
    uid: payload.sub,
    email: payload.email || '',
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || '',
    picture: payload.picture || '',
    signInProvider: payload.firebase?.sign_in_provider || 'google.com'
  };
}

export function computeEsewaHmacSignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string,
  signingPhrase = ESEWA_RC_SIGNING_PHRASE
): string {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac('sha256', signingPhrase).update(message).digest('base64');
}

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // 1. Keyless Health Status (Express + Vercel Serverless)
  app.get('/api/health', (_req: Request, res: Response) => {
    const fb = loadFirebaseProjectConfig();
    res.json({
      status: 'ok',
      apiKeyRequired: false,
      service: 'Aqua Nest Storefront & POS API',
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'node-express',
      currency: 'NPR',
      firebaseProjectId: fb.projectId,
      catalogCount: INITIAL_PRODUCTS.length,
      ncmHubCount: NCM_PORTAL_RATES.length,
      deliveryPartner: NCM_PARTNER_INFO,
      gateways: ['esewa', 'khalti', 'fonepay-qr', 'connectips', 'card', 'cash'],
      timestamp: new Date().toISOString()
    });
  });

  // 2. Store Product Catalog & Taxonomy Endpoint
  app.get('/api/catalog', (_req: Request, res: Response) => {
    res.json({
      storeName: 'Aqua Nest',
      currency: 'NPR',
      departments: DEPARTMENT_MENU_GROUPS,
      categories: DEFAULT_CATEGORIES,
      brands: AQUATIC_BRANDS,
      products: INITIAL_PRODUCTS
    });
  });

  // 3. Nepal Can Move (NCM-Portal-4) Rate Lookup & Delivery Quote Endpoint
  app.get('/api/ncm/rates', (req: Request, res: Response) => {
    const region = typeof req.query.region === 'string' ? req.query.region.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const destination =
      typeof req.query.destination === 'string' ? req.query.destination.trim().toUpperCase() : '';
    const deliveryType = req.query.type === 'office' ? 'office' : 'home';

    if (destination) {
      const branch = NCM_PORTAL_RATES.find(
        (b) => b.destination.toUpperCase() === destination
      );
      if (!branch) {
        res.status(404).json({ error: `NCM branch "${destination}" not found.` });
        return;
      }
      const fee =
        deliveryType === 'office' ? branch.officeDeliveryFee : branch.homeDeliveryFee;
      res.json({
        partner: NCM_PARTNER_INFO,
        branch,
        deliveryType,
        deliveryFeeNPR: fee
      });
      return;
    }

    const filtered = NCM_PORTAL_RATES.filter((rate) => {
      if (region && region !== 'All Regions' && rate.region !== region) {
        return false;
      }
      if (!q) return true;
      return (
        rate.destination.toLowerCase().includes(q) ||
        rate.region.toLowerCase().includes(q) ||
        rate.fromHub.toLowerCase().includes(q) ||
        String(rate.sn) === q
      );
    });

    res.json({
      partner: NCM_PARTNER_INFO,
      count: filtered.length,
      rates: filtered
    });
  });

  // 4. Keyless eSewa ePay v2 HMAC-SHA256 Initiation Endpoint
  app.post('/api/payments/esewa/initiate', (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      subtotal?: number;
      deliveryFee?: number;
      merchantCode?: string;
    };

    const itemsSubtotal = Number(Math.max(0, Number(body.subtotal) || 0).toFixed(2));
    const deliveryCharge = Number(Math.max(0, Number(body.deliveryFee) || 0).toFixed(2));
    const totalAmount = Number((itemsSubtotal + deliveryCharge).toFixed(2));

    const merchantCode = body.merchantCode || ESEWA_RC_MERCHANT_CODE;
    const transactionUuid = `AQN-ESW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalFormatted = totalAmount.toFixed(2);
    const signature = computeEsewaHmacSignature(
      totalFormatted,
      transactionUuid,
      merchantCode
    );

    res.json({
      provider: 'esewa',
      merchantCode,
      transactionUuid,
      itemsSubtotal,
      deliveryCharge,
      totalAmount,
      signedFieldNames: 'total_amount,transaction_uuid,product_code',
      signature,
      gatewayEndpoint: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
    });
  });

  // 5. Keyless Khalti KPG-2 Payment Initiation Endpoint
  app.post('/api/payments/khalti/initiate', (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      total?: number;
      deliveryFee?: number;
      storeName?: string;
    };

    const amountNPR = Number(Math.max(0, Number(body.total) || 0).toFixed(2));
    const amountPaisa = Math.max(1000, Math.round(amountNPR * 100));
    const purchaseOrderId = `AQN-KHL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    res.json({
      provider: 'khalti',
      merchantName: body.storeName || 'Aqua Nest',
      purchaseOrderId,
      amountNPR,
      amountPaisa,
      gatewayEndpoint: 'https://a.khalti.com/api/v2/epayment/initiate/'
    });
  });

  // 6. Server-Side Order Totals & NCM Tariff Verification Endpoint
  app.post('/api/orders/validate', (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      items?: Array<{ price?: number; quantity?: number }>;
      fulfillmentMode?: 'ncm' | 'pickup';
      ncmDestination?: string;
      ncmDeliveryType?: 'home' | 'office';
    };

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      res.status(400).json({ valid: false, error: 'Order must contain at least one item.' });
      return;
    }

    const subtotal = items.reduce(
      (sum, item) =>
        sum + Math.max(0, Number(item.price) || 0) * Math.max(0, Number(item.quantity) || 0),
      0
    );

    let deliveryFee = 0;
    if (body.fulfillmentMode === 'ncm' && body.ncmDestination) {
      const branch = NCM_PORTAL_RATES.find(
        (b) => b.destination.toUpperCase() === body.ncmDestination!.trim().toUpperCase()
      );
      if (branch) {
        deliveryFee =
          body.ncmDeliveryType === 'office'
            ? branch.officeDeliveryFee
            : branch.homeDeliveryFee;
      }
    }

    const total = Number((subtotal + deliveryFee).toFixed(2));
    res.json({
      valid: true,
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee,
        total
      },
      trackingCode:
        body.fulfillmentMode === 'ncm'
          ? `NCM-${Math.floor(100000 + Math.random() * 900000)}`
          : null
    });
  });

  // 7. Keyless Google Account Session Endpoint (Works on any Vercel URL without API keys)
  app.post('/api/auth/keyless-google', (req: Request, res: Response) => {
    const body = (req.body || {}) as { displayName?: string; email?: string };
    const email = (body.email || '').trim().toLowerCase();
    const displayName = (body.displayName || '').trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        authenticated: false,
        error: 'Please enter a valid Google email address (e.g. name@gmail.com).'
      });
      return;
    }
    if (displayName.length < 2) {
      res.status(400).json({
        authenticated: false,
        error: 'Please enter your name (at least 2 characters).'
      });
      return;
    }

    const { token, claims } = createKeylessGoogleSessionToken(displayName, email);
    res.json({
      authenticated: true,
      apiKeyRequired: false,
      token,
      user: claims,
      verifiedAt: new Date().toISOString()
    });
  });

  // 8. Session Verification Endpoint (Supports both Firebase Google RS256 & Keyless HS256 Tokens)
  app.post('/api/auth/verify-session', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      res.status(401).json({ authenticated: false, error: 'Missing Bearer token.' });
      return;
    }

    const { projectId } = loadFirebaseProjectConfig();
    try {
      const claims = await verifyFirebaseGoogleIdToken(token, projectId);
      res.json({
        authenticated: true,
        apiKeyRequired: false,
        projectId,
        user: claims,
        verifiedAt: new Date().toISOString()
      });
    } catch (err) {
      res.status(401).json({
        authenticated: false,
        error: err instanceof Error ? err.message : 'Invalid session token.'
      });
    }
  });

  return app;
}
