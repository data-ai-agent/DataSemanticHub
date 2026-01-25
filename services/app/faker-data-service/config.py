"""
配置文件加载器
"""
import os
from pathlib import Path
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def get_db_config() -> Dict[str, Any]:
    """获取数据库配置"""
    return {
        'host': os.getenv('DB_HOST', 'mariadb'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'datasemantichub'),
    }


def get_faker_config() -> Dict[str, Any]:
    """获取 Faker 配置"""
    return {
        'locale': os.getenv('FAKER_LOCALE', 'zh_CN'),  # 默认中文
        'seed': int(os.getenv('FAKER_SEED', 12345)),  # 随机种子，保证可复现
    }
