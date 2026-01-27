# 组织架构管理 - Data Model

> **Feature**: 组织架构管理
> **Created**: 2025-01-25

---

## Entity Relationships

```
┌─────────────────────┐
│  sys_organization   │
│  ────────────────   │
│  id (PK)            │◄──────────┐
│  parent_id          │           │
│  name               │           │ 1
│  ancestors          │           │
│  ...                │           │
└─────────────────────┘           │
                                  │
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
         │ N                                              │ N
         │                                                 │
┌─────────────────────┐                         ┌─────────────────────┐
│   sys_user_dept     │                         │  sys_organization   │
│  ────────────────   │                         │   (parent)          │
│  id (PK)            │                         └─────────────────────┘
│  user_id            │
│  dept_id            │◄──────────┐
│  is_primary         │           │
│  ...                │           │ N
└─────────────────────┘           │
                                  │
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
         │ 1                                               │ 1
         │                                                 │
┌─────────────────────┐                         ┌─────────────────────┐
│     sys_user        │                         │  sys_organization   │
│  ────────────────   │                         │   (child)           │
│  id (PK)            │                         └─────────────────────┘
│  name               │
│  ...                │
└─────────────────────┘
```

---

## Tables

### 1. sys_organization (组织表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | CHAR(36) | PK | UUID v7 |
| parent_id | CHAR(36) | NOT NULL | 父部门ID，根节点为"0" |
| name | VARCHAR(100) | NOT NULL | 部门名称 |
| code | VARCHAR(50) | UNIQUE | 部门编码 |
| ancestors | VARCHAR(500) | NOT NULL | 祖先路径: "0,101,105" |
| sort_order | INT | NOT NULL, DEFAULT 0 | 同级排序 |
| leader_id | CHAR(36) | NULL | 部门负责人ID |
| type | TINYINT | NOT NULL, DEFAULT 2 | 1=公司/租户根, 2=部门/科室 |
| status | TINYINT | NOT NULL, DEFAULT 1 | 1=启用, 0=停用 |
| description | VARCHAR(255) | NULL | 备注 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted_at | DATETIME(3) | NULL | 删除时间（逻辑删除，GORM软删除需要毫秒精度） |

**索引**:
- PRIMARY KEY (id)
- INDEX idx_parent_id (parent_id)
- INDEX idx_code (code)
- INDEX idx_status (status)
- INDEX idx_ancestors (ancestors(255))
- INDEX idx_deleted_at (deleted_at)

**业务规则**:
- BR-01: ancestors 存储从根到父节点的完整路径
- BR-02: type=1 的根节点不允许删除
- BR-04: 支持无限层级

### 2. sys_user_dept (用户部门关联表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | CHAR(36) | PK | UUID v7 |
| user_id | CHAR(36) | NOT NULL | 用户ID |
| dept_id | CHAR(36) | NOT NULL | 部门ID |
| is_primary | TINYINT | NOT NULL, DEFAULT 0 | 1=主部门, 0=辅助部门 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE KEY uk_user_primary (user_id, is_primary)
- INDEX idx_user_id (user_id)
- INDEX idx_dept_id (dept_id)

**业务规则**:
- BR-09: 一个用户只能有一条 is_primary=1 的记录
- BR-10: 用户可兼任多个辅助部门

### 3. sys_organization_audit (操作审计表)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | CHAR(36) | PK | UUID v7 |
| org_id | CHAR(36) | NOT NULL | 部门ID |
| operation | VARCHAR(20) | NOT NULL | create/delete/move |
| operator_id | CHAR(36) | NOT NULL | 操作人ID |
| old_value | JSON | NULL | 变更前值 |
| new_value | JSON | NULL | 变更后值 |
| created_at | DATETIME | NOT NULL | 操作时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX idx_org_id (org_id)
- INDEX idx_operation (operation)
- INDEX idx_created_at (created_at)

**业务规则**:
- BR-11: 仅记录关键操作

---

## State Transitions

### 组织状态机

```
┌─────────┐
│  启用   │
│ (1)    │
└────┬────┘
     │
     │ 停用
     ▼
┌─────────┐
│  停用   │
│ (0)    │
└─────────┘
```

**转换规则**:
- 启用 → 停用: 需检查无启用状态的子节点 (AC-16)
- 停用 → 启用: 无限制

---

## Validation Rules

### sys_organization

| 字段 | 规则 | 错误码 |
|------|------|--------|
| name | 必填, 1-100字符 | 200101 |
| name | 同级唯一 | 200103 |
| parent_id | 必须存在 | 200102 |
| parent_id | 不能是自身或子孙节点 | 200106 |
| code | 全局唯一 | 200103 |
| type | 1 或 2 | 200101 |
| status | 0 或 1 | 200101 |

### sys_user_dept

| 字段 | 规则 | 错误码 |
|------|------|--------|
| user_id | 必须存在 | - |
| dept_id | 必须存在且启用 | 200110 |
| is_primary | 每个用户只能有一条 | - |
| (user_id, dept_id) | 辅助部门不重复 | 200111 |

---

## Data Migration Notes

### 初始化根节点

```sql
INSERT INTO sys_organization (id, parent_id, name, ancestors, type, status)
VALUES ('01944f4e-7c6a-7000-8000-000000000001', '0', '集团总部', '0', 1, 1);
```

### 用户现有主部门迁移

```sql
-- 假设用户表已有 dept_id 字段
INSERT INTO sys_user_dept (id, user_id, dept_id, is_primary)
SELECT UUID(), id, dept_id, 1 FROM sys_user WHERE dept_id IS NOT NULL;
```
