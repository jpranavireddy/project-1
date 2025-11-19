# GitHub Integration Module

This module provides integration with GitHub API for collecting developer activity data.

## Features

- GitHub API authentication with token support
- Repository metadata retrieval
- Contributor list fetching
- Commit history collection with pagination
- Pull request data collection
- Issue tracking data collection
- Rate limiting handling with request queuing
- Retry logic with exponential backoff for failed requests

## Setup

### Environment Variables

Create a `.env` file in the package root with the following variables:

```env
GITHUB_TEST_TOKEN=your_github_personal_access_token
GITHUB_TEST_REPO=owner/repo
```

To generate a GitHub personal access token:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Copy the token and add it to your `.env` file

### Installation

```bash
npm install
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm test -- github-client.test
npm test -- rate-limiter.test
npm test -- retry-handler.test
```

### Property-Based Tests

```bash
npm test -- github-auth.property.test
npm test -- github-invalid-auth.property.test
npm test -- github-multi-repo.property.test
```

**Note:** Property-based tests require a valid `GITHUB_TEST_TOKEN` environment variable. Tests will be skipped if the token is not provided.

## Usage

```typescript
import { GitHubClient } from '@dev-tracker/github-integration';

const client = new GitHubClient();

// Authenticate
const authResult = await client.authenticate('your_github_token');
if (authResult.success) {
  console.log(`Authenticated as ${authResult.username}`);
}

// Fetch repository info
const repo = await client.fetchRepositoryInfo('owner/repo');
console.log(repo);

// Get contributors
const contributors = await client.getContributors('owner/repo');
console.log(contributors);

// Fetch commits since a date
const since = new Date('2024-01-01');
const commits = await client.fetchCommits('owner/repo', since);
console.log(commits);

// Fetch pull requests
const prs = await client.fetchPullRequests('owner/repo', since);
console.log(prs);

// Fetch issues
const issues = await client.fetchIssues('owner/repo', since);
console.log(issues);

// Check rate limit
const rateLimit = await client.getRateLimitInfo();
console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
```

## Architecture

### Components

- **GitHubClient**: Main client for interacting with GitHub API
- **RateLimiter**: Handles request queuing to respect GitHub rate limits
- **RetryHandler**: Implements exponential backoff retry logic for failed requests

### Rate Limiting

The module automatically queues requests to respect GitHub's rate limits (5000 requests/hour for authenticated requests). Requests are processed sequentially with appropriate delays.

### Error Handling

The module implements retry logic with exponential backoff for:
- Network errors (ECONNRESET, ETIMEDOUT)
- Server errors (5xx status codes)
- Rate limit errors (403 with rate limit message)

Non-retryable errors (e.g., 401 authentication failures, 404 not found) are thrown immediately.

## Testing Strategy

### Property-Based Tests

The module includes property-based tests using fast-check to verify:

1. **Property 1**: Valid GitHub tokens establish connections and can retrieve repository metadata
2. **Property 2**: Invalid tokens are rejected with clear error messages
3. **Property 3**: Multiple repository connections operate independently

### Unit Tests

Unit tests cover:
- Authentication with various token formats
- Repository URL parsing
- Error handling for invalid inputs
- Rate limiting behavior
- Data collection with proper field validation
- Retry logic with exponential backoff

## Requirements Validation

This module satisfies the following requirements:

- **1.1**: GitHub API token authentication
- **1.2**: Repository connection and metadata retrieval
- **1.3**: Clear error messages for authentication failures
- **1.4**: Maintained connections for subsequent operations
- **1.5**: Independent management of multiple repository connections
