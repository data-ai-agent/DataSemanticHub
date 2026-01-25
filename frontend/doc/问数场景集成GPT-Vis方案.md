# 问数场景集成 GPT-Vis 方案

## 一、背景分析

### 当前问数场景现状

1. **数据流程**：
   - 用户自然语言提问 → Vanna API 生成 SQL → 执行查询 → 返回表格数据
   - 当前支持简单的图表展示（line、bar、pie），使用 SVG 手动绘制

2. **图表实现问题**：
   - 图表类型有限（仅 3 种：line、bar、pie）
   - 代码冗长，维护成本高
   - 交互能力弱
   - 无法自动推荐合适的图表类型

### GPT-Vis 项目特点

1. **核心能力**：
   - 🤖 **LLM 协议**：专为 LLM Agent 设计的可视化协议
   - 🍡 **20+ 图表组件**：line、column、pie、area、bar、scatter、heatmap、radar、treemap 等
   - 📈 **图表知识库**：提供图表推荐模型，帮助 LLM 选择合适图表类型
   - 🔌 **MCP 集成**：支持通过 MCP Server 直接生成图表

2. **技术优势**：
   - 通过 markdown 中的 `vis-chart` 代码块渲染图表
   - 支持自定义渲染器
   - 提供图表推荐数据集
   - 与 LLM 无缝集成

## 二、集成方案

### 方案 1：前端集成 GPT-Vis 组件（推荐）

#### 1.1 安装依赖

```bash
npm install @antv/gpt-vis --save
```

#### 1.2 修改 AskDataView.tsx

**当前实现**：使用 SVG 手动绘制图表
**改进方案**：使用 GPT-Vis 组件渲染图表

```typescript
import { GPTVis } from '@antv/gpt-vis';

// 在消息渲染中
{message.type === 'chart' ? (
    <div className="space-y-2">
        <div className="text-xs font-medium text-slate-600">{message.content}</div>
        <GPTVis 
            markdown={`
\`\`\`vis-chart
${JSON.stringify({
    type: message.data.chartType,
    data: message.data.data,
    // ... 其他配置
})}
\`\`\`
            `}
        />
    </div>
) : ...}
```

#### 1.3 后端增强：自动图表推荐

修改 Vanna API，在返回数据时同时推荐图表类型：

```python
@app.post("/api/v1/ask")
def ask(request: QuestionRequest):
    # ... 现有逻辑 ...
    
    # 新增：图表推荐
    chart_recommendation = recommend_chart_type(
        question=request.question,
        columns=df.columns.tolist(),
        data_sample=df.head(10).to_dict('records')
    )
    
    return {
        "question": request.question,
        "sql": sql,
        "data": results,
        "columns": df.columns.tolist(),
        "chart_recommendation": chart_recommendation  # 新增
    }
```

### 方案 2：使用 MCP Server Chart（高级）

如果使用 MCP（Model Context Protocol），可以直接通过 MCP Server 生成图表：

```typescript
// 通过 MCP 调用图表生成
const chartResponse = await mcpClient.call('generate_chart', {
    question: userQuestion,
    data: queryResults,
    chartType: 'auto' // 自动推荐
});
```

## 三、集成优势

### 1. **图表能力提升**
- ✅ 从 3 种图表扩展到 20+ 种
- ✅ 支持复杂图表：heatmap、scatter、radar、treemap、network graph 等
- ✅ 更好的视觉效果和交互

### 2. **智能化增强**
- ✅ LLM 自动推荐合适的图表类型
- ✅ 基于数据特征和问题语义智能选择
- ✅ 支持图表知识库，提高推荐准确性

### 3. **开发效率提升**
- ✅ 减少大量 SVG 绘制代码
- ✅ 使用标准化协议，易于维护
- ✅ 支持自定义扩展

### 4. **用户体验优化**
- ✅ 更丰富的可视化选择
- ✅ 更专业的图表展示
- ✅ 更好的数据洞察

## 四、实施步骤

### Phase 1: 基础集成（1-2 天）
1. 安装 `@antv/gpt-vis` 依赖
2. 替换现有的 SVG 图表实现
3. 支持 line、bar、pie 三种基础图表

### Phase 2: 图表推荐（3-5 天）
1. 在后端添加图表推荐逻辑
2. 基于问题语义和数据特征推荐图表类型
3. 前端根据推荐自动渲染

### Phase 3: 扩展图表类型（5-7 天）
1. 支持更多图表类型（column、area、scatter 等）
2. 优化图表配置和样式
3. 添加图表交互功能

### Phase 4: 高级功能（可选）
1. 集成 MCP Server Chart
2. 支持图表导出
3. 添加图表编辑功能

## 五、代码示例

### 5.1 前端集成示例

```typescript
// AskDataView.tsx
import { GPTVis } from '@antv/gpt-vis';

// 转换数据为 GPT-Vis 格式
const convertToGPTVisFormat = (message: Message) => {
    if (message.type === 'chart' && message.data) {
        const { chartType, data, labels, series } = message.data;
        
        // 根据图表类型构建配置
        const chartConfig = {
            type: chartType,
            data: data || series.map((value: number, index: number) => ({
                category: labels[index] || `Item ${index + 1}`,
                value: value
            }))
        };
        
        return `
\`\`\`vis-chart
${JSON.stringify(chartConfig, null, 2)}
\`\`\`
        `;
    }
    return '';
};

// 在消息渲染中使用
{message.type === 'chart' ? (
    <div className="space-y-2">
        <div className="text-xs font-medium text-slate-600">{message.content}</div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
            <GPTVis markdown={convertToGPTVisFormat(message)} />
        </div>
    </div>
) : ...}
```

### 5.2 后端图表推荐示例

```python
# vanna-api/main.py
from typing import Dict, List, Any

def recommend_chart_type(question: str, columns: List[str], data_sample: List[Dict]) -> Dict[str, Any]:
    """
    基于问题和数据特征推荐图表类型
    """
    question_lower = question.lower()
    
    # 基于问题关键词推荐
    if any(keyword in question_lower for keyword in ['趋势', '变化', '增长', '趋势']):
        return {'type': 'line', 'reason': '问题涉及趋势分析'}
    
    if any(keyword in question_lower for keyword in ['分布', '占比', '比例', '构成']):
        return {'type': 'pie', 'reason': '问题涉及分布分析'}
    
    if any(keyword in question_lower for keyword in ['对比', '比较', '排名', 'top']):
        return {'type': 'column', 'reason': '问题涉及对比分析'}
    
    # 基于数据特征推荐
    if len(columns) == 2:
        # 两个字段，可能是散点图
        return {'type': 'scatter', 'reason': '数据包含两个维度'}
    
    # 默认推荐
    return {'type': 'table', 'reason': '数据适合表格展示'}
```

## 六、注意事项

1. **性能考虑**：
   - GPT-Vis 组件较大，考虑按需加载
   - 大数据量时使用虚拟滚动

2. **兼容性**：
   - 确保与现有 Vanna API 兼容
   - 保持向后兼容，支持旧的图表格式

3. **样式统一**：
   - 自定义 GPT-Vis 主题，与项目整体风格一致
   - 保持与现有 UI 组件的视觉统一

4. **错误处理**：
   - 图表渲染失败时的降级方案
   - 数据格式不匹配时的处理

## 七、参考资源

- [GPT-Vis GitHub](https://github.com/antvis/GPT-Vis)
- [GPT-Vis 文档](https://gpt-vis.antv.vision)
- [MCP Server Chart](https://github.com/antvis/mcp-server-chart)
- [图表知识库](https://github.com/antvis/GPT-Vis/tree/main/knowledges)
