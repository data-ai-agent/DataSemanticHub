# 菜单管理技术方案

> **Branch**: `001-menu-management`  
> **Spec Path**: `specs/001-menu-management/`  
> **Created**: 2025-01-25  
> **Status**: Draft

---

## Summary

基于 Go-Zero 微服务架构实现菜单管理模块，提供菜单树查询、CRUD、排序移动、权限绑定、审计日志和 KPI 统计功能。采用 UUID v7 主键、软删除、树形结构存储，支持多维度搜索过滤和风险巡检。

---

## Technical Context

| Item | Value |
|------|-------|
| **Language** | Go 1.24+ |
| **Framework** | Go-Zero v1.9+ |
| **Storage** | MySQL 8.0 |
| **Cache** | Redis 7.0 |
| **ORM** | GORM / SQLx |
| **Testing** | go test |
| **Common Lib** | idrm-go-base v0.1.0+ |

---

## 通用库 (idrm-go-base)

**安装**:
```bash
go get github.com/jinguoxing/idrm-go-base@latest
```

### 模块初始化

| 模块 | 初始化方式 |
|------|-----------|
| validator | `validator.Init()` 在 main.go |
| telemetry | `telemetry.Init(cfg)` 在 main.go |
| response | `httpx.SetErrorHandler(response.ErrorHandler)` |
| middleware | `rest.WithMiddlewares(...)` |

### 自定义错误码

根据功能模块规划错误码范围：

| 功能 | 范围 | 位置 |
|------|------|------|
| 菜单管理 | 200130-200150 | `internal/errorx/codes.go` |

### 第三方库确认

> 如需使用通用库以外的第三方库，请在此列出并说明原因:

| 库 | 原因 | 确认状态 |
|----|------|----------|
| - | - | ✅ 无需额外库 |

---

## Go-Zero 开发流程

按以下顺序完成技术设计和代码生成：

| Step | 任务 | 方式 | 产出 |
|------|------|------|------|
| 1 | 定义 API 文件 | AI 实现 | `api/doc/system/menu_management.api` |
| 2 | 生成 Handler/Types | goctl 生成 | `api/internal/handler/system/`, `types/` |
| 3 | 定义 DDL 文件 | AI 手写 | `migrations/system/menus.sql`, `migrations/system/menu_audit_logs.sql` |
| 4 | 实现 Model 接口 | AI 手写 | `model/system/menus/`, `model/system/menu_audit_logs/` |
| 5 | 实现 Logic 层 | AI 实现 | `api/internal/logic/system/` |

> ⚠️ **重要**：goctl 必须在 `api/doc/api.api` 入口文件上执行，不能针对单个功能文件！

**goctl 命令**:
```bash
# 步骤1：在 api/doc/api.api 中 import 新模块
# 步骤2：执行 goctl 生成代码（针对整个项目）
goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
```

---

## File Structure

### 文件产出清单

| 序号 | 文件 | 生成方式 | 位置 |
|------|------|----------|------|
| 1 | API 文件 | AI 实现 | `api/doc/system/menu_management.api` |
| 2 | DDL 文件 | AI 实现 | `migrations/system/menus.sql`, `migrations/system/menu_audit_logs.sql` |
| 3 | Handler | goctl 生成 | `api/internal/handler/system/` |
| 4 | Types | goctl 生成 | `api/internal/types/` |
| 5 | Logic | AI 实现 | `api/internal/logic/system/` |
| 6 | Model | AI 实现 | `model/system/menus/`, `model/system/menu_audit_logs/` |

### 代码结构

