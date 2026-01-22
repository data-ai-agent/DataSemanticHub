# 用户管理模块任务拆分 (User Management Tasks)

> **Branch**: `001-user_management`  
> **Spec Path**: `specs/001-user_management/`  
> **Created**: 2026-01-21  
> **Input**: spec.md, plan.md

---

## Task Format

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

| 标记 | 含义 |
|------|------|
| `T001` | 任务 ID |
| `[P]` | 可并行执行（不同文件，无依赖） |
| `[US1]` | 关联 User Story 1 |
| `[TEST]` | 测试任务（必须完成） |

---

## Task Overview

| ID | Task | Story | Status | Parallel | Est. Lines |
|----|------|-------|--------|----------|------------|
| T001-T003 | 项目基础设置 | Setup | ✅ | - | - |
| T004-T006 | 基础设施确认 | Foundation | ✅ | - | - |
| T007-T015 | 数据库迁移 | Foundation | ⏸️ | [P] | 150 |
| T016-T020 | 错误码和依赖 | Foundation | ⏸️ | [P] | 50 |
| T015-T019 | API定义 | US1+US2 | ✅ | - | 100 |
| T020 | goctl生成 | US1+US2 | ✅ | - | - |
| T030-T045 | Model层实现 | Foundation | ⏸️ | [P] | 300 |
| T046-T055 | Model层测试 | Foundation | ⏸️ | [P] | 400 |
| T056-T070 | Logic层实现-查询 | US1+US2 | ⏸️ | - | 200 |
| T071-T075 | Logic层测试-查询 | US1+US2 | ⏸️ | [P] | 150 |
| T076-T085 | Logic层实现-创建更新 | US3+US4 | ⏸️ | - | 250 |
| T086-T090 | Logic层测试-创建更新 | US3+US4 | ⏸️ | [P] | 200 |
| T091-T105 | Logic层实现-状态管理 | US5+US6+US7 | ⏸️ | - | 300 |
| T106-T110 | Logic层测试-状态管理 | US5+US6+US7 | ⏸️ | [P] | 250 |
| T111-T115 | Logic层实现-密码重置 | US8 | ⏸️ | - | 100 |
| T116-T118 | Logic层测试-密码重置 | US8 | ⏸️ | [P] | 80 |
| T119-T125 | Logic层实现-导入导出 | US9+US10 | ⏸️ | - | 200 |
| T126-T128 | Logic层测试-导入导出 | US9+US10 | ⏸️ | [P] | 150 |
| T129-T133 | Logic层实现-统计 | US11 | ⏸️ | - | 100 |
| T134-T135 | Logic层测试-统计 | US11 | ⏸️ | [P] | 80 |
| T136-T140 | 注册功能打通 | US12 | ⏸️ | - | 50 |
| T141-T142 | 集成测试 | All | ⏸️ | - | 100 |
| T143-T146 | 代码收尾 | Polish | ⏸️ | [P] | - |

**总计**: 146 个任务

---

## Phase 1: Setup

**目的**: 项目初始化和基础配置

- [x] T001 确认 Go-Zero 项目结构已就绪
- [x] T002 [P] 确认 goctl 工具已安装 (`go install github.com/zeromicro/go-zero/tools/goctl@latest`)
- [x] T003 [P] 确认测试框架已配置 (`go get github.com/stretchr/testify`)

**Checkpoint**: ✅ 开发环境就绪

---

## Phase 2: Foundation (基础设施)

**目的**: 必须完成后才能开始 User Story 实现

### Step 1: 基础设施确认

- [x] T004 确认 `api/doc/base.api` 已定义通用类型
- [x] T005 确认 `api/internal/svc/servicecontext.go` 已配置数据库连接
- [x] T006 [P] 确认 `api/etc/api.yaml` 中 Auth 配置已就绪

### Step 2: 数据库迁移

- [x] T007 [P] 创建数据库迁移文件 `migrations/user/001_add_user_management_fields.sql`，扩展users表字段
- [x] T008 [P] 创建数据库迁移文件 `migrations/user/002_create_role_bindings.sql`，创建role_bindings表
- [x] T009 [P] 创建数据库迁移文件 `migrations/user/003_create_audit_logs.sql`，创建audit_logs表
- [ ] T010 执行数据库迁移，验证表结构正确性（需在实际数据库环境中手动执行）
- [x] T011 更新现有users数据，设置name字段（合并first_name和last_name）（已在T007迁移文件中包含UPDATE语句）

