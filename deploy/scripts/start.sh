#!/bin/bash

# DataSemanticHub - Start Script
# This script starts all Docker services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}DataSemanticHub - Start Script${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Change to deploy directory
cd "$DEPLOY_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please copy .env.example to .env and configure it first:"
    echo "  cp .env.example .env"
    exit 1
fi

# Load environment variables
source .env

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: docker compose is not available${NC}"
    echo "Please install Docker Desktop or Docker Compose plugin"
    exit 1
fi

# Start services
echo -e "${BLUE}Starting all services...${NC}"
echo ""

# Start infrastructure services first
echo -e "${YELLOW}Step 1/3: Starting infrastructure services...${NC}"
docker compose up -d mariadb redis

echo "Waiting for infrastructure services to be healthy..."
sleep 10

# Start middleware services
echo ""
echo -e "${YELLOW}Step 2/3: Starting middleware services...${NC}"
docker compose up -d kafka opensearch jaeger prometheus grafana

echo "Waiting for middleware services to be ready..."
sleep 15

# Start application services
echo ""
echo -e "${YELLOW}Step 3/3: Starting application services...${NC}"
docker compose up -d system-service frontend

echo ""
echo -e "${GREEN}All services started!${NC}"
echo ""

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Service Status${NC}"
echo -e "${BLUE}=====================================${NC}"
docker compose ps

# Display access information
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Service Access Information${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}Application Services:${NC}"
echo "  Frontend:        http://localhost:${FRONTEND_PORT:-5173}"
echo "  System Service:  http://localhost:${SYSTEM_SERVICE_PORT:-8888}"
echo ""
echo -e "${BLUE}Monitoring & Observability:${NC}"
echo "  Grafana:         http://localhost:${GRAFANA_PORT:-3000} (admin/admin)"
echo "  Prometheus:      http://localhost:${PROMETHEUS_PORT:-9090}"
echo "  Jaeger:          http://localhost:${JAEGER_UI_PORT:-16686}"
echo ""
echo -e "${BLUE}Data Services:${NC}"
echo "  MariaDB:         localhost:${DB_PORT:-3306}"
echo "  Redis:           localhost:${REDIS_PORT:-6379}"
echo "  OpenSearch:      http://localhost:${OPENSEARCH_PORT:-9200}"
echo "  Kafka:           localhost:${KAFKA_PORT:-9092}"
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Tips:"
echo "  - View logs: ./scripts/logs.sh [service-name]"
echo "  - Stop all:  ./scripts/stop.sh"
echo "  - Clean all: ./scripts/clean.sh"
echo ""
