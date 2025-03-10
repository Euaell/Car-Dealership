.PHONY: help dev start stop restart logs clean test test-backend test-frontend build seed migrate rollback lint format

# Default target
help:
	@echo "Car Dealership Management System"
	@echo ""
	@echo "Usage:"
	@echo "  make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  help           Show this help message"
	@echo "  dev            Start the development environment"
	@echo "  start          Start the application in production mode"
	@echo "  stop           Stop running containers"
	@echo "  restart        Restart all containers"
	@echo "  logs           Show logs from all containers"
	@echo "  logs-backend   Show logs from backend container"
	@echo "  logs-frontend  Show logs from frontend container"
	@echo "  clean          Remove all containers, volumes, and networks"
	@echo "  test           Run all tests"
	@echo "  test-backend   Run backend tests"
	@echo "  test-frontend  Run frontend tests"
	@echo "  build          Build all Docker images"
	@echo "  seed           Run database seeders"
	@echo "  migrate        Run database migrations"
	@echo "  rollback       Rollback last database migration"
	@echo "  lint           Run linting on both frontend and backend"
	@echo "  format         Format code using Prettier"

# Development
dev:
	docker-compose up

# Start in detached mode (production)
start:
	docker-compose up -d

# Stop all containers
stop:
	docker-compose down

# Restart all containers
restart:
	docker-compose restart

# Show logs from all containers
logs:
	docker-compose logs -f

# Show logs from backend container
logs-backend:
	docker-compose logs -f backend

# Show logs from frontend container
logs-frontend:
	docker-compose logs -f frontend

# Remove all containers, volumes, and networks
clean:
	docker-compose down -v --remove-orphans

# Run all tests
test: test-backend test-frontend

# Run backend tests
test-backend:
	docker-compose exec backend npm test

# Run frontend tests
test-frontend:
	docker-compose exec frontend npm test

# Build all Docker images
build:
	docker-compose build

# Run database seeders
seed:
	docker-compose exec backend npm run db:seed

# Run database migrations
migrate:
	docker-compose exec backend npm run db:migrate

# Rollback last database migration
rollback:
	docker-compose exec backend npm run db:migrate:undo

# Run linting on both frontend and backend
lint:
	docker-compose exec backend npm run lint
	docker-compose exec frontend npm run lint

# Format code using Prettier
format:
	docker-compose exec backend npm run format
	docker-compose exec frontend npm run format

# Create a new migration
migration:
	@read -p "Enter migration name: " name; \
	docker-compose exec backend npx sequelize-cli migration:generate --name $$name

# Generate API documentation
docs:
	docker-compose exec backend npm run docs

# Create a production build
prod-build:
	docker-compose -f docker-compose.prod.yml build

# Start production environment
prod-start:
	docker-compose -f docker-compose.prod.yml up -d

# Monitor containers
monitor:
	docker stats 