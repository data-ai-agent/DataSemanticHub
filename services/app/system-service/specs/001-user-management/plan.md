# 用户管理模块技术设计文档 (User Management Technical Plan)

> **Branch**: `001-user_management`  
> **Spec Path**: `specs/001-user_management/`  
> **Created**: 2026-01-21  
> **Status**: Draft

---

## Summary

基于 Go-Zero 框架实现用户管理模块，提供用户的全生命周期管理能力。该模块基于现有的user表进行扩展，添加必要的字段（accountSource、phone、deptId等），同时创建角色绑定表（role_bindings）和审计日志表（audit_logs）。采用分层架构（Handler → Logic → Model），与现有注册功能打通，确保注册用户能够正常纳入用户管理体系。

---

## Technical Context

| Item | Value |
|------|-------|
| **Language** | Go 1.24+ |
| **Framework** | Go-Zero v1.9+ |
| **Storage** | MySQL 8.0 |
| **Cache** | Redis 7.0 (可选，用于缓存统计数据) |
| **ORM** | GORM |
| **Testing** | go test |
| **Common Lib** | idrm-go-base v0.1.0+ |
| **Excel库** | excelize v1.x (用于导入导出) |

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
| 用户管理 | 30200-30299 | `api/internal/errorx/codes.go` |

**错误码定义**:
- 30200: 用户不存在
- 30201: 邮箱已被使用
- 30202: 手机号已被使用
- 30203: 用户状态不允许此操作
- 30204: 不能操作自己
- 30205: 用户是关键责任人，不能删除/停用
- 30206: 锁定原因必填
- 30207: 仅本地账号支持密码重置
- 30208: 批量操作部分失败
- 30209: 部门不存在
- 30210: 角色绑定不存在

### 第三方库确认

| 库 | 原因 | 确认状态 |
|----|------|----------|
| github.com/xuri/excelize/v2 | Excel导入导出功能 | ✅ 已确认 |

---

## Go-Zero 开发流程

按以下顺序完成技术设计和代码生成：

| Step | 任务 | 方式 | 产出 |
|------|------|------|------|
| 1 | 定义 API 文件 | AI 实现 | `api/doc/user/user_management.api` |
| 2 | 生成 Handler/Types | goctl 生成 | `api/internal/handler/user/`, `types/` |
| 3 | 定义 DDL 文件 | AI 手写 | `migrations/user/` (扩展users表，新增role_bindings、audit_logs表) |
| 4 | 实现 Model 接口 | AI 手写 | `model/user/users/`, `model/user/role_bindings/`, `model/user/audit_logs/` |
| 5 | 实现 Logic 层 | AI 实现 | `api/internal/logic/user/` |
| 6 | 更新注册功能 | AI 实现 | 修改`register_logic.go`以设置正确的状态和账号来源 |

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
| 1 | API 文件 | AI 实现 | `api/doc/user/user_management.api` |
| 2 | DDL 文件 | AI 实现 | `migrations/user/` (扩展users表，新增role_bindings、audit_logs表) |
| 3 | Handler | goctl 生成 | `api/internal/handler/user/` |
| 4 | Types | goctl 生成 | `api/internal/types/` |
| 5 | Logic | AI 实现 | `api/internal/logic/user/` |
| 6 | Model (users扩展) | AI 实现 | `model/user/users/` |
| 7 | Model (role_bindings) | AI 实现 | `model/user/role_bindings/` |
| 8 | Model (audit_logs) | AI 实现 | `model/user/audit_logs/` |

### 代码结构

