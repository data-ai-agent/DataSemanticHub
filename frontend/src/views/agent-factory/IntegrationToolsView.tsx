
import React, { useState } from 'react';
import {
    Search, Filter, Wrench, Database, Globe, Terminal, Mail,
    Plus, MoreHorizontal, AlertCircle, CheckCircle, Clock,
    Shield, Play, X, Save, Trash2, Copy, FileJson, Zap, Lock,
    ChevronRight, ChevronDown, Activity, Code, Server, HelpCircle,
    GitBranch, AlertOctagon, Layers, User, Tag, ToggleRight, ToggleLeft,
    RotateCcw, History, FileText, Settings, ArrowRight, ArrowLeft, Loader2,
    Share2, Box, BarChart2, ExternalLink
} from 'lucide-react';

// --- Domain Types ---

type ToolLifecycle = 'DRAFT' | 'CANARY' | 'PUBLISHED' | 'DEPRECATED' | 'DISABLED';
type ToolKind = 'RETRIEVAL' | 'ACTION' | 'TRANSFORM' | 'VALIDATE' | 'ROUTING';
type ToolSource = 'BUILTIN' | 'HTTP' | 'MCP';
type RiskLevel = 'NORMAL' | 'SENSITIVE' | 'CRITICAL';

interface ToolPolicy {
    timeoutMs: number;
    maxRetries: number;
    circuitBreaker: boolean;
    fallbackToolId?: string;
}

interface ToolVersion {
    version: string;
    createdAt: string;
    createdBy: string;
    changelog: string;
}

interface Tool {
    id: string;
    name: string; // Unique Identifier
    displayName: string;

    // Classification
    kind: ToolKind;
    source: ToolSource;
    sourceDetail?: string; // URL, MCP URI, or Op ID

    // Lifecycle & Governance
    lifecycle: ToolLifecycle;
    activeVersion: string;
    versions: ToolVersion[];

    description: string;

    // Governance Metadata
    governance: {
        owner: string;
        riskLevel: RiskLevel;
        accessScope: ('GLOBAL' | 'TENANT' | 'DEPT')[];
        referenceCount: number;
        hasSideEffect: boolean;
    };

    // Contracts
    schema: {
        input: string; // JSON Schema string
        output: string; // JSON Schema string
    };

    // Operational
    stats: {
        successRate: number;
        latencyP95: number;
        usage7d: number;
    };

    policy: ToolPolicy;
    authType: 'NONE' | 'API_KEY' | 'OAUTH' | 'INTERNAL';
}

// --- Mock Data ---

const MOCK_TOOLS: Tool[] = [
    {
        id: 't_sql_gen', name: 'sql_query_generator', displayName: 'SQL 查询生成器',
        kind: 'TRANSFORM', source: 'BUILTIN', sourceDetail: 'op_sql_gen_v2',
        lifecycle: 'PUBLISHED', activeVersion: 'v2.1.0',
        versions: [{ version: 'v2.1.0', createdAt: '2023-10-01', createdBy: 'Admin', changelog: 'Fix dialect' }],
        description: '基于自然语言生成适用于 Snowflake 的安全 SQL 查询语句，包含语法检查与表结构验证。',
        governance: { owner: 'Data Team', riskLevel: 'NORMAL', accessScope: ['GLOBAL'], referenceCount: 142, hasSideEffect: false },
        schema: {
            input: '{\n  "type": "object",\n  "properties": {\n    "question": { "type": "string" },\n    "dialect": { "type": "string", "enum": ["snowflake", "postgres"] }\n  },\n  "required": ["question"]\n}',
            output: '{\n  "type": "object",\n  "properties": {\n    "sql": { "type": "string" },\n    "explanation": { "type": "string" }\n  }\n}'
        },
        stats: { successRate: 99.2, latencyP95: 450, usage7d: 12400 },
        policy: { timeoutMs: 5000, maxRetries: 3, circuitBreaker: true },
        authType: 'INTERNAL'
    },
    {
        id: 't_google_search', name: 'google_search_api', displayName: '谷歌联网搜索',
        kind: 'RETRIEVAL', source: 'HTTP', sourceDetail: 'https://customsearch.googleapis.com/v1',
        lifecycle: 'PUBLISHED', activeVersion: 'v1.0.0',
        versions: [],
        description: '调用 Google Custom Search JSON API 进行实时联网信息检索。',
        governance: { owner: 'Platform Eng', riskLevel: 'NORMAL', accessScope: ['GLOBAL'], referenceCount: 56, hasSideEffect: false },
        schema: {
            input: '{\n  "query": "string",\n  "num": "number"\n}',
            output: '{\n  "items": []\n}'
        },
        stats: { successRate: 96.5, latencyP95: 1200, usage7d: 3500 },
        policy: { timeoutMs: 10000, maxRetries: 2, circuitBreaker: true },
        authType: 'API_KEY'
    }
];

