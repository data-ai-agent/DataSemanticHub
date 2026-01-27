-- 创建权限模板表
CREATE TABLE `permission_templates` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `name` VARCHAR(128) NOT NULL COMMENT '模板名称',
    `code` VARCHAR(64) NOT NULL COMMENT '模板编码（全局唯一）',
    `description` VARCHAR(500) DEFAULT NULL COMMENT '模板描述',
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '模板状态：draft/published/disabled',
    `scope_suggestion` VARCHAR(50) DEFAULT NULL COMMENT '推荐适用范围：global/organization/domain/project',
    `policy_matrix` JSON NOT NULL COMMENT '策略矩阵（模块×动作勾选关系）',
    `advanced_perms` JSON DEFAULT NULL COMMENT '高级权限点配置',
    `version` INT NOT NULL DEFAULT 1 COMMENT '版本号（每次发布递增）',
    `created_by` CHAR(36) NOT NULL COMMENT '创建人ID',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    `updated_by` CHAR(36) DEFAULT NULL COMMENT '最后更新人ID',
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '最后更新时间',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间（软删除）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code_deleted` (`code`, `deleted_at`),
    KEY `idx_status` (`status`),
    KEY `idx_scope_suggestion` (`scope_suggestion`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限模板表';
