-- 组织架构操作审计表
-- 用于记录组织架构的关键操作（创建、删除、移动）
-- 轻量级审计日志，不记录完整状态快照

CREATE TABLE `sys_organization_audit` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `org_id` CHAR(36) NOT NULL COMMENT '部门ID',
    `operation` VARCHAR(20) NOT NULL COMMENT '操作类型: create/delete/move',
    `operator_id` CHAR(36) NOT NULL COMMENT '操作人ID',
    `old_value` JSON DEFAULT NULL COMMENT '变更前值',
    `new_value` JSON DEFAULT NULL COMMENT '变更后值',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    INDEX `idx_org_id` (`org_id`),
    INDEX `idx_operation` (`operation`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织架构操作审计表';
