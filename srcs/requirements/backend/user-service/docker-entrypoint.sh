#!/bin/sh
set -e

echo "🔄 Starting User Service initialization..."

# Run database migrations
echo "📦 Running database migrations..."
npm run migrate

echo "✅ Migrations completed successfully"

# Start the application
echo "🚀 Starting User Service..."
exec npm start
