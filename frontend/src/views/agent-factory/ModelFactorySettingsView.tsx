
import React, { useState } from 'react';
import {
    Settings, Key, Shield, Users, CreditCard, Cpu,
    Check, ToggleRight, ToggleLeft, AlertTriangle, Save, X,
    Globe, Server, Plus, Search, Eye, EyeOff, MoreHorizontal,
    CheckCircle, RefreshCw, Activity, Trash2, Copy, Lock, Link as LinkIcon,
    AlertCircle, Plug, Cloud, ArrowDownRight, ChevronRight, PieChart as PieChartIcon,
    Loader2, Shuffle, FileKey, ArrowUpDown, Network, Clock, AlertOctagon,
    Edit2, Terminal, Braces, DollarSign, Layers, Tag,
    Zap, GitBranch, Briefcase, Filter, User, History,
    Download, Upload, Bell, FileText, BarChart, ListFilter,
    Image as ImageIcon, FastForward, ArrowUpCircle, Wifi, ShieldCheck, Router,
    CornerDownRight, Workflow, MousePointerClick, Calendar, ArrowRight,
    Database, HardDrive, Box, ExternalLink, Bot, TrendingUp, FileWarning,
    Bug, Play, CheckCircle2, XCircle
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, ReferenceLine } from 'recharts';

type SettingsTab = 'MODELS' | 'SECRETS' | 'QUOTAS' | 'RBAC' | 'GUARDRAILS';

// --- Shared Types ---

interface GovernanceConfig {
    // Stability (P0)
    concurrencyLimit: number;
    requestTimeout: number; // ms

    // Retry (P0)
    maxRetries: number;
    retryBackoff: 'FIXED' | 'EXPONENTIAL';
    retryStatusCodes: string[]; // e.g. ['429', '500', '503']

    // Circuit Breaker (P0)
    circuitBreakerThreshold: number; // failures
    circuitBreakerReset: number; // seconds

    // Rate Limit (Existing P1)
    rateLimitRPM?: number;
    rateLimitTPM?: number;

    // Fallback & Degrade (P1)
    fallbackStrategy: 'NONE' | 'FALLBACK_MODEL' | 'FALLBACK_PROVIDER' | 'DEGRADE';
    fallbackTarget?: string; // Model ID or Provider ID

    degradeOptions: {
        useSmallerModel: boolean;
        disableTools: boolean;
        conciseReply: boolean;
    };
}

interface ModelDef {
    id: string;          // Native Model ID (Provider side)
    name: string;        // Platform Alias (Display name)
    enabled: boolean;
    contextWindow: number;
    maxOutputTokens?: number;
    inputPrice?: number; // per 1M tokens
    outputPrice?: number; // per 1M tokens

    // P0: Logical Aliases
    aliases: string[];

    // P0: Capabilities & Validation
    capabilities: {
        functionCall: boolean;
        jsonMode: boolean;
        vision: boolean;
        streaming: boolean;
    };

    // P1: Lifecycle & Deprecation
    lifecycle: {
        status: 'ACTIVE' | 'DEPRECATED' | 'EOL';
        eolDate?: string;
        replacedBy?: string;
    };

    // Routing Strategy
    routing: {
        stages: ('PARSE' | 'GENERATE' | 'EXPLAIN')[]; // Capabilities
        priority: number; // 1 (High) - 10 (Low)
    };

    // Optional Model-level governance override
    governance?: Partial<GovernanceConfig>;
}

type EndpointStatus = 'NOT_CONFIGURED' | 'READY' | 'PARTIAL' | 'UNAVAILABLE' | 'DISABLED';
type EnvType = 'DEV' | 'STAGING' | 'PROD';
type ProtocolType = 'OPENAI' | 'AZURE' | 'ANTHROPIC' | 'GOOGLE' | 'NATIVE' | 'LOCAL';

interface NetworkConfig {
    proxyUrl?: string;
    customHeaders: { key: string; value: string }[];
    skipTlsVerify: boolean;
    ipWhitelist?: string;
}

interface EndpointDef {
    id: string;
    name: string;
    environment: EnvType; // P0 Requirement: Environment Isolation
    protocol: ProtocolType; // P0 Requirement: Protocol Type
    baseUrl: string;
    apiKey: string;
    timeout: number; // ms
    retry: number;
    weight: number; // 0-100
    status: EndpointStatus;

    // P0 Requirement: Network & Security
    network: NetworkConfig;

    // P0 Requirement: Health Check Data
    health?: {
        latency: number;
        successRate: number; // Last 10 checks
        lastCheck: string;
        message?: string;
        statusCode?: number;
        details?: string; // detailed step trace
    };
}

interface ProviderDef {
    id: string;
    name: string;
    region: 'DOMESTIC' | 'FOREIGN' | 'LOCAL';
    description: string;
    endpoints: EndpointDef[]; // Replaces single apiKey/baseUrl
    models: ModelDef[];
    isCustom?: boolean;

    // Endpoint Routing Strategy
    routingStrategy: 'WEIGHTED' | 'LATENCY_BASED' | 'ERROR_RATE';

    // Global Provider Governance
    governance: GovernanceConfig;
}

interface ReferenceItem {
    id: string;
    name: string;
    type: 'MODEL' | 'TOOL' | 'CONNECTOR' | 'AGENT';
    status: 'ACTIVE' | 'INACTIVE';
}

interface Secret {
    id: string;
    key: string;
    value: string; // Current Active Value
    type: 'API_KEY' | 'DB_URL' | 'CERTIFICATE' | 'TOKEN';
    storage: 'INTERNAL' | 'AWS_SECRETS' | 'VAULT'; // P1: External KMS
    description: string;
    owner: string; // Service Account or User
    status: 'ACTIVE' | 'EXPIRED' | 'ROTATING';
    rotationPolicy: 'MANUAL' | '30_DAYS' | '90_DAYS';
    lastUsed: string;
    createdAt: string;
    updatedAt: string;
    // P0: Detailed References
    references: ReferenceItem[];
}

// Updated Quota Scope
type QuotaScope = 'TENANT' | 'DEPARTMENT' | 'APP' | 'AGENT' | 'USER' | 'MODEL';

interface QuotaActionLog {
    id: string;
    timestamp: string;
    trigger: string;
    action: string;
    result: string;
}

interface Quota {
    id: string;
    targetName: string;
    scope: QuotaScope; // Granular Scopes
    budgetLimit: number;
    budgetUsed: number;
    tokenLimitMonthly: number;
    tokenUsedMonthly: number;
    alertThreshold: number; // Percentage 0-100
    status: 'NORMAL' | 'WARNING' | 'EXCEEDED';

    // P1: Forecast & Anomalies
    forecast: {
        predictedUsage: number;
        status: 'ON_TRACK' | 'OVER_BUDGET';
        anomalies: { date: string; description: string; severity: 'HIGH' | 'MEDIUM' }[];
    };

    // Extended Data for Detailed View
    breakdown?: {
        capability: { name: string; value: number; color: string }[];
        topTemplates: { name: string; cost: number }[];
    };

    // P0: Enhanced Strategy & Action Log
    strategy: {
        overLimitAction: 'REJECT' | 'DEGRADE' | 'NOTIFY_ONLY' | 'SWITCH_MODEL' | 'STRUCTURE_ONLY';
        fallbackModel?: string; // For SWITCH_MODEL
        criticalTemplates: string[];
    };

    actionLog: QuotaActionLog[];
}

// --- Mock Data ---

const DEFAULT_GOVERNANCE: GovernanceConfig = {
    concurrencyLimit: 50,
    requestTimeout: 60000,
    maxRetries: 3,
    retryBackoff: 'EXPONENTIAL',
    retryStatusCodes: ['429', '500', '502', '503'],
    circuitBreakerThreshold: 10,
    circuitBreakerReset: 30,
    rateLimitRPM: 1000,
    rateLimitTPM: 100000,
    fallbackStrategy: 'DEGRADE',
    degradeOptions: {
        useSmallerModel: true,
        disableTools: false,
        conciseReply: true
    }
};

const INITIAL_PROVIDERS: ProviderDef[] = [
    {
        id: 'local-ollama', name: 'Local (Ollama)', region: 'LOCAL', description: '本地运行的开源模型服务，兼容 OpenAI 接口协议。',
        endpoints: [
            {
                id: 'ep_loc_1', name: 'MacBook Pro (M3)', environment: 'DEV', protocol: 'OPENAI',
                baseUrl: 'http://localhost:11434/v1', apiKey: 'ollama', timeout: 30000, retry: 0, weight: 100, status: 'READY',
                network: { customHeaders: [], skipTlsVerify: false },
                health: { latency: 45, successRate: 100, lastCheck: '2分钟前', message: 'OK (200)', statusCode: 200 }
            }
        ],
        isCustom: true,
        routingStrategy: 'WEIGHTED',
        governance: { ...DEFAULT_GOVERNANCE, concurrencyLimit: 5, rateLimitRPM: 100 },
        models: [
            {
                id: 'llama3', name: 'Llama 3 (8B)', enabled: true, contextWindow: 8192, maxOutputTokens: 4096,
                aliases: ['local_fast', 'summary_draft'],
                capabilities: { functionCall: false, jsonMode: true, vision: false, streaming: true },
                lifecycle: { status: 'ACTIVE' },
                inputPrice: 0, outputPrice: 0,
                routing: { stages: ['GENERATE'], priority: 2 }
            },
            {
                id: 'mistral', name: 'Mistral (7B)', enabled: true, contextWindow: 32768, maxOutputTokens: 8192,
                aliases: ['local_long_ctx'],
                capabilities: { functionCall: false, jsonMode: false, vision: false, streaming: true },
                lifecycle: { status: 'ACTIVE' },
                inputPrice: 0, outputPrice: 0,
                routing: { stages: ['GENERATE'], priority: 3 }
            },
        ]
    },
    {
        id: 'openai', name: 'OpenAI', region: 'FOREIGN', description: 'GPT 系列模型，全球领先的通用大模型能力。',
        routingStrategy: 'LATENCY_BASED',
        endpoints: [
            {
                id: 'ep_oa_1', name: 'US East (Official)', environment: 'PROD', protocol: 'OPENAI',
                baseUrl: 'https://api.openai.com/v1', apiKey: '{{secrets.OPENAI_API_KEY}}', timeout: 60000, retry: 3, weight: 80, status: 'READY',
                network: { customHeaders: [], skipTlsVerify: false },
                health: { latency: 420, successRate: 99.9, lastCheck: '1小时前', message: 'OK (200)', statusCode: 200 }
            },
            {
                id: 'ep_oa_2', name: 'Azure East US', environment: 'PROD', protocol: 'AZURE',
                baseUrl: 'https://azure-openai...', apiKey: '{{secrets.AZURE_KEY}}', timeout: 60000, retry: 3, weight: 20, status: 'DISABLED',
                network: { customHeaders: [{ key: 'api-version', value: '2023-05-15' }], skipTlsVerify: false },
                health: { latency: 0, successRate: 0, lastCheck: '3天前', message: 'Disabled manually', statusCode: 0 }
            },
            {
                id: 'ep_oa_3', name: 'Dev Sandbox', environment: 'DEV', protocol: 'OPENAI',
                baseUrl: 'https://api.dev.openai.com/v1', apiKey: '{{secrets.DEV_KEY}}', timeout: 30000, retry: 1, weight: 100, status: 'READY',
                network: { customHeaders: [], skipTlsVerify: true },
                health: { latency: 150, successRate: 100, lastCheck: '刚刚', message: 'OK (200)', statusCode: 200 }
            }
        ],
        governance: { ...DEFAULT_GOVERNANCE, rateLimitRPM: 5000, rateLimitTPM: 200000 },
        models: [
            {
                id: 'gpt-4o', name: 'GPT-4o (Omni)', enabled: true, contextWindow: 128000, maxOutputTokens: 4096,
                aliases: ['qna_default', 'vision_main'],
                capabilities: { functionCall: true, jsonMode: true, vision: true, streaming: true },
                lifecycle: { status: 'ACTIVE' },
                inputPrice: 5.0, outputPrice: 15.0,
                routing: { stages: ['PARSE', 'GENERATE', 'EXPLAIN'], priority: 1 }
            },
            {
                id: 'gpt-4-turbo', name: 'GPT-4 Turbo', enabled: true, contextWindow: 128000, maxOutputTokens: 4096,
                aliases: ['code_gen', 'complex_logic'],
                capabilities: { functionCall: true, jsonMode: true, vision: true, streaming: true },
                lifecycle: { status: 'ACTIVE' },
                inputPrice: 10.0, outputPrice: 30.0,
                routing: { stages: ['PARSE', 'GENERATE'], priority: 2 }
            },
            {
                id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', enabled: false, contextWindow: 16385, maxOutputTokens: 4096,
                aliases: ['legacy_cheap'],
                capabilities: { functionCall: true, jsonMode: true, vision: false, streaming: true },
                lifecycle: { status: 'DEPRECATED', eolDate: '2024-12-31', replacedBy: 'gpt-4o-mini' },
                inputPrice: 0.5, outputPrice: 1.5,
                routing: { stages: ['GENERATE'], priority: 5 }
            },
        ]
    }
];

