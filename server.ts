import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './server/src/app.ts';
import { connectDB } from './server/src/config/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Connect database (with automatic in-memory fallback and seed if needed)
  try {
    await connectDB(true);
  } catch (dbError) {
    console.error('Failed to connect to database:', dbError);
    process.exit(1);
  }

  // 2. Initialize Express app with /api routes
  const app = createApp();

  // 3. Mount Vite middlewares in development or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Production static assets serving enabled.');
  }

  const server = http.createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Collaborative Project Management Platform Ready!`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
