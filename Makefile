# ==============================================================================
# Trascendence Project - Makefile
# ==============================================================================
# This Makefile manages the Docker infrastructure including:
# - 4 microservices (user, game, chat, blockchain)
# - ELK Stack (Elasticsearch, Logstash, Kibana)
# - Monitoring (Prometheus, Grafana, Node Exporter)
#
# Total: 11 containers
# ==============================================================================

# Docker Compose file
COMPOSE_FILE = srcs/docker-compose.yml

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

# ==============================================================================
# MAIN COMMANDS
# ==============================================================================

# Default target - starts everything
all: info up

# Display project information
info:
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)  Trascendence DevOps Infrastructure$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo "Services:"
	@echo "  - Frontend (Nginx)"
	@echo "  - User Service (Fastify)"
	@echo "  - Game Service (Fastify)"
	@echo "  - Chat Service (Fastify)"
	@echo ""
	@echo "DevOps Stack:"
	@echo "  - ELK: Elasticsearch, Logstash, Kibana"
	@echo "  - Monitoring: Prometheus, Grafana, Node Exporter"
	@echo ""
	@echo "Total: 10 containers"
	@echo "  make help             - Show make command list"
	@echo "$(GREEN)========================================$(NC)"

# Start all services (build if needed)
up:
	@echo "$(GREEN)Starting all services...$(NC)"
	@if [ "$$(uname)" = "Linux" ]; then \
		echo "$(YELLOW)Fixing bind mount permissions for Linux...$(NC)"; \
		sudo chown -R 1001:1001 requirements/backend/user-service/data requirements/backend/game-service/data requirements/backend/chat-service/data 2>/dev/null || \
			echo "$(RED)Warning: Could not fix permissions. If services fail, ask an admin to run: sudo chown -R 1001:1001 requirements/backend/*/data$(NC)"; \
	fi
	docker compose -f $(COMPOSE_FILE) up --build -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo ""
	@make status
	@echo ""
	@make urls

# Stop and remove all containers
down:
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker compose -f $(COMPOSE_FILE) down
	@echo "$(YELLOW)Services stopped$(NC)"

# Start existing containers (without rebuilding)
start:
	@echo "$(GREEN)Starting containers...$(NC)"
	docker compose -f $(COMPOSE_FILE) start

# Stop running containers (without removing)
stop:
	@echo "$(YELLOW)Stopping containers...$(NC)"
	docker compose -f $(COMPOSE_FILE) stop

# Restart all services
restart: stop start

# ==============================================================================
# CLEANUP COMMANDS
# ==============================================================================

# Remove containers and volumes (keeps images)
clean:
	@echo "$(RED)Removing containers and volumes...$(NC)"
	docker compose -f $(COMPOSE_FILE) down -v
	@echo "$(RED)Cleanup complete$(NC)"

# Full cleanup (removes everything including images)
fclean:
	@echo "$(RED)Full cleanup - removing containers, volumes, images...$(NC)"
	docker compose -f $(COMPOSE_FILE) down -v --rmi all --remove-orphans
	@echo "$(RED)Full cleanup complete$(NC)"

# Complete rebuild (fclean + up)
re: fclean up

# Prune entire Docker system (use with caution!)
prune:
	@echo "$(RED)WARNING: This will remove all unused Docker resources$(NC)"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds..."
	@sleep 5
	docker system prune -af --volumes
	@echo "$(RED)System pruned$(NC)"

# ==============================================================================
# STATUS & MONITORING COMMANDS
# ==============================================================================

# Show status of all containers
status:
	@echo "$(GREEN)Container Status:$(NC)"
	@docker compose -f $(COMPOSE_FILE) ps --all

# Show detailed status
ps: status

# Show running containers
list:
	@echo "$(GREEN)Running containers:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show all containers (including stopped)
list-all:
	@echo "$(GREEN)All containers:$(NC)"
	@docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show container IDs only
list-all-id:
	@docker ps -a -q

# Show images
images:
	@echo "$(GREEN)Docker images:$(NC)"
	@docker compose -f $(COMPOSE_FILE) images

