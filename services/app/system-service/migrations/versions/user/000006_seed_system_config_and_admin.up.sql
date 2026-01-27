-- 初始化系统配置和管理员账号

-- 初始化系统配置
INSERT INTO `system_config` (`config_key`, `config_value`, `description`) VALUES
('system.version', '1.0.0', 'System version'),
('system.name', 'DataSemanticHub', 'System name')
ON DUPLICATE KEY UPDATE `config_value` = VALUES(`config_value`);

-- 初始化管理员账号（密码：admin123，bcrypt hash）
INSERT INTO `users` (
    `id`,
    `first_name`,
    `last_name`,
    `name`,
    `email`,
    `organization`,
    `password_hash`,
    `status`,
    `account_source`
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'User',
    'Admin User',
    'admin@datasemantichub.com',
    'DataSemanticHub',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68L',
    1,
    'local'
)
ON DUPLICATE KEY UPDATE `email` = `email`;
