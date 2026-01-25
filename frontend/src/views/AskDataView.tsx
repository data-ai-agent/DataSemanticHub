import { useState } from 'react';
import { GPTVis } from '@antv/gpt-vis';
import {
    MessageCircle, Send, Sparkles, Table, Box, Database,
    ChevronRight, RefreshCw, Copy, ThumbsUp, ThumbsDown,
    BarChart3, PieChart, TrendingUp, FileText, Search,
    ArrowRight, Zap, Clock, CheckCircle, Wrench
} from 'lucide-react';

// AI API Base URL - 使用新的 API Gateway 路由
const AI_API_BASE = import.meta.env.VITE_AI_API_BASE_URL || '/api/v1/agent';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'text' | 'sql' | 'chart' | 'table';
    data?: any;
}

interface ScenarioExample {
    id: string;
    title: string;
    description: string;
    query: string;
    icon: React.ElementType;
    category: string;
}

const buildChartMarkdown = (message: Message): string => {
    if (message.type !== 'chart' || !message.data) return '';

    if (message.data.chartConfig) {
        return `\`\`\`vis-chart\n${JSON.stringify(message.data.chartConfig, null, 2)}\n\`\`\``;
    }

    const {
        chartType,
        data,
        labels,
        series,
        xField,
        yField,
        angleField,
        colorField
    } = message.data;

    let chartData = data;
    if (!chartData && Array.isArray(series)) {
        chartData = series.map((value: number, index: number) => ({
            category: labels?.[index] ?? `Item ${index + 1}`,
            value
        }));
    }

    if (!chartData) return '';

    const type = chartType || 'column';
    const spec: Record<string, unknown> = {
        type,
        data: chartData
    };

    if (type === 'pie') {
        spec.angleField = angleField || 'value';
        spec.colorField = colorField || 'category';
    } else {
        spec.xField = xField || 'category';
        spec.yField = yField || 'value';
    }

    return `\`\`\`vis-chart\n${JSON.stringify(spec, null, 2)}\n\`\`\``;
};

const buildAutoChartConfig = (columns: string[], rows: any[]): Record<string, unknown> | null => {
    if (!columns.length || rows.length === 0) return null;

    const sampleRows = rows.slice(0, 20);
    const numericCols = columns.filter((col) =>
        sampleRows.some((row) => {
            const value = row?.[col];
            if (value === null || value === undefined || value === '') return false;
            return Number.isFinite(Number(value));
        })
    );

    if (numericCols.length === 0) return null;
    const valueCol = numericCols[0];
    const categoryCol = columns.find((col) => col !== valueCol);

    const data = sampleRows.map((row, index) => ({
        category: categoryCol ? (row?.[categoryCol] ?? `Row ${index + 1}`) : `Row ${index + 1}`,
        value: Number(row?.[valueCol]) || 0
    }));

    if (data.length === 0) return null;

    return {
        type: data.length > 8 ? 'bar' : 'column',
        data,
        xField: 'category',
        yField: 'value'
    };
};

