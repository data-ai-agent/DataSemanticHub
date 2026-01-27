-- 组织架构表
-- 用于存储组织架构树形结构，支持无限层级
-- 使用 Materialized Path (物化路径) 模式实现高性能树查询

CREATE TABLE `sys_organization` (
    `id` CHAR(36) NOT NULL COMMENT 'ID (UUID v7)',
    `parent_id` CHAR(36) NOT NULL DEFAULT '0' COMMENT '父部门ID，根节点为0',
    `name` VARCHAR(100) NOT NULL COMMENT '部门名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '部门编码，全局唯一',
    `ancestors` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '祖先路径，格式: 0,101,105',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '同级排序',
    `leader_id` CHAR(36) DEFAULT NULL COMMENT '部门负责人ID',
    `type` TINYINT NOT NULL DEFAULT 2 COMMENT '节点类型: 1=公司/租户根, 2=部门/科室',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=启用, 0=停用',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME(3) DEFAULT NULL COMMENT '删除时间（逻辑删除，GORM软删除需要毫秒精度）',
    PRIMARY KEY (`id`),
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_code` (`code`),
    INDEX `idx_status` (`status`),
    INDEX `idx_ancestors` (`ancestors`(255)),
    INDEX `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织架构表';

-- 初始化根节点（集团总部）
INSERT INTO `sys_organization` (`id`, `parent_id`, `name`, `ancestors`, `type`, `status`)
VALUES ('01944f4e-7c6a-7000-8000-000000000001', '0', '集团总部', '0', 1, 1);
