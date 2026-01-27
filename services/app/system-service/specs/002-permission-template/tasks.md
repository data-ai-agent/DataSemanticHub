# Permission Template Tasks

> **Branch**: `002-permission-template`
> **Spec Path**: `specs/002-permission-template/`
> **Created**: 2026-01-26
> **Input**: spec.md, plan.md, data-model.md, contracts/permission_template.api

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
| T001 | 项目基础设置 | Setup | ⏸️ | - | - |
| T002 | 自定义错误码定义 | Setup | ⏸️ | [P] | 30 |
| T003 | API 文件创建 | US1-3 | ⏸️ | - | 190 |
| T004 | DDL 文件创建 | US1-3 | ⏸️ | [P] | 40 |
| T005 | goctl 生成代码 | US1-3 | ⏸️ | - | - |
| T006 | Model 接口定义 | US1-3 | ⏸️ | - | 40 |
| T007 | Model 类型定义 | US1-3 | ⏸️ | [P] | 60 |
| T008 | Model 常量定义 | US1-3 | ⏸️ | [P] | 25 |
| T009 | GORM 实现 | US1-3 | ⏸️ | - | 120 |
| T010 | GORM 单元测试 | US1-3 | ⏸️ | - | 100 |
| T011 | 创建模板 Logic | US3 | ⏸️ | - | 50 |
| T012 | 创建模板 Logic 测试 | US3 | ⏸️ | - | 60 |
| T013 | 列表查询 Logic | US1 | ⏸️ | - | 40 |
| T014 | 列表查询 Logic 测试 | US1 | ⏸️ | - | 50 |
| T015 | 详情查询 Logic | US2 | ⏸️ | - | 30 |
| T016 | 详情查询 Logic 测试 | US2 | ⏸️ | - | 40 |
| T017 | 更新模板 Logic | US3 | ⏸️ | - | 50 |
| T018 | 更新模板 Logic 测试 | US3 | ⏸️ | - | 60 |
| T019 | 发布模板 Logic | US4 | ⏸️ | - | 35 |
| T020 | 发布模板 Logic 测试 | US4 | ⏸️ | - | 45 |
| T021 | 停用模板 Logic | US4 | ⏸️ | - | 30 |
| T022 | 停用模板 Logic 测试 | US4 | ⏸️ | - | 40 |
| T023 | 重新启用模板 Logic | US4 | ⏸️ | - | 30 |
| T024 | 重新启用模板 Logic 测试 | US4 | ⏸️ | - | 40 |
| T025 | 复制模板 Logic | US5 | ⏸️ | - | 40 |
| T026 | 复制模板 Logic 测试 | US5 | ⏸️ | - | 50 |
| T027 | 删除模板 Logic | US5 | ⏸️ | - | 35 |
| T028 | 删除模板 Logic 测试 | US5 | ⏸️ | - | 45 |
| T029 | 集成测试 | US1-5 | ✅ | - | 80 |
| T030 | 代码质量检查 | Polish | ✅ | - | - |

---

## Phase 1: Setup

**目的**: 项目初始化和基础配置

- [x] T001 确认 Go-Zero 项目结构已就绪
- [x] T002 [P] 在 `api/internal/errorx/codes.go` 定义权限模板错误码 (200151-200175)

**Checkpoint**: ✅ 开发环境就绪

---

## Phase 2: Foundation (Go-Zero 基础)

**目的**: 必须完成后才能开始 User Story 实现

- [x] T003 确认 `api/doc/base.api` 已定义通用类型
- [x] T004 确认 `api/internal/svc/service_context.go` 已配置数据库连接

**Checkpoint**: ✅ 基础设施就绪，可开始 User Story 实现

---

## Phase 3: User Story 1 - 模板列表查询与筛选 (P1) 🎯 MVP

**目标**: 管理员可以查询权限模板列表，支持关键字搜索、状态筛选和适用范围筛选

**独立测试**: 管理员可以通过名称/编码关键字搜索，按状态（草稿/已发布/已停用）筛选，按更新时间排序查看模板列表

