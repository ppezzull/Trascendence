# Trascendence - System Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [Single Entry Point Architecture](#single-entry-point-architecture)
- [Internal Docker Network Communication](#internal-docker-network-communication)
- [Service Communication Patterns](#service-communication-patterns)
- [Security Architecture](#security-architecture)
- [Service Discovery and Health Checks](#service-discovery-and-health-checks)
- [Port Exposure Strategy](#port-exposure-strategy)

---

## Overview

Trascendence is a microservices-based application implementing a **Single Entry Point Architecture** with comprehensive DevOps infrastructure.
All external access is routed through a central Nginx reverse proxy, ensuring security, monitoring, and centralized control.

### System Components

#### Application Services (4 microservices)
- **Frontend**: Static SPA served by Nginx
- **User Service**: Authentication and user management (Fastify)
- **Game Service**: Game logic, matchmaking, tournaments (Fastify)
- **Chat Service**: Real-time messaging via WebSocket (Fastify)

#### DevOps Infrastructure (6 services)
- **ELK Stack**: Elasticsearch, Logstash, Kibana (log aggregation and analysis)
- **Monitoring**: Prometheus, Grafana, Node Exporter (metrics and visualization)

**Total: 10 Docker containers**

---

## Single Entry Point Architecture

### Principle
**All external traffic must flow through a single entry point: the Nginx frontend container on ports 80/8090 (HTTPS).**

This architecture enforces:
- **Centralized access control**
- **Unified SSL/TLS termination**
- **Simplified firewall rules**
- **Enhanced security posture**

### External Access Flow

```
User Browser
     │
     │ HTTPS (Port 8090)
     ▼
┌─────────────────────┐
│   Nginx (Frontend)  │◄── ONLY external entry point
│   Port 80/8090      │
└─────────────────────┘
     │
     │ Internal Docker Network
     │ (No direct port exposure)
     ▼
┌───────────────────────────────────────────────┐
│          Internal Services                    │
│                                               │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ User Service │  │ Game Service │           │
│  │ Port: 3001   │  │ Port: 3003   │           │
│  └──────────────┘  └──────────────┘           │
│                                               │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ Chat Service │  │ Elasticsearch│           │
│  │ Port: 3002   │  │ Port: 9200   │           │
│  └──────────────┘  └──────────────┘           │
│                                               │
│  ┌──────────────┐  ┌──────────────┐           │
│  │  Kibana      │  │  Grafana     │           │
│  │ Port: 5601   │  │ Port: 3000   │           │
│  └──────────────┘  └──────────────┘           │
│                                               │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ Prometheus   │  │ Node Exporter│           │
│  │ Port: 9090   │  │ Port: 9100   │           │
│  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────┘
```

### Access URLs (All via Nginx)

| Service       | External URL                            | Internal Service     | Backend Route      |
|---------------|-----------------------------------------|----------------------|--------------------|
| Frontend      | https://localhost:8090                  | nginx:443            | /                  |
| **DevOps Tools** |                                     |                      |                    |
| Kibana        | https://localhost:8090/kibana/          | kibana:5601          | /kibana/           |
| Grafana       | https://localhost:8090/grafana/         | grafana:3000         | /grafana/          |
| Prometheus    | https://localhost:8090/prometheus/      | prometheus:9090      | /prometheus/       |
| **API Services** |                                      |                      |                    |
| User API      | https://localhost:8090/api/users/       | user-service:3001    | /api/users/        |
| Auth API      | https://localhost:8090/api/auth/        | user-service:3001    | /api/auth/         |
| Game API      | https://localhost:8090/api/game/        | game-service:3003    | /api/* (proxied)   |
| Chat API      | https://localhost:8090/api/chat/        | chat-service:3002    | /api/chat/         |
| **API Documentation** |                                 |                      |                    |
| User Docs     | https://localhost:8090/docs/user        | user-service:3001    | /docs              |
| Game Docs     | https://localhost:8090/docs/game        | game-service:3003    | /docs              |
| Chat Docs     | https://localhost:8090/docs/chat        | chat-service:3002    | /docs              |

---

## Internal Docker Network Communication

### Docker Network: `trascendence_network`
All services connect to a single bridge network named `trascendence_network`, enabling seamless internal communication using Docker's built-in DNS.

### How Internal Communication Works

#### 1. Service Discovery via Docker DNS
Docker provides automatic DNS resolution for container names:

```bash
# Inside user-service container
curl http://game-service:3003/health
# ✅ Works - Docker DNS resolves 'game-service' to container IP
```

#### 2. Internal Port Access
Services listen on internal ports that are **NOT exposed to the host**:

```yaml
# docker-compose.yml example
user-service:
  ports: []  # No port exposure
  networks:
    - internal
  environment:
    - PORT=3001
    - HOST=0.0.0.0  # Listen on all interfaces inside container
```

Despite no port exposure, other containers can still access it:

```bash
# From game-service container
curl http://user-service:3001/api/users/123
# ✅ Works via internal Docker network
```

#### 3. Isolation from Host System
Without port exposure (`ports: []`), services are **completely isolated** from the host:

```bash
# From host machine
curl http://localhost:3001/health
# ❌ Connection refused - port not exposed

# From another container in same network
docker exec game-service curl http://user-service:3001/health
# ✅ Works - internal network access
```

---

## Service Communication Patterns

### 1. Client → Backend (via Nginx)
```
User Browser
     ↓
[HTTPS Request to https://localhost:8090/api/users/profile]
     ↓
Nginx (port 8090)
     ↓ proxy_pass
[HTTP to user-service:3001/api/users/profile]
     ↓
User Service (internal)
```

### 2. Backend ↔ Backend (direct internal)
```
User Service
     ↓
[HTTP Request to http://game-service:3003/api/games/123]
     ↓
Docker Network DNS Resolution
     ↓
Game Service (internal)
```

### 3. Monitoring Data Flow (Prometheus)
```
Prometheus (internal)
     ↓ Scrape metrics every 15s
[HTTP to user-service:3001/metrics]
     ↓
User Service (internal, exposes /metrics endpoint)
```

### 4. Log Aggregation (ELK Stack)
```
Docker Containers (all services)
     ↓ stdout/stderr
Docker Log Driver
     ↓ File: /var/lib/docker/containers/*/*.log
Logstash (reads log files)
     ↓ Parse and transform
Elasticsearch (index logs)
     ↓ Query interface
Kibana (visualization)
     ↑ Access via Nginx
User Browser (https://localhost:8090/kibana/)
```

---

## Security Architecture

### 1. Attack Surface Reduction
```
Host exposes 2 ports:
- 80 (HTTP → redirects to HTTPS)
- 8090 (HTTPS)
```

### 2. SSL/TLS Termination
All HTTPS encryption/decryption happens at Nginx:
- **External**: Encrypted HTTPS (TLS 1.2+)
- **Internal**: Unencrypted HTTP (within Docker network)

This is secure because:
- Docker network is isolated from external networks
- No external access to internal HTTP traffic
- Performance benefit (no double encryption)

### 3. Defense in Depth
```
Layer 1: Firewall (only allows port 8090)
         ↓
Layer 2: Nginx (reverse proxy, rate limiting)
         ↓
Layer 3: Docker Network Isolation
         ↓
Layer 4: Application-level authentication (JWT)
         ↓
Layer 5: Database-level access control
```

### 4. Secret Management
Sensitive data flows:
```
.env file (host machine)
     ↓ Environment variables
docker-compose.yml
     ↓ Container environment
Service (reads process.env)
```

**Never exposed via HTTP:**
- Database credentials
- JWT secrets
- OAuth client secrets

---

## Service Discovery and Health Checks

### Internal Health Checks
Each service defines a health check endpoint that Docker monitors **internally**:

```yaml
# docker-compose.yml
user-service:
  healthcheck:
    test: ["CMD-SHELL", "wget -q --spider http://localhost:3001/health || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 3
```

**How it works:**
1. Docker executes `wget` **inside the container**
2. Request goes to `localhost:3001` (container's localhost)
3. No external network access needed
4. Health status visible via `docker compose ps`

### Service Dependencies
Services wait for upstream dependencies to be healthy:

```yaml
kibana:
  depends_on:
    elasticsearch:
      condition: service_healthy  # Wait for Elasticsearch to be healthy
```

**Boot sequence:**
```
1. Elasticsearch starts → becomes healthy (60s)
2. Kibana starts (waits for Elasticsearch)
3. Logstash starts (waits for Elasticsearch)
4. Nginx starts → application ready
```

---

## Port Exposure Strategy

### Port Exposure Matrix

| Service          | Internal Port | Host Exposure | Reason                          |
|------------------|---------------|---------------|---------------------------------|
| nginx (frontend) | 80, 443       | ✅ 80, 8090   | Single entry point              |
| user-service     | 3001          | ❌            | Access via Nginx only           |
| game-service     | 3003          | ❌            | Access via Nginx only           |
| chat-service     | 3002          | ❌            | Access via Nginx only           |
| elasticsearch    | 9200          | ❌            | Internal use (Logstash, Kibana) |
| logstash         | 5044          | ❌            | Internal log processing         |
| kibana           | 5601          | ❌            | Access via Nginx `/kibana/`     |
| prometheus       | 9090          | ❌            | Access via Nginx `/prometheus/` |
| grafana          | 3000          | ❌            | Access via Nginx `/grafana/`    |
| node-exporter    | 9100          | ❌            | Scraped by Prometheus (internal)|

### Why No Direct Port Exposure?

#### Security Benefits:
1. **Prevents direct service access** - attackers cannot bypass Nginx
2. **Centralized rate limiting** - all requests throttled at Nginx
3. **Unified authentication** - JWT validation happens at Nginx
4. **SSL enforcement** - impossible to access services over unencrypted HTTP
5. **Attack surface minimization** - 90% fewer open ports

#### Operational Benefits:
1. **Simplified firewall rules** - only need to allow port 8090
2. **Easier monitoring** - all traffic flows through single point
3. **Centralized logging** - Nginx logs all access
4. **Load balancing** - Nginx can distribute load to multiple backend instances

---

## Implementation Details

### Nginx Reverse Proxy Configuration

#### Backend Service Proxies

The Nginx configuration maps external routes to internal backend services:

**1. User Service (user-service:3001)**

Backend routes: `/api/users/*` and `/api/auth/*`

```nginx
# User Management
location /api/users/ {
    proxy_pass http://user-service:3001/api/users/;
}

# Authentication (OAuth, JWT)
location /api/auth/ {
    proxy_pass http://user-service:3001/api/auth/;
}
```

**2. Game Service (game-service:3003)**

Backend routes: `/api/*` (prefix is `/api`)

```nginx
# Game routes - external /api/game/* maps to internal /api/*
location /api/game/ {
    proxy_pass http://game-service:3003/api/;
}
```

**How this mapping works:**
- External request: `https://localhost:8090/api/game/matches`
- Nginx proxies to: `http://game-service:3003/api/matches`
- The `/game` part is stripped because proxy_pass ends with `/api/`

**3. Chat Service (chat-service:3002)**

Backend routes: `/api/chat/*`

```nginx
# Chat with WebSocket support
location /api/chat/ {
    proxy_pass http://chat-service:3002/api/chat/;

    # WebSocket upgrade headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

#### Swagger Documentation Proxies

Each backend service exposes Swagger UI at `/docs`. Nginx maps these to unique external paths:

```nginx
# User Service Swagger
location /docs/user {
    proxy_pass http://user-service:3001/docs;
}

# Game Service Swagger
location /docs/game {
    proxy_pass http://game-service:3003/docs;
}

# Chat Service Swagger
location /docs/chat {
    proxy_pass http://chat-service:3002/docs;
}
```

**Access URLs:**
- User API docs: `https://localhost:8090/docs/user`
- Game API docs: `https://localhost:8090/docs/game`
- Chat API docs: `https://localhost:8090/docs/chat`

#### DevOps Tool Proxies

Example reverse proxy for Kibana:

```nginx
location /kibana/ {
    proxy_pass http://kibana:5601/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**How this works:**
1. User requests `https://localhost:8090/kibana/`
2. Nginx receives request on port 8090
3. Nginx forwards to `http://kibana:5601/` (internal Docker network)
4. Docker DNS resolves `kibana` to container IP
5. Response flows back through Nginx to user

### Environment Variables for Internal Binding

Backend services must listen on `0.0.0.0` to accept internal Docker network traffic:

```yaml
# docker-compose.yml
user-service:
  environment:
    - HOST=0.0.0.0  # Listen on all interfaces
    - PORT=3001
```

**Why `0.0.0.0` and not `127.0.0.1`?**
- `127.0.0.1`: Only accepts connections from within the same container
- `0.0.0.0`: Accepts connections from Docker network interfaces
- Health checks would fail with `127.0.0.1` (Docker daemon accesses from network)

---

## Monitoring the Architecture

### Check Service Health
```bash
make health
# Shows container health status from Docker
```

### View All Access URLs
```bash
make urls
# Displays all external access URLs (all via Nginx)
```

### Test Internal Communication
```bash
# Enter a container
docker exec -it user-service /bin/bash

# Test internal service communication
curl http://game-service:3003/health
curl http://elasticsearch:9200/_cluster/health
curl http://prometheus:9090/-/healthy
```

### Monitor Network Traffic
```bash
# View Nginx access logs (all external requests)
docker compose -f srcs/docker-compose.yml logs -f frontend

# View internal service logs
docker compose -f srcs/docker-compose.yml logs -f user-service
```

---

## Troubleshooting

### Service Cannot Reach Another Service

**Problem:** `curl: (6) Could not resolve host: user-service`

**Solution:**
1. Ensure both services are on the same Docker network
2. Check service is running: `docker compose ps`
3. Verify network: `docker network inspect trascendence_network`

### Health Check Failing

**Problem:** Service shows as "unhealthy"

**Debug steps:**
```bash
# 1. Enter the container
docker exec -it user-service /bin/bash

# 2. Test health endpoint manually
curl http://localhost:3001/health

# 3. Check logs
docker compose logs user-service
```

### Cannot Access Service from Browser

**Problem:** `https://localhost:8090/kibana/` returns 502 Bad Gateway

**Solution:**
1. Check if Kibana is healthy: `docker compose ps kibana`
2. Check Nginx can reach Kibana: `docker exec frontend ping kibana`
3. Verify Nginx configuration: `docker exec frontend nginx -t`
4. Check Nginx logs: `docker compose logs frontend`

---

## Summary

The Trascendence architecture implements a **defense-in-depth** security model with:

✅ **Single Entry Point**: All traffic via Nginx on port 8090
✅ **Internal Network Isolation**: Services communicate via Docker network
✅ **Zero External Port Exposure**: Backend services completely hidden
✅ **SSL/TLS Termination**: Centralized encryption at Nginx
✅ **Service Discovery**: Automatic DNS resolution via Docker
✅ **Health Monitoring**: Docker-native health checks
✅ **Attack Surface Reduction**: 90% fewer exposed ports

This architecture ensures security, maintainability, and scalability while meeting all project requirements.
