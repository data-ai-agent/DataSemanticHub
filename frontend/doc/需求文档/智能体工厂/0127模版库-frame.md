
# 0. 路由与菜单定位

一级菜单：`智能体工厂`
二级菜单：`模板库`

路由：

* `/agent-factory/templates`（模板库）
* `/agent-factory/templates/:templateId`（模板详情 / 智能设计器，跳转，不在本次展开）
* `/agent-factory/templates/create`（新建向导，可保持为 Modal 或独立页）

---

# 1. Template Library Page（模板库）

## 1.1 `Page: TemplateLibraryPage`

### `Frame: TemplateLibraryLayout`

* `TopBar`

  * `Breadcrumb`: 智能体工厂 / 模板库
  * `TitleBlock`

    * Title: 模板库
    * Subtitle: 管理智能体模板、能力类型与治理状态
  * `PrimaryActions`

    * `CreateTemplateButton`（新建模板）
    * `BulkActionsButton`（批量管理，按权限显示）
    * `ViewToggle`：`CardView` / `TableView`
* `GlobalSearchRow`

  * `SearchInput`（placeholder：搜索 名称/标签/作者/业务域/模板ID）
  * `QuickFilters`

    * `StatusPills`: Stable / Canary / Draft / Deprecated / Disabled
    * `HealthPills`: 正常 / 预警 / 异常（由观测计算）
  * `SortDropdown`

    * 最近更新 / 调用量 / 成功率下降 / P95 上升 / 成本上升
  * `AdvancedFilterButton`（打开筛选抽屉）
* `FilterPanel`（默认折叠，可展开）

  * `FilterGroup: 维度筛选`

    * `CapabilityTypeMultiSelect`：QNA / SEM / KG / Report / CS / 通用
    * `ScenarioCategoryMultiSelect`：辅助阅读 / 事件感知 / 报告生成 / 辅助决策 / 数据处理 / 情报分析 / 智能洞察 / 分析助手
    * `BusinessDomainSelect`（业务域）
    * `OwnerSelect`（负责人/创建人）
    * `RuntimePackSelect`（绑定运行包）
    * `SemanticVersionSelect`（绑定语义版本，可选）
  * `FilterGroup: 治理筛选`

    * `ReleaseGateStatus`：通过 / 未通过 / 未运行
    * `ProdPointerStatus`：Prod Stable / Prod Canary / 未部署
    * `GrayReleaseRange`：0~100%
  * `FilterGroup: 指标筛选`

    * `SuccessRateRange`
    * `P95Range`
    * `CostRange`（近7天成本）
    * `ErrorRateRange`
  * `FilterSummaryCard`

    * 显示当前筛选摘要 + 结果数
* `ContentArea`

  * `TemplateListContainer`（根据 ViewToggle 渲染）

    * `CardGridView` 或 `TableView`
* `RightSideAssist`（可选，轻量）

  * `SavedViews`（保存的筛选视图：运营/风控/问数）
  * `AlertsWidget`（最近异常模板 Top5 + 快捷处置）

---

# 2. 卡片视图（Card View）

## 2.1 `Component: TemplateCard`

### `Frame: TemplateCardFrame`

* `CardHeader`

  * `TemplateName`（可点击跳详情）
  * `StatusBadge`：Stable/Canary/Draft/Deprecated/Disabled
  * `HealthBadge`：正常/预警/异常（基于阈值）
* `CardMeta`

  * `TagsRow`

    * `CapabilityTypeTag`（QNA/SEM… 强约束）
    * `ScenarioCategoryTags`（运营标签，多选）
    * `SemanticVersionTag`（如绑定）
  * `OwnerAndUpdatedAt`
* `GovernanceSummaryRow`（**P0 新增**）

  * 文案示例：`Prod: Stable v2.2.8 | Canary v2.3.1 (20%) | Gate: Pass`
  * `Tooltip`: 展示 gate 报告摘要 / 灰度策略 / 运行包名
* `MetricsRow`（近7天）

  * 调用量、成功率、P95、成本（可切换展示 token）
  * `TrendIndicator`（↑↓，对比上周/前24h）
* `CardActions`

  * `ViewButton`（查看=进入详情）
  * `UseButton`（去使用=进入调用/体验页）
  * `DebugButton`（打开调试，权限控制）
  * `MoreMenu`

    * 复制模板
    * 查看 Trace
    * 查看门禁报告
    * 下线/禁用（仅运营/管理员）

---

# 3. 表格视图（Table View）

## 3.1 `Component: TemplateTable`

### `Frame: TemplateTableFrame`

* `TableToolbar`

  * `SelectedCount`
  * `BulkActionButtons`（多选后出现）

    * 批量：禁用 / 切回 Stable / 暂停灰度 / 触发门禁回归 / 通知负责人
