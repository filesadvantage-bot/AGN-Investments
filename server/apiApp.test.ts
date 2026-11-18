import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import vercelHandler from '../api/index.ts';
import { computeEsewaHmacSignature, createApiApp } from './apiApp.ts';

test('Vercel serverless entry point (api/index.ts) exports a valid Express handler', () => {
  assert.equal(typeof vercelHandler, 'function');
});

test('computeEsewaHmacSignature produces deterministic base64 HMAC-SHA256 signatures without external API keys', () => {
  const sig1 = computeEsewaHmacSignature('5198.50', 'AQN-ESW-1001', 'EPAYTEST');
  const sig2 = computeEsewaHmacSignature('5198.50', 'AQN-ESW-1001', 'EPAYTEST');
  assert.ok(sig1.length > 20);
  assert.equal(sig1, sig2);
});

test('Backend Express / Vercel API endpoints serve keyless health, catalog, NCM rates, payment initiation, order validation, and keyless Google auth', async () => {
  const app = createApiApp();
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. /api/health confirms apiKeyRequired === false
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = (await healthRes.json()) as {
      status: string;
      apiKeyRequired: boolean;
      currency: string;
      firebaseProjectId: string;
      ncmHubCount: number;
    };
    assert.equal(health.status, 'ok');
    assert.equal(health.apiKeyRequired, false);
    assert.equal(health.currency, 'NPR');
    assert.equal(health.ncmHubCount, 144);

    // 2. /api/catalog
    const catRes = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(catRes.status, 200);
    const catalog = (await catRes.json()) as { products: unknown[] };
    assert.equal(catalog.products.length, 19);

    // 3. /api/ncm/rates
    const ncmRes = await fetch(`${baseUrl}/api/ncm/rates?destination=TINKUNE&type=home`);
    assert.equal(ncmRes.status, 200);
    const ncm = (await ncmRes.json()) as { deliveryFeeNPR: number };
    assert.equal(ncm.deliveryFeeNPR, 170);

    // 4. /api/payments/esewa/initiate
    const esewaRes = await fetch(`${baseUrl}/api/payments/esewa/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtotal: 4450, deliveryFee: 170 })
    });
    assert.equal(esewaRes.status, 200);
    const esewa = (await esewaRes.json()) as {
      totalAmount: number;
      signature: string;
      transactionUuid: string;
    };
    assert.equal(esewa.totalAmount, 4620);
    assert.ok(esewa.signature.length > 20);
    assert.ok(esewa.transactionUuid.startsWith('AQN-ESW-'));

    // 5. /api/payments/khalti/initiate
    const khaltiRes = await fetch(`${baseUrl}/api/payments/khalti/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: 4620, storeName: 'Aqua Nest' })
    });
    assert.equal(khaltiRes.status, 200);
    const khalti = (await khaltiRes.json()) as { amountPaisa: number; purchaseOrderId: string };
    assert.equal(khalti.amountPaisa, 462000);
    assert.ok(khalti.purchaseOrderId.startsWith('AQN-KHL-'));

    // 6. /api/orders/validate
    const orderRes = await fetch(`${baseUrl}/api/orders/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { price: 1650, quantity: 1 },
          { price: 1400, quantity: 2 }
        ],
        fulfillmentMode: 'ncm',
        ncmDestination: 'TINKUNE',
        ncmDeliveryType: 'home'
      })
    });
    assert.equal(orderRes.status, 200);
    const validated = (await orderRes.json()) as {
      valid: boolean;
      totals: { total: number; deliveryFee: number };
      trackingCode: string;
    };
    assert.equal(validated.valid, true);
    assert.equal(validated.totals.deliveryFee, 170);
    assert.equal(validated.totals.total, 4620);
    assert.ok(validated.trackingCode.startsWith('NCM-'));

    // 7. /api/auth/keyless-google validates input and issues a verifiable session token without API keys
    const invalidAuthRes = await fetch(`${baseUrl}/api/auth/keyless-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: '', email: 'not-an-email' })
    });
    assert.equal(invalidAuthRes.status, 400);

    const keylessRes = await fetch(`${baseUrl}/api/auth/keyless-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Aarav Sharma', email: 'aarav@gmail.com' })
    });
    assert.equal(keylessRes.status, 200);
    const keylessSession = (await keylessRes.json()) as {
      authenticated: boolean;
      apiKeyRequired: boolean;
      token: string;
      user: { uid: string; email: string; name: string };
    };
    assert.equal(keylessSession.authenticated, true);
    assert.equal(keylessSession.apiKeyRequired, false);
    assert.equal(keylessSession.user.email, 'aarav@gmail.com');

    // 8. /api/auth/verify-session accepts keyless token & rejects missing token
    const verifyOkRes = await fetch(`${baseUrl}/api/auth/verify-session`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${keylessSession.token}` }
    });
    assert.equal(verifyOkRes.status, 200);

    const authMissingRes = await fetch(`${baseUrl}/api/auth/verify-session`, { method: 'POST' });
    assert.equal(authMissingRes.status, 401);
  } finally {
    server.close();
  }
});
