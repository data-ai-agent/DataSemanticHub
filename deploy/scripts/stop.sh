#!/bin/bash

# DataSemanticHub - Stop Script
# This script stops all Docker services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}DataSemanticHub - Stop Script${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Change to deploy directory
cd "$DEPLOY_DIR"

# Parse arguments
KEEP_VOLUMES=false
if [ "$1" == "--keep-volumes" ] || [ "$1" == "-k" ]; then
    KEEP_VOLUMES=true
fi

# Stop services
echo "Stopping all services..."
docker compose down

if [ "$KEEP_VOLUMES" == false ]; then
    echo -e "${YELLOW}Removing volumes...${NC}"
    docker compose down -v
else
    echo -e "${YELLOW}Keeping volumes (data preserved)${NC}"
fi

echo ""
echo -e "${GREEN}All services stopped successfully!${NC}"
echo ""

if [ "$KEEP_VOLUMES" == true ]; then
    echo "Note: Data volumes have been preserved."
    echo "To completely remove data, run: ./scripts/clean.sh"
fi
