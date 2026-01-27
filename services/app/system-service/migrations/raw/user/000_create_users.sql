-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL COMMENT '用户ID (UUID v7)',
    `first_name` VARCHAR(50) NOT NULL COMMENT '名',
    `last_name` VARCHAR(50) NOT NULL COMMENT '姓',
    `email` VARCHAR(255) NOT NULL COMMENT '邮箱（唯一）',
    `organization` VARCHAR(100) DEFAULT NULL COMMENT '组织/团队',
    `password_hash` VARCHAR(60) NOT NULL COMMENT '密码哈希 (bcrypt)',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间（软删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`),
    KEY `idx_email` (`email`),
    KEY `idx_status` (`status`),
    KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
