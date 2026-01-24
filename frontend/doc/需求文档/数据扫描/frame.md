
# 01｜资产扫描中心（结果列表页）Frame 架构

## Frame：`01_AssetsScanCenter_ResultPage`（1440 × Auto）

> Layout：12 栅格 / 24 margin / 16 gutter（可按你们现有系统）

### A. Page Header（顶部页头）

**Frame：`A_Header`**

* `Breadcrumb`：资产管理 / 扫描中心
* `PageTitle`：资产扫描中心
* `Subtitle`：扫描数据源，发现物理资产，为后续语义分析提供原始数据
* `RightActions`（右侧操作区）

  * `PrimaryButton`：开始扫描（手动触发）
  * `SecondaryButton`：自动扫描配置（定时/事件触发）
  * `SecondaryButton`：扫描历史
  * `ScanSummaryInline`（行内摘要）

    * 上次扫描：YYYY-MM-DD HH:mm
    * 耗时：xx min
    * 范围：全量/增量（若有）
    * 结果：新增 x、变更 y、删除 z、失败 e

---

### B. KPI Summary（指标卡片区）

**Frame：`B_KPIs`（4–6 个卡片，保持一行）**

* `KPI_DiscoveredTotal`：发现表总数
* `KPI_New`：新增
* `KPI_Changed`：变更
* `KPI_Removed`：缺失/疑似删除（Removed）
* `KPI_Error`：扫描失败（Error）
* `KPI_Selected`：已选中（动态）

> 说明：Removed/Error 是扫描闭环的必要结果类型；否则“资产消失/扫描失败”不可见。

---

### C. Filter & Toolbar（筛选与工具条）

**Frame：`C_FilterBar`**

* `SearchInput`：搜索表名/注释（支持高亮）
* `Filter_DataSource`：数据源下拉（单选/多选按你们产品习惯）
* `Filter_Schema`：库/Schema 下拉（可选，MySQL 建议有）
* `Filter_Status`：状态多选（新增/变更/已同步/缺失/失败）
* `Filter_ReviewState`：处理进度（未确认/已确认/已忽略）
* `Filter_TimeRange`：时间范围（本次扫描/最近 7 天/自定义）
* `SortDropdown`：排序（扫描时间/变更强度/行数/健康分）
* `Reset`：重置

**Frame：`C_ViewOptions`（视图切换）**

* `ViewSwitcher`：
  * **List View**（默认）：扁平列表，适合批量处理
  * **Tree View**（层级）：按 数据源 > 库 > 表 展开，适合浏览结构
* `SavedViewsDropdown`：常用筛选预设（如“我的待确认”、“高频变更表”）

**Frame：`C_QuickTabs`（右侧/下方二级）**

* Tabs：全部 / 新增 / 变更 / 缺失 / 失败 / **关注**（My Watchlist）
* Tab Badge：数量

---

### D. Result Table（结果表格）

**Frame：`D_Table`**

* `TableHeader`

  * 全选 checkbox
  * 列定义（建议最小列集如下）
* `TableBody`（Row 可复用组件）
* `Pagination`：分页/每页条数/总数

**推荐列（按优先级从左到右）**

1. `Select`：checkbox
2. `AssetName`：物理表名（含 icon：表/视图）
3. `CnComment`：中文注释
4. `DataSource`：数据源
5. `Schema`：库/Schema（可选但推荐）
6. `RowCount`：行数（替代“数据量”，避免语义歧义）
7. `SemanticProfile`：语义画像（New!）
   * 自动识别的语义标签（如：用户、订单、交易）
8. `HealthScore`：健康分（New!）
   * 基于质量指标、鲜度、文档覆盖率计算（RGY 指示灯）
9. `Owner`：责任人
10. `Status`：发现状态 Badge

   * 新增 / 变更 / 已同步 / 缺失(Removed) / 失败(Error)
11. `ChangeSummary`：变更摘要（仅变更显示）

   * 示例：字段 +2 / -1 / 类型变更 1 / 注释变更 3
