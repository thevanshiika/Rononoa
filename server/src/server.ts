import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { createApp } from './app.ts';
import { connectDB } from './config/db.ts';

const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || '5000', 10);

async function startServer() {
  try {
    await connectDB(true);
    const app = createApp();
    const server = http.createServer(app);

    server.listen(PORT, '0.0.0.0', () => {
      console.log('=======================================================');
      console.log(' SynergyHub Express Backend API Running');
      console.log(` Port: ${PORT}`);
      console.log(` Local API: http://localhost:${PORT}/api`);
      console.log(` Health: http://localhost:${PORT}/api/health`);
      console.log('=======================================================');
    });
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error);
    process.exit(1);
  }
}

startServer();
