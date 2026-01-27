# 数据库迁移管理指南

本文档说明 DataSemanticHub 项目的数据库迁移管理机制。

## 📋 目录

- [架构设计](#架构设计)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [工作流程](#工作流程)
- [常用命令](#常用命令)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [故障排查](#故障排查)

---

## 架构设计

### 混合方案

DataSemanticHub 采用**混合迁移管理方案**：

1. **初始化脚本** (`deploy/init-scripts/`): 用于新环境首次部署
2. **增量迁移** (`services/app/*/migrations/`): 用于版本升级

### 关键特性

✅ **多服务支持**: system-service (Go)、data-connection (Java)、metadata-service (Python)  
✅ **多模块管理**: 每个服务可包含多个业务模块  
✅ **统一版本追踪**: 所有服务共享 `schema_migrations` 表  
✅ **自动化工具**: 脚本自动生成初始化Schema和执行迁移  

---

## 目录结构

```
DataSemanticHub/
├── deploy/
│   ├── init-scripts/                    # 新环境初始化脚本
│   └── migrations/
│       └── migration-manifest.yaml      # 服务配置清单
│
└── services/app/
    ├── system-service/
    │   ├── migrations/
    │   │   ├── versions/                # 🟢 [正式] 版本化迁移文件
    │   │   │   ├── system/
    │   │   │   │   ├── 000001_init_menus.up.sql
    │   │   │   │   └── 000001_init_menus.down.sql
    │   │   │   └── user/
    │   │   │
    │   │   └── raw/                     # 🟡 [参考] ORM自动生成的原始SQL
    │   │       ├── system/
    │   │       │   └── menus.sql
    │   │       └── user/
    │   │
    │   └── Makefile                     # 迁移命令
    │
    └── ...
```

---

## 快速开始

### 前置要求

1. **安装迁移工具**
   ```bash
   brew install golang-migrate yq
   ```

2. **配置环境变量**
   ```bash
   cp deploy/.env.example deploy/.env
   ```

---

## 工作流程

### 1. 目录分层策略

- **versions/** (Source of Truth): 存放正式的、带版本号的迁移脚本。部署工具**仅读取此目录**。
- **raw/** (Reference): 存放 ORM 自动生成或手动编写的原始建表语句。**不参与部署**，仅供开发参考。

### 2. 处理代码生成 (ORM) 的 workflow

如果不处理代码生成，可跳过此步。

1.  **生成代码**: 运行 ORM 工具生成 SQL，保存到 `migrations/raw/system/xxx.sql`。
2.  **对比差异**: 比较 `raw/` 下的新 SQL 与现有数据库结构的差异。
3.  **创建迁移**:
    ```bash
    make migrate-create MODULE=system NAME=update_from_orm
    ```
4.  **填充内容**: 将差异部分的 SQL 复制到生成的 `.up.sql` 中，并编写对应的 `.down.sql`。

### 场景A: 新环境首次部署

```bash
# 1. 启动MariaDB容器
cd deploy
docker-compose up -d mariadb

# MariaDB会自动执行 init-scripts/ 下的SQL
# - 00-create-database.sql: 创建数据库和版本表
# - 01-init-schemas.sql: 创建所有表结构
# - 02-seed-data.sql: 插入种子数据

# 2. 启动应用服务
docker-compose up -d
```

### 场景B: 现有环境版本升级

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 执行迁移
cd deploy
./scripts/run-migrations.sh

# 3. 重启服务
docker-compose up -d --build
```

---

## 工作流程

### 初始化 vs 增量迁移

| 维度 | 初始化（init-scripts） | 增量迁移（migrations） |
|------|----------------------|----------------------|
| **执行时机** | 新环境首次部署 | 版本升级 |
| **执行方式** | Docker自动执行 | 手动或CI/CD触发 |
| **内容** | 完整的初始Schema | 增量变更SQL |
| **版本号** | 无版本号 | 严格版本号 |
| **幂等性** | IF NOT EXISTS | 由工具保证 |

### 版本追踪

所有服务共享 `schema_migrations` 表：

```sql
CREATE TABLE `schema_migrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `service` VARCHAR(64) NOT NULL,      -- 服务名: system-service, data-connection
    `module` VARCHAR(64) NOT NULL,       -- 模块名: system, user, mariadb
    `version` BIGINT NOT NULL,           -- 版本号: 1, 2, 3...
    `name` VARCHAR(255) NOT NULL,        -- 迁移名称
    `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `execution_time` INT,
    `success` BOOLEAN DEFAULT TRUE,
    UNIQUE KEY `uk_service_module_version` (`service`, `module`, `version`)
);
```

**示例数据：**

| service | module | version | name | applied_at |
|---------|--------|---------|------|------------|
| system-service | system | 1 | init_menus | 2026-01-27 09:00:00 |
| system-service | system | 2 | add_icon_to_menus | 2026-01-27 10:00:00 |
| system-service | user | 1 | create_users | 2026-01-27 09:00:00 |
| data-connection | mariadb | 1 | init_datasource | 2026-01-27 09:00:00 |

---

## 常用命令

### 全局命令（deploy/scripts/）

```bash
# 生成初始化脚本（每次发版前执行）
./deploy/scripts/generate-init-schemas.sh

# 执行所有服务的迁移
./deploy/scripts/run-migrations.sh

# 只执行指定服务
./deploy/scripts/run-migrations.sh system-service

# 预演模式（不实际执行）
./deploy/scripts/run-migrations.sh --dry-run

# 检查模式（显示待执行的迁移）
./deploy/scripts/run-migrations.sh --check

# 查看迁移状态
./deploy/scripts/check-migration-status.sh
```

### system-service命令（Go）

```bash
cd services/app/system-service

# 执行迁移
make migrate-up

# 回滚迁移
make migrate-down

# 查看状态
make migrate-status

# 创建新迁移
make migrate-create MODULE=system NAME=add_new_field

# 安装迁移工具
make install-migrate-tool
```

### data-connection命令（Java）

```bash
cd services/app/data-connection

# 执行迁移
mvn flyway:migrate

# 查看状态
mvn flyway:info

# 清空数据库（危险）
mvn flyway:clean
```

### metadata-service命令（Python）

```bash
cd services/app/metadata-service

# 执行迁移
alembic upgrade head

# 查看状态
alembic current

# 回滚
alembic downgrade -1

# 创建新迁移
alembic revision -m "add new table"
```

---

## 开发指南

### 创建新迁移（system-service示例）

#### 步骤1: 创建迁移文件

```bash
cd services/app/system-service
make migrate-create MODULE=system NAME=add_menu_permissions
```

生成文件：
- `migrations/system/000003_add_menu_permissions.up.sql`
- `migrations/system/000003_add_menu_permissions.down.sql`

#### 步骤2: 编辑SQL文件

**000003_add_menu_permissions.up.sql:**
```sql
-- 添加菜单权限字段

ALTER TABLE `menus`
ADD COLUMN `requires_permission` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否需要权限验证';

CREATE TABLE `menu_permissions` (
    `id` CHAR(36) NOT NULL,
    `menu_id` CHAR(36) NOT NULL,
    `permission_code` VARCHAR(128) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_menu_id` (`menu_id`)
);
```

**000003_add_menu_permissions.down.sql:**
```sql
-- 回滚菜单权限

DROP TABLE IF EXISTS `menu_permissions`;

ALTER TABLE `menus`
DROP COLUMN `requires_permission`;
```

#### 步骤3: 测试迁移

```bash
# 执行迁移
make migrate-up

# 验证结果
mysql -h localhost -u root -p datasemantichub -e "DESC menus;"

# 测试回滚
make migrate-down
make migrate-up
```

#### 步骤4: 更新初始化脚本

```bash
cd ../../deploy
./scripts/generate-init-schemas.sh
```

#### 步骤5: 提交代码

```bash
git add services/app/system-service/migrations/
git add deploy/init-scripts/mariadb/01-init-schemas.sql
git commit -m "feat: 添加菜单权限管理"
git push
```

---

## 部署指南

### CI/CD集成

**GitHub Actions示例:**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: 检查数据库状态
        id: check_db
        run: |
          if docker exec mariadb mysql -u root -p${{ secrets.DB_PASSWORD }} \
             -e "SELECT 1 FROM schema_migrations LIMIT 1" 2>/dev/null; then
            echo "mode=upgrade" >> $GITHUB_OUTPUT
          else
            echo "mode=init" >> $GITHUB_OUTPUT
          fi
      
      - name: 初始化数据库
        if: steps.check_db.outputs.mode == 'init'
        run: docker-compose up -d mariadb
      
      - name: 执行迁移
        if: steps.check_db.outputs.mode == 'upgrade'
        run: ./deploy/scripts/run-migrations.sh
      
      - name: 部署服务
        run: docker-compose up -d --build
```

### 发版流程

#### 发版前检查清单

- [ ] 所有新迁移已创建并测试
- [ ] 执行 `./deploy/scripts/generate-init-schemas.sh`
- [ ] 更新 `deploy/migrations/migration-manifest.yaml` 中的版本号
- [ ] 提交所有变更到Git
- [ ] 创建Git标签（如 `v1.1.0`）

#### 发版命令

```bash
# 1. 生成初始化脚本
./deploy/scripts/generate-init-schemas.sh

# 2. 更新版本号
vim deploy/migrations/migration-manifest.yaml
# version: "1.1.0"

# 3. 提交
git add .
git commit -m "chore: 发布v1.1.0"
git tag v1.1.0
git push origin main --tags

# 4. 部署
./deploy/scripts/run-migrations.sh
docker-compose up -d --build
```

---

## 故障排查

### 问题1: 迁移执行失败

**症状:**
```
❌ system-service 迁移失败
Error: Dirty database version 1. Fix and force version.
```

**原因:** 上次迁移执行失败，数据库版本被标记为dirty

**解决:**
```bash
cd services/app/system-service

# 检查状态
make migrate-status

# 手动修复问题后，强制设置版本
make migrate-force MODULE=system V=1

# 重新执行
make migrate-up
```

### 问题2: 版本冲突

**症状:** 两个开发者创建了相同版本号的迁移

**解决:**
```bash
# 重命名冲突的迁移文件
# 从 000003_xxx 改为 000004_xxx

# 或删除其中一个，合并到另一个
```

### 问题3: init-schemas.sql过时

**症状:** 新环境部署后缺少某些表

**原因:** 忘记执行 `generate-init-schemas.sh`

**解决:**
```bash
./deploy/scripts/generate-init-schemas.sh
git add deploy/init-scripts/mariadb/01-init-schemas.sql
git commit -m "fix: 更新初始化脚本"
```

### 问题4: 数据库连接失败

**症状:**
```
❌ 错误: 无法连接到数据库
```

**解决:**
```bash
# 检查环境变量
cat deploy/.env | grep DB_

# 检查MariaDB是否启动
docker-compose ps mariadb

# 手动测试连接
mysql -h localhost -P 3306 -u root -p
```

---

## 最佳实践

### DO ✅

1. ✅ 每次添加新迁移后运行 `generate-init-schemas.sh`
2. ✅ 在开发环境测试迁移的up和down
3. ✅ 为每个迁移编写清晰的注释
4. ✅ 使用语义化的迁移名称（如 `add_user_phone_field`）
5. ✅ 在迁移中使用 `IF NOT EXISTS` 提高幂等性

### DON'T ❌

1. ❌ 不要修改已执行的迁移文件（创建新迁移代替）
2. ❌ 不要在生产环境直接修改数据库（必须通过迁移）
3. ❌ 不要跳过版本号（保持顺序连续）
4. ❌ 不要在迁移中包含DROP DATABASE等危险操作
5. ❌ 不要忘记编写down迁移（回滚逻辑）

---

## 相关文档

- [golang-migrate官方文档](https://github.com/golang-migrate/migrate)
- [Flyway官方文档](https://flywaydb.org/documentation/)
- [Alembic官方文档](https://alembic.sqlalchemy.org/)

---

**最后更新:** 2026-01-27  
**维护者:** DataSemanticHub Team
