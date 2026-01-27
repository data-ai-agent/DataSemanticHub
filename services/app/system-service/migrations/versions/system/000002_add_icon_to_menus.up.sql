-- 为菜单表添加 icon 字段
-- 执行时间: 2026-01-27
-- 说明: 支持为菜单设置图标名称（如 Layout, Database 等）

ALTER TABLE `menus` 
ADD COLUMN `icon` VARCHAR(64) NULL DEFAULT NULL COMMENT '图标名称（如 Layout, Database）' 
AFTER `permission_key`;
