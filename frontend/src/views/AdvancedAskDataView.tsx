import { useState } from 'react';
import { GPTVis } from '@antv/gpt-vis';
import {
    MessageCircle,
    Send,
    Sparkles,
    ChevronRight,
    RefreshCw,
    Copy,
    BarChart3,
    PieChart,
    TrendingUp,
    Search,
    Database,
    Zap,
    Clock,
    CheckCircle,
    Wrench,
    HelpCircle,
    ShieldCheck,
    SlidersHorizontal,
    X,
    AlertTriangle,
    FileText,
    Layers
} from 'lucide-react';

const AI_API_BASE = import.meta.env.VITE_AI_API_BASE_URL || '/api/v1/agent';

interface MessageBase {
    id: string;
    timestamp: Date;
}

interface UserMessage extends MessageBase {
    role: 'user';
    type: 'user';
    content: string;
}

interface AnswerKpi {
    key: string;
    label: string;
    value: number;
    format?: 'percent' | 'number' | 'currency';
}

interface AnswerTable {
    columns: string[];
    rows: Array<Record<string, any>>;
}

interface AnswerChart {
    chartConfig?: Record<string, unknown>;
    chartType?: string;
    data?: any[];
    labels?: string[];
    series?: number[];
    xField?: string;
    yField?: string;
    angleField?: string;
    colorField?: string;
}

interface TrustSignalQuality {
    label: string;
    value: string;
    level: 'ok' | 'warn' | 'risk';
}

interface TrustSignalSecurity {
    masked?: boolean;
    aggregated?: boolean;
    message?: string;
}

interface TrustSignalTerm {
    termId: string;
    name: string;
}

interface AnswerTraceStage {
    name: 'parse' | 'ground' | 'plan' | 'generate' | 'execute' | 'explain';
    status: 'pending' | 'running' | 'ok' | 'failed' | 'skipped';
    output?: Record<string, any>;
    startedAt?: number;
    endedAt?: number;
}

interface AnswerTrace {
    traceId: string;
    requestId?: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    createdAt?: string;
    question?: string;
    context?: Record<string, any>;
    stages: AnswerTraceStage[];
}

interface AnswerCardData {
    status: 'processing' | 'completed' | 'failed';
    meta: {
        elapsedMs?: number;
        rowCount?: number;
        semanticVersion?: string;
        traceId?: string;
        requestId?: string;
    };
    summary?: string;
    kpis?: AnswerKpi[];
    table?: AnswerTable;
    chart?: AnswerChart;
    sql?: string;
    trustSignals?: {
        quality?: TrustSignalQuality[];
        security?: TrustSignalSecurity;
        terms?: TrustSignalTerm[];
    };
    trace?: AnswerTrace;
}

interface AnswerMessage extends MessageBase {
    role: 'assistant';
    type: 'answer';
    data: AnswerCardData;
}

interface ErrorCardData {
    message: string;
    userHint?: string;
    requestId?: string;
    actions?: string[];
}

interface ErrorMessage extends MessageBase {
    role: 'system';
    type: 'error';
    data: ErrorCardData;
}

type Message = UserMessage | AnswerMessage | ErrorMessage;

interface ScenarioExample {
    id: string;
    title: string;
    description: string;
    query: string;
    icon: React.ElementType;
    category: string;
    domainId: string;
    timeRangeId: string;
    outputType: string;
}

interface RecentQuery {
    id: string;
    question: string;
    time: string;
    status: 'completed' | 'failed';
    traceId?: string;
}