```
api/internal/
├── handler/user/
│   ├── list_users_handler.go           # goctl 生成
│   ├── get_user_handler.go
│   ├── create_user_handler.go
│   ├── update_user_handler.go
│   ├── batch_update_status_handler.go
│   ├── unlock_user_handler.go
│   ├── delete_user_handler.go
│   ├── reset_password_handler.go
│   ├── batch_import_handler.go
│   ├── export_users_handler.go
│   ├── get_statistics_handler.go
│   └── routes.go
├── logic/user/
│   ├── list_users_logic.go             # AI 实现
│   ├── get_user_logic.go
│   ├── create_user_logic.go
│   ├── update_user_logic.go
│   ├── batch_update_status_logic.go
│   ├── unlock_user_logic.go
│   ├── delete_user_logic.go
│   ├── reset_password_logic.go
│   ├── batch_import_logic.go
│   ├── export_users_logic.go
│   ├── get_statistics_logic.go
│   └── register_logic.go               # AI 修改（打通注册功能）
├── types/
│   └── types.go                         # goctl 生成
└── svc/
    └── servicecontext.go                # 手动维护（添加新Model）

model/user/
├── users/                               # 扩展现有模型
│   ├── interface.go                     # 扩展接口
│   ├── types.go                         # 更新结构体
│   ├── vars.go                          # 更新常量
│   ├── factory.go                       # 保持不变
│   └── gorm_dao.go                      # 扩展方法
├── role_bindings/                       # 新增模型
│   ├── interface.go
│   ├── types.go
│   ├── vars.go
│   ├── factory.go
│   └── gorm_dao.go
└── audit_logs/                          # 新增模型
    ├── interface.go
    ├── types.go
    ├── vars.go
    ├── factory.go
    └── gorm_dao.go
```

---

## Architecture Overview

遵循 IDRM 分层架构：

```
HTTP Request → Handler → Logic → Model → Database
```

| 层级 | 职责 | 最大行数 |
|------|------|----------|
| Handler | 解析参数、格式化响应、文件上传处理 | 30 |
| Logic | 业务逻辑实现、事务管理、调用Model | 100 |
| Model | 数据访问、查询优化 | 80 |

---

## Interface Definitions

### Users Model 扩展

```go
type Model interface {
    // 现有方法
    Insert(ctx context.Context, data *User) (*User, error)
    FindOne(ctx context.Context, id string) (*User, error)
    FindOneByEmail(ctx context.Context, email string) (*User, error)
    Update(ctx context.Context, data *User) error
    UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error
    Delete(ctx context.Context, id string) error
    
    // 新增方法
    FindList(ctx context.Context, req *ListUsersReq) ([]*User, int64, error)
    FindOneByPhone(ctx context.Context, phone string) (*User, error)
    BatchUpdateStatus(ctx context.Context, userIds []string, status int8, reason string, operatorId string) error
    UpdateStatus(ctx context.Context, id string, status int8, reason string, operatorId string) error
    GetStatistics(ctx context.Context) (*UserStatistics, error)
    WithTx(tx interface{}) Model
    Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}
```

### RoleBindings Model

```go
type Model interface {
    Insert(ctx context.Context, data *RoleBinding) (*RoleBinding, error)
    FindByUserId(ctx context.Context, userId string) ([]*RoleBinding, error)
    FindOne(ctx context.Context, id int64) (*RoleBinding, error)
    Update(ctx context.Context, data *RoleBinding) error
    Delete(ctx context.Context, id int64) error
    DeleteByUserId(ctx context.Context, userId string) error
    WithTx(tx interface{}) Model
}
```

### AuditLogs Model

```go
type Model interface {
    Insert(ctx context.Context, data *AuditLog) (*AuditLog, error)
    FindByUserId(ctx context.Context, userId string, page, pageSize int) ([]*AuditLog, int64, error)
    FindOne(ctx context.Context, id int64) (*AuditLog, error)
    WithTx(tx interface{}) Model
}
```

---

## Data Model

### DDL

#### 1. 扩展 users 表

**位置**: `migrations/user/001_add_user_management_fields.sql`

```sql
-- 添加用户管理相关字段
ALTER TABLE `users` 
ADD COLUMN `name` VARCHAR(100) DEFAULT NULL COMMENT '姓名（完整姓名，用于管理模块）' AFTER `last_name`,
ADD COLUMN `phone` VARCHAR(11) DEFAULT NULL COMMENT '手机号' AFTER `email`,
ADD COLUMN `dept_id` VARCHAR(36) DEFAULT NULL COMMENT '主部门ID' AFTER `phone`,
ADD COLUMN `account_source` VARCHAR(10) NOT NULL DEFAULT 'local' COMMENT '账号来源：local/sso' AFTER `organization`,
ADD COLUMN `lock_reason` VARCHAR(255) DEFAULT NULL COMMENT '锁定原因' AFTER `status`,
ADD COLUMN `lock_time` DATETIME DEFAULT NULL COMMENT '锁定时间' AFTER `lock_reason`,
ADD COLUMN `lock_by` VARCHAR(36) DEFAULT NULL COMMENT '锁定操作人ID' AFTER `lock_time`,
ADD COLUMN `created_by` VARCHAR(36) DEFAULT NULL COMMENT '创建人ID' AFTER `lock_by`,
ADD COLUMN `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新人ID' AFTER `created_by`;

