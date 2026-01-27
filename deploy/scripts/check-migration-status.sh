#!/bin/bash

################################################################################
# check-migration-status.sh
# 
# 功能：检查数据库迁移状态，显示各服务和模块的当前版本
# 
# 使用方法：
#   ./deploy/scripts/check-migration-status.sh
#   ./deploy/scripts/check-migration-status.sh system-service  # 只查看指定服务
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST_FILE="$PROJECT_ROOT/deploy/migrations/migration-manifest.yaml"

SERVICE_FILTER="${1:-}"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DataSemanticHub - 迁移状态检查器                            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查依赖
if ! command -v yq &> /dev/null; then
    echo -e "${RED}❌ 错误: 未安装 yq 工具${NC}"
    echo -e "${YELLOW}   请安装: brew install yq${NC}"
    exit 1
fi

# 检查manifest文件
if [ ! -f "$MANIFEST_FILE" ]; then
    echo -e "${RED}❌ 错误: 未找到配置文件 $MANIFEST_FILE${NC}"
    exit 1
fi

# 读取数据库配置
DB_HOST=$(yq eval '.database.host' "$MANIFEST_FILE" | envsubst)
DB_PORT=$(yq eval '.database.port' "$MANIFEST_FILE" | envsubst)
DB_NAME=$(yq eval '.database.name' "$MANIFEST_FILE")
DB_USER=$(yq eval '.database.user' "$MANIFEST_FILE" | envsubst)
DB_PASSWORD=$(yq eval '.database.password' "$MANIFEST_FILE" | envsubst)

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}

echo -e "${CYAN}🔍 数据库信息:${NC}"
echo "   主机: $DB_HOST:$DB_PORT"
echo "   数据库: $DB_NAME"
echo ""

# 检查数据库连接和schema_migrations表是否存在
echo -e "${CYAN}🔌 检查数据库连接...${NC}"

if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ 无法连接到数据库${NC}"
    exit 1
fi

if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1 FROM schema_migrations LIMIT 1;" &> /dev/null; then
    echo -e "${YELLOW}⚠️  schema_migrations表不存在，数据库可能未初始化${NC}"
    echo -e "${BLUE}   提示: 运行 ./deploy/scripts/run-migrations.sh 进行初始化${NC}"
    echo ""
    exit 0
fi

echo -e "${GREEN}✅ 数据库连接正常${NC}"
echo ""

# 查询当前数据库中的迁移状态
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📊 数据库迁移状态${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# 读取服务列表
SERVICES=$(yq eval '.services[] | select(.enabled == true) | .name' "$MANIFEST_FILE")

printf "%-20s %-20s %-10s %-15s %s\n" "服务" "模块" "版本" "执行时间" "状态"
echo "────────────────────────────────────────────────────────────────"

for service in $SERVICES; do
    if [ -n "$SERVICE_FILTER" ] && [ "$service" != "$SERVICE_FILTER" ]; then
        continue
    fi
    
    # 读取该服务的所有模块
    modules=$(yq eval ".services[] | select(.name == \"$service\") | .modules[].name" "$MANIFEST_FILE")
    
    for module in $modules; do
        expected_version=$(yq eval ".services[] | select(.name == \"$service\") | .modules[] | select(.name == \"$module\") | .current_version" "$MANIFEST_FILE")
        
        # 查询数据库中的实际版本
        QUERY="SELECT version, applied_at, success FROM schema_migrations WHERE service='$service' AND \`module\`='$module' ORDER BY version DESC LIMIT 1;"
        
        RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "$QUERY" 2>/dev/null || echo "")
        
        if [ -z "$RESULT" ]; then
            # 数据库中没有记录
            printf "%-20s %-20s %-10s %-15s %s\n" \
                "$service" "$module" "无记录" "-" "${YELLOW}未迁移${NC}"
        else
            # 解析结果
            current_version=$(echo "$RESULT" | awk '{print $1}')
            applied_at=$(echo "$RESULT" | awk '{print $2, $3}')
            success=$(echo "$RESULT" | awk '{print $4}')
            
            # 判断状态
            if [ "$success" = "1" ]; then
                if [ "$current_version" -eq "$expected_version" ]; then
                    status="${GREEN}✅ 最新${NC}"
                elif [ "$current_version" -lt "$expected_version" ]; then
                    status="${YELLOW}⚠️  待升级${NC}"
                else
                    status="${CYAN}ℹ️  超前${NC}"
                fi
            else
                status="${RED}❌ 失败${NC}"
            fi
            
            printf "%-20s %-20s %-10s %-15s %s\n" \
                "$service" "$module" "v$current_version/$expected_version" "$applied_at" "$status"
        fi
    done
done

echo ""

# 显示最近的迁移记录
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📜 最近10条迁移记录${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

QUERY="SELECT service, \`module\`, version, name, applied_at, success FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -t -e "$QUERY"

echo ""

# 统计信息
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📈 统计信息${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "SELECT COUNT(*) FROM schema_migrations;" 2>/dev/null)
SUCCESS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "SELECT COUNT(*) FROM schema_migrations WHERE success=1;" 2>/dev/null)
FAILED=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "SELECT COUNT(*) FROM schema_migrations WHERE success=0;" 2>/dev/null)

echo "   总迁移数: $TOTAL"
echo -e "   ${GREEN}成功: $SUCCESS${NC}"
if [ "$FAILED" -gt 0 ]; then
    echo -e "   ${RED}失败: $FAILED${NC}"
fi

echo ""