```
api/internal/
├── handler/system/
│   ├── get_menu_tree_handler.go         # goctl 生成
│   ├── get_menu_handler.go
│   ├── create_menu_handler.go
│   ├── update_menu_handler.go
│   ├── delete_menu_handler.go
│   ├── toggle_menu_enabled_handler.go
│   ├── toggle_menu_visible_handler.go
│   ├── move_menu_handler.go
│   ├── reorder_menus_handler.go
│   ├── bind_permission_handler.go
│   ├── get_menu_inspection_handler.go
│   ├── get_menu_stats_handler.go
│   ├── get_menu_audits_handler.go
│   └── routes.go
├── logic/system/
│   ├── get_menu_tree_logic.go           # AI 实现
│   ├── get_menu_logic.go
│   ├── create_menu_logic.go
│   ├── update_menu_logic.go
│   ├── delete_menu_logic.go
│   ├── toggle_menu_enabled_logic.go
│   ├── toggle_menu_visible_logic.go
│   ├── move_menu_logic.go
│   ├── reorder_menus_logic.go
│   ├── bind_permission_logic.go
│   ├── get_menu_inspection_logic.go
│   ├── get_menu_stats_logic.go
│   └── get_menu_audits_logic.go
├── types/
│   └── types.go                         # goctl 生成
└── svc/
    └── servicecontext.go                # 手动维护

model/system/
├── menus/
│   ├── interface.go                    # 接口定义
│   ├── types.go                         # 数据结构
│   ├── vars.go                          # 常量/错误
│   ├── factory.go                       # ORM 工厂
│   ├── gorm_dao.go                      # GORM 实现
│   └── sqlx_model.go                    # SQLx 实现
└── menu_audit_logs/
    ├── interface.go
    ├── types.go
    ├── vars.go
    ├── factory.go
    ├── gorm_dao.go
    └── sqlx_model.go
```

---

## Architecture Overview

遵循 IDRM 分层架构：

```
HTTP Request → Handler → Logic → Model → Database
```

| 层级 | 职责 | 最大行数 |
|------|------|----------|
| Handler | 解析参数、格式化响应 | 30 |
| Logic | 业务逻辑实现 | 50 |
| Model | 数据访问 | 50 |

---

## Constitution Check

### ✅ 强制约束检查

| 规则 | 状态 | 说明 |
|------|------|------|
| 遵循分层架构 | ✅ | Handler → Logic → Model |
| 使用 Model 接口 | ✅ | 支持 GORM 和 SQLx 双 ORM |
| UUID v7 主键 | ✅ | 使用 `CHAR(36)`，服务端生成 |
| 软删除 | ✅ | `deleted_at` 字段，唯一索引包含此字段 |
| 禁止物理外键 | ✅ | 关联关系在 Logic 层维护 |
| 时间精度 | ✅ | 使用 `datetime(3)` 毫秒精度 |
| 中文注释 | ✅ | 所有公开接口必须有中文注释 |
| 错误包装 | ✅ | 使用 `fmt.Errorf("context: %w", err)` |
| 测试覆盖 | ✅ | 核心逻辑 ≥80% |
| 函数行数限制 | ✅ | Handler ≤30, Logic ≤50, Model ≤50 |

### ⚠️ 注意事项

- 菜单树查询需考虑性能，支持按需加载和缓存
- 排序/移动操作需保证事务一致性，防止并发冲突
- 权限绑定需与权限服务联动（如需要创建新权限）
- 审计日志需记录所有变更操作，支持分页查询

---

## Interface Definitions

### Menu Model 接口

