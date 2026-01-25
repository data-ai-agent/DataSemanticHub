"""
测试图表推荐模块
"""
from chart_recommender import recommend_chart_type

def test_chart_recommendation():
    """测试图表推荐功能"""
    
    test_cases = [
        {
            "name": "趋势分析",
            "question": "统计近30天供应商交付及时率趋势",
            "columns": ["week", "on_time_rate"],
            "data_sample": [
                {"week": "第1周", "on_time_rate": 91.2},
                {"week": "第2周", "on_time_rate": 92.8},
                {"week": "第3周", "on_time_rate": 93.6}
            ],
            "expected_type": "line"
        },
        {
            "name": "对比分析",
            "question": "对比各供应商交付及时率",
            "columns": ["supplier_name", "on_time_rate"],
            "data_sample": [
                {"supplier_name": "供应商A", "on_time_rate": 95.5},
                {"supplier_name": "供应商B", "on_time_rate": 92.3},
                {"supplier_name": "供应商C", "on_time_rate": 88.7}
            ],
            "expected_type": "column"
        },
        {
            "name": "分布分析",
            "question": "查看供应商交付及时率分布",
            "columns": ["category", "count"],
            "data_sample": [
                {"category": "优秀(>95%)", "count": 15},
                {"category": "良好(90-95%)", "count": 20},
                {"category": "一般(<90%)", "count": 5}
            ],
            "expected_type": "pie"
        },
        {
            "name": "相关性分析",
            "question": "分析价格与销量的关系",
            "columns": ["price", "sales"],
            "data_sample": [
                {"price": 100, "sales": 500},
                {"price": 150, "sales": 400},
                {"price": 200, "sales": 300}
            ],
            "expected_type": "scatter"
        }
    ]
    
    print("=" * 60)
    print("图表推荐模块测试")
    print("=" * 60)
    print()
    
    passed = 0
    failed = 0
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"测试 {i}: {test_case['name']}")
        print(f"  问题: {test_case['question']}")
        
        result = recommend_chart_type(
            question=test_case['question'],
            columns=test_case['columns'],
            data_sample=test_case['data_sample'],
            row_count=len(test_case['data_sample'])
        )
        
        print(f"  推荐类型: {result['type']}")
        print(f"  推荐原因: {result['reason']}")
        print(f"  是否适合: {result['suitable']}")
        
        if result['type'] == test_case['expected_type']:
            print(f"  ✅ 通过")
            passed += 1
        else:
            print(f"  ❌ 失败 (期望: {test_case['expected_type']}, 实际: {result['type']})")
            failed += 1
        
        if result['config'] and result['config'].get('data'):
            print(f"  数据点数量: {len(result['config']['data'])}")
        
        print()
    
    print("=" * 60)
    print(f"测试结果: {passed} 通过, {failed} 失败")
    print("=" * 60)
    
    return passed, failed

if __name__ == "__main__":
    test_chart_recommendation()