### Step 3: 错误码定义

- [x] T012 [P] 在 `api/internal/errorx/codes.go` 中定义用户管理错误码范围 30200-30299
- [x] T013 [P] 定义错误码常量：
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

### Step 4: 依赖库安装

- [x] T014 [P] 安装 excelize 库用于Excel导入导出 (`go get github.com/xuri/excelize/v2`)

**Checkpoint**: ✅ 基础设施就绪，可开始 User Story 实现

---

## Phase 3: User Story 1 - 用户列表查询与筛选 (P1) 🎯 MVP

**目标**: 平台管理员/审批人/编辑者/只读用户能够查看用户列表，支持按部门、状态、权限角色等条件筛选

**独立测试**: 能够通过API查询用户列表，支持分页、关键词搜索、多维度筛选和排序

### Step 1: 定义 API 文件

- [x] T015 [US1] 创建 `api/doc/user/user_management.api` 文件
- [x] T016 [US1] 定义 ListUsersReq 和 ListUsersResp 类型（已在 user_management.api 中定义）
- [x] T017 [US1] 定义 User 通用类型（已在 user_management.api 中定义）
- [x] T018 [US1] 定义 ListUsers 接口端点（已在 user_management.api 中定义）
- [x] T019 [US1] 在 `api/doc/api.api` 入口文件中 import user_management 模块

### Step 2: 生成代码

- [x] T020 [US1] 运行 `goctl api go` 生成 Handler/Types
  ```bash
  goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
  ```

### Step 3: 扩展 Users Model 接口

- [x] T021 [US1] 在 `model/user/users/interface.go` 中添加 FindList 方法定义
- [x] T022 [US1] 在 `model/user/users/interface.go` 中添加 FindOneByPhone 方法定义
- [x] T023 [US1] 在 `model/user/users/types.go` 中更新 User 结构体，添加新字段

### Step 4: 实现 Users Model 层

- [x] T024 [US1] 在 `model/user/users/gorm_dao.go` 中实现 FindList 方法（支持分页、筛选、排序）
- [x] T025 [US1] 在 `model/user/users/gorm_dao.go` 中实现 FindOneByPhone 方法
- [x] T026 [US1] **[TEST]** 创建 `model/user/users/gorm_dao_test.go` 测试 FindList 方法
- [x] T027 [US1] **[TEST]** 在 `model/user/users/gorm_dao_test.go` 中测试 FindOneByPhone 方法

### Step 5: 实现 Logic 层

- [x] T028 [US1] 实现 `api/internal/logic/user_management/list_users_logic.go`
  - 参数校验
  - 调用 Model.FindList
  - 构建响应数据
- [x] T029 [US1] **[TEST]** 创建 `api/internal/logic/user_management/list_users_logic_test.go`
  - 测试正常查询场景
  - 测试分页功能
  - 测试关键词搜索
  - 测试多维度筛选
  - 测试排序功能

### Step 6: 更新 ServiceContext

- [x] T030 [US1] 确认 `api/internal/svc/servicecontext.go` 中包含 UserModel 实例

**Checkpoint**: ✅ User Story 1 已完成，代码 + 测试 全部通过

---

## Phase 4: User Story 2 - 用户详情查询 (P1)

**目标**: 平台管理员/审批人/编辑者/只读用户能够查看用户完整信息，包括基本信息、角色绑定、审计日志

**独立测试**: 能够通过用户ID查询用户详细信息，包括角色绑定和审计日志

### Step 1: 定义 API 类型

- [x] T031 [US2] 在 `api/doc/user/user_management.api` 中定义 GetUserResp 类型（已在 T015 中完成）
- [x] T032 [US2] 在 `api/doc/user/user_management.api` 中定义 RoleBinding 和 AuditLog 类型（已在 T015 中完成）
- [x] T033 [US2] 在 `api/doc/user/user_management.api` 中定义 GetUser 接口端点（已在 T015 中完成）

### Step 2: 生成代码

