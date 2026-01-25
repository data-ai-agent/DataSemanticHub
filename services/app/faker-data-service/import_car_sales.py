"""
导入中国汽车销量数据到数据库
从 test-data 目录读取 Excel 文件并导入到 ai-test-data 数据库
"""
import os
import sys
from pathlib import Path
from typing import Dict, Any
import pymysql
import pandas as pd
from colorlog import ColoredFormatter
import logging

from car_sales_ddl import CAR_SALES_TABLES


def get_db_config():
    """从环境变量获取数据库配置"""
    return {
        'host': os.getenv('DB_HOST', 'mariadb'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'database': os.getenv('DB_NAME', 'ai-test-data'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
    }


def setup_logging():
    """配置彩色日志"""
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


class CarSalesImporter:
    """汽车销量数据导入器"""

    def __init__(self, db_config: Dict[str, Any], data_dir: str):
        self.db_config = db_config
        self.data_dir = Path(data_dir)
        self.logger = setup_logging()
        self.connection = None

        # Excel 文件映射到数据库表
        self.file_mapping = {
            '中国汽车总体销量.xlsx': 'car_sales_total',
            '中国汽车分厂商每月销售表.xlsx': 'car_sales_by_manufacturer',
            '中国汽车分车型每月销售量.xlsx': 'car_sales_by_model'
        }

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

    def create_tables(self):
        """创建所有汽车销量数据表"""
        self.logger.info("\n" + "="*60)
        self.logger.info("📋 创建汽车销量数据表")
        self.logger.info("="*60 + "\n")

        for table_name, ddl in CAR_SALES_TABLES.items():
            try:
                with self.connection.cursor() as cursor:
                    cursor.execute(ddl)
                    self.connection.commit()
                    self.logger.info(f"✅ 表 '{table_name}' 创建成功")
            except Exception as e:
                self.logger.warning(f"⚠️ 表 '{table_name}' 创建警告: {e}")

    def process_car_sales_total(self, df: pd.DataFrame) -> pd.DataFrame:
        """处理总体销量数据"""
        self.logger.info("🔄 处理总体销量数据...")

        # 重命名列
        df_processed = df.copy()
        df_processed.columns = ['sale_date', 'sales_volume', 'year_on_year']

        # 确保 sale_date 是日期类型
        df_processed['sale_date'] = pd.to_datetime(df_processed['sale_date'])

        # 删除 NaN 行
        df_processed = df_processed.dropna(subset=['sale_date', 'sales_volume'])

        self.logger.info(f"   处理后: {len(df_processed)} 行")
        return df_processed

    def process_car_sales_by_manufacturer(self, df: pd.DataFrame) -> pd.DataFrame:
        """处理分厂商销量数据"""
        self.logger.info("🔄 处理分厂商销量数据...")

        # 重命名列
        df_processed = df.copy()
        df_processed.columns = ['year', 'month', 'ranking', 'logo_url',
                                'manufacturer', 'sales_volume', 'market_share']

        # 删除 NaN 行
        df_processed = df_processed.dropna(subset=['year', 'month', 'manufacturer'])

        # 清理市场份额数据 (去掉 % 符号)
        if 'market_share' in df_processed.columns:
            df_processed['market_share'] = df_processed['market_share'].astype(str).str.replace('%', '').str.strip()

        self.logger.info(f"   处理后: {len(df_processed)} 行")
        return df_processed

    def process_car_sales_by_model(self, df: pd.DataFrame) -> pd.DataFrame:
        """处理分车型销量数据"""
        self.logger.info("🔄 处理分车型销量数据...")

        # 重命名列
        df_processed = df.copy()
        df_processed.columns = ['year', 'month', 'ranking', 'car_model',
                                'manufacturer', 'sales_volume', 'price_range']

        # 删除 NaN 行
        df_processed = df_processed.dropna(subset=['year', 'month', 'car_model'])

        self.logger.info(f"   处理后: {len(df_processed)} 行")
        return df_processed

    def import_file(self, file_path: str, table_name: str):
        """导入单个文件"""
        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"📥 导入文件: {Path(file_path).name}")
        self.logger.info(f"📋 目标表: {table_name}")
        self.logger.info(f"{'='*60}\n")

        # 读取 Excel
        try:
            df = pd.read_excel(file_path)
            self.logger.info(f"📖 读取成功: {len(df)} 行 x {len(df.columns)} 列")
        except Exception as e:
            self.logger.error(f"❌ 读取文件失败: {e}")
            return

        # 根据表名处理数据
        if table_name == 'car_sales_total':
            df_processed = self.process_car_sales_total(df)
        elif table_name == 'car_sales_by_manufacturer':
            df_processed = self.process_car_sales_by_manufacturer(df)
        elif table_name == 'car_sales_by_model':
            df_processed = self.process_car_sales_by_model(df)
        else:
            self.logger.error(f"❌ 未知的表名: {table_name}")
            return

        # 获取表的实际列
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(f"DESCRIBE `{table_name}`")
                table_columns = set(row['Field'] for row in cursor.fetchall())
        except Exception as e:
            self.logger.error(f"❌ 获取表结构失败: {e}")
            return

        # 过滤出表中存在的列（排除 id, created_at, updated_at）
        exclude_columns = {'id', 'created_at', 'updated_at'}
        valid_columns = [col for col in df_processed.columns
                        if col in table_columns and col not in exclude_columns]

        df_filtered = df_processed[valid_columns].copy()

        # 准备插入数据
        columns = df_filtered.columns.tolist()
        placeholders = ', '.join(['%s'] * len(columns))

        # 构建列名和更新子句
        col_names = ', '.join([f'`{col}`' for col in columns])
        exclude_cols = {'year', 'month', 'ranking', 'car_model', 'manufacturer'}
        update_cols = [f"`{col}`=VALUES(`{col}`)" for col in columns if col not in exclude_cols]
        update_clause = ', '.join(update_cols)

        sql = f"""
            INSERT INTO `{table_name}` ({col_names})
            VALUES ({placeholders})
            ON DUPLICATE KEY UPDATE {update_clause}
        """

        # 批量插入
        batch_size = 1000
        total_rows = len(df_filtered)
        success_count = 0

        self.logger.info(f"🔄 开始导入数据 ({total_rows} 行)...")

        for i in range(0, total_rows, batch_size):
            batch = df_filtered.iloc[i:i + batch_size]

            # 处理 NaN 值（转为 NULL）
            batch_clean = batch.where(pd.notnull(batch), None)

            # 转换为列表
            values = [tuple(row) for row in batch_clean.values]

            try:
                with self.connection.cursor() as cursor:
                    cursor.executemany(sql, values)
                    self.connection.commit()
                    success_count += len(values)
            except Exception as e:
                self.connection.rollback()
                self.logger.error(f"❌ 批量插入失败 (行 {i}-{i+len(values)}): {e}")

        self.logger.info(f"✅ 导入完成: 成功 {success_count} 行")

        # 显示表中记录数
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) as count FROM `{table_name}`")
                count = cursor.fetchone()['count']
                self.logger.info(f"📊 表 '{table_name}' 当前记录数: {count:,}")
        except Exception as e:
            self.logger.error(f"❌ 获取记录数失败: {e}")

    def import_all(self):
        """导入所有汽车销量数据"""
        self.logger.info("\n" + "="*60)
        self.logger.info("🚗 开始导入中国汽车销量数据")
        self.logger.info("="*60 + "\n")

        # 检查数据目录
        if not self.data_dir.exists():
            self.logger.error(f"❌ 数据目录不存在: {self.data_dir}")
            return

        # 创建表
        self.create_tables()

        # 导入每个文件
        for file_name, table_name in self.file_mapping.items():
            file_path = self.data_dir / file_name
            if file_path.exists():
                self.import_file(str(file_path), table_name)
            else:
                self.logger.warning(f"⚠️ 文件不存在: {file_path}")

        self.logger.info("\n" + "="*60)
        self.logger.info("✅ 所有汽车销量数据导入完成！")
        self.logger.info("="*60 + "\n")


def main():
    # 获取数据库配置
    db_config = get_db_config()

    # 数据目录（在容器内使用绝对路径）
    data_dir = Path('/app/test-data')

    # 创建导入器
    importer = CarSalesImporter(db_config, str(data_dir))

    try:
        # 连接数据库
        importer.connect()
        importer.use_database()

        # 导入所有数据
        importer.import_all()

    except Exception as e:
        logging.error(f"❌ 程序执行失败: {e}")
        sys.exit(1)
    finally:
        importer.close()


if __name__ == '__main__':
    main()
