# 菜单管理技术调研

> **创建日期**: 2025-01-25  
> **目的**: 记录技术选型和设计决策

---

## 技术栈选型

### 决策：使用 Go-Zero + GORM/SQLx 双 ORM

**Rationale（理由）**:
- 项目已采用 Go-Zero 微服务架构，保持一致性
- 双 ORM 设计支持复杂查询（GORM）和性能敏感场景（SQLx）
- 符合项目宪章要求

**Alternatives considered（备选方案）**:
- 单一 ORM：灵活性不足
- 其他框架：与现有架构不一致

---

## 数据模型设计

### 决策：使用 UUID v7 作为主键

**Rationale**:
- 时间有序，便于排序和分页
- 分布式安全，无需协调
- 无自增锁，高并发友好
- 符合项目宪章要求

**Alternatives considered**:
- AUTO_INCREMENT：高并发下存在锁竞争
- UUID v4：无序，索引碎片严重
- 雪花算法：需要协调节点

---

## 树形结构存储

### 决策：使用 parent_id 邻接表模型

**Rationale**:
- 简单直观，易于理解和维护
- 查询性能通过索引优化（parent_id 索引）
- 支持动态深度，不限制层级
- 移动节点只需更新 parent_id 和 order

**Alternatives considered**:
- 嵌套集合模型（Nested Set）：插入/移动性能差
- 路径枚举（Path Enumeration）：路径字段过长
- 闭包表（Closure Table）：需要额外关联表，复杂度高

**实现要点**:
- 使用 `parent_id` 字段存储父节点引用
- 同级使用 `order` 字段排序
- 通过递归查询或 CTE 构建树形结构
- 移动时需检查循环引用

---

## 软删除策略

### 决策：使用 deleted_at 字段实现软删除

**Rationale**:
- 保留审计和历史数据
- 支持数据恢复
- 唯一索引需包含 deleted_at：`UNIQUE KEY uk_code_deleted (code, deleted_at)`

**Alternatives considered**:
- 物理删除：无法恢复，审计不完整
- 状态字段：与业务状态（enabled）混淆

---

## 并发控制

### 决策：使用乐观锁（updated_at）处理排序冲突

**Rationale**:
- 菜单排序操作频率不高，冲突概率低
- 乐观锁性能优于悲观锁
- 通过 updated_at 时间戳检测并发修改

**Alternatives considered**:
- 悲观锁（SELECT FOR UPDATE）：性能开销大
- 分布式锁：复杂度高，不必要

**实现要点**:
- 更新时检查 updated_at 是否变化
- 冲突时返回 409 或重试
- 批量排序使用事务保证原子性

---

## 权限绑定设计

### 决策：permission_key 可选，未绑定时产生风险标记

**Rationale**:
- 灵活性：允许菜单先创建后绑定权限
- 风险提示：通过巡检接口发现未绑定权限的菜单
- 不阻塞：不强制要求权限绑定

**Alternatives considered**:
- 强制绑定：限制灵活性，增加创建复杂度
- 延迟绑定：与当前方案类似，但需要额外状态管理

**实现要点**:
- permission_key 字段可为 NULL
- 巡检接口检查未绑定权限的菜单
- 支持创建新权限并绑定（需与权限服务联动）

---

## 路由冲突检测

### 决策：path 和 route_name 建议全局唯一，冲突时返回明确信息

**Rationale**:
- 避免前端路由冲突
- 提供清晰的错误提示
- 不强制唯一（允许特殊场景）

**Alternatives considered**:
- 强制唯一：限制灵活性
- 不检测：可能导致运行时错误

**实现要点**:
- 创建/更新时检查 path 和 route_name 是否已存在
- 冲突时返回 409 和冲突详情
- 支持按需忽略冲突（特殊场景）

---

## 审计日志设计

### 决策：使用独立表 menu_audit_logs 记录所有变更

**Rationale**:
- 与业务数据分离，不影响主表性能
- 支持 JSON 字段存储变更详情
- 便于查询和分析

**Alternatives considered**:
- 在主表记录：增加主表复杂度
- 事件溯源：过度设计

**实现要点**:
- 记录操作类型、操作人、变更字段
- 支持按时间、操作者、字段筛选
- 使用 JSON 存储 old_value 和 new_value

---

## 性能优化

### 决策：菜单树查询支持按需加载和缓存

**Rationale**:
- 大型菜单树查询性能问题
- 减少数据库压力
- 提升用户体验

**实现要点**:
- 支持只返回匹配节点及其祖先（搜索场景）
- 使用 Redis 缓存常用查询结果
- 考虑分页或懒加载（前端实现）

---

## 总结

所有技术选型均基于项目宪章和现有架构，无需额外第三方库。设计遵循 Go-Zero 分层架构和 IDRM 规范。