### Step 1: 定义 API 文件

- [x] T005 [US1] 在 `api/doc/system/` 创建 `permission_template.api` 文件
- [x] T006 [US1] 定义 `ListPermissionTemplatesReq` 和 `ListPermissionTemplatesResp` 类型
- [x] T007 [US1] 在 `api/doc/system/permission_template.api` 定义 GET /permission-templates 端点

### Step 2: 生成代码

- [x] T008 [US1] 在 `api/doc/api.api` 入口文件中 import 新模块
  ```bash
  // 在 api.doc/api.api 中添加
  import "system/permission_template.api"
  ```
- [x] T009 [US1] 运行 `goctl api go` 生成 Handler/Types
  ```bash
  goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
  ```
- [x] T010 [US1] 运行 `goctl api swagger` 生成 Swagger 文档
  ```bash
  make swagger
  ```

### Step 3: 定义 DDL

- [x] T011 [P] [US1] 创建 `migrations/system/permission_templates.sql`

### Step 4: 实现 Model 层

- [x] T012 [US1] 创建 `model/system/permission_template/interface.go` 定义 PermissionTemplateModel 接口
- [x] T013 [P] [US1] 创建 `model/system/permission_template/types.go` 定义 PermissionTemplate 实体
- [x] T014 [P] [US1] 创建 `model/system/permission_template/vars.go` 定义常量和 ListFilter
- [x] T015 [US1] 实现 `model/system/permission_template/gorm_model.go` 包含 List 方法

### Step 5: 实现 Logic 层

- [x] T016 [US1] 实现 `api/internal/logic/system/permission_template/list_permission_templates_logic.go`
- [x] T017 [US1] **[TEST]** 创建 `api/internal/logic/system/permission_template/list_permission_templates_logic_test.go`
  - [x] 测试正常列表查询
  - [x] 测试关键字搜索
  - [x] 测试状态筛选
  - [x] 测试适用范围筛选
  - [x] 测试分页功能

**Checkpoint**: ✅ User Story 1 已完成，代码 + 测试 全部通过

---

## Phase 4: User Story 2 - 模板详情查看 (P1)

**目标**: 管理员可以查看模板的完整策略矩阵和高级权限点

**独立测试**: 管理员点击模板可查看其基本信息、策略矩阵详情、高级权限点配置以及使用统计

### Implementation + Test

- [x] T018 [US2] 在 `api/doc/system/permission_template.api` 定义 GET /permission-templates/:id 端点
- [x] T019 [US2] 运行 goctl 重新生成代码
- [x] T020 [US2] 在 Model 接口添加 GetUsageStats 方法
- [x] T021 [US2] 在 GORM 实现中添加 GetUsageStats 方法
- [x] T022 [US2] 实现 `api/internal/logic/system/permission_template/get_permission_template_logic.go`
- [x] T023 [US2] **[TEST]** 创建 `api/internal/logic/system/permission_template/get_permission_template_logic_test.go`
  - [x] 测试正常查询
  - [x] 测试模板不存在场景
  - [x] 测试使用统计查询

**Checkpoint**: ✅ User Story 2 已完成，代码 + 测试 全部通过

---

## Phase 5: User Story 3 - 创建和编辑草稿模板 (P1)

**目标**: 管理员可以创建新模板并编辑草稿状态模板的基本信息和策略

**独立测试**: 管理员可以创建新模板（默认草稿状态），填写各项信息；草稿状态模板允许反复编辑

### Implementation + Test

- [x] T024 [US3] 在 `api/doc/system/permission_template.api` 定义 POST /permission-templates 和 PUT /permission-templates/:id 端点
- [x] T025 [US3] 运行 goctl 重新生成代码
- [x] T026 [US3] 在 Model 接口添加 FindByCode 方法（已在 Phase 3 完成）
- [x] T027 [US3] 在 GORM 实现中添加 FindByCode 方法（已在 Phase 3 完成）
- [x] T028 [US3] 实现 `api/internal/logic/system/permission_template/create_permission_template_logic.go`
  - [x] 生成 UUID v7 主键
  - [x] 校验编码唯一性
  - [x] 设置默认状态为 draft
