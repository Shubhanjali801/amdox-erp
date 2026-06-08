#!/bin/bash
echo "Seeding database..."
cd "$(dirname "$0")/.."
npx ts-node src/db/seeds/run.ts
echo "Seeding complete."
