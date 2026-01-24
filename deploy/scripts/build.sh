#!/bin/bash

# DataSemanticHub - Build Script
# This script builds all Docker images for the project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}DataSemanticHub - Build Script${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Change to deploy directory
cd "$DEPLOY_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Copying from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file and set proper values before deployment${NC}"
fi

# Function to build a specific service
build_service() {
    local service=$1
    echo -e "${GREEN}Building $service...${NC}"
    docker compose build --no-cache $service
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $service built successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to build $service${NC}"
        return 1
    fi
}

# If argument provided, build only that service
if [ -n "$1" ]; then
    echo "Building service: $1"
    build_service "$1"
    exit $?
fi

# Build all services
echo "Building all services..."
echo ""

SERVICES=("system-service" "agent-service" "data-connection" "frontend")
FAILED_SERVICES=()

for service in "${SERVICES[@]}"; do
    if ! build_service "$service"; then
        FAILED_SERVICES+=("$service")
    fi
    echo ""
done

# Summary
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Build Summary${NC}"
echo -e "${GREEN}=====================================${NC}"

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All services built successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Failed services:${NC}"
    for service in "${FAILED_SERVICES[@]}"; do
        echo -e "${RED}  - $service${NC}"
    done
    exit 1
fi
