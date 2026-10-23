import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import userRoutes from './routes/userRoutes.ts';
import projectRoutes from './routes/projectRoutes.ts';
import taskRoutes from './routes/taskRoutes.ts';
import commentRoutes from './routes/commentRoutes.ts';
import demoRoutes from './routes/demoRoutes.ts';

export function createApp() {
  const app = express();

  // Basic CORS configuration
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/demo', demoRoutes);

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'Collaborative Project Management API',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 for unhandled API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.baseUrl || req.originalUrl}`,
    });
  });

  // Centralized Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Error]:', err);

    if (err.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Database Validation Error',
        errors: err.errors,
      });
      return;
    }

    if (err.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: `Invalid ID format: ${err.value}`,
      });
      return;
    }

    if (err.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Duplicate key error: A record with this unique value already exists.',
      });
      return;
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  return app;
}
