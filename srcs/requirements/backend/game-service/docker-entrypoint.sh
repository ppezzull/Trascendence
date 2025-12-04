#!/bin/sh
set -e

# Fix bind mount permissions and drop to nodejs user
if [ "$(id -u)" = "0" ]; then
    chown -R nodejs:nodejs /app/data
    exec su-exec nodejs "$0" "$@"
fi

echo "🚀 Starting Game Service..."
exec npm start
