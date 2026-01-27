-- 创建菜单审计日志表
-- 用于记录菜单的所有变更操作

CREATE TABLE IF NOT EXISTS `menu_audit_logs` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `menu_id` VARCHAR(36) NOT NULL COMMENT '菜单ID',
    `operation_type` VARCHAR(20) NOT NULL COMMENT '操作类型：create/update/delete/move/reorder/enable/disable/show/hide',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作人ID',
    `operator_name` VARCHAR(128) DEFAULT NULL COMMENT '操作人名称',
    `changed_fields` JSON DEFAULT NULL COMMENT '变更字段（JSON格式）',
    `old_value` JSON DEFAULT NULL COMMENT '旧值（JSON格式）',
    `new_value` JSON DEFAULT NULL COMMENT '新值（JSON格式）',
    `remark` VARCHAR(512) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_menu_id` (`menu_id`),
    KEY `idx_operation_type` (`operation_type`),
    KEY `idx_operator_id` (`operator_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单审计日志表';
