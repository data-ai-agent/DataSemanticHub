# Permission Template Technical Plan

> **Branch**: `002-permission-template`
> **Spec Path**: `specs/002-permission-template/`
> **Created**: 2026-01-26
> **Status**: Draft

---

## Summary

本技术方案为权限模板功能提供完整的设计与实现指南。核心决策包括：
1. 使用 Go-Zero 框架构建 RESTful API，遵循项目分层架构（Handler → Logic → Model）
2. 采用 GORM 实现数据访问层，支持复杂查询和事务管理
3. 使用 MySQL 存储模板配置，JSON 字段存储策略矩阵和高级权限点
4. 版本号机制记录模板发布历史，角色关联时记录使用的模板版本
5. 全部 API 响应使用 idrm-go-base 统一响应格式，HTTP 状态码统一为 200，业务异常通过响应体 code 字段表示

---

## Technical Context

| Item | Value |
|------|-------|
| **Language** | Go 1.24+ |
| **Framework** | Go-Zero v1.9+ |
| **Storage** | MySQL 8.0 |
| **Cache** | Redis 7.0 |
| **ORM** | GORM (复杂查询 + 事务管理) |
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

| 功能 | 范围 | 位置 |
|------|------|------|
| 权限模板 | 200151-200175 | `internal/errorx/codes.go` |

### 第三方库确认

| 库 | 原因 | 确认状态 |
|----|------|----------|
| github.com/google/uuid | UUID v7 主键生成 | ✅ 已确认（项目规范要求） |
| github.com/stretchr/testify | 单元测试断言 | ✅ 已确认 |

---

## Go-Zero 开发流程

按以下顺序完成技术设计和代码生成：

| Step | 任务 | 方式 | 产出 |
|------|------|------|------|
| 1 | 定义 API 文件 | AI 实现 | `api/doc/system/permission_template.api` |
| 2 | 生成 Handler/Types | goctl | `api/internal/handler/`, `types/` |
| 3 | 定义 DDL 文件 | AI 实现 | `migrations/system/permission_templates.sql` |
| 4 | 实现 Model 接口 | AI 实现 | `model/system/permission_template/` |
| 5 | 实现 Logic 层 | AI 实现 | `api/internal/logic/` |

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
| 1 | API 文件 | AI 实现 | `api/doc/system/permission_template.api` |
| 2 | DDL 文件 | AI 实现 | `migrations/system/permission_templates.sql` |
| 3 | Handler | goctl 生成 | `api/internal/handler/system/` |
| 4 | Types | goctl 生成 | `api/internal/types/` |
| 5 | Logic | AI 实现 | `api/internal/logic/system/` |
| 6 | Model | AI 实现 | `model/system/permission_template/` |

### 代码结构

```
api/internal/
├── handler/system/
│   ├── create_permission_template_handler.go    # goctl 生成
│   ├── update_permission_template_handler.go
│   ├── get_permission_template_handler.go
│   ├── list_permission_templates_handler.go
│   ├── publish_permission_template_handler.go
│   ├── disable_permission_template_handler.go
│   ├── enable_permission_template_handler.go
│   ├── clone_permission_template_handler.go
│   ├── delete_permission_template_handler.go
│   └── routes.go
├── logic/system/
│   ├── create_permission_template_logic.go      # AI 实现
│   ├── update_permission_template_logic.go
│   ├── get_permission_template_logic.go
│   ├── list_permission_templates_logic.go
│   ├── publish_permission_template_logic.go
│   ├── disable_permission_template_logic.go
│   ├── enable_permission_template_logic.go
│   ├── clone_permission_template_logic.go
│   ├── delete_permission_template_logic.go
│   └── permission_template_common.go            # 共享逻辑
├── types/
│   └── types.go                                 # goctl 生成
└── svc/
    └── servicecontext.go                        # 手动维护

model/system/permission_template/
├── interface.go                                 # 接口定义
├── types.go                                     # 数据结构
├── vars.go                                      # 常量/错误
├── factory.go                                   # GORM 工厂
├── gorm_model.go                                # GORM 实现
└── sqlx_model.go                                # SQLx 实现（可选）
```

