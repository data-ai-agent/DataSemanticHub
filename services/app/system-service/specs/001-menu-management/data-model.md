# 菜单管理数据模型

> **创建日期**: 2025-01-25

---

## 实体概览

| 实体 | 说明 | 主键 |
|------|------|------|
| Menu | 菜单实体 | id (UUID v7) |
| MenuAuditLog | 菜单审计日志 | id (UUID v7) |

---

## Menu 实体

### 字段定义

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | CHAR(36) | PK, NOT NULL | UUID v7，主键 |
| name | VARCHAR(128) | NOT NULL | 菜单名称，1-128 字符 |
| code | VARCHAR(128) | NOT NULL, UNIQUE | 菜单编码，全局唯一（与 deleted_at 联合唯一） |
| type | VARCHAR(20) | NOT NULL | 类型：directory/page/external/button |
| group_id | VARCHAR(36) | NULL | 菜单分组ID，可选 |
| parent_id | VARCHAR(36) | NULL, INDEX | 父菜单ID，根节点为空 |
| path | VARCHAR(255) | NULL, INDEX | 路由路径，page/directory 使用 |
| route_name | VARCHAR(128) | NULL, INDEX | 路由名称 |
| component_key | VARCHAR(128) | NULL | 页面组件标识 |
| external_url | VARCHAR(512) | NULL | 外部链接，external 类型必填 |
| open_mode | VARCHAR(20) | NULL | 打开方式：new/iframe/same，external 类型必填 |
| permission_key | VARCHAR(128) | NULL, INDEX | 权限标识，可选 |
| visible | TINYINT(1) | NOT NULL, DEFAULT 1, INDEX | 是否可见 |
| enabled | TINYINT(1) | NOT NULL, DEFAULT 1, INDEX | 是否启用 |
| order | INT | NOT NULL, DEFAULT 0 | 同级排序，同级唯一 |
| show_in_nav | TINYINT(1) | NOT NULL, DEFAULT 1 | 是否在导航中显示 |
| cacheable | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否可缓存（前端 keepAlive） |
| created_at | DATETIME(3) | NOT NULL | 创建时间，毫秒精度 |
| created_by | VARCHAR(36) | NULL | 创建人ID |
| updated_at | DATETIME(3) | NOT NULL | 更新时间，毫秒精度 |
| updated_by | VARCHAR(36) | NULL | 更新人ID |
| deleted_at | DATETIME(3) | NULL, INDEX | 删除时间，软删除 |

### 索引

| 索引名 | 类型 | 字段 | 说明 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键 |
| uk_code_deleted | UNIQUE | code, deleted_at | 编码唯一（软删除支持） |
| idx_parent_id | INDEX | parent_id | 父节点查询 |
| idx_type | INDEX | type | 类型筛选 |
| idx_enabled | INDEX | enabled | 启用状态筛选 |
| idx_visible | INDEX | visible | 可见状态筛选 |
| idx_permission_key | INDEX | permission_key | 权限查询 |
| idx_group_id | INDEX | group_id | 分组查询 |
| idx_path | INDEX | path | 路径查询（冲突检测） |
| idx_route_name | INDEX | route_name | 路由名称查询（冲突检测） |

### 业务规则

| 规则ID | 规则 | 实现方式 |
|--------|------|----------|
| BR-01 | code 全局唯一 | 唯一索引 `uk_code_deleted` |
| BR-02 | path / route_name 唯一或可冲突检测 | 通过索引查询，Logic 层检测 |
| BR-03 | 同级 order 唯一 | Logic 层校验，Model 层不强制 |
| BR-04 | 禁止父子循环 | Logic 层通过 `CheckCycle` 方法检测 |
| BR-05 | 分组约束 | Logic 层校验，父子必须同 group_id |
| BR-06 | 类型相关必填 | Logic 层校验：directory 需 name/code/type；page 加 path；external 加 external_url/open_mode；button 需 name/code/type |
| BR-07 | 权限可选 | permission_key 可为 NULL，巡检接口检测未绑定 |

### 状态字段

| 字段 | 值 | 说明 |
|------|-----|------|
| type | directory | 目录类型 |
| type | page | 页面类型 |
| type | external | 外部链接类型 |
| type | button | 按钮类型 |
| enabled | true | 启用 |
| enabled | false | 禁用 |
| visible | true | 可见 |
| visible | false | 隐藏 |
| open_mode | new | 新窗口打开 |
| open_mode | iframe | iframe 内打开 |
| open_mode | same | 当前窗口打开 |

### 关系

