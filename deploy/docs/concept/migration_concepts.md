# 数据库迁移核心概念：UP 与 DOWN

本文档详细解释数据库迁移中 `up.sql` 和 `down.sql` 的作用、重要性及最佳实践。

## 🔄 核心概念

### **up.sql** - 向前迁移（升级）
- **作用**：执行数据库结构或数据的 **变更**
- **方向**：从 旧版本 ➔ 新版本
- **时机**：版本升级、功能上线时执行

### **down.sql** - 向后迁移（回滚）
- **作用**：**撤销** `up.sql` 所做的变更
- **方向**：从 新版本 ➔ 旧版本
- **时机**：回滚、降级、开发调试时执行

---

## 🎯 为什么需要 down.sql？

### 1. 应急回滚能力（生产救火）

**场景**：
- **09:00** 部署 `v1.1.0`，执行 `000003_add_permissions.up.sql`。
- **09:30** 发现严重 BUG，新功能导致系统崩溃。
- **09:35** 需要紧急回滚到 `v1.0.0`。

**对比**：
| 有 down.sql | 无 down.sql |
| :--- | :--- |
| ✅ 执行 `make migrate-down` | ❌ 数据库停留在新结构，代码回滚后不兼容 |
| ✅ 一键恢复数据库结构到 v1.0.0 | ❌ 需要 DBA 手写 SQL 逆向操作 |
| ✅ 系统快速恢复正常 | ❌ 耗时长，风险高，容易引起二次故障 |

### 2. 开发调试灵活性（通过反复验证保证质量）

开发者在本地开发时：
1. `make migrate-up` ➔ 测试新创建的表结构。
2. 发现字段设计不合理。
3. `make migrate-down` ➔ 撤销变更，清除脏数据。
4. 修改 `.up.sql` 和 `.down.sql` 文件。
5. `make migrate-up` ➔ 重新应用。
6. **循环直至完美**。

如果没有 `down.sql`，每次修改可能需要手动删表或重建整个数据库，效率极低。

### 3. A/B 测试和灰度发布

在灰度发布场景下，如果新版本（v1.1.0）在 10% 的流量中表现异常，必须能快速将数据库回滚，配合代码回滚，将影响范围控制在最小。

---

## 📖 实际代码示例

### 示例 1：添加字段

**up.sql (000002.up.sql)**
```sql
-- 向前：添加 icon 字段
ALTER TABLE `menus` 
ADD COLUMN `icon` VARCHAR(64) NULL DEFAULT NULL COMMENT '图标名称' 
AFTER `permission_key`;
```

**down.sql (000002.down.sql)**
```sql
-- 向后：删除 icon 字段（恢复原状）
ALTER TABLE `menus` 
DROP COLUMN `icon`;
```

---

### 示例 2：创建新表

**up.sql (000003.up.sql)**
```sql
-- 向前：创建审计日志表
CREATE TABLE `menu_audit_logs` (
    `id` CHAR(36) NOT NULL,
    `menu_id` VARCHAR(36) NOT NULL,
    -- ...
    PRIMARY KEY (`id`)
);
```

**down.sql (000003.down.sql)**
```sql
-- 向后：删除审计日志表
DROP TABLE IF EXISTS `menu_audit_logs`;
```

---

### 示例 3：数据迁移（复杂场景）

**up.sql (000004.up.sql)**
```sql
-- 向前：拆分 name 为 first_name 和 last_name
ALTER TABLE `users` ADD COLUMN `first_name` VARCHAR(50), ADD COLUMN `last_name` VARCHAR(50);
UPDATE `users` SET `first_name` = SUBSTRING_INDEX(`name`, ' ', 1), `last_name` = SUBSTRING_INDEX(`name`, ' ', -1);
ALTER TABLE `users` DROP COLUMN `name`;
```

**down.sql (000004.down.sql)**
```sql
-- 向后：合并回到 name 字段
ALTER TABLE `users` ADD COLUMN `name` VARCHAR(100);
UPDATE `users` SET `name` = CONCAT(`first_name`, ' ', `last_name`);
ALTER TABLE `users` DROP COLUMN `first_name`, DROP COLUMN `last_name`;
```

> **关键点**：`down.sql` 不仅要撤销结构变更，还要考虑数据的**恢复**和**兼容**。

---

## ⚠️ 最佳实践 (DOs & DON'Ts)

### ✅ DO (推荐)

1. **同步编写**：创建迁移时，立即编写 `down.sql`，不要拖延。
2. **完整撤销**：`down.sql` 必须能完全撤销 `up.sql` 的影响，使数据库回到执行前的状态。
3. **双向测试**：本地测试时，必须执行 `up` -> `down` -> `up` 流程，确保回滚脚本无语法错误且逻辑正确。
4. **数据安全**：在涉及删除表或列的 `down.sql` 中，如果是生产环境回滚，考虑先备份数据（如 `RENAME TABLE` 而不是直接 `DROP`）。

### ❌ DON'T (禁止)

1. **留空**：不要让 `down.sql` 为空（除非该变更确实不可逆且业务上接受不回滚）。
2. **不可逆操作**：尽量避免在 `up.sql` 中做破坏性数据清理（如 `DELETE` 历史数据），否则 `down.sql` 无法恢复。
3. **忽略测试**：不要只测 `up` 不测 `down`。生产回滚失败比上线失败更致命。

---

## 🎓 核心理念：可逆性原则

软件工程中的**可逆性 (Reversibility)** 是系统健壮性的重要指标：

- **部署** ⟺ **回滚**
- **升级** ⟺ **降级**
- **up.sql** ⟺ **down.sql**

通过贯彻 UP/DOWN 模式，我们获得了：
1. **可控性**：任何变更都可撤销。
2. **安全性**：极大降低生产事故风险。
3. **规范性**：团队协作的统一标准。

---

**最后更新**: 2026-01-27
**维护者**: DataSemanticHub Team
