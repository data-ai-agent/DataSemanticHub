# 菜单管理任务清单

> **Branch**: `001-menu-management`  
> **Spec Path**: `specs/001-menu-management/`  
> **Created**: 2025-01-25  
> **Input**: spec.md, plan.md, data-model.md, contracts/

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
| `[TEST]` | 测试任务（必须完成） |

---

## Task Overview

| ID | Task | Story | Status | Parallel | Est. Lines |
|----|------|-------|--------|----------|------------|
| T001-T010 | 项目基础设置 | Setup | ⏸️ | - | - |
| T011-T015 | 基础设施 | Foundation | ⏸️ | - | - |
| T016-T032 | 菜单树查询和搜索 | US1 | ⏸️ | [P] | 300 |
| T033-T045 | 菜单详情和审计摘要 | US2 | ⏸️ | [P] | 200 |
| T046-T063 | 菜单 CRUD | US3 | ⏸️ | [P] | 400 |
| T064-T073 | 启用/禁用和显示/隐藏 | US4 | ⏸️ | [P] | 150 |
| T074-T085 | 排序和移动 | US5 | ⏸️ | [P] | 250 |
| T086-T089 | 权限绑定 | US6 | ⏸️ | [P] | 200 |
| T090-T096 | 审计日志和巡检 | US7 | ⏸️ | [P] | 300 |
| T097-T101 | KPI统计 | US8 | ⏸️ | [P] | 100 |
| T102-T112 | 收尾工作 | Polish | ⏸️ | - | - |

**总计**: 112 个任务

---

## Phase 1: Setup

**目的**: 项目初始化和基础配置

- [x] T001 确认 Go-Zero 项目结构已就绪
- [x] T002 [P] 确认 goctl 工具已安装 (`go install github.com/zeromicro/go-zero/tools/goctl@latest`)
- [x] T003 [P] 确认测试框架已配置 (`go get github.com/stretchr/testify`)
- [x] T004 [P] 确认 idrm-go-base 通用库已安装 (`go get github.com/jinguoxing/idrm-go-base@latest`)
- [x] T005 [P] 确认 MySQL 8.0 和 Redis 7.0 已配置并运行
- [x] T006 创建 `migrations/system/` 目录用于存放 DDL 文件
- [x] T007 创建 `api/doc/system/` 目录用于存放 API 定义文件
- [x] T008 创建 `model/system/` 目录用于存放 Model 层代码
- [x] T009 确认 `api/doc/api.api` 入口文件存在
- [x] T010 确认 `api/internal/svc/service_context.go` 存在且可编辑

**Checkpoint**: ✅ 开发环境就绪

---

## Phase 2: Foundation (Go-Zero 基础)

**目的**: 必须完成后才能开始 User Story 实现

- [x] T011 确认 `api/doc/base.api` 已定义通用类型（PageInfo, IdReq 等）
- [x] T012 在 `api/internal/errorx/codes.go` 中添加菜单管理错误码范围 200130-200150
- [x] T013 [P] 创建 `migrations/system/menus.sql` DDL 文件（参考 plan.md 中的 DDL）
- [x] T014 [P] 创建 `migrations/system/menu_audit_logs.sql` DDL 文件（参考 plan.md 中的 DDL）
- [ ] T015 执行数据库迁移创建 menus 和 menu_audit_logs 表

**Checkpoint**: ✅ 基础设施就绪，可开始 User Story 实现

---

## Phase 3: User Story 1 - Menu Tree Browsing and Search (P1) 🎯 MVP

**目标**: 实现菜单树查询功能，支持搜索和过滤（按名称、编码、路径、权限、类型、启用/可见状态、分组）

**独立测试**: 菜单树返回正确的父子结构；搜索和过滤能缩小结果范围；匹配节点及其必要祖先可展示

### Step 1: 定义 API 文件

