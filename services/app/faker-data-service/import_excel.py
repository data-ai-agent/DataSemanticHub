"""
从 Excel 文件导入数据到数据库
支持单个或多个 Excel 文件的导入
"""
import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
import pymysql
import pandas as pd
from colorlog import ColoredFormatter
from tqdm import tqdm

from config import get_db_config


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


class ExcelImporter:
    """Excel 数据导入器"""

    def __init__(self, db_config: Dict[str, Any]):
        self.db_config = db_config
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

    def read_excel(self, file_path: str, sheet_name: Optional[str] = None) -> pd.DataFrame:
        """
        读取 Excel 文件

        Args:
            file_path: Excel 文件路径
            sheet_name: 工作表名称，默认为第一个工作表

        Returns:
            DataFrame
        """
        try:
            if sheet_name:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            else:
                df = pd.read_excel(file_path)

            self.logger.info(f"📖 读取文件: {file_path} ({len(df)} 行, {len(df.columns)} 列)")
            return df
        except Exception as e:
            self.logger.error(f"❌ 读取 Excel 文件失败: {e}")
            raise

    def validate_columns(self, df: pd.DataFrame, table_name: str) -> bool:
        """
        验证 DataFrame 列是否与数据库表匹配

        Args:
            df: 要验证的 DataFrame
            table_name: 目标表名

        Returns:
            是否验证通过
        """
        try:
            with self.connection.cursor() as cursor:
                # 获取表结构
                cursor.execute(f"DESCRIBE `{table_name}`")
                table_columns = set(row['Field'] for row in cursor.fetchall())

            # DataFrame 列名（转为字符串并去除空格）
            df_columns = set(str(col).strip() for col in df.columns)

            # 检查是否有不匹配的列
            missing_in_table = df_columns - table_columns
            missing_in_df = table_columns - df_columns

            if missing_in_table:
                self.logger.warning(f"⚠️ DataFrame 中存在表中没有的列: {missing_in_table}")

            if missing_in_df:
                self.logger.warning(f"⚠️ 表中存在 DataFrame 中没有的列 (将使用默认值): {missing_in_df}")

            # 至少需要有部分列匹配
            common_columns = df_columns & table_columns
            if not common_columns:
                self.logger.error(f"❌ 没有匹配的列，无法导入")
                return False

            self.logger.info(f"✅ 列验证通过，匹配列: {len(common_columns)} 个")
            return True

        except Exception as e:
            self.logger.error(f"❌ 列验证失败: {e}")
            return False

    def import_dataframe(
        self,
        df: pd.DataFrame,
        table_name: str,
        batch_size: int = 1000,
        truncate_first: bool = False,
        on_duplicate: str = 'skip'
    ):
        """
        导入 DataFrame 到数据库表

        Args:
            df: 要导入的 DataFrame
            table_name: 目标表名
            batch_size: 批量插入大小
            truncate_first: 导入前是否清空表
            on_duplicate: 遇到重复键时的处理方式 ('skip', 'update', 'ignore')
        """
        try:
            # 获取表的实际列
            with self.connection.cursor() as cursor:
                cursor.execute(f"DESCRIBE `{table_name}`")
                table_columns = [row['Field'] for row in cursor.fetchall()]

            # 过滤出表中存在的列
            valid_columns = [col for col in df.columns if str(col).strip() in table_columns]
            df_filtered = df[valid_columns].copy()

            # 重命名列（去除空格）
            df_filtered.columns = [str(col).strip() for col in df_filtered.columns]

            # 清空表（如果需要）
            if truncate_first:
                with self.connection.cursor() as cursor:
                    cursor.execute(f"TRUNCATE TABLE `{table_name}`")
                    self.connection.commit()
                self.logger.info(f"🗑️ 表 '{table_name}' 已清空")

            # 准备插入数据
            total_rows = len(df_filtered)
            columns = df_filtered.columns.tolist()
            placeholders = ', '.join(['%s'] * len(columns))

            # 根据 on_duplicate 参数决定 SQL 语句
            if on_duplicate == 'update':
                # MySQL 的 ON DUPLICATE KEY UPDATE 语法
                update_clause = ', '.join([f"`{col}`=VALUES(`{col}`)" for col in columns])
                sql = f"""
                    INSERT INTO `{table_name}` ({', '.join([f'`{col}`' for col in columns])})
                    VALUES ({placeholders})
                    ON DUPLICATE KEY UPDATE {update_clause}
                """
            elif on_duplicate == 'ignore':
                sql = f"""
                    INSERT IGNORE INTO `{table_name}` ({', '.join([f'`{col}`' for col in columns])})
                    VALUES ({placeholders})
                """
            else:  # skip (默认，遇到重复会报错跳过)
                sql = f"""
                    INSERT INTO `{table_name}` ({', '.join([f'`{col}`' for col in columns])})
                    VALUES ({placeholders})
                """

            # 批量插入
            self.logger.info(f"🔄 开始导入数据到表 '{table_name}' ({total_rows} 行)...")

            success_count = 0
            error_count = 0

            with tqdm(total=total_rows, desc=f"导入 {table_name}", unit="行") as pbar:
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
                            pbar.update(len(values))
                    except Exception as e:
                        self.connection.rollback()
                        error_count += len(values)
                        self.logger.error(f"❌ 批量插入失败 (行 {i}-{i+len(values)}): {e}")

            self.logger.info(f"✅ 导入完成: 成功 {success_count} 行, 失败 {error_count} 行")

        except Exception as e:
            self.connection.rollback()
            self.logger.error(f"❌ 导入数据失败: {e}")
            raise

    def import_excel_file(
        self,
        file_path: str,
        table_name: Optional[str] = None,
        sheet_name: Optional[str] = None,
        truncate_first: bool = False,
        on_duplicate: str = 'skip',
        batch_size: int = 1000
    ):
        """
        从 Excel 文件导入数据

        Args:
            file_path: Excel 文件路径
            table_name: 目标表名，默认使用文件名（不含扩展名）
            sheet_name: 工作表名称，默认为第一个工作表
            truncate_first: 导入前是否清空表
            on_duplicate: 遇到重复键时的处理方式 ('skip', 'update', 'ignore')
            batch_size: 批量插入大小
        """
        if not os.path.exists(file_path):
            self.logger.error(f"❌ 文件不存在: {file_path}")
            return

        # 如果没有指定表名，使用文件名
        if table_name is None:
            table_name = Path(file_path).stem

        self.logger.info(f"\n{'='*60}")
        self.logger.info(f"📥 导入文件: {file_path}")
        self.logger.info(f"📋 目标表: {table_name}")
        self.logger.info(f"{'='*60}\n")

        # 读取 Excel
        df = self.read_excel(file_path, sheet_name)

        # 验证列
        if not self.validate_columns(df, table_name):
            return

        # 导入数据
        self.import_dataframe(
            df=df,
            table_name=table_name,
            batch_size=batch_size,
            truncate_first=truncate_first,
            on_duplicate=on_duplicate
        )

    def import_excel_directory(
        self,
        directory: str,
        truncate_first: bool = False,
        on_duplicate: str = 'skip',
        batch_size: int = 1000,
        pattern: str = "*.xlsx"
    ):
        """
        从目录导入所有 Excel 文件

        Args:
            directory: Excel 文件目录
            truncate_first: 导入前是否清空表
            on_duplicate: 遇到重复键时的处理方式
            batch_size: 批量插入大小
            pattern: 文件匹配模式
        """
        dir_path = Path(directory)

        if not dir_path.exists():
            self.logger.error(f"❌ 目录不存在: {directory}")
            return

        excel_files = list(dir_path.glob(pattern))

        if not excel_files:
            self.logger.warning(f"⚠️ 未找到匹配的 Excel 文件: {pattern}")
            return

        self.logger.info(f"\n📁 找到 {len(excel_files)} 个 Excel 文件\n")

        for file_path in excel_files:
            self.import_excel_file(
                file_path=str(file_path),
                truncate_first=truncate_first,
                on_duplicate=on_duplicate,
                batch_size=batch_size
            )