// --- Helpers ---

const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
        case 'NORMAL': return <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">普通</span>;
        case 'SENSITIVE': return <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-medium flex items-center"><AlertCircle className="w-3 h-3 mr-1" />敏感</span>;
        case 'CRITICAL': return <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 font-bold flex items-center"><AlertOctagon className="w-3 h-3 mr-1" />高危</span>;
    }
};

const getLifecycleBadge = (status: ToolLifecycle) => {
    switch (status) {
        case 'DRAFT': return <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">DRAFT</span>;
        case 'CANARY': return <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold border border-indigo-100">CANARY</span>;
        case 'PUBLISHED': return <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100">PUBLISHED</span>;
        case 'DEPRECATED': return <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold border border-amber-100 line-through">DEPRECATED</span>;
        case 'DISABLED': return <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">DISABLED</span>;
    }
};

const getKindIcon = (kind: ToolKind) => {
    switch (kind) {
        case 'RETRIEVAL': return <Database className="w-4 h-4 text-blue-500" />;
        case 'ACTION': return <Zap className="w-4 h-4 text-amber-500" />;
        case 'TRANSFORM': return <Code className="w-4 h-4 text-purple-500" />;
        case 'VALIDATE': return <Shield className="w-4 h-4 text-emerald-500" />;
        case 'ROUTING': return <GitBranch className="w-4 h-4 text-slate-500" />;
    }
};

// --- Components ---