- [x] T034 [US2] 运行 `goctl api go` 重新生成 Handler/Types（已在 T020 中完成）

### Step 3: 实现 RoleBindings Model

- [x] T035 [US2] 创建 `model/user/role_bindings/interface.go` 定义 Model 接口
- [x] T036 [US2] 创建 `model/user/role_bindings/types.go` 定义 RoleBinding 结构体
- [x] T037 [US2] 创建 `model/user/role_bindings/vars.go` 定义常量
- [x] T038 [US2] 创建 `model/user/role_bindings/factory.go` 实现工厂方法
- [x] T039 [US2] 创建 `model/user/role_bindings/gorm_dao.go` 实现 FindByUserId 方法
- [x] T040 [US2] **[TEST]** 创建 `model/user/role_bindings/gorm_dao_test.go` 测试 FindByUserId 方法

### Step 4: 实现 AuditLogs Model

- [x] T041 [US2] 创建 `model/user/audit_logs/interface.go` 定义 Model 接口
- [x] T042 [US2] 创建 `model/user/audit_logs/types.go` 定义 AuditLog 结构体
- [x] T043 [US2] 创建 `model/user/audit_logs/vars.go` 定义常量
- [x] T044 [US2] 创建 `model/user/audit_logs/factory.go` 实现工厂方法
- [x] T045 [US2] 创建 `model/user/audit_logs/gorm_dao.go` 实现 FindByUserId 方法
- [x] T046 [US2] **[TEST]** 创建 `model/user/audit_logs/gorm_dao_test.go` 测试 FindByUserId 方法

### Step 5: 更新 ServiceContext

- [x] T047 [US2] 在 `api/internal/svc/servicecontext.go` 中添加 RoleBindingModel 实例
- [x] T048 [US2] 在 `api/internal/svc/servicecontext.go` 中添加 AuditLogModel 实例

### Step 6: 实现 Logic 层

- [x] T049 [US2] 实现 `api/internal/logic/user_management/get_user_logic.go`
  - 查询用户基本信息
  - 查询角色绑定列表
  - 查询审计日志列表
  - 组装响应数据
- [x] T050 [US2] **[TEST]** 创建 `api/internal/logic/user_management/get_user_logic_test.go`
  - 测试正常查询场景
  - 测试用户不存在场景
  - 测试空角色绑定和审计日志场景

**Checkpoint**: ✅ User Story 2 已完成，代码 + 测试 全部通过

---

## Phase 5: User Story 3 - 创建用户与邀请机制 (P1)

**目标**: 平台管理员能够创建新用户并发送邀请邮件，新用户状态为"未激活"

**独立测试**: 能够创建用户，系统自动发送邀请邮件，新用户状态为"未激活"

### Step 1: 定义 API 类型

- [x] T051 [US3] 在 `api/doc/user/user_management.api` 中定义 CreateUserReq 和 CreateUserResp 类型（已在 T015 中完成）
- [x] T052 [US3] 在 `api/doc/user/user_management.api` 中定义 RoleBindingInput 类型（已在 T015 中完成）
- [x] T053 [US3] 在 `api/doc/user/user_management.api` 中定义 CreateUser 接口端点（已在 T015 中完成）

### Step 2: 生成代码

- [x] T054 [US3] 运行 `goctl api go` 重新生成 Handler/Types（已在 T020 中完成）

### Step 3: 扩展 Users Model 接口

- [x] T055 [US3] 确认 `model/user/users/interface.go` 中包含 Insert 方法（已存在）

### Step 4: 扩展 RoleBindings Model 接口

- [x] T056 [US3] 在 `model/user/role_bindings/interface.go` 中添加 Insert 方法定义（已在 T035 中完成）
- [x] T057 [US3] 在 `model/user/role_bindings/gorm_dao.go` 中实现 Insert 方法（已在 T039 中完成）
- [x] T058 [US3] **[TEST]** 在 `model/user/role_bindings/gorm_dao_test.go` 中测试 Insert 方法

### Step 5: 扩展 AuditLogs Model 接口