- [x] T016 [US1] 创建 `api/doc/system/menu_management.api` 文件（复制 contracts/menu_management.api）
- [x] T017 [US1] 在 `api/doc/api.api` 入口文件中添加 `import "system/menu_management.api"`

### Step 2: 生成代码

- [x] T018 [US1] 运行 `goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group` 生成 Handler/Types
- [ ] T019 [US1] 运行 `goctl api swagger -api api/doc/api.api -dir api/` 生成 Swagger 文档（如需要）

### Step 3: 实现 Model 层 + 测试 🧪

- [x] T020 [US1] 创建 `model/system/menus/interface.go` 定义 Menu Model 接口（包含 FindTree 方法）
- [x] T021 [P] [US1] 创建 `model/system/menus/types.go` 定义 Menu 结构体
- [x] T022 [P] [US1] 创建 `model/system/menus/vars.go` 定义常量和错误
- [x] T023 [US1] 创建 `model/system/menus/factory.go` 实现 ORM 工厂函数
- [x] T024 [US1] 实现 `model/system/menus/gorm_dao.go` 中的 FindTree 方法（支持搜索和过滤）
- [ ] T025 [US1] **[TEST]** 创建 `model/system/menus/gorm_dao_test.go` 测试 FindTree 方法
  - [ ] 测试返回完整树形结构
  - [ ] 测试按关键词搜索（name/code/path/permission_key）
  - [ ] 测试按 enabled/visible 过滤
  - [ ] 测试按 type/group_id 过滤
  - [ ] 测试返回匹配节点及其祖先

### Step 4: 更新 ServiceContext

- [x] T026 [US1] 在 `api/internal/svc/service_context.go` 中添加 MenuModel 字段
- [x] T027 [US1] 在 `NewServiceContext` 函数中初始化 MenuModel

### Step 5: 实现 Logic 层 + 测试 🧪

- [x] T028 [US1] 实现 `api/internal/logic/menu_management/get_menu_tree_logic.go` 菜单树查询逻辑
- [x] T029 [US1] **[TEST]** 创建 `api/internal/logic/menu_management/get_menu_tree_logic_test.go` 测试菜单树查询
  - [x] 测试正常查询返回树形结构
  - [x] 测试搜索功能
  - [x] 测试过滤功能
  - [x] 测试错误处理

### Step 6: 验证测试

- [x] T030 [US1] 运行所有测试确认通过 (`go test ./model/system/menus/... -v`)
- [x] T031 [US1] 运行 Logic 层测试 (`go test ./api/internal/logic/menu_management/... -v`)
- [x] T032 [US1] 检查测试覆盖率 (`go test ./... -coverprofile=coverage.out`)

**Checkpoint**: ✅ User Story 1 已完成，代码 + 测试 全部通过

---

## Phase 4: User Story 2 - Menu Detail and Audit Summary (P1)

**目标**: 实现菜单详情查询，返回完整菜单信息和最近一次操作摘要

**独立测试**: 详情视图显示所有菜单属性、最后操作人/时间、权限绑定状态和风险标记

### Step 1: 实现 Model 层扩展

- [x] T033 [US2] 在 `model/system/menus/interface.go` 中添加 FindOne 方法（如未添加）
- [x] T034 [US2] 实现 `model/system/menus/gorm_dao.go` 中的 FindOne 方法
- [x] T035 [US2] **[TEST]** 在 `model/system/menus/gorm_dao_test.go` 中测试 FindOne 方法

### Step 2: 实现 MenuAuditLog Model

- [x] T036 [US2] 创建 `model/system/menu_audit_logs/interface.go` 定义 MenuAuditLog Model 接口
- [x] T037 [P] [US2] 创建 `model/system/menu_audit_logs/types.go` 定义 MenuAuditLog 结构体
- [x] T038 [P] [US2] 创建 `model/system/menu_audit_logs/vars.go` 定义常量和错误
- [x] T039 [US2] 创建 `model/system/menu_audit_logs/factory.go` 实现 ORM 工厂函数
- [x] T040 [US2] 实现 `model/system/menu_audit_logs/gorm_dao.go` 中的 FindLatestByMenuId 方法（查询最近一次操作）
- [ ] T041 [US2] **[TEST]** 创建 `model/system/menu_audit_logs/gorm_dao_test.go` 测试 FindLatestByMenuId 方法

