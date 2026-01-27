# 组织架构管理 - Quick Start

> **Feature**: 组织架构管理
> **Branch**: 001-org-structure

---

## 开发流程概览

```bash
# 1. 创建 API 定义
vim api/doc/system/organization.api

# 2. 执行 goctl 生成代码
goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group

# 3. 创建 DDL 并执行
mysql < migrations/system/sys_organization.sql

# 4. 实现 Model 层
# 编辑 model/system/organization/

# 5. 实现 Logic 层
# 编辑 api/internal/logic/system/

# 6. 运行测试
make test
```

---

## Step 1: API 定义

将 [contracts/organization.api](contracts/organization.api) 内容复制到:

```
api/doc/system/organization.api
```

然后在 `api/doc/api.api` 中 import:

```api
import "system/organization.api"
```

---

## Step 2: 生成代码

```bash
# 从项目根目录执行
goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group
```

这将生成:
- `api/internal/handler/system/` - Handler 文件
- `api/internal/types/types.go` - 类型定义

---

## Step 3: 执行 DDL

按顺序执行以下 DDL:

```bash
# 1. 组织表
mysql -u root -p system_db < migrations/system/sys_organization.sql

# 2. 用户部门关联表
mysql -u root -p system_db < migrations/system/sys_user_dept.sql

# 3. 操作审计表
mysql -u root -p system_db < migrations/system/sys_organization_audit.sql
```

---

## Step 4: 实现 Model 层

### 目录结构

```
model/system/organization/
├── interface.go       # 定义 Model 接口
├── types.go           # 定义 Go 结构体
├── vars.go            # 定义常量和错误
├── factory.go         # ORM 工厂函数
├── gorm_dao.go        # GORM 实现
└── tree.go            # 树操作辅助方法
```

### 核心接口实现

```go
// model/system/organization/interface.go
package organization

type Model interface {
    Insert(ctx context.Context, data *SysOrganization) (*SysOrganization, error)
    FindOne(ctx context.Context, id string) (*SysOrganization, error)
    Update(ctx context.Context, data *SysOrganization) error
    Delete(ctx context.Context, id string) error
    FindTree(ctx context.Context, status *int8) ([]*SysOrganization, error)
    MoveNode(ctx context.Context, id, newParentId string, sortOrders []string) error
    IsDescendant(ctx context.Context, ancestorId, descendantId string) (bool, error)
    WithTx(tx interface{}) Model
    Trans(ctx context.Context, fn func(ctx context.Context, model Model) error) error
}
```

---

## Step 5: 实现 Logic 层

### 目录结构

```
api/internal/logic/system/
├── get_org_tree_logic.go
├── create_org_logic.go
├── update_org_logic.go
├── delete_org_logic.go
├── move_org_logic.go       # 核心复杂逻辑
├── get_org_users_logic.go
├── set_user_primary_dept_logic.go
├── add_user_aux_dept_logic.go
└── org_cache.go            # 缓存管理
```

### 移动部门核心逻辑

```go
// api/internal/logic/system/move_org_logic.go
func (l *MoveOrgLogic) MoveOrg(req *types.MoveOrgReq) error {
    // 1. 环路检测
    isDescendant, _ := l.svcCtx.OrgModel.IsDescendant(l.ctx, req.Id, req.TargetParentId)
    if isDescendant {
        return errorx.NewWithCode(errorx.ErrCodeOrgMoveCycle)
    }

    // 2. 事务处理
    err := l.svcCtx.OrgModel.Trans(l.ctx, func(ctx context.Context, model Model) error {
        // 2.1 获取旧祖先路径
        oldNode, _ := model.FindOne(ctx, req.Id)
        oldPrefix := oldNode.Ancestors + "," + oldNode.Id

        // 2.2 计算新祖先路径
        newParent, _ := model.FindOne(ctx, req.TargetParentId)
        newPrefix := newParent.Ancestors + "," + newParent.Id

        // 2.3 更新当前节点
        oldNode.ParentId = req.TargetParentId
        oldNode.Ancestors = newPrefix
        model.Update(ctx, oldNode)

        // 2.4 批量更新子孙节点
        model.UpdateDescendantsAncestors(ctx, req.Id, oldPrefix, newPrefix)

        // 2.5 记录审计
        l.svcCtx.AuditModel.Log(ctx, &SysOrganizationAudit{
            OrgId:     req.Id,
            Operation: "move",
            OldValue:  json.RawMessage(`{"parentId":"` + oldNode.ParentId + `"}`),
            NewValue:  json.RawMessage(`{"parentId":"` + req.TargetParentId + `"}`),
        })

        // 2.6 失效缓存
        l.InvalidateDeptCache(req.Id)
        l.InvalidateDeptCache(req.TargetParentId)

        return nil
    })

    return err
}
```

---

## Step 6: 测试

### 单元测试

```bash
# 测试 Model 层
go test ./model/system/organization/... -v -cover

# 测试 Logic 层
go test ./api/internal/logic/system/... -v -cover
```

### 集成测试

```bash
# 启动测试服务
make run

# 测试 API
curl -X GET http://localhost:8888/api/v1/system/organization/tree
```

---

## 常见问题

### Q: 如何查询某个部门的所有子孙部门？

```go
// 使用 ancestors 字段模糊查询
var children []*SysOrganization
db.Where("ancestors LIKE ?", "%,"+deptId+",%").Find(&children)
```

### Q: 如何检测移动形成环路？

```go
// 检查目标父节点是否是当前节点的子孙节点
var count int64
db.Where("id = ? AND ancestors LIKE ?", targetParentId, "%,"+currentId+",%").Count(&count)
if count > 0 {
    return errors.New("不能移动到自己的子节点下")
}
```

### Q: 如何更新所有子孙节点的祖先路径？

```go
// 使用 REPLACE 函数批量更新
db.Table("sys_organization").
    Where("ancestors LIKE ?", "%,"+rootId+",%").
    Update("ancestors", gorm.Expr("REPLACE(ancestors, ?, ?)", oldPrefix, newPrefix))
```

---

## 性能优化建议

1. **索引优化**: ancestors 字段建立前缀索引 `INDEX idx_ancestors (ancestors(255))`
2. **查询优化**: 避免使用 `SELECT *`，只查询需要的字段
3. **缓存策略**: 用户登录时构建数据权限缓存，组织变更时主动失效
4. **事务控制**: 移动部门操作使用事务，但尽量缩短事务时间
5. **批量操作**: 更新子孙节点时使用批量 SQL 而非循环单条更新
