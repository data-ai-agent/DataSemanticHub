#!/bin/bash

################################################################################
# generate-init-schemas.sh
# 
# 功能：从各服务的migrations目录收集SQL迁移文件，生成统一的初始化脚本
# 用途：用于新环境首次部署时一次性创建所有表结构
# 
# 使用方法：
#   ./deploy/scripts/generate-init-schemas.sh
#
# 输出文件：
#   deploy/init-scripts/mariadb/01-init-schemas.sql
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MANIFEST_FILE="$PROJECT_ROOT/deploy/migrations/migration-manifest.yaml"
OUTPUT_FILE="$PROJECT_ROOT/deploy/init-scripts/mariadb/01-init-schemas.sql"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DataSemanticHub - 初始化Schema生成器                        ║${NC}"
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

# 创建临时文件
TEMP_SQL=$(mktemp)
trap "rm -f $TEMP_SQL" EXIT

# 写入文件头
cat > "$TEMP_SQL" << 'EOF'
-- ============================================
-- DataSemanticHub 初始化Schema
-- ============================================
-- 此文件由 generate-init-schemas.sh 自动生成
-- 请勿手动编辑！任何修改应在各服务的 migrations/ 目录中进行
--
EOF

echo "-- 生成时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$TEMP_SQL"
echo "-- 项目版本: $(yq eval '.version' "$MANIFEST_FILE")" >> "$TEMP_SQL"
echo "" >> "$TEMP_SQL"

cat >> "$TEMP_SQL" << 'EOF'
-- 使用数据库
USE `datasemantichub`;

-- ============================================
-- 设置SQL模式
-- ============================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

EOF

echo -e "${GREEN}📋 开始收集迁移文件...${NC}"
echo ""

# 用于记录版本信息
VERSION_RECORDS=""

# 读取所有启用的服务
SERVICES=$(yq eval '.services[] | select(.enabled == true) | .name' "$MANIFEST_FILE")

for SERVICE in $SERVICES; do
    echo -e "${BLUE}📦 处理服务: $SERVICE${NC}"
    
    # 获取服务信息
    DISPLAY_NAME=$(yq eval ".services[] | select(.name == \"$SERVICE\") | .display_name" "$MANIFEST_FILE")
    LANGUAGE=$(yq eval ".services[] | select(.name == \"$SERVICE\") | .language" "$MANIFEST_FILE")
    
    echo "   语言: $LANGUAGE"
    
    # 写入服务分隔符
    cat >> "$TEMP_SQL" << EOF

-- ============================================
-- $DISPLAY_NAME ($SERVICE)
-- ============================================
EOF
    
    # 读取该服务的所有模块
    MODULES=$(yq eval ".services[] | select(.name == \"$SERVICE\") | .modules[].name" "$MANIFEST_FILE")
    
    for MODULE in $MODULES; do
        MODULE_PATH=$(yq eval ".services[] | select(.name == \"$SERVICE\") | .modules[] | select(.name == \"$MODULE\") | .path" "$MANIFEST_FILE")
        MODULE_DISPLAY=$(yq eval ".services[] | select(.name == \"$SERVICE\") | .modules[] | select(.name == \"$MODULE\") | .display_name" "$MANIFEST_FILE")
        CURRENT_VERSION=$(yq eval ".services[] | select(.name == \"$SERVICE\") | .modules[] | select(.name == \"$MODULE\") | .current_version" "$MANIFEST_FILE")
        
        # 解析相对路径
        ABS_MODULE_PATH="$PROJECT_ROOT/deploy/migrations/$MODULE_PATH"
        
        echo -e "   ${GREEN}📂 模块: $MODULE ($MODULE_DISPLAY)${NC}"
        
        if [ ! -d "$ABS_MODULE_PATH" ]; then
            echo -e "   ${YELLOW}⚠️  目录不存在: $ABS_MODULE_PATH (跳过)${NC}"
            continue
        fi
        
        # 写入模块分隔符
        cat >> "$TEMP_SQL" << EOF

-- --------------------------------------------
-- $MODULE_DISPLAY ($MODULE)
-- --------------------------------------------
EOF
        
        # 查找所有 .up.sql 或普通 .sql 文件
        SQL_FILES=$(find "$ABS_MODULE_PATH" -type f \( -name "*.up.sql" -o -name "*.sql" \) | sort)
        
        if [ -z "$SQL_FILES" ]; then
            echo -e "   ${YELLOW}⚠️  未找到SQL文件${NC}"
            continue
        fi
        
        FILE_COUNT=0
        for SQL_FILE in $SQL_FILES; do
            # 跳过 .down.sql 文件
            if [[ "$SQL_FILE" == *".down.sql" ]]; then
                continue
            fi
            
            FILENAME=$(basename "$SQL_FILE")
            echo "      ✓ $FILENAME"
            
            # 写入文件来源注释
            echo "-- 来自: $SQL_FILE" >> "$TEMP_SQL"
            echo "" >> "$TEMP_SQL"
            
            # 追加SQL内容
            cat "$SQL_FILE" >> "$TEMP_SQL"
            echo "" >> "$TEMP_SQL"
            
            ((FILE_COUNT++))
        done
        
        echo "      收集了 $FILE_COUNT 个文件"
        
        # 记录版本信息（用于后续插入schema_migrations表）
        if [ "$CURRENT_VERSION" -gt 0 ]; then
            VERSION_RECORDS="${VERSION_RECORDS}('$SERVICE', '$MODULE', $CURRENT_VERSION, 'auto-init', NOW(), 0, NULL, TRUE),\n"
        fi
    done
    
    echo ""
done

# 添加版本记录插入语句
cat >> "$TEMP_SQL" << 'EOF'

-- ============================================
-- 记录迁移版本（防止重复执行）
-- ============================================
-- 将所有已包含的迁移标记为已执行

INSERT INTO `schema_migrations` 
    (`service`, `module`, `version`, `name`, `applied_at`, `execution_time`, `checksum`, `success`) 
VALUES
EOF

# 移除最后的逗号和换行，添加分号
echo -e "$VERSION_RECORDS" | sed '$ s/,$/;/' >> "$TEMP_SQL"

cat >> "$TEMP_SQL" << 'EOF'

-- ============================================
-- 恢复SQL模式
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Schema initialization completed successfully.' AS message;
SELECT COUNT(*) AS total_migrations FROM schema_migrations;
EOF

# 移动临时文件到目标位置
mkdir -p "$(dirname "$OUTPUT_FILE")"
mv "$TEMP_SQL" "$OUTPUT_FILE"

echo -e "${GREEN}✅ 初始化脚本生成成功！${NC}"
echo -e "${BLUE}   输出文件: $OUTPUT_FILE${NC}"
echo ""

# 显示统计信息
TOTAL_LINES=$(wc -l < "$OUTPUT_FILE")
echo -e "${GREEN}📊 统计信息:${NC}"
echo "   总行数: $TOTAL_LINES"
echo ""

echo -e "${BLUE}💡 提示:${NC}"
echo "   - 新环境部署时，此文件将自动执行"
echo "   - 每次添加新迁移后，应重新生成此文件"
echo "   - 建议在发版前执行: make generate-init-schemas"
echo ""