const INITIAL_SECRETS: Secret[] = [
    {
        id: 's1', key: 'OPENAI_API_KEY', value: 'sk-proj-xxxxxxxxxxxxxxxxxxxx', type: 'API_KEY', storage: 'INTERNAL',
        description: 'Main production key for OpenAI', owner: 'Platform Admin',
        status: 'ACTIVE', rotationPolicy: '90_DAYS', lastUsed: '5分钟前',
        createdAt: '2023-10-01', updatedAt: '2023-12-05',
        references: [
            { id: 'ep_oa_1', name: 'OpenAI (US East)', type: 'MODEL', status: 'ACTIVE' },
            { id: 'agent_fin', name: 'Finance Assistant', type: 'AGENT', status: 'ACTIVE' }
        ]
    },
    {
        id: 's2', key: 'SNOWFLAKE_CONN_STR', value: 'jdbc:snowflake://...', type: 'DB_URL', storage: 'INTERNAL',
        description: 'Read-only access for Sales Mart', owner: 'Data Eng Team',
        status: 'ACTIVE', rotationPolicy: 'MANUAL', lastUsed: '1小时前',
        createdAt: '2023-11-12', updatedAt: '2023-11-12',
        references: [
            { id: 'conn_sf_01', name: 'Sales Warehouse', type: 'CONNECTOR', status: 'ACTIVE' },
            { id: 'tool_sql', name: 'sql_generator', type: 'TOOL', status: 'ACTIVE' }
        ]
    },
    {
        id: 's3', key: 'DEEPSEEK_KEY', value: 'arn:aws:secretsmanager:us-east-1:123:secret:ds-key', type: 'API_KEY', storage: 'AWS_SECRETS',
        description: 'DeepSeek API Access (External KMS)', owner: 'AI Lab',
        status: 'ACTIVE', rotationPolicy: '30_DAYS', lastUsed: '2天前',
        createdAt: '2024-01-20', updatedAt: '2024-01-20',
        references: []
    }
];

