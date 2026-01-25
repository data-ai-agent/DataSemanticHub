"""
Vanna API 配置文件加载器
支持从 YAML 配置文件和环境变量读取配置，环境变量优先级更高
"""
import os
import yaml
from pathlib import Path
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class Config:
    """配置类，支持从文件和环境变量读取配置"""
    
    def __init__(self, config_file: Optional[str] = None):
        """
        初始化配置
        
        Args:
            config_file: 配置文件路径，如果为 None 则尝试从默认位置加载
        """
        self._config: Dict[str, Any] = {}
        self._load_from_file(config_file)
    
    def _load_from_file(self, config_file: Optional[str] = None):
        """从 YAML 文件加载配置"""
        if config_file is None:
            # 尝试从多个默认位置加载配置文件
            possible_paths = [
                Path("/app/config/config.yaml"),  # Docker 容器内挂载路径（优先）
                Path(__file__).parent / "config.yaml",  # 代码目录
                Path(__file__).parent.parent / "config.yaml",  # 上级目录
                Path("/app/config.yaml"),  # Docker 容器内根路径
            ]
            
            for path in possible_paths:
                if path.exists():
                    config_file = str(path)
                    break
        
        if config_file and Path(config_file).exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    self._config = yaml.safe_load(f) or {}
                logger.info(f"✅ 已加载配置文件: {config_file}")
            except Exception as e:
                logger.warning(f"⚠️ 加载配置文件失败: {e}，将使用默认值")
                self._config = {}
        else:
            logger.info("ℹ️ 未找到配置文件，将使用环境变量和默认值")
    
    def get(self, key: str, default: Any = None, env_key: Optional[str] = None) -> Any:
        """
        获取配置值，优先级：环境变量 > 配置文件 > 默认值
        
        Args:
            key: 配置键（支持点号分隔的嵌套键，如 'llm.model'）
            default: 默认值
            env_key: 环境变量名，如果为 None 则使用 key 的大写形式
        
        Returns:
            配置值
        """
        # 优先从环境变量读取
        if env_key is None:
            env_key = key.upper().replace('.', '_')
        
        env_value = os.getenv(env_key)
        if env_value is not None:
            # 尝试转换为合适的类型
            if isinstance(default, bool):
                return env_value.lower() in ('true', '1', 'yes', 'on')
            elif isinstance(default, int):
                try:
                    return int(env_value)
                except ValueError:
                    return default
            return env_value
        
        # 从配置文件读取（支持嵌套键）
        keys = key.split('.')
        value = self._config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value if value is not None else default


# 全局配置实例
_config_instance: Optional[Config] = None


def get_config(config_file: Optional[str] = None) -> Config:
    """获取全局配置实例（单例模式）"""
    global _config_instance
    if _config_instance is None:
        _config_instance = Config(config_file)
    return _config_instance


# 便捷函数
def get_db_config() -> Dict[str, Any]:
    """获取数据库配置"""
    config = get_config()
    return {
        'host': config.get('db.host', 'mariadb', 'DB_HOST'),
        'port': config.get('db.port', 3306, 'DB_PORT'),
        'database': config.get('db.database', 'datasemantichub', 'DB_NAME'),
        'user': config.get('db.user', 'root', 'DB_USER'),
        'password': config.get('db.password', '', 'DB_PASSWORD'),
    }


def get_vanna_config() -> Dict[str, Any]:
    """获取 Vanna 配置"""
    config = get_config()
    return {
        'vanna_api_key': config.get('vanna.api_key', None, 'VANNA_API_KEY'),
        'vanna_model': config.get('vanna.model', None, 'VANNA_MODEL'),
        'use_ollama': config.get('vanna.use_ollama', False, 'USE_OLLAMA'),
        'ollama_model': config.get('vanna.ollama.model', 'qwen2.5-coder:7b', 'OLLAMA_MODEL'),
        'ollama_host': config.get('vanna.ollama.host', 'http://host.docker.internal:11434', 'OLLAMA_HOST'),
        'openai_api_key': config.get('llm.openai_api_key', None, 'OPENAI_API_KEY'),
        'llm_model': config.get('llm.model', 'gpt-3.5-turbo', 'LLM_MODEL'),
        'llm_base_url': config.get('llm.base_url', None, 'LLM_BASE_URL'),
        'chroma_db_path': config.get('vanna.chroma_db_path', '/app/chroma_db', 'CHROMA_DB_PATH'),
    }