# Show access URLs
urls:
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)  Access URLs - Single Entry Point$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(YELLOW)All services accessible via Nginx (HTTPS):$(NC)"
	@echo ""
	@echo "Frontend Application:"
	@echo "  https://localhost:8090"
	@echo ""
	@echo "DevOps Monitoring UIs:"
	@echo "  Kibana:     https://localhost:8090/kibana/"
	@echo "  Grafana:    https://localhost:8090/grafana/  (admin/see .env file)"
	@echo "  Prometheus: https://localhost:8090/prometheus/"
	@echo ""
	@echo "API Documentation (Swagger UI):"
	@echo "  User Docs:  https://localhost:8090/docs/user"
	@echo "  Game Docs:  https://localhost:8090/docs/game"
	@echo "  Chat Docs:  https://localhost:8090/docs/chat"
	@echo ""
	@echo "$(YELLOW)Note: All direct port access removed for security$(NC)"
	@echo "$(YELLOW)All communication uses internal Docker network$(NC)"
	@echo "$(GREEN)========================================$(NC)"

# ==============================================================================
# LOGS COMMANDS
# ==============================================================================

# Show logs from all services
logs:
	docker compose -f $(COMPOSE_FILE) logs -f

# Show logs from specific service
# Usage: make logs-service SERVICE=user-service
logs-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: Please specify SERVICE$(NC)"; \
		echo "Usage: make logs-service SERVICE=user-service"; \
	else \
		docker compose -f $(COMPOSE_FILE) logs -f $(SERVICE); \
	fi

# Show ELK logs
logs-elk:
	@echo "$(GREEN)ELK Stack logs:$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f elasticsearch logstash kibana

# Show Monitoring logs
logs-monitoring:
	@echo "$(GREEN)Monitoring stack logs:$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f prometheus grafana node-exporter

# Show application logs
logs-app:
	@echo "$(GREEN)Application services logs:$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f user-service game-service chat-service

# Show User Service logs
logs-user:
	@echo "$(GREEN)User Service logs:$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f user-service

# Show Game Service logs
logs-game:
	@echo "$(GREEN)Game Service logs:$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f game-service

# Show Chat Service logs
logs-chat:
	@echo "$(GREEN)Chat Service logs:$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f chat-service

# Show Frontend logs
logs-frontend:
	@echo "$(GREEN)Frontend (Nginx) logs:$(NC)"
	docker compose -f $(COMPOSE_FILE) logs -f frontend

# ==============================================================================
# EXEC COMMANDS (Enter container shell)
# ==============================================================================

# Execute bash in a container
# Usage: make exec CONTAINER=user-service
exec:
	@if [ -z "$(CONTAINER)" ]; then \
		echo "$(RED)Error: Please specify CONTAINER$(NC)"; \
		echo "Usage: make exec CONTAINER=user-service"; \
	else \
		docker exec -it $(CONTAINER) /bin/bash || docker exec -it $(CONTAINER) /bin/sh; \
	fi

# Shortcuts for common containers
exec-user:
	@make exec CONTAINER=user-service

exec-game:
	@make exec CONTAINER=game-service

exec-chat:
	@make exec CONTAINER=chat-service

exec-elk:
	@make exec CONTAINER=elasticsearch

exec-prometheus:
	@make exec CONTAINER=prometheus

# ==============================================================================
# HEALTH CHECK COMMANDS
# ==============================================================================

# Check health of all services
health:
	@echo "$(GREEN)Checking service health via Docker...$(NC)"
	@echo ""
	@echo "$(YELLOW)Container Health Status:$(NC)"
	@docker compose -f $(COMPOSE_FILE) ps --format "table {{.Name}}\t{{.Status}}" | grep -E "healthy|unhealthy|starting" || echo "No health data available"
	@echo ""
	@echo "$(YELLOW)Note: Services use internal Docker network$(NC)"
	@echo "$(YELLOW)Access via: https://localhost:8090$(NC)"
	@echo ""

# Check Elasticsearch health
health-elk:
	@echo "$(GREEN)Elasticsearch cluster health (via Docker exec):$(NC)"
	@docker exec elasticsearch curl -s http://localhost:9200/_cluster/health?pretty

