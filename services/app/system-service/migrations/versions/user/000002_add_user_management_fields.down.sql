-- 回滚: 删除用户管理相关字段

ALTER TABLE `users`
DROP INDEX `idx_name`,
DROP INDEX `idx_account_source`,
DROP INDEX `idx_dept_id`,
DROP INDEX `uk_phone`;

ALTER TABLE `users` 
DROP COLUMN `updated_by`,
DROP COLUMN `created_by`,
DROP COLUMN `lock_by`,
DROP COLUMN `lock_time`,
DROP COLUMN `lock_reason`,
DROP COLUMN `account_source`,
DROP COLUMN `dept_id`,
DROP COLUMN `phone`,
DROP COLUMN `name`;

-- 恢复status字段注释
ALTER TABLE `users` 
MODIFY COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用';