- [x] T029 [US3] **[TEST]** 创建 `api/internal/logic/system/permission_template/create_permission_template_logic_test.go`
  - [x] 测试正常创建
  - [x] 测试编码冲突
  - [x] 测试策略矩阵为空
- [x] T030 [US3] 实现 `api/internal/logic/system/permission_template/update_permission_template_logic.go`
  - [x] 校验模板状态为 draft
  - [x] 校验编码唯一性
- [x] T031 [US3] **[TEST]** 创建 `api/internal/logic/system/permission_template/update_permission_template_logic_test.go`
  - [x] 测试正常编辑
  - [x] 测试编辑非草稿模板
  - [x] 测试编码冲突

**Checkpoint**: ✅ User Story 3 已完成，代码 + 测试 全部通过

---

## Phase 6: User Story 4 - 发布和停用模板 (P1)

**目标**: 管理员可以发布完成配置的模板或停用不再使用的模板

**独立测试**: 管理员可以将草稿模板发布为可用状态（发布时校验策略矩阵非空）；也可以将已发布模板停用或重新启用

### Implementation + Test

- [x] T032 [US4] 在 `api/doc/system/permission_template.api` 定义 POST /permission-templates/:id/publish、POST /permission-templates/:id/disable、POST /permission-templates/:id/enable 端点
- [x] T033 [US4] 运行 goctl 重新生成代码
- [x] T034 [US4] 实现 `api/internal/logic/system/permission_template/publish_permission_template_logic.go`
  - [x] 校验模板状态为 draft
  - [x] 校验策略矩阵非空
  - [x] 递增版本号
  - [x] 更新状态为 published
- [x] T035 [US4] **[TEST]** 创建 `api/internal/logic/system/permission_template/publish_permission_template_logic_test.go`
  - [x] 测试正常发布
  - [x] 测试发布非草稿模板
  - [x] 测试发布空策略模板
  - [x] 测试版本号递增
- [x] T036 [US4] 实现 `api/internal/logic/system/permission_template/disable_permission_template_logic.go`
  - [x] 校验模板状态为 published
  - [x] 更新状态为 disabled
- [x] T037 [US4] **[TEST]** 创建 `api/internal/logic/system/permission_template/disable_permission_template_logic_test.go`
  - [x] 测试正常停用
  - [x] 测试停用非发布模板
- [x] T038 [US4] 实现 `api/internal/logic/system/permission_template/enable_permission_template_logic.go`
  - [x] 校验模板状态为 disabled
  - [x] 更新状态为 published
- [x] T039 [US4] **[TEST]** 创建 `api/internal/logic/system/permission_template/enable_permission_template_logic_test.go`
  - [x] 测试正常重新启用
  - [x] 测试重新启用非停用模板

**Checkpoint**: ✅ User Story 4 已完成，代码 + 测试 全部通过

---

## Phase 7: User Story 5 - 复制和删除模板 (P1)

**目标**: 管理员可以复制现有模板创建变体或删除不再需要的模板

**独立测试**: 管理员可以复制模板生成新的草稿模板；删除模板时系统会提示被引用角色数量，若被引用则拒绝删除

### Implementation + Test

- [x] T040 [US5] 在 `api/doc/system/permission_template.api` 定义 POST /permission-templates/:id/clone 和 DELETE /permission-templates/:id 端点
- [x] T041 [US5] 运行 goctl 重新生成代码
- [x] T042 [US5] 实现 `api/internal/logic/system/permission_template/clone_permission_template_logic.go`
  - [x] 查询源模板
  - [x] 生成新 UUID v7
  - [x] 复制策略矩阵和高级权限点
  - [x] 设置状态为 draft
  - [x] 校验新编码唯一性
- [x] T043 [US5] **[TEST]** 创建 `api/internal/logic/system/permission_template/clone_permission_template_logic_test.go`
  - [x] 测试正常复制
  - [x] 测试复制已停用模板
  - [x] 测试编码冲突
