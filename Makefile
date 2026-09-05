# ThreatCast Monorepo Makefile

.PHONY: help install dev test lint build up down demo ingest-demo

help:
	@echo "ThreatCast - Predictive Cyber Defence Platform"
	@echo ""
	@echo "Available commands:"
	@echo "  make install     - Install Python and Node.js dependencies"
	@echo "  make test        - Run Python and frontend test suites"
	@echo "  make build       - Build production frontend bundle"
	@echo "  make dev         - Start FastAPI backend and Vite frontend"
	@echo "  make up          - Start all services with Docker Compose"
	@echo "  make down        - Stop all Docker Compose services"
	@echo "  make demo        - Seed database and launch local interactive demo"
	@echo "  make ingest-demo - Replay 5-stage synthetic cyber attack telemetry"

install:
	python3 -m venv venv || true
	./venv/bin/pip install -r requirements.txt
	./venv/bin/pip install greenlet
	cd frontend && npm install

test:
	PYTHONPATH=. ./venv/bin/pytest tests/ -v
	cd frontend && npm run typecheck

build:
	cd frontend && npm run build

dev:
	@echo "Starting Backend and Frontend in development mode..."
	./venv/bin/uvicorn backend.app.main:app --reload --port 8000 &
	cd frontend && npm run dev -- --port 3000

up:
	docker-compose up -d

down:
	docker-compose down

demo:
	./scripts/start-demo.sh

ingest-demo:
	PYTHONPATH=. ./venv/bin/python3 scripts/ingest_demo.py