def main():
    parser = argparse.ArgumentParser(
        description='从 Excel 文件导入数据到数据库',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 导入单个文件到同名表
  python import_excel.py data/products.xlsx

  # 导入到指定表
  python import_excel.py data/products.xlsx --table products

  # 导入前清空表
  python import_excel.py data/products.xlsx --truncate

  # 导入整个目录
  python import_excel.py --directory data/

  # 遇到重复键时更新
  python import_excel.py data/products.xlsx --on-duplicate update

  # 指定工作表
  python import_excel.py data.xlsx --sheet Sheet1
        """
    )

    parser.add_argument('file', nargs='?', help='Excel 文件路径')
    parser.add_argument('--table', help='目标表名（默认使用文件名）')
    parser.add_argument('--sheet', help='工作表名称（默认使用第一个工作表）')
    parser.add_argument('--directory', help='导入整个目录的 Excel 文件')
    parser.add_argument('--truncate', action='store_true', help='导入前清空表')
    parser.add_argument('--on-duplicate', choices=['skip', 'update', 'ignore'],
                        default='skip', help='遇到重复键时的处理方式')
    parser.add_argument('--batch-size', type=int, default=1000, help='批量插入大小')
    parser.add_argument('--pattern', default='*.xlsx', help='目录模式匹配（默认: *.xlsx）')

    args = parser.parse_args()

    # 获取数据库配置
    db_config = get_db_config()

    # 创建导入器
    importer = ExcelImporter(db_config)

    try:
        # 连接数据库
        importer.connect()
        importer.use_database()

        # 导入数据
        if args.directory:
            # 导入整个目录
            importer.import_excel_directory(
                directory=args.directory,
                truncate_first=args.truncate,
                on_duplicate=args.on_duplicate,
                batch_size=args.batch_size,
                pattern=args.pattern
            )
        elif args.file:
            # 导入单个文件
            importer.import_excel_file(
                file_path=args.file,
                table_name=args.table,
                sheet_name=args.sheet,
                truncate_first=args.truncate,
                on_duplicate=args.on_duplicate,
                batch_size=args.batch_size
            )
        else:
            parser.print_help()
            print("\n❌ 请指定要导入的文件或目录 (--directory)")
            sys.exit(1)

    except Exception as e:
        logging.error(f"❌ 程序执行失败: {e}")
        sys.exit(1)
    finally:
        importer.close()


if __name__ == '__main__':
    main()
