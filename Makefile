.PHONY: help setup db api frontend dev test lint clean

PYTHON  ?= python3
VENV    := .venv
PIP     := $(VENV)/bin/pip
UV      := $(VENV)/bin/uvicorn
ST      := $(VENV)/bin/streamlit

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Environment ───────────────────────────────────────────────────────────────

setup: ## Create virtualenv and install dependencies
	$(PYTHON) -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "\nSetup complete. Activate with: source $(VENV)/bin/activate"

env: ## Copy .env.example → .env (first-time setup)
	@test -f .env || (cp .env.example .env && echo "Created .env — fill in your credentials")

# ── Database ──────────────────────────────────────────────────────────────────

db: ## Start PostGIS container only
	docker compose up -d db
	@echo "Waiting for PostGIS to be ready..."
	@sleep 3
	@docker compose exec db psql -U postgres -d oceanmind -c "SELECT PostGIS_Version();"

db-init: ## Run schema.sql against running DB
	psql -U $${POSTGRES_USER:-postgres} \
	     -h $${POSTGRES_HOST:-localhost} \
	     -d $${POSTGRES_DB:-oceanmind} \
	     -f backend/db/schema.sql

db-stop: ## Stop the database container
	docker compose stop db

# ── Running services ──────────────────────────────────────────────────────────

api: ## Run FastAPI backend (dev, hot-reload)
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

frontend: ## Run Streamlit dashboard
	streamlit run frontend/app.py --server.port 8501

dev: ## Start DB + API + frontend (full local stack)
	@$(MAKE) db
	@echo "Starting API in background..."
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
	@sleep 2
	streamlit run frontend/app.py --server.port 8501

docker-up: ## Start full stack via Docker Compose
	docker compose up --build

docker-down: ## Tear down Docker Compose stack
	docker compose down

# ── Testing ───────────────────────────────────────────────────────────────────

test: ## Run test suite
	$(PYTHON) -m pytest tests/ -v

test-phase-a: ## Run Phase A integration tests
	$(PYTHON) tests/test_phase_a.py

# ── Code quality ──────────────────────────────────────────────────────────────

lint: ## Run ruff linter
	ruff check backend/ frontend/ tests/

format: ## Auto-format with ruff
	ruff format backend/ frontend/ tests/

# ── Misc ──────────────────────────────────────────────────────────────────────

clean: ## Remove __pycache__, .pytest_cache, generated artefacts
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete
	rm -rf backend/rag/faiss_index/
	@echo "Clean complete."
