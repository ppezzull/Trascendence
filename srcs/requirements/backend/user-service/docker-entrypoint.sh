#!/bin/sh
set -e

# Fix bind mount permissions and drop to nodejs user
if [ "$(id -u)" = "0" ]; then
    chown -R nodejs:nodejs /app/data
    exec su-exec nodejs "$0" "$@"
fi

echo "🔄 Starting User Service initialization..."

# Run database migrations
echo "📦 Running database migrations..."
npm run migrate

echo "✅ Migrations completed successfully"

# Start the application
echo "🚀 Starting User Service..."
exec npm start
