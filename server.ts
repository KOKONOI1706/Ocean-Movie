import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app.js';
import { env } from './server/config/env.js';

async function startServer() {
  const app = createApp();
  const PORT = env.PORT || 3000;

  if (env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌊 BIỂN PHIM Modular Monolith server running at http://localhost:${PORT}`);
    console.log(`🚀 REST API available at http://localhost:${PORT}/api/v1`);
    console.log(`🩺 Health check at http://localhost:${PORT}/api/health`);
  });
}

startServer();
