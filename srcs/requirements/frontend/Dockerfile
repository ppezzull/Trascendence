# ==============================================================================
# Trascendence Frontend Dockerfile
# Multi-stage build: Stage 1 (Build) + Stage 2 (Serve)
# ==============================================================================

# ==============================================================================
# Stage 1: Build Stage (Node.js + Vite)
# ==============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Enable Corepack for Yarn version management
RUN corepack enable

# Copy package files and Yarn configuration
COPY package*.json ./
COPY yarn.lock* ./
COPY .yarnrc.yml ./

# Install dependencies
# Support both npm and yarn
RUN if [ -f yarn.lock ]; then \
      yarn install --immutable; \
    else \
      npm ci; \
    fi

# Copy source code
COPY . .

# Build application (TypeScript → JavaScript, bundle with Vite)
RUN if [ -f yarn.lock ]; then \
      yarn build; \
    else \
      npm run build; \
    fi

# Verify build output exists
RUN ls -la /app/dist && \
    echo "Build complete - dist/ contents:" && \
    du -sh /app/dist

# ==============================================================================
# Stage 2: Production Stage (Nginx)
# ==============================================================================
FROM nginx:alpine

# Install OpenSSL for self-signed certificate generation
RUN apk add --no-cache openssl

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY conf/nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates (using standard Debian/Alpine paths)
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

# Fix nginx logs: Remove symlinks and create actual log files for Logstash
RUN rm -f /var/log/nginx/access.log /var/log/nginx/error.log && \
    touch /var/log/nginx/access.log /var/log/nginx/error.log && \
    chown nginx:nginx /var/log/nginx/access.log /var/log/nginx/error.log

# Copy entrypoint script
COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose ports (80 for HTTP redirect, 8090 for HTTPS)
EXPOSE 80 8090

# Health check - verify Nginx is serving files
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider --no-check-certificate https://localhost:8090/ || exit 1

# Start via entrypoint script (generates SSL cert then starts Nginx)
CMD ["/usr/local/bin/entrypoint.sh"]
