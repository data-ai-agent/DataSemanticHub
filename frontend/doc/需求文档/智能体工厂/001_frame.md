下面是基于你们“数据语义治理平台”能力（语义版本/业务对象/逻辑视图/质量/安全/知识网络/问数/语义理解）重新整理后的 **「智能体工厂」完整前端 Frame 结构**。并把所有相关功能统一收敛到一个新的一级菜单：**智能体工厂**。

> 结构表达方式：`Menu / Page / Frame / Section / Component` 逐级缩进
> `(Admin)` 表示建议仅管理员可见；`(All)` 表示普通用户可见
> 默认：所有运行均写入 Trace，可从观测/调试/审计统一追溯

---

# 0. 一级菜单与左侧导航（IA）

## 一级菜单：`智能体工厂`

* `概览`（All）
* `模板库`（All）
* `智能体设计器`（All）
* `调试与Trace`（All）
* `用例与评测`（All）
* `发布与灰度`（Admin）
* `运行实例`（All）
* `运行观测`（Admin/运营）
* `工具与技能`（Admin）
* `知识源与连接`（Admin）
* `运行包与策略`（Admin）
* `审计日志`（Admin）
* `工厂设置`（Admin）

> 说明：
>
> * “模板库/设计器/调试/用例/发布/观测”组成完整治理闭环
> * “工具与技能/知识源与连接/运行包与策略”是平台底座，可同时服务问数与语义理解

---

# 1. 概览页 Frame（智能体工厂总览）

## `Page: AgentFactoryOverviewPage`

### `Frame: OverviewLayout`

* `TopBar`

  * 标题：智能体工厂
  * 右侧：创建模板 / 创建智能体（快捷）
* `KPIOverviewCards`

  * 模板数、已发布版本数、运行实例数
  * 近7天调用量、成功率、超时率、平均成本（token/￥可选）
* `RecentActivity`

  * 最近发布、最近回滚、最近失败 Top（点击跳到详情）
* `TopTemplates`

  * 使用量 Top、失败率 Top
* `GovernanceStatus`

  * 未通过门禁的版本数、灰度中的发布单、工具异常告警数

---

# 2. 模板库 Frame（你图中的列表页 + 增强治理标签）

## `Page: TemplateLibraryPage`

### `Frame: TemplateLibraryLayout`

* `TopBar`

  * 标题：模板库
  * 搜索：名称/标签/作者/能力类型/业务域
  * 右侧：新建模板 `CreateTemplateButton`
* `FilterBar`

  * 分类 Tabs（你已有）：全部/辅助阅读/事件感知/报告生成/辅助决策/数据处理/情报分析/智能洞察/分析助手…
  * 能力类型：问数(QNA) / 语义理解(SEM) / 知识网络构建(KG) / 报告 / 客服 / 通用
  * 状态：草稿/待审核/已发布/已废弃/灰度中
  * 业务域：供应链/销售/政务事项…（可选）
  * 排序：最近更新/最近发布/使用量/成功率
* `TemplatesGrid`

  * `TemplateCard`

    * 图标 + 名称 + 简介
    * 标签：能力类型、业务域、适用语义版本（可选）
    * 状态徽标：Draft / Stable / Canary / Deprecated
    * 指标（折叠显示）：近7天调用量、成功率、P95耗时
    * 操作：查看 / 去使用 / 调试（hover）
* `CreateTemplateWizard`（抽屉/弹窗）

  * 选择能力类型 → 选择骨架（问数/语义理解/知识网络）→ 基本信息 → 创建

---

# 3. 智能体设计器 Frame（模板详情编辑页重构）

## `Page: AgentTemplateDesignerPage (/templates/:id)`

### `Frame: DesignerLayout`（顶部 + 左右分栏）

* `TopBar`

  * 返回 + 模板名称
  * 右侧：去使用 / 打开调试 / 保存草稿 / 发布 / 回滚（按权限与状态）
