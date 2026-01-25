

## 0. 全局命名与约定

* Page Frame：`[Page] RolePermission`
* Modal/Drawer：`[Modal] *` / `[Drawer] *`
* 组件前缀：`RP*`（Role & Permission）
* 通用状态：`View / Edit / Loading / Empty / Error / Forbidden`
* 权限基础模型字段（供 UI 映射，不含接口细节）

  * Role：`id, name, code, desc, status, isBuiltin, memberCount, scopeType, scopeRefs[], dataFilters[], parentRoleIds[], updatedAt, updatedBy, riskLevel, version`
  * Policy Matrix：`moduleKey, moduleName, actions{view/edit/publish/manage}, advancedPerms[]`
  * Effective：`userId, roles[], effectiveModules[], sourcesByAction, scopeEffective`
  * SoD Rule：`id, name, conflictingActions[], riskLevel, description`
  * Audit：`auditId, entityType, entityId, action, diff, requester, approver, status, createdAt`

---

# 1) 角色页 Frame（列表 + 详情）：`[Page] RolePermission`

## 1.1 顶部区域：`RolePermission/Header`

* `Breadcrumb`：平台管理 / 角色与权限
* `PageTitle`

  * Title：角色与权限管理
  * Desc：为语义治理配置角色、权限与范围，确保语义裁决可控可审计。
* `PrimaryActions`

  * `Btn/EffectivePreview`（有效权限预览）
  * `Btn/PermissionTemplates`（权限模板）
  * `Btn/SoDRules`（SoD 规则配置）
  * `Btn/NewRole`（+ 新建角色）
* `KPIBar`

  * `KPI/RoleCount`（含系统内置数量）
  * `KPI/PolicyCount`（覆盖域/模块数）
  * `KPI/ComplianceRisk`（SoD 冲突/过度授权风险）
  * `KPI/AuditTasks`（近7日待处理）
  * 交互：点击 KPI → 触发过滤（例如审计任务→跳审计页/筛选待处理）

## 1.2 主体布局：`RolePermission/Body`（两栏）

* Left：`RolePermission/RoleListPane`
* Right：`RolePermission/RoleDetailPane`

---

## 1.3 左侧角色列表 Pane：`RoleListPane`

### 1.3.1 工具条：`RoleListPane/Toolbar`

* `SearchBox`（name/code/desc）
* `FilterBar`

  * `Filter/Status`：全部 / 启用 / 停用
  * `Filter/ScopeType`：全平台 / 租户 / 组织 / 数据域
  * `Filter/Builtin`：全部 / 系统内置 / 自定义
  * `Filter/RiskLevel`：低/中/高（可选）
  * `Btn/Reset`
* `SortDropdown`：更新时间/成员数/风险等级（可选）
* `BatchActions`（选中列表项后出现）：
  * `Btn/BatchEnable`
  * `Btn/BatchDisable`
  * `Btn/BatchDelete`
  * `Btn/BatchRecertify`（发起批量重新认证）

### 1.3.2 列表：`RoleListPane/RoleCardList`

* `RoleCard`（重复组件，支持 Checkbox 多选）

  * Header：`Checkbox + RoleName + Tag(Builtin) + StatusBadge(启用/停用)`
  * Body：`RoleDesc`（1~2行截断）
  * MetaRow：`MemberCount`、`ScopeSummary`、`UpdatedAt`
  * 交互：点击选中 → 右侧详情刷新
* 列表态：

  * `State/LoadingSkeleton`
  * `State/Empty`（无匹配）
  * `State/Error`（重试）

---

## 1.4 右侧角色详情 Pane：`RoleDetailPane`

### 1.4.1 详情头：`RoleDetailPane/Header`

* `RoleTitle`：角色名称（大标题）+ 角色描述 + `VersionBadge`（e.g., v1.2）
* `HeaderActions`

  * `Btn/EditRole`
  * `Btn/ToggleStatus`（停用/启用）
  * `Btn/CloneRole`（复制角色）
  * `Btn/RoleHistory`（历史版本/回滚）
  * `Btn/Delete`（灰显条件：内置角色/仍有成员/高危需审批）
* `RiskBadge`（可选）：高危/中危/低危（根据 scope + actions + memberCount）

### 1.4.2 概览卡：`RoleDetailPane/SummaryCards`

* `Card/MemberCount`
* `Card/ScopeSummary`（全平台/组织/域/租户 + 数量）
* `Card/UpdatedAt`
* `Card/Inheritance`（若有父角色，显示继承来源）

