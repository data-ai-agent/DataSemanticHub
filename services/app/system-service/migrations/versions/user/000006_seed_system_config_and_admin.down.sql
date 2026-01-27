-- 回滚: 删除初始化数据

DELETE FROM `system_config` WHERE `config_key` IN ('system.version', 'system.name');
DELETE FROM `users` WHERE `id` = '00000000-0000-0000-0000-000000000001';
