import mongoose from 'mongoose';
import {
  DeveloperModel,
  RepositoryModel,
  ActivityModel,
  ProductivityScoreModel,
  TeamHealthScoreModel,
  AnomalyModel,
  AchievementModel,
} from './schemas';

export interface MigrationResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Create all indexes for optimal query performance
 */
export async function createIndexes(): Promise<MigrationResult> {
  const errors: string[] = [];

  try {
    console.log('Creating database indexes...');

    await Promise.all([
      DeveloperModel.createIndexes().catch((err) => {
        errors.push(`Developer indexes: ${err.message}`);
      }),
      RepositoryModel.createIndexes().catch((err) => {
        errors.push(`Repository indexes: ${err.message}`);
      }),
      ActivityModel.createIndexes().catch((err) => {
        errors.push(`Activity indexes: ${err.message}`);
      }),
      ProductivityScoreModel.createIndexes().catch((err) => {
        errors.push(`ProductivityScore indexes: ${err.message}`);
      }),
      TeamHealthScoreModel.createIndexes().catch((err) => {
        errors.push(`TeamHealthScore indexes: ${err.message}`);
      }),
      AnomalyModel.createIndexes().catch((err) => {
        errors.push(`Anomaly indexes: ${err.message}`);
      }),
      AchievementModel.createIndexes().catch((err) => {
        errors.push(`Achievement indexes: ${err.message}`);
      }),
    ]);

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Some indexes failed to create',
        errors,
      };
    }

    console.log('All indexes created successfully');
    return {
      success: true,
      message: 'All indexes created successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create indexes',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Drop all collections (use with caution!)
 */
export async function dropAllCollections(): Promise<MigrationResult> {
  try {
    console.log('Dropping all collections...');

    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      await Promise.all(collections.map((collection) => collection.drop()));
    }

    console.log('All collections dropped successfully');
    return {
      success: true,
      message: 'All collections dropped successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to drop collections',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Initialize database with schema and indexes
 */
export async function initializeDatabase(): Promise<MigrationResult> {
  try {
    console.log('Initializing database...');

    // Create indexes
    const indexResult = await createIndexes();
    if (!indexResult.success) {
      return indexResult;
    }

    console.log('Database initialized successfully');
    return {
      success: true,
      message: 'Database initialized successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to initialize database',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Verify database schema integrity
 */
export async function verifySchema(): Promise<MigrationResult> {
  const errors: string[] = [];

  try {
    console.log('Verifying database schema...');

    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map((c) => c.name);

      const expectedCollections = [
        'developers',
        'repositories',
        'activities',
        'productivityscores',
        'teamhealthscores',
        'anomalies',
        'achievements',
      ];

      for (const expected of expectedCollections) {
        if (!collectionNames.includes(expected)) {
          errors.push(`Missing collection: ${expected}`);
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Schema verification failed',
        errors,
      };
    }

    console.log('Schema verification successful');
    return {
      success: true,
      message: 'Schema verification successful',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to verify schema',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Migration runner - executes all pending migrations
 */
export async function runMigrations(): Promise<MigrationResult> {
  try {
    console.log('Running database migrations...');

    // Initialize database (create indexes)
    const initResult = await initializeDatabase();
    if (!initResult.success) {
      return initResult;
    }

    // Verify schema
    const verifyResult = await verifySchema();
    if (!verifyResult.success) {
      return verifyResult;
    }

    console.log('All migrations completed successfully');
    return {
      success: true,
      message: 'All migrations completed successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Migration failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