const AskDataView = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '您好！我是数据问答助手，可以帮您查询和分析数据。您可以用自然语言描述您的需求，例如：\n\n• "统计供应商交付及时率"\n• "查看采购到入库的周期分布"\n• "找出库存低于安全阈值的SKU"\n\n请问有什么可以帮您的？',
            timestamp: new Date(),
            type: 'text'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isDev = import.meta.env.DEV;
    const debugUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:8501`
        : 'http://localhost:8501';

    const scenarioExamples: ScenarioExample[] = [
        {
            id: '1',
            title: '供应商交付及时率',
            description: '统计近30天供应商按期交付情况',
            query: '统计近30天供应商交付及时率，列出TOP10与异常供应商',
            icon: TrendingUp,
            category: '供应商分析'
        },
        {
            id: '2',
            title: '采购到入库周期',
            description: '分析采购订单到入库的周期分布',
            query: '分析采购订单到入库的周期分布，并给出平均与P90',
            icon: PieChart,
            category: '流程效率'
        },
        {
            id: '3',
            title: '库存周转与滞销',
            description: '定位周转慢与滞销SKU',
            query: '查询库存周转天数Top10和滞销SKU列表',
            icon: BarChart3,
            category: '库存分析'
        },
        {
            id: '4',
            title: '库存预警查询',
            description: '查找库存不足的SKU',
            query: '查询库存低于安全阈值的SKU列表，按缺口排序',
            icon: Search,
            category: '预警查询'
        },
        {
            id: '5',
            title: '物流时效洞察',
            description: '统计运单时效与延迟原因',
            query: '统计近7天物流运单平均时效与延迟率，输出原因分布',
            icon: Database,
            category: '物流分析'
        },
        {
            id: '6',
            title: '对象关系探索',
            description: '分析供应链对象之间的关系',
            query: '分析供应商、采购订单、库存、物流运单之间的关联关系',
            icon: CheckCircle,
            category: '关系分析'
        }
    ];

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const question = inputValue.trim();
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            timestamp: new Date(),
            type: 'text'
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${AI_API_BASE}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const detail = error?.detail || error?.message || '请求失败';
                throw new Error(detail);
            }

            const data = await response.json();
            const nextMessages: Message[] = [];
            if (data?.sql) {
                nextMessages.push({
                    id: `${Date.now()}-sql`,
                    role: 'assistant',
                    content: data.sql,
                    timestamp: new Date(),
                    type: 'sql'
                });
            }

            const rows = Array.isArray(data?.data) ? data.data : [];
            let columns = Array.isArray(data?.columns) ? data.columns : [];
            if (columns.length === 0 && rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
                columns = Object.keys(rows[0]);
            }

            if (rows.length > 0) {
                // 添加表格数据
                nextMessages.push({
                    id: `${Date.now()}-table`,
                    role: 'assistant',
                    content: `返回 ${rows.length} 行结果`,
                    timestamp: new Date(),
                    type: 'table',
                    data: { columns, rows }
                });

                let chartAdded = false;
                // 如果有图表推荐，添加图表消息
                if (data?.chart_recommendation && data.chart_recommendation.suitable) {
                    const chartRec = data.chart_recommendation;
                    // 确保图表配置有效
                    if (chartRec.config && chartRec.config.data && chartRec.config.data.length > 0) {
                        nextMessages.push({
                            id: `${Date.now()}-chart`,
                            role: 'assistant',
                            content: `📊 ${chartRec.reason}`,
                            timestamp: new Date(),
                            type: 'chart',
                            data: {
                                chartType: chartRec.type,
                                chartConfig: chartRec.config,
                                rawData: rows  // 保留原始数据用于图表渲染
                            }
                        });
                        chartAdded = true;
                    }
                }

                if (!chartAdded) {
                    const chartConfig = buildAutoChartConfig(columns, rows);
                    if (chartConfig) {
                        nextMessages.push({
                            id: `${Date.now()}-chart`,
                            role: 'assistant',
                            content: '图表预览',
                            timestamp: new Date(),
                            type: 'chart',
                            data: { chartConfig }
                        });
                    }
                }
            } else {
                nextMessages.push({
                    id: `${Date.now()}-empty`,
                    role: 'assistant',
                    content: '查询无结果或未返回数据。',
                    timestamp: new Date(),
                    type: 'text'
                });
            }

            setMessages(prev => [...prev, ...nextMessages]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                id: `${Date.now()}-error`,
                role: 'assistant',
                content: err?.message || '请求失败，请稍后重试。',
                timestamp: new Date(),
                type: 'text'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateMockResponse = (query: string): Message[] => {
        const responses: Message[] = [];

        if (query.includes('供应商') && (query.includes('及时') || query.includes('交付'))) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '已为您统计近30天供应商交付及时率，以下是SQL与结果摘要：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `SELECT
    supplier_id,
    supplier_name,
    COUNT(*) AS delivery_count,
    SUM(CASE WHEN actual_arrival_time <= expected_arrival_time THEN 1 ELSE 0 END) AS on_time_count,
    ROUND(SUM(CASE WHEN actual_arrival_time <= expected_arrival_time THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS on_time_rate
FROM scm_delivery
WHERE expected_arrival_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY supplier_id, supplier_name
ORDER BY on_time_rate DESC;`,
                timestamp: new Date(),
                type: 'sql'
            });
            responses.push({
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '📌 结果摘要：\n\n• 全量及时率：92.4%\n• TOP10 及时率均 > 98%\n• 异常供应商：3 家（及时率 < 80%）\n• 主要延迟原因：原材料缺口、排产冲突、物流转运延迟\n\n建议：对异常供应商建立交付预警阈值并联动采购计划。',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 3).toString(),
                role: 'assistant',
                content: '供应商及时率分布（示意）',
                timestamp: new Date(),
                type: 'chart',
                data: {
                    chartType: 'line',
                    labels: ['第1周', '第2周', '第3周', '第4周'],
                    series: [91.2, 92.8, 93.6, 94.1]
                }
            });
        } else if (query.includes('采购') && (query.includes('入库') || query.includes('周期'))) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '已分析采购到入库周期分布，以下是SQL与关键指标：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `SELECT
    po_id,
    DATEDIFF(inbound_time, create_time) AS lead_days
FROM scm_purchase_order
WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
  AND inbound_time IS NOT NULL;`,
                timestamp: new Date(),
                type: 'sql'
            });
            responses.push({
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '⏱ 周期概览：\n\n• 平均周期：6.2 天\n• P50：5 天\n• P90：11 天\n• 超过 14 天的订单占比：7.6%\n\n建议：针对超时订单按供应商与品类维度拆解瓶颈。',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 3).toString(),
                role: 'assistant',
                content: '采购入库周期分布（示意）',
                timestamp: new Date(),
                type: 'chart',
                data: {
                    chartType: 'bar',
                    labels: ['0-3天', '4-6天', '7-9天', '10-12天', '13天+'],
                    series: [126, 312, 198, 72, 45]
                }
            });
        } else if (query.includes('库存') && (query.includes('周转') || query.includes('滞销'))) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '已为您生成库存周转与滞销SKU分析：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `SELECT
    sku_id,
    sku_name,
    avg_daily_sales,
    inventory_qty,
    ROUND(inventory_qty / NULLIF(avg_daily_sales, 0), 1) AS turnover_days
FROM scm_inventory_snapshot
ORDER BY turnover_days DESC
LIMIT 10;`,
                timestamp: new Date(),
                type: 'sql'
            });
            responses.push({
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '📦 结果摘要：\n\n• 周转天数Top10均 > 45 天\n• 滞销SKU集中在低频备品类\n• 建议：结合促销与清理策略优化库存结构',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 3).toString(),
                role: 'assistant',
                content: '库存周转Top5（示意）',
                timestamp: new Date(),
                type: 'chart',
                data: {
                    chartType: 'bar',
                    labels: ['SKU-821', 'SKU-102', 'SKU-447', 'SKU-903', 'SKU-318'],
                    series: [68, 61, 57, 53, 49]
                }
            });
        } else if (query.includes('库存') && (query.includes('预警') || query.includes('低于') || query.includes('缺口'))) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '已筛选出库存低于安全阈值的SKU：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `SELECT
    sku_id,
    sku_name,
    inventory_qty,
    safety_stock,
    (safety_stock - inventory_qty) AS shortage
FROM scm_inventory_snapshot
WHERE inventory_qty < safety_stock
ORDER BY shortage DESC;`,
                timestamp: new Date(),
                type: 'sql'
            });
            responses.push({
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '⚠️ 预警摘要：\n\n• 低于安全库存SKU：28 个\n• 最大缺口：SKU-1023（缺口 420）\n• 关联影响采购订单：12 单\n\n建议：优先补货高动销SKU，并同步采购下单。',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 3).toString(),
                role: 'assistant',
                content: '缺口分布（示意）',
                timestamp: new Date(),
                type: 'chart',
                data: {
                    chartType: 'pie',
                    labels: ['高缺口', '中缺口', '低缺口'],
                    series: [9, 13, 6]
                }
            });
        } else if (query.includes('物流') || query.includes('运单')) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '已分析近7天物流运单时效与延迟情况：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `SELECT
    carrier,
    COUNT(*) AS delivery_count,
    ROUND(AVG(TIMESTAMPDIFF(HOUR, ship_time, delivered_time)), 1) AS avg_hours,
    ROUND(SUM(CASE WHEN delivered_time > expected_time THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS delay_rate
FROM scm_delivery
WHERE ship_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY carrier
ORDER BY delay_rate DESC;`,
                timestamp: new Date(),
                type: 'sql'
            });
            responses.push({
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '🚚 时效摘要：\n\n• 平均时效：27.4 小时\n• 延迟率：6.8%\n• 主要延迟原因：干线拥堵、末端爆仓、异常天气\n\n建议：对延迟率高的承运商建立分层考核。',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 3).toString(),
                role: 'assistant',
                content: '延迟原因占比（示意）',
                timestamp: new Date(),
                type: 'chart',
                data: {
                    chartType: 'pie',
                    labels: ['干线拥堵', '末端爆仓', '天气', '异常件'],
                    series: [12, 10, 7, 5]
                }
            });
        } else if (query.includes('关联') || query.includes('关系')) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '我已分析了业务对象之间的关联关系：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '🔗 关联关系分析：\n\n**供应商 (Supplier) ↔ 采购订单 (PO)**\n• 关系类型：一对多 (1:N)\n• 关联键：supplier_id\n• 物理表映射：scm_supplier.id → scm_purchase_order.supplier_id\n\n**采购订单 (PO) ↔ 库存 (Inventory)**\n• 关系类型：一对多 (1:N)\n• 关联键：po_id\n• 物理表映射：scm_purchase_order.id → scm_inventory_snapshot.po_id\n\n**库存 (Inventory) ↔ 物流运单 (Delivery)**\n• 关系类型：一对多 (1:N)\n• 关联键：sku_id / batch_id\n• 物理表映射：scm_inventory_snapshot.sku_id → scm_delivery.sku_id',
                timestamp: new Date(),
                type: 'text'
            });
        } else {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: `我理解您想要查询关于"${query}"的信息。让我帮您分析：\n\n基于供应链场景，我可以：\n1. 生成相应的SQL查询\n2. 关联采购、库存、物流等业务对象\n3. 输出关键指标与异常提示\n\n您更关注哪一块（供应商、采购、库存、物流）？`,
                timestamp: new Date(),
                type: 'text'
            });
        }

        return responses;
    };

    const handleScenarioClick = (scenario: ScenarioExample) => {
        setInputValue(scenario.query);
    };

    return (
        <div className="h-full flex gap-4 animate-fade-in">
            {/* Left Panel - Chat Interface */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <MessageCircle size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">智能问数</h2>
                                <p className="text-xs text-slate-500">用自然语言探索您的数据</p>
                            </div>
                        </div>
                        {isDev && (
                            <button
                                type="button"
                                onClick={() => window.open(debugUrl, '_blank', 'noopener,noreferrer')}
                                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
                                title="打开调试工具"
                            >
                                <Wrench size={14} />
                                调试工具
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                    : 'bg-slate-100 text-slate-800'
                                    }`}
                            >
                                {message.type === 'sql' ? (
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <pre className="text-xs font-mono bg-slate-800 text-green-400 p-3 rounded-lg overflow-x-auto">
                                            {message.content}
                                        </pre>
                                    </div>
                                ) : message.type === 'table' ? (
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-slate-600">{message.content}</div>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                            <table className="min-w-full text-xs">
                                                <thead className="bg-slate-50 text-slate-600">
                                                    <tr>
                                                        {(message.data?.columns || []).map((col: string) => (
                                                            <th key={col} className="px-3 py-2 text-left font-semibold">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                                    {(message.data?.rows || []).slice(0, 20).map((row: any, idx: number) => (
                                                        <tr key={`${message.id}-row-${idx}`} className="hover:bg-slate-50">
                                                            {(message.data?.columns || []).map((col: string) => (
                                                                <td key={`${message.id}-${idx}-${col}`} className="px-3 py-2 whitespace-nowrap">
                                                                    {row?.[col] ?? '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {(message.data?.rows || []).length > 20 && (
                                            <div className="text-[10px] text-slate-400">
                                                仅展示前 20 行结果
                                            </div>
                                        )}
                                    </div>
                                ) : message.type === 'chart' ? (() => {
                                    const chartMarkdown = buildChartMarkdown(message);
                                    return (
                                        <div className="space-y-2">
                                            <div className="text-xs font-medium text-slate-600">{message.content}</div>
                                            <div className="bg-white rounded-lg border border-slate-200 p-4 min-h-[200px]">
                                                {chartMarkdown ? (
                                                    <GPTVis>{chartMarkdown}</GPTVis>
                                                ) : (
                                                    <div className="text-xs text-slate-400">暂无可视化配置</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                )}
                                {message.role === 'assistant' && message.type === 'text' && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/50">
                                        <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-green-600 transition-colors">
                                            <ThumbsUp size={14} />
                                        </button>
                                        <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-600 transition-colors">
                                            <ThumbsDown size={14} />
                                        </button>
                                        <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <RefreshCw size={16} className="animate-spin text-indigo-500" />
                                <span className="text-sm text-slate-500">正在分析...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="输入您的问题，例如：查询最近一周的销售数据..."
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${inputValue.trim() && !isLoading
                                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <Sparkles size={12} />
                        <span>AI 驱动的智能数据问答</span>
                    </div>
                </div>
            </div>

            {/* Right Panel - Scenario Examples */}
            <div className="w-80 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" />
                        场景示例
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">点击快速开始</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {scenarioExamples.map((scenario) => (
                        <button
                            key={scenario.id}
                            onClick={() => handleScenarioClick(scenario)}
                            className="w-full p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                                    <scenario.icon size={16} className="text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-800 text-sm">{scenario.title}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{scenario.category}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{scenario.description}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 shrink-0 mt-1" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Recent Queries */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Clock size={12} />
                        <span>最近查询</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-slate-600 hover:text-indigo-600 cursor-pointer truncate">
                            • 本月销售额统计
                        </div>
                        <div className="text-xs text-slate-600 hover:text-indigo-600 cursor-pointer truncate">
                            • 客户订单关联查询
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskDataView;
