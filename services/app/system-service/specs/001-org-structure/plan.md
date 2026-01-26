# 组织架构管理 Technical Plan

> **Branch**: `001-org-structure`
> **Spec Path**: `specs/001-org-structure/`
> **Created**: 2025-01-25
> **Status**: Draft

---

## Summary

本方案实现无限层级的组织架构管理系统，采用 **Materialized Path（物化路径）** 模式存储祖先路径，实现高性能树查询。使用 **GORM** 处理复杂的层级操作和事务管理，通过 **Redis** 缓存用户数据权限范围以提升查询性能。系统支持主部门+辅助部门的用户关联模式，并提供轻量级审计日志记录关键操作。

---

## Technical Context

| Item | Value |
|------|-------|
| **Language** | Go 1.24+ |
| **Framework** | Go-Zero v1.9+ |
| **Storage** | MySQL 8.0 |
| **Cache** | Redis 7.0 |
| **ORM** | GORM (主要) / SQLx (可选) |
| **UUID** | UUID v7 (github.com/google/uuid) |
| **Testing** | go test |
| **Common Lib** | idrm-go-base v0.1.0+ |

---

## Constitution Check

### 规范符合性检查

| 规范 | 要求 | 本方案 | 状态 |
|------|------|--------|------|
| 主键规范 | UUID v7 | ✅ 使用 CHAR(36) + uuid.NewV7() | PASS |
| 分层架构 | Handler → Logic → Model | ✅ 严格遵循三层架构 | PASS |
| 错误处理 | errorx + 自定义错误码 | ✅ 200100-200150 区间 | PASS |
| 函数长度 | ≤50 行 | ✅ Logic 层拆分子函数 | PASS |
| 测试覆盖 | ≥80% | ✅ 规划单元测试 + 集成测试 | PASS |
| 外键约束 | 应用层保证 | ✅ 不创建数据库外键 | PASS |

### 架构门禁检查

| 门禁项 | 要求 | 本方案 | 状态 |
|--------|------|--------|------|
| Handler 业务逻辑 | ❌ 禁止 | ✅ 仅参数解析和响应格式化 | PASS |
| Logic 直接访问数据库 | ❌ 禁止 | ✅ 通过 Model 层访问 | PASS |
| 硬编码配置 | ❌ 禁止 | ✅ 使用配置文件 | PASS |
| 跳过抽象 | ❌ 禁止 | ✅ 依赖 Model 接口 | PASS |

### 需要特殊说明的偏离

**无偏离** - 本方案完全符合项目宪章要求。

---

## 通用库 (idrm-go-base)

### 模块初始化

| 模块 | 初始化方式 | 使用位置 |
|------|-----------|----------|
| validator | `validator.Init()` 在 main.go | Handler 层参数校验 |
| telemetry | `telemetry.Init(cfg)` 在 main.go | 全链路追踪 |
| response | `httpx.SetErrorHandler(response.ErrorHandler)` | 统一错误响应 |
| errorx | 自定义错误码 | Logic 层业务错误 |

### 自定义错误码

| 功能 | 范围 | 位置 |
|------|------|------|
| 组织架构管理 | 200100-200150 | `internal/errorx/codes.go` |

### 错误码定义

```go
// internal/errorx/codes.go
package errorx

const (
    // 组织架构相关错误码 200100-200150
    ErrCodeOrgParamInvalid      = 200101 // 参数校验失败
    ErrCodeOrgParentNotFound    = 200102 // 父节点不存在
    ErrCodeOrgNameDuplicate     = 200103 // 同级名称重复
    ErrCodeOrgHasChildren       = 200104 // 存在子节点
    ErrCodeOrgHasUsers          = 200105 // 存在关联用户
    ErrCodeOrgMoveCycle         = 200106 // 移动形成环路
    ErrCodeOrgHasActiveChildren = 200107 // 存在启用状态子节点
    ErrCodeOrgNotFound          = 200108 // 部门不存在
    ErrCodeOrgRootDelete        = 200109 // 根节点不允许删除
    ErrCodeOrgPrimaryInvalid    = 200110 // 主部门无效
    ErrCodeOrgAuxDuplicate      = 200111 // 辅助部门重复
)
```

