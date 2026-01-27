#!/bin/bash

# DataSemanticHub Package Script
# Generates a deployment package with standardized images and configurations.

set -e

# Configuration
PROJECT_NAME="datasemantichub"
DEFAULT_REGISTRY="docker.io/library"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$SCRIPT_DIR"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"
OUTPUT_DIR="$DEPLOY_DIR/release"
SERVICES_ROOT="$PROJECT_ROOT/services/app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    echo "Usage: ./package.sh [VERSION] [OPTIONS]"
    echo ""
    echo "Arguments:"
    echo "  VERSION            Release version (e.g. v1.0.0). Required."
    echo ""
    echo "Options:"
    echo "  --skip-build       Skip docker build"
    echo "  --offline          Generate offline image archive (slow)"
    echo "  --registry URL     Docker registry prefix (default: $DEFAULT_REGISTRY)"
    echo "  -h, --help        Show this help"
    exit 1
}

# Parse Args
if [ $# -eq 0 ]; then
    usage
fi

VERSION=$1
if [[ "$VERSION" == --* ]]; then
    echo -e "${RED}Error: Version argument required as first parameter${NC}"
    usage
fi
shift

SKIP_BUILD=false
OFFLINE_MODE=false
REGISTRY=$DEFAULT_REGISTRY

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --offline)
            OFFLINE_MODE=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}DataSemanticHub Packager ${VERSION}${NC}"
echo -e "${GREEN}=====================================${NC}"
echo "Project Root: $PROJECT_ROOT"
echo "Registry:     $REGISTRY"
echo "Skip Build:   $SKIP_BUILD"
echo "Offline Mode: $OFFLINE_MODE"
echo ""

# 1. Clean & Prepare Output Directory
# -----------------------------------
echo -e "${BLUE}[1/5] Preparing workspace...${NC}"
RELEASE_DIR="$OUTPUT_DIR/$PROJECT_NAME-$VERSION"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"/{migrations,config,scripts}

# 2. Build Docker Images
# -----------------------------------
echo -e "${BLUE}[2/5] Building Docker images...${NC}"

if [ "$SKIP_BUILD" == "false" ]; then
    # Modify build.sh to accept TAG
    # We'll use docker compose build command directly to ensure .env usage
    
    # Export TAG for docker-compose interpolation if needed, though we use `docker build` usually or `compose build`
    # Our build.sh uses `docker compose build` which uses .env
    # We want to override the tag. Docker compose usually takes tag from env or defaults to latest.
    # Let's check docker-compose.yaml image definitions. They don't have explicit tags usually unless specified.
    # We need to tag them manually after build or ensure compose uses variable.
    
    # Better approach: Use `docker compose build` which builds `latest`, then tag them.
    
    cd "$DEPLOY_DIR"
    
    # Run build script
    ./scripts/build.sh
    
    # Tag images
    echo "Tagging images with $VERSION..."
    IMAGES=("system-service" "agent-service" "data-connection" "frontend" "migrator")
    
    for svc in "${IMAGES[@]}"; do
        SRC_IMG="${PROJECT_NAME}-${svc}:latest" # Default compose name
        TARGET_IMG="${REGISTRY}/${PROJECT_NAME}-${svc}:${VERSION}"
        
        # Check if local image exists (it might be named differently by compose)
        # Compose v2 defaults to "project_service"
        # Our compose project name defaults to directory name "deploy" -> "deploy-system-service"
        # BUT container_name is set.
        # Let's verify image names created by `scripts/build.sh`.
        # `scripts/build.sh` runs `docker compose build`.
        # Image names will be derived from `image` field if present, or `project_service`.
        # In docker-compose.yaml:
        # system-service: no image name specified -> deploy-system-service
        # mariadb: image: mariadb:11 -> external
        
        # We need to find the built image ID and tag it.
        # The service names are: system-service, agent-service, data-connection, frontend, migrator
        
        COMPOSE_IMAGE_NAME="deploy-${svc}"
        
        if docker image inspect "$COMPOSE_IMAGE_NAME" >/dev/null 2>&1; then
            docker tag "$COMPOSE_IMAGE_NAME" "$TARGET_IMG"
            echo -e "  Tagged ${GREEN}$TARGET_IMG${NC}"
        elif docker image inspect "${PROJECT_NAME}-${svc}" >/dev/null 2>&1; then # Try alternative name
             docker tag "${PROJECT_NAME}-${svc}" "$TARGET_IMG"
             echo -e "  Tagged ${GREEN}$TARGET_IMG${NC}"
        else
            echo -e "${YELLOW}Warning: Image for $svc not found, skipping tag${NC}"
        fi
    done
else
    echo "Skipping build as requested."
fi

# 3. Collect Resources (SQL & Config)
# -----------------------------------
echo -e "${BLUE}[3/5] Collecting resources...${NC}"

