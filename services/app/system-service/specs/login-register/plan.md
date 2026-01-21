# 登录注册功能技术设计文档 (Login/Register Technical Plan)

> **Branch**: `feature/login-register`  
> **Spec Path**: `specs/login-register/`  
> **Created**: 2025-01-27  
> **Status**: Draft

---

## Summary

基于 Go-Zero 框架实现用户注册、登录、获取用户信息和退出登录功能。采用 JWT Token 认证机制，使用 bcrypt 加密存储密码，遵循分层架构（Handler → Logic → Model）。用户表使用 UUID v7 作为主键，支持"记住我"功能的长期 Token。

---

## Technical Context

| Item | Value |
|------|-------|
| **Language** | Go 1.24+ |
| **Framework** | Go-Zero v1.9+ |
| **Storage** | MySQL 8.0 |
| **Cache** | Redis 7.0 (可选，用于 Token 黑名单) |
| **ORM** | GORM / SQLx |
| **Testing** | go test |
| **Common Lib** | idrm-go-base v0.1.0+ |
| **JWT Library** | go-zero 内置 JWT |
| **Password Hash** | golang.org/x/crypto/bcrypt |

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
| 用户认证 | 30100-30199 | `api/internal/errorx/codes.go` |

**错误码定义**:
- 30100: 用户不存在
- 30101: 密码错误
- 30102: 用户已禁用
- 30103: 邮箱已被注册
- 30104: Token 无效或过期
- 30105: 未授权访问

### 第三方库确认

| 库 | 原因 | 确认状态 |
|----|------|----------|
| golang.org/x/crypto/bcrypt | 密码加密（符合 BR-02），通用库未提供 | ✅ 已确认 |
| github.com/google/uuid | UUID v7 生成（符合主键规范） | ✅ 已确认 |

---

## Go-Zero 开发流程

按以下顺序完成技术设计和代码生成：

| Step | 任务 | 方式 | 产出 |
|------|------|------|------|
| 1 | 定义 API 文件 | AI 实现 | `api/doc/user/auth.api` |
| 2 | 生成 Handler/Types | goctl 生成 | `api/internal/handler/user/`, `types/` |
| 3 | 定义 DDL 文件 | AI 手写 | `migrations/user/users.sql` |
| 4 | 实现 Model 接口 | AI 手写 | `model/user/users/` |
| 5 | 实现 Logic 层 | AI 实现 | `api/internal/logic/user/` |

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
| 1 | API 文件 | AI 实现 | `api/doc/user/auth.api` |
| 2 | DDL 文件 | AI 实现 | `migrations/user/users.sql` |
| 3 | Handler | goctl 生成 | `api/internal/handler/user/` |
| 4 | Types | goctl 生成 | `api/internal/types/` |
| 5 | Logic | AI 实现 | `api/internal/logic/user/` |
| 6 | Model | AI 实现 | `model/user/users/` |

### 代码结构

```
api/internal/
├── handler/user/
│   ├── register_handler.go      # goctl 生成
│   ├── login_handler.go
│   ├── getuserinfo_handler.go
│   ├── logout_handler.go
│   └── routes.go
├── logic/user/
│   ├── register_logic.go        # AI 实现
│   ├── login_logic.go
│   ├── getuserinfo_logic.go
│   └── logout_logic.go
├── types/
│   └── types.go                 # goctl 生成
└── svc/
    └── servicecontext.go        # 手动维护

model/user/users/
├── interface.go                 # 接口定义
├── types.go                     # 数据结构
├── vars.go                      # 常量/错误
├── factory.go                   # ORM 工厂
├── gorm_dao.go                  # GORM 实现
└── sqlx_model.go                # SQLx 实现
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

## Interface Definitions

### User Model 接口

```go
type Model interface {
    // 插入用户
    Insert(ctx context.Context, data *User) (*User, error)
    
    // 根据 ID 查询
    FindOne(ctx context.Context, id string) (*User, error)
    
    // 根据邮箱查询
    FindOneByEmail(ctx context.Context, email string) (*User, error)
    
    // 更新用户
    Update(ctx context.Context, data *User) error
    
    // 更新最后登录时间
    UpdateLastLoginAt(ctx context.Context, id string, loginAt time.Time) error
    
    // 删除用户（软删除）
    Delete(ctx context.Context, id string) error
    
    // 事务支持
    WithTx(tx interface{}) Model
    Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}
