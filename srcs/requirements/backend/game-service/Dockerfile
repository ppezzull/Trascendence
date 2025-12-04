# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install su-exec for privilege drop
RUN apk add --no-cache su-exec

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm i

# Copy source code
COPY src/ ./src/
COPY migrations/ ./migrations/

# Copy entrypoint script
COPY docker-entrypoint.sh ./

# Create data directory for SQLite database
RUN mkdir -p ./data

# Build the application
RUN npm run build

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /app

# Expose port 3003 (game-service listens on 3003)
EXPOSE 3003

# Health check on correct port
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["./docker-entrypoint.sh"]
