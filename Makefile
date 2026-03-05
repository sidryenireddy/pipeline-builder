.PHONY: up down dev dev-api dev-engine dev-frontend test build lint clean stop-dev

up:
	docker compose up -d

down:
	docker compose down

dev:
	@echo "Starting API on :8000, Engine on :8001, Frontend on :3000"
	@$(MAKE) dev-api &
	@$(MAKE) dev-engine &
	@$(MAKE) dev-frontend &
	@wait

dev-api:
	cd api && go run ./cmd/server

dev-engine:
	cd engine && .venv/bin/python -m uvicorn pipeline_engine.main:app --reload --port 8001

dev-frontend:
	cd frontend && npm run dev

stop-dev:
	-pkill -f "go run ./cmd/server" 2>/dev/null || true
	-pkill -f "uvicorn pipeline_engine" 2>/dev/null || true
	-pkill -f "next dev" 2>/dev/null || true

build:
	docker compose build

test:
	cd api && go test ./...
	cd engine && python3 -m pytest
	cd frontend && npm test

lint:
	cd api && golangci-lint run
	cd engine && ruff check .
	cd frontend && npm run lint

migrate:
	cd api && go run ./cmd/server migrate

generate-spec:
	cd spec && npx @redocly/cli bundle openapi.yaml -o bundle.yaml

clean:
	docker compose down -v
	rm -rf frontend/.next frontend/node_modules
