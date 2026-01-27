CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审计日志ID',
    `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型：创建/更新/锁定/解锁/删除等',
    `operator` VARCHAR(100) NOT NULL COMMENT '操作人姓名',
    `operator_id` VARCHAR(36) NOT NULL COMMENT '操作人ID',
    `changes` JSON DEFAULT NULL COMMENT '变更内容（JSON格式，记录字段的旧值和新值）',
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_operator_id` (`operator_id`),
    KEY `idx_action` (`action`),
    KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';