### 第三方库确认

| 库 | 版本 | 原因 | 确认状态 |
|----|------|------|----------|
| github.com/google/uuid | latest | UUID v7 主键生成 | ✅ 宪章允许 |
| github.com/redis/go-redis/v9 | latest | 数据权限缓存 | ✅ 宪章允许 |

---

## Go-Zero 开发流程

| Step | 任务 | 方式 | 产出 |
|------|------|------|------|
| 1 | 定义 API 文件 | AI 实现 | `api/doc/system/organization.api` |
| 2 | 生成 Handler/Types | goctl | `api/internal/handler/`, `types/` |
| 3 | 定义 DDL 文件 | AI 实现 | `migrations/system/sys_organization.sql` |
| 4 | 定义 DDL 文件 | AI 实现 | `migrations/system/sys_user_dept.sql` |
| 5 | 定义 DDL 文件 | AI 实现 | `migrations/system/sys_organization_audit.sql` |
| 6 | 实现 Model 接口 | AI 实现 | `model/system/organization/` |
| 7 | 实现 Model 接口 | AI 实现 | `model/system/userdept/` |
| 8 | 实现 Model 接口 | AI 实现 | `model/system/orgaudit/` |
| 9 | 实现 Logic 层 | AI 实现 | `api/internal/logic/system/` |
| 10 | 实现缓存失效 | AI 实现 | Logic 层集成 |

> ⚠️ **重要**：goctl 必须在 `api/doc/api.api` 入口文件上执行

**goctl 命令**:
```bash
# 步骤1：在 api/doc/api.api 中 import 新模块
# 步骤2：执行 goctl 生成代码
goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
```

---

## File Structure

### 文件产出清单

| 序号 | 文件 | 生成方式 | 位置 |
|------|------|----------|------|
| 1 | API 文件 | AI 实现 | `api/doc/system/organization.api` |
| 2 | DDL 文件 | AI 实现 | `migrations/system/sys_organization.sql` |
| 3 | DDL 文件 | AI 实现 | `migrations/system/sys_user_dept.sql` |
| 4 | DDL 文件 | AI 实现 | `migrations/system/sys_organization_audit.sql` |
| 5 | Handler | goctl 生成 | `api/internal/handler/system/` |
| 6 | Types | goctl 生成 | `api/internal/types/` |
| 7 | Logic | AI 实现 | `api/internal/logic/system/` |
| 8 | Model | AI 实现 | `model/system/organization/` |
| 9 | Model | AI 实现 | `model/system/userdept/` |
| 10 | Model | AI 实现 | `model/system/orgaudit/` |

### 代码结构

```
api/internal/
├── handler/system/
│   ├── get_org_tree_handler.go           # goctl 生成
│   ├── create_org_handler.go
│   ├── update_org_handler.go
│   ├── delete_org_handler.go
│   ├── move_org_handler.go
│   ├── get_org_users_handler.go
│   ├── set_user_primary_dept_handler.go
│   ├── add_user_aux_dept_handler.go
│   └── routes.go
├── logic/system/
│   ├── get_org_tree_logic.go             # AI 实现
│   ├── create_org_logic.go
│   ├── update_org_logic.go
│   ├── delete_org_logic.go
│   ├── move_org_logic.go                 # 核心复杂逻辑
│   ├── get_org_users_logic.go
│   ├── set_user_primary_dept_logic.go
│   ├── add_user_aux_dept_logic.go
│   └── org_cache.go                      # 缓存管理
├── types/
│   └── types.go                          # goctl 生成
└── svc/
    └── servicecontext.go                  # 手动维护

model/system/
├── organization/
│   ├── interface.go                       # Model 接口定义
│   ├── types.go                           # 数据结构
│   ├── vars.go                            # 常量和错误定义
│   ├── factory.go                         # ORM 工厂函数
│   ├── gorm_dao.go                        # GORM 实现
│   └── tree.go                            # 树操作辅助方法
├── userdept/
│   ├── interface.go
│   ├── types.go
│   ├── vars.go
│   ├── factory.go
│   └── gorm_dao.go
└── orgaudit/
    ├── interface.go
    ├── types.go
    ├── vars.go
    ├── factory.go
    └── gorm_dao.go

migrations/system/
├── sys_organization.sql
├── sys_user_dept.sql
└── sys_organization_audit.sql
```