* `VersionBar`（P0 必备）

  * 当前版本：vX.Y.Z（Draft/Published/Stable/Canary）
  * 操作：版本历史 / Diff / 从某版本拉草稿 / 变更说明
  * 环境指针（可读）：Staging/Prod 的 Stable/Canary 指向
* `MainLayout`（左右分栏）

### 左栏 `LeftPanel: TemplateCoreEditor`

* `Section: 基本信息`

  * 名称、简介、图标、分类、标签
  * 能力类型（只读/可改）+ 业务域（可选）
* `Section: 绑定语义资产（与你们产品能力强耦合）`

  * 语义版本选择器（SemanticVersionSelector）
  * 业务对象/逻辑视图范围选择（ObjectScopeSelector）
  * 指标/术语/标签范围选择（TermScopeSelector）
  * 质量/安全策略引用（Quality&SecurityPolicyRef）(可选)
* `Section: 角色指令（Role/System Prompt）`

  * Prompt 编辑器（支持变量、片段插入）
  * 安全提示：注入风险/敏感词（提示不阻断）
* `Section: 流程编排（Workflow/DSL）`

  * 模块状态卡片（启用/禁用）
  * `FlowEditor`（DSL/可视化二选一）

    * 工具调用片段插入（工具名 + 参数）
    * 变量引用校验（未知变量提示）
    * 危险操作 lint（SQL DDL/DML、未加 limit 等）
* `Section: 输出结构（Output Schema）`（P0）

  * 输出类型：Text / JSON / 多段输出
  * `SchemaEditor`（JSON Schema）
  * `SchemaRules`（必填字段、枚举、最大数组）
  * 示例输出（可一键生成）
  * 强制项（语义理解模板建议默认启用）：

    * entities / relations / evidence / confidence / conflicts

### 右栏 `RightPanel: RuntimeConfig`

* `Accordion: 输入配置`

  * 输入字段列表（新增/编辑/排序）
  * 字段属性：类型、必填、默认值、校验规则、示例
  * 绑定来源：用户输入 / 会话上下文 / 语义资产 / 质量信号 / 权限信息
* `Accordion: 知识源`

  * 文档库/知识条目
  * 业务知识网络（含版本/试验版切换）
  * 指标库（绑定口径/语义版本）
  * 检索策略：topK、过滤条件、重排（可选）
* `Accordion: 工具与技能（Skills/Tools）`

  * 添加工具（来自“工具与技能”注册表）
  * 工具权限提示、超时、成本权重
* `Accordion: 默认模型配置`

  * 默认模型、fallback 模型
  * temperature/max tokens/context 策略
* `Accordion: 体验配置`

  * 长期记忆（toggle）
  * 相关问题（toggle）
  * 默认开场白（AI生成/手动）
  * 预设问题（AI生成/手动）
* `Accordion: 运行限制与安全`

  * 最大耗时、最大扫描/行数、分页/抽样策略
  * SQL 安全策略引用（如果是问数类）

---

# 4. 调试与 Trace Frame（替代“打开调试”的落地页）

## `Page: DebugAndTracePage (/templates/:id/debug)`

### `Frame: DebugWorkbenchLayout`（三栏）

* `TopBar`

  * 版本选择（Draft/某已发布）
  * 环境选择（Dev/Staging）
  * 运行按钮：运行 / 取消
  * 保存为用例
* `LeftPanel: 输入面板`

  * 变量表单（支持 JSON/文件）
  * 校验提示（缺失/类型错误）
  * 快捷：加载用例 / 最近一次输入
* `CenterPanel: 输出面板`

  * 输出预览（文本/JSON）
  * Schema 校验结果（通过/失败字段定位）
  * 导出/复制
* `RightPanel: Trace 面板`

  * 阶段时间线：parse/ground/plan/generate/execute/explain
  * 工具调用列表（输入/输出摘要、耗时、错误码）
  * token/耗时/成本统计
    -（Admin 可见）Prompt 渲染结果、模型响应原文、重试/降级记录
