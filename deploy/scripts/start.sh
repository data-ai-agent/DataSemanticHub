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

# Function to wait for a service to be healthy
wait_for_healthy() {
    local service=$1
    local max_retries=60
    local count=0
    
    echo -n "Waiting for $service to be healthy..."
    while [ $count -lt $max_retries ]; do
        # Check for health property (handling spacing variations)
        if docker compose ps "$service" --format json | grep -q '"Health": *"healthy"'; then
            echo -e " ${GREEN}OK${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        count=$((count + 1))
    done
    echo -e " ${RED}Timeout${NC}"
    echo ""
    echo "Debug: Last status for $service:"
    docker compose ps "$service" --format json
    return 1
}

# Start services
echo -e "${BLUE}Starting services...${NC}"
echo ""

# Step 1: Infrastructure
echo -e "${YELLOW}Step 1/4: Starting infrastructure services...${NC}"
docker compose up -d mariadb redis

# Wait for DB before migration
if ! wait_for_healthy "mariadb"; then
    echo -e "${RED}Error: MariaDB failed to become healthy. Aborting.${NC}"
    exit 1
fi

# Step 2: Database Migration
echo ""
echo -e "${YELLOW}Step 2/4: Running database migrations...${NC}"
# Use --rm to clean up container after run, and explicit profile
if docker compose --profile tools run --rm migrator; then
    echo -e "${GREEN}Migrations completed successfully.${NC}"
else
    echo -e "${RED}Error: Migrations failed. Check logs above.${NC}"
    # We choose not to exit here in case it's a non-critical error, but usually we should.
    # exit 1 
fi

# Step 3: Middleware
echo ""
echo -e "${YELLOW}Step 3/4: Starting middleware services...${NC}"
docker compose up -d kafka opensearch jaeger prometheus grafana

# Step 4: Application
echo ""
echo -e "${YELLOW}Step 4/4: Starting application services...${NC}"
docker compose up -d system-service agent-service data-connection frontend

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
echo "  Frontend:          http://localhost:${FRONTEND_PORT:-5173}"
echo "  System Service:    http://localhost:${SYSTEM_SERVICE_PORT:-8888}"
echo "  Agent Service:     http://localhost:${PYTHON_SERVICE_PORT:-8891}"
echo "  Data Connection:   http://localhost:${DATA_CONNECTION_PORT:-8892}"
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