---

## Architecture Overview

### 分层架构

```
HTTP Request → Handler → Logic → Model → Database
                       ↓
                    Redis Cache
```

| 层级 | 职责 | 最大行数 | 关键文件 |
|------|------|----------|----------|
| Handler | 解析参数、格式化响应 | 30 | `*_handler.go` |
| Logic | 业务逻辑、事务管理、缓存失效 | 50 | `*_logic.go`, `org_cache.go` |
| Model | 数据访问、树操作、事务管理 | 50 | `gorm_dao.go`, `tree.go` |

### 核心组件

| 组件 | 职责 | 实现位置 |
|------|------|----------|
| **树操作服务** | Materialized Path 查询、祖先更新 | `model/system/organization/tree.go` |
| **缓存管理器** | 数据权限缓存构建与失效 | `api/internal/logic/system/org_cache.go` |
| **审计服务** | 记录关键操作日志 | `model/system/orgaudit/gorm_dao.go` |

---

## Data Model

### DDL: sys_organization

**位置**: `migrations/system/sys_organization.sql`

```sql
CREATE TABLE `sys_organization` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `parent_id` CHAR(36) NOT NULL DEFAULT '0' COMMENT '父部门ID，根节点为0',
    `name` VARCHAR(100) NOT NULL COMMENT '部门名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '部门编码，全局唯一',
    `ancestors` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '祖先路径，格式: 0,101,105',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '同级排序',
    `leader_id` CHAR(36) DEFAULT NULL COMMENT '部门负责人ID',
    `type` TINYINT NOT NULL DEFAULT 2 COMMENT '节点类型: 1=公司/租户根, 2=部门/科室',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=启用, 0=停用',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间（逻辑删除，GORM软删除需要毫秒精度）',
    PRIMARY KEY (`id`),
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_code` (`code`),
    INDEX `idx_status` (`status`),
    INDEX `idx_ancestors` (`ancestors`(255)),
    INDEX `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织架构表';
```

### DDL: sys_user_dept

**位置**: `migrations/system/sys_user_dept.sql`

```sql
CREATE TABLE `sys_user_dept` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
    `dept_id` CHAR(36) NOT NULL COMMENT '部门ID',
    `is_primary` TINYINT NOT NULL DEFAULT 0 COMMENT '是否主部门: 1=是, 0=否',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_primary` (`user_id`, `is_primary`) COMMENT '一个用户只能有一个主部门',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_dept_id` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户部门关联表';
```

### DDL: sys_organization_audit

**位置**: `migrations/system/sys_organization_audit.sql`

```sql
CREATE TABLE `sys_organization_audit` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `org_id` CHAR(36) NOT NULL COMMENT '部门ID',
    `operation` VARCHAR(20) NOT NULL COMMENT '操作类型: create/delete/move',
    `operator_id` CHAR(36) NOT NULL COMMENT '操作人ID',
    `old_value` JSON DEFAULT NULL COMMENT '变更前值',
    `new_value` JSON DEFAULT NULL COMMENT '变更后值',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    INDEX `idx_org_id` (`org_id`),
    INDEX `idx_operation` (`operation`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织架构操作审计表';
```

### Go Struct

```go
// model/system/organization/types.go
package organization

import (
    "time"
    "gorm.io/gorm"
)

type SysOrganization struct {
    Id        string         `gorm:"primaryKey;size:36"`
    ParentId  string         `gorm:"size:36;not null;default:'0'"`
    Name      string         `gorm:"size:100;not null"`
    Code      string         `gorm:"size:50;unique"`
    Ancestors string         `gorm:"size:500;not null;default:''"`
    SortOrder int            `gorm:"not null;default:0"`
    LeaderId  string         `gorm:"size:36"`
    Type      int8           `gorm:"not null;default:2"`
    Status    int8           `gorm:"not null;default:1"`
    Desc      string         `gorm:"size:255"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
}