```go
type Model interface {
    // Insert 插入菜单
    Insert(ctx context.Context, data *Menu) (*Menu, error)

    // FindOne 根据 ID 查询
    FindOne(ctx context.Context, id string) (*Menu, error)

    // FindOneByCode 根据 code 查询（全局唯一）
    FindOneByCode(ctx context.Context, code string) (*Menu, error)

    // FindTree 查询菜单树（支持搜索和过滤）
    FindTree(ctx context.Context, req *FindTreeReq) ([]*Menu, error)

    // FindChildren 查询子菜单列表
    FindChildren(ctx context.Context, parentId string) ([]*Menu, error)

    // FindChildrenCount 查询子菜单数量
    FindChildrenCount(ctx context.Context, parentId string) (int64, error)

    // Update 更新菜单
    Update(ctx context.Context, data *Menu) error

    // Delete 删除菜单（软删除）
    Delete(ctx context.Context, id string) error

    // UpdateOrder 更新排序（同级）
    UpdateOrder(ctx context.Context, id string, order int) error

    // BatchUpdateOrder 批量更新排序
    BatchUpdateOrder(ctx context.Context, updates []OrderUpdate) error

    // Move 移动菜单到新父级
    Move(ctx context.Context, id string, newParentId *string, newOrder int) error

    // CheckCycle 检查是否形成循环（父节点不能是自身或子孙）
    CheckCycle(ctx context.Context, id string, newParentId string) (bool, error)

    // FindByPath 根据 path 查询（用于冲突检测）
    FindByPath(ctx context.Context, path string) ([]*Menu, error)

    // GetStatistics 获取统计信息
    GetStatistics(ctx context.Context) (*Statistics, error)

    // WithTx 使用事务
    WithTx(tx interface{}) Model

    // Trans 执行事务
    Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}
```

### MenuAuditLog Model 接口

```go
type Model interface {
    // Insert 插入审计日志
    Insert(ctx context.Context, data *MenuAuditLog) (*MenuAuditLog, error)

    // FindList 查询审计日志列表（支持分页和筛选）
    FindList(ctx context.Context, req *FindListReq) ([]*MenuAuditLog, int64, error)

    // WithTx 使用事务
    WithTx(tx interface{}) Model
}
```

---

## Data Model

### DDL - menus 表

**位置**: `migrations/system/menus.sql`