* `ErrorActionBar`（底部/抽屉）

  * 标准错误卡：errorCode、stage、requestId
  * 操作：重试 / 缩小范围 / 仅返回结构 / 切换版本

---

# 5. 用例与评测 Frame（回归、对比、门禁）

## `Page: TestAndEvaluationPage (/templates/:id/test)`

### `Frame: TestSuiteLayout`

* `Header`

  * 评测版本（待发布版本）
  * 基线版本（Stable）
  * 运行：单用例/全量/对比（A-B）
* `Left: 用例列表`

  * 用例卡：名称、输入摘要、断言摘要、最近结果
  * 操作：编辑/复制/删除/运行
* `Center: 用例编辑器`

  * 输入变量（JSON/文件）
  * 断言编辑器：

    * schema 必须通过
    * 关键字段存在/枚举命中/数量限制
    * 置信度阈值（语义理解）
* `Right: 评测报告`

  * 总览：成功率、schema通过率、平均耗时、P95、成本、错误码Top
  * 对比：相对基线提升/退化
  * 失败样本列表（可打开 Trace）
* `QualityGatePanel`（发布门禁配置）

  * 阈值设置：成功率/超时率/schema通过率/成本
  * 当前是否通过（通过/阻断原因）

---

# 6. 发布与灰度 Frame（版本上线可控）

## `Page: ReleaseAndCanaryPage (/templates/:id/releases)`（Admin）

### `Frame: ReleasePipelineLayout`

* `ReleaseHeader`

  * 选择要发布版本（通常是 Draft）
  * 目标环境：Staging/Prod
  * 发布策略：

    * 全量发布
    * 灰度（1%→5%→20%→100%）
    * 白名单（租户/部门/角色/场景）
  * 门禁绑定：选择评测报告 + 线上指标门禁（可选）
* `ReleaseStepsTimeline`

  * 预检查（schema/权限/工具可用性）
  * 回归门禁（必须通过）
  * 执行发布（指针切换）
  * 监控窗口（自动放量/暂停）
* `MetricsDuringCanary`

  * 成功率、超时率、成本、负反馈率（对比 stable）
* `RollbackPanel`

  * 一键回滚到 Stable 或指定版本
  * 回滚原因 + 影响范围输出

---

# 7. 运行实例 Frame（面向业务使用与实例管理）

## `Page: AgentInstancesPage (/agents/instances)`

### `Frame: InstancesLayout`

* `TopBar`

  * 创建实例（从模板创建）/ 进入实例工作台
* `InstancesTable`

  * 列：实例名、模板版本、能力类型、业务域、环境、状态、创建人、更新时间
  * 操作：打开 / 停用 / 复制 / 查看Trace
* `InstanceDetailDrawer`

  * 实例配置快照（引用的模板版本、语义版本、知识源范围、工具集合）
  * 最近运行记录（trace 列表）

## `Page: AgentInstanceWorkbenchPage (/agents/instances/:instanceId)`

### `Frame: WorkbenchLayout`

* `ContextBar`

  * 实例信息（模板版本、语义版本、权限范围）
  * 时间范围/对象范围（对问数/语义理解可选）
* `MainPanel`

  * 对话/任务执行区（类似你们问数 UI）
  * 结果卡片（结构化输出、表/图、可下载）
  * Trace 快捷入口（每条结果可打开 trace 抽屉）

---

# 8. 运行观测 Frame（按模板/版本/实例汇总）

## `Page: ObservabilityPage (/observability)`（Admin/运营）

### `Frame: ObservabilityDashboardLayout`

* `FiltersBar`

  * 时间、环境、能力类型、模板/版本、业务域、租户/角色
* `KPIOverviewCards`

  * 调用量、成功率、超时率、P95耗时、平均成本、schema失败率
* `ErrorCodeBreakdown`

  * Top 错误码 + 受影响模板/版本
