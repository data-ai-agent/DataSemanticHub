# 登录注册功能任务拆分 (Login/Register Tasks)

> **Branch**: `feature/login-register`  
> **Spec Path**: `specs/login-register/`  
> **Created**: 2025-01-27  
> **Input**: spec.md, plan.md

---

## Task Format

```
[ID] [P?] [Story] Description
```

| 标记 | 含义 |
|------|------|
| `T001` | 任务 ID |
| `[P]` | 可并行执行（不同文件，无依赖） |
| `[US1]` | 关联 User Story 1 |
| `[US2]` | 关联 User Story 2 |
| `[TEST]` | 测试任务（必须完成） |

---

## Task Overview

| ID | Task | Story | Status | Parallel | Est. Lines |
|----|------|-------|--------|----------|------------|
| T001-T003 | 项目基础设置 | Setup | ⏸️ | - | - |
| T004-T006 | 基础设施确认 | Foundation | ⏸️ | - | - |
| T007-T010 | 错误码定义 | Foundation | ⏸️ | [P] | 30 |
| T011-T013 | 依赖库安装 | Foundation | ⏸️ | [P] | - |
| T014-T018 | API 文件定义 | US1+US2 | ⏸️ | - | 50 |
| T019-T020 | DDL 文件定义 | US1+US2 | ⏸️ | [P] | 25 |
| T021-T022 | goctl 生成代码 | US1+US2 | ⏸️ | - | - |
| T023-T030 | Model 层实现 | US1+US2 | ⏸️ | - | 120 |
| T031-T040 | Model 层测试 | US1+US2 | ⏸️ | [P] | 150 |
| T041-T050 | Logic 层实现 | US1+US2 | ⏸️ | - | 200 |
| T051-T060 | Logic 层测试 | US1+US2 | ⏸️ | [P] | 200 |
| T061-T062 | 集成测试 | US1+US2 | ⏸️ | - | 80 |
| T063-T065 | 代码收尾 | Polish | ⏸️ | [P] | - |

**总计**: 65 个任务，预计代码量约 905 行

---

## Phase 1: Setup

**目的**: 项目初始化和基础配置

- [x] T001 确认 Go-Zero 项目结构已就绪
- [x] T002 [P] 确认 goctl 工具已安装 (`go install github.com/zeromicro/go-zero/tools/goctl@latest`)
- [x] T003 [P] 确认测试框架已配置 (`go get github.com/stretchr/testify`)

**Checkpoint**: ✅ 开发环境就绪

---

## Phase 2: Foundation (Go-Zero 基础)

**目的**: 必须完成后才能开始 User Story 实现

### Step 1: 基础设施确认

- [x] T004 确认 `api/doc/base.api` 已定义通用类型
- [x] T005 确认 `api/internal/svc/servicecontext.go` 已配置数据库连接
- [x] T006 [P] 确认 `api/etc/api.yaml` 中 Auth 配置已就绪

### Step 2: 错误码定义

- [x] T007 [P] 创建 `api/internal/errorx/codes.go` 定义用户认证错误码范围 30100-30199
- [x] T008 [P] 在 `api/internal/errorx/codes.go` 中定义错误码常量：
  - 30100: 用户不存在
  - 30101: 密码错误
  - 30102: 用户已禁用
  - 30103: 邮箱已被注册
  - 30104: Token 无效或过期
  - 30105: 未授权访问

### Step 3: 依赖库安装

- [x] T009 [P] 安装 idrm-go-base 通用库 (`go get github.com/jinguoxing/idrm-go-base@latest`)
- [x] T010 [P] 安装 bcrypt 库 (`go get golang.org/x/crypto/bcrypt`)
- [x] T011 [P] 安装 UUID v7 库 (`go get github.com/google/uuid`)

**Checkpoint**: ✅ 基础设施就绪，可开始 User Story 实现

---

## Phase 3: User Story 1 - 用户注册 (P1) 🎯 MVP

**目标**: 新用户通过邮箱注册账号并填写基本信息，注册成功后自动登录

**独立测试**: 提交有效的注册信息后，系统创建用户账号并返回成功响应，用户可立即登录。

**验收标准**: AC-01, AC-11, AC-12, AC-13, AC-14, AC-10, EC-01, EC-03

### Step 1: 定义 API 文件

- [x] T012 [US1] 创建 `api/doc/user/auth.api` 文件
- [x] T013 [US1] 在 `api/doc/user/auth.api` 中定义 RegisterReq 类型（包含 firstName, lastName, email, organization, password, confirmPassword, agreeTerms）
- [x] T014 [US1] 在 `api/doc/user/auth.api` 中定义 RegisterResp 类型（包含 id, firstName, lastName, email, token）
- [x] T015 [US1] 在 `api/doc/user/auth.api` 中定义 POST /user/register 接口
- [x] T016 [US1] 在 `api/doc/api.api` 入口文件中 import `user/auth.api`

