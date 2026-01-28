
import React, { useState } from 'react';
import {
    CloudLightning, Key, FileText, Shield, Plus, Search, Activity,
    ArrowUpRight, AlertTriangle, CheckCircle, XCircle, Copy, Eye, EyeOff,
    BarChart2, PieChart, Lock, Globe, Terminal, Code, Layers, FileJson,
    ChevronRight, ChevronDown, RefreshCw, Zap
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, PieChart as RePieChart, Pie } from 'recharts';

// --- Types ---

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    scopes: {
        capabilities: string[]; // e.g. ['QNA', 'SEMANTIC']
        resources: string[];    // e.g. ['agent_supply_chain', '*']
    };
    quotas: {
        qps: number;
        concurrency: number;
        dailyLimit: number;
        dailyUsed: number;
        budgetMonthly: number;
        budgetUsed: number;
    };
    lastUsed: string;
    createdAt: string;
}

// --- Mock Data ---

const TRAFFIC_DATA = [
    { time: '00:00', calls: 1200, errors: 12 },
    { time: '04:00', calls: 800, errors: 5 },
    { time: '08:00', calls: 3500, errors: 45 },
    { time: '12:00', calls: 5200, errors: 80 },
    { time: '16:00', calls: 4800, errors: 62 },
    { time: '20:00', calls: 2100, errors: 20 },
];

const ERROR_DISTRIBUTION = [
    { name: '429 Rate Limit', value: 45, color: '#f59e0b' },
    { name: '400 Schema Error', value: 30, color: '#6366f1' },
    { name: '5xx Provider Error', value: 15, color: '#ef4444' },
    { name: '401 Auth Failed', value: 10, color: '#94a3b8' },
];

const TOP_CLIENTS = [
    { name: 'Supply Chain Dashboard', id: 'k_sc_dash', calls: '1.2M', p95: '450ms' },
    { name: 'Mobile App (Consumer)', id: 'k_app_main', calls: '850K', p95: '320ms' },
    { name: 'Data Pipeline ETL', id: 'k_etl_job', calls: '420K', p95: '1200ms' },
];

const TOP_AGENTS = [
    { name: 'Inventory Q&A', id: 'agent_inv_01', calls: '600K' },
    { name: 'Report Generator', id: 'agent_rep_02', calls: '350K' },
    { name: 'Risk Scanner', id: 'agent_risk_03', calls: '200K' },
];

const MOCK_KEYS: ApiKey[] = [
    {
        id: 'k1', name: 'Supply Chain App (Prod)', prefix: 'sk-prod-sc...', status: 'ACTIVE',
        scopes: { capabilities: ['QNA', 'REPORT'], resources: ['agent_sc_*'] },
        quotas: { qps: 100, concurrency: 20, dailyLimit: 100000, dailyUsed: 45000, budgetMonthly: 500, budgetUsed: 210 },
        lastUsed: '2分钟前', createdAt: '2023-12-01'
    },
    {
        id: 'k2', name: 'Data Science Sandbox', prefix: 'sk-dev-ds...', status: 'ACTIVE',
        scopes: { capabilities: ['*'], resources: ['*'] },
        quotas: { qps: 10, concurrency: 2, dailyLimit: 5000, dailyUsed: 120, budgetMonthly: 50, budgetUsed: 2.5 },
        lastUsed: '1天前', createdAt: '2024-01-10'
    }
];

const AGENT_DOCS = [
    {
        id: 'agent_sc_01', name: '供应链库存助手', version: 'v2.1.0',
        inputSchema: '{\n  "query": "string (required) - 自然语言问题",\n  "filters": {\n    "region": "string (enum: North, South)",\n    "category": "string"\n  }\n}',
        outputSchema: '{\n  "summary": "string - 回答摘要",\n  "data": [\n    { "sku": "string", "qty": "number", "status": "LOW|OK" }\n  ],\n  "traceId": "string"\n}'
    },
    {
        id: 'agent_fin_02', name: '财务报表生成器', version: 'v1.0.5',
        inputSchema: '{\n  "period": "YYYY-MM",\n  "type": "BALANCE_SHEET | INCOME_STMT"\n}',
        outputSchema: '{\n  "url": "string - PDF下载链接",\n  "generatedAt": "ISO8601"\n}'
    }
];