---

## Architecture Overview

遵循 IDRM 分层架构：

```
HTTP Request → Handler → Logic → Model → Database
```

| 层级 | 职责 | 最大行数 |
|------|------|----------|
| Handler | 解析参数、调用 validator、格式化响应 | 30 |
| Logic | 业务逻辑实现、状态流转校验、事务管理 | 50 |
| Model | 数据访问、CRUD 操作、统计查询 | 50 |

### 层级规则

**Handler 层**：
- ✅ 使用 validator 校验参数
- ✅ 调用 Logic 层
- ✅ 返回统一响应（使用 idrm-go-base response）
- ❌ 不含业务逻辑
- ❌ 不直接访问数据库

**Logic 层**：
- ✅ 实现业务规则（状态流转、版本管理、编码唯一性）
- ✅ 调用 Model 层
- ✅ 数据转换和错误处理（使用 errorx）
- ❌ 不含 HTTP 相关代码
- ❌ 不直接访问数据库

**Model 层**：
- ✅ 定义数据访问接口
- ✅ 实现 CRUD 操作
- ✅ 实现统计查询（used_by_role_count, last_applied_at）
- ❌ 不含业务逻辑

---

## Constitution Check

### ✅ 符合项

| 规则 | 验证 |
|------|------|
| UUID v7 主键 | ✅ 使用 CHAR(36) 存储主键 |
| 分层架构 | ✅ Handler → Logic → Model |
| Model 接口 | ✅ 支持 GORM 和 SQLx 双 ORM |
| 错误处理 | ✅ 使用 idrm-go-base errorx |
| 响应格式 | ✅ 使用 idrm-go-base response |
| 参数校验 | ✅ 使用 idrm-go-base validator |
| 禁止物理外键 | ✅ 关联关系在 Logic 层维护 |
| 软删除 | ✅ deleted_at 字段 + 唯一索引包含该字段 |
| 时间精度 | ✅ 使用 datetime(3) 毫秒精度 |

### ⚠️ 需要注意

| 规则 | 说明 |
|------|------|
| 测试覆盖 | 需确保核心逻辑测试覆盖率 ≥80% |
| 函数行数 | Logic 层函数需控制在 50 行内，复杂逻辑拆分 |
| 版本管理 | 模板版本号递增逻辑需在事务中完成 |

---

## Interface Definitions

```go
// PermissionTemplate 模板数据访问接口
type PermissionTemplateModel interface {
    // Insert 插入新模板
    Insert(ctx context.Context, data *PermissionTemplate) (*PermissionTemplate, error)

    // FindOne 根据 ID 查询单个模板
    FindOne(ctx context.Context, id string) (*PermissionTemplate, error)

    // FindByCode 根据编码查询模板（用于唯一性校验）
    FindByCode(ctx context.Context, code string) (*PermissionTemplate, error)

    // Update 更新模板
    Update(ctx context.Context, data *PermissionTemplate) error

    // Delete 软删除模板
    Delete(ctx context.Context, id string) error

    // List 查询模板列表（支持筛选和分页）
    List(ctx context.Context, filter *ListFilter) ([]*PermissionTemplate, int64, error)

    // GetUsageStats 获取模板使用统计
    GetUsageStats(ctx context.Context, templateId string) (*UsageStats, error)

    // WithTx 设置事务
    WithTx(tx interface{}) PermissionTemplateModel

    // Trans 事务执行
    Trans(ctx context.Context, fn func(ctx context.Context, model PermissionTemplateModel) error) error
}

// ListFilter 列表查询筛选条件
type ListFilter struct {
    Keyword         string // 名称或编码关键字
    Status          string // 状态筛选
    ScopeSuggestion string // 适用范围筛选
    Page            int
    PageSize        int
}

// UsageStats 使用统计
type UsageStats struct {
    UsedByRoleCount int64     // 被引用角色数
    LastAppliedAt   *time.Time // 最近应用时间
}
```