const ToolCard: React.FC<{ tool: Tool; onClick: () => void }> = ({ tool, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative hover:border-indigo-300"
    >
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-colors relative">
                    {getKindIcon(tool.kind)}
                    <div className="absolute -bottom-1 -right-2 bg-white border border-slate-200 text-[8px] px-1 rounded text-slate-500 uppercase font-bold shadow-sm transform scale-75 origin-left">
                        {tool.source}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center">
                        {tool.displayName}
                        {tool.governance.hasSideEffect && (
                            <span title="Has Side Effects">
                                <Zap className="w-3 h-3 text-amber-500 ml-1.5 fill-amber-500" />
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center">
                        {tool.name}
                        <span className="mx-1.5 text-slate-300">|</span>
                        <span className="text-indigo-600 font-medium">{tool.activeVersion}</span>
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end space-y-1.5">
                {getLifecycleBadge(tool.lifecycle)}
                {getRiskBadge(tool.governance.riskLevel)}
            </div>
        </div>

        <p className="text-xs text-slate-600 mb-4 line-clamp-2 h-8 leading-relaxed">
            {tool.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-500">
            <div className="flex items-center space-x-3">
                <div className="flex items-center" title="引用数">
                    <Layers className="w-3 h-3 mr-1 text-slate-400" />
                    <span className="font-medium">{tool.governance.referenceCount}</span>
                </div>
                <div className="flex items-center" title="Owner">
                    <User className="w-3 h-3 mr-1 text-slate-400" />
                    <span>{tool.governance.owner}</span>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <div className="flex items-center">
                    <Activity className={`w-3 h-3 mr-1 ${tool.stats.successRate > 99 ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span className="font-mono">{tool.stats.successRate}%</span>
                </div>
            </div>
        </div>
    </div>
);

// --- Wizard Component ---

const ToolRegistrationWizard = ({ onClose, onSave }: { onClose: () => void, onSave: (t: Tool) => void }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<Tool>>({
        id: `t_${Date.now()}`,
        name: '', displayName: '', kind: 'RETRIEVAL', source: 'HTTP',
        lifecycle: 'DRAFT', activeVersion: 'v0.1.0', versions: [], description: '',
        governance: { owner: '', riskLevel: 'NORMAL', accessScope: ['GLOBAL'], referenceCount: 0, hasSideEffect: false },
        schema: { input: '{\n  "type": "object",\n  "properties": {}\n}', output: '{}' },
        stats: { successRate: 0, latencyP95: 0, usage7d: 0 },
        policy: { timeoutMs: 5000, maxRetries: 1, circuitBreaker: true }, authType: 'NONE'
    });

    const updateGovernance = (field: keyof Tool['governance'], value: any) => {
        setFormData(prev => ({
            ...prev,
            governance: { ...prev.governance!, [field]: value }
        }));
    };

    const updatePolicy = (field: keyof ToolPolicy, value: any) => {
        setFormData(prev => ({
            ...prev,
            policy: { ...prev.policy!, [field]: value }
        }));
    };

    const updateSchema = (field: keyof Tool['schema'], value: any) => {
        setFormData(prev => ({
            ...prev,
            schema: { ...prev.schema!, [field]: value }
        }));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">注册新工具 (Register Tool)</h2>
                        <div className="flex items-center space-x-2 mt-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-indigo-600' : 'w-4 bg-slate-200'}`} />
                            ))}
                            <span className="text-xs text-slate-500 ml-2">Step {step} of 3: {step === 1 ? '基本信息' : step === 2 ? '接口定义' : '治理策略'}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right duration-300">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">显示名称 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="E.g. Get User Info"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">唯一标识 (ID) <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                        placeholder="get_user_info"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">工具类型</label>
                                    <select
                                        value={formData.kind}
                                        onChange={e => setFormData({ ...formData, kind: e.target.value as ToolKind })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="RETRIEVAL">数据检索 (RETRIVAL)</option>
                                        <option value="ACTION">执行动作 (ACTION)</option>
                                        <option value="TRANSFORM">数据转换 (TRANSFORM)</option>
                                        <option value="VALIDATE">规则校验 (VALIDATE)</option>
                                        <option value="ROUTING">逻辑路由 (ROUTING)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">来源类型</label>
                                    <select
                                        value={formData.source}
                                        onChange={e => setFormData({ ...formData, source: e.target.value as ToolSource })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="HTTP">HTTP API</option>
                                        <option value="MCP">MCP Connector</option>
                                        <option value="BUILTIN">Internal Function</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">工具描述</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                    placeholder="描述该工具的功能、用途及使用场景..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Configuration */}
                    {step === 2 && (
                        <div className="space-y-6 max-w-3xl mx-auto animate-in slide-in-from-right duration-300">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {formData.source === 'HTTP' ? 'Target URL' : formData.source === 'MCP' ? 'MCP URI' : 'Handler ID'} <span className="text-red-500">*</span>
                                </label>
                                <div className="flex">
                                    <div className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-md px-3 flex items-center text-slate-500 text-sm font-mono">
                                        {formData.source === 'HTTP' ? 'POST' : 'URI'}
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.sourceDetail || ''}
                                        onChange={e => setFormData({ ...formData, sourceDetail: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-r-md focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                        placeholder={formData.source === 'HTTP' ? 'https://api.example.com/v1/resource' : 'mcp://service/resource'}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">认证方式</label>
                                    <select
                                        value={formData.authType}
                                        onChange={e => setFormData({ ...formData, authType: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="NONE">无认证 (Anonymous)</option>
                                        <option value="API_KEY">API Key</option>
                                        <option value="OAUTH">OAuth 2.0</option>
                                        <option value="INTERNAL">Internal IAM</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 h-[300px]">
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Input Schema (JSON Schema)</label>
                                    <textarea
                                        value={formData.schema?.input}
                                        onChange={e => updateSchema('input', e.target.value)}
                                        className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs bg-slate-50 resize-none"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Output Schema (JSON Schema)</label>
                                    <textarea
                                        value={formData.schema?.output}
                                        onChange={e => updateSchema('output', e.target.value)}
                                        className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs bg-slate-50 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Governance */}
                    {step === 3 && (
                        <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right duration-300">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">负责人 (Owner)</label>
                                    <input
                                        type="text"
                                        value={formData.governance?.owner}
                                        onChange={e => updateGovernance('owner', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="LDAP username"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">风险等级</label>
                                    <select
                                        value={formData.governance?.riskLevel}
                                        onChange={e => updateGovernance('riskLevel', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="NORMAL">普通 (Normal)</option>
                                        <option value="SENSITIVE">敏感 (Sensitive)</option>
                                        <option value="CRITICAL">高危 (Critical)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                                <h4 className="font-medium text-slate-900 text-sm">稳定性策略</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">超时时间 (ms)</label>
                                        <input
                                            type="number"
                                            value={formData.policy?.timeoutMs}
                                            onChange={e => updatePolicy('timeoutMs', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">最大重试次数</label>
                                        <input
                                            type="number"
                                            value={formData.policy?.maxRetries}
                                            onChange={e => updatePolicy('maxRetries', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="circuitBreaker"
                                        checked={formData.policy?.circuitBreaker}
                                        onChange={e => updatePolicy('circuitBreaker', e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    <label htmlFor="circuitBreaker" className="text-sm text-slate-700 cursor-pointer">启用自动熔断保护 (Circuit Breaker)</label>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="hasSideEffect"
                                    checked={formData.governance?.hasSideEffect}
                                    onChange={e => updateGovernance('hasSideEffect', e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <label htmlFor="hasSideEffect" className="text-sm text-slate-700 cursor-pointer flex items-center">
                                    此工具有副作用 (Side Effect)
                                    <Zap className="w-3 h-3 ml-1 text-amber-500" />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <button
                        onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
                        className="px-5 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                    >
                        {step === 1 ? '取消' : '上一步'}
                    </button>
                    <button
                        onClick={step === 3 ? () => onSave(formData as Tool) : () => setStep(s => s + 1)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center transition-colors"
                    >
                        {step === 3 ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" /> 完成注册
                            </>
                        ) : (
                            <>
                                下一步 <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ToolDetailDrawer = ({ tool: initialTool, onClose, onSave }: { tool: Tool, onClose: () => void, onSave: (t: Tool) => void }) => {
    const [tool, setTool] = useState<Tool>(initialTool);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCHEMA' | 'LINEAGE' | 'TEST'>('OVERVIEW');

    // Testing State
    const [testInput, setTestInput] = useState('{\n  "query": "example"\n}');
    const [testOutput, setTestOutput] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const handleRunTest = () => {
        setIsRunning(true);
        setTestOutput(null);
        setTimeout(() => {
            setIsRunning(false);
            setTestOutput('{\n  "status": "success",\n  "data": [\n    { "id": 1, "title": "Example Result" }\n  ],\n  "latency": 245\n}');
        }, 1200);
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[800px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">{getKindIcon(tool.kind)}</div>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-bold text-slate-900">{tool.displayName}</h2>
                            <div className="flex items-center space-x-2">
                                {getLifecycleBadge(tool.lifecycle)}
                                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">{tool.activeVersion}</span>
                            </div>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-1 font-mono space-x-3">
                            <span>ID: {tool.id}</span>
                            <span className="text-slate-300">|</span>
                            <span>Source: {tool.source}</span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><Settings className="w-5 h-5" /></button>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Navigation */}
            <div className="px-6 border-b border-slate-200 flex space-x-8">
                {[
                    { id: 'OVERVIEW', label: '概览', icon: Activity },
                    { id: 'SCHEMA', label: '契约定义', icon: FileJson },
                    { id: 'TEST', label: '在线调试', icon: Play },
                    { id: 'LINEAGE', label: '引用关系', icon: Share2 },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 text-sm font-medium transition-colors border-b-2 flex items-center ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">

                {/* 1. Overview Tab */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        {/* Metrics Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">7日调用量</div>
                                <div className="text-xl font-bold text-slate-800">{tool.stats.usage7d.toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">平均成功率</div>
                                <div className={`text-xl font-bold ${tool.stats.successRate > 99 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                    {tool.stats.successRate}%
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">P95 延迟</div>
                                <div className="text-xl font-bold text-slate-800">{tool.stats.latencyP95}ms</div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-bold text-sm text-slate-700">基础信息</div>
                            <div className="p-5 grid grid-cols-2 gap-y-6 gap-x-8">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">工具描述</label>
                                    <p className="text-sm text-slate-800 leading-relaxed">{tool.description}</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Source Detail</label>
                                    <div className="flex items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-200 text-xs font-mono text-slate-600 truncate">
                                        {tool.source === 'HTTP' ? <Globe className="w-3 h-3 mr-2" /> : <Code className="w-3 h-3 mr-2" />}
                                        {tool.sourceDetail || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">责任人 (Owner)</label>
                                    <div className="flex items-center text-sm text-slate-800">
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2">
                                            {tool.governance.owner[0]}
                                        </div>
                                        {tool.governance.owner}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">风险等级</label>
                                    <div className="flex items-center">
                                        {getRiskBadge(tool.governance.riskLevel)}
                                        {tool.governance.hasSideEffect && (
                                            <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center">
                                                <Zap className="w-3 h-3 mr-1" /> Side Effect
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Policy */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-bold text-sm text-slate-700">运行策略</div>
                            <div className="p-5 flex items-center space-x-8 text-sm">
                                <div>
                                    <span className="text-slate-500 mr-2">超时限制:</span>
                                    <span className="font-mono">{tool.policy.timeoutMs}ms</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 mr-2">重试次数:</span>
                                    <span className="font-mono">{tool.policy.maxRetries}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 mr-2">熔断保护:</span>
                                    <span className={`font-bold ${tool.policy.circuitBreaker ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {tool.policy.circuitBreaker ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Schema Tab */}
                {activeTab === 'SCHEMA' && (
                    <div className="grid grid-cols-1 gap-6 h-full">
                        <div className="flex flex-col h-1/2 min-h-[200px]">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    <ArrowRight className="w-3 h-3 mr-1 text-emerald-500" /> Input Schema (Parameters)
                                </label>
                                <button className="text-xs text-indigo-600 hover:underline flex items-center">
                                    <Copy className="w-3 h-3 mr-1" /> Copy JSON
                                </button>
                            </div>
                            <div className="flex-1 bg-slate-900 rounded-lg p-4 overflow-auto border border-slate-700 shadow-inner">
                                <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                                    {tool.schema.input}
                                </pre>
                            </div>
                        </div>
                        <div className="flex flex-col h-1/2 min-h-[200px]">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    <ArrowLeft className="w-3 h-3 mr-1 text-blue-500" /> Output Schema (Response)
                                </label>
                            </div>
                            <div className="flex-1 bg-slate-900 rounded-lg p-4 overflow-auto border border-slate-700 shadow-inner">
                                <pre className="text-xs font-mono text-blue-400 leading-relaxed">
                                    {tool.schema.output}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Test Tab */}
                {activeTab === 'TEST' && (
                    <div className="space-y-6 h-full flex flex-col">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                                <Terminal className="w-4 h-4 mr-2 text-indigo-600" /> 调试参数
                            </h4>
                            <textarea
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                className="w-full h-32 bg-white border border-slate-300 rounded-md p-3 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder="输入 JSON 参数..."
                            />
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={handleRunTest}
                                    disabled={isRunning}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center disabled:opacity-50 transition-all"
                                >
                                    {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                    {isRunning ? '执行中...' : '发起调用'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2">执行结果</label>
                            <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 p-4 overflow-auto font-mono text-xs">
                                {testOutput ? (
                                    <span className="text-emerald-400">{testOutput}</span>
                                ) : (
                                    <span className="text-slate-600">// 等待执行...</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Lineage Tab */}
                {activeTab === 'LINEAGE' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center">
                            <Layers className="w-5 h-5 text-blue-600 mr-3" />
                            <div>
                                <div className="text-sm font-bold text-blue-800">引用分析</div>
                                <div className="text-xs text-blue-600">当前共有 {tool.governance.referenceCount} 个下游资源依赖此工具。</div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">使用此工具的智能体 (Agents)</h4>
                            <div className="space-y-3">
                                {['Agent_Supply_Chain_Bot', 'Agent_Financial_Reporter', 'Agent_Customer_Support'].map((agent, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer group">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{agent}</div>
                                                <div className="text-xs text-slate-500">v1.2.0 • Active</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 mt-6">所属运行包 (Runtime Packs)</h4>
                            <div className="space-y-3">
                                {['Pack_Standard_QnA', 'Pack_Advanced_Analysis'].map((pack, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer group">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center text-purple-600 mr-3">
                                                <Box className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{pack}</div>
                                                <div className="text-xs text-slate-500">Global Strategy</div>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-purple-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center">
                <div className="text-xs text-slate-400 flex items-center">
                    <History className="w-3 h-3 mr-1" /> Last updated 2 days ago
                </div>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50">关闭</button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm">编辑配置</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const IntegrationToolsView: React.FC = () => {
    const [tools, setTools] = useState<Tool[]>(MOCK_TOOLS);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterKind, setFilterKind] = useState<ToolKind | 'ALL'>('ALL');
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const filteredTools = tools.filter(t =>
        (filterKind === 'ALL' || t.kind === filterKind) &&
        (t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.displayName.includes(searchQuery))
    );

    const handleSaveTool = (newTool: Tool) => {
        setTools([...tools, newTool]);
        setIsWizardOpen(false);
    };

    return (
        <div className="h-full flex flex-col relative bg-slate-50">

            {isWizardOpen && <ToolRegistrationWizard onClose={() => setIsWizardOpen(false)} onSave={handleSaveTool} />}

            {selectedTool && (
                <ToolDetailDrawer
                    tool={selectedTool}
                    onClose={() => setSelectedTool(null)}
                    onSave={() => setSelectedTool(null)}
                />
            )}

            {/* Filter Bar */}
            <div className="px-8 py-4 border-b border-slate-200 bg-white flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="搜索工具..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button onClick={() => setIsWizardOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 flex items-center transition-colors">
                        <Plus className="w-4 h-4 mr-2" /> 注册新工具
                    </button>
                </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onClick={() => setSelectedTool(tool)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IntegrationToolsView;