# SQL Migrations
echo "  Copying SQL migrations..."
# Find all services with migrations
for dir in "$SERVICES_ROOT"/*/; do
    svc_name=$(basename "$dir")
    if [ -d "$dir/migrations" ]; then
        mkdir -p "$RELEASE_DIR/migrations/$svc_name"
        cp -r "$dir/migrations/"* "$RELEASE_DIR/migrations/$svc_name/"
        echo "    - $svc_name"
    fi
done

# Config Files
echo "  Copying configurations..."
for dir in "$SERVICES_ROOT"/*/; do
    svc_name=$(basename "$dir")
    if [ -d "$dir/etc" ]; then
        mkdir -p "$RELEASE_DIR/config/$svc_name"
        cp -r "$dir/etc/"* "$RELEASE_DIR/config/$svc_name/"
        echo "    - $svc_name"
    fi
done

# Copy Env Example
cp "$DEPLOY_DIR/.env.example" "$RELEASE_DIR/.env.example"

# 4. Generate Production Compose File
# -----------------------------------
echo -e "${BLUE}[4/5] Generating manifest...${NC}"

# Create docker-compose-prod.yaml
# We use sed to replace/insert image tags and structure
# Note: This is a simplified generation. For complex cases, use 'docker compose config'
# But 'docker compose config' expands variables which we might want to keep dynamic.

# We will copy the base yaml and use sed to inject image tags for our custom services.
cp "$DEPLOY_DIR/docker-compose.yaml" "$RELEASE_DIR/docker-compose.yaml"

# Regex replacements for our services to use the versioned image
# Valid for: system-service, agent-service, data-connection, frontend, migrator
SERVICES=("system-service" "agent-service" "data-connection" "frontend" "migrator")

for svc in "${SERVICES[@]}"; do
    # Regex: Find service definition and inject image line if missing or replace.
    # Since our dev compose file uses 'build:' and no 'image:', we need to add 'image:'.
    # However, for production, we usually REMOVE 'build:' and ADD 'image:'.
    
    # We will use a python one-liner for reliable YAML manipulation if available, or simplesed.
    # Let's trust a simple sed strategy: Append `image: ...` after `container_name: ...`
    
    IMG_NAME="${REGISTRY}/${PROJECT_NAME}-${svc}:${VERSION}"
    
    # Replace build block with image (Simple approach: just add image, docker compose prefers image over build if pull policy allows, but we want to remove build)
    # Actually, for a clean prod file, we should strip 'build' keys.
    
    # Let's use a temporary yaml processor if possible.
    # Since we don't have yq installed guaranteed, we will rely on a helper script or just keep it simple.
    
    # We'll generate a 'docker-compose.override.yaml' that sets the images? 
    # No, single file is better for distribution.
    
    echo "  Setting image for $svc to $IMG_NAME"
    # Mac/Linux sed compatibility
    SED_CMD="sed"
    if [[ "$OSTYPE" == "darwin"* ]]; then SED_CMD="sed -i ''"; else SED_CMD="sed -i"; fi
    
    # 1. Add image field
    # 2. Remove build context (Optional, but cleaner)
    # Finding the line 'container_name: datasemantichub-svc' and appending 'image: ...' next line
    
    # Note: escape slashes in registry url
    ESCAPED_IMG=$(echo $IMG_NAME | sed 's/\//\\\//g')
    
    # Pattern: look for container_name: datasemantichub-$svc, append image below it
    $SED_CMD "/container_name: datasemantichub-$svc/a\\
    image: $ESCAPED_IMG" "$RELEASE_DIR/docker-compose.yaml"
    
done

# Remove build keys (Naive approach, might be fragile, so we skip deleting build keys.
# Presence of build keys is fine if image exists locally or remote)

# 5. Archive
# -----------------------------------
echo -e "${BLUE}[5/5] Archiving...${NC}"

# Scripts
cp "$DEPLOY_DIR/scripts/"*.sh "$RELEASE_DIR/scripts/"
chmod +x "$RELEASE_DIR/scripts/"*

# Offline Images
if [ "$OFFLINE_MODE" == "true" ]; then
    echo "  Saving docker images (may take a while)..."
    mkdir -p "$RELEASE_DIR/images"
    
    # Save our services
    for svc in "${SERVICES[@]}"; do
        docker save "${REGISTRY}/${PROJECT_NAME}-${svc}:${VERSION}" -o "$RELEASE_DIR/images/${svc}.tar"
    done
    
    # Save base services (redis, mariadb...) - Read from compose?
    # For now skip base services in this demo script.
fi

# Tarball
ARCHIVE_NAME="${PROJECT_NAME}-${VERSION}.tar.gz"
cd "$OUTPUT_DIR"
tar -czf "$ARCHIVE_NAME" "$PROJECT_NAME-$VERSION"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}SUCCESS! Package created:${NC}"
echo -e "${GREEN}$OUTPUT_DIR/$ARCHIVE_NAME${NC}"
echo -e "${GREEN}=====================================${NC}"
