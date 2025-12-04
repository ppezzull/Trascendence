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

# Stop a single service (usage: make stop-service SERVICE=name)
stop-service:
	@if [ -z "$(SERVICE)" ]; then echo "$(RED)Usage: make stop-service SERVICE=name$(NC)"; exit 1; fi
	@echo "$(YELLOW)Stopping $(SERVICE)...$(NC)"
	docker compose -f $(COMPOSE_FILE) stop $(SERVICE)

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


# Show running containers
list:
	@echo "$(GREEN)Running containers:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show all containers (including stopped)
list-all:
	@echo "$(GREEN)All containers:$(NC)"
	@docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

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
	@echo "  Kibana:     https://localhost:8090/kibana/   (admin/see .env file)"
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
	docker compose -f $(COMPOSE_FILE) logs -f user-service game-service chat-service frontend


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
	@echo "  make stop-service SERVICE=name - Stop single service"
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
	@echo ""
	@echo "$(YELLOW)Logs Commands:$(NC)"
	@echo "  make logs                        - Show all logs"
	@echo "  make logs-service SERVICE=name   - Show specific service logs"
	@echo "  make logs-elk                    - Show ELK stack logs"
	@echo "  make logs-monitoring             - Show monitoring stack logs"
	@echo "  make logs-app                    - Show all app services logs"
	@echo ""
	@echo "$(YELLOW)Other Commands:$(NC)"
	@echo "  make build            - Build images without starting"
	@echo "  make rebuild SERVICE=name - Rebuild single service"
	@echo "  make help             - Show this help"
	@echo ""
	@echo "$(GREEN)========================================$(NC)"

# ==============================================================================
# PHONY TARGETS
# ==============================================================================

.PHONY: all info up down start stop stop-service restart clean fclean re prune \
        status list list-all images urls \
        logs logs-service logs-elk logs-monitoring logs-app \
        health build rebuild help