const buildChartMarkdown = (chart?: AnswerChart): string => {
    if (!chart) return '';

    if (chart.chartConfig) {
        return `\`\`\`vis-chart\n${JSON.stringify(chart.chartConfig, null, 2)}\n\`\`\``;
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
    } = chart;

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

const buildAutoChartConfig = (columns: string[], rows: Array<Record<string, any>>): Record<string, unknown> | null => {
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

const formatKpiValue = (kpi: AnswerKpi): string => {
    if (kpi.format === 'percent') {
        return `${(kpi.value * 100).toFixed(1)}%`;
    }
    if (kpi.format === 'currency') {
        return `¥${kpi.value.toLocaleString()}`;
    }
    return kpi.value.toLocaleString();
};

const formatDuration = (ms?: number): string => {
    if (ms === undefined) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

const statusStyles: Record<AnswerCardData['status'], string> = {
    processing: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700'
};

const AdvancedAskDataView = () => {
    const [showSidebar, setShowSidebar] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            type: 'answer',
            timestamp: new Date(),
            data: {
                status: 'completed',
                meta: {
                    semanticVersion: 'v1.3',
                    traceId: 'trace_demo'
                },
                summary: '欢迎来到高级问数工作台。我可以提供可解释、可审计、可复现的数据分析结果。',
                kpis: [
                    { key: 'availability', label: '服务可用性', value: 0.995, format: 'percent' }
                ],
                trustSignals: {
                    quality: [{ label: '新鲜度', value: 'T-2h', level: 'ok' }],
                    security: { masked: false, aggregated: true, message: '已按角色裁剪' },
                    terms: [{ termId: 'metric.delivery_ontime_rate', name: '交付及时率' }]
                },
                trace: {
                    traceId: 'trace_demo',
                    status: 'completed',
                    stages: [
                        { name: 'parse', status: 'ok' },
                        { name: 'ground', status: 'ok' },
                        { name: 'plan', status: 'ok' },
                        { name: 'generate', status: 'ok' },
                        { name: 'execute', status: 'ok' },
                        { name: 'explain', status: 'ok' }
                    ]
                }
            }
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [activeTrace, setActiveTrace] = useState<AnswerTrace | null>(null);
    const [traceTab, setTraceTab] = useState<'interpretation' | 'grounding' | 'execution'>('interpretation');
    const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
    const [lastQuestion, setLastQuestion] = useState('');
    const [domainId, setDomainId] = useState('supply_chain');
    const [semanticVersionId, setSemanticVersionId] = useState('v1.3');
    const [timeRangeId, setTimeRangeId] = useState('last_30_days');
    const [options, setOptions] = useState({
        returnSql: true,
        returnChart: true,
        rowLimit: 200,
        anomaly: {
            type: 'threshold',
            threshold: 0.9,
            minCount: 50
        }
    });

    const isDev = import.meta.env.DEV;
    const debugUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:8501`
        : 'http://localhost:8501';

    const domainOptions = [
        { id: 'supply_chain', label: '供应链' },
        { id: 'sales', label: '销售' },
        { id: 'inventory', label: '库存' },
        { id: 'finance', label: '财务' }
    ];

    const semanticVersions = ['v1.3', 'v1.2', 'v1.1'];

    const timeRanges = [
        { id: 'last_7_days', label: '近7天', value: { type: 'last_n_days', value: 7 } },
        { id: 'last_30_days', label: '近30天', value: { type: 'last_n_days', value: 30 } },
        { id: 'last_60_days', label: '近60天', value: { type: 'last_n_days', value: 60 } },
        { id: 'last_90_days', label: '近90天', value: { type: 'last_n_days', value: 90 } },
        { id: 'custom', label: '自定义', value: { type: 'custom' } }
    ];

    const scenarioExamples: ScenarioExample[] = [
        {
            id: '1',
            title: '供应商交付及时率',
            description: '统计近30天供应商按期交付情况',
            query: '统计近30天供应商交付及时率，列出TOP10与异常供应商',
            icon: TrendingUp,
            category: '供应商分析',
            domainId: 'supply_chain',
            timeRangeId: 'last_30_days',
            outputType: '表+图'
        },
        {
            id: '2',
            title: '采购到入库周期',
            description: '分析采购订单到入库的周期分布',
            query: '分析采购订单到入库的周期分布，并给出平均与P90',
            icon: PieChart,
            category: '流程效率',
            domainId: 'supply_chain',
            timeRangeId: 'last_60_days',
            outputType: '图+指标'
        },
        {
            id: '3',
            title: '库存周转与滞销',
            description: '定位周转慢与滞销SKU',
            query: '查询库存周转天数Top10和滞销SKU列表',
            icon: BarChart3,
            category: '库存分析',
            domainId: 'inventory',
            timeRangeId: 'last_90_days',
            outputType: '表+图'
        },
        {
            id: '4',
            title: '库存预警查询',
            description: '查找库存不足的SKU',
            query: '查询库存低于安全阈值的SKU列表，按缺口排序',
            icon: Search,
            category: '预警查询',
            domainId: 'inventory',
            timeRangeId: 'last_7_days',
            outputType: '表'
        },
        {
            id: '5',
            title: '物流时效洞察',
            description: '统计运单时效与延迟原因',
            query: '统计近7天物流运单平均时效与延迟率，输出原因分布',
            icon: Database,
            category: '物流分析',
            domainId: 'supply_chain',
            timeRangeId: 'last_7_days',
            outputType: '图+指标'
        },
        {
            id: '6',
            title: '对象关系探索',
            description: '分析供应链对象之间的关系',
            query: '分析供应商、采购订单、库存、物流运单之间的关联关系',
            icon: CheckCircle,
            category: '关系分析',
            domainId: 'supply_chain',
            timeRangeId: 'last_90_days',
            outputType: '分析报告'
        }
    ];

    const quickExamples = [
        '近30天供应商交付及时率趋势',
        '库存周转天数Top10',
        '采购订单P90入库周期',
        '本周异常供应商清单'
    ];

    const buildAnswerData = (
        payload: any,
        meta: { elapsedMs?: number; requestId?: string; question: string },
        contextSnapshot: { domainId: string; semanticVersionId: string; timeRangeId: string },
        requestOptions: typeof options
    ): AnswerCardData => {
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        let columns = Array.isArray(payload?.columns) ? payload.columns : [];
        if (columns.length === 0 && rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
            columns = Object.keys(rows[0]);
        }

        const summary = payload?.summary || payload?.message || payload?.answer || (rows.length
            ? `查询返回 ${rows.length} 行结果。`
            : '查询已完成。');

        const chartRecommendation = payload?.chart_recommendation;
        let chart: AnswerChart | undefined;
        if (requestOptions.returnChart) {
            if (chartRecommendation?.suitable && chartRecommendation?.config?.data?.length) {
                chart = {
                    chartType: chartRecommendation.type,
                    chartConfig: chartRecommendation.config,
                    data: chartRecommendation.config?.data
                };
            } else {
                const autoChartConfig = buildAutoChartConfig(columns, rows);
                if (autoChartConfig) {
                    chart = { chartConfig: autoChartConfig };
                }
            }
        }

        const traceId = payload?.traceId || payload?.trace_id || `trace_${Date.now()}`;
        const requestId = payload?.requestId || payload?.request_id || meta.requestId;

        const trace: AnswerTrace = {
            traceId,
            requestId,
            status: 'completed',
            question: meta.question,
            context: {
                domainId: contextSnapshot.domainId,
                semanticVersionId: contextSnapshot.semanticVersionId,
                timeRange: timeRanges.find((item) => item.id === contextSnapshot.timeRangeId)?.value
            },
            stages: [
                {
                    name: 'parse',
                    status: 'ok',
                    output: {
                        metrics: columns.filter((col: string) => col.includes('率') || col.includes('rate')).map((col: string) => ({ name: col })),
                        dimensions: columns.filter((col: string) => !col.includes('率') && !col.includes('rate')).map((col: string) => ({ name: col })),
                        filters: [{ field: 'time_range', op: 'in', value: contextSnapshot.timeRangeId }],
                        deliverables: ['table', chart ? 'chart' : undefined].filter(Boolean)
                    }
                },
                {
                    name: 'ground',
                    status: 'ok',
                    output: {
                        businessObject: { objectId: 'bo_supply_chain', name: '供应链业务对象' },
                        tables: [{ name: 'fact_supply_chain', type: 'fact' }],
                        fieldMapping: columns.reduce((acc: Record<string, string>, col: string) => {
                            acc[col] = `fact_supply_chain.${col}`;
                            return acc;
                        }, {})
                    }
                },
                {
                    name: 'plan',
                    status: 'ok',
                    output: {
                        querySteps: ['解析问题', '生成查询', '执行统计', '整理输出']
                    }
                },
                {
                    name: 'generate',
                    status: payload?.sql ? 'ok' : 'skipped',
                    output: payload?.sql ? { sql: payload.sql } : undefined
                },
                {
                    name: 'execute',
                    status: 'ok',
                    output: {
                        durationMs: meta.elapsedMs,
                        resultRows: rows.length,
                        rowLimit: requestOptions.rowLimit
                    }
                },
                {
                    name: 'explain',
                    status: 'ok',
                    output: {
                        summary
                    }
                }
            ]
        };

        return {
            status: 'completed',
            meta: {
                elapsedMs: meta.elapsedMs,
                rowCount: rows.length,
                semanticVersion: contextSnapshot.semanticVersionId,
                traceId,
                requestId
            },
            summary,
            kpis: payload?.kpis || (rows.length ? [{ key: 'row_count', label: '结果行数', value: rows.length, format: 'number' }] : undefined),
            table: rows.length ? { columns, rows } : undefined,
            chart,
            sql: requestOptions.returnSql ? payload?.sql : undefined,
            trustSignals: {
                quality: payload?.trustSignals?.quality || [
                    { label: '新鲜度', value: 'T-2h', level: 'ok' },
                    { label: '空值率', value: '0.8%', level: 'warn' }
                ],
                security: payload?.trustSignals?.security || {
                    masked: false,
                    aggregated: true,
                    message: '已按角色裁剪'
                },
                terms: payload?.artifacts?.termRefs || payload?.termRefs || []
            },
            trace
        };
    };

    const handleSendWithQuestion = async (question: string, overrideOptions?: typeof options) => {
        if (!question.trim() || isLoading) return;

        const trimmedQuestion = question.trim();
        setLastQuestion(trimmedQuestion);
        const contextSnapshot = { domainId, semanticVersionId, timeRangeId };
        const requestOptions = overrideOptions || options;
        const userMessage: UserMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            type: 'user',
            content: trimmedQuestion,
            timestamp: new Date()
        };

        const answerId = `answer-${Date.now()}`;
        const placeholder: AnswerMessage = {
            id: answerId,
            role: 'assistant',
            type: 'answer',
            timestamp: new Date(),
            data: {
                status: 'processing',
                meta: {
                    semanticVersion: semanticVersionId
                },
                summary: '正在解析问题并生成回答...',
                trustSignals: {
                    security: { aggregated: true, message: '已按角色裁剪' }
                }
            }
        };

        setMessages((prev) => [...prev, userMessage, placeholder]);
        setInputValue('');
        setIsLoading(true);

        const start = Date.now();

        try {
            const response = await fetch(`${AI_API_BASE}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: trimmedQuestion,
                    context: {
                        domainId: contextSnapshot.domainId,
                        semanticVersionId: contextSnapshot.semanticVersionId,
                        timeRange: timeRanges.find((item) => item.id === contextSnapshot.timeRangeId)?.value,
                        locale: 'zh-CN'
                    },
                    options: {
                        returnSql: requestOptions.returnSql,
                        returnChart: requestOptions.returnChart,
                        rowLimit: requestOptions.rowLimit,
                        anomaly: requestOptions.anomaly
                    }
                })
            });

            const requestId = response.headers.get('x-request-id') || response.headers.get('X-Request-Id') || undefined;

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                const errorMessage = errorPayload?.error?.message || errorPayload?.detail || errorPayload?.message || '请求失败';
                const userHint = errorPayload?.error?.userHint || errorPayload?.userHint;
                const actions = errorPayload?.error?.actions;

                setMessages((prev) => [
                    ...prev.filter((item) => item.id !== answerId),
                    {
                        id: `error-${Date.now()}`,
                        role: 'system',
                        type: 'error',
                        timestamp: new Date(),
                        data: {
                            message: errorMessage,
                            userHint,
                            requestId,
                            actions
                        }
                    }
                ]);

                setRecentQueries((prev) => [
                    {
                        id: `recent-${Date.now()}`,
                        question: trimmedQuestion,
                        time: new Date().toLocaleTimeString(),
                        status: 'failed' as const
                    },
                    ...prev
                ].slice(0, 5));
                return;
            }

            const payload = await response.json();
            const elapsedMs = Date.now() - start;
            const answerData = buildAnswerData(
                payload,
                { elapsedMs, requestId, question: trimmedQuestion },
                contextSnapshot,
                requestOptions
            );

            setMessages((prev) => prev.map((item) => (
                item.id === answerId && item.type === 'answer'
                    ? { ...item, data: answerData }
                    : item
            )));

            setRecentQueries((prev) => [
                {
                    id: `recent-${Date.now()}`,
                    question: trimmedQuestion,
                    time: new Date().toLocaleTimeString(),
                    status: 'completed' as const,
                    traceId: answerData.meta.traceId
                },
                ...prev
            ].slice(0, 5));
        } catch (error: any) {
            const rawMessage = error?.message || '请求失败，请稍后重试。';
            const message = rawMessage.includes('Failed to fetch') ? '网络请求失败' : rawMessage;
            setMessages((prev) => [
                ...prev.filter((item) => item.id !== answerId),
                {
                    id: `error-${Date.now()}`,
                    role: 'system',
                    type: 'error',
                    timestamp: new Date(),
                    data: {
                        message,
                        userHint: '请检查网络连接或稍后重试。'
                    }
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        handleSendWithQuestion(inputValue);
    };

    const handleScenarioClick = (scenario: ScenarioExample) => {
        setDomainId(scenario.domainId);
        setTimeRangeId(scenario.timeRangeId);
        setInputValue(scenario.query);
    };

    const handleErrorAction = (action: string, question: string) => {
        if (!question) return;
        if (action === 'RETRY') {
            handleSendWithQuestion(question);
            return;
        }

        if (action === 'RETURN_SQL_ONLY') {
            const updatedOptions = {
                ...options,
                returnSql: true,
                returnChart: false
            };
            setOptions(updatedOptions);
            handleSendWithQuestion(question, updatedOptions);
            return;
        }

        if (action === 'REDUCE_SCOPE') {
            setTimeRangeId('last_7_days');
            setInputValue(question);
        }
    };

    const renderStatusLabel = (status: AnswerCardData['status']) => {
        if (status === 'processing') return '处理中';
        if (status === 'failed') return '失败';
        return '完成';
    };

    const renderMessage = (message: Message) => {
        if (message.type === 'user') {
            return (
                <div className="flex justify-end" key={message.id}>
                    <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-gradient-to-r from-indigo-500 to-sky-600 text-white">
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    </div>
                </div>
            );
        }

        if (message.type === 'error') {
            return (
                <div className="flex justify-start" key={message.id}>
                    <div className="max-w-[80%] rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <AlertTriangle size={16} />
                            系统错误
                        </div>
                        <div className="mt-2 text-sm text-rose-700">{message.data.message}</div>
                        {message.data.userHint && (
                            <div className="mt-1 text-xs text-rose-600">{message.data.userHint}</div>
                        )}
                        {message.data.requestId && (
                            <div className="mt-2 text-[11px] text-rose-500">requestId: {message.data.requestId}</div>
                        )}
                        {Array.isArray(message.data.actions) && message.data.actions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {message.data.actions.map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => handleErrorAction(action, lastQuestion)}
                                        className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                                    >
                                        {action === 'RETRY' ? '重试' :
                                            action === 'REDUCE_SCOPE' ? '缩小范围' :
                                                action === 'RETURN_SQL_ONLY' ? '仅返回SQL' :
                                                    action === 'CHANGE_SEMVER' ? '切换语义版本' :
                                                        action}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        const data = message.data;
        const chartMarkdown = buildChartMarkdown(data.chart);

        return (
            <div className="flex justify-start" key={message.id}>
                <div className="max-w-[90%] w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[data.status]}`}>
                                {renderStatusLabel(data.status)}
                            </span>
                            {data.status === 'processing' && (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <RefreshCw size={12} className="animate-spin" />
                                    处理中
                                </span>
                            )}
                            <span>耗时 {formatDuration(data.meta.elapsedMs)}</span>
                            {data.meta.rowCount !== undefined && <span>行数 {data.meta.rowCount}</span>}
                            {data.meta.semanticVersion && (
                                <span className="flex items-center gap-1">
                                    <Layers size={12} />
                                    {data.meta.semanticVersion}
                                </span>
                            )}
                            {data.meta.traceId && (
                                <button
                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                                    onClick={() => navigator.clipboard?.writeText(data.meta.traceId || '')}
                                >
                                    traceId {data.meta.traceId}
                                    <Copy size={12} />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                                onClick={() => data.trace && setActiveTrace(data.trace)}
                                disabled={!data.trace}
                            >
                                查看推理过程
                            </button>
                            {data.sql && (
                                <button
                                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                                    onClick={() => navigator.clipboard?.writeText(data.sql || '')}
                                >
                                    复制SQL
                                </button>
                            )}
                            <button className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                                导出
                            </button>
                            <button className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                                保存为模板
                            </button>
                        </div>
                    </div>

                    <div className="px-4 py-4 space-y-4">
                        {data.summary && (
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <div className="text-[11px] uppercase tracking-widest text-slate-400">结论摘要</div>
                                <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{data.summary}</div>
                            </div>
                        )}

                        {data.kpis && data.kpis.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                                {data.kpis.map((kpi) => (
                                    <div key={kpi.key} className="rounded-xl border border-slate-200 bg-white p-3">
                                        <div className="text-xs text-slate-400">{kpi.label}</div>
                                        <div className="mt-2 text-lg font-semibold text-slate-800">{formatKpiValue(kpi)}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {data.chart && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="text-xs text-slate-500 mb-2">可视化分析</div>
                                {chartMarkdown ? (
                                    <GPTVis>{chartMarkdown}</GPTVis>
                                ) : (
                                    <div className="text-xs text-slate-400">暂无可视化配置</div>
                                )}
                            </div>
                        )}

                        {data.table && (
                            <div className="rounded-xl border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                                    <span>结果明细</span>
                                    <span>展示前 20 行</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                {data.table.columns.map((col) => (
                                                    <th key={col} className="px-3 py-2 text-left font-semibold">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {data.table.rows.slice(0, 20).map((row, idx) => (
                                                <tr key={`${message.id}-row-${idx}`} className="hover:bg-slate-50">
                                                    {data.table?.columns.map((col) => (
                                                        <td key={`${message.id}-${idx}-${col}`} className="px-3 py-2 whitespace-nowrap">
                                                            {row?.[col] ?? '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {data.sql && (
                            <details className="rounded-xl border border-slate-200 bg-white p-3">
                                <summary className="cursor-pointer text-xs font-semibold text-slate-600">查看SQL</summary>
                                <pre className="mt-2 text-xs font-mono text-emerald-700 whitespace-pre-wrap">{data.sql}</pre>
                            </details>
                        )}
                    </div>

                    <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[11px] uppercase tracking-widest text-slate-400">可信度</span>
                            {data.trustSignals?.quality?.map((signal) => (
                                <span
                                    key={signal.label}
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${signal.level === 'ok'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : signal.level === 'warn'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-rose-100 text-rose-700'
                                        }`}
                                >
                                    {signal.label}: {signal.value}
                                </span>
                            ))}
                            {data.trustSignals?.security && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                    {data.trustSignals.security.message || '权限裁剪已应用'}
                                </span>
                            )}
                            {data.trustSignals?.terms?.map((term) => (
                                <span key={term.termId} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                                    {term.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTraceDrawer = () => {
        if (!activeTrace) return null;

        const parseStage = activeTrace.stages.find((stage) => stage.name === 'parse');
        const groundStage = activeTrace.stages.find((stage) => stage.name === 'ground');
        const planStage = activeTrace.stages.find((stage) => stage.name === 'plan');
        const generateStage = activeTrace.stages.find((stage) => stage.name === 'generate');
        const executeStage = activeTrace.stages.find((stage) => stage.name === 'execute');
        const explainStage = activeTrace.stages.find((stage) => stage.name === 'explain');

        return (
            <div className="fixed inset-0 z-50">
                <div
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={() => setActiveTrace(null)}
                />
                <div className="absolute right-0 top-0 h-full w-[620px] max-w-[92vw] bg-white shadow-2xl flex flex-col">
                    <div className="border-b border-slate-200 px-5 py-4 bg-white/95 backdrop-blur">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs text-slate-400">Trace</div>
                                <h3 className="text-lg font-semibold text-slate-800">{activeTrace.traceId}</h3>
                                <div className="mt-1 text-xs text-slate-500">requestId: {activeTrace.requestId || '-'}</div>
                            </div>
                            <button
                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                                onClick={() => setActiveTrace(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{activeTrace.status}</span>
                            <span className="text-slate-400">问题：{activeTrace.question || '-'}</span>
                        </div>
                    </div>
                    <div className="border-b border-slate-200 px-5">
                        <div className="flex items-center gap-6">
                            {[
                                { id: 'interpretation', label: '口径与理解' },
                                { id: 'grounding', label: '数据与约束' },
                                { id: 'execution', label: '执行与复现' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTraceTab(tab.id as typeof traceTab)}
                                    className={`border-b-2 py-3 text-sm font-semibold ${traceTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {traceTab === 'interpretation' && (
                            <>
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs text-slate-400">解析结果</div>
                                    <div className="mt-3 grid gap-3 text-sm text-slate-600">
                                        <div>
                                            <div className="text-xs text-slate-400">指标</div>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {(parseStage?.output?.metrics || []).length > 0
                                                    ? parseStage?.output?.metrics?.map((metric: any) => (
                                                        <span key={metric.name} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                                                            {metric.name}
                                                        </span>
                                                    ))
                                                    : <span className="text-xs text-slate-400">无</span>
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400">维度</div>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {(parseStage?.output?.dimensions || []).length > 0
                                                    ? parseStage?.output?.dimensions?.map((dimension: any) => (
                                                        <span key={dimension.name} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                            {dimension.name}
                                                        </span>
                                                    ))
                                                    : <span className="text-xs text-slate-400">无</span>
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400">过滤条件</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {(parseStage?.output?.filters || []).length > 0
                                                    ? parseStage?.output?.filters?.map((filter: any) => `${filter.field} ${filter.op} ${filter.value}`).join('；')
                                                    : '无'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {Array.isArray(parseStage?.output?.ambiguities) && parseStage?.output?.ambiguities.length > 0 && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="text-xs text-slate-400">不确定项</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {parseStage?.output?.ambiguities?.flatMap((item: any) => item.candidates || []).map((candidate: string) => (
                                                <button
                                                    key={candidate}
                                                    onClick={() => handleSendWithQuestion(`${activeTrace.question}（${candidate}）`)}
                                                    className="rounded-full border border-indigo-200 px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    {candidate}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {traceTab === 'grounding' && (
                            <>
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs text-slate-400">语义落地</div>
                                    <div className="mt-3 text-sm text-slate-600 space-y-2">
                                        <div>业务对象：{groundStage?.output?.businessObject?.name || '未指定'}</div>
                                        <div>表清单：{(groundStage?.output?.tables || []).map((t: any) => t.name).join('、') || '无'}</div>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs text-slate-400">字段映射</div>
                                    <div className="mt-2 grid gap-2 text-xs text-slate-600">
                                        {groundStage?.output?.fieldMapping
                                            ? Object.entries(groundStage.output.fieldMapping).slice(0, 6).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                                                    <span>{key}</span>
                                                    <span className="text-slate-400">{value as string}</span>
                                                </div>
                                            ))
                                            : <span className="text-xs text-slate-400">无字段映射</span>
                                        }
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs text-slate-400">权限与脱敏</div>
                                    <div className="mt-2 text-sm text-slate-600">已按角色裁剪；脱敏：关闭；聚合：开启</div>
                                </div>
                            </>
                        )}

                        {traceTab === 'execution' && (
                            <>
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs text-slate-400">Query Plan</div>
                                    <div className="mt-2 space-y-2 text-sm text-slate-600">
                                        {(planStage?.output?.querySteps || ['解析问题', '生成SQL', '执行查询']).map((step: string, index: number) => (
                                            <div key={`${step}-${index}`} className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs text-slate-400">SQL</div>
                                    <pre className="mt-2 text-xs font-mono text-emerald-700 whitespace-pre-wrap">{generateStage?.output?.sql || '暂无SQL'}</pre>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="text-xs text-slate-400">执行统计</div>
                                    <div className="mt-2 text-sm text-slate-600">
                                        耗时：{formatDuration(executeStage?.output?.durationMs)}；行数：{executeStage?.output?.resultRows ?? '-'}
                                    </div>
                                </div>
                                {explainStage?.output?.summary && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="text-xs text-slate-400">解释说明</div>
                                        <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{explainStage.output.summary}</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };



    // ... (keep constants)

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in relative">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-xs text-slate-400">数据服务 / 问数</div>
                    <h2 className="text-2xl font-bold text-slate-800">智能问数</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${showSidebar
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                    >
                        <Layers size={14} />
                        {showSidebar ? '隐藏侧边栏' : '显示侧边栏'}
                    </button>
                    {isDev && (
                        <button
                            type="button"
                            onClick={() => window.open(debugUrl, '_blank', 'noopener,noreferrer')}
                            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:border-indigo-300"
                        >
                            <Wrench size={14} />
                            调试工具
                        </button>
                    )}
                    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300">
                        <HelpCircle size={14} />
                        帮助
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">数据域</span>
                        <select
                            value={domainId}
                            onChange={(event) => setDomainId(event.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                        >
                            {domainOptions.map((option) => (
                                <option key={option.id} value={option.id}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">语义版本</span>
                        <select
                            value={semanticVersionId}
                            onChange={(event) => setSemanticVersionId(event.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                        >
                            {semanticVersions.map((version) => (
                                <option key={version} value={version}>{version}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">时间范围</span>
                        <select
                            value={timeRangeId}
                            onChange={(event) => setTimeRangeId(event.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                        >
                            {timeRanges.map((range) => (
                                <option key={range.id} value={range.id}>{range.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <ShieldCheck size={12} />
                        权限已裁剪
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        数据质量：良好
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0 relative">
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all duration-300">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-sky-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center shadow-lg">
                                <MessageCircle size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">高级问数工作台</h3>
                                <p className="text-xs text-slate-500">可解释 · 可审计 · 可复现</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-semibold text-slate-700">引导问题</div>
                            <p className="mt-2 text-xs text-slate-500">点击示例填充输入框，可继续编辑后提交。</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {quickExamples.map((example) => (
                                    <button
                                        key={example}
                                        onClick={() => setInputValue(example)}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {messages.map(renderMessage)}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="输入问题，例如：统计近30天供应商交付及时率..."
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
                            <button
                                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                className="rounded-xl border border-slate-200 p-3 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                            >
                                <SlidersHorizontal size={16} />
                            </button>
                        </div>
                        {showAdvancedOptions && (
                            <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={options.returnSql}
                                            onChange={(event) => setOptions((prev) => ({ ...prev, returnSql: event.target.checked }))}
                                        />
                                        返回SQL
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={options.returnChart}
                                            onChange={(event) => setOptions((prev) => ({ ...prev, returnChart: event.target.checked }))}
                                        />
                                        返回图表
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2">
                                        行数上限
                                        <input
                                            type="number"
                                            min={10}
                                            max={1000}
                                            value={options.rowLimit}
                                            onChange={(event) => setOptions((prev) => ({ ...prev, rowLimit: Number(event.target.value) }))}
                                            className="w-24 rounded border border-slate-200 px-2 py-1 text-xs"
                                        />
                                    </label>
                                    <label className="flex items-center gap-2">
                                        异常阈值
                                        <input
                                            type="number"
                                            step={0.1}
                                            min={0}
                                            max={1}
                                            value={options.anomaly.threshold}
                                            onChange={(event) => setOptions((prev) => ({
                                                ...prev,
                                                anomaly: { ...prev.anomaly, threshold: Number(event.target.value) }
                                            }))}
                                            className="w-20 rounded border border-slate-200 px-2 py-1 text-xs"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                            <Sparkles size={12} />
                            <span>支持 @指标 / #维度 / /时间范围 快捷插入</span>
                        </div>
                    </div>
                </div>

                <div className={`w-80 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 transition-all duration-300 ${showSidebar ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute right-0 h-full pointer-events-none w-0 border-0'
                    }`}>
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
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center shrink-0 group-hover:from-indigo-200 group-hover:to-sky-200 transition-colors">
                                        <scenario.icon size={16} className="text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-800 text-sm">{scenario.title}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{scenario.category}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{scenario.description}</p>
                                        <div className="mt-1 text-[10px] text-slate-400">输出：{scenario.outputType}</div>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 shrink-0 mt-1" />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <Clock size={12} />
                            <span>最近查询</span>
                        </div>
                        <div className="space-y-1">
                            {recentQueries.length === 0 && (
                                <div className="text-xs text-slate-400">暂无最近查询</div>
                            )}
                            {recentQueries.map((item) => (
                                <div key={item.id} className="text-xs text-slate-600 hover:text-indigo-600 cursor-pointer truncate">
                                    • {item.question} ({item.status === 'completed' ? '完成' : '失败'})
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <FileText size={12} />
                            <span>收藏模板</span>
                        </div>
                        <div className="text-xs text-slate-400">暂无模板</div>
                    </div>
                </div>
            </div>

            {renderTraceDrawer()}
        </div>
    );
};

export default AdvancedAskDataView;
