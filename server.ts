import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApiApp } from './server/apiApp.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Mount shared backend API (/api/*) BEFORE Vite or static assets
  app.use(createApiApp());

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aqua Nest full-stack server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
