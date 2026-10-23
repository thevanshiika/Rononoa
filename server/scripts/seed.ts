import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../src/config/db.ts';
import { seedDatabase } from '../src/scripts/autoSeed.ts';

async function runSeed() {
  console.log('--- Starting Standalone Database Seed ---');
  try {
    await connectDB(false); // Connect without auto-seed
    await seedDatabase();
    console.log('--- Database Seed Finished Successfully ---');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seed process failed with error:', error);
    process.exit(1);
  }
}

runSeed();
