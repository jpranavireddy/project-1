#!/usr/bin/env node

/**
 * Database setup script
 * Run this script to initialize the database with proper schema and indexes
 */

import { dbConnection } from '../src/db/connection';
import { runMigrations } from '../src/db/migrations';

async function setup() {
  try {
    console.log('Starting database setup...');

    // Get MongoDB URI from environment or use default
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dev-tracker';

    console.log(`Connecting to database: ${uri}`);
    await dbConnection.connect({ uri });

    console.log('Running migrations...');
    const result = await runMigrations();

    if (result.success) {
      console.log('✓ Database setup completed successfully');
    } else {
      console.error('✗ Database setup failed:', result.errors);
      process.exit(1);
    }

    await dbConnection.disconnect();
    console.log('Disconnected from database');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup();
