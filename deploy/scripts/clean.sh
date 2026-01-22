#!/bin/bash

# DataSemanticHub - Clean Script
# This script removes all Docker containers, images, and optionally volumes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}=====================================${NC}"
echo -e "${YELLOW}DataSemanticHub - Clean Script${NC}"
echo -e "${YELLOW}=====================================${NC}"
echo ""

# Parse arguments
KEEP_DATA=false
if [ "$1" == "--keep-data" ] || [ "$1" == "-k" ]; then
    KEEP_DATA=true
fi

# Change to deploy directory
cd "$DEPLOY_DIR"

# Warning
if [ "$KEEP_DATA" == false ]; then
    echo -e "${RED}WARNING: This will remove all containers, images, and DATA!${NC}"
    echo -e "${RED}All data in MariaDB, Redis, Kafka, etc. will be PERMANENTLY DELETED!${NC}"
else
    echo -e "${YELLOW}This will remove containers and images, but keep data volumes.${NC}"
fi
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Stop and remove containers
echo "Stopping and removing containers..."
docker compose down

# Remove volumes if requested
if [ "$KEEP_DATA" == false ]; then
    echo -e "${YELLOW}Removing volumes...${NC}"
    docker compose down -v
    
    # Remove data directories
    echo "Removing data directories..."
    rm -rf data/
    rm -rf logs/
fi

# Remove images
echo "Removing images..."
docker compose down --rmi local

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Cleanup completed!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

if [ "$KEEP_DATA" == true ]; then
    echo "Data volumes have been preserved."
    echo "Volume cleanup can be done with: docker volume prune"
else
    echo "All containers, images, and data have been removed."
fi
echo ""
echo "To rebuild and start again, run:"
echo "  ./scripts/build.sh"
echo "  ./scripts/start.sh"
echo ""