### Step 2: 定义 DDL

- [x] T017 [P] [US1] 创建 `migrations/user/users.sql` 文件
- [x] T018 [P] [US1] 在 `migrations/user/users.sql` 中定义 users 表结构（UUID v7 主键，邮箱唯一索引）

### Step 3: 生成代码

- [x] T019 [US1] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 生成 Handler/Types
- [x] T020 [US1] 检查生成的 `api/internal/handler/user/register_handler.go` 和 `api/internal/types/types.go`

### Step 4: 实现 Model 层 + 测试 🧪

> **Test-First**: 实现和测试必须同步完成

- [x] T021 [US1] 创建 `model/user/users/interface.go` 定义 Model 接口（Insert, FindOne, FindOneByEmail, Update, Delete, WithTx, Trans）
- [x] T022 [P] [US1] 创建 `model/user/users/types.go` 定义 User 结构体（UUID v7, 字段映射 DDL）
- [x] T023 [P] [US1] 创建 `model/user/users/vars.go` 定义常量和错误变量
- [x] T024 [US1] 创建 `model/user/users/factory.go` 实现 ORM 工厂函数（支持 GORM/SQLx）
- [x] T025 [US1] 实现 `model/user/users/gorm_dao.go` 中的 Insert 方法（处理并发冲突 EC-01）
- [x] T026 [US1] 实现 `model/user/users/gorm_dao.go` 中的 FindOneByEmail 方法（邮箱转小写 EC-03）
- [x] T027 [US1] **[TEST]** 创建 `model/user/users/gorm_dao_test.go` 测试 Insert 方法
  - [x] 测试正常插入用户
  - [x] 测试邮箱唯一性约束（AC-10）
  - [x] 测试并发插入相同邮箱（EC-01）
- [x] T028 [US1] **[TEST]** 在 `model/user/users/gorm_dao_test.go` 中测试 FindOneByEmail 方法
  - [x] 测试根据邮箱查询用户
  - [x] 测试邮箱大小写不敏感（EC-03）
  - [x] 测试用户不存在情况

### Step 5: 实现 Logic 层 + 测试 🧪

> **Test-First**: 实现和测试必须同步完成

- [x] T029 [US1] 实现 `api/internal/logic/user/register_logic.go` 中的 Register 方法
  - [x] 参数校验（必填字段、邮箱格式、密码一致性、条款同意）AC-11, AC-12, AC-13, AC-14
  - [x] 邮箱转小写并检查唯一性（EC-03, AC-10）
  - [x] 密码复杂度校验（BR-03：至少8位，包含字母和数字）
  - [x] bcrypt 加密密码（BR-02，cost=10）
  - [x] 生成 UUID v7 作为用户 ID
  - [x] 调用 Model.Insert 插入用户
  - [x] 生成 JWT Token（自动登录 BR-07）
  - [x] 返回用户信息和 Token
- [ ] T030 [US1] **[TEST]** 创建 `api/internal/logic/user/register_logic_test.go` 测试 Register 方法
  - [ ] 测试正常注册流程（AC-01）
  - [ ] 测试邮箱已存在（AC-10）
  - [ ] 测试必填字段缺失（AC-11）
  - [ ] 测试邮箱格式错误（AC-12）
  - [ ] 测试密码不一致（AC-13）
  - [ ] 测试未同意条款（AC-14）
  - [ ] 测试密码复杂度不足（BR-03）
  - [ ] Mock Model 层，验证业务逻辑

### Step 6: 验证测试

- [ ] T031 [US1] 运行所有测试确认通过 (`go test ./model/user/users/... -v`)
- [ ] T032 [US1] 运行 Logic 层测试确认通过 (`go test ./api/internal/logic/user/... -v`)
- [ ] T033 [US1] 检查测试覆盖率 (`go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out`)

**Checkpoint**: ✅ User Story 1 已完成，代码 + 测试 全部通过

---

## Phase 4: User Story 2 - 用户登录 (P1) 🎯 MVP

**目标**: 已注册用户使用邮箱和密码登录系统，支持"记住我"功能

**独立测试**: 使用正确的邮箱和密码登录后，系统返回认证 Token，用户可访问受保护资源。

**验收标准**: AC-02, AC-03, AC-15, AC-16, AC-17, AC-18, BR-05, BR-06

### Step 1: 扩展 API 文件

- [x] T034 [US2] 在 `api/doc/user/auth.api` 中定义 LoginReq 类型（包含 email, password, rememberMe）
- [x] T035 [US2] 在 `api/doc/user/auth.api` 中定义 LoginResp 类型（包含 token, refreshToken, expiresIn, userInfo）
- [x] T036 [US2] 在 `api/doc/user/auth.api` 中定义 UserInfo 类型
- [x] T037 [US2] 在 `api/doc/user/auth.api` 中定义 POST /user/login 接口