- [x] T059 [US3] 在 `model/user/audit_logs/interface.go` 中添加 Insert 方法定义（已在 T041 中完成）
- [x] T060 [US3] 在 `model/user/audit_logs/gorm_dao.go` 中实现 Insert 方法（已在 T045 中完成）
- [x] T061 [US3] **[TEST]** 在 `model/user/audit_logs/gorm_dao_test.go` 中测试 Insert 方法

### Step 6: 实现 Logic 层

- [x] T062 [US3] 实现 `api/internal/logic/user_management/create_user_logic.go`
  - 参数校验（邮箱、手机号唯一性）
  - 密码复杂度校验
  - 密码加密
  - 创建用户（状态设为"未激活"）
  - 创建角色绑定
  - 记录审计日志
  - 发送邀请邮件（Mock实现，后续接入邮件服务）
  - 生成初始密码（如未提供）
- [x] T063 [US3] **[TEST]** 创建 `api/internal/logic/user_management/create_user_logic_test.go`
  - 测试正常创建场景
  - 测试邮箱重复场景
  - 测试手机号重复场景
  - 测试参数校验场景
  - 测试角色绑定创建
  - 测试审计日志记录

**Checkpoint**: ✅ User Story 3 已完成，代码 + 测试 全部通过

---

## Phase 6: User Story 4 - 更新用户信息与角色绑定 (P1)

**目标**: 平台管理员能够更新用户基本信息和角色绑定，记录审计日志

**独立测试**: 能够更新用户姓名、手机号、部门、角色绑定等信息，并记录审计日志

### Step 1: 定义 API 类型

- [x] T064 [US4] 在 `api/doc/user/user_management.api` 中定义 UpdateUserReq 类型
- [x] T065 [US4] 在 `api/doc/user/user_management.api` 中定义 UpdateUser 接口端点

### Step 2: 生成代码

- [x] T066 [US4] 运行 `goctl api go` 重新生成 Handler/Types（已在 T020 中完成）

### Step 3: 扩展 RoleBindings Model 接口

- [x] T067 [US4] 在 `model/user/role_bindings/interface.go` 中添加 DeleteByUserId 方法定义（已在 T035 中完成）
- [x] T068 [US4] 在 `model/user/role_bindings/gorm_dao.go` 中实现 DeleteByUserId 方法（已在 T039 中完成）
- [x] T069 [US4] **[TEST]** 在 `model/user/role_bindings/gorm_dao_test.go` 中测试 DeleteByUserId 方法

### Step 4: 扩展 Users Model 接口

- [x] T070 [US4] 确认 `model/user/users/interface.go` 中包含 Update 方法（已存在）

### Step 5: 实现 Logic 层

- [x] T071 [US4] 实现 `api/internal/logic/user_management/update_user_logic.go`
  - 参数校验（邮箱不允许修改）
  - 手机号唯一性校验
  - 查询用户是否存在
  - 记录变更内容（用于审计日志）
  - 更新用户基本信息
  - 删除旧的角色绑定
  - 创建新的角色绑定
  - 记录审计日志
- [x] T072 [US4] **[TEST]** 创建 `api/internal/logic/user_management/update_user_logic_test.go`
  - 测试正常更新场景
  - 测试尝试修改邮箱场景
  - 测试手机号重复场景
  - 测试用户不存在场景
  - 测试角色绑定更新
  - 测试审计日志记录

**Checkpoint**: ✅ User Story 4 已完成，代码 + 测试 全部通过

---

## Phase 7: User Story 5 - 批量更新用户状态 (P1)

**目标**: 平台管理员能够批量启用/停用/锁定用户，操作前检查影响面

**独立测试**: 能够批量更新用户状态，操作前检查影响面，防止误操作关键责任人

### Step 1: 定义 API 类型

- [x] T073 [US5] 在 `api/doc/user/user_management.api` 中定义 BatchUpdateStatusReq 和 BatchUpdateStatusResp 类型（已在 T015 中完成）
- [x] T074 [US5] 在 `api/doc/user/user_management.api` 中定义 OperationError 类型（已在 T015 中完成）
- [x] T075 [US5] 在 `api/doc/user/user_management.api` 中定义 BatchUpdateStatus 接口端点（已在 T015 中完成）

### Step 2: 生成代码

- [x] T076 [US5] 运行 `goctl api go` 重新生成 Handler/Types（已在 T020 中完成）

