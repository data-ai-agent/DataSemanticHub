-- 创建用户部门关联表
-- 用于管理用户与部门的多对多关系
-- 支持主部门（用于数据权限）和辅助部门（用于协作场景）

CREATE TABLE IF NOT EXISTS `sys_user_dept` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
    `dept_id` CHAR(36) NOT NULL COMMENT '部门ID',
    `is_primary` TINYINT NOT NULL DEFAULT 0 COMMENT '是否主部门: 1=是, 0=否',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_primary` (`user_id`, `is_primary`) COMMENT '一个用户只能有一个主部门',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_dept_id` (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户部门关联表';