### 1.4.3 授权范围与数据过滤：`RoleDetailPane/ScopeSection`

* `ScopeTags`：`Global` / `所有资源`（截图已有）
* `DataFilterRules`（优化项：行级安全重用）
  * 展示当前配置的“数据安全过滤器”（如：`SecurityLevel <= 2`）
* `ScopeDetailPanel`
  * `ScopeTypeLabel`
  * `ScopeRefList`（组织树/域/租户 Tag + 展开查看）
  * `Btn/ViewAllScopes`（弹出范围明细）

### 1.4.4 权限策略矩阵：`RoleDetailPane/PolicyMatrixSection`

* `MatrixHeader`

  * Columns：治理模块 | 查看 | 编辑 | 发布 | 管理 | 说明
  * `Toggle/ShowAdvancedPerms`（显示高级权限点）
  * `Toggle/ShowUnusedPerms`（高亮显示过去 90 天未使用的权限）
* `MatrixTable`

  * Row：模块（语义资产/语义版本/数据安全/数据服务/数据质量/业务场景…）
  * Cell：`CheckIcon` 或 `Checkbox`（只读态为 icon）
  * `InfoCell`：说明（如“版本策略配置”）
  * 高级权限点展开态（可选）：

    * `AdvancedPermsDrawerInline`（行内展开二级权限点 tree/list）

### 1.4.5 成员分配与认证：`RoleDetailPane/MembersSection`

* `MembersHeader`

  * `Btn/AddUser`
  * `Btn/AddGroup`（可选）
  * `Btn/StartRecertification`（发起成员权限确认）
  * `Btn/ExportMembers`（可选）
* `MembersList`

  * Columns：用户/组名称 | 来源（手动/同步）| 有效期（永久/临时）| 上次使用时间 | 状态
  * Row：支持展示临时授权的过期时间 Tag（如 `2天后过期`）
  * Row：`UsageStatus`（活跃/僵尸账号警告）
  * `RowActions`：移除、续期（针对临时）
* `State/Empty`：暂无成员

### 1.4.6 合规与分析：`RoleDetailPane/ComplianceSection`

* `SoDAnalysis`
  * 检测 Role 内部是否包含互斥权限（例如：既能“发起审批”又能“通过审批”）
  * 状态：`Pass` 或 `Conflict Warning`
* `LeastPrivilege`
  * 建议移除的权限（基于长期未使用日志）

### 1.4.7 最近变更：`RoleDetailPane/RecentChangesSection`

* `ChangeList`（时间线）

  * Item：变更摘要（例如“语义版本发布权限提升”） | 操作人 | 版本 v1.1 -> v1.2
  * `Link/ViewDiff`（进入审计详情或变更详情）
  * `Btn/Rollback`（快速回滚到此版本之前）
* `Link/GoToAudit`（跳审计页并预筛该角色）

### 1.4.8 右侧 Pane 状态

* `State/Placeholder`：未选择角色
* `State/Loading`
* `State/Error`

---

# 2) 新建角色向导（推荐替代单屏表单）：`[Modal] RP/CreateRoleWizard`

> 你们现状是单屏“新建角色”弹窗；向导能显著降低配置错误与认知负担。保留“权限模板”与“范围类型”能力。

## 2.1 向导框架：`CreateRoleWizard/Frame`

* `ModalHeader`：新建角色 + 描述
* `Stepper`

  * Step1 基本信息（含继承）
  * Step2 授权范围与数据过滤
  * Step3 权限策略
  * Step4 预览与确认
* `ModalBody`（随步骤切换）
* `ModalFooter`

  * `Btn/Back`
  * `Btn/Next`
  * `Btn/Cancel`
  * Step4：`Btn/CreateRole`（主按钮）

---

## Step1：基本信息 `CreateRoleWizard/Step1_Basic`

* `Input/RoleName`（必填）
* `Input/RoleCode`（必填，建议自动生成）
* `Textarea/RoleDesc`
* `Select/Status`（启用/停用）
* `Select/ParentRole`（可选：角色继承）
  * 选择父角色后，默认继承其策略与范围（可覆盖或叠加）
* `Select/PermissionTemplate`（权限模板，下拉 + 模板描述预览）
* `Hint/TemplateImpact`（选择模板后提示将预填策略）
* `ValidationSummaryInline`

## Step2：授权范围 `CreateRoleWizard/Step2_Scope`

* `ScopeTypeSegment`

  * 全平台 / 指定租户 / 指定组织 / 数据域
