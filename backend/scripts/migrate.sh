#!/bin/bash
echo "Running database migrations..."
cd "$(dirname "$0")/.."
npx ts-node src/db/migrations/run.ts
echo "Migrations complete."
