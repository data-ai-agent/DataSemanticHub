"""
数据库表结构定义和数据生成逻辑
"""
from faker import Faker
from typing import List, Dict, Any
import random
from datetime import datetime, timedelta


def weighted_choice(choices, weights):
    """加权随机选择"""
    return random.choices(choices, weights=weights, k=1)[0]


class TableSchema:
    """表结构基类"""

    def __init__(self, faker: Faker):
        self.faker = faker

    def generate_data(self, count: int) -> List[Dict[str, Any]]:
        """生成指定数量的数据"""
        raise NotImplementedError


class ProductsTable(TableSchema):
    """产品表"""

    def generate_data(self, count: int) -> List[Dict[str, Any]]:
        categories = ['电子产品', '家居用品', '服装鞋帽', '食品饮料', '图书文具', '运动户外', '美妆护肤', '母婴用品']
        brands = ['Apple', 'Samsung', '小米', '华为', '耐克', '阿迪达斯', '优衣库', '无印良品']

        data = []
        for i in range(1, count + 1):
            data.append({
                'id': i,
                'name': self.faker.word() + ' ' + self.faker.word(),
                'category': random.choice(categories),
                'brand': random.choice(brands),
                'price': round(random.uniform(10, 5000), 2),
                'stock': random.randint(0, 1000),
                'description': self.faker.text(max_nb_chars=200),
                'created_at': self.faker.date_time_between(start_date='-1y', end_date='now'),
            })
        return data


class CustomersTable(TableSchema):
    """客户表"""

    def generate_data(self, count: int) -> List[Dict[str, Any]]:
        data = []
        for i in range(1, count + 1):
            data.append({
                'id': i,
                'name': self.faker.name(),
                'email': self.faker.email(),
                'phone': self.faker.phone_number(),
                'city': self.faker.city(),
                'address': self.faker.address(),
                'level': random.choice(['普通会员', '银卡会员', '金卡会员', '钻石会员']),
                'total_orders': random.randint(0, 100),
                'total_spent': round(random.uniform(0, 50000), 2),
                'registered_date': self.faker.date_between(start_date='-2y', end_date='now'),
                'last_login': self.faker.date_time_between(start_date='-30d', end_date='now'),
            })
        return data


class OrdersTable(TableSchema):
    """订单表"""

    def generate_data(self, count: int, customer_count: int, product_count: int) -> List[Dict[str, Any]]:
        data = []
        for i in range(1, count + 1):
            order_date = self.faker.date_time_between(start_date='-6m', end_date='now')
            data.append({
                'id': i,
                'customer_id': random.randint(1, customer_count),
                'product_id': random.randint(1, product_count),
                'order_date': order_date,
                'quantity': random.randint(1, 10),
                'unit_price': round(random.uniform(10, 1000), 2),
                'total_amount': round(random.uniform(50, 5000), 2),
                'status': random.choice(['pending', 'completed', 'cancelled', 'refunded']),
                'payment_method': random.choice(['credit_card', 'debit_card', 'paypal', 'wechat_pay', 'alipay']),
                'shipping_address': self.faker.address(),
                'created_at': order_date,
            })
        return data


class EmployeesTable(TableSchema):
    """员工表"""

    def generate_data(self, count: int) -> List[Dict[str, Any]]:
        departments = ['销售部', '市场部', '技术部', '人力资源部', '财务部', '运营部']
        positions = ['实习生', '初级', '中级', '高级', '专家', '经理', '总监']

        data = []
        for i in range(1, count + 1):
            hire_date = self.faker.date_between(start_date='-5y', end_date='now')
            data.append({
                'id': i,
                'name': self.faker.name(),
                'email': self.faker.email(),
                'phone': self.faker.phone_number(),
                'department': random.choice(departments),
                'position': random.choice(positions),
                'salary': round(random.uniform(5000, 50000), 2),
                'hire_date': hire_date,
                'status': weighted_choice(['active', 'on_leave', 'resigned'], [0.8, 0.15, 0.05]),
                'manager_id': random.choice([None] + list(range(1, min(10, i)))),
                'created_at': hire_date,
            })
        return data


class SalesTable(TableSchema):
    """销售记录表"""

    def generate_data(self, count: int, product_count: int, employee_count: int) -> List[Dict[str, Any]]:
        data = []
        for i in range(1, count + 1):
            sale_date = self.faker.date_time_between(start_date='-3m', end_date='now')
            data.append({
                'id': i,
                'product_id': random.randint(1, product_count),
                'employee_id': random.randint(1, employee_count),
                'sale_date': sale_date,
                'quantity': random.randint(1, 50),
                'unit_price': round(random.uniform(50, 2000), 2),
                'total_amount': round(random.uniform(100, 50000), 2),
                'commission_rate': round(random.uniform(0.01, 0.1), 3),
                'region': random.choice(['华北', '华东', '华南', '华中', '西南', '西北', '东北']),
                'created_at': sale_date,
            })
        return data