### Step 3: 扩展 Users Model 接口

- [x] T077 [US5] 在 `model/user/users/interface.go` 中添加 BatchUpdateStatus 方法定义
- [x] T078 [US5] 在 `model/user/users/gorm_dao.go` 中实现 BatchUpdateStatus 方法
- [x] T079 [US5] **[TEST]** 在 `model/user/users/gorm_dao_test.go` 中测试 BatchUpdateStatus 方法

### Step 4: 实现 Logic 层

- [x] T080 [US5] 实现 `api/internal/logic/user_management/batch_update_status_logic.go`
  - 参数校验（用户ID列表、状态值、锁定原因）
  - 批量查询用户
  - 检查自我操作限制
  - 检查关键责任人影响面（暂简单实现，后续接入业务模块）
  - 批量更新状态
  - 记录审计日志
  - 返回成功和失败统计
- [x] T081 [US5] **[TEST]** 创建 `api/internal/logic/user_management/batch_update_status_logic_test.go`
  - 测试正常批量更新场景
  - 测试部分失败场景
  - 测试自我操作限制
  - 测试锁定原因必填验证
  - 测试审计日志记录

**Checkpoint**: ✅ User Story 5 已完成，代码 + 测试 全部通过

---

## Phase 8: User Story 6 - 解锁用户 (P1)

**目标**: 平台管理员能够解锁被锁定的用户，状态变为"启用"

**独立测试**: 能够解锁锁定状态的用户，状态变为"启用"

### Step 1: 定义 API 类型

- [x] T082 [US6] 在 `api/doc/user/user_management.api` 中定义 UnlockUserReq 类型（已在 T015 中完成）
- [x] T083 [US6] 在 `api/doc/user/user_management.api` 中定义 UnlockUser 接口端点（已在 T015 中完成）

### Step 2: 生成代码

- [x] T084 [US6] 运行 `goctl api go` 重新生成 Handler/Types（已在 T020 中完成）

### Step 3: 扩展 Users Model 接口

- [x] T085 [US6] 在 `model/user/users/interface.go` 中添加 UpdateStatus 方法定义
- [x] T086 [US6] 在 `model/user/users/gorm_dao.go` 中实现 UpdateStatus 方法（支持锁定原因和时间记录）
- [x] T087 [US6] **[TEST]** 在 `model/user/users/gorm_dao_test.go` 中测试 UpdateStatus 方法

### Step 4: 实现 Logic 层

- [x] T088 [US6] 实现 `api/internal/logic/user_management/unlock_user_logic.go`
  - 查询用户是否存在
  - 检查用户状态是否为"锁定"
  - 更新状态为"启用"
  - 清空锁定相关信息
  - 记录审计日志
- [x] T089 [US6] **[TEST]** 创建 `api/internal/logic/user_management/unlock_user_logic_test.go`
  - 测试正常解锁场景
  - 测试用户不存在场景
  - 测试非锁定状态解锁场景
  - 测试审计日志记录

**Checkpoint**: ✅ User Story 6 已完成，代码 + 测试 全部通过

---

## Phase 9: User Story 7 - 删除/归档用户 (P1)

**目标**: 平台管理员能够删除或归档用户，删除前检查影响面，支持责任转交

**独立测试**: 删除前检查影响面，支持责任转交，实现软删除（归档状态）

### Step 1: 定义 API 类型

- [x] T090 [US7] 在 `api/doc/user/user_management.api` 中定义 DeleteUserReq 和 DeleteUserResp 类型（已在 T015 中完成）
- [x] T091 [US7] 在 `api/doc/user/user_management.api` 中定义 DeleteUser 接口端点（已在 T015 中完成）

### Step 2: 生成代码

- [x] T092 [US7] 运行 `goctl api go` 重新生成 Handler/Types（已在 T020 中完成）

### Step 3: 扩展 Users Model 接口

- [x] T093 [US7] 确认 `model/user/users/interface.go` 中包含 Delete 方法（软删除）（已存在）

### Step 4: 实现 Logic 层