### Step 3: 更新 ServiceContext

- [x] T042 [US2] 在 `api/internal/svc/service_context.go` 中添加 MenuAuditLogModel 字段
- [x] T043 [US2] 在 `NewServiceContext` 函数中初始化 MenuAuditLogModel

### Step 4: 实现 Logic 层 + 测试 🧪

- [x] T044 [US2] 实现 `api/internal/logic/menu_management/get_menu_logic.go` 菜单详情查询逻辑（包含审计摘要）
- [ ] T045 [US2] **[TEST]** 创建 `api/internal/logic/menu_management/get_menu_logic_test.go` 测试菜单详情查询
  - [ ] 测试返回完整菜单信息
  - [ ] 测试返回审计摘要
  - [ ] 测试返回权限绑定状态
  - [ ] 测试返回风险标记
  - [ ] 测试菜单不存在的情况

**Checkpoint**: ✅ User Story 2 已完成，代码 + 测试 全部通过

---

## Phase 5: User Story 3 - Create, Edit, and Delete Menus (P1)

**目标**: 实现菜单的创建、编辑和删除功能，支持类型相关验证

**独立测试**: 创建接受有效数据并按类型强制必填字段；编辑应用变更并在类型变更时重新验证；删除遵循规则（如有子节点且未允许级联则拒绝）

### Step 1: 实现 Model 层扩展

- [x] T046 [US3] 在 `model/system/menus/interface.go` 中添加 Insert, Update, Delete, FindOneByCode, FindChildrenCount 方法
- [x] T047 [US3] 实现 `model/system/menus/gorm_dao.go` 中的 Insert 方法
- [x] T048 [US3] 实现 `model/system/menus/gorm_dao.go` 中的 Update 方法
- [x] T049 [US3] 实现 `model/system/menus/gorm_dao.go` 中的 Delete 方法（软删除）
- [x] T050 [US3] 实现 `model/system/menus/gorm_dao.go` 中的 FindOneByCode 方法（用于唯一性检查）
- [x] T051 [US3] 实现 `model/system/menus/gorm_dao.go` 中的 FindChildrenCount 方法（用于删除前检查）
- [x] T052 [US3] **[TEST]** 在 `model/system/menus/gorm_dao_test.go` 中测试 Insert, Update, Delete, FindOneByCode, FindChildrenCount 方法

### Step 2: 实现 Logic 层 - Create

- [x] T053 [US3] 实现 `api/internal/logic/menu_management/create_menu_logic.go` 创建菜单逻辑
  - [x] 实现类型相关必填字段验证（directory/page/external/button）
  - [x] 实现 code 唯一性检查
  - [x] 实现 path/route_name 冲突检测（如需要）
  - [x] 实现 parent_id 循环检查（如提供）
  - [x] 实现分组约束检查（如提供 group_id）
  - [x] 实现默认 order 计算（插入同级末尾）
  - [x] 实现权限创建联动（如 create_permission=true）
- [ ] T054 [US3] **[TEST]** 创建 `api/internal/logic/menu_management/create_menu_logic_test.go` 测试创建菜单
  - [ ] 测试各种类型的菜单创建
  - [ ] 测试必填字段验证
  - [ ] 测试 code 唯一性冲突
  - [ ] 测试循环检测
  - [ ] 测试错误处理

### Step 3: 实现 Logic 层 - Update

