#!/bin/bash

# DataSemanticHub - Init Go Workspace Script
# This script initializes and updates the Go workspace configuration

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
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Go Workspace Initialization${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

cd "$PROJECT_ROOT"

# Check if services/app directory exists
if [ ! -d "services/app" ]; then
    echo -e "${RED}Error: services/app directory not found${NC}"
    exit 1
fi

# Find all Go modules
echo -e "${BLUE}Scanning for Go modules...${NC}"
GO_MODULES=()

for dir in services/app/*/; do
    if [ -f "${dir}go.mod" ]; then
        module_path=$(echo "$dir" | sed 's:/$::')
        GO_MODULES+=("$module_path")
        echo -e "${GREEN}  Found: $module_path${NC}"
    fi
done

if [ ${#GO_MODULES[@]} -eq 0 ]; then
    echo -e "${YELLOW}No Go modules found${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Creating go.work file...${NC}"

# Create go.work file
cat > go.work << EOF
go 1.24

use (
EOF

for module in "${GO_MODULES[@]}"; do
    echo "    ./$module" >> go.work
done

cat >> go.work << EOF
)
EOF

echo -e "${GREEN}✓ go.work file created${NC}"
echo ""

# Display the content
echo -e "${BLUE}go.work content:${NC}"
echo "---"
cat go.work
echo "---"
echo ""

# Run go work sync
echo -e "${BLUE}Running go work sync...${NC}"
if command -v go &> /dev/null; then
    go work sync
    echo -e "${GREEN}✓ Go workspace synchronized${NC}"
else
    echo -e "${YELLOW}Warning: go command not found, skipping sync${NC}"
    echo "Make sure to run 'go work sync' when Go is available"
fi

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Go workspace initialized successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Modules included:"
for module in "${GO_MODULES[@]}"; do
    echo "  - $module"
done
echo ""
