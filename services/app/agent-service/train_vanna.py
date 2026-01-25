"""
训练 Vanna 使用 ai-test-data 数据库的表结构
"""
import requests
import sys

# Vanna API 端点
VANNA_API = "http://localhost:8891/api/v1"

# ai-test-data 数据库的表结构 DDL
TABLE_DDLS = {
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

# 示例问题-SQL 对，用于训练
EXAMPLES = [
    {
        "question": "显示所有产品",
        "sql": "SELECT * FROM products LIMIT 10;"
    },
    {
        "question": "统计产品总数",
        "sql": "SELECT COUNT(*) as total_products FROM products;"
    },
    {
        "question": "查找价格大于1000元的产品",
        "sql": "SELECT * FROM products WHERE price > 1000;"
    },
    {
        "question": "按类别统计产品数量",
        "sql": "SELECT category, COUNT(*) as count FROM products GROUP BY category;"
    },
    {
        "question": "显示所有客户",
        "sql": "SELECT * FROM customers LIMIT 10;"
    },
    {
        "question": "查找金卡会员",
        "sql": "SELECT * FROM customers WHERE level = '金卡会员';"
    },
    {
        "question": "统计客户总消费金额",
        "sql": "SELECT name, total_spent FROM customers ORDER BY total_spent DESC LIMIT 10;"
    },
    {
        "question": "显示最近10个订单",
        "sql": "SELECT * FROM orders ORDER BY order_date DESC LIMIT 10;"
    },
    {
        "question": "统计已完成的订单数量",
        "sql": "SELECT COUNT(*) as completed_orders FROM orders WHERE status = 'completed';"
    },
    {
        "question": "查询每个客户的订单数量",
        "sql": "SELECT c.name, COUNT(o.id) as order_count FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name;"
    },
    {
        "question": "显示所有员工",
        "sql": "SELECT * FROM employees;"
    },
    {
        "question": "按部门统计员工数量",
        "sql": "SELECT department, COUNT(*) as employee_count FROM employees GROUP BY department;"
    },
    {
        "question": "查找技术部员工",
        "sql": "SELECT * FROM employees WHERE department = '技术部';"
    },
    {
        "question": "显示最近30天的销售记录",
        "sql": "SELECT * FROM sales WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY sale_date DESC;"
    },
    {
        "question": "统计各地区销售总额",
        "sql": "SELECT region, SUM(total_amount) as total_sales FROM sales GROUP BY region ORDER BY total_sales DESC;"
    },
    {
        "question": "显示库存不足的产品",
        "sql": "SELECT * FROM inventory WHERE quantity < reorder_level;"
    },
    {
        "question": "统计访问量最高的10个页面",
        "sql": "SELECT COUNT(*) as visit_count, country FROM website_traffic GROUP BY country ORDER BY visit_count DESC LIMIT 10;"
    },
]


def train_vanna():
    """训练 Vanna"""
    print("🚀 开始训练 Vanna AI...\n")

    # 1. 清除旧的训练数据
    print("1️⃣ 清除旧训练数据...")
    try:
        response = requests.get(f"{VANNA_API}/training_data")
        if response.status_code == 200:
            data = response.json()
            if data.get('data'):
                for item in data['data']:
                    delete_response = requests.delete(f"{VANNA_API}/training_data/{item['id']}")
                    if delete_response.status_code == 200:
                        print(f"   ✅ 删除: {item['id']}")
        print("   ✅ 旧训练数据已清除\n")
    except Exception as e:
        print(f"   ⚠️ 清除训练数据失败: {e}\n")

    # 2. 训练表结构 (DDL)
    print("2️⃣ 训练表结构 (DDL)...")
    for table_name, ddl in TABLE_DDLS.items():
        try:
            response = requests.post(
                f"{VANNA_API}/train",
                json={"ddl": ddl}
            )
            if response.status_code == 200:
                print(f"   ✅ {table_name}")
            else:
                print(f"   ❌ {table_name}: {response.text}")
        except Exception as e:
            print(f"   ❌ {table_name}: {e}")
    print()

    # 3. 训练示例问题
    print("3️⃣ 训练示例问题-SQL 对...")
    for i, example in enumerate(EXAMPLES, 1):
        try:
            response = requests.post(
                f"{VANNA_API}/train",
                json={
                    "question": example["question"],
                    "sql": example["sql"]
                }
            )
            if response.status_code == 200:
                print(f"   ✅ [{i}/{len(EXAMPLES)}] {example['question']}")
            else:
                print(f"   ❌ [{i}/{len(EXAMPLES)}] {example['question']}")
        except Exception as e:
            print(f"   ❌ [{i}/{len(EXAMPLES)}] {example['question']}: {e}")

    print("\n✅ Vanna AI 训练完成！")
    print(f"\n📊 已训练 {len(TABLE_DDLS)} 个表结构和 {len(EXAMPLES)} 个示例问题")


def show_training_data():
    """显示当前训练数据"""
    print("\n📚 当前训练数据:")
    print("="*50)

    try:
        response = requests.get(f"{VANNA_API}/training_data")
        if response.status_code == 200:
            data = response.json()
            training_data = data.get('data', [])

            if not training_data:
                print("   暂无训练数据")
                return

            # 按类型分组
            ddl_count = sum(1 for item in training_data if item['training_data_type'] == 'ddl')
            sql_count = sum(1 for item in training_data if item['training_data_type'] in ['sql', 'documentation'])

            print(f"   📋 DDL (表结构): {ddl_count} 条")
            print(f"   💬 SQL (示例): {sql_count} 条")
            print(f"   📊 总计: {len(training_data)} 条")
            print()
            print("   最近添加的训练数据:")
            for item in training_data[-5:]:
                content_preview = item['content'][:60] + "..." if len(item['content']) > 60 else item['content']
                print(f"   • [{item['training_data_type']}] {content_preview}")
        else:
            print(f"   ❌ 获取失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")

    print("="*50)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='训练 Vanna AI')
    parser.add_argument('--show', action='store_true', help='显示当前训练数据')
    parser.add_argument('--train', action='store_true', help='开始训练')

    args = parser.parse_args()

    if args.show:
        show_training_data()
    elif args.train:
        train_vanna()
        show_training_data()
    else:
        print("使用方法:")
        print("  python train_vanna.py --train   # 训练 Vanna")
        print("  python train_vanna.py --show    # 显示训练数据")