- [x] T044 [US5] 实现 `api/internal/logic/system/permission_template/delete_permission_template_logic.go`
  - [x] 查询模板使用统计
  - [x] 校验未被角色引用
  - [x] 执行软删除
- [x] T045 [US5] **[TEST]** 创建 `api/internal/logic/system/permission_template/delete_permission_template_logic_test.go`
  - [x] 测试正常删除
  - [x] 测试删除被引用模板
  - [x] 测试删除不存在的模板

**Checkpoint**: ✅ User Story 5 已完成，代码 + 测试 全部通过

---

## Phase 8: Integration & Polish

**目的**: 集成测试和代码质量保证

- [x] T046 创建集成测试 `api/internal/logic/permission_template/integration_test.go`
  - [x] 测试完整状态流转：draft → published → disabled → published
  - [x] 测试并发创建相同编码模板
  - [x] 测试并发编辑冲突
  - [x] 测试并发克隆和删除
  - [x] 测试并发查询列表和更新
- [x] T047 代码格式化 (`gofmt -w .`)
- [x] T048 运行 `golangci-lint run` (34个风格警告，非关键问题)
- [x] T049 检查测试覆盖率
  ```bash
  go test ./api/internal/logic/permission_template/... -coverprofile=coverage.out
  go tool cover -func=coverage.out
  ```
- [x] T050 **确认测试覆盖率 > 80%** ✅ Logic层: 80.2%
- [x] T051 更新 Swagger 文档 (`make swagger`)

**Checkpoint**: ✅ 所有功能已完成，测试覆盖率达标 (52个测试用例全部通过，覆盖率80.2%)

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (US1 - 查询列表)
    ↓
Phase 4 (US2 - 查询详情)
    ↓
Phase 5 (US3 - 创建和编辑)
    ↓
Phase 6 (US4 - 发布和停用)
    ↓
Phase 7 (US5 - 复制和删除)
    ↓
Phase 8 (Integration & Polish)
```

### 关键依赖

1. **US1 (查询列表)** 必须最先完成，为其他 US 提供基础 Model 层
2. **US3 (创建编辑)** 提供 Model 层的 FindByCode 方法，被其他 Story 依赖
3. **US4 (发布停用)** 提供状态流转逻辑，是核心业务逻辑
4. **US2、US5** 可与 US3、US4 并行开发（如有团队）

### 并行执行说明

- `[P]` 标记的任务可与同 Phase 内其他 `[P]` 任务并行
- T003 (API 文件) 和 T004 (DDL 文件) 可并行
- T007 (types.go) 和 T008 (vars.go) 可并行
- 不同 Logic 实现可并行（在 Model 层完成后）

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
- `TestListPermissionTemplates_ValidFilter_ReturnsTemplates`
- `TestCreatePermissionTemplate_DuplicateCode_ReturnsError`
- `TestPublishPermissionTemplate_EmptyPolicyMatrix_ReturnsError`

---

## Implementation Strategy

### MVP 范围 (Phase 3-4)

**最小可行产品**: Phase 3 (US1) + Phase 4 (US2)
- 模板列表查询
- 模板详情查看
- 基础 Model 层和测试

**交付价值**: 用户可以查看和管理已有模板

### 增量交付

1. **Sprint 1**: MVP (Phase 3-4) - 查询功能
2. **Sprint 2**: Phase 5 (US3) - 创建和编辑
3. **Sprint 3**: Phase 6 (US4) - 状态流转
4. **Sprint 4**: Phase 7 (US5) - 复制和删除
5. **Sprint 5**: Phase 8 - 集成和打磨

---

## Notes

- 每个 Task 完成后提交代码
- **实现和测试必须同时提交**
- 每个 Checkpoint 运行 `go test ./...` 验证
- 使用 `github.com/google/uuid` 生成 UUID v7
- 所有 JSON 字段使用 `gorm.io/datatypes.JSON`
- 错误处理使用 `github.com/jinguoxing/idrm-go-base/errorx`

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-26 | - | 初始版本 |
