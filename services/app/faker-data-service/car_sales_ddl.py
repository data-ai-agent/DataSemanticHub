"""
中国汽车销量数据表定义
用于存储 test-data 目录下的汽车销量数据
"""

# 中国汽车总体销量表
CAR_SALES_TOTAL_DDL = """
CREATE TABLE IF NOT EXISTS car_sales_total (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sale_date DATE NOT NULL COMMENT '销售时间',
    sales_volume INT NOT NULL COMMENT '销量',
    year_on_year VARCHAR(20) COMMENT '同比增长率',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sale_date (sale_date),
    INDEX idx_sales_volume (sales_volume)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中国汽车总体销量表';
"""

# 中国汽车分厂商每月销售表
CAR_SALES_BY_MANUFACTURER_DDL = """
CREATE TABLE IF NOT EXISTS car_sales_by_manufacturer (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL COMMENT '年份',
    month INT NOT NULL COMMENT '月份',
    ranking INT NOT NULL COMMENT '当月排名',
    logo_url TEXT COMMENT '厂商LOGO URL',
    manufacturer VARCHAR(100) NOT NULL COMMENT '厂商名称',
    sales_volume INT NOT NULL COMMENT '销量',
    market_share VARCHAR(20) COMMENT '市场份额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_year_month (year, month),
    INDEX idx_manufacturer (manufacturer),
    INDEX idx_ranking (ranking),
    INDEX idx_sales_volume (sales_volume),
    UNIQUE KEY uk_year_month_manufacturer (year, month, manufacturer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中国汽车分厂商每月销售表';
"""

# 中国汽车分车型每月销售量表
CAR_SALES_BY_MODEL_DDL = """
CREATE TABLE IF NOT EXISTS car_sales_by_model (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL COMMENT '年份',
    month INT NOT NULL COMMENT '月份',
    ranking INT NOT NULL COMMENT '当月排名',
    car_model VARCHAR(200) NOT NULL COMMENT '车型名称',
    manufacturer VARCHAR(100) NOT NULL COMMENT '厂商名称',
    sales_volume INT NOT NULL COMMENT '销量',
    price_range VARCHAR(50) COMMENT '售价范围（万元）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_year_month (year, month),
    INDEX idx_car_model (car_model),
    INDEX idx_manufacturer (manufacturer),
    INDEX idx_ranking (ranking),
    INDEX idx_sales_volume (sales_volume),
    UNIQUE KEY uk_year_month_model (year, month, car_model, manufacturer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中国汽车分车型每月销售量表';
"""

# 所有表的 DDL 字典
CAR_SALES_TABLES = {
    'car_sales_total': CAR_SALES_TOTAL_DDL,
    'car_sales_by_manufacturer': CAR_SALES_BY_MANUFACTURER_DDL,
    'car_sales_by_model': CAR_SALES_BY_MODEL_DDL,
}
