
## 0. 全局命名约定

* Frame：`[Page] MenuMgmt`
* 组件前缀：`MenuMgmt*`
* 交互态：`View / Edit / Loading / Empty / Error`
* 数据关键字段（用于 UI 映射，不含接口细节）：
  `id, name, code, type, groupId, parentId, path, permissionKey, visible, enabled, order, updatedAt, updatedBy, childrenCount, riskFlags[]`

---

## 1. 页面级 Frame：`[Page] MenuMgmt`

### 1.1 顶部区域 Frame：`MenuMgmt/Header`

* `Breadcrumb`

  * 文案：平台管理 / 菜单管理
* `PageTitle`

  * 标题：菜单管理
  * 描述：维护平台菜单结构与权限映射，保证导航一致性。
* `PrimaryActions`

  * `Btn/NewMenu`（+ 新建菜单）
  * `Btn/Import`（可选）
  * `Btn/Export`（可选）
  * `Btn/Inspection`（巡检/校验，可选）
* `KPIBar`

  * `KPI/TotalMenus`
  * `KPI/EnabledMenus`
  * `KPI/HiddenMenus`
  * `KPI/UnboundPermission`（高危）
  * 交互：点击 KPI → 下发过滤条件到树表（左侧）

---

## 2. 主体布局 Frame：`MenuMgmt/Body`

两列布局：

* 左：`MenuMgmt/TreePane`（树表管理区）
* 右：`MenuMgmt/DetailPane`（详情区）

---

## 3. 左侧树表 Frame：`MenuMgmt/TreePane`

### 3.1 顶部工具区：`TreePane/Toolbar`

* `SearchBox`

  * Placeholder：搜索菜单名称、编码或路由
  * 支持：name/code/path/permissionKey
* `FilterBar`

  * `Filter/Status`：全部 / 启用 / 禁用
  * `Filter/Visibility`：全部 / 显示 / 隐藏
  * `Filter/PermissionBind`：全部 / 已绑定 / 未绑定
  * `Filter/Type`：目录 / 页面 / 外链 / 按钮（按你们实际枚举）
  * `Filter/Group`：语义治理等（可选）
  * `Btn/ResetFilters`
* `TreeActions`

  * `Btn/ExpandAll`
  * `Btn/CollapseAll`
  * `Btn/ReorderMode`（排序模式开关：拖拽启用）

### 3.2 树表主体：`TreePane/TreeTable`

建议 TreeTable 列结构（可做可配置列）：

* `Col/Name`

  * `NodeIndent + ExpandToggle`
  * `NodeTitle`（菜单名称）
  * `NodeMeta`（小字：code 或 path，hover 展示全量）
* `Col/TypeTag`

  * Tag：目录/页面/外链/按钮
* `Col/StatusTags`

  * `Tag/Enabled|Disabled`
  * `Tag/Visible|Hidden`
  * `Tag/PermissionBound|Unbound`（Unbound 高亮）
* `Col/Order`

  * 数字展示；排序模式下支持拖拽手柄
* `Col/QuickActions`

  * `IconBtn/Edit`
  * `IconBtn/ToggleVisible`
  * `IconBtn/ToggleEnabled`
  * `MoreMenu`：复制、移动、删除、查看审计

#### Tree 行态（每行需要）

* `Row/Normal`
* `Row/Selected`
* `Row/Disabled`（enabled=false）
* `Row/Risk`（riskFlags 含 UNBOUND_PERMISSION / ROUTE_CONFLICT / ORDER_CONFLICT）
* `Row/Dragging`（排序模式）

### 3.3 左侧空/异常态：`TreePane/States`

* `State/Empty`：无菜单或无匹配结果
* `State/Loading`：骨架屏
* `State/Error`：重试按钮

---

## 4. 右侧详情 Frame：`MenuMgmt/DetailPane`

右侧建议采用“**详情只读** + **编辑抽屉/弹窗**”二选一。你们现状是右侧详情卡片 + 顶部按钮编辑/隐藏/删除，因此按此延续。

### 4.1 顶部标题区：`DetailPane/Header`

* `DetailTitle`

  * 菜单名称
  * Secondary：`path`
* `DetailActions`

  * `Btn/Edit`
  * `Btn/Hide`（或 Toggle Visible）
  * `Btn/Delete`

### 4.2 内容区：`DetailPane/Content`

采用分组卡片：

#### A. `Card/BasicInfo`

* `Field/MenuType`
* `Field/MenuGroup`
* `Field/Order`
* `Field/MenuCode`
* `Field/ParentMenu`
* `Field/Enabled`
* `Field/Visible`

#### B. `Card/Routing`

