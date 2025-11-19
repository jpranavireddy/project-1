#!/bin/bash

# GitHub Integration Module Test Runner
# This script helps run the tests with proper environment setup

echo "GitHub Integration Module - Test Runner"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "Please edit .env and add your GITHUB_TEST_TOKEN"
    echo "Generate a token at: https://github.com/settings/tokens"
    echo ""
    exit 1
fi

# Check if GITHUB_TEST_TOKEN is set
source .env
if [ -z "$GITHUB_TEST_TOKEN" ] || [ "$GITHUB_TEST_TOKEN" = "ghp_your_token_here" ]; then
    echo "⚠️  Error: GITHUB_TEST_TOKEN not configured"
    echo "Please edit .env and add your GitHub personal access token"
    echo "Generate a token at: https://github.com/settings/tokens"
    echo ""
    exit 1
fi

echo "✓ Environment configured"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Run tests based on argument
case "$1" in
    "property")
        echo "Running property-based tests..."
        npm test -- --testPathPattern="property.test"
        ;;
    "unit")
        echo "Running unit tests..."
        npm test -- --testPathPattern="test.ts$" --testPathIgnorePatterns="property.test"
        ;;
    "coverage")
        echo "Running tests with coverage..."
        npm run test:coverage
        ;;
    *)
        echo "Running all tests..."
        npm test
        ;;
esac
