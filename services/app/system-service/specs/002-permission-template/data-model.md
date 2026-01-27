# Data Model: Permission Template

> **Feature**: 002-permission-template
> **Created**: 2026-01-26
> **Status**: Complete

---

## Overview

本文档定义权限模板功能的数据模型，包括数据库表结构、Go 实体定义和模型接口。

---

## Table: permission_templates

### DDL

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

### Field Descriptions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | CHAR(36) | PK, NOT NULL | UUID v7 主键 |
| name | VARCHAR(128) | NOT NULL | 模板名称 |
| code | VARCHAR(64) | NOT NULL, UK(code,deleted_at) | 模板编码，小写字母+数字+下划线+连字符 |
| description | VARCHAR(500) | NULLABLE | 模板描述 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | 模板状态：draft/published/disabled |
| scope_suggestion | VARCHAR(50) | NULLABLE | 推荐适用范围：global/organization/domain/project |
| policy_matrix | JSON | NOT NULL | 策略矩阵，记录模块×动作勾选关系 |
| advanced_perms | JSON | NULLABLE | 高级权限点配置 |
| version | INT | NOT NULL, DEFAULT 1 | 版本号，每次发布递增 |
| created_by | CHAR(36) | NOT NULL | 创建人ID |
| created_at | DATETIME(3) | NOT NULL | 创建时间（毫秒精度） |
| updated_by | CHAR(36) | NULLABLE | 最后更新人ID |
| updated_at | DATETIME(3) | NOT NULL | 最后更新时间（毫秒精度） |
| deleted_at | DATETIME(3) | NULLABLE | 删除时间（软删除） |

### Indexes

| Index | Type | Fields | Purpose |
|-------|------|--------|---------|
| PRIMARY | Primary Key | id | 主键索引 |
| uk_code_deleted | Unique | code, deleted_at | 编码唯一性（支持软删除） |
| idx_status | Normal | status | 状态筛选查询 |
| idx_scope_suggestion | Normal | scope_suggestion | 适用范围筛选 |
| idx_created_at | Normal | created_at | 时间排序查询 |

---

## JSON Field Structures

### policy_matrix

策略矩阵记录各模块的动作勾选关系。

**结构定义**:
```go
type PolicyMatrixEntry struct {
    Actions []string `json:"actions"` // 动作列表，如 ["create", "read", "update", "delete"]
    Scope   string   `json:"scope"`   // 适用范围，如 "organization"
}
```

**示例**:
```json
{
  "user_management": {
    "actions": ["create", "read", "update", "delete"],
    "scope": "organization"
  },
  "data_export": {
    "actions": ["export"],
    "scope": "domain"
  }
}
```

### advanced_perms

高级权限点记录特殊权限配置。

**结构定义**:
```go
type AdvancedPermEntry struct {
    Enabled bool                   `json:"enabled"` // 是否启用
    Config  map[string]interface{} `json:"config"`  // 配置项
}
```

**示例**:
```json
{
  "data_export_limit": {
    "enabled": true,
    "config": {
      "max_rows": 10000
    }
  },
  "advanced_query": {
    "enabled": false,
    "config": {}
  }
}
```

---

## Go Entity Definition

```go
package permission_template

import (
    "time"
    "gorm.io/datatypes"
    "gorm.io/gorm"
)

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

// PolicyMatrixData 策略矩阵数据结构（用于序列化/反序列化）
type PolicyMatrixData map[string]PolicyMatrixEntry

// PolicyMatrixEntry 策略矩阵条目
type PolicyMatrixEntry struct {
    Actions []string `json:"actions"`
    Scope   string   `json:"scope"`
}

// AdvancedPermsData 高级权限点数据结构
type AdvancedPermsData map[string]AdvancedPermEntry

// AdvancedPermEntry 高级权限点条目
type AdvancedPermEntry struct {
    Enabled bool                   `json:"enabled"`
    Config  map[string]interface{} `json:"config"`
}
```

---

## Model Interface

```go
package permission_template

import (
    "context"
    "time"
)

// PermissionTemplateModel 模板数据访问接口
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
    UsedByRoleCount int64      // 被引用角色数
    LastAppliedAt   *time.Time // 最近应用时间
}
```

---

## Data Relationships

### 与角色表的关联

权限模板与角色是多对一关系：
- 一个角色创建时可以选择一个权限模板
- 角色记录使用的模板 ID 和版本号

**建议的角色表字段**:
```sql
-- 角色表应包含以下字段
ALTER TABLE `roles` ADD COLUMN `permission_template_id` CHAR(36) DEFAULT NULL COMMENT '使用的权限模板ID';
ALTER TABLE `roles` ADD COLUMN `permission_template_version` INT DEFAULT NULL COMMENT '使用的权限模板版本号';
```

---

## Data Validation Rules

| Field | Rule | Error Code |
|-------|------|------------|
| name | 必填，1-128字符 | 200151, 200161 |
| code | 必填，全局唯一，小写字母+数字+下划线+连字符 | 200151, 200152, 200169 |
| status | 枚举值：draft/published/disabled | - |
| scope_suggestion | 可选，枚举值：global/organization/domain/project | 200163 |
| policy_matrix | 必填，有效 JSON | 200153, 200167 |
| advanced_perms | 可选，有效 JSON | 200168 |

---

## Migration Notes

1. **执行 DDL**: 使用 `migrations/system/permission_templates.sql` 创建表
2. **字典表**: 确保 `scope_suggestion` 的枚举值在字典表中定义
3. **角色表扩展**: 如需支持从模板创建角色，需扩展角色表

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | - | 初始版本 |
