# 菜单管理快速开始

> **创建日期**: 2025-01-25  
> **更新日期**: 2025-01-25  
> **状态**: ✅ 已实现

---

## 概述

本文档提供菜单管理模块的快速开始指南。菜单管理功能已完整实现，包括菜单树查询、CRUD、排序移动、权限绑定、审计日志和 KPI 统计等功能。

---

## 前置条件

- Go 1.24+
- Go-Zero v1.9+
- MySQL 8.0
- Redis 7.0（可选，用于缓存）
- goctl 工具（用于代码生成）

---

## 实现状态

✅ **已完成**:
- API 定义和代码生成
- 数据库迁移脚本
- Model 层实现
- Logic 层实现
- Handler 层实现
- 错误码定义
- 前端 API 集成

⏳ **待完成**:
- 单元测试（部分完成）
- 集成测试
- 性能测试

---

## 步骤 1: 数据库迁移 ✅

执行 DDL 脚本创建表结构：

```bash
# 在 MySQL 中执行
mysql -u root -p < migrations/system/menus.sql
mysql -u root -p < migrations/system/menu_audit_logs.sql
```

或使用迁移工具（如 golang-migrate）：

```bash
migrate -path migrations/system -database "mysql://user:pass@tcp(localhost:3306)/dbname" up
```

**表结构**:
- `menus` - 菜单主表（支持树形结构）
- `menu_audit_logs` - 菜单审计日志表

---

## 步骤 2: 配置检查 ✅

确保 `api/etc/api.yaml` 中数据库配置正确：

```yaml
DB:
  Default:
    Host: localhost
    Port: 3306
    Database: your_database
    Username: your_username
    Password: your_password
    Charset: utf8mb4
```

---

## 步骤 3: 启动服务

启动 API 服务：

```bash
cd /path/to/system-service
go run api/api.go -f api/etc/api.yaml
```

服务默认监听端口可在 `api/etc/api.yaml` 中配置。

---

## API 端点

所有菜单管理 API 的前缀为：`/api/v1/system`

### 菜单树查询
```bash
GET /api/v1/system/menus/tree
```

**查询参数**:
- `type` (可选): 过滤菜单类型 (`directory`, `page`, `button`, `external`)
- `enabled` (可选): 过滤启用状态 (`true`, `false`)
- `visible` (可选): 过滤显示状态 (`true`, `false`)

**示例**:
```bash
curl "http://localhost:8888/api/v1/system/menus/tree?type=directory&enabled=true"
```

### 菜单详情
```bash
GET /api/v1/system/menus/:id
```

### 创建菜单
```bash
POST /api/v1/system/menus
Content-Type: application/json

{
  "name": "系统管理",
  "code": "system",
  "type": "directory",
  "parent_id": "",
  "path": "/system",
  "icon": "system",
  "order": 1,
  "enabled": true,
  "visible": true
}
```

### 更新菜单
```bash
PUT /api/v1/system/menus/:id
Content-Type: application/json

{
  "name": "系统管理（更新）",
  "icon": "system-updated"
}
```

### 删除菜单
```bash
DELETE /api/v1/system/menus/:id
```

### 启用/禁用菜单
```bash
PATCH /api/v1/system/menus/:id/enabled
Content-Type: application/json

{
  "enabled": false
}
```

### 显示/隐藏菜单
```bash
PATCH /api/v1/system/menus/:id/visible
Content-Type: application/json

{
  "visible": false
}
```

### 移动菜单
```bash
PATCH /api/v1/system/menus/:id/move
Content-Type: application/json

{
  "target_parent_id": "new-parent-id",
  "position": "first"  // first, last, before, after
}
```

### 批量排序
```bash
PATCH /api/v1/system/menus/reorder
Content-Type: application/json

{
  "items": [
    {"id": "menu-id-1", "order": 1},
    {"id": "menu-id-2", "order": 2}
  ]
}
```

### 绑定权限
```bash
POST /api/v1/system/menus/:id/bind-permission
Content-Type: application/json

{
  "permission_id": "permission-id",
  "create_permission": false
}
```

### 风险巡检
```bash
GET /api/v1/system/menus/inspection
```

### KPI 统计
```bash
GET /api/v1/system/menus/stats
```

### 审计日志查询
```bash
GET /api/v1/system/menus/:id/audits?page=1&page_size=20
```

**查询参数**:
- `page`: 页码（默认 1）
- `page_size`: 每页数量（默认 20）
- `operation` (可选): 操作类型过滤
- `operator_id` (可选): 操作人 ID 过滤

---

## 错误码

菜单管理错误码范围: `200130-200150`

