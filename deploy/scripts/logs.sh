#!/bin/bash

# DataSemanticHub - Logs Script
# This script displays logs for services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Change to deploy directory
cd "$DEPLOY_DIR"

# Parse arguments
FOLLOW=false
SERVICE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        *)
            SERVICE="$1"
            shift
            ;;
    esac
done

# Display logs
if [ -z "$SERVICE" ]; then
    echo -e "${BLUE}Showing logs for all services...${NC}"
    echo "Press Ctrl+C to stop"
    echo ""
    
    if [ "$FOLLOW" == true ]; then
        docker compose logs -f
    else
        docker compose logs --tail=100
    fi
else
    echo -e "${BLUE}Showing logs for $SERVICE...${NC}"
    echo "Press Ctrl+C to stop"
    echo ""
    
    if [ "$FOLLOW" == true ]; then
        docker compose logs -f "$SERVICE"
    else
        docker compose logs --tail=100 "$SERVICE"
    fi
fi
