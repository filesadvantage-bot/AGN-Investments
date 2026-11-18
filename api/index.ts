import { createApiApp } from '../server/apiApp.ts';

/**
 * Vercel Serverless Function Entry Point (/api/*)
 * Handles all /api/* routes when published to Vercel.
 */
const app = createApiApp();

export default app;
