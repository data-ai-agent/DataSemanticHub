"""
Faker 数据生成服务
用于生成测试数据并存储到 MySQL 数据库
"""
import os
import sys
import argparse
import logging
from typing import Dict, Any
from tqdm import tqdm
import pymysql
from colorlog import ColoredFormatter
from faker import Faker

from config import get_db_config, get_faker_config
from schemas import TABLES, get_table_ddl


# 配置彩色日志
def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)

    formatter = ColoredFormatter(
        '%(log_color)s%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        }
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


class FakerDataGenerator:
    """Faker 数据生成器"""

    def __init__(self, db_config: Dict[str, Any], faker_config: Dict[str, Any]):
        self.db_config = db_config
        self.faker_config = faker_config
        self.faker = Faker(faker_config['locale'])
        self.faker.seed_instance(faker_config['seed'])
        self.logger = setup_logging()
        self.connection = None

    def connect(self):
        """连接到数据库"""
        try:
            self.connection = pymysql.connect(
                host=self.db_config['host'],
                port=self.db_config['port'],
                user=self.db_config['user'],
                password=self.db_config['password'],
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            self.logger.info(f"✅ 已连接到 MariaDB: {self.db_config['host']}:{self.db_config['port']}")
        except Exception as e:
            self.logger.error(f"❌ 数据库连接失败: {e}")
            raise

    def close(self):
        """关闭数据库连接"""
        if self.connection:
            self.connection.close()
            self.logger.info("📌 数据库连接已关闭")

    def create_database(self):
        """创建数据库"""
        try:
            db_name = self.db_config['database']
            with self.connection.cursor() as cursor:
                # 使用反引号包裹数据库名称，防止特殊字符导致语法错误
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
                self.connection.commit()
                self.logger.info(f"✅ 数据库 '{db_name}' 已就绪")
        except Exception as e:
            self.logger.error(f"❌ 创建数据库失败: {e}")
            raise

    def use_database(self):
        """切换到指定数据库"""
        try:
            db_name = self.db_config['database']
            with self.connection.cursor() as cursor:
                cursor.execute(f"USE `{db_name}`")
                self.logger.info(f"📍 使用数据库: {db_name}")
        except Exception as e:
            self.logger.error(f"❌ 切换数据库失败: {e}")
            raise

    def create_tables(self, tables: list = None):
        """创建表结构"""
        if tables is None:
            tables = list(TABLES.keys())

        ddl_dict = get_table_ddl()

        for table_name in tables:
            try:
                with self.connection.cursor() as cursor:
                    cursor.execute(ddl_dict[table_name])
                    self.connection.commit()
                    self.logger.info(f"✅ 表 '{table_name}' 创建成功")
            except Exception as e:
                self.logger.warning(f"⚠️ 表 '{table_name}' 创建警告: {e}")

    def truncate_table(self, table_name: str):
        """清空表数据"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(f"TRUNCATE TABLE `{table_name}`")
                self.connection.commit()
                self.logger.info(f"🗑️ 表 '{table_name}' 已清空")
        except Exception as e:
            self.logger.warning(f"⚠️ 清空表 '{table_name}' 失败: {e}")

    def generate_and_insert(self, table_name: str, count: int, **kwargs):
        """生成数据并插入数据库"""
        if table_name not in TABLES:
            self.logger.error(f"❌ 未知的表: {table_name}")
            return

        table_class = TABLES[table_name]
        table = table_class(self.faker)

        self.logger.info(f"🔄 正在生成 '{table_name}' 表数据 ({count} 条)...")

        # 生成数据
        data = table.generate_data(count, **kwargs)

        # 批量插入
        if data:
            self._batch_insert(table_name, data)
        else:
            self.logger.warning(f"⚠️ '{table_name}' 表没有生成数据")

    def _batch_insert(self, table_name: str, data: list, batch_size: int = 1000):
        """批量插入数据"""
        if not data:
            return

        columns = list(data[0].keys())
        placeholders = ', '.join(['%s'] * len(columns))
        sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"

        total = len(data)
        with tqdm(total=total, desc=f"插入 {table_name}", unit="条") as pbar:
            for i in range(0, total, batch_size):
                batch = data[i:i + batch_size]
                values = [tuple(row[col] for col in columns) for row in batch]

                try:
                    with self.connection.cursor() as cursor:
                        cursor.executemany(sql, values)
                        self.connection.commit()
                        pbar.update(len(batch))
                except Exception as e:
                    self.connection.rollback()
                    self.logger.error(f"❌ 批量插入失败: {e}")
                    raise

        self.logger.info(f"✅ '{table_name}' 表成功插入 {total} 条数据")

    def get_table_count(self, table_name: str) -> int:
        """获取表的记录数"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
                result = cursor.fetchone()
                return result['count']
        except Exception as e:
            self.logger.error(f"❌ 获取表记录数失败: {e}")
            return 0

    def show_all_tables(self):
        """显示所有表及其记录数"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()

                self.logger.info("\n" + "="*50)
                self.logger.info("📊 数据库表概览")
                self.logger.info("="*50)

                for table in tables:
                    table_name = list(table.values())[0]
                    count = self.get_table_count(table_name)
                    self.logger.info(f"  • {table_name}: {count:,} 条记录")

                self.logger.info("="*50 + "\n")
        except Exception as e:
            self.logger.error(f"❌ 获取表列表失败: {e}")


def main():
    parser = argparse.ArgumentParser(description='Faker 数据生成服务')
    parser.add_argument('--tables', nargs='+', choices=list(TABLES.keys()), help='要生成数据的表名')
    parser.add_argument('--all', action='store_true', help='生成所有表的数据')
    parser.add_argument('--counts', nargs='+', type=int, help='每张表生成的数据量')
    parser.add_argument('--products', type=int, default=100, help='产品表数据量')
    parser.add_argument('--customers', type=int, default=500, help='客户表数据量')
    parser.add_argument('--orders', type=int, default=1000, help='订单表数据量')
    parser.add_argument('--employees', type=int, default=50, help='员工表数据量')
    parser.add_argument('--sales', type=int, default=2000, help='销售记录数据量')
    parser.add_argument('--website-traffic', type=int, default=10000, help='网站流量数据量')
    parser.add_argument('--inventory', type=int, default=200, help='库存表数据量')
    parser.add_argument('--create-only', action='store_true', help='只创建表结构，不生成数据')
    parser.add_argument('--show', action='store_true', help='显示所有表的记录数')
    parser.add_argument('--truncate', action='store_true', help='生成数据前先清空表')

    args = parser.parse_args()

    # 获取配置
    db_config = get_db_config()
    faker_config = get_faker_config()

    # 创建生成器
    generator = FakerDataGenerator(db_config, faker_config)

    try:
        # 连接数据库
        generator.connect()

        # 创建数据库
        generator.create_database()
        generator.use_database()

        # 只显示表信息
        if args.show:
            generator.show_all_tables()
            return

        # 只创建表结构
        if args.create_only:
            tables = args.tables if args.tables else list(TABLES.keys())
            generator.create_tables(tables)
            generator.show_all_tables()
            return

        # 确定要生成数据的表
        if args.all:
            tables = list(TABLES.keys())
        elif args.tables:
            tables = args.tables
        else:
            tables = list(TABLES.keys())  # 默认生成所有表

        # 创建表结构
        generator.create_tables(tables)

        # 清空表（如果需要）- 按依赖顺序清空
        if args.truncate:
            # 先清空有外键依赖的表，再清空主表
            truncate_order = ['orders', 'sales', 'website_traffic', 'inventory', 'products', 'customers', 'employees']
            for table_name in truncate_order:
                if table_name in tables:
                    generator.truncate_table(table_name)

        # 定义数据量
        counts = {
            'products': args.products,
            'customers': args.customers,
            'orders': args.orders,
            'employees': args.employees,
            'sales': args.sales,
            'website_traffic': args.website_traffic,
            'inventory': args.inventory,
        }

        # 生成并插入数据
        for table_name in tables:
            count = counts.get(table_name, 100)

            # 特殊处理有依赖关系的表
            if table_name == 'orders':
                generator.generate_and_insert('orders', count,
                    customer_count=counts['customers'],
                    product_count=counts['products'])
            elif table_name == 'sales':
                generator.generate_and_insert('sales', count,
                    product_count=counts['products'],
                    employee_count=counts['employees'])
            else:
                generator.generate_and_insert(table_name, count)

        # 显示结果
        generator.show_all_tables()

    except Exception as e:
        logging.error(f"❌ 程序执行失败: {e}")
        sys.exit(1)
    finally:
        generator.close()


if __name__ == '__main__':
    main()
