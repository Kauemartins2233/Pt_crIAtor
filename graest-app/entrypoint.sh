#!/bin/sh
set -e

# Initialize/update SQLite database schema
npx prisma db push --skip-generate

# Start the Next.js server
exec node server.js