12. `ReviewState`：处理进度 Badge

   * 未确认 / 已确认 / 已忽略
13. `ScanAt`：本次扫描时间
14. `Actions`

* `Link_Detail`：详情
* `Link_Diff`：Diff（仅 Changed 展示）
* `More`：更多（导出/重扫/忽略等）

**Row Hover（悬浮快捷动作）**

* 变更行：显示 “查看 Diff”
* 错误行：显示 “查看错误原因”
* 缺失行：显示 “确认缺失/标记忽略”

---

### E. Sticky Batch Action Bar（批量操作条）

**Frame：`E_BatchBar`（默认隐藏，选择>0 显示，贴底）**

* `SelectedCount`：已选 X 个表
* `PrimaryAction`：标记已确认（Reviewed）
* `SecondaryActions`：

  * 忽略（Ignore）
  * 导出（Export：CSV/JSON/Schema）
  * 重扫所选（Rescan Selected）
  * **批量分配责任人**（Assign Owner）：指定认领人
  * **批量打标**（Batch Tagging）：添加业务标签
  * （可选）同步到目录（若你们有元数据目录承接）

---

### F. Empty / Error States（空态与异常态）

**Frame：`F_States`（按条件切换）**

* `Empty_NoResult`：无匹配结果（建议给筛选重置 CTA）
* `Empty_NoScanYet`：未扫描过（引导开始扫描）
* `Error_Global`：扫描服务不可用/权限缺失（给排障入口）

---

# 02｜资产详情抽屉（表详情）Frame 架构

## Frame：`02_AssetDetail_Drawer`（Right Drawer，720px × Auto）

> 进入方式：列表“详情”或行点击

### A. Drawer Header（抽屉头部）

**Frame：`A_DrawerHeader`**

* `Title`：t_pop_base_info
* `SubTitle`：人口基础信息表
* `MetaChips`：

  * 数据库类型：MySQL
  * 行数：1.2M
  * 字段：9
  * 数据源：xxx
* `Badges`：

  * 发现状态：新增/变更/已同步/缺失/失败
  * 处理进度：未确认/已确认/已忽略
* `CloseIcon`

---

### B. Tabs（抽屉标签页）

**Frame：`B_Tabs`**

* `Tab_Overview`：概览
* `Tab_Schema`：字段结构 / 血缘（Lineage New!）
* `Tab_DataQuality`：数据质量预览
* `Tab_Diff`：变更 Diff
* `Tab_ScanLog`：扫描日志
* `Tab_Collaborate`：协作讨论（New!）
* `Tab_SourceInfo`：数据源信息

---

### C1. Tab：概览（Overview）

**Frame：`C1_Overview`**

* `SummaryCards`（2 行以内）

  * 首次发现时间（First Seen）
  * 上次扫描时间（Last Scan）
  * 元数据更新时间（DDL Updated At）
  * 行数统计时间（Row Count At）
* `HealthSummary`：
  * 健康分：85（良好）
  * 扣分项：无主资产、缺少中文注释
* `RecentActivity`（最近扫描记录 3 条）
* `ImpactAnalysis`（变更/缺失 提示）：
  * **潜在影响**：关联 3 个下游报表，2 个 API 服务（需集成血缘服务）
* `SemanticInfo`（AI 推断）
  * 推荐业务名称
  * 推荐分类（事实表/维度表）
* `Notes`（可选）：人工备注（如果你们产品有通用备注能力）

---

### C2. Tab：字段结构（Schema）

**Frame：`C2_Schema`**

* `FieldSearch`：字段名/注释搜索
* `FieldFilters`：仅 PK / 仅 NN / 仅变更字段（若 Changed）
* `FieldTable`

  * 字段名
  * 类型
  * 注释
  * 约束（PK/NN/UK/FK/Default）
  * 敏感度标记（L1/L2/L3 - 自动扫描识别）
  * （可选）索引信息（折叠展开）