---

## Data Model

### DDL

**位置**: `migrations/system/permission_templates.sql`

```sql
CREATE TABLE `permission_templates` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `name` VARCHAR(128) NOT NULL COMMENT '模板名称',
    `code` VARCHAR(64) NOT NULL COMMENT '模板编码（全局唯一）',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '模板描述',
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '模板状态：draft/published/disabled',
    `scope_suggestion` VARCHAR(50) DEFAULT NULL COMMENT '推荐适用范围：global/organization/domain/project',
    `policy_matrix` JSON NOT NULL COMMENT '策略矩阵（模块×动作勾选关系）',
    `advanced_perms` JSON DEFAULT NULL COMMENT '高级权限点配置',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号（每次发布递增）',
    `created_by` CHAR(36) NOT NULL COMMENT '创建人ID',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `updated_by` CHAR(36) DEFAULT NULL COMMENT '最后更新人ID',
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '最后更新时间',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间（软删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code_deleted` (`code`, `deleted_at`),
    KEY `idx_status` (`status`),
    KEY `idx_scope_suggestion` (`scope_suggestion`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限模板表';
```

### Go Struct

```go
// PermissionTemplate 权限模板实体
type PermissionTemplate struct {
    Id              string         `gorm:"primaryKey;size:36"`                    // UUID v7
    Name            string         `gorm:"size:128;not null"`                     // 模板名称
    Code            string         `gorm:"size:64;not null;uniqueIndex:uk_code_deleted"` // 模板编码
    Description     string         `gorm:"size:500"`                              // 模板描述
    Status          string         `gorm:"size:20;not null;default:'draft';index"` // 模板状态
    ScopeSuggestion string         `gorm:"size:50;index"`                         // 推荐适用范围
    PolicyMatrix    datatypes.JSON `gorm:"type:json;not null"`                    // 策略矩阵
    AdvancedPerms   datatypes.JSON `gorm:"type:json"`                             // 高级权限点
    Version         int            `gorm:"not null;default:1"`                    // 版本号
    CreatedBy       string         `gorm:"size:36;not null"`                      // 创建人ID
    CreatedAt       time.Time      `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"` // 创建时间
    UpdatedBy       string         `gorm:"size:36"`                               // 最后更新人ID
    UpdatedAt       time.Time      `gorm:"type:datetime(3);not null;default:CURRENT_TIMESTAMP(3)"` // 最后更新时间
    DeletedAt       gorm.DeletedAt `gorm:"type:datetime(3);index"`                // 删除时间
}

// TableName 指定表名
func (PermissionTemplate) TableName() string {
    return "permission_templates"
}
```

### JSON 字段结构

```go
// PolicyMatrixEntry 策略矩阵条目
type PolicyMatrixEntry struct {
    Actions []string `json:"actions"` // 动作列表
    Scope   string   `json:"scope"`   // 适用范围
}

// AdvancedPermEntry 高级权限点条目
type AdvancedPermEntry struct {
    Enabled bool                   `json:"enabled"` // 是否启用
    Config  map[string]interface{} `json:"config"`  // 配置项
}
```

---

## API Contract

**位置**: `api/doc/system/permission_template.api`

```api
syntax = "v1"

import "../base.api"

type (
    // CreatePermissionTemplateReq 创建权限模板请求
    CreatePermissionTemplateReq {
        Name            string             `json:"name" validate:"required,max=128"`
        Code            string             `json:"code" validate:"required,max=64,format=lowercase_alphanum"`
        Description     string             `json:"description" validate:"max=500"`
        ScopeSuggestion string             `json:"scope_suggestion" validate:"omitempty,oneof=global organization domain project"`
        PolicyMatrix    map[string]PolicyMatrixEntry `json:"policy_matrix" validate:"required"`
        AdvancedPerms   map[string]AdvancedPermEntry  `json:"advanced_perms"`
    }

    // PolicyMatrixEntry 策略矩阵条目
    PolicyMatrixEntry {
        Actions []string `json:"actions" validate:"required,min=1"`
        Scope   string   `json:"scope"`
    }

    // AdvancedPermEntry 高级权限点条目
    AdvancedPermEntry {
        Enabled bool                   `json:"enabled"`
        Config  map[string]interface{} `json:"config"`
    }

    // CreatePermissionTemplateResp 创建权限模板响应
    CreatePermissionTemplateResp {
        Id string `json:"id"`
    }

    // UpdatePermissionTemplateReq 更新权限模板请求
    UpdatePermissionTemplateReq {
        Id              string                      `json:"id" validate:"required"`
        Name            string                      `json:"name" validate:"required,max=128"`
        Code            string                      `json:"code" validate:"required,max=64,format=lowercase_alphanum"`
        Description     string                      `json:"description" validate:"max=500"`
        ScopeSuggestion string                      `json:"scope_suggestion" validate:"omitempty,oneof=global organization domain project"`
        PolicyMatrix    map[string]PolicyMatrixEntry `json:"policy_matrix" validate:"required"`
        AdvancedPerms   map[string]AdvancedPermEntry  `json:"advanced_perms"`
    }

    // UpdatePermissionTemplateResp 更新权限模板响应
    UpdatePermissionTemplateResp {
        Success bool `json:"success"`
    }

    // GetPermissionTemplateReq 获取权限模板详情请求
    GetPermissionTemplateReq {
        Id string `json:"id" validate:"required"`
    }

    // PermissionTemplateDetail 权限模板详情
    PermissionTemplateDetail {
        Id              string                      `json:"id"`
        Name            string                      `json:"name"`
        Code            string                      `json:"code"`
        Description     string                      `json:"description"`
        Status          string                      `json:"status"`
        ScopeSuggestion string                      `json:"scope_suggestion"`
        PolicyMatrix    map[string]PolicyMatrixEntry `json:"policy_matrix"`
        AdvancedPerms   map[string]AdvancedPermEntry  `json:"advanced_perms"`
        Version         int                         `json:"version"`
        UsedByRoleCount int64                       `json:"used_by_role_count"`
        LastAppliedAt   string                      `json:"last_applied_at"`
        CreatedBy       string                      `json:"created_by"`
        CreatedAt       string                      `json:"created_at"`
        UpdatedBy       string                      `json:"updated_by"`
        UpdatedAt       string                      `json:"updated_at"`
    }

    // GetPermissionTemplateResp 获取权限模板详情响应
    GetPermissionTemplateResp {
        Data PermissionTemplateDetail `json:"data"`
    }

    // ListPermissionTemplatesReq 查询权限模板列表请求
    ListPermissionTemplatesReq {
        Keyword         string `json:"keyword" validate:"max=128"`
        Status          string `json:"status" validate:"omitempty,oneof=draft published disabled"`
        ScopeSuggestion string `json:"scope_suggestion" validate:"omitempty,oneof=global organization domain project"`
        Page            int    `json:"page" validate:"min=1"`
        PageSize        int    `json:"page_size" validate:"min=1,max=100"`
    }

    // PermissionTemplateItem 权限模板列表项
    PermissionTemplateItem {
        Id              string `json:"id"`
        Name            string `json:"name"`
        Code            string `json:"code"`
        Status          string `json:"status"`
        ScopeSuggestion string `json:"scope_suggestion"`
        Version         int    `json:"version"`
        UpdatedAt       string `json:"updated_at"`
    }

    // ListPermissionTemplatesResp 查询权限模板列表响应
    ListPermissionTemplatesResp {
        Total int64                    `json:"total"`
        Data  []PermissionTemplateItem `json:"data"`
    }

    // PublishPermissionTemplateReq 发布权限模板请求
    PublishPermissionTemplateReq {
        Id string `json:"id" validate:"required"`
    }

    // PublishPermissionTemplateResp 发布权限模板响应
    PublishPermissionTemplateResp {
        Success bool   `json:"success"`
        Version int    `json:"version"`
    }

    // DisablePermissionTemplateReq 停用权限模板请求
    DisablePermissionTemplateReq {
        Id string `json:"id" validate:"required"`
    }

    // DisablePermissionTemplateResp 停用权限模板响应
    DisablePermissionTemplateResp {
        Success bool `json:"success"`
    }

    // EnablePermissionTemplateReq 重新启用权限模板请求
    EnablePermissionTemplateReq {
        Id string `json:"id" validate:"required"`
    }

    // EnablePermissionTemplateResp 重新启用权限模板响应
    EnablePermissionTemplateResp {
        Success bool `json:"success"`
    }

    // ClonePermissionTemplateReq 复制权限模板请求
    ClonePermissionTemplateReq {
        Id   string `json:"id" validate:"required"`
        Name string `json:"name" validate:"required,max=128"`
        Code string `json:"code" validate:"required,max=64,format=lowercase_alphanum"`
    }

    // ClonePermissionTemplateResp 复制权限模板响应
    ClonePermissionTemplateResp {
        Id string `json:"id"`
    }

    // DeletePermissionTemplateReq 删除权限模板请求
    DeletePermissionTemplateReq {
        Id string `json:"id" validate:"required"`
    }

    // DeletePermissionTemplateResp 删除权限模板响应
    DeletePermissionTemplateResp {
        Success bool `json:"success"`
    }
)

@server(
    prefix: /api/v1/system
    group: permission_template
    middleware: AuthorityCheck
)
service system-service-api {
    @handler CreatePermissionTemplate
    post /permission-templates (CreatePermissionTemplateReq) returns (CreatePermissionTemplateResp)

    @handler UpdatePermissionTemplate
    put /permission-templates/:id (UpdatePermissionTemplateReq) returns (UpdatePermissionTemplateResp)

    @handler GetPermissionTemplate
    get /permission-templates/:id (GetPermissionTemplateReq) returns (GetPermissionTemplateResp)

    @handler ListPermissionTemplates
    get /permission-templates (ListPermissionTemplatesReq) returns (ListPermissionTemplatesResp)

    @handler PublishPermissionTemplate
    post /permission-templates/:id/publish (PublishPermissionTemplateReq) returns (PublishPermissionTemplateResp)

    @handler DisablePermissionTemplate
    post /permission-templates/:id/disable (DisablePermissionTemplateReq) returns (DisablePermissionTemplateResp)

    @handler EnablePermissionTemplate
    post /permission-templates/:id/enable (EnablePermissionTemplateReq) returns (EnablePermissionTemplateResp)

    @handler ClonePermissionTemplate
    post /permission-templates/:id/clone (ClonePermissionTemplateReq) returns (ClonePermissionTemplateResp)

    @handler DeletePermissionTemplate
    delete /permission-templates/:id (DeletePermissionTemplateReq) returns (DeletePermissionTemplateResp)
}
```

---

## Testing Strategy

| 类型 | 方法 | 覆盖率 |
|------|------|--------|
| 单元测试 | 表驱动测试，Mock Model 层 | > 80% |
| 集成测试 | 测试数据库，测试完整流程 | 核心场景 |

### 测试重点

1. **状态流转测试**：draft → published → disabled → published
2. **版本管理测试**：发布时版本号递增
3. **编码唯一性测试**：创建和更新时的唯一性校验
4. **并发控制测试**：乐观锁机制
5. **删除保护测试**：被引用模板的删除限制

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | - | 初始版本 |