const INITIAL_QUOTAS: Quota[] = [
    {
        id: 'q1', targetName: '供应链部门 (Supply Chain)', scope: 'DEPARTMENT',
        budgetLimit: 2000, budgetUsed: 850, tokenLimitMonthly: 5000000, tokenUsedMonthly: 1200000,
        alertThreshold: 80, status: 'NORMAL',
        forecast: { predictedUsage: 1950, status: 'ON_TRACK', anomalies: [] },
        breakdown: {
            capability: [
                { name: '智能问数', value: 500, color: '#6366f1' }, // Indigo
                { name: '语义理解', value: 200, color: '#8b5cf6' }, // Violet
                { name: '知识构建', value: 150, color: '#f59e0b' }, // Amber
            ],
            topTemplates: [
                { name: '库存监控助手', cost: 320 },
                { name: '物流风险预测', cost: 180 },
            ]
        },
        strategy: { overLimitAction: 'DEGRADE', criticalTemplates: ['库存监控助手'] },
        actionLog: []
    },
    {
        id: 'q2', targetName: '财务部 (Finance)', scope: 'DEPARTMENT',
        budgetLimit: 1000, budgetUsed: 920, tokenLimitMonthly: 2000000, tokenUsedMonthly: 1950000,
        alertThreshold: 80, status: 'WARNING',
        forecast: { predictedUsage: 1200, status: 'OVER_BUDGET', anomalies: [{ date: '2023-12-15', description: '月度结算日调用量激增 300%', severity: 'HIGH' }] },
        breakdown: {
            capability: [
                { name: '报告生成', value: 800, color: '#10b981' }, // Emerald
                { name: '智能问数', value: 120, color: '#6366f1' },
            ],
            topTemplates: [
                { name: '月度财报生成', cost: 650 },
                { name: '税务合规检查', cost: 150 },
            ]
        },
        strategy: { overLimitAction: 'NOTIFY_ONLY', criticalTemplates: ['月度财报生成'] },
        actionLog: [
            { id: 'act_1', timestamp: '2023-12-20 14:00', trigger: 'Budget > 90%', action: 'Alert Email Sent', result: 'Sent' }
        ]
    },
    {
        id: 'q3', targetName: '测试租户 (Test Tenant)', scope: 'TENANT',
        budgetLimit: 100, budgetUsed: 102, tokenLimitMonthly: 100000, tokenUsedMonthly: 120000,
        alertThreshold: 90, status: 'EXCEEDED',
        forecast: { predictedUsage: 110, status: 'OVER_BUDGET', anomalies: [] },
        strategy: { overLimitAction: 'REJECT', criticalTemplates: [] },
        actionLog: [
            { id: 'act_2', timestamp: '2023-12-22 09:30', trigger: 'Budget Exceeded', action: 'Block Requests', result: 'Active' }
        ]
    },
    {
        id: 'q4', targetName: 'HR 简历分析助手 (Agent)', scope: 'AGENT',
        budgetLimit: 50, budgetUsed: 12, tokenLimitMonthly: 500000, tokenUsedMonthly: 120000,
        alertThreshold: 80, status: 'NORMAL',
        forecast: { predictedUsage: 25, status: 'ON_TRACK', anomalies: [] },
        strategy: { overLimitAction: 'SWITCH_MODEL', fallbackModel: 'gpt-3.5-turbo', criticalTemplates: [] },
        actionLog: []
    }
];

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-[60] animate-in slide-in-from-bottom-5 duration-300 ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        } text-white`}>
        {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 ml-2"><X className="w-3 h-3" /></button>
    </div>
);

// --- Main Page Component ---

const ModelFactorySettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('MODELS');

    // Lifted State for Sharing
    const [providers, setProviders] = useState<ProviderDef[]>(INITIAL_PROVIDERS);
    const [secrets, setSecrets] = useState<Secret[]>(INITIAL_SECRETS);
    const [quotas, setQuotas] = useState<Quota[]>(INITIAL_QUOTAS);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'MODELS':
                return <ModelSettings
                    providers={providers}
                    setProviders={setProviders}
                    secrets={secrets}
                    onNavigateToSecrets={() => setActiveTab('SECRETS')}
                    onNavigateToQuotas={() => setActiveTab('QUOTAS')}
                />;
            case 'SECRETS':
                return <SecretsVault secrets={secrets} setSecrets={setSecrets} />;
            case 'QUOTAS':
                return <QuotasSettings quotas={quotas} setQuotas={setQuotas} />;
            case 'RBAC': return <RBACSettings />;
            case 'GUARDRAILS': return <GlobalGuardrails />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex bg-slate-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">模型工厂设置</h2>
                    <p className="text-xs text-slate-500 mt-1">全局配置与安全策略</p>
                </div>
                <div className="flex-1 py-4 space-y-1">
                    {[
                        { id: 'MODELS', label: '模型与供应商', icon: Cpu },
                        { id: 'SECRETS', label: '凭据保险箱', icon: Key },
                        { id: 'QUOTAS', label: '配额与预算', icon: CreditCard },
                        { id: 'RBAC', label: '权限管理', icon: Users },
                        { id: 'GUARDRAILS', label: '全局安全围栏', icon: Shield },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as SettingsTab)}
                                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---

interface ModelSettingsProps {
    providers: ProviderDef[];
    setProviders: React.Dispatch<React.SetStateAction<ProviderDef[]>>;
    secrets: Secret[];
    onNavigateToSecrets: () => void;
    onNavigateToQuotas: () => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ providers, setProviders, secrets, onNavigateToSecrets, onNavigateToQuotas }) => {
    // ... [Previous ModelSettings code remains unchanged] ...
    // Since I need to output full file, I will paste the previous implementation here.
    const [selectedId, setSelectedId] = useState<string>(providers[0].id);
    const [activeSubTab, setActiveSubTab] = useState<'ENDPOINTS' | 'MODELS' | 'GOVERNANCE'>('ENDPOINTS');
    const [governanceScope, setGovernanceScope] = useState<'PROVIDER' | 'MODEL' | 'TENANT' | 'APP' | 'CAPABILITY'>('PROVIDER');
    const [searchQuery, setSearchQuery] = useState('');

    // Model Editing State
    const [editingModel, setEditingModel] = useState<ModelDef | null>(null);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [newAlias, setNewAlias] = useState('');

    // Endpoint Editing State
    const [editingEndpoint, setEditingEndpoint] = useState<EndpointDef | null>(null);
    const [isEditingEndpointOpen, setIsEditingEndpointOpen] = useState(false);
    const [endpointModalTab, setEndpointModalTab] = useState<'BASIC' | 'NETWORK' | 'ADVANCED'>('BASIC');

    const [showKey, setShowKey] = useState(false);

    // States
    const [isTesting, setIsTesting] = useState<string | null>(null);
    const [isSyncingModels, setIsSyncingModels] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    const selectedProvider = providers.find(p => p.id === selectedId) || providers[0];

    const filteredProviders = providers.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helpers
    const updateProviderField = (key: keyof ProviderDef, value: any) => {
        setProviders(prev => prev.map(p => {
            if (p.id !== selectedId) return p;
            return { ...p, [key]: value };
        }));
    };

    const updateGovernanceField = (key: keyof GovernanceConfig, value: any) => {
        setProviders(prev => prev.map(p => {
            if (p.id !== selectedId) return p;
            return { ...p, governance: { ...p.governance, [key]: value } };
        }));
    };

    const updateDegradeOption = (key: keyof GovernanceConfig['degradeOptions'], value: boolean) => {
        setProviders(prev => prev.map(p => {
            if (p.id !== selectedId) return p;
            return {
                ...p,
                governance: {
                    ...p.governance,
                    degradeOptions: { ...p.governance.degradeOptions, [key]: value }
                }
            };
        }));
    };

    const applyPolicyTemplate = (type: 'STRICT' | 'LOOSE' | 'COST') => {
        let newConfig = { ...selectedProvider.governance };
        if (type === 'STRICT') {
            newConfig.requestTimeout = 30000;
            newConfig.concurrencyLimit = 10;
            newConfig.circuitBreakerThreshold = 5;
            newConfig.fallbackStrategy = 'DEGRADE';
            newConfig.degradeOptions = { useSmallerModel: true, disableTools: true, conciseReply: true };
        } else if (type === 'LOOSE') {
            newConfig.requestTimeout = 120000;
            newConfig.concurrencyLimit = 200;
            newConfig.circuitBreakerThreshold = 50;
            newConfig.fallbackStrategy = 'NONE';
        } else if (type === 'COST') {
            newConfig.rateLimitRPM = 500;
            newConfig.fallbackStrategy = 'DEGRADE';
            newConfig.degradeOptions = { useSmallerModel: true, disableTools: true, conciseReply: false };
        }
        updateProviderField('governance', newConfig);
        setToast({ msg: `已应用策略模版: ${type}`, type: 'success' });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddCustomProvider = () => {
        const newProvider: ProviderDef = {
            id: `custom_${Date.now()}`,
            name: 'Custom Provider',
            region: 'LOCAL',
            description: 'Custom OpenAI-compatible provider.',
            endpoints: [],
            models: [],
            isCustom: true,
            routingStrategy: 'WEIGHTED',
            governance: { ...DEFAULT_GOVERNANCE }
        };
        setProviders(prev => [...prev, newProvider]);
        setSelectedId(newProvider.id);
        setToast({ msg: '已添加自定义供应商', type: 'success' });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Endpoint Logic ---
    const handleEditEndpoint = (ep?: EndpointDef) => {
        setEndpointModalTab('BASIC');
        setEditingEndpoint(ep || {
            id: `ep_${Date.now()}`,
            name: 'New Endpoint',
            environment: 'DEV',
            protocol: 'OPENAI',
            baseUrl: selectedProvider.endpoints[0]?.baseUrl || '',
            apiKey: '',
            timeout: 60000,
            retry: 3,
            weight: 100,
            status: 'NOT_CONFIGURED',
            network: { customHeaders: [], skipTlsVerify: false },
            health: { latency: 0, successRate: 0, lastCheck: 'Never' }
        });
        setIsEditingEndpointOpen(true);
    };

    const handleSaveEndpoint = () => {
        if (!editingEndpoint) return;
        const currentEndpoints = selectedProvider.endpoints;
        const exists = currentEndpoints.some(e => e.id === editingEndpoint.id);

        let newEndpoints;
        if (exists) {
            newEndpoints = currentEndpoints.map(e => e.id === editingEndpoint.id ? editingEndpoint : e);
        } else {
            newEndpoints = [...currentEndpoints, editingEndpoint];
        }
        updateProviderField('endpoints', newEndpoints);
        setIsEditingEndpointOpen(false);
        setEditingEndpoint(null);
    };

    const handleDeleteEndpoint = (epId: string) => {
        if (confirm('确定要删除此端点吗？')) {
            updateProviderField('endpoints', selectedProvider.endpoints.filter(e => e.id !== epId));
        }
    };

    const handleTestEndpoint = (epId: string) => {
        setIsTesting(epId);
        const ep = selectedProvider.endpoints.find(e => e.id === epId);
        if (!ep) return;

        // Enhanced Simulation: Endpoint Test
        setTimeout(() => {
            setIsTesting(null);
            const isConfigured = ep.apiKey || selectedProvider.region === 'LOCAL';
            const latency = Math.floor(Math.random() * 500) + 50; // Random latency 50-550ms

            let status: EndpointStatus = isConfigured ? 'READY' : 'UNAVAILABLE';
            let message = isConfigured ? 'OK (200)' : 'Unauthorized (401)';
            let statusCode = isConfigured ? 200 : 401;

            if (ep.status === 'DISABLED') {
                status = 'DISABLED';
                message = 'Endpoint is disabled';
            }

            const updatedEp: EndpointDef = {
                ...ep,
                status: status,
                health: {
                    latency: latency,
                    successRate: isConfigured ? 100 : 0,
                    lastCheck: '刚刚',
                    message: message,
                    statusCode: statusCode,
                    details: 'DNS Lookup: 12ms > TCP: 45ms > SSL: 110ms > TTFB: 250ms'
                }
            };

            updateProviderField('endpoints', selectedProvider.endpoints.map(e => e.id === epId ? updatedEp : e));
            setToast({
                msg: isConfigured ? `测试成功: ${latency}ms` : '连接测试失败: 401 Unauthorized',
                type: isConfigured ? 'success' : 'error'
            });
            setTimeout(() => setToast(null), 3000);
        }, 1500);
    };

    const handlePromoteEndpoint = (ep: EndpointDef) => {
        if (confirm(`确定要将 "${ep.name}" 的配置提升到生产环境吗？这将创建一个新的 PROD 端点。`)) {
            const newProdEp: EndpointDef = {
                ...ep,
                id: `ep_${Date.now()}`,
                name: `${ep.name} (PROD)`,
                environment: 'PROD',
                status: 'NOT_CONFIGURED',
                health: undefined // Reset health
            };
            updateProviderField('endpoints', [...selectedProvider.endpoints, newProdEp]);
            setToast({ msg: '已创建 PROD 端点副本，请配置生产密钥', type: 'success' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleAddHeader = () => {
        if (!editingEndpoint) return;
        const newHeader = { key: '', value: '' };
        setEditingEndpoint({
            ...editingEndpoint,
            network: {
                ...editingEndpoint.network,
                customHeaders: [...editingEndpoint.network.customHeaders, newHeader]
            }
        });
    };

    const handleUpdateHeader = (idx: number, field: 'key' | 'value', val: string) => {
        if (!editingEndpoint) return;
        const newHeaders = [...editingEndpoint.network.customHeaders];
        newHeaders[idx][field] = val;
        setEditingEndpoint({
            ...editingEndpoint,
            network: { ...editingEndpoint.network, customHeaders: newHeaders }
        });
    };

    const handleRemoveHeader = (idx: number) => {
        if (!editingEndpoint) return;
        const newHeaders = editingEndpoint.network.customHeaders.filter((_, i) => i !== idx);
        setEditingEndpoint({
            ...editingEndpoint,
            network: { ...editingEndpoint.network, customHeaders: newHeaders }
        });
    };

    // --- Model Logic ---
    const handleEditModel = (model?: ModelDef) => {
        setEditingModel(model || {
            id: '',
            name: '',
            enabled: true,
            contextWindow: 4096,
            maxOutputTokens: 2048,
            aliases: [],
            lifecycle: { status: 'ACTIVE' },
            capabilities: { functionCall: false, jsonMode: false, vision: false, streaming: true },
            routing: { stages: [], priority: 5 }
        });
        setIsModelModalOpen(true);
    };

    const handleSaveModel = () => {
        if (!editingModel || !editingModel.id) return;

        const currentModels = selectedProvider.models;
        const exists = currentModels.some(m => m.id === editingModel.id);

        // Auto-fill name if empty
        if (!editingModel.name) editingModel.name = editingModel.id;

        let newModels;
        if (exists) {
            newModels = currentModels.map(m => m.id === editingModel.id ? editingModel : m);
        } else {
            newModels = [...currentModels, editingModel];
        }
        updateProviderField('models', newModels);
        setIsModelModalOpen(false);
        setEditingModel(null);
    };

    const handleDeleteModel = (modelId: string) => {
        if (confirm('确定要移除此模型配置吗？')) {
            updateProviderField('models', selectedProvider.models.filter(m => m.id !== modelId));
        }
    };

    const toggleModelEnabled = (modelId: string) => {
        const currentModels = selectedProvider.models;
        const newModels = currentModels.map(m => m.id === modelId ? { ...m, enabled: !m.enabled } : m);
        updateProviderField('models', newModels);
    };

    const addAlias = () => {
        if (newAlias && editingModel && !editingModel.aliases.includes(newAlias)) {
            setEditingModel({ ...editingModel, aliases: [...editingModel.aliases, newAlias] });
            setNewAlias('');
        }
    };

    const removeAlias = (alias: string) => {
        if (editingModel) {
            setEditingModel({ ...editingModel, aliases: editingModel.aliases.filter(a => a !== alias) });
        }
    };

    const handleSyncModels = () => {
if (!selectedProvider.endpoints.some(e => e.status === 'READY')) {
    setToast({ msg: '无法同步：请先配置并测试通过至少一个端点', type: 'error' });
    setTimeout(() => setToast(null), 3000);
    return;
}
setIsSyncingModels(true);
setTimeout(() => {
    setIsSyncingModels(false);
    setToast({ msg: `同步成功! 已从端点更新模型列表。`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
}, 1500);
    };

// --- Save Strategy ---
const handleSaveConfig = () => {
    const activeEndpoints = selectedProvider.endpoints.filter(e => e.status !== 'DISABLED');

    if (activeEndpoints.length === 0) {
        setToast({ msg: '无法保存：至少需要启用一个有效的端点', type: 'error' });
        setTimeout(() => setToast(null), 3000);
        return;
    }

    setIsSaving(true);
    // Simulate save API call
    setTimeout(() => {
        setIsSaving(false);
        setToast({ msg: `配置已保存：${selectedProvider.name}。策略已下发至 3 个运行包。`, type: 'success' });
        setTimeout(() => setToast(null), 3000);
    }, 800);
};

// Render Helpers
const getProviderStatusColor = (p: ProviderDef) => {
    const statuses = p.endpoints.map(e => e.status);
    if (statuses.includes('READY')) return 'bg-emerald-500 shadow-emerald-200 shadow';
    if (statuses.includes('PARTIAL') || statuses.includes('UNAVAILABLE')) return 'bg-amber-500';
    return 'bg-slate-300';
};

const getEnvBadgeColor = (env: EnvType) => {
    switch (env) {
        case 'PROD': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'STAGING': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'DEV': return 'bg-slate-100 text-slate-600 border-slate-200';
        default: return 'bg-slate-100 text-slate-600';
    }
};

return (
    <div className="space-y-6 relative">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Edit Endpoint Modal */}
        {isEditingEndpointOpen && editingEndpoint && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">配置服务端点 (Endpoint)</h3>
                        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setEndpointModalTab('BASIC')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${endpointModalTab === 'BASIC' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                基础信息
                            </button>
                            <button
                                onClick={() => setEndpointModalTab('NETWORK')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${endpointModalTab === 'NETWORK' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                网络与安全
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        {endpointModalTab === 'BASIC' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">环境 (Environment)</label>
                                        <select
                                            value={editingEndpoint.environment}
                                            onChange={e => setEditingEndpoint({ ...editingEndpoint, environment: e.target.value as EnvType })}
                                            className="w-full border border-slate-300 rounded p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="DEV">DEV (开发)</option>
                                            <option value="STAGING">STAGING (预发)</option>
                                            <option value="PROD">PROD (生产)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">协议 (Protocol)</label>
                                        <select
                                            value={editingEndpoint.protocol}
                                            onChange={e => setEditingEndpoint({ ...editingEndpoint, protocol: e.target.value as ProtocolType })}
                                            className="w-full border border-slate-300 rounded p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="OPENAI">OpenAI Compatible</option>
                                            <option value="AZURE">Azure OpenAI</option>
                                            <option value="ANTHROPIC">Anthropic</option>
                                            <option value="GOOGLE">Google Gemini</option>
                                            <option value="LOCAL">Local / Native</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">端点名称</label>
                                    <input
                                        type="text"
                                        value={editingEndpoint.name}
                                        onChange={e => setEditingEndpoint({ ...editingEndpoint, name: e.target.value })}
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
                                    <input
                                        type="text"
                                        value={editingEndpoint.baseUrl}
                                        onChange={e => setEditingEndpoint({ ...editingEndpoint, baseUrl: e.target.value })}
                                        className="w-full border border-slate-300 rounded p-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showKey ? "text" : "password"}
                                            value={editingEndpoint.apiKey}
                                            onChange={e => setEditingEndpoint({ ...editingEndpoint, apiKey: e.target.value })}
                                            className="w-full border border-slate-300 rounded p-2 text-sm font-mono pr-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="sk-..."
                                        />
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-600"
                                        >
                                            {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">支持 {`{{secrets.KEY}}`} 格式引用。</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">超时 (ms)</label>
                                        <input
                                            type="number"
                                            value={editingEndpoint.timeout}
                                            onChange={e => setEditingEndpoint({ ...editingEndpoint, timeout: Number(e.target.value) })}
                                            className="w-full border border-slate-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">重试次数</label>
                                        <input
                                            type="number"
                                            value={editingEndpoint.retry}
                                            onChange={e => setEditingEndpoint({ ...editingEndpoint, retry: Number(e.target.value) })}
                                            className="w-full border border-slate-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">权重 (0-100)</label>
                                        <input
                                            type="number"
                                            value={editingEndpoint.weight}
                                            onChange={e => setEditingEndpoint({ ...editingEndpoint, weight: Number(e.target.value) })}
                                            className="w-full border border-slate-300 rounded p-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                                    <select
                                        value={editingEndpoint.status}
                                        onChange={e => setEditingEndpoint({ ...editingEndpoint, status: e.target.value as EndpointStatus })}
                                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                                    >
                                        <option value="NOT_CONFIGURED">未配置 (Not Configured)</option>
                                        <option value="READY">就绪 (Ready)</option>
                                        <option value="DISABLED">禁用 (Disabled)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {endpointModalTab === 'NETWORK' && (
                            <div className="space-y-6">
                                {/* TLS & IP */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">安全连接 (Security)</h4>
                                    <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingEndpoint.network.skipTlsVerify}
                                            onChange={e => setEditingEndpoint({ ...editingEndpoint, network: { ...editingEndpoint.network, skipTlsVerify: e.target.checked } })}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-800 block">跳过 TLS 证书校验 (Skip Verify)</span>
                                            <span className="text-xs text-slate-500">仅限内网测试或自签名证书场景使用。</span>
                                        </div>
                                    </label>
                                </div>

                                {/* Proxy */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">出网代理 (Forward Proxy)</label>
                                    <div className="relative">
                                        <Wifi className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="http://proxy.internal:8080"
                                            value={editingEndpoint.network.proxyUrl || ''}
                                            onChange={e => setEditingEndpoint({ ...editingEndpoint, network: { ...editingEndpoint.network, proxyUrl: e.target.value } })}
                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Custom Headers */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">自定义 Headers</label>
                                        <button onClick={handleAddHeader} className="text-xs text-indigo-600 hover:underline">+ 添加 Header</button>
                                    </div>
                                    <div className="space-y-2">
                                        {editingEndpoint.network.customHeaders.map((header, idx) => (
                                            <div key={idx} className="flex space-x-2">
                                                <input
                                                    type="text" placeholder="Key"
                                                    value={header.key}
                                                    onChange={e => handleUpdateHeader(idx, 'key', e.target.value)}
                                                    className="flex-1 border border-slate-300 rounded p-1.5 text-xs font-mono"
                                                />
                                                <input
                                                    type="text" placeholder="Value"
                                                    value={header.value}
                                                    onChange={e => handleUpdateHeader(idx, 'value', e.target.value)}
                                                    className="flex-1 border border-slate-300 rounded p-1.5 text-xs font-mono"
                                                />
                                                <button onClick={() => handleRemoveHeader(idx)} className="text-slate-400 hover:text-rose-500">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {editingEndpoint.network.customHeaders.length === 0 && (
                                            <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded text-xs text-slate-400">
                                                无自定义 Header
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 p-4 border-t border-slate-100 bg-slate-50">
                        <button onClick={() => setIsEditingEndpointOpen(false)} className="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-white bg-white">取消</button>
                        <button onClick={handleSaveEndpoint} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">确认</button>
                    </div>
                </div>
            </div>
        )}

        {/* Model Config Modal */}
        {isModelModalOpen && editingModel && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <Cpu className="w-5 h-5 mr-2 text-indigo-600" />
                            {editingModel.id ? '编辑模型配置' : '手动添加模型'}
                        </h3>
                        <button onClick={() => setIsModelModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6">
                        {/* Identity */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">原生 Model ID <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={editingModel.id}
                                    onChange={e => setEditingModel({ ...editingModel, id: e.target.value })}
                                    className="w-full border border-slate-300 rounded p-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. gpt-4-turbo"
                                    disabled={!!selectedProvider.models.find(m => m.id === editingModel.id && m !== editingModel)}
                                />
                                <p className="text-xs text-slate-400 mt-1">供应商 API 接受的确切 ID。</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">平台别名 (Alias)</label>
                                <input
                                    type="text"
                                    value={editingModel.name}
                                    onChange={e => setEditingModel({ ...editingModel, name: e.target.value })}
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. GPT-4 Turbo (Prod)"
                                />
                            </div>
                        </div>

                        {/* Aliases & Lifecycle (P0/P1) */}
                        <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">逻辑别名 (Logical Aliases)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {editingModel.aliases.map(alias => (
                                        <span key={alias} className="bg-white text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-200 flex items-center shadow-sm">
                                            {alias}
                                            <button onClick={() => removeAlias(alias)} className="ml-1.5 hover:text-rose-500"><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={newAlias}
                                        onChange={e => setNewAlias(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addAlias()}
                                        placeholder="e.g. qna_default"
                                        className="flex-1 border border-slate-300 rounded-l-md p-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button onClick={addAlias} className="bg-indigo-600 text-white px-3 py-1.5 rounded-r-md text-xs font-medium hover:bg-indigo-700">添加</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-200/50">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">生命周期状态</label>
                                    <select
                                        value={editingModel.lifecycle.status}
                                        onChange={e => setEditingModel({ ...editingModel, lifecycle: { ...editingModel.lifecycle, status: e.target.value as any } })}
                                        className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
                                    >
                                        <option value="ACTIVE">Active (正常)</option>
                                        <option value="DEPRECATED">Deprecated (已弃用)</option>
                                        <option value="EOL">EOL (停止支持)</option>
                                    </select>
                                </div>
                                {editingModel.lifecycle.status !== 'ACTIVE' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">推荐替代模型</label>
                                        <input
                                            type="text"
                                            value={editingModel.lifecycle.replacedBy || ''}
                                            onChange={e => setEditingModel({ ...editingModel, lifecycle: { ...editingModel.lifecycle, replacedBy: e.target.value } })}
                                            className="w-full border border-slate-300 rounded p-1.5 text-xs"
                                            placeholder="e.g. gpt-4o"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Specs */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">规格与能力 (Capabilities)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">上下文 (Context Window)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={editingModel.contextWindow}
                                            onChange={e => setEditingModel({ ...editingModel, contextWindow: Number(e.target.value) })}
                                            className="w-full border border-slate-300 rounded p-1.5 text-sm pl-2 pr-12"
                                        />
                                        <span className="absolute right-3 top-1.5 text-xs text-slate-400">Tokens</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">最大输出 (Max Output)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={editingModel.maxOutputTokens || ''}
                                            onChange={e => setEditingModel({ ...editingModel, maxOutputTokens: Number(e.target.value) })}
                                            className="w-full border border-slate-300 rounded p-1.5 text-sm pl-2 pr-12"
                                            placeholder="Default"
                                        />
                                        <span className="absolute right-3 top-1.5 text-xs text-slate-400">Tokens</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <label className="flex items-center cursor-pointer p-2 bg-white border border-slate-200 rounded hover:border-indigo-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editingModel.capabilities.functionCall}
                                        onChange={e => setEditingModel({ ...editingModel, capabilities: { ...editingModel.capabilities, functionCall: e.target.checked } })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-2"
                                    />
                                    <Terminal className="w-4 h-4 mr-2 text-indigo-500" />
                                    <span className="text-xs font-medium text-slate-700">Function Calling</span>
                                </label>
                                <label className="flex items-center cursor-pointer p-2 bg-white border border-slate-200 rounded hover:border-indigo-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editingModel.capabilities.jsonMode}
                                        onChange={e => setEditingModel({ ...editingModel, capabilities: { ...editingModel.capabilities, jsonMode: e.target.checked } })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-2"
                                    />
                                    <Braces className="w-4 h-4 mr-2 text-orange-500" />
                                    <span className="text-xs font-medium text-slate-700">JSON Mode</span>
                                </label>
                                <label className="flex items-center cursor-pointer p-2 bg-white border border-slate-200 rounded hover:border-indigo-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editingModel.capabilities.vision}
                                        onChange={e => setEditingModel({ ...editingModel, capabilities: { ...editingModel.capabilities, vision: e.target.checked } })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-2"
                                    />
                                    <ImageIcon className="w-4 h-4 mr-2 text-purple-500" />
                                    <span className="text-xs font-medium text-slate-700">Vision (多模态)</span>
                                </label>
                                <label className="flex items-center cursor-pointer p-2 bg-white border border-slate-200 rounded hover:border-indigo-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editingModel.capabilities.streaming}
                                        onChange={e => setEditingModel({ ...editingModel, capabilities: { ...editingModel.capabilities, streaming: e.target.checked } })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-2"
                                    />
                                    <FastForward className="w-4 h-4 mr-2 text-emerald-500" />
                                    <span className="text-xs font-medium text-slate-700">Streaming (流式)</span>
                                </label>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">输入价格 (Input Price)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400">$</span>
                                    <input
                                        type="number" step="0.01"
                                        value={editingModel.inputPrice || ''}
                                        onChange={e => setEditingModel({ ...editingModel, inputPrice: Number(e.target.value) })}
                                        className="w-full border border-slate-300 rounded p-2 pl-6 text-sm"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-3 top-2 text-xs text-slate-400">/ 1M</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">输出价格 (Output Price)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400">$</span>
                                    <input
                                        type="number" step="0.01"
                                        value={editingModel.outputPrice || ''}
                                        onChange={e => setEditingModel({ ...editingModel, outputPrice: Number(e.target.value) })}
                                        className="w-full border border-slate-300 rounded p-2 pl-6 text-sm"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-3 top-2 text-xs text-slate-400">/ 1M</span>
                                </div>
                            </div>
                        </div>

                        {/* Routing */}
                        <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center">
                                <Network className="w-4 h-4 mr-2" /> 路由属性与模型池配置
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-indigo-800 mb-1">适用阶段 (Stages)</label>
                                    <div className="flex gap-2">
                                        {['PARSE', 'GENERATE', 'EXPLAIN'].map((stage) => (
                                            <button
                                                key={stage}
                                                onClick={() => {
                                                    const stages = editingModel.routing.stages.includes(stage as any)
                                                        ? editingModel.routing.stages.filter(s => s !== stage)
                                                        : [...editingModel.routing.stages, stage as any];
                                                    setEditingModel({ ...editingModel, routing: { ...editingModel.routing, stages } });
                                                }}
                                                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${editingModel.routing.stages.includes(stage as any)
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-300'
                                                    }`}
                                            >
                                                {stage}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-medium text-indigo-800 mb-1">
                                        <span>路由优先级 (Priority)</span>
                                        <span>{editingModel.routing.priority} (1=Highest)</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="10"
                                        value={editingModel.routing.priority}
                                        onChange={e => setEditingModel({ ...editingModel, routing: { ...editingModel.routing, priority: Number(e.target.value) } })}
                                        className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <p className="text-[10px] text-indigo-600/70 mt-1">
                                        数字越小优先级越高。当多个模型满足条件时，优先选择高优先级模型。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
                        <button onClick={() => setIsModelModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-white bg-white">取消</button>
                        <button onClick={handleSaveModel} disabled={!editingModel.id} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50">保存配置</button>
                    </div>
                </div>
            </div>
        )}

        {/* Main Content Provider List & Tabs */}

        <div>
            <h3 className="text-lg font-bold text-slate-800">模型与供应商配置</h3>
            <p className="text-sm text-slate-500">配置可用的大语言模型供应商，支持国产、海外及本地私有化模型混排。</p>
        </div>

        <div className="flex h-[720px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="搜索供应商..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredProviders.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={`w-full text-left p-4 border-b border-slate-100 hover:bg-white transition-colors flex items-start space-x-3
                                    ${selectedId === p.id ? 'bg-white border-l-4 border-l-indigo-600 shadow-sm' : 'border-l-4 border-l-transparent'}
                                `}
                        >
                            <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${getProviderStatusColor(p)}`} />
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold text-sm ${selectedId === p.id ? 'text-slate-800' : 'text-slate-600'}`}>{p.name}</span>
                                    {p.region === 'DOMESTIC'
                                        ? <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100">国产</span>
                                        : p.region === 'LOCAL'
                                            ? <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">本地</span>
                                            : <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">海外</span>
                                    }
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                            </div>
                        </button>
                    ))}
                    <button
                        onClick={handleAddCustomProvider}
                        className="w-full p-4 text-xs text-indigo-600 font-medium hover:bg-indigo-50 flex items-center justify-center border-t border-slate-200 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" /> 添加自定义兼容端点
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Provider Header */}
                <div className="px-8 py-6 border-b border-slate-200 bg-white">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                            <Server className="w-8 h-8 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                {selectedProvider.isCustom ? (
                                    <input
                                        type="text"
                                        value={selectedProvider.name}
                                        onChange={(e) => updateProviderField('name', e.target.value)}
                                        className="border-b border-dashed border-slate-300 focus:border-indigo-500 outline-none bg-transparent"
                                    />
                                ) : (
                                    selectedProvider.name
                                )}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">{selectedProvider.description}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-6 border-b border-slate-100">
                        <button
                            onClick={() => setActiveSubTab('ENDPOINTS')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 flex items-center ${activeSubTab === 'ENDPOINTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            <Network className="w-4 h-4 mr-2" /> 端点管理 (Endpoints)
                        </button>
                        <button
                            onClick={() => setActiveSubTab('MODELS')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 flex items-center ${activeSubTab === 'MODELS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            <Cpu className="w-4 h-4 mr-2" /> 模型资源 (Models)
                        </button>
                        <button
                            onClick={() => setActiveSubTab('GOVERNANCE')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 flex items-center ${activeSubTab === 'GOVERNANCE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            <Shield className="w-4 h-4 mr-2" /> 治理与流控 (Governance)
                        </button>
                    </div>
                </div>

                {/* Config Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    {activeSubTab === 'ENDPOINTS' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">可用端点列表</h4>
                                    <div className="flex items-center space-x-2 text-xs bg-slate-100 px-2 py-1 rounded">
                                        <Router className="w-3 h-3 text-slate-500" />
                                        <span className="text-slate-500">路由策略:</span>
                                        <select
                                            value={selectedProvider.routingStrategy}
                                            onChange={(e) => updateProviderField('routingStrategy', e.target.value)}
                                            className="bg-transparent font-medium text-indigo-600 outline-none cursor-pointer"
                                        >
                                            <option value="WEIGHTED">加权轮询 (Weighted)</option>
                                            <option value="LATENCY_BASED">最低延迟 (Latency)</option>
                                            <option value="ERROR_RATE">故障率优先 (Error Rate)</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEditEndpoint()}
                                    className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded border border-indigo-200 font-medium flex items-center"
                                >
                                    <Plus className="w-3 h-3 mr-1.5" /> 添加端点
                                </button>
                            </div>

                            <div className="space-y-4">
                                {selectedProvider.endpoints.map(ep => (
                                    <div key={ep.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-200 transition-all bg-white shadow-sm group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center">
                                                <div className={`w-2.5 h-2.5 rounded-full mr-3 ${ep.status === 'READY' ? 'bg-emerald-500' :
                                                        ep.status === 'DISABLED' ? 'bg-slate-300' : 'bg-rose-500'
                                                    }`} title={ep.status} />
                                                <div>
                                                    <div className="flex items-center">
                                                        <h5 className="font-bold text-sm text-slate-800 mr-2">{ep.name}</h5>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border mr-2 font-bold uppercase ${getEnvBadgeColor(ep.environment)}`}>
                                                            {ep.environment}
                                                        </span>
                                                        <span className="text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 flex items-center">
                                                            {ep.protocol}
                                                        </span>
                                                        {ep.network.proxyUrl && (
                                                            <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 px-1.5 rounded flex items-center" title="Proxy Enabled">
                                                                <Wifi className="w-3 h-3 mr-1" /> Proxy
                                                            </span>
                                                        )}
                                                        {ep.network.customHeaders.length > 0 && (
                                                            <span className="ml-2 text-[10px] text-purple-600 bg-purple-50 px-1.5 rounded flex items-center" title="Custom Headers">
                                                                <ListFilter className="w-3 h-3 mr-1" /> Header
                                                            </span>
                                                        )}
                                                        {ep.status === 'DISABLED' && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">禁用</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-mono mt-0.5">{ep.baseUrl}</div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {ep.environment !== 'PROD' && (
                                                    <button
                                                        onClick={() => handlePromoteEndpoint(ep)}
                                                        className="text-xs text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center"
                                                        title="复制配置到 PROD 环境"
                                                    >
                                                        <ArrowUpCircle className="w-3 h-3 mr-1" /> 提升
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleTestEndpoint(ep.id)}
                                                    disabled={isTesting === ep.id}
                                                    className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center"
                                                >
                                                    {isTesting === ep.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plug className="w-3 h-3 mr-1" />}
                                                    测试
                                                </button>
                                                <button
                                                    onClick={() => handleEditEndpoint(ep)}
                                                    className="text-slate-500 hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEndpoint(ep.id)}
                                                    className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-6 text-xs text-slate-500 border-t border-slate-50 pt-3 mt-2">
                                            <div className="flex items-center" title={ep.health?.details || 'Health Check'}>
                                                {ep.health?.statusCode !== undefined && ep.health?.statusCode !== 200 ? (
                                                    <AlertTriangle className="w-3 h-3 mr-1.5 text-rose-500" />
                                                ) : (
                                                    <Activity className="w-3 h-3 mr-1.5 text-slate-400" />
                                                )}
                                                <span className={ep.health?.statusCode === 200 ? 'text-emerald-600 font-medium' : 'text-slate-600'}>
                                                    {ep.health ? `${ep.health.latency}ms (${ep.health.message})` : '未测试'}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="font-medium mr-1 text-slate-600">超时:</span> {ep.timeout}ms
                                            </div>
                                            <div className="flex items-center">
                                                <span className="font-medium mr-1 text-slate-600">权重:</span> {ep.weight}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {selectedProvider.endpoints.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                                        <Server className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">暂无配置端点</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'MODELS' && (
                        <section>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        可用模型资源 ({selectedProvider.models.length})
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-1">
                                        管理通过端点同步或手动添加的模型资源。
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleSyncModels}
                                        disabled={isSyncingModels}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-medium bg-indigo-50 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3 h-3 mr-1.5 ${isSyncingModels ? 'animate-spin' : ''}`} />
                                        {isSyncingModels ? '同步中...' : '同步模型列表'}
                                    </button>
                                    <button
                                        onClick={() => handleEditModel()}
                                        className="text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded shadow-sm font-medium flex items-center"
                                    >
                                        <Plus className="w-3 h-3 mr-1.5" /> 手动添加模型
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {selectedProvider.models.map(model => (
                                    <div
                                        key={model.id}
                                        className={`
                                                relative border rounded-lg p-4 transition-all duration-200 group bg-white hover:shadow-md flex flex-col
                                                ${!model.enabled || model.lifecycle.status !== 'ACTIVE' ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-indigo-200'}
                                            `}
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center">
                                                    <h5 className={`font-bold text-sm mr-2 ${model.enabled ? 'text-slate-800' : 'text-slate-500'}`}>{model.name}</h5>
                                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded border border-slate-200">{model.id}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {model.aliases.map(alias => (
                                                        <span key={alias} className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 flex items-center">
                                                            <Tag className="w-3 h-3 mr-1" /> {alias}
                                                        </span>
                                                    ))}
                                                     </div >
                                                 </div >
    <div className="flex items-center space-x-1">
        {model.lifecycle.status !== 'ACTIVE' && (
            <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded font-bold mr-2 uppercase">
                {model.lifecycle.status}
            </span>
        )}
        <button
            onClick={() => toggleModelEnabled(model.id)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${model.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${model.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
    </div>
                                             </div >

    {/* Specs & Checks */ }
    < div className = "mt-auto pt-3 space-y-3" >
                                                 <div className="flex items-center justify-between text-xs text-slate-500">
                                                     <span className="flex items-center" title="Context Window"><Cloud className="w-3 h-3 mr-1" /> {model.contextWindow >= 1000 ? `${model.contextWindow/1000}k` : model.contextWindow}</span>
                                                     <span className="flex items-center" title="Pricing Input/Output"><DollarSign className="w-3 h-3 mr-0.5" /> {model.inputPrice}/{model.outputPrice}</span>
                                                 </div>
                                                 
                                                 <div className="flex gap-2 pt-2 border-t border-slate-100">
                                                     <div className={`flex items-center text-[10px] px-1.5 py-0.5 rounded border ${model.capabilities.jsonMode ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50'}`}>
                                                         <Braces className="w-3 h-3 mr-1" /> JSON
                                                     </div>
                                                     <div className={`flex items-center text-[10px] px-1.5 py-0.5 rounded border ${model.capabilities.functionCall ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-50'}`}>
                                                         <Terminal className="w-3 h-3 mr-1" /> Tools
                                                     </div>
                                                     <div className={`flex items-center text-[10px] px-1.5 py-0.5 rounded border ${model.capabilities.vision ? 'text-purple-600 bg-purple-50 border-purple-100' : 'text-slate-400 bg-slate-50'}`}>
                                                         <ImageIcon className="w-3 h-3 mr-1" /> Vis
                                                     </div>
                                                 </div>
                                             </div >

    {/* Actions Overlay */ }
    < div className = "absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-white/80 rounded p-1 backdrop-blur-sm" >
                                                 <button 
                                                    onClick={() => handleEditModel(model)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="配置模型"
                                                 >
                                                     <Edit2 className="w-3.5 h-3.5" />
                                                 </button>
                                                 <button 
                                                    onClick={() => handleDeleteModel(model.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                                    title="删除"
                                                 >
                                                     <Trash2 className="w-3.5 h-3.5" />
                                                 </button>
                                             </div >
                                         </div >
                                     ))}
                                 </div >
                             </section >
                         )}

{
    activeSubTab === 'GOVERNANCE' && (
        <section className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    治理与配额策略
                </h4>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">快速模版:</span>
                    <div className="flex space-x-1">
                        <button onClick={() => applyPolicyTemplate('STRICT')} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors">高安全 (Strict)</button>
                        <button onClick={() => applyPolicyTemplate('COST')} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors">低成本 (Cost)</button>
                        <button onClick={() => applyPolicyTemplate('LOOSE')} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors">高并发 (Loose)</button>
                    </div>
                </div>
            </div>

            {/* P0: Scope Hierarchy Visualizer */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                    <Layers className="w-4 h-4 mr-1.5" /> 策略生效优先级 (Policy Precedence)
                </h5>
                <div className="flex items-center space-x-2 text-xs">
                    <div className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${governanceScope === 'PROVIDER' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                        1. 全局供应商 (Global Provider)
                        <div className="text-[10px] font-normal mt-1 opacity-70">Current Editing</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                    <div className="flex-1 p-3 rounded-lg border border-slate-200 bg-white text-center text-slate-500">
                        2. 租户域 (Tenant Scope)
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                    <div className="flex-1 p-3 rounded-lg border border-slate-200 bg-white text-center text-slate-500">
                        3. 应用/智能体 (App/Agent)
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                    <div className="flex-1 p-3 rounded-lg border border-slate-200 bg-white text-center text-slate-500">
                        4. 能力 (Capability)
                    </div>
                </div>
            </div>

            {/* Section 1: Stability & Resilience (P0) */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h5 className="text-sm font-bold text-slate-800 flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                        稳定性与弹性 (Stability & Resilience)
                    </h5>
                </div>
                <div className="p-5 grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">最大并发数 (Concurrency Limit)</label>
                        <input
                            type="number"
                            value={selectedProvider.governance.concurrencyLimit}
                            onChange={(e) => updateGovernanceField('concurrencyLimit', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">请求超时 (Timeout ms)</label>
                        <input
                            type="number"
                            value={selectedProvider.governance.requestTimeout}
                            onChange={(e) => updateGovernanceField('requestTimeout', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">重试策略 (Retry Policy)</label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block mb-1">Max Retries</span>
                                        <input
                                            type="number"
                                            value={selectedProvider.governance.maxRetries}
                                            onChange={(e) => updateGovernanceField('maxRetries', Number(e.target.value))}
                                            className="w-full border border-slate-300 rounded-md py-1 px-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block mb-1">Backoff</span>
                                        <select
                                            value={selectedProvider.governance.retryBackoff}
                                            onChange={(e) => updateGovernanceField('retryBackoff', e.target.value)}
                                            className="w-full border border-slate-300 rounded-md py-1 px-2 text-sm bg-white"
                                        >
                                            <option value="FIXED">固定间隔 (Fixed)</option>
                                            <option value="EXPONENTIAL">指数退避 (Exponential)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-500">Retry on: 429, 500, 502, 503, 504</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">熔断机制 (Circuit Breaker)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block mb-1">Failure Threshold</span>
                                        <input
                                            type="number"
                                            value={selectedProvider.governance.circuitBreakerThreshold}
                                            onChange={(e) => updateGovernanceField('circuitBreakerThreshold', Number(e.target.value))}
                                            className="w-full border border-slate-300 rounded-md py-1 px-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block mb-1">Reset (Sec)</span>
                                        <input
                                            type="number"
                                            value={selectedProvider.governance.circuitBreakerReset}
                                            onChange={(e) => updateGovernanceField('circuitBreakerReset', Number(e.target.value))}
                                            className="w-full border border-slate-300 rounded-md py-1 px-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Rate Limits */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h5 className="text-sm font-bold text-slate-800 flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-indigo-500" />
                        限流策略 (Rate Limiting)
                    </h5>
                </div>
                <div className="p-5 grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">请求速率限制 (RPM)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={selectedProvider.governance.rateLimitRPM || ''}
                                onChange={(e) => updateGovernanceField('rateLimitRPM', Number(e.target.value))}
                                className="w-full border border-slate-300 rounded-md py-1.5 pl-3 pr-16 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="无限制"
                            />
                            <span className="absolute right-3 top-1.5 text-xs text-slate-400">Req/Min</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">吞吐速率限制 (TPM)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={selectedProvider.governance.rateLimitTPM || ''}
                                onChange={(e) => updateGovernanceField('rateLimitTPM', Number(e.target.value))}
                                className="w-full border border-slate-300 rounded-md py-1.5 pl-3 pr-16 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="无限制"
                            />
                            <span className="absolute right-3 top-1.5 text-xs text-slate-400">Tokens/Min</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Closed-Loop Degradation Action Flow (P0) */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h5 className="text-sm font-bold text-slate-800 flex items-center">
                        <Workflow className="w-4 h-4 mr-2 text-indigo-500" />
                        治理动作闭环 (Governance Action Flow)
                    </h5>
                </div>
                <div className="p-5">
                    <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex flex-col items-center w-1/4">
                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2 shadow-sm border border-rose-200">
                                <AlertOctagon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">1. 触发 (Trigger)</span>
                            <span className="text-[10px] text-slate-500 text-center mt-1">Rate Limit / Timeout / Error</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                        <div className="flex flex-col items-center w-1/4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 shadow-sm border border-indigo-200">
                                <MousePointerClick className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">2. 动作 (Action)</span>
                            <select
                                value={selectedProvider.governance.fallbackStrategy}
                                onChange={(e) => updateGovernanceField('fallbackStrategy', e.target.value)}
                                className="text-[10px] text-slate-600 text-center mt-1 border rounded bg-white p-1 outline-none focus:border-indigo-500"
                            >
                                <option value="NONE">阻断请求 (Block)</option>
                                <option value="FALLBACK_MODEL">切换模型 (Switch)</option>
                                <option value="DEGRADE">服务降级 (Degrade)</option>
                            </select>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                        <div className="flex flex-col items-center w-1/4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm border border-emerald-200">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">3. 审计 (Audit)</span>
                            <span className="text-[10px] text-slate-500 text-center mt-1">Record Event & Metrics</span>
                        </div>
                    </div>

                    {selectedProvider.governance.fallbackStrategy === 'DEGRADE' && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="text-xs font-bold text-amber-800 mb-1 flex items-center"><CornerDownRight className="w-3 h-3 mr-1" /> 降级配置详情 (Degradation Config)</div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedProvider.governance.degradeOptions.useSmallerModel}
                                    onChange={(e) => updateDegradeOption('useSmallerModel', e.target.checked)}
                                    className="rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-slate-700">自动切换至轻量级模型 (e.g. Haiku/Flash)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedProvider.governance.degradeOptions.disableTools}
                                    onChange={(e) => updateDegradeOption('disableTools', e.target.checked)}
                                    className="rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-slate-700">禁用复杂工具调用 (Disable Tools)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedProvider.governance.degradeOptions.conciseReply}
                                    onChange={(e) => updateDegradeOption('conciseReply', e.target.checked)}
                                    className="rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-slate-700">仅返回简明结果 (Concise Output Only)</span>
                            </label>
                        </div>
                    )}

                    {(selectedProvider.governance.fallbackStrategy === 'FALLBACK_MODEL' || selectedProvider.governance.fallbackStrategy === 'FALLBACK_PROVIDER') && (
                        <div className="animate-in fade-in slide-in-from-top-2 mt-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">目标资源 ID (Target Resource)</label>
                            <input
                                type="text"
                                placeholder={selectedProvider.governance.fallbackStrategy === 'FALLBACK_MODEL' ? "e.g. gpt-3.5-turbo" : "e.g. azure-openai-eastus"}
                                value={selectedProvider.governance.fallbackTarget || ''}
                                onChange={(e) => updateGovernanceField('fallbackTarget', e.target.value)}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
                     </div >

    {/* Footer */ }
    < div className = "p-4 border-t border-slate-200 bg-slate-50 flex justify-end" >
        <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? '保存配置' : '保存配置'}
        </button>
                     </div >
                </div >
            </div >
        </div >
    );
};

// Secrets Vault (Preserved)
interface SecretsVaultProps {
    secrets: Secret[];
    setSecrets: React.Dispatch<React.SetStateAction<Secret[]>>;
}

const SecretsVault: React.FC<SecretsVaultProps> = ({ secrets, setSecrets }) => {
    // ... [Previous SecretsVault implementation preserved] ...
    // RE-INJECTING SECRETS VAULT LOGIC
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
    const [viewReferencesId, setViewReferencesId] = useState<string | null>(null);
    const [editingSecret, setEditingSecret] = useState<Partial<Secret> | null>(null);
    const [targetSecretForRotation, setTargetSecretForRotation] = useState<Secret | null>(null);
    const [rotationStep, setRotationStep] = useState(1);
    const [newGeneratedSecret, setNewGeneratedSecret] = useState('');
    const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [sortOrder, setSortOrder] = useState<'NAME' | 'DATE'>('DATE');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const toggleVisibility = (id: string) => setVisibleValues(prev => ({ ...prev, [id]: !prev[id] }));
    const handleCopy = (id: string, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedId(id);
        showToast('凭据值已复制到剪贴板');
        setTimeout(() => setCopiedId(null), 2000);
    };
    const handleGenerateRandom = () => setEditingSecret(prev => ({ ...prev, value: 'sk-' + Math.random().toString(36).substring(2, 15) }));
    const openRotateModal = (secret: Secret) => {
        setTargetSecretForRotation(secret);
        setRotationStep(1);
        setNewGeneratedSecret('');
        setIsRotateModalOpen(true);
    };
    const handleRotationGenerate = () => {
        setNewGeneratedSecret(`sk-rot-${Date.now()}-` + Math.random().toString(36).substring(7));
        setRotationStep(2);
    };
    const confirmRotation = () => {
        if (!targetSecretForRotation) return;
        setSecrets(prev => prev.map(s => s.id === targetSecretForRotation.id ? { ...s, value: newGeneratedSecret, status: 'ACTIVE', updatedAt: new Date().toISOString().split('T')[0] } : s));
        setIsRotateModalOpen(false);
        setTargetSecretForRotation(null);
        showToast(`凭据 ${targetSecretForRotation.key} 轮换成功！`);
    };
    const handleSaveSecret = (secret: Partial<Secret>) => {
        if (!secret.key || (!secret.value && secret.storage === 'INTERNAL')) return showToast('请填写完整信息', 'error');
        const newSecret: Secret = {
            id: secret.id || Date.now().toString(),
            key: secret.key,
            value: secret.value || 'REF',
            type: secret.type || 'API_KEY',
            storage: secret.storage || 'INTERNAL',
            description: secret.description || '',
            owner: secret.owner || 'Admin',
            status: 'ACTIVE',
            rotationPolicy: secret.rotationPolicy || 'MANUAL',
            lastUsed: '从未',
            createdAt: secret.createdAt || new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
            references: secret.references || []
        };
        if (secret.id) setSecrets(prev => prev.map(s => s.id === secret.id ? newSecret : s));
        else setSecrets([...secrets, newSecret]);
        setIsModalOpen(false);
        setEditingSecret(null);
    };
    const handleDelete = (id: string) => {
        if (confirm('确定删除?')) setSecrets(prev => prev.filter(s => s.id !== id));
    };
    const filteredSecrets = secrets.filter(s => s.key.toLowerCase().includes(searchQuery.toLowerCase()));
    const referenceTargetSecret = secrets.find(s => s.id === viewReferencesId);

    return (
        <div className="space-y-6 relative">
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {/* Reference Drawer */}
            {viewReferencesId && referenceTargetSecret && (
                <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">引用追溯</h3>
                        <button onClick={() => setViewReferencesId(null)}><X className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {referenceTargetSecret.references.map((ref, idx) => (
                            <div key={idx} className="flex items-start p-3 bg-white border rounded-lg">
                                <div className="p-2 bg-indigo-50 rounded mr-3 text-indigo-600"><LinkIcon className="w-4 h-4" /></div>
                                <div><div className="font-bold text-sm">{ref.name}</div><div className="text-xs text-slate-500">{ref.type}</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">凭据保险箱</h3>
                <button onClick={() => { setEditingSecret({ storage: 'INTERNAL' }); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm flex items-center"><Plus className="w-4 h-4 mr-2" /> 添加凭据</button>
            </div>
            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr><th className="px-6 py-4">Key 名称</th><th className="px-6 py-4">值 (Value)</th><th className="px-6 py-4">所有者</th><th className="px-6 py-4">引用数</th><th className="px-6 py-4 text-right">操作</th></tr>
                    </thead>
                    <tbody>
                        {filteredSecrets.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono font-bold text-slate-700">{row.key}</td>
                                <td className="px-6 py-4"><div className="flex items-center space-x-2"><code className="bg-slate-100 px-2 py-1 rounded text-xs">{visibleValues[row.id] ? row.value : '••••••'}</code><button onClick={() => toggleVisibility(row.id)}><Eye className="w-3.5 h-3.5 text-slate-400" /></button></div></td>
                                <td className="px-6 py-4">{row.owner}</td>
                                <td className="px-6 py-4 cursor-pointer text-indigo-600 hover:underline" onClick={() => setViewReferencesId(row.id)}>{row.references.length} refs</td>
                                <td className="px-6 py-4 text-right"><button onClick={() => handleDelete(row.id)} className="text-rose-600"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-96 shadow-2xl space-y-4">
                        <h3 className="font-bold">添加凭据</h3>
                        <input className="border p-2 w-full rounded" placeholder="Key 名称 (e.g. OPENAI_KEY)" value={editingSecret?.key || ''} onChange={e => setEditingSecret(prev => ({ ...prev, key: e.target.value }))} />
                        <input className="border p-2 w-full rounded" placeholder="密钥值 (sk-...)" value={editingSecret?.value || ''} onChange={e => setEditingSecret(prev => ({ ...prev, value: e.target.value }))} />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">取消</button>
                            <button onClick={() => handleSaveSecret(editingSecret || {})} className="px-4 py-2 bg-indigo-600 text-white rounded">保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Quota Components (Updated) ---

const CreateQuotaModal = ({ onClose, onCreate }: { onClose: () => void, onCreate: (quota: Quota) => void }) => {
    const [formData, setFormData] = useState({
        targetName: '',
        scope: 'DEPARTMENT' as QuotaScope, // Default
        budgetLimit: 1000,
        tokenLimitMonthly: 1000000,
        alertThreshold: 80
    });

    const handleSubmit = () => {
        if (!formData.targetName) return;
        const newQuota: Quota = {
            id: `q_${Date.now()}`,
            targetName: formData.targetName,
            scope: formData.scope,
            budgetLimit: Number(formData.budgetLimit),
            budgetUsed: 0,
            tokenLimitMonthly: Number(formData.tokenLimitMonthly),
            tokenUsedMonthly: 0,
            alertThreshold: Number(formData.alertThreshold),
            status: 'NORMAL',
            forecast: { predictedUsage: 0, status: 'ON_TRACK', anomalies: [] },
            strategy: { overLimitAction: 'NOTIFY_ONLY', criticalTemplates: [] },
            actionLog: []
        };
        onCreate(newQuota);
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">创建新配额策略</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Scope Selector (P0) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">策略维度 (Scope)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'TENANT', label: '租户 (Tenant)', icon: Globe },
                                { id: 'DEPARTMENT', label: '部门 (Dept)', icon: Users },
                                { id: 'APP', label: '应用 (App)', icon: Box },
                                { id: 'AGENT', label: '智能体 (Agent)', icon: Bot },
                                { id: 'USER', label: '用户 (User)', icon: User },
                                { id: 'MODEL', label: '模型 (Model)', icon: Cpu },
                            ].map(scope => (
                                <button
                                    key={scope.id}
                                    onClick={() => setFormData({ ...formData, scope: scope.id as QuotaScope })}
                                    className={`flex items-center justify-center px-3 py-2 border rounded-md text-xs font-medium transition-all ${formData.scope === scope.id
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <scope.icon className="w-3.5 h-3.5 mr-2" />
                                    {scope.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">目标名称 (Target ID/Name)</label>
                        <input
                            type="text"
                            placeholder={formData.scope === 'USER' ? 'e.g. alice@example.com' : 'e.g. Finance Dept'}
                            value={formData.targetName}
                            onChange={e => setFormData({ ...formData, targetName: e.target.value })}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">预算上限 (USD)</label>
                            <input
                                type="number"
                                value={formData.budgetLimit}
                                onChange={e => setFormData({ ...formData, budgetLimit: Number(e.target.value) })}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Token 上限 (Monthly)</label>
                            <input
                                type="number"
                                value={formData.tokenLimitMonthly}
                                onChange={e => setFormData({ ...formData, tokenLimitMonthly: Number(e.target.value) })}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50">取消</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!formData.targetName}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                    >
                        确认配置
                    </button>
                </div>
            </div>
        </div>
    );
};

const QuotaDetailDrawer = ({ quota, onClose }: { quota: Quota, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GOVERNANCE'>('OVERVIEW');

    // Forecast Data Simulation
    const forecastChartData = [
        { day: '1', used: quota.budgetUsed * 0.1 },
        { day: '10', used: quota.budgetUsed * 0.4 },
        { day: '20', used: quota.budgetUsed * 0.8 },
        { day: 'Today', used: quota.budgetUsed },
        { day: '30 (Est)', used: quota.forecast.predictedUsage, isForecast: true },
    ];

    return (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{quota.targetName}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{quota.scope}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${quota.status === 'NORMAL' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                quota.status === 'WARNING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                            {quota.status}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="px-6 border-b border-slate-200 flex space-x-6">
                <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'OVERVIEW' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <TrendingUp className="w-3.5 h-3.5 mr-2" /> 趋势与预测 (Forecast)
                </button>
                <button
                    onClick={() => setActiveTab('GOVERNANCE')}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'GOVERNANCE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <Shield className="w-3.5 h-3.5 mr-2" /> 策略与审计 (Policy)
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTab === 'OVERVIEW' && (
                    <>
                        {/* P1: Prediction Chart */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                                月底消耗预测 (Month-End Forecast)
                                {quota.forecast.status === 'OVER_BUDGET' && (
                                    <span className="ml-2 text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded flex items-center">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> 预计超支
                                    </span>
                                )}
                            </h4>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={forecastChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <RechartsTooltip />
                                        <ReferenceLine y={quota.budgetLimit} stroke="red" strokeDasharray="3 3" label={{ value: 'Limit', position: 'insideTopRight', fill: 'red', fontSize: 10 }} />
                                        <Area type="monotone" dataKey="used" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 text-xs text-slate-500 flex justify-between">
                                <span>当前已用: ${quota.budgetUsed}</span>
                                <span className={quota.forecast.status === 'OVER_BUDGET' ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                                    预测值: ${quota.forecast.predictedUsage}
                                </span>
                            </div>
                        </div>

                        {/* P1: Anomalies List */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                                <FileWarning className="w-4 h-4 mr-2 text-amber-500" /> 异常检测记录 (Anomalies)
                            </h4>
                            {quota.forecast.anomalies.length > 0 ? (
                                <div className="space-y-2">
                                    {quota.forecast.anomalies.map((ano, idx) => (
                                        <div key={idx} className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold text-amber-800">{ano.date}</div>
                                                <div className="text-xs text-amber-700">{ano.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                                    暂无异常检测记录
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'GOVERNANCE' && (
                    <>
                        {/* P0: Disposition Actions */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                                <AlertOctagon className="w-4 h-4 mr-2 text-rose-500" /> 超额处置策略 (Disposition)
                            </h4>
                            <div className="space-y-3">
                                {[
                                    { id: 'REJECT', label: '阻断请求 (Reject)', desc: '返回 429 Too Many Requests。' },
                                    { id: 'DEGRADE', label: '服务降级 (Degrade)', desc: '禁用复杂工具，仅保留基础问答。' },
                                    { id: 'SWITCH_MODEL', label: '切低成本模型 (Fallback)', desc: '强制切换至 gpt-3.5-turbo 等廉价模型。' },
                                    { id: 'STRUCTURE_ONLY', label: '仅返回结构 (Structure Only)', desc: '跳过生成环节，仅返回检索到的原始数据。' },
                                    { id: 'NOTIFY_ONLY', label: '仅告警 (Notify)', desc: '允许透支，但高频发送告警邮件。' },
                                ].map(opt => (
                                    <label key={opt.id} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${quota.strategy.overLimitAction === opt.id
                                            ? 'border-indigo-500 bg-white ring-1 ring-indigo-500'
                                            : 'border-slate-200 hover:border-indigo-300 bg-white'
                                        }`}>
                                        <input type="radio" name="disposition" defaultChecked={quota.strategy.overLimitAction === opt.id} className="mt-0.5 mr-3" />
                                        <div>
                                            <span className="block text-sm font-bold text-slate-800">{opt.label}</span>
                                            <span className="block text-xs text-slate-500 mt-0.5">{opt.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {quota.strategy.overLimitAction === 'SWITCH_MODEL' && (
                                <div className="mt-3 pl-8 animate-in fade-in">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">降级模型 (Fallback Model)</label>
                                    <select className="w-full border border-slate-300 rounded text-xs p-1.5 bg-white">
                                        <option>gpt-3.5-turbo</option>
                                        <option>claude-3-haiku</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* P0: Audit Log */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                                <History className="w-4 h-4 mr-2 text-slate-500" /> 处置审计日志 (Action Log)
                            </h4>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 font-medium text-slate-600 border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2">时间</th>
                                            <th className="px-3 py-2">触发条件</th>
                                            <th className="px-3 py-2">执行动作</th>
                                            <th className="px-3 py-2">结果</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {quota.actionLog.length > 0 ? quota.actionLog.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 text-slate-500">{log.timestamp}</td>
                                                <td className="px-3 py-2 font-mono text-amber-600">{log.trigger}</td>
                                                <td className="px-3 py-2 font-bold text-slate-700">{log.action}</td>
                                                <td className="px-3 py-2 text-emerald-600">{log.result}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-400">暂无触发记录</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

interface QuotasSettingsProps {
    quotas: Quota[];
    setQuotas: React.Dispatch<React.SetStateAction<Quota[]>>;
}

const QuotasSettings: React.FC<QuotasSettingsProps> = ({ quotas, setQuotas }) => {
    const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const getScopeIcon = (scope: QuotaScope) => {
        switch (scope) {
            case 'TENANT': return <Globe className="w-3.5 h-3.5" />;
            case 'DEPARTMENT': return <Users className="w-3.5 h-3.5" />;
            case 'APP': return <Box className="w-3.5 h-3.5" />;
            case 'AGENT': return <Bot className="w-3.5 h-3.5" />;
            case 'USER': return <User className="w-3.5 h-3.5" />;
            case 'MODEL': return <Cpu className="w-3.5 h-3.5" />;
        }
    };

    const handleCreateQuota = (newQuota: Quota) => {
        setQuotas([...quotas, newQuota]);
        setIsCreateOpen(false);
    };
return (
    <div className="space-y-6 relative">
        {selectedQuota && (
            <>
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" onClick={() => setSelectedQuota(null)} />
                <QuotaDetailDrawer quota={selectedQuota} onClose={() => setSelectedQuota(null)} />
            </>
        )}

        {isCreateOpen && (
            <CreateQuotaModal onClose={() => setIsCreateOpen(false)} onCreate={handleCreateQuota} />
        )}

        <div className="flex justify-between items-end">
            <div>
                <h3 className="text-lg font-bold text-slate-800">配额与预算 (Quotas)</h3>
                <p className="text-sm text-slate-500">多维度资源消耗控制与预算管理。</p>
            </div>
            <div className="flex space-x-2">
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 shadow-sm">
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> 新建策略
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quotas.map(quota => {
                const budgetPercent = Math.min((quota.budgetUsed / quota.budgetLimit) * 100, 100);

                return (
                    <div key={quota.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group relative">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h4 className="font-bold text-slate-800">{quota.targetName}</h4>
                                    <span className="flex items-center text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200 uppercase">
                                        {getScopeIcon(quota.scope)}
                                        <span className="ml-1">{quota.scope}</span>
                                    </span>
                                </div>
                                <div className="flex space-x-2 mt-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block ${quota.status === 'NORMAL' ? 'bg-emerald-50 text-emerald-600' :
                                            quota.status === 'WARNING' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                        {quota.status}
                                    </span>
                                    {quota.forecast.status === 'OVER_BUDGET' && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 flex items-center border border-rose-100" title="Predicted to exceed budget">
                                            <TrendingUp className="w-3 h-3 mr-1" /> 超支预警
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedQuota(quota)}
                                className="text-xs border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 text-slate-600 font-medium flex items-center transition-colors"
                            >
                                详情与策略
                                <ChevronRight className="w-3 h-3 ml-1 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Cost Budget */}
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-600 font-medium flex items-center">
                                        <CreditCard className="w-3 h-3 mr-1" /> 成本预算
                                    </span>
                                    <span className="font-mono text-slate-800">
                                        ${quota.budgetUsed} <span className="text-slate-400">/ ${quota.budgetLimit}</span>
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${quota.status === 'EXCEEDED' ? 'bg-rose-500' : quota.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${budgetPercent}%` }}
                                    ></div>
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-black/20 z-10"
                                        style={{ left: `${quota.alertThreshold}%` }}
                                        title={`Alert Threshold: ${quota.alertThreshold}%`}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {quota.status === 'EXCEEDED' && (
                            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded text-xs text-rose-700 flex items-start animate-in fade-in slide-in-from-top-1">
                                <AlertOctagon className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>
                                    <strong>已触发处置策略:</strong> {quota.strategy.overLimitAction.replace('_', ' ')}。
                                    请尽快调整预算或优化用量。
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);
};

const RBACSettings = () => {
    const [scopeView, setScopeView] = useState<'GLOBAL' | 'TENANT'>('GLOBAL');

    const permissionCategories = [
        {
            category: '资源管理 (Resources)',
            items: [
                { id: 'tmpl_write', label: '创建/编辑模板' },
                { id: 'tmpl_delete', label: '删除模板' },
                { id: 'kb_write', label: '管理知识库' },
            ]
        },
        {
            category: '发布运维 (Ops)',
            items: [
                { id: 'deploy_prod', label: '发布至生产环境' },
                { id: 'debug_run', label: '运行调试' },
                { id: 'audit_read', label: '查看审计日志' },
            ]
        },
        {
            category: '凭据安全 (Secrets) [P0]',
            items: [
                { id: 'sec_use', label: '使用/引用 (Use Reference)', desc: '在模型或工具配置中引用 Secret' },
                { id: 'sec_view', label: '查看明文 (View Value)', desc: '解密查看 Secret 原始值 (高危)' },
                { id: 'sec_rotate', label: '轮换/更新 (Rotate)', desc: '执行密钥轮换或更新值' },
                { id: 'sec_delete', label: '删除凭据 (Delete)', desc: '永久删除凭据' },
            ]
        }
    ];

    const roles = scopeView === 'GLOBAL' ? [
        { id: 'SYS_ADMIN', name: '系统管理员 (Admin)', perms: ['tmpl_write', 'tmpl_delete', 'kb_write', 'deploy_prod', 'debug_run', 'audit_read', 'sec_use', 'sec_view', 'sec_rotate', 'sec_delete'] },
        { id: 'SEC_OFFICER', name: '安全审计员 (Sec)', perms: ['audit_read', 'sec_view', 'sec_rotate', 'sec_delete'] },
    ] : [
        { id: 'TENANT_ADMIN', name: '租户管理员 (Tenant Admin)', perms: ['tmpl_write', 'tmpl_delete', 'kb_write', 'deploy_prod', 'debug_run', 'audit_read', 'sec_use', 'sec_rotate'] },
        { id: 'DEV', name: '开发者 (Developer)', perms: ['tmpl_write', 'kb_write', 'debug_run', 'sec_use'] },
        { id: 'VIEWER', name: '观察者 (Viewer)', perms: ['debug_run'] },
    ];

    return (
        <div className="space-y-6">
            {/* Header & Scope Toggle */}
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">权限管理 (RBAC)</h3>
                    <p className="text-sm text-slate-500">定义不同角色在平台中的功能访问权限。</p>
                </div>
                <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                    <button
                        onClick={() => setScopeView('GLOBAL')}
                        className={`px-3 py-1.5 rounded-md transition-all flex items-center ${scopeView === 'GLOBAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Globe className="w-3.5 h-3.5 mr-2" />
                        全局系统角色 (Global)
                    </button>
                    <button
                        onClick={() => setScopeView('TENANT')}
                        className={`px-3 py-1.5 rounded-md transition-all flex items-center ${scopeView === 'TENANT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Box className="w-3.5 h-3.5 mr-2" />
                        租户/项目角色 (Tenant)
                    </button>
                </div>
            </div>

            {/* Permissions Matrix */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 w-1/3">权限点 (Permissions)</th>
                            {roles.map(role => (
                                <th key={role.id} className="px-6 py-4 text-center w-32">{role.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {permissionCategories.map((cat, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="bg-slate-50/50">
                                    <td colSpan={roles.length + 1} className="px-6 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {cat.category}
                                    </td>
                                </tr>
                                {cat.items.map(perm => (
                                    <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-slate-700">{perm.label}</div>
                                            {(perm as any).desc && <div className="text-xs text-slate-400 mt-0.5">{(perm as any).desc}</div>}
                                        </td>
                                        {roles.map(role => (
                                            <td key={role.id} className="px-6 py-3 text-center">
                                                {role.perms.includes(perm.id) ? (
                                                    <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                                ) : (
                                                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GlobalGuardrails = () => {
    // Simulator State
    const [testInput, setTestInput] = useState('');
    const [testResult, setTestResult] = useState<null | { status: 'PASS' | 'BLOCKED' | 'SANITIZED', rule?: string, action?: string, detail?: string }>(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleRunTest = () => {
        if (!testInput.trim()) return;
        setIsTesting(true);
        setTestResult(null);

        // Simple Mock Simulation Logic
        setTimeout(() => {
            const input = testInput.toLowerCase();
            let result: typeof testResult = { status: 'PASS', detail: 'Safe to proceed.' };

            if (input.includes('drop table') || input.includes('delete from')) {
                result = { status: 'BLOCKED', rule: 'SQL Injection Protection', action: 'Block Request', detail: 'Detected DDL/DML keywords.' };
            } else if (/\d{11}/.test(input) || input.includes('@example.com')) {
                result = { status: 'SANITIZED', rule: 'PII Redaction', action: 'Mask Data', detail: 'Detected phone/email pattern. Output will be masked.' };
            } else if (input.includes('ignore previous') || input.includes('system prompt')) {
                result = { status: 'BLOCKED', rule: 'Prompt Injection', action: 'Block Request', detail: 'Detected jailbreak attempt pattern.' };
            }

            setTestResult(result);
            setIsTesting(false);
        }, 800);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
            {/* Left: Policy Config */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">全局安全围栏 (Global Guardrails)</h3>
                    <p className="text-sm text-slate-500">应用于所有智能体运行时的强制安全策略。</p>
                </div>

                {/* Scope Visualizer (P0) */}
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                        <Layers className="w-4 h-4 mr-1.5" /> 策略生效优先级 (Override Hierarchy)
                    </h5>
                    <div className="flex items-center space-x-2 text-xs">
                        <div className="flex-1 p-3 rounded-lg border-2 border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-sm text-center relative">
                            1. 全局默认 (Global Default)
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-1.5 rounded text-[8px] uppercase">Current</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                        <div className="flex-1 p-3 rounded-lg border border-slate-200 bg-white text-center text-slate-500">
                            2. 租户域 (Tenant Scope)
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                        <div className="flex-1 p-3 rounded-lg border border-slate-200 bg-white text-center text-slate-500">
                            3. 应用/智能体 (App/Agent)
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-800">策略变更警告</h4>
                        <p className="text-xs text-amber-700 mt-1">修改全局围栏将立即影响所有在线运行的智能体实例，请谨慎操作。</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            title: 'SQL 注入强力拦截',
                            desc: '拦截包含 DELETE/DROP/TRUNCATE 等高危关键词的 SQL 生成结果。',
                            active: true,
                            action: 'Block'
                        },
                        {
                            title: 'PII 敏感信息自动脱敏',
                            desc: '检测并掩盖响应中的 Email、手机号、身份证号。',
                            active: true,
                            action: 'Mask'
                        },
                        {
                            title: '提示词注入防护 (Prompt Injection)',
                            desc: '识别并拒绝类似 "Ignore previous instructions" 的越狱攻击。',
                            active: true,
                            action: 'Block'
                        },
                        {
                            title: '最大执行成本熔断',
                            desc: '单次会话成本超过 $1.0 时强制中断。',
                            active: false,
                            action: 'Terminate'
                        },
                    ].map((policy, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                            <div>
                                <div className="flex items-center">
                                    <h4 className="font-bold text-slate-800 text-sm mr-2">{policy.title}</h4>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200">
                                        Action: {policy.action}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{policy.desc}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium hover:underline">
                                    配置规则
                                </button>
                                {policy.active
                                    ? <ToggleRight className="w-8 h-8 text-indigo-600 cursor-pointer" />
                                    : <ToggleLeft className="w-8 h-8 text-slate-300 cursor-pointer" />
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Policy Simulator (P0) */}
            <div className="w-96 bg-white border-l border-slate-200 flex flex-col -my-8 -mr-8 border-t-0 shadow-xl z-10">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <Bug className="w-4 h-4 mr-2 text-indigo-600" />
                        策略测试器 (Simulator)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        输入样例请求，验证全局围栏的拦截效果与解释。
                    </p>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-white">
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">输入测试样本</label>
                        <textarea
                            value={testInput}
                            onChange={e => setTestInput(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 font-mono"
                            placeholder='尝试输入: "DROP TABLE users" 或 "My phone is 13800138000"...'
                        />
                    </div>

                    <button
                        onClick={handleRunTest}
                        disabled={!testInput || isTesting}
                        className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-all shadow-sm
                            ${testInput
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                        `}
                    >
                        {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                        {isTesting ? '正在检测...' : '运行检测'}
                    </button>

                    {/* Result Area */}
                    {testResult && (
                        <div className={`mt-6 rounded-lg border p-4 animate-in fade-in slide-in-from-bottom-2 ${testResult.status === 'PASS' ? 'bg-emerald-50 border-emerald-200' :
                                testResult.status === 'SANITIZED' ? 'bg-blue-50 border-blue-200' :
                                    'bg-rose-50 border-rose-200'
                            }`}>
                            <div className="flex items-center mb-2">
                                {testResult.status === 'PASS' && <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />}
                                {testResult.status === 'SANITIZED' && <ShieldCheck className="w-5 h-5 text-blue-600 mr-2" />}
                                {testResult.status === 'BLOCKED' && <XCircle className="w-5 h-5 text-rose-600 mr-2" />}
                                <span className={`font-bold text-sm ${testResult.status === 'PASS' ? 'text-emerald-800' :
                                        testResult.status === 'SANITIZED' ? 'text-blue-800' : 'text-rose-800'
                                    }`}>
                                    检测结果: {testResult.status}
                                </span>
                            </div>

                            {testResult.status !== 'PASS' && (
                                <div className="space-y-2 mt-3 pt-3 border-t border-black/5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="font-bold opacity-60">命中规则 (Rule):</span>
                                        <span className="font-mono font-medium">{testResult.rule}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold opacity-60">执行动作 (Action):</span>
                                        <span className="font-mono font-medium">{testResult.action}</span>
                                    </div>
                                    <div className="mt-2 p-2 bg-white/60 rounded border border-black/5">
                                        <span className="font-bold opacity-60 block mb-1">解释说明 (Explanation):</span>
                                        {testResult.detail}
                                    </div>
                                </div>
                            )}

                            {testResult.status === 'PASS' && (
                                <p className="text-xs text-emerald-700 mt-1">
                                    未触发任何阻断或脱敏规则，请求安全。
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelFactorySettingsView;