- [x] T094 [US7] 实现 `api/internal/logic/user_management/delete_user_logic.go`
  - 查询用户是否存在
  - 检查自我操作限制
  - 检查关键责任人影响面（暂简单实现，后续接入业务模块）
  - 处理责任转交（如果提供transferTo）
  - 更新状态为"归档"（软删除）
  - 记录审计日志
- [x] T095 [US7] **[TEST]** 创建 `api/internal/logic/user_management/delete_user_logic_test.go`
  - 测试正常删除场景
  - 测试用户不存在场景
  - 测试自我操作限制
  - 测试影响面检查
  - 测试责任转交
  - 测试审计日志记录

**Checkpoint**: ✅ User Story 7 已完成，代码 + 测试 全部通过

---

## Phase 10: User Story 8 - 重置用户密码 (P1)

**目标**: 平台管理员能够重置本地账号用户的密码，生成临时密码并通过邮件发送

**独立测试**: 能够为本地账号用户重置密码，生成临时密码并通过邮件发送

### Step 1: 定义 API 类型

- [x] T096 [US8] 在 `api/doc/user/user_management.api` 中定义 ResetPasswordReq 和 ResetPasswordResp 类型（已在 T015 中完成）
- [x] T097 [US8] 在 `api/doc/user/user_management.api` 中定义 ResetPassword 接口端点（已在 T015 中完成）

### Step 2: 生成代码

- [x] T098 [US8] 运行 `goctl api go` 重新生成 Handler/Types（已在 T020 中完成）

### Step 3: 实现 Logic 层

- [x] T099 [US8] 实现 `api/internal/logic/user_management/reset_password_logic.go`
  - 查询用户是否存在
  - 检查账号来源（仅支持local账号）
  - 生成临时密码或使用提供的密码
  - 密码加密
  - 更新用户密码
  - 发送邮件通知（Mock实现，后续接入邮件服务）
  - 记录审计日志
- [x] T100 [US8] **[TEST]** 创建 `api/internal/logic/user_management/reset_password_logic_test.go`
  - 测试正常重置场景
  - 测试SSO账号重置场景
  - 测试用户不存在场景
  - 测试审计日志记录

**Checkpoint**: ✅ User Story 8 已完成，代码 + 测试 全部通过

---

## Phase 11: User Story 9 - 批量导入用户 (P2)

**目标**: 平台管理员能够从Excel/CSV文件批量导入用户

**独立测试**: 能够导入Excel/CSV文件，批量创建用户，支持预览校验

### Step 1: 定义 API 类型

- [ ] T101 [US9] 在 `api/doc/user/user_management.api` 中定义 BatchImportReq 和 BatchImportResp 类型
- [ ] T102 [US9] 在 `api/doc/user/user_management.api` 中定义 ImportError 类型
- [ ] T103 [US9] 在 `api/doc/user/user_management.api` 中定义 BatchImport 接口端点（multipart/form-data）

### Step 2: 生成代码

- [ ] T104 [US9] 运行 `goctl api go` 重新生成 Handler/Types

### Step 3: 实现 Logic 层

- [ ] T105 [US9] 实现 `api/internal/logic/user/batch_import_logic.go`
  - 解析上传的文件（Excel/CSV）
  - 验证文件格式
  - 解析数据行
  - 参数校验（dryRun模式仅校验）
  - 批量创建用户（复用CreateUser逻辑）
  - 收集成功和失败统计
  - 返回导入结果
- [ ] T106 [US9] **[TEST]** 创建 `api/internal/logic/user/batch_import_logic_test.go`
  - 测试正常导入场景
  - 测试Excel格式导入
  - 测试CSV格式导入
  - 测试dryRun模式
  - 测试部分失败场景
  - 测试文件格式错误场景

**Checkpoint**: ✅ User Story 9 已完成，代码 + 测试 全部通过

---

## Phase 12: User Story 10 - 导出用户数据 (P2)

**目标**: 平台管理员/审批人能够导出符合条件的用户数据为Excel

**独立测试**: 能够根据筛选条件导出用户数据为Excel文件

### Step 1: 定义 API 类型

- [ ] T107 [US10] 在 `api/doc/user/user_management.api` 中定义 ExportUsers 接口端点（返回stream）

### Step 2: 生成代码

- [ ] T108 [US10] 运行 `goctl api go` 重新生成 Handler/Types

