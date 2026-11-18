# Aqua Nest — Planted Tank Storefront & POS (Zero-API-Key Full-Stack App)

Full-stack planted aquarium storefront, POS order builder, customizable product catalog, **Google Account Sign-In**, **Nepal Can Move (NCM)** nationwide courier calculator, and **eSewa / Khalti** Nepali Rupee (`Rs.` / NPR) payment checkout — built to run **without any external API keys**.

## Architecture

- **`src/`** — React 19 + TypeScript + Tailwind CSS v4 frontend (`Vite` build output in `dist/`)
- **`server/apiApp.ts`** — Keyless Express backend API (`/api/health`, `/api/catalog`, `/api/ncm/rates`, `/api/payments/esewa/initiate`, `/api/payments/khalti/initiate`, `/api/orders/validate`, `/api/auth/keyless-google`, `/api/auth/verify-session`)
- **`api/index.ts`** — Vercel Serverless Function entry point exporting the Express API app
- **`server.ts`** — Unified full-stack Node/Express server on port `3000` (`npm run dev` / `npm start`)
- **`vercel.json`** — Production Vercel routing (`/api/*` -> `api/index.ts`, SPA routes -> `dist/index.html`)

## One-Click Vercel Deployment (No API Keys Required)

1. Import this repository into **Vercel** (or run `npx vercel --prod`).
2. Leave **Environment Variables** empty — **no API keys or secret keys are required**.
3. Click **Deploy**.
   - Frontend (`dist/`) and Serverless Backend (`/api/*`) deploy together automatically.
   - **Google Sign-In** works both via Google OAuth popup (when your domain is listed in Firebase Console → Authentication → Authorized domains) **and** via built-in **Keyless Google Session Sign-In** directly on any Vercel preview or custom URL with zero setup.

## Local Full-Stack Development

```bash
npm install
npm run dev      # Starts Express + Vite full-stack server on http://localhost:3000
npm run build    # Builds production frontend bundle into dist/
npm start        # Runs production Node server (node server.ts)
```