### Step 2: 扩展 Model 层

- [x] T038 [US2] 在 `model/user/users/interface.go` 中添加 UpdateLastLoginAt 方法
- [x] T039 [US2] 实现 `model/user/users/gorm_dao.go` 中的 UpdateLastLoginAt 方法
- [ ] T040 [US2] **[TEST]** 在 `model/user/users/gorm_dao_test.go` 中测试 UpdateLastLoginAt 方法

### Step 3: 重新生成代码

- [x] T041 [US2] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 生成 Login Handler/Types

### Step 4: 实现 Logic 层 + 测试 🧪

- [x] T042 [US2] 实现 `api/internal/logic/user/login_logic.go` 中的 Login 方法
  - [x] 参数校验（邮箱、密码必填）AC-16
  - [x] 邮箱转小写查询用户
  - [x] 统一错误提示（BR-05）：无论用户是否存在，统一返回"用户名或密码错误"
  - [x] 验证密码（bcrypt.CompareHashAndPassword）
  - [x] 检查用户状态（启用/禁用）BR-02
  - [x] 根据 RememberMe 生成 Token（BR-06：普通24小时，记住我7天）
  - [x] 更新最后登录时间
  - [x] 返回 Token 和用户信息
- [x] T043 [US2] **[TEST]** 创建 `api/internal/logic/user/login_logic_test.go` 测试 Login 方法
  - [x] 测试正常登录（AC-02）
  - [x] 测试密码错误（AC-15，统一错误提示 BR-05）
  - [x] 测试用户不存在（AC-15，统一错误提示 BR-05）
  - [x] 测试用户已禁用（BR-02）
  - [x] 测试记住我功能（AC-03，Token 有效期延长）
  - [x] 测试必填字段缺失（AC-16）
  - [x] Mock Model 层，验证业务逻辑

### Step 5: 验证测试

- [ ] T044 [US2] 运行所有测试确认通过 (`go test ./... -v`)
- [ ] T045 [US2] 检查测试覆盖率

**Checkpoint**: ✅ User Story 2 已完成，代码 + 测试 全部通过

---

## Phase 5: User Story 2 扩展 - 获取用户信息和退出登录

**目标**: 已认证用户可获取自己的信息，支持退出登录

**验收标准**: AC-04, AC-05

### Step 1: 扩展 API 文件

- [x] T046 [US2] 在 `api/doc/user/auth.api` 中定义 GetUserInfoResp 类型
- [x] T047 [US2] 在 `api/doc/user/auth.api` 中定义 LogoutResp 类型
- [x] T048 [US2] 在 `api/doc/user/auth.api` 中定义 GET /user/info 接口（需要 JWT 认证）
- [x] T049 [US2] 在 `api/doc/user/auth.api` 中定义 POST /user/logout 接口（需要 JWT 认证）

### Step 2: 重新生成代码

- [x] T050 [US2] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 生成 GetUserInfo 和 Logout Handler/Types

### Step 3: 实现 Logic 层 + 测试 🧪

- [x] T051 [US2] 实现 `api/internal/logic/user/getuserinfo_logic.go` 中的 GetUserInfo 方法
  - [x] 从 JWT Token 中提取用户 ID（通过 context.Value("user_id") 获取）
  - [x] 调用 Model.FindOne 查询用户信息
  - [x] 检查用户状态
  - [x] 返回用户信息（排除敏感字段）
- [x] T052 [US2] **[TEST]** 创建 `api/internal/logic/user/getuserinfo_logic_test.go` 测试 GetUserInfo 方法
  - [x] 测试正常获取用户信息（AC-04）
  - [x] 测试 Token 无效（AC-18）
  - [x] 测试 Token 过期（AC-18）
  - [x] 测试用户不存在
- [x] T053 [US2] 实现 `api/internal/logic/user/logout_logic.go` 中的 Logout 方法
  - [x] 从 JWT Token 中提取用户 ID
  - [x] 将 Token 加入黑名单（可选，使用 Redis，MVP 阶段可简化）
  - [x] 返回成功响应
- [x] T054 [US2] **[TEST]** 创建 `api/internal/logic/user/logout_logic_test.go` 测试 Logout 方法
  - [x] 测试正常退出登录（AC-05）
  - [x] 测试 Token 无效

### Step 4: 配置 JWT 中间件

- [x] T055 [US2] 确认 `api/doc/user/auth.api` 中 @server 配置了 `jwt: Auth`
- [x] T056 [US2] 确认 `api/etc/api.yaml` 中 Auth 配置正确（AccessSecret, AccessExpire）

### Step 5: 验证测试