```

---

## Data Model

### DDL

**位置**: `migrations/user/users.sql`

```sql
CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL COMMENT '用户ID (UUID v7)',
    `first_name` VARCHAR(50) NOT NULL COMMENT '名',
    `last_name` VARCHAR(50) NOT NULL COMMENT '姓',
    `email` VARCHAR(255) NOT NULL COMMENT '邮箱（唯一）',
    `organization` VARCHAR(100) DEFAULT NULL COMMENT '组织/团队',
    `password_hash` VARCHAR(60) NOT NULL COMMENT '密码哈希 (bcrypt)',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间（软删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`),
    KEY `idx_email` (`email`),
    KEY `idx_status` (`status`),
    KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### Go Struct

```go
type User struct {
    Id           string         `gorm:"primaryKey;size:36" json:"id"`           // UUID v7
    FirstName    string         `gorm:"size:50;not null" json:"first_name"`     // 名
    LastName     string         `gorm:"size:50;not null" json:"last_name"`      // 姓
    Email        string         `gorm:"size:255;not null;uniqueIndex" json:"email"` // 邮箱（唯一）
    Organization string         `gorm:"size:100" json:"organization"`           // 组织
    PasswordHash string         `gorm:"size:60;not null" json:"-"`              // 密码哈希（不返回）
    Status       int8           `gorm:"default:1;not null" json:"status"`        // 状态：1-启用，0-禁用
    LastLoginAt  *time.Time     `gorm:"type:datetime" json:"last_login_at"`      // 最后登录时间
    CreatedAt    time.Time      `gorm:"autoCreateTime" json:"created_at"`        // 创建时间
    UpdatedAt    time.Time      `gorm:"autoUpdateTime" json:"updated_at"`        // 更新时间
    DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`                          // 软删除（不返回）
}
```

---

## API Contract

**位置**: `api/doc/user/auth.api`

```api
syntax = "v1"

info(
    title: "用户认证 API"
    desc: "用户注册、登录、获取信息、退出登录"
    version: "v1"
)

// 引入通用类型
import "../base.api"

type (
    // === 注册请求 ===
    RegisterReq {
        FirstName       string `json:"first_name" validate:"required,min=1,max=50"`
        LastName        string `json:"last_name" validate:"required,min=1,max=50"`
        Email           string `json:"email" validate:"required,email"`
        Organization    string `json:"organization" validate:"max=100"`
        Password        string `json:"password" validate:"required,min=8,max=128"`
        ConfirmPassword string `json:"confirm_password" validate:"required"`
        AgreeTerms      bool   `json:"agree_terms" validate:"required"`
    }
    
    // === 注册响应 ===
    RegisterResp {
        Id        string `json:"id"`
        FirstName string `json:"first_name"`
        LastName  string `json:"last_name"`
        Email     string `json:"email"`
        Token     string `json:"token"`
    }
    
    // === 登录请求 ===
    LoginReq {
        Email      string `json:"email" validate:"required,email"`
        Password   string `json:"password" validate:"required"`
        RememberMe bool   `json:"remember_me"`
    }
    
    // === 登录响应 ===
    LoginResp {
        Token        string    `json:"token"`
        RefreshToken string    `json:"refresh_token,optional"`
        ExpiresIn    int64     `json:"expires_in"`
        UserInfo     UserInfo  `json:"user_info"`
    }
    
    // === 用户信息 ===
    UserInfo {
        Id           string `json:"id"`
        FirstName    string `json:"first_name"`
        LastName     string `json:"last_name"`
        Email        string `json:"email"`
        Organization string `json:"organization,optional"`
    }
    
    // === 获取用户信息响应 ===
    GetUserInfoResp {
        UserInfo UserInfo `json:"user_info"`
    }
    
    // === 退出登录响应 ===
    LogoutResp {
        Message string `json:"message"`
    }
)

@server(
    prefix: /api/v1
    group: user
    jwt: Auth
)
service api {
    @doc "用户注册"
    @handler Register
    post /user/register (RegisterReq) returns (RegisterResp)
    
    @doc "用户登录"
    @handler Login
    post /user/login (LoginReq) returns (LoginResp)
    
    @doc "获取当前用户信息"
    @handler GetUserInfo
    get /user/info returns (GetUserInfoResp)
    
    @doc "退出登录"
    @handler Logout
    post /user/logout returns (LogoutResp)
}
```

---

## JWT 配置

### Token 生成策略

| 场景 | Access Token 有效期 | Refresh Token 有效期 |
|------|---------------------|---------------------|
| 普通登录 | 24 小时 (86400 秒) | 无 |
| 记住我登录 | 7 天 (604800 秒) | 30 天 (2592000 秒) |

### JWT Claims 结构

```go
type Claims struct {
    UserId string `json:"user_id"`
    Email  string `json:"email"`
    jwt.RegisteredClaims
}
```

### 配置文件更新

在 `api/etc/api.yaml` 中已配置：
```yaml
Auth:
  AccessSecret: ${ACCESS_SECRET}
  AccessExpire: ${ACCESS_EXPIRE:-7200}  # 默认 2 小时，需根据场景调整
```

**注意**: 需要在 Logic 层根据 `RememberMe` 参数动态设置 Token 有效期。

---

## Password Security

### bcrypt 配置

- **Cost**: 10 (符合 SC-04 要求)
- **算法**: bcrypt
- **存储**: 60 字符哈希值

### 密码验证规则

- **最小长度**: 8 字符
- **最大长度**: 128 字符
- **复杂度**: 至少包含字母和数字（BR-03）

### 实现示例

```go
import "golang.org/x/crypto/bcrypt"

// 生成密码哈希
hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)

// 验证密码
err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
```

---

## Business Logic Flow

### 注册流程

```
1. 接收注册请求
2. 参数校验（必填、格式、密码一致性、条款同意）
3. 邮箱转小写并检查唯一性（EC-03）
4. 密码复杂度校验（BR-03）
5. bcrypt 加密密码（BR-02）
6. 生成 UUID v7 作为用户 ID
7. 插入用户记录（处理并发冲突 EC-01）
8. 生成 JWT Token（自动登录 BR-07）
9. 返回用户信息和 Token
```

### 登录流程

```
1. 接收登录请求
2. 参数校验（邮箱、密码必填）
3. 邮箱转小写查询用户
4. 统一错误提示（BR-05）：无论用户是否存在，统一返回"用户名或密码错误"
5. 验证密码（bcrypt）
6. 检查用户状态（启用/禁用）
7. 根据 RememberMe 生成 Token（BR-06）
8. 更新最后登录时间
9. 返回 Token 和用户信息
```

### 获取用户信息流程

```
1. 从 JWT Token 中提取用户 ID
2. 查询用户信息
3. 检查用户状态
4. 返回用户信息（排除敏感字段）
```

### 退出登录流程

```
1. 从 JWT Token 中提取用户 ID
2. 将 Token 加入黑名单（可选，使用 Redis）
3. 返回成功响应
```

---

## Testing Strategy

| 类型 | 方法 | 覆盖率 |
|------|------|--------|
| 单元测试 | 表驱动测试，Mock Model | > 80% |
| 集成测试 | 测试数据库 | 核心流程 |

### 测试场景

1. **注册测试**
   - 正常注册
   - 邮箱已存在
   - 参数校验失败
   - 密码不一致
   - 未同意条款

2. **登录测试**
   - 正常登录
   - 密码错误
   - 用户不存在（统一错误提示）
   - 用户已禁用
   - 记住我功能

3. **获取用户信息测试**
   - 正常获取
   - Token 无效
   - Token 过期

4. **退出登录测试**
   - 正常退出
   - Token 无效

---

## Security Considerations

1. **密码安全**
   - 使用 bcrypt 加密存储
   - 不在日志中记录密码
   - 不在响应中返回密码哈希

2. **Token 安全**
   - Token 存储在客户端（localStorage/sessionStorage）
   - 支持 Token 黑名单机制（Redis）
   - Token 过期后需重新登录

3. **登录安全**
   - 统一错误提示，不泄露账户是否存在
   - 支持登录失败锁定机制（EC-07，可选实现）

4. **数据安全**
   - 邮箱统一小写存储
   - 软删除支持数据恢复

---

## Performance Considerations

1. **数据库索引**
   - email 字段唯一索引
   - status 字段索引（查询启用用户）
   - deleted_at 字段索引（软删除查询）

2. **缓存策略**
   - 用户信息可缓存（Redis，TTL 5 分钟）
   - Token 黑名单使用 Redis

3. **响应时间目标**
   - 注册接口: < 300ms (P99)
   - 登录接口: < 200ms (P99)

---

## Open Questions Resolution

基于 spec.md 中的待澄清问题，技术方案做出以下决策：

1. **密码复杂度**: 最小 8 位，必须包含字母和数字（BR-03）
2. **记住我 Token 有效期**: Access Token 7 天，Refresh Token 30 天（BR-06）
3. **SSO 功能**: MVP 阶段仅预留接口，返回提示信息（BR-08）
4. **忘记密码功能**: MVP 阶段暂不实现，后续版本补充（P3 优先级）
5. **邮箱验证**: MVP 阶段暂不实现，注册后直接可用
6. **用户状态管理**: MVP 阶段仅支持数据库直接操作，管理员接口后续版本实现

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-27 | - | 初始版本 |
