
import React, { useState } from 'react';
import { 
  Database, FileText, Globe, Server, RefreshCw, Plus, 
  MoreHorizontal, CheckCircle, AlertCircle, Clock, 
  Search, Filter, Lock, Settings, ChevronRight, X, Save,
  Play, RotateCcw, Layers, Shield, Key, History,
  FileJson, Zap, Link as LinkIcon, AlertTriangle,
  ArrowRight, HardDrive, Cpu, AlignLeft, Split,
  Trash2, ExternalLink, Calendar, Users, UploadCloud,
  Check
} from 'lucide-react';

// --- Types ---

type ConnectorType = 'DOCUMENT' | 'DATABASE' | 'SEMANTIC' | 'API';
type SyncStatus = 'CONNECTED' | 'SYNCING' | 'ERROR' | 'PAUSED';

interface SyncRun {
    id: string;
    status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    startTime: string;
    duration: string;
    itemsProcessed: number;
    itemsFailed: number;
    error?: string;
}

interface KnowledgeSource {
  id: string;
  name: string;
  type: ConnectorType;
  provider: string; // e.g., 'SharePoint', 'Snowflake', 'Custom'
  status: SyncStatus;
  lastSync: string;
  
  // Metrics
  stats: {
      totalItems: number;
      storageSize: string;
      lastRunStatus: 'SUCCESS' | 'FAILURE';
  };

  description: string;
  tags: string[];

  // Config Stubs (for UI state)
  config: {
      authType: string;
      syncFrequency: string;
      indexingModel: string;
  };
  
  // Mock Data for Tabs
  runs: SyncRun[];
  bindings: { id: string; name: string; type: 'PACK' | 'AGENT' }[];
}

// --- Mock Data ---

const MOCK_SOURCES: KnowledgeSource[] = [
  {
    id: 'ks_1', name: '企业政策文库 (Policy Library)', type: 'DOCUMENT', provider: 'SharePoint',
    status: 'CONNECTED', lastSync: '10分钟前',
    stats: { totalItems: 1250, storageSize: '450 MB', lastRunStatus: 'SUCCESS' },
    description: '包含全局 HR、IT 及合规部门的标准作业程序文档。',
    tags: ['HR', '合规'],
    config: { authType: 'OAUTH', syncFrequency: 'HOURLY', indexingModel: 'text-embedding-3-small' },
    runs: [
        { id: 'run_101', status: 'SUCCESS', startTime: 'Today 10:00', duration: '45s', itemsProcessed: 12, itemsFailed: 0 },
        { id: 'run_100', status: 'SUCCESS', startTime: 'Today 09:00', duration: '42s', itemsProcessed: 5, itemsFailed: 0 }
    ],
    bindings: [{ id: 'pack_hr', name: 'HR 助手策略包', type: 'PACK' }]
  },
  {
    id: 'ks_2', name: '销售数仓 (Sales Gold)', type: 'DATABASE', provider: 'Snowflake',
    status: 'ERROR', lastSync: '2小时前',
    stats: { totalItems: 85000, storageSize: '1.2 GB', lastRunStatus: 'FAILURE' },
    description: '销售分析与营收报表的金层数据表 (Gold Layer)。',
    tags: ['销售', '财务'],
    config: { authType: 'SERVICE_ACCOUNT', syncFrequency: 'DAILY', indexingModel: 'N/A (Structured)' },
    runs: [
        { id: 'run_205', status: 'FAILURE', startTime: 'Today 08:00', duration: '2m', itemsProcessed: 0, itemsFailed: 0, error: 'Connection Timeout (Snowflake)' },
        { id: 'run_204', status: 'SUCCESS', startTime: 'Yesterday 08:00', duration: '15m', itemsProcessed: 1200, itemsFailed: 0 }
    ],
    bindings: [{ id: 'agent_sales', name: '销售洞察 Bot', type: 'AGENT' }]
  },
  {
    id: 'ks_3', name: '产品知识图谱 (Product KG)', type: 'SEMANTIC', provider: 'Neo4j',
    status: 'SYNCING', lastSync: '同步中...',
    stats: { totalItems: 4500, storageSize: '320 MB', lastRunStatus: 'SUCCESS' },
    description: '产品目录的实体关系与属性图谱。',
    tags: ['产品', '研发'],
    config: { authType: 'BASIC', syncFrequency: 'REALTIME', indexingModel: 'custom-graph-v1' },
    runs: [],
    bindings: []
  }
];