* `StagePerformance`

  * 各阶段耗时分布
* `ToolUsage`

  * 工具调用次数/失败率/耗时
* `TraceSearchTable`

  * traceId、requestId、模板版本、实例、状态、耗时、错误码
  * 打开 Trace 详情抽屉

---

# 9. 工具与技能 Frame（注册表 + 权限 + 契约）

## `Page: ToolRegistryPage (/tools)`（Admin）

### `Frame: ToolRegistryLayout`

* `ToolList`

  * 工具名、类型（检索/执行/质量/安全/转换）、版本、状态、权限级别、超时、成本权重
* `ToolDetail`

  * I/O Schema（必备）
  * 权限（哪些角色可用）
  * 安全约束（例如 SQL 工具禁止 DDL/DML）
  * 健康状态（可用性/延迟/错误率）
* `ToolVersionHistory`（可选）

---

# 10. 知识源与连接 Frame（与语义治理资产打通）

## `Page: KnowledgeAndConnectorsPage (/knowledge-sources)`（Admin）

### `Frame: KnowledgeSourcesLayout`

* `ConnectorList`

  * 文档库连接、知识条目、业务知识网络、指标库、术语库
* `ConnectorDetail`

  * 授权/凭据（Secrets 管理入口）
  * 访问范围（租户/部门/角色）
  * 索引策略/更新策略
* `SemanticAssetPicker`（嵌入组件）

  * 语义版本、业务对象、逻辑视图、术语/指标/标签范围选择

---

# 11. 运行包与策略 Frame（把“提示词/工具链治理”产品化）

## `Page: RuntimePacksAndPoliciesPage (/runtime-packs)`（Admin）

### `Frame: PacksLayout`

* `PackList`

  * packId、能力类型、适用业务域、绑定语义版本、stable/canary 指针、状态
* `PackEditor`

  * Prompt 资产引用（按阶段）
  * Tool Policy（工具选择/降级策略）
  * Model Policy（分阶段模型路由/fallback/预算）
  * Guardrails（安全/输出校验）
* `PolicySimulator`

  * 输入一个问题/任务 → 展示会选择的工具链与模型（仿真）
* `PackReleaseEntry`

  * 从 pack 维度触发发布（可选，若你们倾向模板级发布，可不做）

---

# 12. 审计日志 Frame（治理必备）

## `Page: AuditLogsPage (/audit)`（Admin）

### `Frame: AuditLogLayout`

* `Filters`

  * 时间、操作者、动作类型（创建/编辑/发布/回滚/权限/工具变更）
* `AuditTable`

  * 动作、对象（模板/版本/发布单/工具）、差异摘要、时间
* `AuditDetailDrawer`

  * Diff、关联 trace、关联评测报告、关联回滚原因

---

# 13. 工厂设置 Frame（模型/密钥/配额/权限）

## `Page: AgentFactorySettingsPage (/settings)`（Admin）

### `Frame: SettingsLayout`

* `ModelProviders`

  * 模型供应商配置、可用模型列表、默认模型、fallback
* `SecretsVault`

  * 凭据管理（数据源/文档库/外部 API）
* `QuotasAndBudgets`

  * token/成本预算（按租户/部门/角色）
* `RBAC`

  * 模板编辑/发布/回滚/观测权限矩阵
* `GlobalGuardrails`

  * 全局安全策略（注入防护、敏感字段策略、SQL安全）

---

## 你现有页面如何最小改动映射到这个结构

* 你现在的“模板列表页” → `模板库`
* 你现在的“模板详情编辑页” → `智能体设计器`（加 VersionBar + OutputSchema + 绑定语义资产）
* “打开调试” → `调试与Trace`
* “去使用” → 创建 `运行实例` 并进入实例工作台
* 后续增强治理（评测/灰度/回滚/观测）全部在 `用例与评测 / 发布与灰度 / 运行观测` 里承接

---
