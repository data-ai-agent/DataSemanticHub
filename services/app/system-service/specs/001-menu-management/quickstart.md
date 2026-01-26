# 菜单管理快速开始

> **创建日期**: 2025-01-25

---

## 概述

本文档提供菜单管理模块的快速开始指南，包括环境准备、代码生成、数据库迁移和测试步骤。

---

## 前置条件

- Go 1.24+
- Go-Zero v1.9+
- MySQL 8.0
- Redis 7.0
- goctl 工具

---

## 步骤 1: 添加 API 定义到入口文件

在 `api/doc/api.api` 中添加菜单管理模块的导入：

```api
import "system/menu_management.api"
```

**注意**: 需要先创建 `api/doc/system/` 目录，并将 `contracts/menu_management.api` 复制到 `api/doc/system/menu_management.api`

```bash
mkdir -p api/doc/system
cp specs/001-menu-management/contracts/menu_management.api api/doc/system/menu_management.api
```

---

## 步骤 2: 生成 Handler 和 Types

使用 goctl 生成代码（针对整个项目）：

```bash
goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
```

**生成的文件**:
- `api/internal/handler/system/` - Handler 文件
- `api/internal/types/` - Types 文件

---

## 步骤 3: 创建数据库迁移

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

---

## 步骤 4: 实现 Model 层

创建 Model 接口和实现：

1. 创建 `model/system/menus/` 目录
2. 实现接口文件：`interface.go`, `types.go`, `vars.go`, `factory.go`, `gorm_dao.go`, `sqlx_model.go`
3. 创建 `model/system/menu_audit_logs/` 目录并实现相同结构

参考 `model/user/users/` 的实现模式。

---

## 步骤 5: 更新 ServiceContext

在 `api/internal/svc/service_context.go` 中添加菜单 Model：

```go
type ServiceContext struct {
    Config      config.Config
    MenuModel   menus.Model
    MenuAuditLogModel menu_audit_logs.Model
    // ... 其他 Model
}
```

在 `NewServiceContext` 中初始化：

```go
func NewServiceContext(c config.Config) *ServiceContext {
    return &ServiceContext{
        Config:      c,
        MenuModel:   menus.NewModel(c.DataSource, c.Cache),
        MenuAuditLogModel: menu_audit_logs.NewModel(c.DataSource, c.Cache),
        // ... 其他 Model
    }
}
```

---

## 步骤 6: 实现 Logic 层

在 `api/internal/logic/system/` 目录下实现各个 Logic 文件：

- `get_menu_tree_logic.go` - 菜单树查询
- `get_menu_logic.go` - 菜单详情
- `create_menu_logic.go` - 创建菜单
- `update_menu_logic.go` - 更新菜单
- `delete_menu_logic.go` - 删除菜单
- `toggle_menu_enabled_logic.go` - 启用/禁用
- `toggle_menu_visible_logic.go` - 显示/隐藏
- `move_menu_logic.go` - 移动菜单
- `reorder_menus_logic.go` - 批量排序
- `bind_permission_logic.go` - 绑定权限
- `get_menu_inspection_logic.go` - 风险巡检
- `get_menu_stats_logic.go` - KPI统计
- `get_menu_audits_logic.go` - 审计日志

每个 Logic 文件需遵循：
- 函数不超过 50 行
- 使用 Model 接口，不直接访问数据库
- 错误包装：`fmt.Errorf("context: %w", err)`
- 中文注释

---

## 步骤 7: 添加错误码

在 `api/internal/errorx/codes.go` 中添加菜单管理错误码：

```go
// 菜单管理错误码范围: 200130-200150

const (
    // 200130: 菜单名称必填
    ErrMenuNameRequired = 200130
    
    // 200131: 菜单编码已存在
    ErrMenuCodeExists = 200131
    
    // ... 其他错误码
)
```

---

## 步骤 8: 编写测试

为 Logic 层编写单元测试，覆盖率 ≥80%：

```bash
go test -cover ./api/internal/logic/system/...
```

---

## 步骤 9: 运行和测试

1. 启动服务：
```bash
go run api/api.go -f api/etc/api.yaml
```

2. 测试 API（使用 curl 或 Postman）：
```bash
# 创建菜单
curl -X POST http://localhost:8888/api/v1/system/menus \
  -H "Content-Type: application/json" \
  -d '{
    "name": "系统管理",
    "code": "system",
    "type": "directory"
  }'

# 查询菜单树
curl http://localhost:8888/api/v1/system/menus/tree
```

---

## 常见问题

### Q: goctl 生成失败？
A: 检查 `api/doc/api.api` 中是否正确导入菜单管理 API 文件。

### Q: 数据库连接失败？
A: 检查 `api/etc/api.yaml` 中的数据库配置。

### Q: 权限绑定失败？
A: 确认权限服务是否可用，或使用 `create_permission=true` 创建新权限。

---

## 下一步

- 查看 [plan.md](./plan.md) 了解详细技术方案
- 查看 [data-model.md](./data-model.md) 了解数据模型
- 查看 [research.md](./research.md) 了解技术选型

---

## 参考

- [项目宪章](../../.specify/memory/constitution.md)
- [Go-Zero 文档](https://go-zero.dev/)
- [GORM 文档](https://gorm.io/)
