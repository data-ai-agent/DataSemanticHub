#!/bin/bash

################################################################################
# run-migrations.sh
# 
# 功能：执行数据库迁移，支持全量迁移和单服务迁移
# 
# 使用方法：
#   ./deploy/scripts/run-migrations.sh              # 执行所有启用的服务
#   ./deploy/scripts/run-migrations.sh system-service  # 只执行指定服务
#   ./deploy/scripts/run-migrations.sh --dry-run    # 预演模式（不实际执行）
#   ./deploy/scripts/run-migrations.sh --check      # 检查模式（只显示待执行的迁移）
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST_FILE="$PROJECT_ROOT/deploy/migrations/migration-manifest.yaml"

# 参数解析
SERVICE_FILTER=""
DRY_RUN=false
CHECK_MODE=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --check)
            CHECK_MODE=true
            shift
            ;;
        *)
            SERVICE_FILTER="$arg"
            ;;
    esac
done

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DataSemanticHub - 数据库迁移执行器                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠️  预演模式：不会实际执行迁移${NC}"
    echo ""
fi

if [ "$CHECK_MODE" = true ]; then
    echo -e "${CYAN}🔍 检查模式：显示待执行的迁移${NC}"
    echo ""
fi

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

# 检查数据库连接
echo -e "${CYAN}🔌 检查数据库连接...${NC}"

DB_HOST=$(yq eval '.database.host' "$MANIFEST_FILE" | envsubst)
DB_PORT=$(yq eval '.database.port' "$MANIFEST_FILE" | envsubst)
DB_NAME=$(yq eval '.database.name' "$MANIFEST_FILE")
DB_USER=$(yq eval '.database.user' "$MANIFEST_FILE" | envsubst)
DB_PASSWORD=$(yq eval '.database.password' "$MANIFEST_FILE" | envsubst)

# 如果环境变量未设置，使用默认值
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}

echo "   主机: $DB_HOST:$DB_PORT"
echo "   数据库: $DB_NAME"
echo "   用户: $DB_USER"
echo ""

# 读取执行策略
FAIL_FAST=$(yq eval '.execution.fail_fast' "$MANIFEST_FILE")
VERBOSE=$(yq eval '.execution.verbose' "$MANIFEST_FILE")

# 统计变量
TOTAL_SERVICES=0
SUCCESS_SERVICES=0
FAILED_SERVICES=0

# 读取启用的服务列表
SERVICES=$(yq eval '.services[] | select(.enabled == true) | .name' "$MANIFEST_FILE")

if [ -z "$SERVICES" ]; then
    echo -e "${YELLOW}⚠️  没有启用的服务${NC}"
    exit 0
fi

echo -e "${GREEN}📋 待执行的服务:${NC}"
for service in $SERVICES; do
    if [ -n "$SERVICE_FILTER" ] && [ "$service" != "$SERVICE_FILTER" ]; then
        continue
    fi
    
    display_name=$(yq eval ".services[] | select(.name == \"$service\") | .display_name" "$MANIFEST_FILE")
    language=$(yq eval ".services[] | select(.name == \"$service\") | .language" "$MANIFEST_FILE")
    echo "   • $service ($display_name) - $language"
    ((TOTAL_SERVICES++))
done
echo ""

if [ $TOTAL_SERVICES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  没有匹配的服务${NC}"
    exit 0
fi

# 开始执行迁移
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 开始执行数据库迁移...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

START_TIME=$(date +%s)

for service in $SERVICES; do
    # 如果指定了服务过滤，跳过不匹配的
    if [ -n "$SERVICE_FILTER" ] && [ "$service" != "$SERVICE_FILTER" ]; then
        continue
    fi
    
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  服务: ${service}${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    # 读取服务配置
    display_name=$(yq eval ".services[] | select(.name == \"$service\") | .display_name" "$MANIFEST_FILE")
    language=$(yq eval ".services[] | select(.name == \"$service\") | .language" "$MANIFEST_FILE")
    up_command=$(yq eval ".services[] | select(.name == \"$service\") | .migration_tool.up_command" "$MANIFEST_FILE")
    status_command=$(yq eval ".services[] | select(.name == \"$service\") | .migration_tool.status_command" "$MANIFEST_FILE")
    
    echo "   名称: $display_name"
    echo "   语言: $language"
    echo ""
    
    # 显示模块信息
    echo -e "${CYAN}   📦 模块列表:${NC}"
    modules=$(yq eval ".services[] | select(.name == \"$service\") | .modules[].name" "$MANIFEST_FILE")
    for module in $modules; do
        module_display=$(yq eval ".services[] | select(.name == \"$service\") | .modules[] | select(.name == \"$module\") | .display_name" "$MANIFEST_FILE")
        current_version=$(yq eval ".services[] | select(.name == \"$service\") | .modules[] | select(.name == \"$module\") | .current_version" "$MANIFEST_FILE")
        echo "      • $module ($module_display) - v$current_version"
    done
    echo ""
    
    # 检查模式：显示状态后跳过执行
    if [ "$CHECK_MODE" = true ]; then
        if [ "$status_command" != "null" ] && [ -n "$status_command" ]; then
            echo -e "${CYAN}   📊 当前状态:${NC}"
            cd "$PROJECT_ROOT"
            eval $status_command || true
        fi
        echo ""
        continue
    fi
    
    # 执行迁移
    echo -e "${CYAN}   ⏳ 执行迁移命令:${NC}"
    echo "      $up_command"
    echo ""
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}   [预演模式] 跳过实际执行${NC}"
        ((SUCCESS_SERVICES++))
    else
        # 切换到项目根目录执行
        cd "$PROJECT_ROOT"
        
        # 执行迁移命令
        SERVICE_START=$(date +%s)
        if eval $up_command; then
            SERVICE_END=$(date +%s)
            SERVICE_TIME=$((SERVICE_END - SERVICE_START))
            echo ""
            echo -e "${GREEN}   ✅ 迁移成功 (耗时: ${SERVICE_TIME}秒)${NC}"
            ((SUCCESS_SERVICES++))
        else
            SERVICE_END=$(date +%s)
            SERVICE_TIME=$((SERVICE_END - SERVICE_START))
            echo ""
            echo -e "${RED}   ❌ 迁移失败 (耗时: ${SERVICE_TIME}秒)${NC}"
            ((FAILED_SERVICES++))
            
            if [ "$FAIL_FAST" = true ]; then
                echo -e "${RED}   🛑 fail_fast=true，中止后续迁移${NC}"
                break
            fi
        fi
    fi
    
    echo ""
done

# 结束统计
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📊 迁移执行完成${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "   总服务数: $TOTAL_SERVICES"
echo -e "   ${GREEN}成功: $SUCCESS_SERVICES${NC}"
if [ $FAILED_SERVICES -gt 0 ]; then
    echo -e "   ${RED}失败: $FAILED_SERVICES${NC}"
fi
echo "   总耗时: ${TOTAL_TIME}秒"
echo ""

if [ $FAILED_SERVICES -gt 0 ]; then
    echo -e "${RED}⚠️  部分服务迁移失败，请检查日志${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 所有迁移执行成功！${NC}"
fi