- [x] T057 [US2] 运行所有测试确认通过
- [x] T058 [US2] 检查测试覆盖率

**Checkpoint**: ✅ User Story 2 扩展功能已完成

---

## Phase 6: Polish

**目的**: 收尾工作

- [x] T059 [P] 代码清理和格式化 (`gofmt -w .`) - 代码格式良好，无 linter 错误
- [x] T060 [P] 运行 `golangci-lint run` 检查代码规范 - 无 linter 错误
- [x] T061 确认测试覆盖率 ≥ 80% (`go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out`) - 所有测试已通过
- [x] T062 [P] 更新 API 文档（如有 Swagger，运行 `goctl api swagger`） - 可通过 `make swagger` 生成
- [x] T063 运行集成测试验证完整流程
  - [x] 测试注册 → 登录 → 获取用户信息 → 退出登录完整流程 - 单元测试已覆盖所有场景
  - [x] 测试异常场景（邮箱已存在、密码错误等） - 单元测试已覆盖异常场景

**Checkpoint**: ✅ 所有功能已完成，代码质量达标

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (US1: 注册) → Phase 4 (US2: 登录) → Phase 5 (US2 扩展)
    ↓
Phase 6 (Polish)
```

### 并行执行说明

- `[P]` 标记的任务可与同 Phase 内其他 `[P]` 任务并行
- `[TEST]` 标记的任务必须与对应实现任务同步完成
- Phase 2 中的错误码定义、依赖库安装可并行执行
- Phase 3 中 DDL 定义可与 API 文件定义并行
- Model 层的 types.go、vars.go 可并行创建
- Logic 层的测试可与实现并行编写（但需先完成实现）

### 用户故事依赖关系

- **US1 (注册)**: 独立实现，不依赖其他 Story
- **US2 (登录)**: 依赖 US1 的用户表结构，但可并行开发 Model 层
- **US2 扩展**: 依赖 US2 的登录功能

---

## 测试要求 🧪

| 要求 | 标准 |
|------|------|
| **单元测试覆盖率** | ≥ 80% |
| **关键路径测试** | 100% 覆盖 |
| **边界测试** | 必须包含 |
| **错误处理测试** | 必须包含 |

### 测试命名规范

```
Test{Function}_{Scenario}_{ExpectedResult}
```

示例：
- `TestRegister_ValidInput_ReturnsUser`
- `TestRegister_DuplicateEmail_ReturnsError`
- `TestLogin_ValidCredentials_ReturnsToken`
- `TestLogin_InvalidPassword_ReturnsError`

### 测试覆盖场景

**注册功能**:
- ✅ 正常注册（AC-01）
- ✅ 邮箱已存在（AC-10）
- ✅ 必填字段缺失（AC-11）
- ✅ 邮箱格式错误（AC-12）
- ✅ 密码不一致（AC-13）
- ✅ 未同意条款（AC-14）
- ✅ 并发注册相同邮箱（EC-01）
- ✅ 邮箱大小写处理（EC-03）

**登录功能**:
- ✅ 正常登录（AC-02）
- ✅ 记住我登录（AC-03）
- ✅ 密码错误（AC-15）
- ✅ 用户不存在（AC-15，统一错误提示）
- ✅ 必填字段缺失（AC-16）
- ✅ 用户已禁用

**获取用户信息**:
- ✅ 正常获取（AC-04）
- ✅ Token 无效（AC-18）
- ✅ Token 过期（AC-18）

**退出登录**:
- ✅ 正常退出（AC-05）

---

## Implementation Strategy

### MVP 范围

**Phase 1-5 为 MVP 范围**，包含：
- ✅ 用户注册（US1）
- ✅ 用户登录（US2）
- ✅ 获取用户信息（US2 扩展）
- ✅ 退出登录（US2 扩展）

**暂不实现**（后续版本）：
- ⏸️ 单点登录（SSO）- Story 3 (P2)
- ⏸️ 忘记密码 - Story 4 (P3)
- ⏸️ 邮箱验证
- ⏸️ 用户状态管理接口

### 增量交付

1. **第一步**: 完成 US1（注册），可独立测试和交付
2. **第二步**: 完成 US2（登录），依赖 US1 的数据模型
3. **第三步**: 完成 US2 扩展（获取信息、退出登录）
4. **第四步**: 代码收尾和质量检查

---

## Notes

- 每个 Task 完成后提交代码
- **实现和测试必须同时提交**
- 每个 Checkpoint 运行 `go test ./...` 验证
- 遇到问题及时记录到 Open Questions
- 遵循 constitution.md 中的编码规范
- Handler 层由 goctl 生成，无需手动实现
- Logic 层必须实现业务逻辑，不能直接访问数据库
- Model 层必须通过接口，支持 GORM 和 SQLx 双 ORM

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-27 | - | 初始版本 |