* `Field/RoutePath`
* `Field/RouteName`（若有）
* `Field/ComponentKey`（若有）
* `Field/OpenMode`（外链时显示：新开/内嵌/同窗）
* `InlineValidationHint`

  * 路由冲突提示（若有 riskFlags）

#### C. `Card/Permission`

* `Field/PermissionKey`
* `BindStatusBadge`（已绑定/未绑定）
* `Link/GoToPermission`（跳到权限管理或权限详情，可选）
* `ImpactSummary`（可选：被多少角色引用）

#### D. `Card/Maintenance`

* `Field/UpdatedBy`
* `Field/UpdatedAt`
* `Link/AuditLog`（打开审计弹窗/抽屉）

### 4.3 右侧状态

* `State/Placeholder`：未选择菜单时提示“请选择左侧菜单查看详情”
* `State/Loading`：骨架
* `State/Error`

---

## 5. 新建/编辑弹窗 Frame：`[Modal] MenuMgmt/MenuFormModal`

> 同一套组件复用：New / Edit / Copy 三种模式。
> 弹窗建议两列表单（你们现状）+ 类型联动显示。

### 5.1 弹窗结构

* `ModalHeader`

  * Title：新建菜单 / 编辑菜单
  * Subtitle：配置菜单信息、权限标识与展示规则。
  * CloseIcon
* `ModalBody`（表单区）
* `ModalFooter`

  * `Btn/Cancel`
  * `Btn/Save`（主按钮）
  * `Btn/SaveAndAddAnother`（可选，仅新建）

### 5.2 表单分区（组件级拆分）

#### Section 1：`FormSection/Identity`

* `Input/MenuName`（必填）
* `Input/MenuCode`（必填，支持自动生成建议）
* `Select/MenuType`（必填）

  * 触发联动：决定下方展示字段
* `Select/MenuGroup`（若保留分组）
* `Select/ParentMenu`（父级菜单）

  * 规则：若分组存在，父级下拉只展示同分组

#### Section 2：`FormSection/Routing`

* **当 type=页面/目录**

  * `Input/RoutePath`（必填或目录可选）
  * `Input/RouteName`（可选）
  * `Select/ComponentKey`（页面必填，若你们需要）
* **当 type=外链**

  * `Input/ExternalUrl`（必填）
  * `Select/OpenMode`（新开/内嵌/同窗）
* `Input/Order`（数字，默认自动填末尾）

#### Section 3：`FormSection/Permission`

* `PermissionBindMode`

  * `Radio/SelectExisting`（默认）
  * `Radio/CreateNew`（可选）
* `Select/PermissionKey`（选择绑定，支持搜索）

  * 显示：权限名称 + key
* `Input/PermissionKey`（创建新时输入）
* `InlineHint`

  * 未绑定风险提示 / 重名提示

#### Section 4：`FormSection/DisplayControl`

* `Select/Visibility`（显示/隐藏）
* `Select/Availability`（启用/禁用）
* `Switch/ShowInNav`（若有区分导航展示）
* `Switch/Cacheable`（可选：前端 keepAlive 等）

#### Section 5：`FormSection/ValidationSummary`

* `Alert/List`

  * 路由冲突
  * code 冲突
  * permissionKey 冲突
  * 顺序冲突（同级重复）

---

## 6. 辅助弹窗/抽屉 Frames（建议补齐）

### 6.1 `[Modal] Confirm/DeleteMenu`

* 文案：删除将影响子菜单数量、权限引用数量（如果你们做）
* Actions：取消 / 确认删除

### 6.2 `[Drawer or Modal] AuditLog`

* `AuditFilter`：时间/操作者/字段
* `AuditList`：字段 diff（old → new）
* `Pagination`

### 6.3 `[Modal] MoveMenu`（如果不做拖拽）

* 选择目标父级 + 同级位置（插入到第 N 位）

---

## 7. 组件拆分清单（前端工程可直接用）

* `MenuMgmtPage`
* `MenuMgmtHeader`

  * `KPIBar`, `PrimaryActions`
* `MenuTreePane`

  * `TreeToolbar`（Search + Filters + TreeActions）
  * `MenuTreeTable`
  * `TreeRow`（NameCell/TagsCell/ActionsCell）
* `MenuDetailPane`

  * `DetailHeader`
  * `BasicInfoCard`
  * `RoutingCard`
  * `PermissionCard`
  * `MaintenanceCard`
* `MenuFormModal`

  * `IdentitySection`
  * `RoutingSection`
  * `PermissionSection`
  * `DisplayControlSection`
  * `ValidationSummarySection`
* `ConfirmDeleteModal`
* `AuditLogDrawer/Modal`

---
