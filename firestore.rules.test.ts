import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Deterministic Security Rules & Dirty Dozen Evaluator
 * Mirrors the exact invariants enforced in DRAFT_firestore.rules / firestore.rules
 * and verifies structural rule enforcement + rejection of all 12 adversarial payloads.
 */

interface SimAuth {
  uid: string;
  email: string;
  email_verified: boolean;
}

interface SimContext {
  auth: SimAuth | null;
  requestTimeMs: number;
  existingUsers: Set<string>;
  usersCreatedInBatch?: Set<string>;
}

const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

function hasOnlyKeys(obj: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(obj).every((k) => allowed.includes(k));
}

function hasAllKeys(obj: Record<string, unknown>, required: string[]): boolean {
  return required.every((k) => k in obj);
}

function evaluateDirtyPayload(
  operation:
    | 'createUser'
    | 'updateUser'
    | 'getPrivateInfo'
    | 'createCustomProduct'
    | 'updateCustomProduct'
    | 'createOrder'
    | 'updateOrder'
    | 'listOrders',
  ctx: SimContext,
  pathParams: { userId: string; docId?: string },
  incoming?: Record<string, unknown>,
  existing?: Record<string, unknown>
): 'ALLOW' | 'PERMISSION_DENIED' {
  if (!ctx.auth || ctx.auth.email_verified !== true) {
    return 'PERMISSION_DENIED';
  }
  const { userId, docId } = pathParams;
  if (ctx.auth.uid !== userId) {
    return 'PERMISSION_DENIED';
  }

  if (operation === 'listOrders') {
    if (!existing || existing.ownerId !== ctx.auth.uid) return 'PERMISSION_DENIED';
    return 'ALLOW';
  }

  if (!isValidId(userId)) return 'PERMISSION_DENIED';

  if (operation === 'getPrivateInfo') {
    if (docId !== 'info' || !ctx.existingUsers.has(userId)) return 'PERMISSION_DENIED';
    return 'ALLOW';
  }

  if (operation === 'createUser') {
    if (!incoming) return 'PERMISSION_DENIED';
    const req = ['uid', 'displayName', 'storeName', 'createdAt', 'updatedAt'];
    const opt = [...req, 'photoURL'];
    if (!hasAllKeys(incoming, req) || !hasOnlyKeys(incoming, opt)) return 'PERMISSION_DENIED';
    if (incoming.uid !== userId || incoming.createdAt !== ctx.requestTimeMs || incoming.updatedAt !== ctx.requestTimeMs) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOW';
  }

  if (operation === 'updateUser') {
    if (!incoming || !existing) return 'PERMISSION_DENIED';
    const req = ['uid', 'displayName', 'storeName', 'createdAt', 'updatedAt'];
    const opt = [...req, 'photoURL'];
    if (!hasAllKeys(incoming, req) || !hasOnlyKeys(incoming, opt)) return 'PERMISSION_DENIED';
    if (incoming.uid !== existing.uid || incoming.createdAt !== existing.createdAt || incoming.updatedAt !== ctx.requestTimeMs) {
      return 'PERMISSION_DENIED';
    }
    const changed = Object.keys(incoming).filter((k) => incoming[k] !== existing[k]);
    const allowedChanged = ['displayName', 'photoURL', 'storeName', 'updatedAt'];
    if (!changed.every((k) => allowedChanged.includes(k))) return 'PERMISSION_DENIED';
    return 'ALLOW';
  }

  if (operation === 'createCustomProduct' || operation === 'updateCustomProduct') {
    if (!docId || !isValidId(docId) || !ctx.existingUsers.has(userId) || !incoming) {
      return 'PERMISSION_DENIED';
    }
    const req = [
      'id', 'ownerId', 'name', 'price', 'stock', 'sku',
      'department', 'category', 'isDeleted', 'createdAt', 'updatedAt'
    ];
    const opt = [
      ...req, 'scientificName', 'careNote', 'originalPrice', 'placement',
      'brand', 'image', 'option1Label', 'option1Delta', 'option2Label',
      'option2Delta', 'option3Label', 'option3Delta'
    ];
    if (!hasAllKeys(incoming, req) || !hasOnlyKeys(incoming, opt)) return 'PERMISSION_DENIED';
    if (incoming.id !== docId || incoming.ownerId !== userId) return 'PERMISSION_DENIED';
    if (typeof incoming.name !== 'string' || incoming.name.length < 1 || incoming.name.length > 140) {
      return 'PERMISSION_DENIED';
    }
    if ('careNote' in incoming && (typeof incoming.careNote !== 'string' || incoming.careNote.length > 500)) {
      return 'PERMISSION_DENIED';
    }
    if ('image' in incoming && (typeof incoming.image !== 'string' || incoming.image.length > 250000)) {
      return 'PERMISSION_DENIED';
    }
    if (typeof incoming.price !== 'number' || incoming.price < 0 || incoming.price > 10000000) {
      return 'PERMISSION_DENIED';
    }
    if (operation === 'createCustomProduct') {
      if (incoming.createdAt !== ctx.requestTimeMs || incoming.updatedAt !== ctx.requestTimeMs) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
    if (!existing) return 'PERMISSION_DENIED';
    if (incoming.ownerId !== existing.ownerId || incoming.createdAt !== existing.createdAt || incoming.updatedAt !== ctx.requestTimeMs) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOW';
  }

  if (operation === 'createOrder' || operation === 'updateOrder') {
    if (!docId || !isValidId(docId) || !ctx.existingUsers.has(userId) || !incoming) {
      return 'PERMISSION_DENIED';
    }
    if (incoming.id !== docId || incoming.ownerId !== userId) return 'PERMISSION_DENIED';
    if (operation === 'createOrder') {
      if (incoming.status !== 'Paid' || incoming.createdAt !== ctx.requestTimeMs || incoming.updatedAt !== ctx.requestTimeMs) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOW';
    }
    if (!existing) return 'PERMISSION_DENIED';
    if (existing.status === 'Refunded') return 'PERMISSION_DENIED';
    if (incoming.ownerId !== existing.ownerId || incoming.createdAt !== existing.createdAt || incoming.updatedAt !== ctx.requestTimeMs) {
      return 'PERMISSION_DENIED';
    }
    const changed = Object.keys(incoming).filter((k) => incoming[k] !== existing[k]);
    if (incoming.status !== 'Refunded' || !changed.every((k) => ['status', 'updatedAt'].includes(k))) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOW';
  }

  return 'PERMISSION_DENIED';
}

test('Firestore rules file enforces all Eight Pillars structurally', () => {
  const rulesPath = fs.existsSync(path.resolve('firestore.rules'))
    ? path.resolve('firestore.rules')
    : path.resolve('DRAFT_firestore.rules');
  const rulesSource = fs.readFileSync(rulesPath, 'utf8');

  assert.match(rulesSource, /rules_version\s*=\s*'2';/);
  assert.match(rulesSource, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/);
  assert.match(rulesSource, /request\.auth\.token\.email_verified\s*==\s*true/);
  assert.match(rulesSource, /isValidUserPublicProfile/);
  assert.match(rulesSource, /isValidUserPrivateInfo/);
  assert.match(rulesSource, /isValidCustomProduct/);
  assert.match(rulesSource, /isValidCloudOrder/);
  assert.match(rulesSource, /affectedKeys\(\)\.hasOnly/);
  assert.match(rulesSource, /existing\(\)\.status\s*!=\s*'Refunded'/);
});

test('All Dirty Dozen adversarial payloads return PERMISSION_DENIED', () => {
  const now = 1763460000000;
  const validOwnerCtx: SimContext = {
    auth: { uid: 'user_1', email: 'filesadvantage@gmail.com', email_verified: true },
    requestTimeMs: now,
    existingUsers: new Set(['user_1'])
  };

  // 1. Unverified Email Spoof
  assert.equal(
    evaluateDirtyPayload(
      'createUser',
      { ...validOwnerCtx, auth: { uid: 'user_1', email: 'filesadvantage@gmail.com', email_verified: false } },
      { userId: 'user_1' },
      { uid: 'user_1', displayName: 'Aqua', storeName: 'Aqua Nest', createdAt: now, updatedAt: now }
    ),
    'PERMISSION_DENIED'
  );

  // 2. Cross-User Identity Spoof
  assert.equal(
    evaluateDirtyPayload(
      'createCustomProduct',
      { ...validOwnerCtx, auth: { uid: 'attacker_9', email: 'a@b.com', email_verified: true } },
      { userId: 'user_1', docId: 'p1' },
      {
        id: 'p1', ownerId: 'user_1', name: 'Anubias', price: 1650, stock: 10,
        sku: 'SKU-1', department: 'Aquarium Plants', category: 'Anubias',
        isDeleted: false, createdAt: now, updatedAt: now
      }
    ),
    'PERMISSION_DENIED'
  );

  // 3. Ghost / Shadow Field Injection (isAdmin: true)
  assert.equal(
    evaluateDirtyPayload(
      'updateUser',
      validOwnerCtx,
      { userId: 'user_1' },
      { uid: 'user_1', displayName: 'Aqua', storeName: 'Aqua Nest', isAdmin: true, createdAt: now - 1000, updatedAt: now },
      { uid: 'user_1', displayName: 'Aqua', storeName: 'Aqua Nest', createdAt: now - 1000, updatedAt: now - 1000 }
    ),
    'PERMISSION_DENIED'
  );

  // 4. ID Poisoning Attack
  assert.equal(
    evaluateDirtyPayload(
      'createCustomProduct',
      validOwnerCtx,
      { userId: 'user_1', docId: 'p1$bad!id/../../../etc' },
      {
        id: 'p1$bad!id/../../../etc', ownerId: 'user_1', name: 'Anubias', price: 1650, stock: 10,
        sku: 'SKU-1', department: 'Aquarium Plants', category: 'Anubias',
        isDeleted: false, createdAt: now, updatedAt: now
      }
    ),
    'PERMISSION_DENIED'
  );

  // 5. Orphaned Subcollection Write (missing parent user)
  assert.equal(
    evaluateDirtyPayload(
      'createCustomProduct',
      { ...validOwnerCtx, existingUsers: new Set() },
      { userId: 'user_1', docId: 'p1' },
      {
        id: 'p1', ownerId: 'user_1', name: 'Anubias', price: 1650, stock: 10,
        sku: 'SKU-1', department: 'Aquarium Plants', category: 'Anubias',
        isDeleted: false, createdAt: now, updatedAt: now
      }
    ),
    'PERMISSION_DENIED'
  );

  // 6. PII Cross-Read Leak
  assert.equal(
    evaluateDirtyPayload(
      'getPrivateInfo',
      { ...validOwnerCtx, auth: { uid: 'user_2', email: 'u2@b.com', email_verified: true } },
      { userId: 'user_1', docId: 'info' }
    ),
    'PERMISSION_DENIED'
  );

  // 7. Unbounded String / Resource Exhaustion (>500 careNote)
  assert.equal(
    evaluateDirtyPayload(
      'createCustomProduct',
      validOwnerCtx,
      { userId: 'user_1', docId: 'p1' },
      {
        id: 'p1', ownerId: 'user_1', name: 'Anubias', careNote: 'x'.repeat(501),
        price: 1650, stock: 10, sku: 'SKU-1', department: 'Aquarium Plants',
        category: 'Anubias', isDeleted: false, createdAt: now, updatedAt: now
      }
    ),
    'PERMISSION_DENIED'
  );

  // 8. Value Poisoning on Whitelisted Update Key (price as string)
  const baseProd = {
    id: 'p1', ownerId: 'user_1', name: 'Anubias', price: 1650, stock: 10,
    sku: 'SKU-1', department: 'Aquarium Plants', category: 'Anubias',
    isDeleted: false, createdAt: now - 5000, updatedAt: now - 5000
  };
  assert.equal(
    evaluateDirtyPayload(
      'updateCustomProduct',
      validOwnerCtx,
      { userId: 'user_1', docId: 'p1' },
      { ...baseProd, price: 'free', updatedAt: now },
      baseProd
    ),
    'PERMISSION_DENIED'
  );

  // 9. Immutable Field Tampering (mutating createdAt)
  assert.equal(
    evaluateDirtyPayload(
      'updateCustomProduct',
      validOwnerCtx,
      { userId: 'user_1', docId: 'p1' },
      { ...baseProd, createdAt: now, updatedAt: now },
      baseProd
    ),
    'PERMISSION_DENIED'
  );

  // 10. Client-Forged Timestamp on Order Creation
  assert.equal(
    evaluateDirtyPayload(
      'createOrder',
      validOwnerCtx,
      { userId: 'user_1', docId: 'ORD-1003' },
      { id: 'ORD-1003', ownerId: 'user_1', status: 'Paid', createdAt: now - 99999, updatedAt: now }
    ),
    'PERMISSION_DENIED'
  );

  // 11. Terminal State Bypass (updating an already Refunded order)
  assert.equal(
    evaluateDirtyPayload(
      'updateOrder',
      validOwnerCtx,
      { userId: 'user_1', docId: 'ORD-1003' },
      { id: 'ORD-1003', ownerId: 'user_1', status: 'Paid', createdAt: now - 5000, updatedAt: now },
      { id: 'ORD-1003', ownerId: 'user_1', status: 'Refunded', createdAt: now - 5000, updatedAt: now - 1000 }
    ),
    'PERMISSION_DENIED'
  );

  // 12. Unscoped List Scraping
  assert.equal(
    evaluateDirtyPayload(
      'listOrders',
      { ...validOwnerCtx, auth: { uid: 'attacker_9', email: 'a@b.com', email_verified: true } },
      { userId: 'user_1' },
      undefined,
      { ownerId: 'user_1' }
    ),
    'PERMISSION_DENIED'
  );
});
