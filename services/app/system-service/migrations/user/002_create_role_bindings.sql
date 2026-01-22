CREATE TABLE IF NOT EXISTS `role_bindings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色绑定ID',
    `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
    `org_id` VARCHAR(36) NOT NULL COMMENT '组织/部门ID',
    `position` VARCHAR(50) DEFAULT NULL COMMENT '岗位职责',
    `permission_role` VARCHAR(50) DEFAULT NULL COMMENT '权限角色',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_org_id` (`org_id`),
    KEY `idx_permission_role` (`permission_role`),
    CONSTRAINT `fk_role_binding_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色绑定表';
