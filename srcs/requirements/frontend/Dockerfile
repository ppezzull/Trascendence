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

# Create directory for SSL certificates
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate (valid for 365 days)
# For development only - replace with real certificate in production
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=42School/OU=Trascendence/CN=localhost"

# Verify Nginx configuration syntax
RUN nginx -t

# Expose ports
EXPOSE 80 443

# Health check - verify Nginx is serving files
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
