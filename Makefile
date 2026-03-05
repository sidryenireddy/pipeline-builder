.PHONY: up down dev test build lint clean

up:
	docker compose up -d

down:
	docker compose down

dev:
	docker compose up -d postgres
	$(MAKE) -j3 dev-api dev-engine dev-frontend

dev-api:
	cd api && go run ./cmd/server

dev-engine:
	cd engine && uvicorn pipeline_engine.main:app --reload --port 8001

dev-frontend:
	cd frontend && npm run dev

build:
	docker compose build

test:
	cd api && go test ./...
	cd engine && pytest
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