> 说明：即便不做语义候选，字段结构仍应支持“检索 + 约束信息”，便于用户判断资产质量与结构稳定性。

---

### C3. Tab：数据质量预览（DataQuality）

**Frame：`C3_DataQuality`**

* `SampleData`：前 5 行数据预览（脱敏展示）
* `QualityMetrics`：
  * 空值率（Null Rank）
  * 唯一值数（Distinct Context）
  * 极值（Min/Max）

---

### C4. Tab：变更 Diff（Diff）

**Frame：`C3_Diff`**

* `DiffSummary`：本次 vs 上次（字段新增/删除/类型变更/注释变更数量）
* `DiffFilter`：全部 / 新增字段 / 删除字段 / 类型变更 / 注释变更
* `DiffList`（每条变更）

  * 变更类型 Badge
  * 字段名
  * 旧值 → 新值（类型/注释/约束）
  * 影响等级（可选：高/中/低，字段删除=高）

---

### C5. Tab：扫描日志（ScanLog）

**Frame：`C4_ScanLog`**

* `ErrorBanner`（仅 Error）：错误码/错误信息/建议排障
* `LogTimeline`：连接 → 拉取元数据 → 统计行数 → 写入快照（步骤化）
* `RawLog`（折叠）：原始日志文本

---

### C6. Tab：协作讨论（Collaborate）

**Frame：`C6_Collaborate`**

* `CommentList`：用户对该资产的评论/疑问（支持 @责任人）
* `ReviewLog`：人工确认的操作记录（User A confirmed at ...）
* `ActionTrigger`：发起工单（例如：申请元数据修正）

---

### C7. Tab：数据源信息（SourceInfo）

**Frame：`C5_SourceInfo`**

* `DataSourceCard`

  * 数据源名称
  * 数据库类型
  * 库/Schema
  * 物理表名
  * 最后成功同步时间
* `LinkActions`：

  * 打开数据源配置（如果有权限）
  * 查看扫描配置（范围/规则）

---

### D. Drawer Footer（底部操作区）

**Frame：`D_FooterActions`**

* `PrimaryButton`：标记已确认 / 取消确认（根据当前 ReviewState 切换）
* `SecondaryButton`：忽略 / 取消忽略
* `Tertiary`：

  * 重扫此表
  * 导出 Schema（JSON/DDL）
* （Changed 情况）可加快捷入口：查看 Diff（切 Tab）

> 关键修改：把你当前的「选中并生成候选」替换为“扫描域内动作”，否则语义与能力不一致。

---

# 03｜扫描历史/任务抽屉 Frame 架构（推荐做，低成本高收益）

## Frame：`03_ScanRuns_Drawer`（Right Drawer，720px × Auto）

**Frame：`A_RunsList`**

* 列表项（每次扫描 Run）

  * 开始时间/结束时间/耗时
  * 范围（全量/增量、数据源数）
  * 结果：新增/变更/缺失/失败
  * 状态：成功/部分失败/失败
  * 操作：查看详情/查看日志/重跑

**Frame：`B_RunDetail`（点击某 Run）**

* Run 概览（统计卡）
* 失败资产列表（可过滤 Error）
* 配置信息（扫描参数、超时、权限）

---

# 04｜状态与标识（用于设计与研发对齐）

## 发现状态（Discovery Status）

* `NEW` 新增：本次扫描发现，上次快照不存在
* `CHANGED` 变更：与上次快照相比 Schema 发生变化
* `SYNCED` 已同步：与上次快照一致
* `REMOVED` 缺失：本次扫描未发现（被删/权限丢失/范围变化）
* `ERROR` 失败：扫描过程中出错（连接/权限/超时）

## 处理进度（Review State）

* `UNREVIEWED` 未确认（默认）
* `REVIEWED` 已确认（人工确认结果）
* `IGNORED` 已忽略（确认不纳入后续处理，或暂不关注）

---
