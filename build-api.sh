#!/usr/bin/env bash
# Render build script for the Express API only.
set -e

echo "==> Node version: $(node --version)"
echo "==> NPM version: $(npm --version)"

echo "==> Installing dependencies..."
npm install

echo "==> Compiling TypeScript..."
cd apps/api && npx tsc --version && npx tsc -p tsconfig.json && cd ../..

echo "==> Verifying dist output..."
ls -la apps/api/dist/

echo "==> Build complete."