* `DataTable`

  * Columns（建议）

    1. 选择框
    2. 模板名称（含 ID/跳转）
    3. 能力类型
    4. 业务域
    5. Prod 指针（Stable 版本 + Canary %）
    6. 门禁状态（Pass/Fail/Unknown）
    7. 近7天调用量
    8. 成功率（带趋势）
    9. P95（带趋势）
    10. 成本（带趋势）
    11. Owner
    12. 更新时间
    13. 状态（Stable/…）
    14. 操作（查看/调试/更多）
* `RowQuickActions`

  * 查看、调试、去使用、更多（同卡片）

---

# 4. 高级筛选抽屉（Advanced Filter Drawer）

## 4.1 `Drawer: AdvancedFilterDrawer`

* `Tabs`

  * `维度` / `治理` / `指标` / `审计`
* `Tab: 审计`

  * 发布人、发布时间范围
  * 最近回滚（有/无）
  * 最近变更字段（Prompt/Workflow/Schema/工具/知识源）
* `FooterActions`

  * 取消 / 重置 / 应用筛选 / 保存为视图（Saved View）

---

# 5. 运营“异常模板”视图（P0 必做）

> 不新增页面也行：用一个 Saved View + 右侧 AlertsWidget 即可。但建议有一个“异常模式”入口。

## 5.1 `Mode: OpsAnomalyMode`（切换开关）

* `AnomalyKPIBar`

  * 异常模板数、预警模板数、近24h失败总量、影响调用量
* `AnomalyTable`（固定表格视图）

  * 默认排序：成功率下降 / 错误率上升 / P95 上升 / 成本上升
* `QuickTriagePanel`

  * 选中模板后显示：

    * Top 错误码
    * 近1h/24h趋势
    * 推荐动作：暂停灰度/切回稳定/禁用 SQL 执行/切换模型池

---

# 6. 批量操作（Bulk Actions）弹窗与预检

批量动作必须做“影响评估”，否则会误伤生产。

## 6.1 `Modal: BulkActionWizard`

* Step1：选择动作

  * 批量禁用 / 批量切回 Stable / 批量暂停灰度 / 批量触发门禁回归 / 批量通知 Owner
* Step2：影响评估（Impact Preview）

  * 将影响的：运行包数、Prod 流量占比、近7天调用量
  * 风险提示：哪些模板正在 Canary、哪些门禁 Fail
* Step3：确认与执行

  * 执行进度条（逐模板）
  * 失败原因列表（带错误码与建议）
* 输出：`operationId`（可追溯）

---

# 7. 模板“快速详情”抽屉（列表不跳转也能看关键信息）

## 7.1 `Drawer: TemplateQuickViewDrawer`

* `Header`

  * 名称 + 状态 + Owner + 操作（查看/调试/去使用）
* `Section: 治理摘要`

  * 当前版本、Prod/Stage 指针、灰度%、门禁状态、绑定运行包
* `Section: 指标概览`

  * 调用量/成功率/P95/成本 + 趋势
  * Top 错误码（近24h）
* `Section: 资产绑定`

  * 语义版本、业务对象范围、指标库/知识源状态（是否过期）
* `Section: 最近变更`

  * 最近 3 次发布/回滚记录（可点开 diff）

---

# 8. 空态 / 错误态 / 权限态（必须定义）

## 8.1 空态

* 无模板：引导 `新建模板` + `从模板复制` + `导入`
* 筛选无结果：提示清空筛选，展示建议视图（热门模板/稳定模板）

## 8.2 错误态

* 指标拉取失败：卡片指标区域显示“--”并给 `重试`，不阻断列表渲染
* 权限不足：调试/批量/下线按钮隐藏或禁用，tooltip 给出申请入口

## 8.3 权限态（建议最小四档）

* `Viewer`：仅查看/去使用
* `Editor`：可复制/编辑草稿（进入详情）
* `Publisher`：可发布/灰度/回滚（在详情页）
* `Operator/Admin`：可禁用/批量处置/看审计

---

# 9. 与你们现有“治理状态/版本/灰度/门禁”数据对齐（字段映射提示）

模板库列表页要能计算 `HealthBadge` 和趋势，建议后端提供聚合字段（避免前端拼装）：

* `prodStableVersion`、`prodCanaryVersion`、`prodCanaryPercent`
* `releaseGateStatus`（pass/fail/unknown）
* `metrics7d`: calls, successRate, p95, cost
* `metrics24hDelta`: successRateDelta, p95Delta, costDelta
* `topErrorCodes24h[]`
* `bindings`: runtimePackName, semanticVersion, knowledgeSourceStaleness

---

## 最小改动落地路径（你可以直接排期）

* **P0（1~2个迭代）**

  1. 分类体系梳理：能力类型 vs 场景分类分离
  2. 卡片新增 GovernanceSummaryRow（Prod 指针/灰度/门禁）
  3. 增加 TableView + 排序（成功率下降/P95上升/成本上升）
  4. 增加 TemplateQuickViewDrawer
* **P1**

  * 批量操作向导 + 影响评估
  * 异常模式（OpsAnomalyMode）或 Saved View+AlertsWidget
* **P2**

  * Saved Views（可分享给团队）
  * 订阅告警与自动处置（与观测系统联动）

---