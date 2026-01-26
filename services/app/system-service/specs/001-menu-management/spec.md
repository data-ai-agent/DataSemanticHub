# Menu Management Specification

> **Branch**: `001-menu-management`  
> **Spec Path**: `specs/001-menu-management/`  
> **Created**: 2025-01-25  

> **Status**: Draft

---

## Overview

Platform menu management maintains the menu tree used for navigation and permission mapping. Users can browse, search, and filter menus; create, edit, copy, and delete items; control visibility and enabled state; reorder and move nodes; bind permissions; and view audit logs plus risk hints and KPI statistics.

---

## User Stories

### Story 1: Menu Tree Browsing and Search (P1)

AS a platform or permission administrator  
I WANT to view the menu tree and search or filter by name, code, path, permission, type, enabled/visible state, and group  
SO THAT I can quickly locate menus and manage the hierarchy.

**独立测试**: Tree returns with correct parent-child structure; search and filters narrow results; matching nodes and their ancestors are present for expandable display.

### Story 2: Menu Detail and Audit Summary (P1)

AS a platform or permission administrator  
I WANT to open a menu's full details plus recent audit summary and permission-binding status  
SO THAT I can inspect configuration and troubleshoot.

**独立测试**: Detail view shows all menu attributes, last operator/time, permission binding, and risk markers when relevant.

### Story 3: Create, Edit, and Delete Menus (P1)

AS a platform or permission administrator  
I WANT to create, edit, and delete menu items with type-specific validation (directory, page, external, button)  
SO THAT the menu tree stays consistent and valid.

**独立测试**: Create accepts valid data and enforces required fields by type; edit applies changes and revalidates when type changes; delete respects rules (e.g. no delete when children exist unless explicitly allowed).

### Story 4: Enable/Disable and Show/Hide (P1)

AS a platform or permission administrator  
I WANT to toggle enabled state and visibility of menus independently  
SO THAT I can control availability and display without deleting items.

**独立测试**: Single-item toggles (and optional batch) update state correctly; enable/disable and show/hide do not affect each other.

### Story 5: Reorder and Move Menus (P2)

AS a platform or permission administrator  
I WANT to change sibling order and move a menu to a new parent and position  
SO THAT I can reorganize the tree without creating duplicates.

**独立测试**: Order is unique per sibling and stable; moving prevents cycles and keeps parent-child in the same group when groups apply.

### Story 6: Permission Binding (P2)

AS a permission administrator  
I WANT to bind an existing permission to a menu or create a new permission and bind it  
SO THAT access control aligns with the menu structure.

**独立测试**: Menus can be bound to existing or newly created permissions; unbound menus are clearly marked for risk.

### Story 7: Audit Log and Inspection (P2)

AS a platform or permission administrator  
I WANT to query menu operation logs (create, edit, delete, move, reorder, enable/hide) with filters (time, operator, field) and optionally run a full risk inspection  
SO THAT I can audit changes and detect misconfigurations.

**独立测试**: Audit list is filterable and paginated; inspection returns risks such as unbound permission, route conflict, order conflict.

### Story 8: KPI Statistics (P2)

AS a platform or permission administrator  
I WANT to see headline stats: total menus, enabled count, hidden count, and unbound-permission (high-risk) count  
SO THAT I can monitor menu health at a glance.

**独立测试**: KPI endpoints return correct counts for the current menu set.

---

## Acceptance Criteria (EARS)

### 正常流程

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-01 | 菜单树查询成功 | WHEN 用户请求菜单树并可选提供关键词与过滤条件 | THE SYSTEM SHALL 返回树形结构（含层级、排序、风险标记），匹配节点及其必要祖先可展示 |
| AC-02 | 菜单详情查询成功 | WHEN 用户查询存在的菜单 ID | THE SYSTEM SHALL 返回完整详情、审计摘要、权限绑定状态与风险标记 |
| AC-03 | 新建菜单成功 | WHEN 用户提交有效数据且按类型满足必填与校验 | THE SYSTEM SHALL 持久化并确认创建成功 |
| AC-04 | 更新菜单成功 | WHEN 用户更新有效数据；若类型变更则重新校验 | THE SYSTEM SHALL 持久化并确认更新成功 |
| AC-05 | 删除菜单成功 | WHEN 用户删除存在且允许删除的菜单（如无子节点或显式允许级联） | THE SYSTEM SHALL 删除（或软删除）并确认成功；删除前可返回影响面（子节点数、权限使用情况等） |
| AC-06 | 启用/禁用切换成功 | WHEN 用户切换单条（或批量）启用状态 | THE SYSTEM SHALL 更新状态并确认 |
| AC-07 | 显示/隐藏切换成功 | WHEN 用户切换单条（或批量）可见状态 | THE SYSTEM SHALL 更新状态并确认 |
| AC-08 | 排序/移动成功 | WHEN 用户调整同级顺序或指定新父级与位置 | THE SYSTEM SHALL 更新树结构，保证同级顺序唯一且稳定、无循环、同组约束满足 |
| AC-09 | 权限绑定成功 | WHEN 用户选择已有权限或创建新权限并绑定菜单 | THE SYSTEM SHALL 完成绑定并更新菜单 |
| AC-10 | 审计日志查询成功 | WHEN 用户按时间、操作者、字段等筛选查询 | THE SYSTEM SHALL 返回分页的审计记录 |
| AC-11 | 巡检/风险查询成功 | WHEN 用户请求全量风险巡检 | THE SYSTEM SHALL 返回未绑定权限、路由冲突、顺序冲突等风险列表 |
| AC-12 | KPI 统计查询成功 | WHEN 用户请求菜单统计 | THE SYSTEM SHALL 返回总菜单数、启用数、隐藏数、未绑定权限数 |

