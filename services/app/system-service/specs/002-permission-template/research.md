# Research: Permission Template Feature

> **Feature**: 002-permission-template
> **Created**: 2026-01-26
> **Status**: Complete

---

## Overview

本文档记录权限模板功能的技术决策和最佳实践研究。

---

## Decision 1: JSON 字段存储策略矩阵

**决策**: 使用 MySQL JSON 类型存储 `policy_matrix` 和 `advanced_perms`

**理由**:
1. 策略矩阵是动态结构，不同模块的动作数量和名称不同
2. JSON 类型支持灵活的查询和索引（MySQL 5.7+）
3. GORM 原生支持 `datatypes.JSON` 类型映射
4. 便于前端直接读取，无需额外序列化

**替代方案**:
- 关系表存储：需要多表关联，查询复杂，性能较差
- 序列化字符串：无法利用 JSON 函数查询

---

## Decision 2: 版本号递增机制

**决策**: 每次发布模板时在事务中递增版本号

**理由**:
1. 版本号仅用于记录发布历史，不需要复杂的版本分支
2. 简单递增满足需求：draft(v1) → published(v1) → 编辑 → published(v2)
3. 角色关联时记录版本号，便于追溯

**实现**:
```go
// 在发布逻辑中
if template.Status == "draft" {
    template.Version += 1
    template.Status = "published"
}
```

**替代方案**:
- Git 风版本号：过于复杂，当前需求不需要
- 时间戳版本：不直观，难以比较

---

## Decision 3: 编码唯一性约束

**决策**: 使用 `(code, deleted_at)` 联合唯一索引

**理由**:
1. 支持软删除场景：删除后可重用编码
2. 遵循项目规范要求
3. 活跃模板编码唯一性由数据库保证

**实现**:
```sql
UNIQUE KEY `uk_code_deleted` (`code`, `deleted_at`)
```

---

## Decision 4: 使用统计计算方式

**决策**: 通过关联角色模板表实时计算

**理由**:
1. 数据一致性：统计值准确反映当前状态
2. 实现简单：无需定时任务维护
3. 性能可接受：模板列表页不频繁访问

**优化方向**:
- 如果性能成为问题，可引入缓存（Redis）
- 缓存 TTL 设为 5 分钟，允许短暂不一致

---

## Decision 5: 并发控制策略

**决策**: 使用 GORM 乐观锁 (`gorm:optimisticlock`)

**理由**:
1. 无需分布式锁，性能更好
2. 项目 Model 层已定义乐观锁支持
3. 适用场景：编辑冲突不频繁

**实现**:
```go
type PermissionTemplate struct {
    // ...
    Version int `gorm:"version;not null"` // 乐观锁版本
}
```

**替代方案**:
- 悲观锁：数据库压力大，不适合高并发
- 无锁：可能导致数据覆盖

---

## Decision 6: 错误码设计

**决策**: 业务错误码 200151-200175，HTTP 状态码统一 200

**理由**:
1. 遵循 idrm-go-base 响应格式规范
2. 前端统一处理 `code` 字段判断业务成功/失败
3. HTTP 状态码仅表示网络层状态

**响应格式**:
```json
{
  "code": 200152,
  "message": "模板编码已存在",
  "data": null
}
```

---

## Best Practices: Go-Zero API 定义

### validator 规则

| 规则 | 说明 | 示例 |
|------|------|------|
| required | 必填 | `validate:"required"` |
| max | 最大长度 | `validate:"max=128"` |
| min | 最小长度 | `validate:"min=1"` |
| oneof | 枚举值 | `validate:"oneof=draft published disabled"` |
| omitempty | 可选时忽略 | `validate:"omitempty,oneof=global organization"` |

### 自定义 validator

对于编码格式校验，使用自定义规则：

```go
// 在 validator 初始化中添加
validator.RegisterValidation("lowercase_alphanum", func(fl validator.FieldLevel) bool {
    value := fl.Field().String()
    matched, _ := regexp.MatchString(`^[a-z0-9_-]+$`, value)
    return matched
})
```

---

## Best Practices: GORM JSON 字段

### 查询 JSON 字段

```go
// 查询 policy_matrix 中包含特定模块的模板
db.Where("JSON_CONTAINS(policy_matrix, ?", `\"user_management\"`).Find(&templates)
```

### 更新 JSON 字段

```go
// 使用 JSON_SET 修改 JSON 字段中的某个键
db.Model(&template).Update("policy_matrix", gorm.Expr("JSON_SET(policy_matrix, '$.key', ?)", newValue))
```

---

## Dependencies

| 库 | 版本 | 用途 |
|----|------|------|
| github.com/jinguoxing/idrm-go-base | latest | 统一响应、错误处理、参数校验 |
| github.com/google/uuid | latest | UUID v7 主键生成 |
|gorm.io/gorm | latest | ORM 框架 |
|gorm.io/datatypes | latest | JSON 字段支持 |
| github.com/stretchr/testify | latest | 测试断言 |

---

## Open Questions (Resolved)

- ✅ Q1: `scope_suggestion` 使用固定枚举值
- ✅ Q2: 允许已停用模板重新启用
- ✅ Q3: P1 实现模板版本化
- ✅ Q4: 错误码范围 200151-200175
- ✅ Q5: HTTP 状态码统一 200，业务异常通过 code 字段表示

---

## Next Steps

1. Phase 1: 生成数据模型文档 (`data-model.md`)
2. Phase 1: 生成 API 契约文件 (`api/doc/system/permission_template.api`)
3. Phase 1: 更新 agent 上下文文件
4. Phase 2: 生成实现任务列表 (`tasks.md`)
