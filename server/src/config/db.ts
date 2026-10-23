import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance: MongoMemoryServer | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(seedIfEmpty = true): Promise<typeof mongoose> {
  // If already connected, reuse existing connection (vital for Vercel serverless)
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/synergyhub';

  connectionPromise = (async () => {
    try {
      console.log(`[Database] Connecting to MongoDB: ${isProduction ? uri.replace(/:([^:@]+)@/, ':****@') : uri}`);
      
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: isProduction ? 8000 : 2500,
      });

      console.log('[Database] MongoDB connected successfully.');

      if (seedIfEmpty) {
        const { autoSeedIfEmpty } = await import('../scripts/autoSeed.ts');
        await autoSeedIfEmpty();
      }

      return conn;
    } catch (err: any) {
      if (isProduction) {
        console.error('[Database] Production MongoDB Connection Error:', err.message);
        console.error('[Database] Please verify your MONGODB_URI connection string and Atlas IP access list (0.0.0.0/0).');
        connectionPromise = null;
        throw err;
      }

      console.warn(`[Database] Notice: Local MongoDB service is not running at ${uri} (${err.message}).`);
      console.log('[Database] Fallback: Initializing embedded in-memory MongoDB engine for local zero-config execution...');

      try {
        if (!mongodInstance) {
          mongodInstance = await MongoMemoryServer.create();
        }
        const memUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] Embedded in-memory MongoDB active at: ${memUri}`);

        if (seedIfEmpty) {
          const { autoSeedIfEmpty } = await import('../scripts/autoSeed.ts');
          await autoSeedIfEmpty();
        }

        return conn;
      } catch (memErr: any) {
        console.error('[Database] Fatal: Failed to initialize in-memory MongoDB:', memErr);
        connectionPromise = null;
        throw memErr;
      }
    }
  })();

  return connectionPromise;
}

export async function disconnectDB() {
  connectionPromise = null;
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
}
