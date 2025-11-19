# Shared Types Package

This package contains shared TypeScript types, MongoDB schemas, validation functions, and database utilities for the Developer Performance Tracker application.

## Contents

### Types
- `Developer`: Developer profile and metadata
- `Repository`: GitHub repository information
- `Activity`: Developer activities (commits, PRs, issues, reviews)
- `ProductivityScore`: Individual developer productivity metrics
- `TeamHealthScore`: Team-level health and collaboration metrics
- `Anomaly`: Detected anomalies in developer behavior
- `Achievement`: Developer achievements and milestones

### Database

#### Schemas
MongoDB schemas with proper indexing for all data models. Includes:
- Field validation
- Type enforcement
- Automatic timestamps
- Optimized indexes for common queries

#### Validation
Validation functions for all data models that check:
- Required fields
- Data types
- Value ranges
- Format constraints
- Business rules

#### Connection
Database connection management with:
- Connection pooling (min: 2, max: 10)
- Automatic reconnection
- Health checks
- Error handling
- Singleton pattern

#### Migrations
Database migration utilities:
- `createIndexes()`: Create all database indexes
- `initializeDatabase()`: Initialize database with schema
- `verifySchema()`: Verify database schema integrity
- `runMigrations()`: Execute all pending migrations
- `dropAllCollections()`: Drop all collections (use with caution)

## Usage

### Installing Dependencies

```bash
npm install
```

### Connecting to Database

```typescript
import { dbConnection } from '@dev-tracker/shared-types';

await dbConnection.connect({
  uri: 'mongodb://localhost:27017/dev-tracker',
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
  }
});
```

### Using Models

```typescript
import { DeveloperModel, ActivityModel } from '@dev-tracker/shared-types';

// Create a developer
const developer = new DeveloperModel({
  githubUsername: 'johndoe',
  email: 'john@example.com',
  name: 'John Doe',
  role: 'developer',
  teamId: 'team-1',
  joinDate: new Date(),
  profileData: {
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Software developer',
    location: 'San Francisco',
  },
});

await developer.save();

// Query activities
const activities = await ActivityModel.find({
  developerId: developer._id,
  timestamp: { $gte: new Date('2024-01-01') },
}).sort({ timestamp: -1 });
```

### Validating Data

```typescript
import { validateDeveloper, validateActivity } from '@dev-tracker/shared-types';

const result = validateDeveloper(developerData);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Running Migrations

```typescript
import { runMigrations } from '@dev-tracker/shared-types';

const result = await runMigrations();
if (result.success) {
  console.log('Migrations completed successfully');
} else {
  console.error('Migration failed:', result.errors);
}
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Test Structure

- `validation.test.ts`: Unit tests for validation functions
- `crud-operations.test.ts`: Unit tests for database CRUD operations
- `connection.test.ts`: Unit tests for database connection
- `activity-roundtrip.test.ts`: Property-based tests for activity storage

## Indexes

The following indexes are created for optimal query performance:

### Developer
- `githubUsername` (unique)
- `email` (unique)
- `teamId`

### Repository
- `url` (unique)
- `name + owner` (compound)

### Activity
- `type`
- `developerId`
- `repositoryId`
- `timestamp`
- `developerId + timestamp` (compound, descending)
- `repositoryId + timestamp` (compound, descending)
- `developerId + type + timestamp` (compound)

### ProductivityScore
- `developerId`
- `developerId + timeRange.start` (compound, descending)

### TeamHealthScore
- `teamId`
- `teamId + timeRange.start` (compound, descending)

### Anomaly
- `developerId`
- `developerId + detectedAt` (compound, descending)

### Achievement
- `developerId`
- `developerId + earnedAt` (compound, descending)

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/dev-tracker`)
- `MONGODB_MAX_POOL_SIZE`: Maximum connection pool size (default: 10)
- `MONGODB_MIN_POOL_SIZE`: Minimum connection pool size (default: 2)

## License

MIT