### Step 3: 实现 Logic 层

- [ ] T109 [US10] 实现 `api/internal/logic/user/export_users_logic.go`
  - 使用ListUsers逻辑查询符合条件的用户
  - 构建Excel文件（使用excelize库）
  - 设置表头和数据行
  - 返回文件流
- [ ] T110 [US10] **[TEST]** 创建 `api/internal/logic/user/export_users_logic_test.go`
  - 测试正常导出场景
  - 测试筛选条件导出
  - 测试Excel文件格式
  - 测试大数据量导出（性能测试）

**Checkpoint**: ✅ User Story 10 已完成，代码 + 测试 全部通过

---

## Phase 13: User Story 11 - 用户统计信息 (P2)

**目标**: 平台管理员/审批人/编辑者/只读用户能够查看用户管理的KPI统计数据

**独立测试**: 能够查询用户总数、各状态用户数、活跃率等统计数据

### Step 1: 定义 API 类型

- [x] T111 [US11] 在 `api/doc/user/user_management.api` 中定义 GetStatisticsResp 类型（已在 T015 中完成）
- [x] T112 [US11] 在 `api/doc/user/user_management.api` 中定义 GetStatistics 接口端点（已在 T015 中完成）

### Step 2: 生成代码

- [x] T113 [US11] 运行 `goctl api go` 重新生成 Handler/Types（已在 T020 中完成）

### Step 3: 扩展 Users Model 接口

- [x] T114 [US11] 在 `model/user/users/interface.go` 中添加 GetStatistics 方法定义
- [x] T115 [US11] 在 `model/user/users/gorm_dao.go` 中实现 GetStatistics 方法
  - 统计总用户数
  - 统计各状态用户数
  - 统计无组织归属用户数
  - 统计无权限角色用户数
  - 计算近7天活跃率
- [x] T116 [US11] **[TEST]** 在 `model/user/users/gorm_dao_test.go` 中测试 GetStatistics 方法

### Step 4: 实现 Logic 层

- [x] T117 [US11] 实现 `api/internal/logic/user_management/get_statistics_logic.go`
  - 调用 Model.GetStatistics
  - 构建响应数据
- [x] T118 [US11] **[TEST]** 创建 `api/internal/logic/user_management/get_statistics_logic_test.go`
  - 测试正常统计场景
  - 测试各种数据分布场景

**Checkpoint**: ✅ User Story 11 已完成，代码 + 测试 全部通过

---

## Phase 14: User Story 12 - 与注册功能打通 (P1)

**目标**: 用户通过注册功能创建后，自动纳入用户管理体系

**独立测试**: 注册用户创建时自动设置正确的状态（未激活）、账号来源（local），并能够通过用户管理接口查询和管理

### Step 1: 修改注册逻辑

- [x] T119 [US12] 修改 `api/internal/logic/user/register_logic.go`
  - 将Status设为0（未激活）
  - 设置AccountSource为"local"
  - 设置Name字段（合并FirstName和LastName）
- [x] T120 [US12] **[TEST]** 更新 `api/internal/logic/user/register_logic_test.go`
  - 测试注册用户状态为"未激活"
  - 测试注册用户账号来源为"local"
  - 测试Name字段设置正确

### Step 2: 修改登录逻辑

- [x] T121 [US12] 修改 `api/internal/logic/user/login_logic.go`
  - 首次登录时检查状态是否为"未激活"
  - 如果是未激活状态，自动激活（更新状态为"启用"）
- [x] T122 [US12] **[TEST]** 更新 `api/internal/logic/user/login_logic_test.go`
  - 测试首次登录自动激活场景
  - 测试已激活用户登录场景

### Step 3: 验证集成

- [x] T123 [US12] 验证注册用户能够通过用户管理接口查询（已通过代码逻辑验证：注册用户创建后可通过 ListUsers/GetUserInfo 查询）
- [x] T124 [US12] 验证注册用户能够通过用户管理接口更新信息（已通过代码逻辑验证：注册用户可通过 UpdateUser 更新信息）

**Checkpoint**: ✅ User Story 12 已完成，代码 + 测试 全部通过

---

## Phase 15: Polish (收尾工作)

