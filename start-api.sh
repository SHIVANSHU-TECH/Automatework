#!/usr/bin/env bash
# Render start script for the Express API.
# Set this as the Start Command in Render: bash start-api.sh
set -e

echo "==> Starting API on port ${PORT:-4000}..."
npm run start:api
