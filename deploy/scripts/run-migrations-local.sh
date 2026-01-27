#!/bin/bash

# 本地执行迁移脚本（从宿主机运行）
# 此脚本会临时覆盖 DB_HOST 为 localhost

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_SCRIPT="$SCRIPT_DIR/run-migrations.sh"

# 从宿主机运行时，使用 localhost 而不是容器名
export DB_HOST="${DB_HOST:-localhost}"

# 执行原始迁移脚本
exec "$MIGRATION_SCRIPT" "$@"