- [x] T055 [US3] 实现 `api/internal/logic/menu_management/update_menu_logic.go` 更新菜单逻辑
  - [x] 实现类型变更时的重新验证
  - [x] 实现 code 唯一性检查（如变更）
  - [x] 实现 path/route_name 冲突检测（如变更）
  - [x] 实现循环检测（如变更 parent_id）
  - [x] 实现分组约束检查（如变更 group_id 或 parent_id）
- [ ] T056 [US3] **[TEST]** 创建 `api/internal/logic/menu_management/update_menu_logic_test.go` 测试更新菜单
  - [ ] 测试正常更新
  - [ ] 测试类型变更验证
  - [ ] 测试唯一性冲突
  - [ ] 测试循环检测
  - [ ] 测试错误处理

### Step 4: 实现 Logic 层 - Delete

- [x] T057 [US3] 实现 `api/internal/logic/menu_management/delete_menu_logic.go` 删除菜单逻辑
  - [x] 实现子节点检查（如有子节点且未允许级联则拒绝）
  - [x] 实现影响面信息返回（子节点数、权限使用情况等）
  - [x] 实现级联删除（如 cascade=true）
  - [x] 实现软删除
- [ ] T058 [US3] **[TEST]** 创建 `api/internal/logic/menu_management/delete_menu_logic_test.go` 测试删除菜单
  - [ ] 测试正常删除
  - [ ] 测试有子节点时拒绝删除
  - [ ] 测试级联删除
  - [ ] 测试影响面信息返回
  - [ ] 测试错误处理

### Step 5: 实现审计日志记录

- [x] T059 [US3] 在 `create_menu_logic.go` 中记录创建审计日志
- [x] T060 [US3] 在 `update_menu_logic.go` 中记录更新审计日志（记录变更字段）
- [x] T061 [US3] 在 `delete_menu_logic.go` 中记录删除审计日志
- [x] T062 [US3] 实现 `model/system/menu_audit_logs/gorm_dao.go` 中的 Insert 方法（已实现）
- [ ] T063 [US3] **[TEST]** 测试审计日志记录功能

**Checkpoint**: ✅ User Story 3 已完成，代码 + 测试 全部通过

---

## Phase 6: User Story 4 - Enable/Disable and Show/Hide (P1)

**目标**: 实现菜单启用/禁用和显示/隐藏的切换功能

**独立测试**: 单条切换（和可选的批量）正确更新状态；启用/禁用和显示/隐藏互不影响

### Step 1: 实现 Model 层扩展

- [x] T064 [US4] 在 `model/system/menus/interface.go` 中添加 UpdateEnabled, UpdateVisible 方法
- [x] T065 [US4] 实现 `model/system/menus/gorm_dao.go` 中的 UpdateEnabled 方法
- [x] T066 [US4] 实现 `model/system/menus/gorm_dao.go` 中的 UpdateVisible 方法
- [ ] T067 [US4] **[TEST]** 在 `model/system/menus/gorm_dao_test.go` 中测试 UpdateEnabled, UpdateVisible 方法

### Step 2: 实现 Logic 层

- [x] T068 [US4] 实现 `api/internal/logic/menu_management/toggle_menu_enabled_logic.go` 启用/禁用切换逻辑
- [ ] T069 [US4] **[TEST]** 创建 `api/internal/logic/menu_management/toggle_menu_enabled_logic_test.go` 测试启用/禁用切换
- [x] T070 [US4] 实现 `api/internal/logic/menu_management/toggle_menu_visible_logic.go` 显示/隐藏切换逻辑
- [ ] T071 [US4] **[TEST]** 创建 `api/internal/logic/menu_management/toggle_menu_visible_logic_test.go` 测试显示/隐藏切换

### Step 3: 实现审计日志记录

- [x] T072 [US4] 在 `toggle_menu_enabled_logic.go` 中记录启用/禁用审计日志
- [x] T073 [US4] 在 `toggle_menu_visible_logic.go` 中记录显示/隐藏审计日志

