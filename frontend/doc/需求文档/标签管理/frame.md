## 0. 路由与页面树（信息架构）

* 语义资产管理

  * 术语管理
  * **标签管理（Tag Management）**

    * **标签列表页（List & Tree View）** `/tags`
    * **分类管理页（Category Management）** `/tag-categories`
    * （可选）标签规则管理页 `/tag-rules`（若暂不做，可挂在标签详情 Tab）

---

## 1) 标签管理｜列表/树形视图页（/tags）

### Frame：`Page / TagsManagement`

* `Layout / PageHeader`

  * `Breadcrumb`：语义资产管理 / 标签管理
  * `Title`：标签管理
  * `Desc`：统一管理数据资产标签，支持分类与层级关系
  * `Actions / Primary`

    * `Button / NewTag (+ 新建标签)`
    * `Button / Import（导入）`
    * `Button / Export（导出）`
    * `Button / GoCategoryMgmt（分类管理）`
* `Layout / ViewSwitchBar`

  * `SegmentedControl / ViewMode`：列表视图 | 树形视图（文件夹）
  * `Toggle / ShowDisabled`：显示禁用（可选）
  * `Badge / TotalCount`：总数
* `Card / Filters`

  * `Input / KeywordSearch` placeholder：搜索标签名称、编码或描述…
  * `Select / CategoryFilter`：全部分类 / 分类A / …
  * `Select / StatusFilter`：全部状态 / 已启用 / 已禁用 / 已废弃（可选）
  * `Select / ScopeFilter`：全部适用范围 / 表 / 字段 / 术语 / 业务对象 / 指标（按你们资产类型）
  * `Button / Reset`
  * `Button / Search`
* `Card / ContentArea`

  * （A）列表视图：`Table / TagTable`
  * （B）树形视图：`SplitPane / TreeAndList`（左树右表，或仅树+右侧详情，二选一）

---

### 1A) 列表视图 Frame：`Table / TagTable`

* `TableHeader`

  * `Checkbox / SelectAll`
  * `Column / 标签`（Name + ColorDot + Path）
  * `Column / 编码`
  * `Column / 分类`
  * `Column / 适用范围（Scope）`
  * `Column / 使用（UsageCount Link）`
  * `Column / 状态`
  * `Column / 更新时间`
  * `Column / 操作`
* `TableRow / TagRow`

  * `Checkbox / SelectRow`
  * `Cell / TagNameCell`

    * `ColorDot`
    * `Text / TagName`（主）
    * `Text / TagPath`（副：例如 业务场景 / 人口 / 出生一件事）
  * `Cell / Code`
  * `Cell / CategoryPill`
  * `Cell / ScopePills`
  * `Cell / UsageLink`（点击打开“引用明细抽屉”）
  * `Cell / StatusPill`：已启用/已禁用/已废弃
  * `Cell / UpdatedAt`
  * `Cell / RowActions`

    * `IconButton / Edit`
    * `IconButton / EnableDisable`（启用/禁用）
    * `Dropdown / More`

      * `MenuItem / ViewDetail（详情）`
      * `MenuItem / MergeInto（合并到…）`
      * `MenuItem / MigrateUsage（迁移引用…）`
      * `MenuItem / Deprecate（废弃…，可选）`
      * `MenuItem / Delete（删除…）`（需满足规则，否则 disabled + tooltip）
* `BatchActionBar / TableSelectionBar`（当选中>0出现）

  * `Text / SelectedCount`
  * `Button / BatchEnable`
  * `Button / BatchDisable`
  * `Button / BatchMoveCategory`
  * `Button / BatchExport`
  * `Dropdown / MoreBatch`

    * `BatchMerge` / `BatchDeprecate`（可选）
* `Pagination`

**状态 Frame**

* `State / Loading`（Skeleton Table）
* `State / Empty`（无数据，给“新建标签”入口）
* `State / EmptySearch`（无匹配，提示调整筛选）
* `State / Error`（重试）

---

### 1B) 树形视图 Frame：`SplitPane / TreeAndList`

* `LeftPane / TagTreePanel`

  * `Input / TreeSearch`（搜索节点）
  * `Tree / TagTree`

    * Node：`TagNode`（Name + ColorDot + Count，可选）
    * NodeAction：`+`（在该节点下新建子标签）
  * `Button / ExpandAll` / `CollapseAll`
* `RightPane / TagListOrDetail`

  * 方案1：`Table / TagTable (Contextual)`（展示当前节点下的子标签）
  * 方案2：`DrawerInline / TagDetailInline`（选中节点即展示详情概览）

---

## 2) 新建/编辑标签抽屉（核心补齐：父级 + 适用范围 + 编码规则）

### Frame：`Drawer / TagUpsert`

* `DrawerHeader`

  * Title：新建标签 / 编辑标签
  * Close
* `Form / TagForm`

  * `Section / BasicInfo`

    * `Input / TagName*`（必填）
    * `Input / TagCode*`（建议必填或自动生成）

      * `HelperText / Rules`：lower_snake_case、全局唯一、实时冲突校验
      * `InlineStatus / CodeCheck`：可用/已占用
    * `Select / Category*`（必填，支持跳转“分类管理”）
  * `Section / Hierarchy`

    * `TreeSelect / ParentTag`（父级标签，可空：表示一级）
    * `ReadOnly / FullPathPreview`
  * `Section / ScopeAndConstraints`

    * `MultiSelect / Scope`：表/字段/术语/业务对象/指标…
    * `Toggle / MultiSelectAllowed`（若按分类控制，此处只读展示）
    * `Note / CategoryConstraintHint`（由分类约束决定）
  * `Section / Description`

    * `Textarea / Description`
  * `Section / Visual`

    * `ColorPicker / Color`
    * `Input / ColorHex`
  * `Section / Governance (可选)`

    * `Select / Owner`（负责人）
    * `Select / Visibility/Permission`（谁可使用/谁可编辑）