```sql
CREATE TABLE `menus` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `name` VARCHAR(128) NOT NULL COMMENT '菜单名称',
    `code` VARCHAR(128) NOT NULL COMMENT '菜单编码（全局唯一）',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：directory/page/external/button',
    `group_id` VARCHAR(36) DEFAULT NULL COMMENT '菜单分组ID',
    `parent_id` VARCHAR(36) DEFAULT NULL COMMENT '父菜单ID（根节点为空）',
    `path` VARCHAR(255) DEFAULT NULL COMMENT '路由路径（page/directory使用）',
    `route_name` VARCHAR(128) DEFAULT NULL COMMENT '路由名称',
    `component_key` VARCHAR(128) DEFAULT NULL COMMENT '页面组件标识',
    `external_url` VARCHAR(512) DEFAULT NULL COMMENT '外部链接（external类型必填）',
    `open_mode` VARCHAR(20) DEFAULT NULL COMMENT '打开方式：new/iframe/same（external类型必填）',
    `permission_key` VARCHAR(128) DEFAULT NULL COMMENT '权限标识（可选，未绑定时产生风险标记）',
    `visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可见',
    `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
    `order` INT NOT NULL DEFAULT 0 COMMENT '同级排序（同级唯一）',
    `show_in_nav` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否在导航中显示',
    `cacheable` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否可缓存（前端keepAlive）',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `created_by` VARCHAR(36) DEFAULT NULL COMMENT '创建人ID',
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
    `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新人ID',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间（软删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code_deleted` (`code`, `deleted_at`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_type` (`type`),
    KEY `idx_enabled` (`enabled`),
    KEY `idx_visible` (`visible`),
    KEY `idx_permission_key` (`permission_key`),
    KEY `idx_group_id` (`group_id`),
    KEY `idx_path` (`path`),
    KEY `idx_route_name` (`route_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单表';
```

### DDL - menu_audit_logs 表

**位置**: `migrations/system/menu_audit_logs.sql`

```sql
CREATE TABLE `menu_audit_logs` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `menu_id` VARCHAR(36) NOT NULL COMMENT '菜单ID',
    `operation_type` VARCHAR(20) NOT NULL COMMENT '操作类型：create/update/delete/move/reorder/enable/disable/show/hide',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作人ID',
    `operator_name` VARCHAR(128) DEFAULT NULL COMMENT '操作人名称',
    `changed_fields` JSON DEFAULT NULL COMMENT '变更字段（JSON格式）',
    `old_value` JSON DEFAULT NULL COMMENT '旧值（JSON格式）',
    `new_value` JSON DEFAULT NULL COMMENT '新值（JSON格式）',
    `remark` VARCHAR(512) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_menu_id` (`menu_id`),
    KEY `idx_operation_type` (`operation_type`),
    KEY `idx_operator_id` (`operator_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单审计日志表';
```

### Go Struct

```go
// Menu 菜单实体
type Menu struct {
    Id          string         `gorm:"primaryKey;size:36"`  // UUID v7
    Name        string         `gorm:"size:128;not null"`
    Code        string         `gorm:"size:128;not null"`
    Type        string         `gorm:"size:20;not null"`   // directory/page/external/button
    GroupId     *string        `gorm:"size:36"`
    ParentId    *string        `gorm:"size:36;index"`
    Path        *string        `gorm:"size:255;index"`
    RouteName   *string        `gorm:"size:128;index"`
    ComponentKey *string        `gorm:"size:128"`
    ExternalUrl *string         `gorm:"size:512"`
    OpenMode    *string         `gorm:"size:20"`
    PermissionKey *string       `gorm:"size:128;index"`
    Visible     bool            `gorm:"default:1;not null;index"`
    Enabled     bool            `gorm:"default:1;not null;index"`
    Order       int             `gorm:"not null;default:0"`
    ShowInNav   bool            `gorm:"default:1;not null"`
    Cacheable   bool            `gorm:"default:0;not null"`
    CreatedAt   time.Time       `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"`
    CreatedBy   *string         `gorm:"size:36"`
    UpdatedAt   time.Time       `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)"`
    UpdatedBy   *string         `gorm:"size:36"`
    DeletedAt   gorm.DeletedAt  `gorm:"type:datetime(3);index:uk_code_deleted"`
}

// MenuAuditLog 菜单审计日志
type MenuAuditLog struct {
    Id            string    `gorm:"primaryKey;size:36"`
    MenuId        string    `gorm:"size:36;not null;index"`
    OperationType string    `gorm:"size:20;not null;index"`
    OperatorId    *string   `gorm:"size:36;index"`
    OperatorName  *string   `gorm:"size:128"`
    ChangedFields *string   `gorm:"type:json"`
    OldValue      *string   `gorm:"type:json"`
    NewValue      *string   `gorm:"type:json"`
    Remark        *string   `gorm:"size:512"`
    CreatedAt     time.Time `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3);index"`
}
```

---

## API Contract

**位置**: `api/doc/system/menu_management.api`

详见 `contracts/menu_management.api` 文件（Phase 1 生成）

主要接口：
- `GET /api/v1/system/menus/tree` - 菜单树查询
- `GET /api/v1/system/menus/:id` - 菜单详情
- `POST /api/v1/system/menus` - 创建菜单
- `PUT /api/v1/system/menus/:id` - 更新菜单
- `DELETE /api/v1/system/menus/:id` - 删除菜单
- `PATCH /api/v1/system/menus/:id/enabled` - 启用/禁用
- `PATCH /api/v1/system/menus/:id/visible` - 显示/隐藏
- `PATCH /api/v1/system/menus/:id/move` - 移动菜单
- `PATCH /api/v1/system/menus/reorder` - 批量排序
- `POST /api/v1/system/menus/:id/bind-permission` - 绑定权限
- `GET /api/v1/system/menus/inspection` - 风险巡检
- `GET /api/v1/system/menus/stats` - KPI 统计
- `GET /api/v1/system/menus/:id/audits` - 审计日志

---

## Testing Strategy

| 类型 | 方法 | 覆盖率 |
|------|------|--------|
| 单元测试 | 表驱动测试，Mock Model | > 80% |
| 集成测试 | 测试数据库 | 核心流程 |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-25 | - | 初始版本 |