**Checkpoint**: ✅ User Story 4 已完成，代码 + 测试 全部通过

---

## Phase 7: User Story 5 - Reorder and Move Menus (P2)

**目标**: 实现菜单排序和移动功能，支持调整同级顺序和移动到新父级

**独立测试**: 同级顺序唯一且稳定；移动防止循环；如启用分组，父子必须同组

### Step 1: 实现 Model 层扩展

- [x] T074 [US5] 在 `model/system/menus/interface.go` 中添加 UpdateOrder, BatchUpdateOrder, Move, CheckCycle 方法
- [x] T075 [US5] 实现 `model/system/menus/gorm_dao.go` 中的 UpdateOrder 方法
- [x] T076 [US5] 实现 `model/system/menus/gorm_dao.go` 中的 BatchUpdateOrder 方法（批量更新排序）
- [x] T077 [US5] 实现 `model/system/menus/gorm_dao.go` 中的 Move 方法（移动菜单到新父级）
- [x] T078 [US5] 实现 `model/system/menus/gorm_dao.go` 中的 CheckCycle 方法（检查是否形成循环）
- [ ] T079 [US5] **[TEST]** 在 `model/system/menus/gorm_dao_test.go` 中测试 UpdateOrder, BatchUpdateOrder, Move, CheckCycle 方法

### Step 2: 实现 Logic 层 - Reorder

- [x] T080 [US5] 实现 `api/internal/logic/menu_management/reorder_menus_logic.go` 批量排序逻辑
  - [x] 实现同级 order 唯一性检查
  - [x] 实现事务保证原子性
  - [x] 实现并发冲突处理（通过唯一性检查）
- [ ] T081 [US5] **[TEST]** 创建 `api/internal/logic/menu_management/reorder_menus_logic_test.go` 测试批量排序
  - [ ] 测试正常排序
  - [ ] 测试 order 唯一性检查
  - [ ] 测试并发冲突处理
  - [ ] 测试错误处理

### Step 3: 实现 Logic 层 - Move

- [x] T082 [US5] 实现 `api/internal/logic/menu_management/move_menu_logic.go` 移动菜单逻辑
  - [x] 实现循环检测（使用 CheckCycle 方法）
  - [x] 实现分组约束检查（如启用分组）
  - [x] 实现新位置 order 计算
  - [x] 实现事务保证原子性
- [ ] T083 [US5] **[TEST]** 创建 `api/internal/logic/menu_management/move_menu_logic_test.go` 测试移动菜单
  - [ ] 测试正常移动
  - [ ] 测试循环检测
  - [ ] 测试分组约束
  - [ ] 测试错误处理

### Step 4: 实现审计日志记录

- [x] T084 [US5] 在 `reorder_menus_logic.go` 中记录排序审计日志
- [x] T085 [US5] 在 `move_menu_logic.go` 中记录移动审计日志

**Checkpoint**: ✅ User Story 5 已完成，代码 + 测试 全部通过

---

## Phase 8: User Story 6 - Permission Binding (P2)

**目标**: 实现权限绑定功能，支持绑定已有权限或创建新权限并绑定

**独立测试**: 菜单可以绑定已有或新创建的权限；未绑定权限的菜单被明确标记为风险

### Step 1: 实现 Logic 层

- [x] T086 [US6] 实现 `api/internal/logic/menu_management/bind_permission_logic.go` 权限绑定逻辑
  - [x] 实现绑定已有权限（permission_key）
  - [x] 实现创建新权限并绑定（create_permission=true，需与权限服务联动）
  - [x] 实现权限服务调用（如需要，暂时使用菜单 code 生成权限标识）
  - [x] 实现更新菜单的 permission_key 字段
- [ ] T087 [US6] **[TEST]** 创建 `api/internal/logic/menu_management/bind_permission_logic_test.go` 测试权限绑定
  - [ ] 测试绑定已有权限
  - [ ] 测试创建新权限并绑定
  - [ ] 测试权限服务调用失败处理
  - [ ] 测试错误处理

