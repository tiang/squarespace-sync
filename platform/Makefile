.PHONY: infra up down logs db-reset build

ENV_FILE := .env

# Start GCP emulators only (firebase, postgres, gcs)
infra:
	docker compose -f docker-compose.infra.yml --env-file $(ENV_FILE) up -d

# Start full stack (infra + api + web)
up:
	docker compose --env-file $(ENV_FILE) up -d

# Stop all containers (keep volumes)
down:
	docker compose --env-file $(ENV_FILE) down

# Tail logs for all services
logs:
	docker compose --env-file $(ENV_FILE) logs -f

# Drop postgres data volume and recreate (schema reset)
db-reset:
	docker compose --env-file $(ENV_FILE) stop postgres
	docker volume rm platform_postgres_data || true
	docker compose --env-file $(ENV_FILE) up -d postgres

# Rebuild all images (after Dockerfile changes)
build:
	docker compose --env-file $(ENV_FILE) build
