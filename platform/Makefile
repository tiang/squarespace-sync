.PHONY: infra up down logs db-reset admin parent-portal

ENV_FILE := .env

# Start GCP emulators only (firebase, postgres, gcs)
infra:
	docker compose -f docker-compose.infra.yml --env-file $(ENV_FILE) up -d

# Start full stack (infra + api + admin)
up:
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) up -d

# Stop all containers (keep volumes)
down:
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) down

# Tail logs for all services
logs:
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) logs -f

# Drop postgres data volume and recreate (schema reset)
db-reset:
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) stop postgres
	docker volume rm platform_postgres_data || true
	docker compose -f docker-compose.yml --env-file $(ENV_FILE) up -d postgres

# Start admin dev server locally (without Docker)
admin:
	cd admin && npm run dev

# Start parent portal dev server locally (without Docker)
parent-portal:
	cd parent-portal && npm run dev