- **父子关系**: 通过 `parent_id` 自关联，支持多级树形结构
- **分组关系**: 通过 `group_id` 关联菜单分组（如存在）
- **权限关系**: 通过 `permission_key` 关联权限系统（外部）

---

## MenuAuditLog 实体

### 字段定义

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | CHAR(36) | PK, NOT NULL | UUID v7，主键 |
| menu_id | VARCHAR(36) | NOT NULL, INDEX | 菜单ID |
| operation_type | VARCHAR(20) | NOT NULL, INDEX | 操作类型 |
| operator_id | VARCHAR(36) | NULL, INDEX | 操作人ID |
| operator_name | VARCHAR(128) | NULL | 操作人名称 |
| changed_fields | JSON | NULL | 变更字段（JSON 数组） |
| old_value | JSON | NULL | 旧值（JSON 对象） |
| new_value | JSON | NULL | 新值（JSON 对象） |
| remark | VARCHAR(512) | NULL | 备注 |
| created_at | DATETIME(3) | NOT NULL, INDEX | 创建时间，毫秒精度 |

### 索引

| 索引名 | 类型 | 字段 | 说明 |
|--------|------|------|------|
| PRIMARY | PRIMARY KEY | id | 主键 |
| idx_menu_id | INDEX | menu_id | 菜单查询 |
| idx_operation_type | INDEX | operation_type | 操作类型筛选 |
| idx_operator_id | INDEX | operator_id | 操作人筛选 |
| idx_created_at | INDEX | created_at | 时间范围查询 |

### 操作类型

| 值 | 说明 |
|----|------|
| create | 创建菜单 |
| update | 更新菜单 |
| delete | 删除菜单 |
| move | 移动菜单 |
| reorder | 排序菜单 |
| enable | 启用菜单 |
| disable | 禁用菜单 |
| show | 显示菜单 |
| hide | 隐藏菜单 |

### 关系

- **菜单关系**: 通过 `menu_id` 关联 Menu 实体（逻辑关联，无物理外键）

---

## 数据验证规则

### Menu 验证

| 字段 | 验证规则 | 错误码 |
|------|----------|--------|
| name | 必填，1-128 字符 | 200130 |
| code | 必填，1-128 字符，全局唯一 | 200131 |
| type | 必填，枚举值 | 200132 |
| path | 类型为 page/directory 时必填 | 200133 |
| external_url | 类型为 external 时必填 | 200134 |
| open_mode | 类型为 external 时必填 | 200135 |
| parent_id | 不能形成循环 | 200136 |
| order | 同级唯一 | 200137 |

### 业务验证

| 场景 | 验证规则 | 错误码 |
|------|----------|--------|
| 删除含子节点 | 默认拒绝，需级联参数 | 200138 |
| 移动形成循环 | 拒绝移动 | 200139 |
| 分组约束 | 父子必须同组 | 200140 |
| 路由冲突 | path/route_name 冲突检测 | 200141 |

---

## 查询模式

### 菜单树查询

```sql
-- 递归查询所有菜单（CTE）
WITH RECURSIVE menu_tree AS (
    SELECT * FROM menus WHERE parent_id IS NULL AND deleted_at IS NULL
    UNION ALL
    SELECT m.* FROM menus m
    INNER JOIN menu_tree mt ON m.parent_id = mt.id
    WHERE m.deleted_at IS NULL
)
SELECT * FROM menu_tree ORDER BY order;
```

### 子菜单查询

```sql
SELECT * FROM menus 
WHERE parent_id = ? AND deleted_at IS NULL 
ORDER BY `order` ASC;
```

### 搜索过滤

```sql
SELECT * FROM menus 
WHERE deleted_at IS NULL
  AND (name LIKE ? OR code LIKE ? OR path LIKE ? OR permission_key LIKE ?)
  AND (? IS NULL OR type = ?)
  AND (? IS NULL OR enabled = ?)
  AND (? IS NULL OR visible = ?)
  AND (? IS NULL OR group_id = ?)
ORDER BY `order` ASC;
```

---

## 数据迁移

### 初始数据

菜单表初始为空，需通过 API 创建。

### 迁移脚本

位置：`migrations/system/menus.sql`, `migrations/system/menu_audit_logs.sql`

---

## 性能考虑

1. **树形查询**: 使用 CTE 或应用层递归，考虑缓存
2. **搜索**: 使用全文索引或 Elasticsearch（如需要）
3. **排序**: 同级 order 字段索引优化
4. **审计日志**: 定期归档或分区表（如数据量大）