-- 添加索引
ALTER TABLE `users`
ADD UNIQUE KEY `uk_phone` (`phone`) COMMENT '手机号唯一索引（仅非空值）',
ADD KEY `idx_dept_id` (`dept_id`),
ADD KEY `idx_account_source` (`account_source`),
ADD KEY `idx_status` (`status`),
ADD KEY `idx_name` (`name`);

-- 更新status字段注释和枚举值
ALTER TABLE `users` 
MODIFY COLUMN `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-未激活，1-启用，2-停用，3-锁定，4-归档';

-- 更新现有数据：设置默认name字段（合并first_name和last_name）
UPDATE `users` SET `name` = CONCAT(TRIM(`first_name`), ' ', TRIM(`last_name`)) WHERE `name` IS NULL;
```

#### 2. 创建 role_bindings 表

**位置**: `migrations/user/002_create_role_bindings.sql`

```sql
CREATE TABLE IF NOT EXISTS `role_bindings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色绑定ID',
    `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
    `org_id` VARCHAR(36) NOT NULL COMMENT '组织/部门ID',
    `position` VARCHAR(50) DEFAULT NULL COMMENT '岗位职责',
    `permission_role` VARCHAR(50) DEFAULT NULL COMMENT '权限角色',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_org_id` (`org_id`),
    KEY `idx_permission_role` (`permission_role`),
    CONSTRAINT `fk_role_binding_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色绑定表';
```

#### 3. 创建 audit_logs 表

**位置**: `migrations/user/003_create_audit_logs.sql`

```sql
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审计日志ID',
    `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型：创建/更新/锁定/解锁/删除等',
    `operator` VARCHAR(100) NOT NULL COMMENT '操作人姓名',
    `operator_id` VARCHAR(36) NOT NULL COMMENT '操作人ID',
    `changes` JSON DEFAULT NULL COMMENT '变更内容（JSON格式，记录字段的旧值和新值）',
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_operator_id` (`operator_id`),
    KEY `idx_action` (`action`),
    KEY `idx_timestamp` (`timestamp`),
    CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';
```

### Go Struct

#### 扩展 User 结构

