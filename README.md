# AI-Driven Developer Performance Tracker

A comprehensive system for evaluating developer productivity, code quality, and collaboration in DevOps workflows through transparent, data-driven analysis.

## Project Structure

```
dev-performance-tracker/
├── packages/
│   ├── shared-types/          # Shared TypeScript types and interfaces
│   ├── api-gateway/           # Express.js API Gateway service
│   ├── github-integration/    # GitHub API integration service
│   ├── activity-monitor/      # Activity processing service
│   ├── metrics-engine/        # Metrics calculation service
│   ├── ai-analysis/           # Python-based AI analysis service
│   ├── recognition-service/   # Achievement and recognition service
│   └── frontend/              # React-based dashboard
├── docker-compose.yml         # Local development environment
└── package.json               # Root package.json for monorepo
```

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker and Docker Compose
- GitHub Personal Access Token

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Install dependencies:
   ```bash
   yarn install
   ```
4. Start the development environment:
   ```bash
   yarn dev
   ```

## Development

### Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage
```

### Linting and Formatting

```bash
# Lint all packages
yarn lint

# Format code
yarn format

# Check formatting
yarn format:check
```

### Building

```bash
# Build all packages
yarn build
```

## Services

- **API Gateway**: http://localhost:3000
- **Frontend Dashboard**: http://localhost:3001
- **AI Analysis Service**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)

## License

MIT