// --- Components ---

const StatusBadge = ({ status }: { status: ApiKey['status'] }) => {
    switch (status) {
        case 'ACTIVE': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE</span>;
        case 'REVOKED': return <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-bold">REVOKED</span>;
        case 'EXPIRED': return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">EXPIRED</span>;
        case null: return null;
        case undefined: return null;
        default: return null;
    }
};

const KeyDrawer = ({ keyData, onClose, onSave }: { keyData?: ApiKey, onClose: () => void, onSave: (k: ApiKey) => void }) => {
    // Mock form state
    const [form, setForm] = useState<Partial<ApiKey>>(keyData || {
        name: '',
        scopes: { capabilities: ['QNA'], resources: ['*'] },
        quotas: { qps: 10, concurrency: 5, dailyLimit: 1000, dailyUsed: 0, budgetMonthly: 100, budgetUsed: 0 },
        status: 'ACTIVE'
    });

    return (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">{keyData ? '编辑 API Key' : '创建新 API Key'}</h2>
                <button onClick={onClose}><XCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Basic */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center"><Key className="w-4 h-4 mr-2 text-indigo-500" /> 基础信息</h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Key 名称 (Client ID)</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="e.g. Mobile App Production" />
                    </div>
                    {keyData && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">Token (Prefix)</label>
                            <div className="flex items-center space-x-2">
                                <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200 flex-1">{keyData.prefix}******</code>
                                <button className="text-xs text-indigo-600 hover:underline">重新生成</button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Scopes */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center"><Shield className="w-4 h-4 mr-2 text-indigo-500" /> 权限范围 (Scopes)</h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">允许的能力 (Capabilities)</label>
                            <div className="flex flex-wrap gap-2">
                                {['QNA', 'SEMANTIC', 'REPORT', 'AGENT', 'KG'].map(cap => (
                                    <label key={cap} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded border border-slate-200 cursor-pointer hover:border-indigo-300">
                                        <input type="checkbox" defaultChecked={form.scopes?.capabilities.includes(cap) || cap === 'QNA'} className="rounded text-indigo-600" />
                                        <span className="text-xs font-medium text-slate-700">{cap}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">资源白名单 (Resource IDs)</label>
                            <textarea
                                className="w-full border border-slate-300 rounded p-2 text-xs font-mono h-20"
                                placeholder="agent_id_1, agent_id_2 (Use * for all)"
                                defaultValue={form.scopes?.resources.join(', ')}
                            />
                        </div>
                    </div>
                </section>

                {/* Quotas */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center"><Activity className="w-4 h-4 mr-2 text-indigo-500" /> 配额与流控 (Quotas)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">QPS 限制</label>
                            <input type="number" value={form.quotas?.qps} onChange={e => setForm({ ...form, quotas: { ...form.quotas!, qps: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">并发限制 (Concurrency)</label>
                            <input type="number" value={form.quotas?.concurrency} onChange={e => setForm({ ...form, quotas: { ...form.quotas!, concurrency: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">日调用上限 (Daily Requests)</label>
                            <input type="number" value={form.quotas?.dailyLimit} onChange={e => setForm({ ...form, quotas: { ...form.quotas!, dailyLimit: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">月度预算 ($)</label>
                            <input type="number" value={form.quotas?.budgetMonthly} onChange={e => setForm({ ...form, quotas: { ...form.quotas!, budgetMonthly: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                        </div>
                    </div>
                </section>
            </div>

            <div className="p-5 border-t border-slate-200 bg-white flex justify-end space-x-3">
                <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50">取消</button>
                <button onClick={() => onSave(form as ApiKey)} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 shadow-sm">
                    保存 Key
                </button>
            </div>
        </div>
    );
};

const DocsViewer = () => {
    const [selectedAgent, setSelectedAgent] = useState(AGENT_DOCS[0]);
    const [lang, setLang] = useState<'CURL' | 'PYTHON' | 'JS'>('CURL');

    const getCodeSnippet = () => {
        if (lang === 'CURL') {
            return `curl -X POST https://api.semantics-platform.com/v1/agent/${selectedAgent.id}/run \\
  -H "Authorization: Bearer sk-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "inputs": {
        "query": "Check stock in North region"
    },
    "stream": false
  }'`;
        }
        return `# Python SDK Example\nimport semantics_ai\n\nclient = semantics_ai.Client(api_key="sk-...")\nresponse = client.agent.run(\n    agent_id="${selectedAgent.id}",\n    inputs={"query": "..."}\n)\nprint(response.data)`;
    };

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-200 bg-slate-50 overflow-y-auto p-4">
                <div className="text-xs font-bold text-slate-400 uppercase mb-3">选择模板版本</div>
                <div className="space-y-1">
                    {AGENT_DOCS.map(agent => (
                        <button
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent)}
                            className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center ${selectedAgent.id === agent.id ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <span className="truncate">{agent.name}</span>
                            <span className="text-[10px] bg-slate-200 px-1.5 rounded text-slate-500">{agent.version}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-8 text-xs font-bold text-slate-400 uppercase mb-3">通用指南</div>
                <div className="space-y-1 text-sm text-slate-600">
                    <div className="px-3 py-1.5 hover:bg-slate-100 rounded cursor-pointer">鉴权 (Authentication)</div>
                    <div className="px-3 py-1.5 hover:bg-slate-100 rounded cursor-pointer">错误码 (Errors)</div>
                    <div className="px-3 py-1.5 hover:bg-slate-100 rounded cursor-pointer">异步回调 (Webhook)</div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <h2 className="text-2xl font-bold text-slate-900">{selectedAgent.name}</h2>
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono font-bold">{selectedAgent.version}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-200 inline-block">
                            <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded font-bold text-xs">POST</span>
                            <span>/v1/agent/{selectedAgent.id}/run</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center"><FileJson className="w-4 h-4 mr-2 text-indigo-500" /> 输入参数 (Input Schema)</h3>
                            <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 overflow-x-auto">
                                {selectedAgent.inputSchema}
                            </pre>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center"><FileText className="w-4 h-4 mr-2 text-emerald-500" /> 输出结构 (Output Schema)</h3>
                            <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 overflow-x-auto">
                                {selectedAgent.outputSchema}
                            </pre>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center"><Terminal className="w-4 h-4 mr-2 text-slate-600" /> 调用示例</h3>
                            <div className="flex bg-slate-100 rounded p-1">
                                {['CURL', 'PYTHON', 'JS'].map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setLang(l as any)}
                                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${lang === l ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative bg-slate-900 rounded-lg p-5 overflow-hidden group">
                            <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
                                {getCodeSnippet()}
                            </pre>
                            <button className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

const IntegrationAPIServiceView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'KEYS' | 'DOCS'>('OVERVIEW');
    const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
    const [editingKey, setEditingKey] = useState<ApiKey | undefined>(undefined);
    const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">

            {isKeyDrawerOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" onClick={() => setIsKeyDrawerOpen(false)} />
            )}
            {isKeyDrawerOpen && (
                <KeyDrawer
                    keyData={editingKey}
                    onClose={() => setIsKeyDrawerOpen(false)}
                    onSave={(newKey) => {
                        if (editingKey) {
                            setKeys(keys.map(k => k.id === newKey.id ? newKey : k));
                        } else {
                            setKeys([...keys, { ...newKey, id: `k_${Date.now()}`, prefix: 'sk-new...', createdAt: '刚刚', lastUsed: '未使用' }]);
                        }
                        setIsKeyDrawerOpen(false);
                    }}
                />
            )}

            <div className="px-8 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">API 服务 (OpenAPI)</h1>
                    <p className="text-sm text-slate-500 mt-1">对外服务网关、鉴权管理与开发者文档。</p>
                </div>
                <div className="flex space-x-6">
                    {[
                        { id: 'OVERVIEW', label: '服务概览', icon: Activity },
                        { id: 'KEYS', label: 'Access Keys', icon: Key },
                        { id: 'DOCS', label: '契约文档', icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-2 text-sm font-medium transition-colors flex items-center border-b-2 ${activeTab === tab.id ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'
                                }`}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'OVERVIEW' && (
                    <div className="p-8 overflow-y-auto h-full space-y-8">
                        {/* Top KPIs */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 font-medium uppercase mb-2">总调用量 (24h)</div>
                                <div className="text-2xl font-bold text-indigo-600">2.45M</div>
                                <div className="text-xs text-emerald-600 flex items-center mt-1"><ArrowUpRight className="w-3 h-3 mr-1" /> +12%</div>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 font-medium uppercase mb-2">平均成功率</div>
                                <div className="text-2xl font-bold text-emerald-600">99.2%</div>
                                <div className="text-xs text-slate-400 mt-1">Stable</div>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 font-medium uppercase mb-2">全局 P95 延迟</div>
                                <div className="text-2xl font-bold text-slate-700">850ms</div>
                                <div className="text-xs text-rose-500 mt-1">Slightly High</div>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 font-medium uppercase mb-2">Schema 错误率</div>
                                <div className="text-2xl font-bold text-amber-500">0.8%</div>
                                <div className="text-xs text-slate-400 mt-1">Client Issues</div>
                            </div>
                        </div>

                        {/* Main Charts */}
                        <div className="grid grid-cols-3 gap-6 h-80">
                            <div className="col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">流量趋势 & 错误</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={TRAFFIC_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="calls" stroke="#6366f1" fillOpacity={0.1} fill="#6366f1" />
                                        <Area type="monotone" dataKey="errors" stroke="#ef4444" fillOpacity={0.1} fill="#ef4444" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">错误类型分布</h3>
                                <div className="flex-1 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie data={ERROR_DISTRIBUTION} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {ERROR_DISTRIBUTION.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {ERROR_DISTRIBUTION.map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="flex items-center text-slate-600">
                                                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                                {item.name}
                                            </span>
                                            <span className="font-mono text-slate-800">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Lists */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 text-sm">Top 客户端 (By Usage)</h3>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr><th className="px-6 py-2">Name</th><th className="px-6 py-2">Calls</th><th className="px-6 py-2">P95</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {TOP_CLIENTS.map((c, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-3 font-medium text-slate-700">{c.name}</td>
                                                <td className="px-6 py-3 font-mono text-indigo-600">{c.calls}</td>
                                                <td className="px-6 py-3 text-slate-500">{c.p95}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 text-sm">Top 热门智能体</h3>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr><th className="px-6 py-2">Agent Name</th><th className="px-6 py-2">ID</th><th className="px-6 py-2">Calls</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {TOP_AGENTS.map((a, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-3 font-medium text-slate-700">{a.name}</td>
                                                <td className="px-6 py-3 text-xs text-slate-400 font-mono">{a.id}</td>
                                                <td className="px-6 py-3 font-mono text-emerald-600">{a.calls}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'KEYS' && (
                    <div className="p-8 h-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">密钥管理 (Access Keys)</h3>
                            <button
                                onClick={() => { setEditingKey(undefined); setIsKeyDrawerOpen(true); }}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" /> 创建 Key
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {keys.map(key => (
                                <div key={key.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-indigo-200 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-slate-100 rounded text-slate-500">
                                                <Key className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-bold text-slate-800 text-base">{key.name}</h4>
                                                    <StatusBadge status={key.status} />
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5">{key.prefix}****************</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setEditingKey(key); setIsKeyDrawerOpen(true); }}
                                            className="text-xs border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 text-slate-600"
                                        >
                                            管理配置
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-6 text-sm border-t border-slate-100 pt-4">
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">能力范围 (Scopes)</div>
                                            <div className="flex flex-wrap gap-1">
                                                {key.scopes.capabilities.map(cap => (
                                                    <span key={cap} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{cap}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">QPS / 并发</div>
                                            <div className="font-mono text-slate-700">{key.quotas.qps} / {key.quotas.concurrency}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">今日用量 (Daily)</div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: `${(key.quotas.dailyUsed / key.quotas.dailyLimit) * 100}%` }}></div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1">{key.quotas.dailyUsed} / {key.quotas.dailyLimit}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 mb-1">最后活跃</div>
                                            <div className="text-slate-800">{key.lastUsed}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'DOCS' && <DocsViewer />}
            </div>
        </div>
    );
};

export default IntegrationAPIServiceView;