| 错误码 | 说明 |
|--------|------|
| 200130 | 菜单名称必填 |
| 200131 | 菜单编码已存在 |
| 200132 | 菜单类型无效 |
| 200133 | 路由路径必填（page/directory类型） |
| 200134 | 外部链接必填（external类型） |
| 200135 | 打开方式必填（external类型） |
| 200136 | 父子关系形成循环 |
| 200137 | 同级排序值冲突 |
| 200138 | 菜单存在子节点，不能删除 |
| 200139 | 移动菜单导致循环 |
| 200140 | 分组约束不满足（父子必须同组） |
| 200141 | 路由冲突（path/route_name已存在） |
| 200142 | 权限绑定失败 |
| 200143 | 菜单不存在 |
| 200144 | 父菜单不存在 |
| 200145 | 菜单已禁用，不能操作 |
| 200146 | 批量操作部分失败 |
| 200147 | 排序值超出范围 |
| 200148 | 移动位置无效 |
| 200149 | 权限不存在 |
| 200150 | 审计日志查询失败 |

---

## 前端集成 ✅

前端已集成菜单管理 API，相关文件：

- `frontend/src/services/menuService.ts` - API 客户端
- `frontend/src/config/api.ts` - API 端点配置
- `frontend/src/views/MenuManagementView.tsx` - 菜单管理界面

**前端 API 方法**:
- `getMenuTree()` - 获取菜单树
- `getMenu(id)` - 获取菜单详情
- `createMenu(data)` - 创建菜单
- `updateMenu(id, data)` - 更新菜单
- `deleteMenu(id)` - 删除菜单
- `toggleMenuEnabled(id, enabled)` - 切换启用状态
- `toggleMenuVisible(id, visible)` - 切换显示状态
- `moveMenu(id, targetParentId, position)` - 移动菜单
- `reorderMenus(items)` - 批量排序
- `bindPermission(id, permissionId)` - 绑定权限
- `getMenuAudits(id, params)` - 获取审计日志
- `getMenuInspection()` - 获取风险巡检
- `getMenuStats()` - 获取 KPI 统计

---

## 测试

### 单元测试

运行 Logic 层单元测试：

```bash
go test -cover ./api/internal/logic/menu_management/...
```

### 集成测试

使用 curl 或 Postman 测试完整流程：

```bash
# 1. 创建根菜单
curl -X POST http://localhost:8888/api/v1/system/menus \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "系统管理",
    "code": "system",
    "type": "directory",
    "path": "/system",
    "order": 1
  }'

# 2. 查询菜单树
curl "http://localhost:8888/api/v1/system/menus/tree" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. 获取菜单详情（使用上一步返回的菜单 ID）
curl "http://localhost:8888/api/v1/system/menus/MENU_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. 更新菜单
curl -X PUT "http://localhost:8888/api/v1/system/menus/MENU_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "系统管理（更新）"
  }'
```

---

## 代码结构

```
api/
├── doc/
│   └── system/
│       └── menu_management.api          # API 定义
├── internal/
│   ├── handler/
│   │   └── menu_management/              # Handler 层 ✅
│   ├── logic/
│   │   └── menu_management/              # Logic 层 ✅
│   ├── types/
│   │   └── menu_management.go            # 类型定义 ✅
│   ├── errorx/
│   │   └── codes.go                      # 错误码 ✅
│   └── svc/
│       └── service_context.go            # ServiceContext ✅
model/
└── system/
    ├── menus/                            # 菜单 Model ✅
    └── menu_audit_logs/                  # 审计日志 Model ✅
migrations/
└── system/
    ├── menus.sql                         # 菜单表 DDL ✅
    └── menu_audit_logs.sql               # 审计日志表 DDL ✅
frontend/
└── src/
    ├── services/
    │   └── menuService.ts                # 前端 API 客户端 ✅
    └── config/
        └── api.ts                        # API 配置 ✅
```

---

## 常见问题

### Q: 数据库连接失败？
A: 检查 `api/etc/api.yaml` 中的数据库配置，确保 MySQL 服务正在运行。

### Q: 权限绑定失败？
A: 确认权限服务是否可用，或使用 `create_permission=true` 创建新权限。

### Q: 菜单树查询为空？
A: 检查数据库中是否有菜单数据，或先创建一些菜单。

### Q: 前端调用 API 失败？
A: 检查：
1. 后端服务是否正常运行
2. API 端点配置是否正确（`frontend/src/config/api.ts`）
3. 请求头是否包含正确的认证 Token
4. CORS 配置是否正确

### Q: 如何查看审计日志？
A: 使用 `GET /api/v1/system/menus/:id/audits` 接口，或在前端菜单管理界面查看。

---

## 下一步

- ✅ 查看 [plan.md](./plan.md) 了解详细技术方案
- ✅ 查看 [data-model.md](./data-model.md) 了解数据模型
- ✅ 查看 [research.md](./research.md) 了解技术选型
- ⏳ 完成单元测试（目标覆盖率 > 80%）
- ⏳ 运行集成测试验证所有接口
- ⏳ 性能测试（菜单树查询性能优化）

---

## 参考

- [项目宪章](../../.specify/memory/constitution.md)
- [Go-Zero 文档](https://go-zero.dev/)
- [GORM 文档](https://gorm.io/)
- [任务清单](./tasks.md) - 查看完整任务列表和进度