* `ScopeSelectorPanel`（按类型联动）

  * 租户：`Select/TenantMulti`
  * 组织：`OrgTreePicker`（多选）
  * 数据域：`DomainMultiSelect`
* `DataFilterConfig`（优化项：高级数据过滤）
  * `Checkbox/EnableRLS`（启用行级/数据级过滤）
  * 规则构建器：`[字段] [操作符] [值]`（例如 `SecretLevel < 'L3'`）
* `SelectedScopeSummary`（Tag 列表 + 数量 + 清空）
* `RiskHint`（全平台 + 管理权限将提升风险等级）
* `ValidationSummaryInline`

## Step3：权限策略 `CreateRoleWizard/Step3_Policy`

* `PolicyMatrixEditable`

  * Table：模块 ×（查看/编辑/发布/管理）checkbox
  * `Toggle/ShowAdvancedPerms`
  * 高级权限点：

    * `AdvancedPermsPanel`（tree/list，支持模块内勾选）
* `SoDChecker`（实时）：
  * 当勾选产生冲突时（如同时勾选申购与审批），即时提示 `SoD Conflict` 警告。
* `QuickActions`

  * `Btn/SelectAllView`
  * `Btn/ClearAll`
  * `Btn/ApplyTemplateAgain`（重置为模板）
* `RiskHint`：高危权限点标记（如管理/审批/导出）
* `ValidationSummaryInline`

## Step4：预览与确认 `CreateRoleWizard/Step4_Review`

* `ReviewCards`

  * `Card/RoleInfo`（name/code/desc/status/继承来源）
  * `Card/ScopeReview`（范围明细 + 数据过滤规则）
  * `Card/PolicyReview`（模块动作汇总 + 高级权限点数）
  * `Card/ComplianceCheck`（SoD 检查结果：通过/警告/失败）
* `RiskAssessmentPanel`

  * 风险等级 + 触发因素（scope=全平台、包含管理类权限等）
  * 高危二次确认（checkbox + 原因输入，可选）
* `Btn/OpenEffectivePreview`（可选：以当前配置模拟一个用户）

---

# 3) 有效权限预览弹窗：`[Modal] RP/EffectivePermissionPreview`

## 3.1 弹窗结构：`EffectivePreview/Frame`

* `ModalHeader`

  * Title：有效权限预览
  * Desc：模拟用户在多角色叠加下的最终生效权限以及数据访问范围
* `ModalBody`
* `ModalFooter`

  * `Btn/Close`
  * `Btn/Export`（可选）

## 3.2 顶部选择区：`EffectivePreview/UserPickerSection`

* `Select/SimulatedUser`（可搜索）
* `AssignedRolesSummary`

  * 已分配角色：Tag 列表（如 平台管理员、语义治理负责人）
  * `Link/ManageUserRoles`（可选跳转）
* `RuleHintCollapse`（可折叠：合并规则说明）

  * Actions：并集 / Deny 优先级（若支持）
  * Scope：合并策略简述

## 3.3 生效权限表：`EffectivePreview/EffectiveTable`

* Columns：

  * 治理模块
  * 生效权限（EFFECTIVE ACTIONS）——用 Chip 展示：查看/编辑/发布/管理
  * 数据过滤规则（Data Filter）——展示合并后的过滤条件（如 `Dept IN [...] AND Level < 3`）
  * 来源角色 —— Tag 列表
* Row Expand（建议补齐）：`Row/ExpandDetail`

  * **Trace View**：展示该权限来自哪个角色（Role A: View, Role B: Edit -> Final: View, Edit）
  * **Scope Trace**：展示 Scope 来源
  * `Link/ViewCalculationTrace`（可选）

## 3.4 状态

* `State/Loading`
* `State/Empty`（用户无角色）
* `State/Error`

---

# 4) 权限模板页：`[Page] RP/PermissionTemplates`

> 截图里有入口“权限模板”，建议单独页面，以便沉淀“岗位标准权限”。

## 4.1 顶部：`Templates/Header`

* `Breadcrumb`：平台管理 / 权限模板
* `Title`：权限模板
* `PrimaryActions`

  * `Btn/NewTemplate`
  * `Btn/ImportTemplate`（可选）
  * `Btn/ExportTemplate`（可选）

## 4.2 主体：`Templates/Body`（两栏）

* Left：`TemplateListPane`
* Right：`TemplateDetailPane`

### 4.2.1 `TemplateListPane`

