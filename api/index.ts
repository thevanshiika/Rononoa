import type { Request, Response } from 'express';
import { createApp } from '../server/src/app.ts';
import { connectDB } from '../server/src/config/db.ts';

const app = createApp();

export default async function handler(req: Request, res: Response) {
  try {
    // Re-use cached Mongoose connection across warm serverless lambdas
    await connectDB(false);
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Handler Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Serverless backend error connecting to database',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
}