class WebsiteTrafficTable(TableSchema):
    """网站流量表"""

    def generate_data(self, count: int) -> List[Dict[str, Any]]:
        data = []
        for i in range(1, count + 1):
            visit_time = self.faker.date_time_between(start_date='-30d', end_date='now')
            session_duration = random.randint(10, 3600)  # 10秒到1小时

            data.append({
                'id': i,
                'visitor_id': self.faker.uuid4(),
                'visit_time': visit_time,
                'page_views': random.randint(1, 50),
                'session_duration': session_duration,
                'bounce_rate': round(random.uniform(0, 1), 2),
                'source': random.choice(['organic', 'direct', 'social', 'referral', 'email', 'paid']),
                'device': random.choice(['desktop', 'mobile', 'tablet']),
                'browser': random.choice(['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']),
                'os': random.choice(['Windows', 'macOS', 'Linux', 'Android', 'iOS']),
                'country': self.faker.country(),
                'city': self.faker.city(),
                'converted': weighted_choice([0, 1], [0.7, 0.3]),
                'created_at': visit_time,
            })
        return data


class InventoryTable(TableSchema):
    """库存表"""

    def generate_data(self, count: int, warehouse_count: int = 5) -> List[Dict[str, Any]]:
        warehouses = [f'仓库{i}' for i in range(1, warehouse_count + 1)]

        data = []
        for i in range(1, count + 1):
            data.append({
                'id': i,
                'warehouse_name': random.choice(warehouses),
                'item_name': self.faker.word() + ' ' + self.faker.word(),
                'sku': f'SKU-{random.randint(10000, 99999)}',
                'quantity': random.randint(0, 5000),
                'reorder_level': random.randint(10, 100),
                'unit_cost': round(random.uniform(5, 500), 2),
                'last_restocked': self.faker.date_between(start_date='-90d', end_date='now'),
                'supplier': self.faker.company(),
                'status': weighted_choice(['in_stock', 'low_stock', 'out_of_stock'], [0.7, 0.2, 0.1]),
                'created_at': self.faker.date_time_between(start_date='-1y', end_date='now'),
            })
        return data


# 所有表的定义
TABLES = {
    'products': ProductsTable,
    'customers': CustomersTable,
    'orders': OrdersTable,
    'employees': EmployeesTable,
    'sales': SalesTable,
    'website_traffic': WebsiteTrafficTable,
    'inventory': InventoryTable,
}


def get_table_ddl() -> Dict[str, str]:
    """获取所有表的 DDL"""
    return {
        'products': """
            CREATE TABLE IF NOT EXISTS products (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                brand VARCHAR(100),
                price DECIMAL(10, 2),
                stock INT DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_brand (brand)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        'customers': """
            CREATE TABLE IF NOT EXISTS customers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(20),
                city VARCHAR(100),
                address TEXT,
                level VARCHAR(50) DEFAULT '普通会员',
                total_orders INT DEFAULT 0,
                total_spent DECIMAL(12, 2) DEFAULT 0,
                registered_date DATE,
                last_login TIMESTAMP,
                INDEX idx_level (level),
                INDEX idx_registered_date (registered_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        'orders': """
            CREATE TABLE IF NOT EXISTS orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                customer_id INT,
                product_id INT,
                order_date TIMESTAMP,
                quantity INT DEFAULT 1,
                unit_price DECIMAL(10, 2),
                total_amount DECIMAL(12, 2),
                status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50),
                shipping_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                INDEX idx_status (status),
                INDEX idx_order_date (order_date),
                INDEX idx_customer_id (customer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        'employees': """
            CREATE TABLE IF NOT EXISTS employees (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(20),
                department VARCHAR(100),
                position VARCHAR(100),
                salary DECIMAL(12, 2),
                hire_date DATE,
                status VARCHAR(50) DEFAULT 'active',
                manager_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_department (department),
                INDEX idx_status (status),
                INDEX idx_hire_date (hire_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        'sales': """
            CREATE TABLE IF NOT EXISTS sales (
                id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT,
                employee_id INT,
                sale_date TIMESTAMP,
                quantity INT DEFAULT 1,
                unit_price DECIMAL(10, 2),
                total_amount DECIMAL(12, 2),
                commission_rate DECIMAL(5, 3),
                region VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_sale_date (sale_date),
                INDEX idx_region (region),
                INDEX idx_employee_id (employee_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        'website_traffic': """
            CREATE TABLE IF NOT EXISTS website_traffic (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                visitor_id VARCHAR(255),
                visit_time TIMESTAMP,
                page_views INT DEFAULT 1,
                session_duration INT,
                bounce_rate DECIMAL(3, 2),
                source VARCHAR(50),
                device VARCHAR(50),
                browser VARCHAR(50),
                os VARCHAR(50),
                country VARCHAR(100),
                city VARCHAR(100),
                converted TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_visit_time (visit_time),
                INDEX idx_source (source),
                INDEX idx_device (device)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        'inventory': """
            CREATE TABLE IF NOT EXISTS inventory (
                id INT PRIMARY KEY AUTO_INCREMENT,
                warehouse_name VARCHAR(100),
                item_name VARCHAR(255) NOT NULL,
                sku VARCHAR(50) UNIQUE,
                quantity INT DEFAULT 0,
                reorder_level INT DEFAULT 10,
                unit_cost DECIMAL(10, 2),
                last_restocked DATE,
                supplier VARCHAR(255),
                status VARCHAR(50) DEFAULT 'in_stock',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_warehouse_name (warehouse_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    }