* `SearchBox`（name/code）
* `FilterBar`

  * 状态：草稿/已发布/停用
  * 适用范围：全平台/组织/域（可选）
* `TemplateCardList`

  * Card：模板名 + 状态 + 覆盖模块数 + 更新时间
  * 行内动作：复制/停用/删除

### 4.2.2 `TemplateDetailPane`

* `DetailHeader`

  * 模板名称 + 描述
  * Actions：编辑、发布、停用、复制
* `ScopeSuggestion`（可选）：推荐范围类型（仅提示）
* `PolicyMatrixReadonly`（同角色详情矩阵）
* `AdvancedPerms`（可展开）
* `UsagePanel`（可选）

  * 被多少角色引用/最近应用时间
  * `Btn/CreateRoleFromTemplate`（一键新建角色并预填）

## 4.3 编辑模板（推荐 Drawer）：`[Drawer] Templates/EditTemplate`

* 基本信息（name/code/desc/status）
* 策略矩阵（可编辑 + 高级权限点）
* 保存/发布流转（草稿保存、发布确认）

---

# 5) 审计页（任务 + 变更记录）：`[Page] RP/Audit`

> 你们 KPI 有“审计任务”，建议把“待审批任务”和“历史变更审计”统一在该页。

## 5.1 顶部：`Audit/Header`

* `Breadcrumb`：平台管理 / 审计
* `Title`：审计与审批
* `KPIBar`

  * 待处理任务数
  * 本周高危变更数
  * 失败/驳回数（可选）

## 5.2 主体 Tabs：`Audit/Body`

* `Tab/Tasks`（待处理）
* `Tab/Logs`（审计日志）
* `Tab/Policies`（策略变更专用视图，可选）

---

## 5.3 Tab：待处理任务 `Audit/Tasks`

### 左侧筛选：`Tasks/FilterPanel`

* 时间范围、实体类型（角色/模板/成员/范围）、风险等级、发起人、状态（待审批/已通过/已驳回）
* `SearchBox`（roleName/auditId）

### 列表：`Tasks/TaskTable`

* Columns：任务ID | 变更对象 | 变更类型 | 风险 | 发起人 | 发起时间 | 状态 | 操作
* Row Actions：查看、通过、驳回

### 详情面板（右侧 Drawer）：`[Drawer] Audit/TaskDetail`

* `TaskSummary`（对象、发起人、时间、原因）
* `DiffViewer`

  * 范围变更 diff（old/new）
  * 权限矩阵 diff（动作变更 + 高级权限点变更）
  * 成员变更 diff
* `ApprovalActions`

  * `Btn/Approve`
  * `Btn/Reject`（必填驳回原因）
* `AuditTrail`（审批链/评论）

---

## 5.4 Tab：审计日志 `Audit/Logs`

### 工具区：`Logs/Toolbar`

* Filters：时间、对象、操作者、动作、风险
* `Btn/ExportLogs`
* `Btn/SoDLog`（查看 SoD 违规日志）

### 日志表：`Logs/LogTable`

* Columns：时间 | 操作人 | 对象 | 动作 | 风险 | 结果 | 详情
* `RowExpand`：快速显示 diff 摘要
* `Link/OpenDiffViewer`

### Diff 查看器（Modal）：`[Modal] Audit/DiffViewer`

* 左右对比（Before/After）
* 分组：基本信息 / 范围 / 策略矩阵 / 高级权限点 / 成员
* `Btn/CopyJSON`（可选）
* `Btn/Rollback`（若有权限，直接由此发起回滚）

---

# 6) 前端组件拆分清单（工程可直接使用）

* 页面

  * `RolePermissionPage`
  * `PermissionTemplatesPage`
  * `AuditPage`
* 角色页组件

  * `RPHeader`, `RPKPIBar`
  * `RoleListPane`（`RoleFilters`, `RoleCardList`, `RoleCard`）
  * `RoleDetailPane`（`RoleSummaryCards`, `ScopeSection`, `PolicyMatrix`, `MembersSection`, `ComplianceSection`, `RecentChanges`）
* 向导/弹窗

  * `CreateRoleWizardModal`（Step1~Step4）
  * `EffectivePermissionPreviewModal`（`UserPicker`, `EffectiveTable`, `RuleHint`）
  * `RollbackModal`
* 模板

  * `TemplateListPane`, `TemplateDetailPane`, `EditTemplateDrawer`
* 审计

  * `AuditTasksTab`, `AuditLogsTab`
  * `TaskDetailDrawer`, `DiffViewerModal`

---

