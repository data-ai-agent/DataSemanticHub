# 权限模板功能迁移验证指南

本文档旨在通过实现「权限模板 (Permission Template)」功能，全流程验证我们的**数据库迁移 (Database Migration)** 与 **部署 (Deployment)** 方案的可靠性。

---

## 📅 1. 验证目标

1.  **迁移工具链验证**：确认 `make migrate-create` 和 `go-migrate` 工具能否正确管理版本化的 SQL 文件。
2.  **数据结构验证**：验证 JSON 类型字段在 MySQL 中的兼容性（用于存储 `permissions` 字段）。
3.  **部署流程验证**：确认在服务重新部署后，数据库 Schema 能否自动或通过标准命令保持同步。

---

## 🚀 Step 1: 数据库迁移 (Database Migration)

### 1.1 创建迁移文件
在 `services/app/system-service` 目录下执行以下命令，生成版本迁移文件。

```bash
cd services/app/system-service
make migrate-create MODULE=system NAME=create_permission_templates
```

> **预期输出**：
> 在 `migrations/versions/system/` 目录下生成两个文件：
> - `20260127xxxxx_create_permission_templates.up.sql`
> - `20260127xxxxx_create_permission_templates.down.sql`

### 1.2 编写 SQL 定义 (DDL)

编辑生成的 **`.up.sql`** 文件，填入以下内容：

```sql
-- 开启事务（如果支持）
BEGIN;

-- 创建权限模板表
CREATE TABLE IF NOT EXISTS `sys_permission_templates` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(64) NOT NULL DEFAULT '' COMMENT '模板名称',
  `code` varchar(64) NOT NULL DEFAULT '' COMMENT '模板编码',
  `description` varchar(255) NOT NULL DEFAULT '' COMMENT '描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态 1:草稿 2:已发布 3:停用',
  `scope_hint` varchar(32) NOT NULL DEFAULT '未设置' COMMENT '适用范围提示',
  `module_count` int(11) NOT NULL DEFAULT '0' COMMENT '覆盖模块数',
  `permissions` json DEFAULT NULL COMMENT '权限配置详情(JSON格式)',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为系统默认模板',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`, `deleted_at`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统权限模板表';

COMMIT;
```

编辑生成的 **`.down.sql`** 文件，填入回滚逻辑：

```sql
DROP TABLE IF EXISTS `sys_permission_templates`;
```

### 1.3 执行本地迁移

执行以下命令将变更应用到本地数据库：

```bash
make migrate-up
```

> **验证方法**：
> 连接数据库，执行 `DESC sys_permission_templates;`，确认表结构正确创建。

---

## 💻 Step 2: 后端代码生成 (Code Generation)

### 2.1 更新 API 定义
编辑 `api/doc/api.api` (或 `system.api`)，添加权限模板的接口定义。

```go
type (
    // 列表请求
    PermissionTemplateListReq {
        Page int64 `form:"page,default=1"`
        PageSize int64 `form:"page_size,default=20"`
        Keyword string `form:"keyword,optional"`
        Status int64 `form:"status,optional"`
    }
    // 列表响应
    PermissionTemplateListResp {
        Total int64 `json:"total"`
        List []PermissionTemplateDetail `json:"list"`
    }
    // 模板详情
    PermissionTemplateDetail {
        Id string `json:"id"`
        Name string `json:"name"`
        Code string `json:"code"`
        Description string `json:"description"`
        Status string `json:"status"` // 前端展示用文本
        StatusValue int64 `json:"status_value"` // 后端存储值
        ScopeHint string `json:"scope_hint"`
        ModuleCount int64 `json:"module_count"`
        Permissions interface{} `json:"permissions"` // JSON对象
        UpdatedAt string `json:"updated_at"`
    }
    // ... 创建/更新请求定义略
)