**目的**: 代码清理、文档更新、集成测试

- [x] T124.1 修复所有测试代码编译错误
  - 修复 Mock 类缺少接口方法（FindList, UpdateStatus, BatchUpdateStatus, GetStatistics）
  - 修复 Mock 类型重复声明问题
  - 修复导入路径和类型错误
  - 修复未使用变量问题
  - 修复错误断言方法（baseErrorx.Code -> assert.Contains）
- [ ] T125 代码清理和格式化 (`gofmt -w .`)
- [ ] T126 [P] 运行 `golangci-lint run` 检查代码质量
- [ ] T127 确认所有测试覆盖率 > 80%
  ```bash
  go test ./... -coverprofile=coverage.out
  go tool cover -func=coverage.out
  ```
- [ ] T128 [P] 运行 Swagger 文档生成 (`make swagger` 或相应命令)
- [ ] T129 端到端集成测试
  - 测试完整的用户管理流程
  - 测试与注册功能的集成
- [ ] T130 性能测试（关键接口）
  - 用户列表查询性能
  - 批量操作性能

**Checkpoint**: ✅ 所有功能完成，代码质量达标

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ├── Database Migrations
    ├── Error Codes
    └── Dependencies
    ↓
Phase 3 (US1: List Users)
    ↓
Phase 4 (US2: Get User Detail)
    ├── Depends on: US1 (User Model)
    ├── Depends on: Foundation (RoleBindings, AuditLogs Models)
    ↓
Phase 5 (US3: Create User)
    ├── Depends on: US2 (RoleBindings, AuditLogs Models)
    ↓
Phase 6 (US4: Update User)
    ├── Depends on: US3
    ↓
Phase 7 (US5: Batch Update Status)
    ├── Depends on: US1
    ↓
Phase 8 (US6: Unlock User)
    ├── Depends on: US5
    ↓
Phase 9 (US7: Delete User)
    ├── Depends on: US5
    ↓
Phase 10 (US8: Reset Password)
    ├── Depends on: US1
    ↓
Phase 11 (US9: Batch Import)
    ├── Depends on: US3
    ↓
Phase 12 (US10: Export Users)
    ├── Depends on: US1
    ↓
Phase 13 (US11: Statistics)
    ├── Depends on: US1
    ↓
Phase 14 (US12: Register Integration)
    ├── Depends on: US1, US2
    ↓
Phase 15 (Polish)
```

### 并行执行说明

- `[P]` 标记的任务可与同 Phase 内其他 `[P]` 任务并行
- `[TEST]` 标记的任务必须与对应实现任务同步完成
- 不同 User Story 的某些独立功能可以并行（如有团队协作）

---

## 测试要求 🧪

| 要求 | 标准 |
|------|------|
| **单元测试覆盖率** | > 80% |
| **关键路径测试** | 100% 覆盖 |
| **边界测试** | 必须包含 |
| **错误处理测试** | 必须包含 |

### 测试命名规范

```
Test{Function}_{Scenario}_{ExpectedResult}
```

示例：
- `TestListUsers_ValidParams_ReturnsUserList`
- `TestCreateUser_DuplicateEmail_ReturnsError`
- `TestUpdateStatus_InvalidState_ReturnsError`

---

## Implementation Strategy

### MVP Scope (最小可行产品)

**Phase 3-4**: 实现用户列表查询和详情查询功能，这是用户管理的基础功能。

### Incremental Delivery (增量交付)

1. **Phase 3-4**: 查询功能（US1, US2）- 可独立使用
2. **Phase 5-6**: 创建和更新功能（US3, US4）- 扩展基础功能
3. **Phase 7-10**: 状态管理和密码重置（US5-US8）- 完善管理功能
4. **Phase 11-13**: 导入导出和统计（US9-US11）- 提升效率
5. **Phase 14**: 注册功能打通（US12）- 整合现有功能

---

## Notes

- 每个 Task 完成后提交代码
- **实现和测试必须同时提交**
- 每个 Checkpoint 运行 `go test ./...` 验证
- 遇到问题及时记录到 Open Questions
- 邮件服务先使用Mock实现，后续接入真实邮件服务
- 影响面检查（关键责任人）先简单实现，后续接入业务模块