// --- Components ---

const StatusBadge = ({ status }: { status: SyncStatus }) => {
    switch(status) {
        case 'CONNECTED': return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 text-[10px] font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> 已连接</span>;
        case 'SYNCING': return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 text-[10px] font-bold flex items-center"><RefreshCw className="w-3 h-3 mr-1 animate-spin"/> 同步中</span>;
        case 'ERROR': return <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 text-[10px] font-bold flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> 异常</span>;
        case 'PAUSED': return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold">已暂停</span>;
    }
};

const TypeIcon = ({ type }: { type: ConnectorType }) => {
    switch(type) {
        case 'DOCUMENT': return <FileText className="w-5 h-5 text-blue-500" />;
        case 'DATABASE': return <Database className="w-5 h-5 text-indigo-500" />;
        case 'SEMANTIC': return <Layers className="w-5 h-5 text-purple-500" />;
        case 'API': return <Globe className="w-5 h-5 text-slate-500" />;
    }
};

// --- Create Wizard Component ---

const CreateSourceWizard = ({ onClose, onCreate }: { onClose: () => void, onCreate: (s: KnowledgeSource) => void }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<{
        type: ConnectorType | null;
        provider: string;
        name: string;
        endpoint: string;
        authType: string;
        syncFreq: string;
    }>({
        type: null,
        provider: '',
        name: '',
        endpoint: '',
        authType: 'OAUTH',
        syncFreq: 'HOURLY'
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);
    
    const handleSubmit = () => {
        const newSource: KnowledgeSource = {
            id: `ks_${Date.now()}`,
            name: formData.name,
            type: formData.type!,
            provider: formData.provider,
            status: 'SYNCING',
            lastSync: '等待同步',
            stats: { totalItems: 0, storageSize: '0 KB', lastRunStatus: 'SUCCESS' },
            description: '新创建的知识源。',
            tags: ['New'],
            config: {
                authType: formData.authType,
                syncFrequency: formData.syncFreq,
                indexingModel: 'text-embedding-3-small'
            },
            runs: [],
            bindings: []
        };
        onCreate(newSource);
    };

    const PROVIDERS = {
        DOCUMENT: ['SharePoint', 'Google Drive', 'S3 Bucket', 'Confluence'],
        DATABASE: ['Snowflake', 'PostgreSQL', 'MySQL', 'BigQuery'],
        SEMANTIC: ['dbt Semantic Layer', 'Cube', 'Looker', 'Neo4j'],
        API: ['REST API', 'GraphQL', 'RSS Feed']
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[600px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">连接新知识源</h2>
                        <div className="flex space-x-2 mt-1.5">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-1 w-8 rounded-full transition-colors ${step >= i ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                            ))}
                            <span className="text-xs text-slate-500 ml-2 font-medium">第 {step} 步 / 共 4 步</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-10">
                    {/* Step 1: Type Selection */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 text-center mb-8">选择数据源类型</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'DOCUMENT', label: '非结构化文档', desc: 'PDF, Word, Wiki, SharePoint', icon: FileText, color: 'text-blue-600 bg-blue-50' },
                                    { id: 'DATABASE', label: '结构化数据库', desc: 'SQL Warehouses, NoSQL', icon: Database, color: 'text-indigo-600 bg-indigo-50' },
                                    { id: 'SEMANTIC', label: '语义层与图谱', desc: 'Semantic Models, Knowledge Graphs', icon: Layers, color: 'text-purple-600 bg-purple-50' },
                                    { id: 'API', label: 'API 服务', desc: 'REST / GraphQL Endpoints', icon: Globe, color: 'text-slate-600 bg-slate-50' },
                                ].map(item => (
                                    <div 
                                        key={item.id}
                                        onClick={() => setFormData({ ...formData, type: item.id as ConnectorType, provider: '' })}
                                        className={`
                                            p-6 border-2 rounded-xl cursor-pointer transition-all flex items-start space-x-4 hover:shadow-md
                                            ${formData.type === item.id 
                                                ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-500' 
                                                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
                                        `}
                                    >
                                        <div className={`p-3 rounded-lg ${item.color}`}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.label}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Connection Details */}
                    {step === 2 && formData.type && (
                        <div className="space-y-6 max-w-xl mx-auto">
                            <h3 className="text-lg font-bold text-slate-800 text-center mb-6">连接配置 ({formData.type})</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">选择提供商 (Provider)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PROVIDERS[formData.type].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setFormData({...formData, provider: p})}
                                                className={`py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                                                    formData.provider === p 
                                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                                    : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-300'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">知识源名称</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="例如：工程部 Wiki"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">连接地址 (Endpoint / URL)</label>
                                    <input 
                                        type="text" 
                                        value={formData.endpoint}
                                        onChange={e => setFormData({...formData, endpoint: e.target.value})}
                                        className="w-full border border-slate-300 rounded-md p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder={formData.type === 'DATABASE' ? 'jdbc:snowflake://...' : 'https://...'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">认证方式</label>
                                    <select 
                                        value={formData.authType}
                                        onChange={e => setFormData({...formData, authType: e.target.value})}
                                        className="w-full border border-slate-300 rounded-md p-2.5 text-sm bg-white"
                                    >
                                        <option value="OAUTH">OAuth 2.0</option>
                                        <option value="SERVICE_ACCOUNT">Service Account Key</option>
                                        <option value="BASIC">用户名 / 密码</option>
                                        <option value="NONE">无认证 (公开)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Strategy */}
                    {step === 3 && (
                        <div className="space-y-6 max-w-xl mx-auto">
                            <h3 className="text-lg font-bold text-slate-800 text-center mb-6">同步与索引策略</h3>
                            
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">同步频率 (Sync Frequency)</label>
                                    <div className="flex gap-2">
                                        {[
                                            {id: 'REALTIME', label: '实时 (Realtime)'}, 
                                            {id: 'HOURLY', label: '每小时'}, 
                                            {id: 'DAILY', label: '每天'}, 
                                            {id: 'MANUAL', label: '手动'}
                                        ].map(freq => (
                                            <button
                                                key={freq.id}
                                                onClick={() => setFormData({...formData, syncFreq: freq.id})}
                                                className={`flex-1 py-2 rounded-md text-xs font-medium border transition-colors ${
                                                    formData.syncFreq === freq.id
                                                    ? 'bg-white border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                                    : 'bg-white border-slate-300 text-slate-600 hover:border-indigo-300'
                                                }`}
                                            >
                                                {freq.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {formData.syncFreq === 'REALTIME' ? '使用 Webhook 或 CDC 实时捕获变更。' : `每 ${formData.syncFreq.toLowerCase()} 执行一次全量或增量同步。`}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-200">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">默认索引模型</label>
                                    <select className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white" disabled>
                                        <option>text-embedding-3-small (Default)</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">可在创建后在详情页修改高级索引配置。</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-6 max-w-xl mx-auto text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UploadCloud className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">准备就绪</h3>
                            <p className="text-slate-600">
                                即将创建知识源 <strong>{formData.name}</strong> 并启动首次同步。
                            </p>
                            
                            <div className="bg-slate-50 rounded-lg p-4 text-left border border-slate-200 text-sm space-y-2 mt-4">
                                <div className="flex justify-between"><span className="text-slate-500">类型:</span> <span className="font-medium">{formData.type}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">提供商:</span> <span className="font-medium">{formData.provider}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">地址:</span> <span className="font-mono text-xs">{formData.endpoint}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">频率:</span> <span className="font-medium">{formData.syncFreq}</span></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-between">
                    <button 
                        onClick={handleBack}
                        disabled={step === 1}
                        className="px-5 py-2 border border-slate-300 rounded-md text-slate-600 disabled:opacity-50 hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                        上一步
                    </button>
                    <div className="flex space-x-3">
                        {step < 4 ? (
                            <button 
                                onClick={handleNext}
                                disabled={step === 1 && !formData.type || step === 2 && !formData.name}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                下一步
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm text-sm font-medium transition-colors flex items-center"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> 确认创建
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SourceDrawer = ({ source, onClose }: { source: KnowledgeSource, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONNECT' | 'SYNC' | 'INDEX' | 'ACCESS' | 'LOGS'>('OVERVIEW');

    return (
        <div className="fixed inset-y-0 right-0 w-[800px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <TypeIcon type={source.type} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{source.name}</h2>
                        <div className="flex items-center space-x-3 mt-1">
                            <StatusBadge status={source.status} />
                            <span className="text-xs text-slate-500 flex items-center">
                                <HardDrive className="w-3 h-3 mr-1" /> {source.provider}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> 上次同步: {source.lastSync}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <div className="px-6 border-b border-slate-200 flex space-x-6 overflow-x-auto">
                {[
                    { id: 'OVERVIEW', label: '概览', icon: AlignLeft },
                    { id: 'CONNECT', label: '连接配置', icon: LinkIcon },
                    { id: 'SYNC', label: '同步策略', icon: RefreshCw },
                    { id: 'INDEX', label: '索引与检索', icon: FileJson },
                    { id: 'ACCESS', label: '权限与绑定', icon: Shield },
                    { id: 'LOGS', label: '运行日志', icon: History },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-3 text-sm font-medium transition-colors border-b-2 flex items-center whitespace-nowrap ${
                            activeTab === tab.id 
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
                
                {/* 1. Overview */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">总条目数 (Items)</div>
                                <div className="text-2xl font-bold text-slate-800">{source.stats.totalItems.toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">存储占用 (Storage)</div>
                                <div className="text-2xl font-bold text-slate-800">{source.stats.storageSize}</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">上次同步结果</div>
                                <div className={`text-xl font-bold ${source.stats.lastRunStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {source.stats.lastRunStatus}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-2">描述与标签</h3>
                            <p className="text-sm text-slate-600 mb-4">{source.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {source.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Connect (Auth) */}
                {activeTab === 'CONNECT' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <Key className="w-4 h-4 mr-2 text-indigo-500" /> 认证与凭据
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">认证方式</label>
                                <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white" defaultValue={source.config.authType}>
                                    <option value="OAUTH">OAuth 2.0</option>
                                    <option value="SERVICE_ACCOUNT">Service Account (Key)</option>
                                    <option value="BASIC">Basic Auth</option>
                                </select>
                            </div>
                            {source.config.authType === 'SERVICE_ACCOUNT' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Secret Key</label>
                                    <div className="flex space-x-2">
                                        <input type="password" value="********" readOnly className="flex-1 border border-slate-300 rounded p-2 text-sm bg-slate-50" />
                                        <button className="px-3 py-2 border border-slate-300 rounded text-xs hover:bg-slate-50">更新</button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">引用自 Secret Manager: <code>secrets.snowflake_prod_key</code></p>
                                </div>
                            )}
                            <div className="pt-2">
                                <button className="w-full py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-center">
                                    <Zap className="w-4 h-4 mr-2" /> 测试连接
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Sync */}
                {activeTab === 'SYNC' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <RefreshCw className="w-4 h-4 mr-2 text-indigo-500" /> 同步策略
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">同步频率</label>
                                    <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white" defaultValue={source.config.syncFrequency}>
                                        <option value="HOURLY">每小时 (Hourly)</option>
                                        <option value="DAILY">每天 (Daily)</option>
                                        <option value="REALTIME">实时 (Realtime/CDC)</option>
                                        <option value="MANUAL">手动 (Manual)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">增量策略</label>
                                    <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                                        <option>基于时间戳 (Modified At)</option>
                                        <option>基于游标 (Cursor ID)</option>
                                        <option>全量扫描 (Full Scan)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">包含路径 (Include Paths)</label>
                                <textarea className="w-full border border-slate-300 rounded p-2 text-sm font-mono h-20" defaultValue="/shared/policies/*\n/hr/handbook/*.pdf" />
                            </div>
                            
                            <div className="flex items-center space-x-2 pt-2">
                                <input type="checkbox" className="rounded text-indigo-600" defaultChecked />
                                <span className="text-sm text-slate-700">启用软删除检测 (Soft Delete)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Index (P1) */}
                {activeTab === 'INDEX' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-5">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <FileJson className="w-4 h-4 mr-2 text-indigo-500" /> 索引与分块配置
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Embedding 模型</label>
                                    <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white" defaultValue={source.config.indexingModel}>
                                        <option value="text-embedding-3-small">OpenAI Text Embedding 3 Small</option>
                                        <option value="text-embedding-3-large">OpenAI Text Embedding 3 Large</option>
                                        <option value="cohere-embed-v3">Cohere Embed v3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">分块大小 (Chunk Size)</label>
                                    <input type="number" defaultValue={512} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">分块策略 (Chunking Strategy)</label>
                                <div className="flex gap-2">
                                    {['固定大小', '语义分块', '层级分块'].map(s => (
                                        <button key={s} className={`px-3 py-1.5 border rounded text-xs ${s === '固定大小' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <button className="text-xs text-indigo-600 hover:underline flex items-center">
                                    <Settings className="w-3 h-3 mr-1" /> 高级检索配置 (Rerank, 混合检索)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Access (P0) */}
                {activeTab === 'ACCESS' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <LinkIcon className="w-4 h-4 mr-2 text-indigo-500" /> 使用绑定 (Bindings)
                            </h3>
                            <p className="text-xs text-slate-500">指定哪些智能体或运行包有权限检索此知识源。</p>
                            
                            <div className="space-y-2">
                                {source.bindings.map((bind, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded bg-slate-50">
                                        <div className="flex items-center">
                                            {bind.type === 'PACK' ? <Layers className="w-4 h-4 mr-2 text-slate-400" /> : <Cpu className="w-4 h-4 mr-2 text-slate-400" />}
                                            <span className="text-sm font-medium text-slate-700">{bind.name}</span>
                                            <span className="ml-2 text-[10px] bg-white border px-1.5 rounded text-slate-500">{bind.type}</span>
                                        </div>
                                        <button className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {source.bindings.length === 0 && <div className="text-center py-4 text-slate-400 text-xs">暂无绑定</div>}
                                <button className="w-full py-2 border border-dashed border-slate-300 rounded text-xs text-slate-500 hover:text-indigo-600">
                                    + 绑定到智能体/运行包
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <Lock className="w-4 h-4 mr-2 text-indigo-500" /> 权限与 ACL
                            </h3>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="rounded text-indigo-600" />
                                <span className="text-sm text-slate-700">启用权限同步 (Sync ACLs from Source)</span>
                            </label>
                            <p className="text-xs text-slate-500">
                                开启后，系统将尝试同步源系统的用户/组权限，并在检索时进行过滤。
                            </p>
                        </div>
                    </div>
                )}

                {/* 6. Logs (P0) */}
                {activeTab === 'LOGS' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800">同步历史 (Sync History)</h3>
                            <button className="text-xs text-indigo-600 hover:underline">查看完整日志</button>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 font-medium text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2">开始时间</th>
                                        <th className="px-4 py-2">状态</th>
                                        <th className="px-4 py-2">耗时</th>
                                        <th className="px-4 py-2">Items (Ok/Fail)</th>
                                        <th className="px-4 py-2">信息</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {source.runs.map(run => (
                                        <tr key={run.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 text-slate-500">{run.startTime}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-1.5 py-0.5 rounded font-bold ${
                                                    run.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                                                    run.status === 'FAILURE' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {run.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-slate-600 font-mono">{run.duration}</td>
                                            <td className="px-4 py-2 text-slate-600">{run.itemsProcessed} / <span className="text-rose-500">{run.itemsFailed}</span></td>
                                            <td className="px-4 py-2 text-slate-500 truncate max-w-[150px]" title={run.error}>{run.error || '-'}</td>
                                        </tr>
                                    ))}
                                    {source.runs.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400">暂无记录</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center">
                <div className="text-xs text-slate-400">ID: {source.id}</div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 shadow-sm flex items-center">
                        <RefreshCw className="w-3.5 h-3.5 mr-2" /> 立即同步
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center">
                        <Save className="w-3.5 h-3.5 mr-2" /> 保存配置
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const KnowledgeConnectors: React.FC = () => {
  const [sources, setSources] = useState<KnowledgeSource[]>(MOCK_SOURCES);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);

  const selectedSource = sources.find(s => s.id === selectedSourceId);

  const filteredSources = sources.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSource = (newSource: KnowledgeSource) => {
      setSources([newSource, ...sources]);
      setIsCreateWizardOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      
      {isCreateWizardOpen && (
          <CreateSourceWizard 
            onClose={() => setIsCreateWizardOpen(false)} 
            onCreate={handleCreateSource} 
          />
      )}

      {selectedSource && (
          <>
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" onClick={() => setSelectedSourceId(null)} />
            <SourceDrawer source={selectedSource} onClose={() => setSelectedSourceId(null)} />
          </>
      )}

      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">知识源与连接 (Knowledge Sources)</h1>
            <p className="text-sm text-slate-500 mt-1">管理智能体可访问的外部数据、文档库与语义资产。</p>
        </div>
        <button 
            onClick={() => setIsCreateWizardOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 flex items-center"
        >
             <Plus className="w-4 h-4 mr-2" />
             新建知识源
        </button>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center space-x-4 shrink-0">
          <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                  type="text" 
                  placeholder="搜索知识源..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
          </div>
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              {['全部', '文档', '数据库', '语义层', 'API'].map(tab => (
                  <button key={tab} className="px-3 py-1.5 text-xs font-medium text-slate-600 rounded-md hover:bg-white hover:shadow-sm transition-all">
                      {tab}
                  </button>
              ))}
          </div>
      </div>

      {/* Grid */}
      <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSources.map(source => (
                  <div 
                    key={source.id} 
                    onClick={() => setSelectedSourceId(source.id)}
                    className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                  >
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                  <TypeIcon type={source.type} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{source.name}</h3>
                                  <p className="text-xs text-slate-400 mt-0.5">{source.provider}</p>
                              </div>
                          </div>
                          <StatusBadge status={source.status} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                              <div className="text-slate-400 mb-0.5">条目数</div>
                              <div className="font-bold">{source.stats.totalItems.toLocaleString()}</div>
                          </div>
                          <div>
                              <div className="text-slate-400 mb-0.5">占用空间</div>
                              <div className="font-bold">{source.stats.storageSize}</div>
                          </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-50">
                          <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {source.lastSync}
                          </div>
                          <button className="text-indigo-600 font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                              配置详情
                          </button>
                      </div>
                  </div>
              ))}
              
              {/* Add New Card Stub */}
              <button 
                onClick={() => setIsCreateWizardOpen(true)}
                className="border-2 border-dashed border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors bg-slate-50/50 hover:bg-slate-50"
              >
                  <Plus className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm font-medium">连接新数据源</span>
              </button>
          </div>
      </div>
    </div>
  );
};

export default KnowledgeConnectors;
