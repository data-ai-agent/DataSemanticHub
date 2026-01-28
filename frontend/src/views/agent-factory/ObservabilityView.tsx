import React, { useState } from 'react';
import {
    Activity,
    CheckCircle,
    Clock,
    AlertTriangle,
    Zap,
    RefreshCw,
    Download,
    ChevronDown,
    Search,
    Filter,
    MoreHorizontal,
    PlayCircle
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// --- Mock Data ---

const MOCK_STATS = [
    {
        label: '总请求量 (REQUESTS)',
        value: '2.45M',
        change: '+12%',
        trend: 'up',
        desc: 'vs 24h ago',
        icon: Activity,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-600'
    },
    {
        label: '全局成功率',
        value: '99.42%',
        change: '-0.01%',
        trend: 'down',
        desc: 'vs 24h ago',
        icon: CheckCircle,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        iconBg: 'bg-emerald-500' // Green check
    },
    {
        label: 'P95 延迟',
        value: '820ms',
        change: '+45ms',
        trend: 'up',
        desc: 'vs 24h ago',
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
        highlight: true // The light purple background card
    },
    {
        label: '错误率 (ERROR RATE)',
        value: '0.58%',
        change: '+0.1%',
        trend: 'up',
        desc: 'vs 24h ago',
        icon: AlertTriangle,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        iconBg: 'bg-rose-500'
    },
    {
        label: '预估成本 (EST. COST)',
        value: '$142.5',
        change: 'On Budget',
        trend: 'neutral',
        desc: 'vs 24h ago',
        icon: Zap,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        iconBg: 'bg-violet-500'
    }
];

const TREND_DATA = Array.from({ length: 13 }).map((_, i) => {
    const time = `10:${i * 15 < 10 ? '0' + i * 15 : i * 15}`;
    return {
        time,
        p50: 100 + Math.random() * 50,
        p95: 350 + Math.random() * 100,
        p99: 700 + Math.random() * 300 + (i === 6 ? 400 : 0) // Peak in middle
    };
});

const COST_DATA = [
    { name: 'GPT-4 Turbo', value: 450, color: '#6366f1', price: '$450' },
    { name: 'Claude 3 Opus', value: 320, color: '#a855f7', price: '$320' },
    { name: 'Fine-tuned Llama', value: 150, color: '#10b981', price: '$150' },
    { name: 'Embedding APIs', value: 80, color: '#f59e0b', price: '$80' },
];

const ERROR_CLUSTERS = [
    {
        id: 'err_001',
        type: 'RateLimitExceeded',
        message: '429: Rate limit exceeded for model gpt-4-turbo-preview',
        active: true,
        agents: ['SupplyChain_Bot', 'Report_Gen'],
        count: 1420,
        lastSeen: '1m ago'
    },
    {
        id: 'err_002',
        type: 'SchemaValidationError',
        message: 'Invalid JSON format in tool output response',
        active: true,
        agents: ['Finance_Analyst'],
        count: 85,
        lastSeen: '12m ago'
    },
    {
        id: 'err_003',
        type: 'ContextWindowExceeded',
        message: 'Prompt tokens length 128k exceeds limit',
        active: false,
        agents: ['Legal_Review_Bot'],
        count: 12,
        lastSeen: '2h ago'
    }
];

// --- Components ---

const StatCard = ({ stat }: { stat: typeof MOCK_STATS[0] }) => (
    <div className={`p-5 rounded-xl border transition-all duration-200 hover:shadow-md ${stat.highlight ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </div>
            <div className={`p-2 rounded-lg ${stat.iconBg} text-white shadow-sm`}>
                <stat.icon size={20} />
            </div>
        </div>
        <div className="flex items-center text-xs">
            <span className={`font-medium ${stat.trend === 'up' && stat.label.includes('成功') ? 'text-emerald-600' : stat.trend === 'up' ? 'text-rose-600' : stat.trend === 'down' && stat.label.includes('成功') ? 'text-rose-600' : 'text-emerald-600'}`}>
                {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
            </span>
            <span className="ml-1.5 text-slate-400">{stat.desc}</span>
        </div>
    </div>
);

const ChartLegend = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center text-xs text-slate-500">
        <span className="w-2.5 h-1 rounded-full mr-1.5" style={{ backgroundColor: color }}></span>
        {label}
    </div>
);

const TraceDiagnosisDrawer = ({ isOpen, onClose, traceId }: { isOpen: boolean; onClose: () => void; traceId?: string }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} />
            <div className="w-[800px] bg-white shadow-2xl relative animate-in slide-in-from-right duration-200 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">Trace 诊断</h2>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">ERROR</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">
                            {traceId || 'tr_8912aa_sample'} • 2023-10-27 10:45:22
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                            <div className="text-xs text-slate-500 mb-1">总耗时</div>
                            <div className="text-xl font-bold text-slate-800">4500ms</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                            <div className="text-xs text-slate-500 mb-1">Token 消耗</div>
                            <div className="text-xl font-bold text-slate-800">1250</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                            <div className="text-xs text-slate-500 mb-1">预估成本</div>
                            <div className="text-xl font-bold text-slate-800">$0.08</div>
                        </div>
                    </div>

                    {/* Root Cause Alert */}
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-rose-700 text-sm">Root Cause Identified</div>
                            <div className="text-rose-600 text-sm mt-0.5">Tool Execution Timeout</div>
                        </div>
                    </div>

                    {/* Waterfall Chart */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-indigo-600" />
                            <h3 className="font-bold text-slate-900">执行时间轴 (Waterfall)</h3>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                            {/* Header Row */}
                            {/* Content Rows */}
                            <div className="bg-slate-50/50">
                                {[
                                    { name: 'Intent Classification', duration: '450ms', start: 0, width: 10, color: 'bg-indigo-500' },
                                    { name: 'Retrieve Context', duration: '1200ms', start: 10, width: 30, color: 'bg-emerald-500' },
                                    { name: 'Generate SQL', duration: '2500ms', start: 40, width: 55, color: 'bg-indigo-500' },
                                    { name: 'Execute SQL', duration: '100ms', start: 95, width: 2, color: 'bg-rose-500' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                        <div className="w-32 px-4 text-slate-600 truncate text-xs font-medium" title={item.name}>{item.name}</div>
                                        <div className="flex-1 px-4 relative h-6 flex items-center">
                                            <div className="absolute inset-x-4 h-full flex items-center">
                                                <div
                                                    className={`h-4 rounded-full ${item.color} opacity-80`}
                                                    style={{ width: `${item.width}%`, marginLeft: `${item.start}%` }}
                                                ></div>
                                            </div>
                                            {/* Grid lines background */}
                                            <div className="absolute inset-0 border-x border-slate-100 w-1/3 left-1/3 pointer-events-none"></div>
                                            <div className="absolute inset-0 border-r border-slate-100 w-1/3 left-2/3 pointer-events-none"></div>
                                        </div>
                                        <div className="w-20 px-4 text-right text-slate-500 font-mono text-xs">{item.duration}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Model</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Retrieval</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Tool</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Error</div>
                        </div>
                    </div>

                    {/* Follow-up Actions */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="font-bold text-slate-900">后续操作</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm">
                                <PlayCircle size={16} />
                                复现请求
                            </button>
                            <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors font-medium text-sm">
                                <span className="font-mono text-xs">sh</span>
                                复制 cURL
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ObservabilityView: React.FC = () => {
    const [timeRange, setTimeRange] = useState('1H');
    const [trendTab, setTrendTab] = useState<'latency' | 'errors'>('latency');
    const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 p-1 animate-fade-in relative">
            <TraceDiagnosisDrawer
                isOpen={!!selectedTraceId}
                onClose={() => setSelectedTraceId(null)}
                traceId={selectedTraceId || undefined}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">可观测性 (Observability)</h1>
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Healthy
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition-colors">
                        <RefreshCw size={16} />
                    </button>
                    <button className="flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors">
                        <Download size={16} className="mr-2" />
                        导出报表
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-4">
                <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium text-slate-600">
                    {['15m', '1H', '24H', '7D', 'Custom'].map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 rounded-md transition-all ${timeRange === range ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <div className="flex items-center gap-2">
                    {['生产环境 (PROD)', '所有实例', '所有模型'].map((label, idx) => (
                        <button key={idx} className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                            {label}
                            <ChevronDown size={14} className="ml-2 text-slate-400" />
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {MOCK_STATS.map((stat, i) => (
                    <StatCard key={i} stat={stat} />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Trend Analysis */}
                <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800">趋势分析 (Trend Analysis)</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-slate-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setTrendTab('latency')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${trendTab === 'latency' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    延迟 (Latency)
                                </button>
                                <button
                                    onClick={() => setTrendTab('errors')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${trendTab === 'errors' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    错误率 (Errors)
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <ChartLegend color="#10b981" label="P50" />
                                <ChartLegend color="#f59e0b" label="P95" />
                                <ChartLegend color="#ef4444" label="P99" />
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={TREND_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorP99" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorP95" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                />
                                <Area type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorP99)" />
                                <Area type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} fill="url(#colorP95)" />
                                <Area type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Attribution */}
                <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-1">成本归因 (Cost Attribution)</h3>
                    <p className="text-xs text-slate-500 mb-6">按模型/工具分摊的今日预估成本。</p>

                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <div className="relative w-[220px] h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={COST_DATA}
                                        innerRadius={75}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {COST_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-3xl font-bold text-slate-900">$142</div>
                                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">Total Today</div>
                            </div>
                        </div>

                        <div className="w-full mt-6 space-y-3">
                            {COST_DATA.map(item => (
                                <div key={item.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-slate-600">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-slate-900">{item.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Clusters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800">异常聚类 (Error Clusters)</h3>
                        <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-rose-200">
                            3 Active Issues
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="搜索错误信息..."
                                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 w-48 transition-all"
                            />
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">
                            仅看未处理
                        </button>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3">错误指纹 / 消息</th>
                            <th className="px-6 py-3">影响范围 (Agents)</th>
                            <th className="px-6 py-3">发生次数</th>
                            <th className="px-6 py-3">最近发生</th>
                            <th className="px-6 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                        {ERROR_CLUSTERS.map(error => (
                            <tr key={error.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold">
                                            {error.type}
                                        </span>
                                        {error.active && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                                    </div>
                                    <div className="text-slate-500 font-mono truncate max-w-sm" title={error.message}>
                                        {error.message}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {error.agents.map(agent => (
                                            <span key={agent} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                                {agent}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 text-base">{error.count.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {error.lastSeen}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedTraceId('tr_8912aa_sample')}
                                            className="px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 font-medium transition-colors"
                                        >
                                            诊断
                                        </button>
                                        <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded border border-slate-200 font-medium transition-colors">
                                            忽略
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ObservabilityView;