# Check Prometheus targets
health-prometheus:
	@echo "$(GREEN)Prometheus targets:$(NC)"
	@echo "Access via: https://localhost:8090/prometheus/targets"
	@docker exec prometheus wget -qO- http://localhost:9090/-/healthy && echo "Prometheus: Healthy" || echo "Prometheus: Unhealthy"

# Check Application Services health
health-app:
	@echo "$(GREEN)Application Services Health:$(NC)"
	@echo ""
	@echo "$(YELLOW)User Service:$(NC)"
	@docker exec user-service wget -qO- http://127.0.0.1:3001/health 2>/dev/null | jq '.' || echo "  Status: DOWN"
	@echo ""
	@echo "$(YELLOW)Game Service:$(NC)"
	@docker exec game-service wget -qO- http://127.0.0.1:3003/health 2>/dev/null | jq '.' || echo "  Status: DOWN"
	@echo ""
	@echo "$(YELLOW)Chat Service:$(NC)"
	@docker exec chat-service wget -qO- http://127.0.0.1:3002/health 2>/dev/null | jq '.' || echo "  Status: DOWN"

# Check User Service health
health-user:
	@echo "$(GREEN)User Service Health:$(NC)"
	@docker exec user-service wget -qO- http://127.0.0.1:3001/health 2>/dev/null | jq '.'
	@echo ""
	@echo "Swagger UI: https://localhost:8090/docs/user"

# Check Game Service health
health-game:
	@echo "$(GREEN)Game Service Health:$(NC)"
	@docker exec game-service wget -qO- http://127.0.0.1:3003/health 2>/dev/null | jq '.'
	@echo ""
	@echo "Swagger UI: https://localhost:8090/docs/game"

# Check Chat Service health
health-chat:
	@echo "$(GREEN)Chat Service Health:$(NC)"
	@docker exec chat-service wget -qO- http://127.0.0.1:3002/health 2>/dev/null | jq '.'
	@echo ""
	@echo "Swagger UI: https://localhost:8090/docs/chat"

# ==============================================================================
# DATABASE COMMANDS
# ==============================================================================

# Backup all SQLite databases
backup-db:
	@echo "$(GREEN)Backing up databases...$(NC)"
	@mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	@docker cp user-service:/app/data/users.db backups/$(shell date +%Y%m%d_%H%M%S)/users.db
	@docker cp game-service:/app/data/games.db backups/$(shell date +%Y%m%d_%H%M%S)/games.db
	@docker cp chat-service:/app/data/chat.db backups/$(shell date +%Y%m%d_%H%M%S)/chat.db
	@echo "$(GREEN)Backup complete: backups/$(shell date +%Y%m%d_%H%M%S)$(NC)"

# ==============================================================================
# DEVELOPMENT COMMANDS
# ==============================================================================

# Build without starting
build:
	@echo "$(GREEN)Building images...$(NC)"
	docker compose -f $(COMPOSE_FILE) build

# Build specific service
# Usage: make build-service SERVICE=user-service
build-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: Please specify SERVICE$(NC)"; \
		echo "Usage: make build-service SERVICE=user-service"; \
	else \
		docker compose -f $(COMPOSE_FILE) build $(SERVICE); \
	fi

# Rebuild and restart specific service
# Usage: make rebuild SERVICE=user-service
rebuild:
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: Please specify SERVICE$(NC)"; \
		echo "Usage: make rebuild SERVICE=user-service"; \
	else \
		docker compose -f $(COMPOSE_FILE) up -d --build $(SERVICE); \
	fi

# ==============================================================================
# TESTING COMMANDS
# ==============================================================================

# Test ELK Stack
test-elk:
	@echo "$(GREEN)Testing ELK Stack (via Docker exec)...$(NC)"
	@echo ""
	@echo "1. Elasticsearch:"
	@docker exec elasticsearch curl -s http://localhost:9200 | jq '.'
	@echo ""
	@echo "2. Kibana (accessible via Nginx):"
	@echo "   Visit: https://localhost:8090/kibana/"
	@curl -sk https://localhost:8090/kibana/api/status | jq '.status.overall.state' || echo "Check via browser"
	@echo ""
	@echo "3. Indices:"
	@docker exec elasticsearch curl -s http://localhost:9200/_cat/indices?v

