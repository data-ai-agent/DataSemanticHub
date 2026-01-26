-- 创建 ai-test-data 数据库用于 Vanna AI 测试
CREATE DATABASE IF NOT EXISTS `ai-test-data` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用该数据库
USE `ai-test-data`;

-- 创建示例表：客户表
CREATE TABLE IF NOT EXISTS `customers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT '客户姓名',
    `email` VARCHAR(100) COMMENT '邮箱',
    `phone` VARCHAR(20) COMMENT '电话',
    `city` VARCHAR(50) COMMENT '城市',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX `idx_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户信息表';

-- 创建示例表：订单表
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL COMMENT '客户ID',
    `order_no` VARCHAR(50) NOT NULL COMMENT '订单号',
    `total_amount` DECIMAL(10,2) NOT NULL COMMENT '订单总额',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '订单状态: pending, completed, cancelled',
    `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
    INDEX `idx_customer` (`customer_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_order_date` (`order_date`),
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 创建示例表：产品表
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT '产品名称',
    `category` VARCHAR(50) COMMENT '产品类别',
    `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
    `stock` INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品表';

-- 插入测试数据：客户
INSERT INTO `customers` (`name`, `email`, `phone`, `city`) VALUES
('张三', 'zhangsan@example.com', '13800138000', '深圳市'),
('李四', 'lisi@example.com', '13800138001', '北京市'),
('王五', 'wangwu@example.com', '13800138002', '上海市'),
('赵六', 'zhaoliu@example.com', '13800138003', '深圳市'),
('钱七', 'qianqi@example.com', '13800138004', '广州市'),
('孙八', 'sunba@example.com', '13800138005', '深圳市'),
('周九', 'zhoujiu@example.com', '13800138006', '杭州市'),
('吴十', 'wushi@example.com', '13800138007', '南京市');

-- 插入测试数据：产品
INSERT INTO `products` (`name`, `category`, `price`, `stock`) VALUES
('笔记本电脑', '电子产品', 5999.00, 50),
('无线鼠标', '电子产品', 99.00, 200),
('机械键盘', '电子产品', 399.00, 100),
('显示器', '电子产品', 1299.00, 80),
('办公椅', '办公用品', 699.00, 60),
('书架', '家具', 299.00, 40),
('台灯', '家具', 159.00, 150),
('保温杯', '生活用品', 59.00, 300);

-- 插入测试数据：订单
INSERT INTO `orders` (`customer_id`, `order_no`, `total_amount`, `status`, `order_date`) VALUES
(1, 'ORD202401001', 5999.00, 'completed', '2024-01-15 10:30:00'),
(1, 'ORD202401002', 498.00, 'completed', '2024-01-16 14:20:00'),
(2, 'ORD202401003', 1299.00, 'completed', '2024-01-18 09:15:00'),
(3, 'ORD202401004', 699.00, 'pending', '2024-01-20 16:45:00'),
(4, 'ORD202401005', 758.00, 'completed', '2024-01-22 11:10:00'),
(5, 'ORD202401006', 99.00, 'cancelled', '2024-01-23 13:30:00'),
(6, 'ORD202401007', 1598.00, 'completed', '2024-01-24 15:20:00');