@server(
    group: permission_template
    prefix: /api/v1/system/permission-templates
    jwt: Auth
)
service system-api {
    @handler List
    get / (PermissionTemplateListReq) returns (PermissionTemplateListResp)
    
    @handler Detail
    get /:id (PermissionTemplateDetailReq) returns (PermissionTemplateDetailResp)
    
    @handler Create
    post / (PermissionTemplateCreateReq) returns (PermissionTemplateCreateResp)
    
    @handler Update
    put /:id (PermissionTemplateUpdateReq) returns (PermissionTemplateUpdateResp)
    
    @handler Delete
    delete /:id (PermissionTemplateDeleteReq) returns (PermissionTemplateDeleteResp)
}
```

### 2.2 生成代码
使用 `goctl` 生成 API 和 Model 代码：

```bash
# 生成 Model (确保在 migrations 目录下有对应的 Model 配置，或使用 datasource 模式)
# 如果使用 SQL 生成 Model:
goctl model mysql ddl -src ./migrations/versions/system/*.sql -dir ./model -c

# 生成 API
make api
```

---

## 🚢 Step 3: 构建与重启服务 (Build & Restart)

为了验证后端逻辑，我们需要在独立的 Docker 环境中构建并重启服务。

### 3.1 环境准备
确保您在 `services/app/system-service/deploy/docker/` 目录下创建了 `.env` 文件，并配置了正确的数据库密码。

```bash
# 示例：复制模板（如果有）或手动创建
cp deploy/docker/.env.example deploy/docker/.env
# 确保 DB_PASSWORD 与您迁移时使用的一致
```

### 3.2 部署方式选择

**Option A: 独立微服务部署 (开发推荐)**
在 `services/app/system-service` 目录下执行：
```bash
# 1. 构建并启动
docker compose -f deploy/docker/docker-compose.yaml up -d --build api

# 2. 验证日志
docker compose -f deploy/docker/docker-compose.yaml logs -f api
```

**Option B: 项目级集成部署**
如果您希望在完整的项目上下文中运行（使用根目录的 `deploy/docker-compose.yaml`）：

1. **目录切换**: 回到项目根目录 `DataSemanticHub/`。
2. **执行命令**:
   ```bash
   # 为 system-service 重新构建并启动
   docker compose -f deploy/docker-compose.yaml up -d --build system-service
   ```
3. **⚠️ 数据一致性警告**:
   项目级部署使用 `mariadb` 服务，而独立部署使用 `mysql` 服务。
   如果您刚才的 Migration 是针对独立部署的数据库执行的（localhost:3306 映射到了 mysql 容器），那么切换到项目级部署时，连接的将是另一个全新的 `mariadb` 数据库，**表结构和数据将不存在**！
   
   **解决方法**: 
   - 确保在根目录部署启动后，再次针对根目录的数据库端口（通常也是 3306，需确认未冲突）执行 Migration。

### 3.3 验证数据库连接
服务启动后，它会自动连接 `docker-compose.yaml` 中配置的数据库。
如果您的迁移是在**宿主机**执行的（连接 `localhost` 数据库），而 Docker 里的服务连接的是 **容器内** 的 MySQL（`db` 服务），请确保两边的数据是同步的，或者您直接连接 Docker 的 MySQL 端口（通常映射为宿主机的 3306）执行了迁移。

### 3.4 手动触发 Docker 内迁移（可选）
如果希望验证容器内的迁移执行能力，可以进入 API 容器执行：

```bash
# 进入容器
docker exec -it system-service-api sh

# 确认迁移文件存在
ls -l migrations/versions/system/

# 执行迁移 (容器内已内置 migrate 工具或通过 make 执行)
# 注意：容器内连接数据库应使用服务名（如 mysql 或 db）而不是 localhost
migrate -path migrations/versions/system -database "mysql://root:$DB_PASSWORD@tcp(mysql:3306)/DataSemanticHub" up
```

### 3.5 最终验证 checklist
- [ ] 执行 `docker ps` 确认 `system-service-api` 状态为 Up。
- [ ] 查看日志无 `Access denied` 或 `Unknown database` 错误。
- [ ] 前端页面能正常加载，不再显示 502/504 错误。

---

## 📝 附录：Makefile 命令速查

| 命令 | 作用 |
| :--- | :--- |
| `make migrate-create MODULE=xxx NAME=xxx` | 创建新的迁移 SQL 文件 |
| `make migrate-up` | 执行所有未执行的迁移 (Up) |
| `make migrate-down` | 回滚最近一次迁移 (Down) |
| `make migrate-status` | 查看当前迁移版本状态 |