// TableName 指定表名
func (SysOrganization) TableName() string {
    return "sys_organization"
}
```

---

## Interface Definitions

### Organization Model 接口

**位置**: `model/system/organization/interface.go`

```go
package organization

import (
    "context"
    "github.com/jinguoxing/idrm-go-base/errorx"
)

type Model interface {
    // 基础 CRUD
    Insert(ctx context.Context, data *SysOrganization) (*SysOrganization, error)
    FindOne(ctx context.Context, id string) (*SysOrganization, error)
    Update(ctx context.Context, data *SysOrganization) error
    Delete(ctx context.Context, id string) error

    // 树操作
    FindTree(ctx context.Context, status *int8) ([]*SysOrganization, error)
    FindChildren(ctx context.Context, parentId string) ([]*SysOrganization, error)
    FindSubtree(ctx context.Context, id string) ([]*SysOrganization, error)
    HasChildren(ctx context.Context, id string) (bool, error)

    // 业务查询
    FindByCode(ctx context.Context, code string) (*SysOrganization, error)
    FindByParentAndName(ctx context.Context, parentId, name string) (*SysOrganization, error)
    CountUsers(ctx context.Context, deptId string) (int64, error)

    // 移动相关
    MoveNode(ctx context.Context, id, newParentId string, sortOrders []string) error
    IsDescendant(ctx context.Context, ancestorId, descendantId string) (bool, error)

    // 事务支持
    WithTx(tx interface{}) Model
    Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}

// TreeService 树操作服务接口
type TreeService interface {
    BuildTree(nodes []*SysOrganization) []*TreeNode
    CalculateAncestors(parentAncestors, parentId string) string
    UpdateDescendantsAncestors(ctx context.Context, rootId, oldPrefix, newPrefix string) error
}
```

---

## API Contract

详见 [contracts/organization.api](contracts/organization.api)

---

## Core Algorithm: Materialized Path

### 祖先路径计算

```go
// CalculateAncestors 计算祖先路径
func CalculateAncestors(parentAncestors, parentId string) string {
    if parentId == "0" {
        return "0"
    }
    if parentAncestors == "" || parentAncestors == "0" {
        return "0," + parentId
    }
    return parentAncestors + "," + parentId
}
```

### 环路检测

```go
// IsDescendant 检测是否为子孙节点
func (m *GormDAO) IsDescendant(ctx context.Context, ancestorId, descendantId string) (bool, error) {
    var count int64
    err := m.db.WithContext(ctx).
        Table("sys_organization").
        Where("id = ? AND ancestors LIKE ?", descendantId, "%,"+ancestorId+",%").
        Count(&count).Error
    return count > 0, err
}
```

---

## Cache Strategy

### 缓存 Key 设计

```
user:dept:{user_id} -> Set(dept_id1, dept_id2, ...)
```

### 缓存构建（登录时）

```go
// BuildDeptCache 构建用户数据权限缓存
func BuildDeptCache(ctx context.Context, userId string) error {
    // 1. 查询用户主部门
    primaryDept, err := userDeptModel.FindPrimaryByUserId(ctx, userId)
    if err != nil {
        return err
    }

    // 2. 查询主部门的所有子部门
    depts := []string{primaryDept.DeptId}
    descendants, _ := orgModel.FindSubtree(ctx, primaryDept.DeptId)
    for _, d := range descendants {
        depts = append(depts, d.Id)
    }

    // 3. 写入 Redis
    key := fmt.Sprintf("user:dept:%s", userId)
    return redisClient.SAdd(ctx, key, depts).Err()
}
```

---

## Testing Strategy

| 模块 | 方法 | 覆盖率 |
|------|------|--------|
| Model 层 | Mock DB，表驱动测试 | > 85% |
| Logic 层 | Mock Model，测试业务逻辑 | > 80% |
| 树操作 | 测试环路检测、祖先更新 | 100% |
| 缓存管理 | Mock Redis，测试失效逻辑 | > 80% |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-25 | - | 初始版本 |
| 1.1 | 2025-01-25 | - | 修正 deleted_at 字段类型为 DATETIME(3) 以确保 GORM 软删除正常工作 |
