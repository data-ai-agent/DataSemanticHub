#!/bin/bash

# DataSemanticHub - Migration Runner
# Runs SQL migrations per service using local mysql client (idempotent).

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    cat <<'EOF'
Usage: ./scripts/run-migrations.sh [--service NAME] [--all] [--env-file PATH]

Options:
  --service NAME   Run migrations for a single service (e.g. system-service)
  --all            Run migrations for all services (default)
  --env-file PATH  Load DB config from a specific env file (default: deploy/.env)
  -h, --help       Show help
EOF
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Detection: Container vs Local
if [ -d "/services/app" ]; then
    # Container mode
    REPO_DIR="/"
    SERVICES_DIR="/services/app"
    echo "Running in Container mode. Services dir: $SERVICES_DIR"
else
    # Local mode
    REPO_DIR="$(dirname "$DEPLOY_DIR")"
    SERVICES_DIR="$REPO_DIR/services/app"
fi

ENV_FILE="$DEPLOY_DIR/.env"
SERVICE_NAME=""
RUN_ALL=true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --service)
            SERVICE_NAME="${2:-}"
            RUN_ALL=false
            shift 2
            ;;
        --all)
            RUN_ALL=true
            SERVICE_NAME=""
            shift
            ;;
        --env-file)
            ENV_FILE="${2:-}"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown argument: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}DataSemanticHub - Migration Runner${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Save command-line environment variables (they have higher priority)
SAVED_DB_HOST="${DB_HOST:-}"
SAVED_DB_PORT="${DB_PORT:-}"
SAVED_DB_NAME="${DB_NAME:-}"
SAVED_DB_USER="${DB_USER:-}"
SAVED_DB_PASSWORD="${DB_PASSWORD:-}"
SAVED_DB_TYPE="${DB_TYPE:-}"

if [ -f "$ENV_FILE" ]; then
    # Load environment variables from file
    set -o allexport
    source "$ENV_FILE"
    set +o allexport
else
    echo -e "${YELLOW}Notice: env file not found at ${ENV_FILE}. Using environment variables.${NC}"
fi

# Restore command-line environment variables (they override .env file)
if [[ -n "$SAVED_DB_HOST" ]]; then DB_HOST="$SAVED_DB_HOST"; fi
if [[ -n "$SAVED_DB_PORT" ]]; then DB_PORT="$SAVED_DB_PORT"; fi
if [[ -n "$SAVED_DB_NAME" ]]; then DB_NAME="$SAVED_DB_NAME"; fi
if [[ -n "$SAVED_DB_USER" ]]; then DB_USER="$SAVED_DB_USER"; fi
if [[ -n "$SAVED_DB_PASSWORD" ]]; then DB_PASSWORD="$SAVED_DB_PASSWORD"; fi
if [[ -n "$SAVED_DB_TYPE" ]]; then DB_TYPE="$SAVED_DB_TYPE"; fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-datasemantichub}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_TYPE="${DB_TYPE:-mariadb}" # Default to mariadb

if [[ -z "$DB_NAME" || -z "$DB_USER" ]]; then
    echo -e "${RED}Error: DB_NAME and DB_USER must be set${NC}"
    exit 1
fi

MYSQL_BIN=""
if command -v mysql >/dev/null 2>&1; then
    MYSQL_BIN="mysql"
elif command -v mariadb >/dev/null 2>&1; then
    MYSQL_BIN="mariadb"
else
    echo -e "${RED}Error: mysql client not found (mysql or mariadb)${NC}"
    exit 1
fi

MYSQL_BASE=( "$MYSQL_BIN" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -N -s )
if [[ -n "$DB_PASSWORD" ]]; then
    MYSQL_BASE+=( "-p${DB_PASSWORD}" )
fi

mysql_exec_no_db() {
    "${MYSQL_BASE[@]}" -e "$1"
}

mysql_exec() {
    "${MYSQL_BASE[@]}" "$DB_NAME" -e "$1"
}

sql_escape() {
    echo "$1" | sed "s/'/''/g"
}

checksum_file() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    else
        shasum -a 256 "$1" | awk '{print $1}'
    fi
}

echo -e "${BLUE}Connecting to ${DB_HOST}:${DB_PORT}/${DB_NAME}...${NC}"
mysql_exec_no_db "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql_exec "CREATE TABLE IF NOT EXISTS schema_migrations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    service VARCHAR(128) NOT NULL,
    filename VARCHAR(256) NOT NULL,
    checksum CHAR(64) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_service_filename (service, filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"

if [[ ! -d "$SERVICES_DIR" ]]; then
    echo -e "${RED}Error: services directory not found: ${SERVICES_DIR}${NC}"
    exit 1
fi

services=()
if [[ "$RUN_ALL" == true ]]; then
    while IFS= read -r dir; do
        service="$(basename "$dir")"
        if find "$dir/migrations" -type f -name "*.sql" -print -quit >/dev/null 2>&1; then
            services+=( "$service" )
        fi
    done < <(find "$SERVICES_DIR" -mindepth 1 -maxdepth 1 -type d | sort)
else
    services+=( "$SERVICE_NAME" )
fi

if [[ ${#services[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No services with migrations found.${NC}"
    exit 0
fi

applied=0
skipped=0

for service in "${services[@]}"; do
    service_dir="$SERVICES_DIR/$service"
    migrations_dir="$service_dir/migrations"
    
    # Check for DB-specific migrations (e.g., migrations/mariadb)
    if [[ -d "$migrations_dir/$DB_TYPE" ]]; then
        echo -e "${BLUE}  Using ${DB_TYPE} migrations for ${service}${NC}"
        migrations_dir="$migrations_dir/$DB_TYPE"
    fi

    if [[ ! -d "$migrations_dir" ]]; then
        echo -e "${YELLOW}Skip ${service}: no migrations directory${NC}"
        continue
    fi

    echo ""
    echo -e "${BLUE}Service: ${service}${NC}"
    found_any=false
    while IFS= read -r file; do
        found_any=true
        rel_file="${file#$migrations_dir/}"
        checksum="$(checksum_file "$file")"
        service_esc="$(sql_escape "$service")"
        file_esc="$(sql_escape "$rel_file")"

        existing_checksum="$(mysql_exec "SELECT checksum FROM schema_migrations WHERE service='${service_esc}' AND filename='${file_esc}' LIMIT 1;")"
        if [[ -n "$existing_checksum" ]]; then
            if [[ "$existing_checksum" == "$checksum" ]]; then
                echo -e "${YELLOW}  Skip ${rel_file} (already applied)${NC}"
                skipped=$((skipped + 1))
                continue
            fi
            echo -e "${RED}  Checksum mismatch for ${rel_file}. Applied=${existing_checksum} Current=${checksum}${NC}"
            exit 1
        fi

        echo -e "${GREEN}  Apply ${rel_file}${NC}"
        "${MYSQL_BASE[@]}" "$DB_NAME" < "$file"
        mysql_exec "INSERT INTO schema_migrations (service, filename, checksum) VALUES ('${service_esc}', '${file_esc}', '${checksum}');"
        applied=$((applied + 1))
    done < <(find "$migrations_dir" -type f -name "*.sql" | sort)

    if [[ "$found_any" == false ]]; then
        echo -e "${YELLOW}  No migration files found${NC}"
    fi
done

echo ""
echo -e "${GREEN}Done. Applied: ${applied}, Skipped: ${skipped}.${NC}"