# Test Monitoring
test-monitoring:
	@echo "$(GREEN)Testing Monitoring Stack (via Docker exec)...$(NC)"
	@echo ""
	@echo "1. Prometheus (accessible via Nginx):"
	@echo "   Visit: https://localhost:8090/prometheus/"
	@docker exec prometheus wget -qO- http://localhost:9090/-/healthy && echo "   Status: Healthy" || echo "   Status: Unhealthy"
	@echo ""
	@echo "2. Node Exporter metrics (internal):"
	@docker exec node-exporter wget -qO- http://localhost:9100/metrics | head -n 5
	@echo ""
	@echo "3. Grafana (accessible via Nginx):"
	@echo "   Visit: https://localhost:8090/grafana/"
	@docker exec grafana wget -qO- http://localhost:3000/api/health | jq '.' || echo "Check via browser"

# Test Application Services
test-app:
	@echo "$(GREEN)Testing Application Services...$(NC)"
	@echo ""
	@echo "$(YELLOW)1. User Service:$(NC)"
	@echo "   Health endpoint:"
	@docker exec user-service wget -qO- http://127.0.0.1:3001/health 2>/dev/null | jq '.' || echo "   FAILED"
	@echo "   Metrics endpoint:"
	@docker exec user-service wget -qO- http://127.0.0.1:3001/metrics 2>/dev/null | head -n 3 || echo "   No metrics available"
	@echo "   Swagger UI: https://localhost:8090/docs/user"
	@echo ""
	@echo "$(YELLOW)2. Game Service:$(NC)"
	@echo "   Health endpoint:"
	@docker exec game-service wget -qO- http://127.0.0.1:3003/health 2>/dev/null | jq '.' || echo "   FAILED"
	@echo "   Metrics endpoint:"
	@docker exec game-service wget -qO- http://127.0.0.1:3003/metrics 2>/dev/null | head -n 3 || echo "   No metrics available"
	@echo "   Swagger UI: https://localhost:8090/docs/game"
	@echo ""
	@echo "$(YELLOW)3. Chat Service:$(NC)"
	@echo "   Health endpoint:"
	@docker exec chat-service wget -qO- http://127.0.0.1:3002/health 2>/dev/null | jq '.' || echo "   FAILED"
	@echo "   Metrics endpoint:"
	@docker exec chat-service wget -qO- http://127.0.0.1:3002/metrics 2>/dev/null | head -n 3 || echo "   No metrics available"
	@echo "   Swagger UI: https://localhost:8090/docs/chat"

# Test User Service
test-user:
	@echo "$(GREEN)Testing User Service...$(NC)"
	@echo ""
	@echo "Health Check:"
	@docker exec user-service wget -qO- http://127.0.0.1:3001/health 2>/dev/null | jq '.'
	@echo ""
	@echo "Metrics (first 10 lines):"
	@docker exec user-service wget -qO- http://127.0.0.1:3001/metrics 2>/dev/null | head -n 10
	@echo ""
	@echo "Access URLs:"
	@echo "  Swagger: https://localhost:8090/docs/user"

# Test Game Service
test-game:
	@echo "$(GREEN)Testing Game Service...$(NC)"
	@echo ""
	@echo "Health Check:"
	@docker exec game-service wget -qO- http://127.0.0.1:3003/health 2>/dev/null | jq '.'
	@echo ""
	@echo "Metrics (first 10 lines):"
	@docker exec game-service wget -qO- http://127.0.0.1:3003/metrics 2>/dev/null | head -n 10
	@echo ""
	@echo "Access URLs:"
	@echo "  Swagger: https://localhost:8090/docs/game"

# Test Chat Service
test-chat:
	@echo "$(GREEN)Testing Chat Service...$(NC)"
	@echo ""
	@echo "Health Check:"
	@docker exec chat-service wget -qO- http://127.0.0.1:3002/health 2>/dev/null | jq '.'
	@echo ""
	@echo "Metrics (first 10 lines):"
	@docker exec chat-service wget -qO- http://127.0.0.1:3002/metrics 2>/dev/null | head -n 10
	@echo ""
	@echo "Access URLs:"
	@echo "  Swagger: https://localhost:8090/docs/chat"

