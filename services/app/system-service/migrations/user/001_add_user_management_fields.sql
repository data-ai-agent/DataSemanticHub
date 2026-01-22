-- 添加用户管理相关字段
ALTER TABLE `users` 
ADD COLUMN `name` VARCHAR(100) DEFAULT NULL COMMENT '姓名（完整姓名，用于管理模块）' AFTER `last_name`,
ADD COLUMN `phone` VARCHAR(11) DEFAULT NULL COMMENT '手机号' AFTER `email`,
ADD COLUMN `dept_id` VARCHAR(36) DEFAULT NULL COMMENT '主部门ID' AFTER `phone`,
ADD COLUMN `account_source` VARCHAR(10) NOT NULL DEFAULT 'local' COMMENT '账号来源：local/sso' AFTER `organization`,
ADD COLUMN `lock_reason` VARCHAR(255) DEFAULT NULL COMMENT '锁定原因' AFTER `status`,
ADD COLUMN `lock_time` DATETIME DEFAULT NULL COMMENT '锁定时间' AFTER `lock_reason`,
ADD COLUMN `lock_by` VARCHAR(36) DEFAULT NULL COMMENT '锁定操作人ID' AFTER `lock_time`,
ADD COLUMN `created_by` VARCHAR(36) DEFAULT NULL COMMENT '创建人ID' AFTER `lock_by`,
ADD COLUMN `updated_by` VARCHAR(36) DEFAULT NULL COMMENT '更新人ID' AFTER `created_by`;

-- 添加索引
ALTER TABLE `users`
ADD UNIQUE KEY `uk_phone` (`phone`) COMMENT '手机号唯一索引（仅非空值）',
ADD KEY `idx_dept_id` (`dept_id`),
ADD KEY `idx_account_source` (`account_source`),
ADD KEY `idx_name` (`name`);

-- 更新status字段注释和枚举值
ALTER TABLE `users` 
MODIFY COLUMN `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-未激活，1-启用，2-停用，3-锁定，4-归档';

-- 更新现有数据：设置默认name字段（合并first_name和last_name）
UPDATE `users` SET `name` = CONCAT(TRIM(`first_name`), ' ', TRIM(`last_name`)) WHERE `name` IS NULL;
