import { MongoMemoryServer } from 'mongodb-memory-server';
import { DatabaseConnection } from '../connection';

describe('Database Connection', () => {
  let mongoServer: MongoMemoryServer;
  let dbConnection: DatabaseConnection;

  beforeEach(() => {
    dbConnection = DatabaseConnection.getInstance();
  });

  afterEach(async () => {
    try {
      await dbConnection.disconnect();
    } catch (error) {
      // Ignore errors during cleanup
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('should connect to database successfully', async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await dbConnection.connect({ uri });

    expect(dbConnection.getConnectionState()).toBe(true);
  });

  it('should disconnect from database successfully', async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await dbConnection.connect({ uri });
    expect(dbConnection.getConnectionState()).toBe(true);

    await dbConnection.disconnect();
    expect(dbConnection.getConnectionState()).toBe(false);
  });

  it('should handle connection errors gracefully', async () => {
    const invalidUri = 'mongodb://invalid:27017/test';

    await expect(
      dbConnection.connect({
        uri: invalidUri,
        options: { serverSelectionTimeoutMS: 1000 },
      })
    ).rejects.toThrow('Database connection failed');
  });

  it('should not connect twice', async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await dbConnection.connect({ uri });
    const firstState = dbConnection.getConnectionState();

    // Try to connect again
    await dbConnection.connect({ uri });
    const secondState = dbConnection.getConnectionState();

    expect(firstState).toBe(true);
    expect(secondState).toBe(true);
  });

  it('should perform health check successfully when connected', async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await dbConnection.connect({ uri });

    const health = await dbConnection.healthCheck();
    expect(health.healthy).toBe(true);
    expect(health.message).toBe('Database connection healthy');
  });

  it('should fail health check when not connected', async () => {
    const health = await dbConnection.healthCheck();
    expect(health.healthy).toBe(false);
    expect(health.message).toBe('Database not connected');
  });

  it('should return singleton instance', () => {
    const instance1 = DatabaseConnection.getInstance();
    const instance2 = DatabaseConnection.getInstance();

    expect(instance1).toBe(instance2);
  });
});
