import mongoose from 'mongoose';

export interface DatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(config: DatabaseConfig): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    try {
      const defaultOptions: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        family: 4,
      };

      const options = { ...defaultOptions, ...config.options };

      await mongoose.connect(config.uri, options);
      this.isConnected = true;

      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.isConnected = true;
      });

      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      this.isConnected = false;
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect from database:', error);
      throw new Error(`Database disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getConnectionState(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.isConnected) {
        return { healthy: false, message: 'Database not connected' };
      }

      // Ping the database
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      return { healthy: true, message: 'Database connection healthy' };
    } catch (error) {
      return {
        healthy: false,
        message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export const dbConnection = DatabaseConnection.getInstance();

/**
 * Helper function to connect to database for testing
 */
export async function connectDB(uri?: string): Promise<void> {
  const testUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/dev-tracker-test';
  await dbConnection.connect({ uri: testUri });
}

/**
 * Helper function to disconnect from database for testing
 */
export async function disconnectDB(): Promise<void> {
  await dbConnection.disconnect();
}