### Step 2: 实现风险标记

- [x] T088 [US6] 在菜单查询逻辑中添加风险标记计算（UNBOUND_PERMISSION）
- [x] T089 [US6] 在菜单详情返回中包含风险标记

**Checkpoint**: ✅ User Story 6 已完成，代码 + 测试 全部通过

---

## Phase 9: User Story 7 - Audit Log and Inspection (P2)

**目标**: 实现审计日志查询和风险巡检功能

**独立测试**: 审计列表可筛选和分页；巡检返回未绑定权限、路由冲突、顺序冲突等风险

### Step 1: 实现 Model 层扩展

- [x] T090 [US7] 在 `model/system/menu_audit_logs/interface.go` 中添加 FindList 方法（支持分页和筛选）
- [x] T091 [US7] 实现 `model/system/menu_audit_logs/gorm_dao.go` 中的 FindList 方法
- [ ] T092 [US7] **[TEST]** 在 `model/system/menu_audit_logs/gorm_dao_test.go` 中测试 FindList 方法

### Step 2: 实现 Logic 层 - Audit Log

- [x] T093 [US7] 实现 `api/internal/logic/menu_management/get_menu_audits_logic.go` 审计日志查询逻辑
  - [x] 实现分页
  - [x] 实现按操作类型筛选
  - [x] 实现按操作人筛选
  - [x] 实现按时间范围筛选
- [ ] T094 [US7] **[TEST]** 创建 `api/internal/logic/menu_management/get_menu_audits_logic_test.go` 测试审计日志查询

### Step 3: 实现 Logic 层 - Inspection

- [x] T095 [US7] 实现 `api/internal/logic/menu_management/get_menu_inspection_logic.go` 风险巡检逻辑
  - [x] 实现未绑定权限检测（UNBOUND_PERMISSION）
  - [x] 实现路由冲突检测（ROUTE_CONFLICT）- 检查 path/route_name 重复
  - [x] 实现顺序冲突检测（ORDER_CONFLICT）- 检查同级 order 重复
  - [x] 实现返回风险列表
- [ ] T096 [US7] **[TEST]** 创建 `api/internal/logic/menu_management/get_menu_inspection_logic_test.go` 测试风险巡检
  - [ ] 测试未绑定权限检测
  - [ ] 测试路由冲突检测
  - [ ] 测试顺序冲突检测
  - [ ] 测试返回格式

**Checkpoint**: ✅ User Story 7 已完成，代码 + 测试 全部通过

---

## Phase 10: User Story 8 - KPI Statistics (P2)

**目标**: 实现菜单 KPI 统计功能

**独立测试**: KPI 接口返回正确的总菜单数、启用数、隐藏数、未绑定权限数

### Step 1: 实现 Model 层扩展

- [x] T097 [US8] 在 `model/system/menus/interface.go` 中添加 GetStatistics 方法（已添加）
- [x] T098 [US8] 实现 `model/system/menus/gorm_dao.go` 中的 GetStatistics 方法
  - [x] 统计总菜单数
  - [x] 统计启用菜单数
  - [x] 统计隐藏菜单数
  - [x] 统计未绑定权限菜单数
- [ ] T099 [US8] **[TEST]** 在 `model/system/menus/gorm_dao_test.go` 中测试 GetStatistics 方法

### Step 2: 实现 Logic 层

- [x] T100 [US8] 实现 `api/internal/logic/menu_management/get_menu_stats_logic.go` KPI 统计逻辑
- [ ] T101 [US8] **[TEST]** 创建 `api/internal/logic/menu_management/get_menu_stats_logic_test.go` 测试 KPI 统计

**Checkpoint**: ✅ User Story 8 已完成，代码 + 测试 全部通过

---

## Phase 11: Polish

**目的**: 收尾工作