```go
type User struct {
    Id           string         `gorm:"primaryKey;size:36" json:"id"`           // UUID v7
    FirstName    string         `gorm:"size:50;not null" json:"first_name"`     // 名
    LastName     string         `gorm:"size:50;not null" json:"last_name"`      // 姓
    Name         string         `gorm:"size:100" json:"name"`                   // 完整姓名（新增）
    Email        string         `gorm:"size:255;not null;uniqueIndex" json:"email"` // 邮箱（唯一）
    Phone        *string        `gorm:"size:11;uniqueIndex" json:"phone,omitempty"` // 手机号（可选，唯一）
    DeptId       *string        `gorm:"size:36;index" json:"dept_id,omitempty"` // 主部门ID（可选）
    Organization string         `gorm:"size:100" json:"organization"`           // 组织
    PasswordHash string         `gorm:"size:60;not null" json:"-"`              // 密码哈希（不返回）
    Status       int8           `gorm:"default:0;not null;index" json:"status"` // 状态：0-未激活，1-启用，2-停用，3-锁定，4-归档
    AccountSource string        `gorm:"size:10;not null;default:'local';index" json:"account_source"` // 账号来源：local/sso
    LockReason   *string        `gorm:"size:255" json:"lock_reason,omitempty"`  // 锁定原因（可选）
    LockTime     *time.Time     `gorm:"type:datetime" json:"lock_time,omitempty"` // 锁定时间（可选）
    LockBy       *string        `gorm:"size:36" json:"lock_by,omitempty"`       // 锁定操作人ID（可选）
    CreatedBy    *string        `gorm:"size:36" json:"created_by,omitempty"`    // 创建人ID（可选）
    UpdatedBy    *string        `gorm:"size:36" json:"updated_by,omitempty"`    // 更新人ID（可选）
    LastLoginAt  *time.Time     `gorm:"type:datetime" json:"last_login_at"`     // 最后登录时间
    CreatedAt    time.Time      `gorm:"autoCreateTime" json:"created_at"`       // 创建时间
    UpdatedAt    time.Time      `gorm:"autoUpdateTime" json:"updated_at"`       // 更新时间
    DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`                         // 软删除（不返回）
}
```

#### RoleBinding 结构

```go
type RoleBinding struct {
    Id            int64     `gorm:"primaryKey;autoIncrement" json:"id"`
    UserId        string    `gorm:"size:36;not null;index" json:"user_id"`
    OrgId         string    `gorm:"size:36;not null;index" json:"org_id"`
    Position      *string   `gorm:"size:50" json:"position,omitempty"`          // 岗位职责（可选）
    PermissionRole *string  `gorm:"size:50;index" json:"permission_role,omitempty"` // 权限角色（可选）
    CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
    UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
```

#### AuditLog 结构

```go
type AuditLog struct {
    Id         int64          `gorm:"primaryKey;autoIncrement" json:"id"`
    UserId     string         `gorm:"size:36;not null;index" json:"user_id"`
    Action     string         `gorm:"size:50;not null;index" json:"action"`     // 操作类型
    Operator   string         `gorm:"size:100;not null" json:"operator"`        // 操作人姓名
    OperatorId string         `gorm:"size:36;not null;index" json:"operator_id"` // 操作人ID
    Changes    datatypes.JSON `gorm:"type:json" json:"changes,omitempty"`       // 变更内容（JSON）
    Timestamp  time.Time      `gorm:"autoCreateTime;index" json:"timestamp"`
}
```

---

## API Contract

**位置**: `api/doc/user/user_management.api`

```api
syntax = "v1"

info(
    title: "用户管理 API"
    desc: "用户管理模块：用户列表、详情、创建、更新、删除、状态管理、角色绑定等"
    version: "v1"
)

import "../base.api"

type (
    // === 用户列表查询 ===
    ListUsersReq {
        Page          int    `form:"page,default=1" validate:"min=1"`
        PageSize      int    `form:"page_size,default=10" validate:"min=1,max=100"`
        Keyword       string `form:"keyword,optional"`
        DeptId        string `form:"dept_id,optional"`
        Status        int8   `form:"status,optional"`
        AccountSource string `form:"account_source,optional"`
        PermissionRole string `form:"permission_role,optional"`
        SortField     string `form:"sort_field,optional"` // name,created_at,last_login
        SortOrder     string `form:"sort_order,optional"` // asc,desc
    }
    
    ListUsersResp {
        Total    int64   `json:"total"`
        Page     int     `json:"page"`
        PageSize int     `json:"page_size"`
        Users    []User  `json:"users"`
    }
    
    // === 用户详情 ===
    GetUserResp {
        User       User        `json:"user"`
        RoleBindings []RoleBinding `json:"role_bindings"`
        AuditLogs []AuditLog   `json:"audit_logs"`
    }
    
    // === 创建用户 ===
    CreateUserReq {
        Name          string         `json:"name" validate:"required,min=2,max=50"`
        Email         string         `json:"email" validate:"required,email"`
        Phone         string         `json:"phone,optional" validate:"omitempty,len=11"`
        DeptId        string         `json:"dept_id" validate:"required"`
        RoleBindings  []RoleBindingInput `json:"role_bindings,optional"`
        AccountSource string         `json:"account_source" validate:"required,oneof=local sso"`
        SendInvitation bool          `json:"send_invitation,optional"`
        InitialPassword string       `json:"initial_password,optional"`
    }
    
    CreateUserResp {
        UserId          string `json:"user_id"`
        InitialPassword string `json:"initial_password,optional"`
    }
    
    // === 更新用户 ===
    UpdateUserReq {
        Name         string               `json:"name,optional"`
        Phone        string               `json:"phone,optional"`
        DeptId       string               `json:"dept_id,optional"`
        RoleBindings []RoleBindingInput   `json:"role_bindings,optional"`
    }
    
    // === 批量更新状态 ===
    BatchUpdateStatusReq {
        UserIds []string `json:"user_ids" validate:"required,min=1,max=100"`
        Status  int8     `json:"status" validate:"required,oneof=1 2 3 4"`
        Reason  string   `json:"reason,optional"`
    }
    
    BatchUpdateStatusResp {
        SuccessCount int              `json:"success_count"`
        FailedCount  int              `json:"failed_count"`
        Errors       []OperationError `json:"errors,optional"`
    }
    
    // === 解锁用户 ===
    UnlockUserReq {
        Reason string `json:"reason,optional"`
    }
    
    // === 删除用户 ===
    DeleteUserReq {
        TransferTo string `json:"transfer_to,optional"`
        Force      bool   `json:"force,optional"`
    }
    
    DeleteUserResp {
        Archived         bool `json:"archived"`
        ImpactsTransferred bool `json:"impacts_transferred"`
    }
    
    // === 重置密码 ===
    ResetPasswordReq {
        NewPassword string `json:"new_password,optional"`
        SendEmail   bool   `json:"send_email,optional"`
    }
    
    ResetPasswordResp {
        TemporaryPassword string `json:"temporary_password"`
    }
    
    // === 批量导入 ===
    BatchImportReq {
        DryRun bool `form:"dry_run,optional"`
    }
    
    BatchImportResp {
        TotalRows   int              `json:"total_rows"`
        SuccessCount int             `json:"success_count"`
        FailedCount  int             `json:"failed_count"`
        Errors      []ImportError    `json:"errors,optional"`
        UserIds     []string         `json:"user_ids"`
    }
    
    // === 统计信息 ===
    GetStatisticsResp {
        Total            int64   `json:"total"`
        Active           int64   `json:"active"`
        Locked           int64   `json:"locked"`
        Inactive         int64   `json:"inactive"`
        NoOrgBinding     int64   `json:"no_org_binding"`
        NoPermissionRole int64   `json:"no_permission_role"`
        RecentActiveRate float64 `json:"recent_active_rate"`
    }
    
    // === 通用类型 ===
    User {
        Id            string    `json:"id"`
        Name          string    `json:"name"`
        Email         string    `json:"email"`
        Phone         string    `json:"phone,optional"`
        DeptId        string    `json:"dept_id,optional"`
        Status        int8      `json:"status"`
        AccountSource string    `json:"account_source"`
        LastLogin     string    `json:"last_login,optional"`
        CreatedAt     string    `json:"created_at"`
        CreatedBy     string    `json:"created_by,optional"`
        UpdatedAt     string    `json:"updated_at"`
        UpdatedBy     string    `json:"updated_by,optional"`
    }
    
    RoleBinding {
        Id             int64  `json:"id"`
        UserId         string `json:"user_id"`
        OrgId          string `json:"org_id"`
        Position       string `json:"position,optional"`
        PermissionRole string `json:"permission_role,optional"`
    }
    
    RoleBindingInput {
        OrgId          string `json:"org_id" validate:"required"`
        Position       string `json:"position,optional"`
        PermissionRole string `json:"permission_role,optional"`
    }
    
    AuditLog {
        Id         int64             `json:"id"`
        Action     string            `json:"action"`
        Operator   string            `json:"operator"`
        OperatorId string            `json:"operator_id"`
        Changes    map[string]interface{} `json:"changes,optional"`
        Timestamp  string            `json:"timestamp"`
    }
    
    OperationError {
        UserId string `json:"user_id"`
        Reason string `json:"reason"`
    }
    
    ImportError {
        Row    int    `json:"row"`
        Field  string `json:"field"`
        Reason string `json:"reason"`
    }
)

@server(
    prefix: /api/v1/user_management
    group: user_management
    jwt: Auth
)
service api {
    @doc "用户列表查询"
    @handler ListUsers
    get /users (ListUsersReq) returns (ListUsersResp)
    
    @doc "用户详情查询"
    @handler GetUser
    get /users/:id returns (GetUserResp)
    
    @doc "创建用户"
    @handler CreateUser
    post /users (CreateUserReq) returns (CreateUserResp)
    
    @doc "更新用户"
    @handler UpdateUser
    put /users/:id (UpdateUserReq) returns (BaseResp)
    
    @doc "批量更新用户状态"
    @handler BatchUpdateStatus
    post /users/batch-status (BatchUpdateStatusReq) returns (BatchUpdateStatusResp)
    
    @doc "解锁用户"
    @handler UnlockUser
    post /users/:id/unlock (UnlockUserReq) returns (BaseResp)
    
    @doc "删除用户"
    @handler DeleteUser
    delete /users/:id (DeleteUserReq) returns (DeleteUserResp)
    
    @doc "重置用户密码"
    @handler ResetPassword
    post /users/:id/reset-password (ResetPasswordReq) returns (ResetPasswordResp)
    
    @doc "批量导入用户"
    @handler BatchImport
    post /users/batch-import (BatchImportReq) returns (BatchImportResp)
    
    @doc "导出用户数据"
    @handler ExportUsers
    get /users/export (ListUsersReq) returns (stream)
    
    @doc "获取统计数据"
    @handler GetStatistics
    get /statistics returns (GetStatisticsResp)
}
```

---

## 与注册功能打通

### 修改注册逻辑

**文件**: `api/internal/logic/user/register_logic.go`

需要修改的地方：

1. **状态设置**: 将 `Status: 1` 改为 `Status: 0` (未激活)
2. **账号来源**: 添加 `AccountSource: "local"`
3. **姓名合并**: 创建 `Name` 字段（合并 FirstName 和 LastName）
4. **创建人记录**: 如果可以从上下文获取当前用户，记录 `CreatedBy`

```go
// 在 Register 方法中修改
user := &users.User{
    Id:            userID.String(),
    FirstName:     strings.TrimSpace(req.FirstName),
    LastName:      strings.TrimSpace(req.LastName),
    Name:          strings.TrimSpace(req.FirstName) + " " + strings.TrimSpace(req.LastName),
    Email:         email,
    Organization:  strings.TrimSpace(req.Organization),
    PasswordHash:  string(passwordHash),
    Status:        0,              // 改为未激活
    AccountSource: "local",        // 新增
    // Phone 和 DeptId 为可选，注册时不设置
}
```

### 首次登录激活

**文件**: `api/internal/logic/user/login_logic.go`

在用户首次成功登录时，检查状态是否为"未激活"，如果是则自动激活：

```go
// 在 Login 方法中，验证密码成功后
if createdUser.Status == 0 { // 未激活状态
    createdUser.Status = 1 // 激活
    err := l.svcCtx.UserModel.UpdateStatus(l.ctx, createdUser.Id, 1, "首次登录激活", createdUser.Id)
    if err != nil {
        l.Errorf("激活用户失败: %v", err)
        // 记录日志但不影响登录流程
    }
}
```

---

## Testing Strategy

| 类型 | 方法 | 覆盖率 |
|------|------|--------|
| 单元测试 | 表驱动测试，Mock Model | > 80% |
| 集成测试 | 测试数据库，Mock外部依赖（邮件服务） | 核心流程 |
| 性能测试 | 批量操作、列表查询性能 | 关键接口 |

### 测试重点

1. **用户列表查询**: 分页、筛选、排序功能
2. **用户创建**: 参数校验、唯一性检查、状态设置
3. **批量操作**: 部分失败场景处理
4. **注册功能打通**: 注册用户状态和账号来源设置
5. **审计日志**: 操作日志记录完整性
6. **权限校验**: 操作权限验证

---

## 实施计划

### Phase 1: 数据库扩展 (1-2天)
- 扩展 users 表字段
- 创建 role_bindings 表
- 创建 audit_logs 表
- 更新现有数据（设置name字段）

### Phase 2: Model层实现 (2-3天)
- 扩展 users Model接口和实现
- 实现 role_bindings Model
- 实现 audit_logs Model
- 编写Model层单元测试

### Phase 3: API定义和生成 (1天)
- 定义 user_management.api
- 使用goctl生成Handler和Types
- 更新api.api入口文件

### Phase 4: Logic层实现 - 核心功能 (3-4天)
- 用户列表查询逻辑
- 用户详情查询逻辑
- 创建用户逻辑
- 更新用户逻辑
- 编写Logic层单元测试

### Phase 5: Logic层实现 - 高级功能 (2-3天)
- 批量状态更新逻辑
- 解锁用户逻辑
- 删除用户逻辑
- 重置密码逻辑
- 编写Logic层单元测试

### Phase 6: Logic层实现 - 导入导出 (2天)
- 批量导入逻辑（Excel/CSV解析）
- 导出用户数据逻辑
- 编写Logic层单元测试

### Phase 7: 统计功能 (1天)
- 统计数据查询逻辑
- 编写Logic层单元测试

### Phase 8: 注册功能打通 (1天)
- 修改注册逻辑
- 修改登录逻辑（首次登录激活）
- 编写集成测试

### Phase 9: 集成测试和优化 (2-3天)
- 端到端集成测试
- 性能优化
- 代码审查和重构

**总预计时间**: 15-21天

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-21 | - | 初始版本 |
