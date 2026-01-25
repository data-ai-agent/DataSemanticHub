"""
图表推荐模块
基于问题语义和数据特征，推荐合适的图表类型
"""
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


def recommend_chart_type(
    question: str,
    columns: List[str],
    data_sample: List[Dict[str, Any]],
    row_count: int = 0
) -> Dict[str, Any]:
    """
    基于问题语义和数据特征推荐图表类型
    
    Args:
        question: 用户问题
        columns: 数据列名
        data_sample: 数据样本（前10行）
        row_count: 总行数
    
    Returns:
        图表推荐配置，包含 type、reason、config 等
    """
    question_lower = question.lower()
    
    # 1. 基于问题关键词的推荐规则
    keyword_rules = {
        'line': ['趋势', '变化', '增长', '下降', '走势', '时间序列', '趋势分析', '变化趋势'],
        'column': ['对比', '比较', '排名', 'top', '最高', '最低', '排序', '对比分析'],
        'pie': ['分布', '占比', '比例', '构成', '份额', '百分比', '分布情况'],
        'bar': ['排名', 'top', '前', '后', '排序', '排行榜'],
        'area': ['累计', '累积', '累计增长', '累计趋势'],
        'scatter': ['关系', '相关性', '关联', '散点', '相关性分析'],
        'heatmap': ['热力图', '密度', '分布密度', '热力分布'],
        'radar': ['雷达', '多维度', '综合评价', '多指标'],
    }
    
    # 匹配关键词
    matched_type = None
    matched_keywords = []
    for chart_type, keywords in keyword_rules.items():
        for keyword in keywords:
            if keyword in question_lower:
                matched_type = chart_type
                matched_keywords.append(keyword)
                break
        if matched_type:
            break
    
    # 2. 基于数据特征的推荐
    if not matched_type:
        matched_type = _recommend_by_data_features(columns, data_sample, row_count)
    
    # 如果推荐的是 table，不返回图表推荐
    if matched_type == 'table':
        return {
            'type': 'table',
            'reason': '数据适合表格展示',
            'config': None,
            'suitable': False
        }
    
    # 3. 构建图表配置
    chart_config = _build_chart_config(matched_type, columns, data_sample)
    
    # 检查配置是否有效
    suitable = chart_config.get('data') and len(chart_config.get('data', [])) > 0
    
    return {
        'type': matched_type,
        'reason': f"基于问题语义推荐: {', '.join(matched_keywords) if matched_keywords else '基于数据特征推荐'}",
        'config': chart_config,
        'suitable': suitable
    }


def _recommend_by_data_features(
    columns: List[str],
    data_sample: List[Dict[str, Any]],
    row_count: int
) -> str:
    """基于数据特征推荐图表类型"""
    
    # 如果只有2列，可能是散点图或折线图
    if len(columns) == 2:
        # 检查是否有时间相关的列
        time_keywords = ['time', 'date', '时间', '日期', 'year', 'month', 'day']
        if any(keyword in col.lower() for col in columns for keyword in time_keywords):
            return 'line'
        return 'scatter'
    
    # 如果有多列，检查数据类型
    if len(columns) > 2:
        # 检查是否有分类列和数值列
        numeric_count = 0
        for col in columns:
            if data_sample and len(data_sample) > 0:
                sample_value = data_sample[0].get(col)
                if isinstance(sample_value, (int, float)):
                    numeric_count += 1
        
        if numeric_count >= 2:
            return 'column'  # 多数值列，适合柱状图对比
        elif numeric_count == 1:
            return 'bar'  # 单数值列，适合条形图
    
    # 默认返回表格
    return 'table'


def _build_chart_config(
    chart_type: str,
    columns: List[str],
    data_sample: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """构建图表配置（GPT-Vis 格式）"""
    
    config = {
        'type': chart_type
    }
    
    if not data_sample or len(data_sample) == 0:
        return config
    
    # 根据图表类型构建数据格式（GPT-Vis 标准格式）
    if chart_type in ['line', 'column', 'bar', 'area']:
        # 需要 category 和 value
        if len(columns) >= 2:
            chart_data = []
            for row in data_sample[:20]:  # 限制前20条
                category_val = row.get(columns[0], '')
                value_val = row.get(columns[1], 0)
                
                # 尝试转换为数值
                try:
                    if isinstance(value_val, str):
                        value_val = float(value_val) if value_val.replace('.', '').replace('-', '').isdigit() else 0
                    else:
                        value_val = float(value_val) if isinstance(value_val, (int, float)) else 0
                except (ValueError, TypeError):
                    value_val = 0
                
                chart_data.append({
                    'category': str(category_val),
                    'value': value_val
                })
            config['data'] = chart_data
        else:
            config['data'] = []
    
    elif chart_type == 'pie':
        # 饼图需要 category 和 value
        if len(columns) >= 2:
            chart_data = []
            for row in data_sample[:10]:  # 饼图限制10条
                category_val = row.get(columns[0], '')
                value_val = row.get(columns[1], 0)
                
                # 尝试转换为数值
                try:
                    if isinstance(value_val, str):
                        value_val = float(value_val) if value_val.replace('.', '').replace('-', '').isdigit() else 0
                    else:
                        value_val = float(value_val) if isinstance(value_val, (int, float)) else 0
                except (ValueError, TypeError):
                    value_val = 0
                
                chart_data.append({
                    'category': str(category_val),
                    'value': value_val
                })
            config['data'] = chart_data
        else:
            config['data'] = []
    
    elif chart_type == 'scatter':
        # 散点图需要 x 和 y
        if len(columns) >= 2:
            chart_data = []
            for row in data_sample:
                x_val = row.get(columns[0], 0)
                y_val = row.get(columns[1], 0)
                
                # 尝试转换为数值
                try:
                    if isinstance(x_val, str):
                        x_val = float(x_val) if x_val.replace('.', '').replace('-', '').isdigit() else 0
                    else:
                        x_val = float(x_val) if isinstance(x_val, (int, float)) else 0
                    
                    if isinstance(y_val, str):
                        y_val = float(y_val) if y_val.replace('.', '').replace('-', '').isdigit() else 0
                    else:
                        y_val = float(y_val) if isinstance(y_val, (int, float)) else 0
                except (ValueError, TypeError):
                    x_val = y_val = 0
                
                chart_data.append({
                    'x': x_val,
                    'y': y_val
                })
            config['data'] = chart_data
        else:
            config['data'] = []
    
    return config