# Test all services
test-all:
	@echo "$(GREEN)Testing all services...$(NC)"
	@make health
	@make test-elk
	@make test-monitoring
	@make test-app

# ==============================================================================
# HELP COMMAND
# ==============================================================================

help:
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)  Trascendence Makefile Commands$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)Main Commands:$(NC)"
	@echo "  make              - Show info and start all services"
	@echo "  make up           - Start all services (build if needed)"
	@echo "  make down         - Stop and remove all containers"
	@echo "  make start        - Start existing containers"
	@echo "  make stop         - Stop running containers"
	@echo "  make restart      - Restart all services"
	@echo ""
	@echo "$(YELLOW)Cleanup Commands:$(NC)"
	@echo "  make clean        - Remove containers and volumes"
	@echo "  make fclean       - Full cleanup (removes images too)"
	@echo "  make re           - Rebuild everything (fclean + up)"
	@echo "  make prune        - Prune entire Docker system (CAREFUL!)"
	@echo ""
	@echo "$(YELLOW)Status Commands:$(NC)"
	@echo "  make status       - Show container status"
	@echo "  make list         - Show running containers"
	@echo "  make list-all     - Show all containers"
	@echo "  make images       - Show images"
	@echo "  make urls         - Show access URLs"
	@echo ""
	@echo "$(YELLOW)Health Check Commands:$(NC)"
	@echo "  make health            - Check all services health"
	@echo "  make health-elk        - Check Elasticsearch health"
	@echo "  make health-prometheus - Check Prometheus health"
	@echo "  make health-app        - Check all app services health"
	@echo "  make health-user       - Check User Service health"
	@echo "  make health-game       - Check Game Service health"
	@echo "  make health-chat       - Check Chat Service health"
	@echo ""
	@echo "$(YELLOW)Logs Commands:$(NC)"
	@echo "  make logs                        - Show all logs"
	@echo "  make logs-service SERVICE=name   - Show specific service logs"
	@echo "  make logs-elk                    - Show ELK stack logs"
	@echo "  make logs-monitoring             - Show monitoring stack logs"
	@echo "  make logs-app                    - Show all app services logs"
	@echo "  make logs-user                   - Show User Service logs"
	@echo "  make logs-game                   - Show Game Service logs"
	@echo "  make logs-chat                   - Show Chat Service logs"
	@echo "  make logs-frontend               - Show Frontend (Nginx) logs"
	@echo ""
	@echo "$(YELLOW)Exec Commands:$(NC)"
	@echo "  make exec CONTAINER=name   - Enter container shell"
	@echo "  make exec-user             - Enter user-service"
	@echo "  make exec-game             - Enter game-service"
	@echo "  make exec-chat             - Enter chat-service"
	@echo ""
	@echo "$(YELLOW)Testing Commands:$(NC)"
	@echo "  make test-elk         - Test ELK Stack"
	@echo "  make test-monitoring  - Test Monitoring Stack"
	@echo "  make test-app         - Test Application Services"
	@echo "  make test-user        - Test User Service"
	@echo "  make test-game        - Test Game Service"
	@echo "  make test-chat        - Test Chat Service"
	@echo "  make test-all         - Test everything"
	@echo ""
	@echo "$(YELLOW)Other Commands:$(NC)"
	@echo "  make backup-db        - Backup SQLite databases"
	@echo "  make build            - Build images without starting"
	@echo "  make help             - Show this help"
	@echo ""
	@echo "$(GREEN)========================================$(NC)"

# ==============================================================================
# PHONY TARGETS
# ==============================================================================

.PHONY: all info up down start stop restart clean fclean re prune \
        status ps list list-all list-all-id images urls \
        logs logs-service logs-elk logs-monitoring logs-app logs-user logs-game logs-chat logs-frontend \
        exec exec-user exec-game exec-chat exec-elk exec-prometheus \
        health health-elk health-prometheus health-app health-user health-game health-chat \
        backup-db build build-service rebuild \
        test-elk test-monitoring test-app test-user test-game test-chat test-all help