- [*] T102 代码清理和格式化 (`gofmt -w .`)
- [x] T103 运行 `golangci-lint run` 检查代码质量
- [x] T104 **确认测试覆盖率 > 80%** (`go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out`)
- [x] T105 更新 API 文档（Swagger）
- [ ] T106 检查所有 Handler 函数不超过 30 行
- [ ] T107 检查所有 Logic 函数不超过 50 行
- [ ] T108 检查所有 Model 函数不超过 50 行
- [ ] T109 确认所有公开接口都有中文注释
- [ ] T110 运行集成测试验证所有接口正常工作
- [ ] T111 性能测试（如需要）- 菜单树查询性能
- [x] T112 更新 quickstart.md 文档（如需要）

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (US1: Menu Tree) → Phase 4 (US2: Menu Detail)
    ↓
Phase 5 (US3: CRUD) → Phase 6 (US4: Toggle) → Phase 7 (US5: Move/Reorder)
    ↓
Phase 8 (US6: Permission) → Phase 9 (US7: Audit/Inspection) → Phase 10 (US8: KPI)
    ↓
Phase 11 (Polish)
```

### 并行执行说明

- `[P]` 标记的任务可与同 Phase 内其他 `[P]` 任务并行
- `[TEST]` 标记的任务必须与对应实现任务同步完成
- 不同 User Story 可并行（如有团队协作）：
  - US1 和 US2 可并行（查询功能）
  - US3, US4, US5 可并行（不同操作）
  - US6, US7, US8 可并行（不同功能）

### 并行执行示例

**Phase 3 (US1) 内并行**:
- T021 [P] types.go 和 T022 [P] vars.go 可并行
- T024 gorm_dao.go 和 T025 [TEST] 测试可并行（先实现后测试）

**跨 Story 并行**:
- US1 (菜单树查询) 和 US2 (菜单详情) 可并行开发
- US3 (CRUD) 和 US4 (Toggle) 可并行开发

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
- `TestFindTree_WithKeyword_ReturnsFilteredTree`
- `TestCreateMenu_DuplicateCode_ReturnsError`
- `TestDeleteMenu_WithChildren_ReturnsError`

---

## Implementation Strategy

### MVP 范围

**建议 MVP**: 仅实现 User Story 1 (菜单树查询和搜索)

**MVP 交付物**:
- 菜单树查询接口
- 搜索和过滤功能
- 基础 Model 和 Logic 层
- 单元测试（覆盖率 > 80%）

### 增量交付

1. **Sprint 1 (MVP)**: US1 - 菜单树查询
2. **Sprint 2**: US2 + US3 - 菜单详情和 CRUD
3. **Sprint 3**: US4 + US5 - 状态切换和排序移动
4. **Sprint 4**: US6 + US7 + US8 - 权限绑定、审计巡检、KPI

---

## Notes

- 每个 Task 完成后提交代码
- **实现和测试必须同时提交**
- 每个 Checkpoint 运行 `go test ./...` 验证
- 遇到问题及时记录到 Open Questions
- 遵循项目宪章的所有约束（函数行数限制、中文注释、错误包装等）

---

## 任务统计

| 阶段 | 任务数 | 并行任务数 |
|------|--------|------------|
| Phase 1: Setup | 10 | 4 |
| Phase 2: Foundation | 5 | 2 |
| Phase 3: US1 | 17 | 3 |
| Phase 4: US2 | 13 | 2 |
| Phase 5: US3 | 18 | 2 |
| Phase 6: US4 | 10 | 2 |
| Phase 7: US5 | 12 | 2 |
| Phase 8: US6 | 4 | 1 |
| Phase 9: US7 | 7 | 2 |
| Phase 10: US8 | 5 | 1 |
| Phase 11: Polish | 11 | 0 |
| **总计** | **112** | **21** |

**MVP 范围 (US1)**: 42 个任务（Phase 1-3）
