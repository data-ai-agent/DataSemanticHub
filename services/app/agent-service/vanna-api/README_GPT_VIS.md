# Vanna + GPT-Vis 集成说明

## 一、架构设计

### 数据流程

```
用户问题
  ↓
Vanna API (/api/v1/ask)
  ├─→ 生成 SQL (Vanna)
  ├─→ 执行查询 (Vanna)
  ├─→ 图表推荐 (chart_recommender.py)
  └─→ 返回结果
      ├─→ SQL
      ├─→ 数据 (表格)
      └─→ 图表推荐 (chart_recommendation)
          ↓
前端 (AskDataView)
  ├─→ 显示 SQL
  ├─→ 显示表格
  └─→ 使用 GPT-Vis 渲染图表
```

## 二、后端实现（Vanna API）

### 1. 图表推荐模块 (`chart_recommender.py`)

**功能**：
- 基于问题语义关键词推荐图表类型
- 基于数据特征（列数、数据类型）推荐图表类型
- 构建 GPT-Vis 标准格式的图表配置

**推荐规则**：

| 关键词 | 图表类型 | 说明 |
|--------|---------|------|
| 趋势、变化、增长 | line | 折线图 |
| 对比、比较、排名 | column | 柱状图 |
| 分布、占比、比例 | pie | 饼图 |
| 关系、相关性 | scatter | 散点图 |
| 累计、累积 | area | 面积图 |
| 热力图、密度 | heatmap | 热力图 |
| 多维度、综合评价 | radar | 雷达图 |

### 2. API 增强 (`main.py`)

**修改 `/api/v1/ask` 接口**：
- 在返回数据时，自动调用图表推荐
- 返回 `chart_recommendation` 字段，包含：
  - `type`: 推荐的图表类型
  - `reason`: 推荐原因
  - `config`: GPT-Vis 格式的图表配置

**返回格式示例**：

```json
{
  "question": "统计近30天供应商交付及时率",
  "sql": "SELECT ...",
  "data": [...],
  "columns": ["supplier_name", "on_time_rate"],
  "chart_recommendation": {
    "type": "line",
    "reason": "基于问题语义推荐: 趋势, 变化",
    "config": {
      "type": "line",
      "data": [
        {"category": "供应商A", "value": 95.5},
        {"category": "供应商B", "value": 92.3}
      ]
    },
    "suitable": true
  }
}
```

## 三、前端实现（AskDataView）

### 1. 安装依赖

```bash
npm install @antv/gpt-vis --save
```

### 2. 集成 GPT-Vis 组件

**导入组件**：
```typescript
import { GPTVis } from '@antv/gpt-vis';
```

**渲染图表**：
```typescript
{message.type === 'chart' && message.data?.chartConfig ? (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
        <GPTVis 
            markdown={`
\`\`\`vis-chart
${JSON.stringify(message.data.chartConfig, null, 2)}
\`\`\`
            `}
        />
    </div>
) : ...}
```

### 3. 数据流程

1. **接收 API 响应**：从 `/ai/api/v1/ask` 获取数据
2. **解析图表推荐**：检查 `chart_recommendation` 字段
3. **创建图表消息**：如果有推荐，创建 `type: 'chart'` 的消息
4. **渲染图表**：使用 GPT-Vis 组件渲染

## 四、图表类型支持

### 当前支持（通过 GPT-Vis）

- ✅ **line** - 折线图
- ✅ **column** - 柱状图
- ✅ **bar** - 条形图
- ✅ **pie** - 饼图
- ✅ **area** - 面积图
- ✅ **scatter** - 散点图
- ✅ **heatmap** - 热力图
- ✅ **radar** - 雷达图
- ✅ **treemap** - 树状图
- ✅ **更多...** (GPT-Vis 支持 20+ 种图表)

### 数据格式要求

**折线图/柱状图/条形图/面积图**：
```json
{
  "type": "line",
  "data": [
    {"category": "类别1", "value": 100},
    {"category": "类别2", "value": 200}
  ]
}
```

**饼图**：
```json
{
  "type": "pie",
  "data": [
    {"category": "分类1", "value": 30},
    {"category": "分类2", "value": 70}
  ]
}
```

**散点图**：
```json
{
  "type": "scatter",
  "data": [
    {"x": 10, "y": 20},
    {"x": 15, "y": 25}
  ]
}
```

## 五、向后兼容

- 如果后端没有返回 `chart_recommendation`，前端不显示图表
- 如果 GPT-Vis 渲染失败，可以降级到旧的 SVG 实现（保留原有代码）
- 旧的 `chartType: 'line'/'bar'/'pie'` 格式仍然支持

## 六、优势

1. **智能化**：自动根据问题语义推荐图表类型
2. **专业化**：使用 GPT-Vis 专业图表库，支持 20+ 种图表
3. **标准化**：使用 GPT-Vis 标准协议，易于维护和扩展
4. **可扩展**：可以轻松添加新的图表类型和推荐规则

## 七、后续优化方向

1. **使用 LLM 进行图表推荐**：调用 LLM 分析问题，更精准推荐
2. **多图表支持**：一个问题可以推荐多个图表类型
3. **图表交互**：添加图表筛选、钻取等交互功能
4. **图表导出**：支持导出图表为图片或 PDF