### 异常处理

| ID | Scenario | Trigger | Expected Behavior |
|----|----------|---------|-------------------|
| AC-20 | 参数校验失败 | WHEN 必填为空、格式错误或枚举非法 | THE SYSTEM SHALL 返回 400 |
| AC-21 | 菜单不存在 | WHEN 查询或操作不存在的菜单 ID | THE SYSTEM SHALL 返回 404 |
| AC-22 | 唯一性冲突 | WHEN code、path/route_name 或同级 order 与已有数据冲突 | THE SYSTEM SHALL 返回 409 |
| AC-23 | 业务规则不满足 | WHEN 删除含子节点且未允许级联、或移动造成循环等 | THE SYSTEM SHALL 返回 422 |
| AC-24 | 权限不足 | WHEN 用户无相应操作权限 | THE SYSTEM SHALL 返回 403 |

---

## Edge Cases

| ID | Case | Expected Behavior |
|----|------|-------------------|
| EC-01 | 并发创建相同 code | 仅一个成功，其余返回 409 |
| EC-02 | 删除含子节点且未允许级联 | 拒绝删除，返回 422，并提示子节点数量等影响面 |
| EC-03 | 移动导致父子循环 | 拒绝移动，返回 422 |
| EC-04 | 排序并发冲突 | 保证顺序唯一且一致，冲突时可拒绝或重试 |
| EC-05 | 复制菜单（含可选子树） | 复制基础属性（不含 ID）；若支持子树复制则行为可配置，默认仅单节点 |

---

## Business Rules

| ID | Rule | Description |
|----|------|-------------|
| BR-01 | code 全局唯一 | 菜单编码在系统内不可重复 |
| BR-02 | path / route_name 唯一或可冲突检测 | 建议全局唯一；若不唯一，需返回冲突信息 |
| BR-03 | 同级 order 唯一 | 同一父节点下排序值不重复 |
| BR-04 | 禁止父子循环 | 父节点不能为自身或任意子孙节点 |
| BR-05 | 分组约束 | 若启用分组，父子须同属一组 |
| BR-06 | 类型相关必填 | directory: name, code, type；page: 加 path（及 component 等按需）；external: 加 external_url, open_mode；button: name, code, type |
| BR-07 | 权限可选 | permission 可不绑定，但产生未绑定权限风险标记 |

---

## Data Considerations

| Field | Description | Constraints |
|-------|-------------|-------------|
| 菜单标识 | 唯一标识 | 主键，不可重复 |
| 名称 | 菜单显示名称 | 必填，1–128 字符 |
| 编码 | 菜单编码 | 必填，1–128 字符，全局唯一 |
| 类型 | directory / page / external / button | 必填，决定必填与校验规则 |
| 父菜单 | 上级菜单 | 根为空；须满足无循环、同组等约束 |
| 路由路径 | 前端路由 | page/directory 使用；与 route_name 受唯一/冲突规则约束 |
| 外部链接与打开方式 | 外链地址与打开方式 | external 类型必填 |
| 权限标识 | 绑定权限 | 可选；未绑定时产生风险标记 |
| 启用 / 可见 | 是否启用、是否展示 | 必填，可独立切换 |
| 排序 | 同级展示顺序 | 必填，同级唯一 |
| 分组 | 菜单分组 | 可选；若使用则父子同组 |
| 审计信息 | 创建/更新人、时间 | 系统维护 |

审计日志需持久化：操作类型、操作者、时间、受影响菜单及字段等，支持按时间、操作者、字段筛选查询。

---

## Success Metrics

| ID | Metric | Target |
|----|--------|--------|
| SC-01 | 菜单树列表加载 | 用户在常见过滤条件下获得结果的时间可接受 |
| SC-02 | 搜索与筛选 | 用户能通过关键词与多维度过滤快速定位菜单 |
| SC-03 | 审计与巡检 | 支持按时间、操作者等筛选审计；巡检可覆盖全量风险类型 |

---

## Assumptions

- 角色与权限由系统统一管理；菜单管理沿用只读、管理、权限管理等角色划分。
- 权限绑定支持选择已有权限或创建新权限并与权限服务联动；未绑定时仅做风险标记，不阻塞菜单创建。
- 删除默认不允许级联；若支持级联，需显式参数且可返回影响面。
- 分组（group）实体与字典若已存在则沿用；否则仅作可选字段。
- 路由冲突判定：path / route_name 建议全局唯一；冲突时返回明确信息。
- KPI 统计针对当前菜单全集；按过滤条件动态统计为可选增强。

---

## Open Questions

- 权限系统接口：`permission_key` 是否必须预先存在？是否允许菜单管理侧创建新权限？
- `group_id` 对应实体与字典是否已定义？若否，是否在本能力范围内定义？
- 删除策略：是否允许级联删除？若允许，确认交互与影响面展示方式。
- 路由冲突规则：`path` 与 `route_name` 是否强制全局唯一？不唯一时的具体冲突判定与提示。
- KPI 是否需要支持按筛选条件（如按分组、类型）动态统计？

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-25 | - | 初始版本 |