* `DrawerFooter`

  * `Button / Cancel`
  * `Button / Save (Primary)`
  * `InlineValidationSummary`（保存失败时）

**校验与阻断提示 Frame**

* `Modal / CodeConflict`（编码冲突）
* `Modal / InvalidParent`（父级选择导致环形层级，禁止）
* `Toast / SaveSuccess`

---

## 3) 标签详情抽屉（建议作为统一入口：概览 + 引用 + 审计 + 规则）

### Frame：`Drawer / TagDetail`

* `Header`

  * `Title / TagName + ColorDot`
  * `SubTitle / FullPath + Code`
  * `StatusPill`
  * `Actions`

    * `Button / Edit`
    * `Button / EnableDisable`
    * `Dropdown / More`（合并/迁移/废弃/删除）
* `Tabs / TagDetailTabs`

  * Tab1：`Overview`

    * `Card / Summary`

      * 分类、适用范围、描述、创建人/时间、更新人/时间
    * `Card / UsageStats`

      * 使用总数
      * 按对象类型分布（表/字段/…）mini bars（可选）
  * Tab2：`References（引用明细）`

    * 复用「引用明细抽屉」内容（见第4节）
  * Tab3：`Rules（规则/自动打标）`（P2可占位）

    * `EmptyState / NotEnabledYet` 或 `RuleList`
  * Tab4：`Audit（审计）`

    * `Timeline / AuditLog`（创建/修改/禁用/迁移/合并等）

---

## 4) 使用（引用）明细抽屉（从“使用次数”点击下钻）

### Frame：`Drawer / TagUsageReferences`

* `Header`

  * Title：引用明细
  * Tag简要信息（Name/Code/Path）
* `Filters`

  * `Select / ObjectType`：全部/表/字段/术语/业务对象/指标…
  * `Input / ObjectSearch`
  * `Select / SystemFilter`（信息系统/数据源）
  * `DateRange / BindTime`
* `Table / ReferenceTable`

  * 列：对象类型｜对象名称｜所属系统/库｜绑定来源（手动/规则/AI）｜绑定人｜绑定时间｜操作（查看对象/解绑）
* `BatchActionBar`

  * `Button / BatchUnbind`
  * `Button / MigrateToOtherTag（迁移到…）`
* `Footer`

  * 取消/关闭

---

## 5) 合并/迁移向导（高风险操作必须“预览影响范围”）

### Frame：`Modal / MergeOrMigrateWizard`

* Step1：`SelectMode`

  * 单选：合并（A 合并到 B） / 迁移引用（A 的引用迁移到 B）
* Step2：`SelectTargetTag`

  * `SearchSelect / TargetTag`（不能选择自身/子孙节点，避免环）
* Step3：`ImpactPreview`

  * `Card / SummaryImpact`

    * 影响引用数量、涉及对象类型分布
    * 是否包含已禁用对象（可选）
  * `Table / AffectedObjectsSample`（抽样或分页预览）
* Step4：`Confirm`

  * `Input / ConfirmText`（输入“MERGE”/“MIGRATE”确认，按需）
  * `Checkbox / CreateAuditRecord`（默认勾选）
* `Footer`

  * 上一步 / 取消 / 执行（Primary）

---

## 6) 启用/禁用/删除/废弃：确认弹窗与阻断提示

### Frame：`Modal / DisableConfirm`

* 展示：禁用原因提示、影响范围简述、确认操作

### Frame：`Modal / DeleteConfirm`

* **强约束展示（必做）**

  * `BlockedReasonList`

    * 使用次数>0：禁止删除
    * 存在子标签：禁止删除
  * 当可删除时才显示“永久删除”确认

### Frame：`Modal / DeprecateConfirm（可选）`

* 选择替代标签（Required）+ 影响预览

---

## 7) 分类管理页（/tag-categories）

### Frame：`Page / TagCategoryManagement`

* `PageHeader`

  * Breadcrumb：语义资产管理 / 标签管理 / 分类管理
  * Title：分类管理
  * Actions：新建分类
* `SplitPane / CategoryAndConfig`

  * `Left / CategoryTreeOrList`

    * 分类树（可层级）
    * 行操作：编辑/禁用/删除（同样需要约束）
  * `Right / CategoryConfigPanel`

    * `Section / Basic`

      * 分类名称、编码、描述、状态
    * `Section / Constraints`

      * 适用对象类型（哪些对象可用此分类标签）
      * 是否允许多选（同对象下该分类标签可选多个？）
      * 是否必填（可选）
      * 是否系统内置（只读）
    * `Section / Permissions`

      * 谁可创建此分类下标签
      * 谁可使用此分类标签
    * `Section / Audit`

      * 修改记录
* `Modal / CategoryUpsert`

  * 名称、编码、描述、父分类（可选）、约束字段

---

## 8) 导入/导出（最小可用框架）

### Frame：`Modal / TagImport`

* 上传文件（CSV/Excel）
* 字段映射（Name/Code/Category/Parent/Scope/Description/Color）
* 冲突策略：跳过/覆盖/报错
* 校验结果预览（成功/失败行）

### Frame：`Modal / TagExport`

* 导出范围：当前筛选/选中/全部
* 格式：CSV/Excel/JSON（按需）

---

## 9) 组件命名约定（建议）

* 页面：`Page/*`
* 抽屉：`Drawer/*`
* 弹窗：`Modal/*`
* 表格：`Table/*`
* 状态：`State/*`
* 业务组件：`Biz/*`（如 BizTagPath、BizScopePills、BizStatusPill）

---
