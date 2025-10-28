 Trascendence Project Makefile
# This makefile provides commands to build, run and manage the Trascendence project

.PHONY: help install build run stop clean logs test dev prod

# Default target
help:
	@echo "Trascendence Project Management"
	@echo ""
	@echo "Available commands:"
	@echo "  install     - Install dependencies for all services"
	@echo "  build       - Build all Docker images"
	@echo "  run         - Start all services in production mode"
	@echo "  dev         - Start all services in development mode"
	@echo "  stop        - Stop all services"
	@echo "  clean       - Remove all containers, images and volumes"
	@echo "  logs        - Show logs for all services"
	@echo "  test        - Run tests for all services"
	@echo "  frontend    - Start only the frontend service"
	@echo "  backend     - Start all backend services"
	@echo "  infra       - Start infrastructure services (ELK, Prometheus)"
	@echo "  blockchain  - Deploy smart contracts to Fuji testnet"

# Variables
DOCKER_COMPOSE = docker-compose
COMPOSE_FILE = srcs/docker-compose.yml
PROJECT_NAME = transcendence

# Install dependencies for all services
install:
	@echo "Installing dependencies..."
	cd srcs/requirements/frontend && npm install
	cd srcs/requirements/backend/user-service && npm install
	cd srcs/requirements/backend/chat-service && npm install
	cd srcs/requirements/backend/game-service && npm install
	cd srcs/requirements/backend/blockchain-service && npm install

# Build all Docker images
build:
	@echo "Building all Docker images..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) build

# Start all services in production mode
run:
	@echo "Starting all services in production mode..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up -d

# Start all services in development mode
dev:
	@echo "Starting all services in development mode..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up --build

# Stop all services
stop:
	@echo "Stopping all services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down

# Clean up containers, images and volumes
clean:
	@echo "Removing all containers, images and volumes..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down -v --rmi all

# Show logs for all services
logs:
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs -f

# Run tests for all services
test:
	@echo "Running tests for all services..."
	cd srcs/requirements/backend/user-service && npm test
	cd srcs/requirements/backend/chat-service && npm test
	cd srcs/requirements/backend/game-service && npm test
	cd srcs/requirements/backend/blockchain-service && npm test
	cd srcs/requirements/frontend && npm test

# Start only the frontend service
frontend:
	@echo "Starting frontend service..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up frontend

# Start all backend services
backend:
	@echo "Starting all backend services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up user-service game-service chat-service blockchain-service

# Start infrastructure services (ELK, Prometheus)
infra:
	@echo "Starting infrastructure services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up elasticsearch logstash kibana prometheus grafana

# Deploy smart contracts to Fuji testnet
blockchain:
	@echo "Deploying smart contracts to Fuji testnet..."
	cd srcs/requirements/backend/blockchain-service && forge create src/TournamentScores.sol:TournamentScores --rpc-url $$FUJI_RPC_URL --private-key $$PRIVATE_KEY --verify

# Database migrations
migrate:
	@echo "Running database migrations..."
	cd srcs/requirements/backend/user-service && npm run migrate
	cd srcs/requirements/backend/chat-service && npm run migrate
	cd srcs/requirements/backend/game-service && npm run migrate

# Development helpers
dev-frontend:
	@echo "Starting frontend in development mode..."
	cd srcs/requirements/frontend && npm run dev

dev-backend:
	@echo "Starting backend services in development mode..."
	cd srcs/requirements/backend/user-service && npm run dev &
	cd srcs/requirements/backend/chat-service && npm run dev &
	cd srcs/requirements/backend/game-service && npm run dev &
	cd srcs/requirements/backend/blockchain-service && npm run dev &

# Production deployment
prod: build run
	@echo "Production deployment complete!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:4000"
	@echo "Grafana: http://localhost:3001"
	@echo "Kibana: http://localhost:5601"
