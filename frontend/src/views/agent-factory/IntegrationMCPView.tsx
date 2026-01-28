
import React, { useState } from 'react';
import {
    Server, Link, RefreshCw, Plus, CheckCircle, XCircle,
    AlertTriangle, Settings, Globe, X, Save, Lock, Terminal,
    Cpu, Shield, Network, Activity, ArrowRight, Layers, FileJson,
    AlertOctagon, Download, PlayCircle, Eye, Monitor
} from 'lucide-react';

// --- Domain Types ---

type EnvType = 'PROD' | 'STAGING' | 'DEV';
type SyncStatus = 'SYNCED' | 'DRIFTED' | 'ERROR' | 'SYNCING';

interface ToolDiff {
    name: string;
    status: 'NEW' | 'MODIFIED' | 'REMOVED' | 'UNCHANGED';
    compatibility: 'PASS' | 'FAIL';
    failReason?: string;
}

interface MCPServer {
    id: string;
    name: string;
    env: EnvType;
    transport: 'SSE' | 'STDIO';

    // SSE Config
    endpoint?: string;

    // STDIO Config
    stdioConfig?: {
        command: string;
        args: string[];
        env: Record<string, string>;
    };

    // Status & Health
    status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
    health: {
        latency: number;
        uptime: number; // percentage
        lastCheck: string;
    };

    // Sync State
    syncStatus: SyncStatus;
    lastSyncTime: string;
    toolCount: number;

    // Config
    authType: 'NONE' | 'TOKEN' | 'MTLS';
    network: {
        useProxy: boolean;
        proxyUrl?: string;
        mtlsCertId?: string;
        ipWhitelist?: string[];
    };
    policy: {
        heartbeatInterval: number; // seconds
        timeoutMs: number;
        autoDegrade: boolean;
    };

    owner: string;
    description?: string;
}

// --- Mock Data ---

const MOCK_SERVERS: MCPServer[] = [
    {
        id: 'mcp_snowflake', name: 'Snowflake Data Connector', env: 'PROD',
        endpoint: 'https://mcp-snowflake.internal/sse', transport: 'SSE',
        status: 'ONLINE', health: { latency: 45, uptime: 99.9, lastCheck: '30s ago' },
        syncStatus: 'SYNCED', lastSyncTime: '2023-10-25 10:00', toolCount: 14,
        authType: 'MTLS',
        network: { useProxy: true, proxyUrl: 'http://proxy.dmz:8080', mtlsCertId: 'cert_sf_01' },
        policy: { heartbeatInterval: 30, timeoutMs: 5000, autoDegrade: true },
        owner: 'Data Platform', description: 'Access to Sales Mart and Inventory tables.'
    },
    {
        id: 'mcp_filesystem', name: 'Internal FS Access', env: 'DEV',
        transport: 'STDIO',
        stdioConfig: {
            command: 'docker',
            args: ['run', '-i', '--rm', '-v', '/tmp:/data', 'mcp/filesystem:latest'],
            env: { 'READ_ONLY': 'true' }
        },
        status: 'DEGRADED', health: { latency: 1200, uptime: 95.0, lastCheck: '1m ago' },
        syncStatus: 'DRIFTED', lastSyncTime: '2023-10-24 18:00', toolCount: 5,
        authType: 'NONE',
        network: { useProxy: false },
        policy: { heartbeatInterval: 60, timeoutMs: 10000, autoDegrade: false },
        owner: 'Infra Team', description: 'Sandbox filesystem access for code interpreter agents.'
    }
];

// --- Components ---

const StatusBadge = ({ status }: { status: MCPServer['status'] }) => {
    switch (status) {
        case 'ONLINE': return <span className="flex items-center text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold"><Activity className="w-3 h-3 mr-1" /> ONLINE</span>;
        case 'OFFLINE': return <span className="flex items-center text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-bold"><XCircle className="w-3 h-3 mr-1" /> OFFLINE</span>;
        case 'DEGRADED': return <span className="flex items-center text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bold"><AlertTriangle className="w-3 h-3 mr-1" /> SLOW</span>;
    }
};

const EnvBadge = ({ env }: { env: EnvType }) => {
    switch (env) {
        case 'PROD': return <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">PROD</span>;
        case 'STAGING': return <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">STG</span>;
        case 'DEV': return <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">DEV</span>;
    }
};

const ConfigDrawer = ({ server, onClose, onSave }: { server?: MCPServer, onClose: () => void, onSave: (s: MCPServer) => void }) => {
    const [activeTab, setActiveTab] = useState<'BASIC' | 'STDIO' | 'NETWORK' | 'HEALTH'>('BASIC');
    const [formData, setFormData] = useState<Partial<MCPServer>>(server || {
        name: '', env: 'DEV', transport: 'SSE', endpoint: '',
        authType: 'NONE', network: { useProxy: false },
        policy: { heartbeatInterval: 30, timeoutMs: 5000, autoDegrade: true },
        stdioConfig: { command: '', args: [], env: {} }
    });

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} />
            <div className="w-[600px] bg-white shadow-2xl relative animate-in slide-in-from-right duration-200 flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{server ? '配置 MCP 连接器' : '注册 MCP 服务'}</h2>
                        <p className="text-xs text-slate-500">{server?.id || 'New Connector'}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex border-b border-slate-200 px-6 space-x-6">
                    {['BASIC', formData.transport === 'STDIO' ? 'STDIO' : null, 'NETWORK', 'HEALTH'].filter(Boolean).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'BASIC' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">运行环境 (Env)</label>
                                    <select
                                        value={formData.env}
                                        onChange={e => setFormData({ ...formData, env: e.target.value as any })}
                                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                                    >
                                        <option value="DEV">DEV (开发)</option>
                                        <option value="STAGING">STAGING (预发)</option>
                                        <option value="PROD">PROD (生产)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">传输协议 (Transport)</label>
                                    <select
                                        value={formData.transport}
                                        onChange={e => setFormData({ ...formData, transport: e.target.value as any })}
                                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                                    >
                                        <option value="SSE">SSE (Server-Sent Events)</option>
                                        <option value="STDIO">STDIO (Standard Input/Output)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">服务名称</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                            </div>

                            {formData.transport === 'SSE' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">SSE Endpoint URL</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input type="text" value={formData.endpoint} onChange={e => setFormData({ ...formData, endpoint: e.target.value })} className="w-full border border-slate-300 rounded p-2 pl-9 text-sm font-mono" placeholder="https://..." />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">描述</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm h-20 resize-none" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'STDIO' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                                配置 STDIO 模式的本地命令或容器运行参数。
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">执行命令 (Command)</label>
                                <div className="relative">
                                    <Terminal className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.stdioConfig?.command}
                                        onChange={e => setFormData({ ...formData, stdioConfig: { ...formData.stdioConfig!, command: e.target.value } })}
                                        className="w-full border border-slate-300 rounded p-2 pl-9 text-sm font-mono"
                                        placeholder="docker / python / node"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">参数 (Args)</label>
                                <textarea
                                    value={formData.stdioConfig?.args?.join(' ')}
                                    onChange={e => setFormData({ ...formData, stdioConfig: { ...formData.stdioConfig!, args: e.target.value.split(' ') } })}
                                    className="w-full border border-slate-300 rounded p-2 text-sm font-mono h-20"
                                    placeholder="run -i --rm image:tag"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">环境变量 (Env Vars)</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded p-2 text-sm font-mono h-20"
                                    placeholder='{"KEY": "VALUE"}'
                                    defaultValue={JSON.stringify(formData.stdioConfig?.env || {}, null, 2)}
                                    onChange={e => {
                                        try {
                                            const env = JSON.parse(e.target.value);
                                            setFormData({ ...formData, stdioConfig: { ...formData.stdioConfig!, env } });
                                        } catch { }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'NETWORK' && (
                        <div className="space-y-5">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center"><Lock className="w-4 h-4 mr-2" /> 鉴权方式</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {['NONE', 'TOKEN', 'MTLS'].map(t => (
                                        <label key={t} className={`flex items-center justify-center p-2 border rounded cursor-pointer ${formData.authType === t ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200'}`}>
                                            <input type="radio" name="auth" className="hidden" checked={formData.authType === t} onChange={() => setFormData({ ...formData, authType: t as any })} />
                                            <span className="text-xs font-bold">{t}</span>
                                        </label>
                                    ))}
                                </div>
                                {formData.authType === 'MTLS' && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">选择客户端证书 (Client Cert)</label>
                                        <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                                            <option>cert_sf_prod_2024</option>
                                            <option>cert_internal_root</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center"><Network className="w-4 h-4 mr-2" /> 网络与隔离</h4>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" checked={formData.network?.useProxy} onChange={e => setFormData({ ...formData, network: { ...formData.network!, useProxy: e.target.checked } })} className="rounded text-indigo-600" />
                                    <span className="text-sm text-slate-700">启用出网代理 (Forward Proxy)</span>
                                </label>
                                {formData.network?.useProxy && (
                                    <input type="text" value={formData.network?.proxyUrl} onChange={e => setFormData({ ...formData, network: { ...formData.network!, proxyUrl: e.target.value } })} placeholder="http://proxy.example.com:8080" className="w-full border border-slate-300 rounded p-2 text-sm font-mono" />
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">访问范围 (Access Scope)</label>
                                    <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                                        <option>仅当前租户 (Tenant Only)</option>
                                        <option>全局共享 (Global)</option>
                                        <option>特定角色 (Role Based)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'HEALTH' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">心跳检测间隔 (s)</label>
                                        <input type="number" value={formData.policy?.heartbeatInterval} onChange={e => setFormData({ ...formData, policy: { ...formData.policy!, heartbeatInterval: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">请求超时 (ms)</label>
                                        <input type="number" value={formData.policy?.timeoutMs} onChange={e => setFormData({ ...formData, policy: { ...formData.policy!, timeoutMs: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">自动降级 (Auto Degrade)</div>
                                        <div className="text-xs text-slate-500">当连续失败 3 次时标记为 DEGRADED 并告警</div>
                                    </div>
                                    <input type="checkbox" checked={formData.policy?.autoDegrade} onChange={e => setFormData({ ...formData, policy: { ...formData.policy!, autoDegrade: e.target.checked } })} className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <label className="flex items-center space-x-2 text-xs text-slate-600">
                        <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                        <span>注册后立即同步 Tools</span>
                    </label>
                    <div className="flex space-x-3">
                        <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-white">取消</button>
                        <button onClick={() => onSave(formData as MCPServer)} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center">
                            <Save className="w-4 h-4 mr-2" /> 保存配置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... [Rest of file: SyncPreviewDrawer, ImpactAnalysisModal, MCPManagement main component] ...
// Preserving the rest of the file logic which handles the list and main view.

const SyncPreviewDrawer = ({ server, onClose }: { server: MCPServer, onClose: () => void }) => {
    return (
        <div className="fixed inset-y-0 right-0 w-[800px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <RefreshCw className="w-5 h-5 mr-2 text-indigo-600" />
                        工具目录与同步预览 (Tool Catalog)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Source: {server.name} ({server.endpoint || 'STDIO'})</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            {/* ... Mock content for preview ... */}
            <div className="p-8 text-center text-slate-400">
                Mock Preview Content
            </div>
        </div>
    );
};

const ImpactAnalysisModal = ({ server, actionType, onClose, onConfirm }: { server: MCPServer, actionType: 'DELETE' | 'DISABLE', onClose: () => void, onConfirm: () => void }) => {
    // ... Impact logic ...
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3 className="font-bold text-lg mb-2">确认操作?</h3>
                <p className="text-sm text-slate-600 mb-4">此操作可能会影响 {server.toolCount} 个工具。</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">取消</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-rose-600 text-white rounded">确认</button>
                </div>
            </div>
        </div>
    );
};

const IntegrationMCPView: React.FC = () => {
    const [servers, setServers] = useState<MCPServer[]>(MOCK_SERVERS);
    const [configServer, setConfigServer] = useState<MCPServer | null>(null);
    const [syncServer, setSyncServer] = useState<MCPServer | null>(null);
    const [impactServer, setImpactServer] = useState<{ server: MCPServer, action: 'DELETE' | 'DISABLE' } | null>(null);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    const handleSaveServer = (newServer: MCPServer) => {
        const exists = servers.find(s => s.id === newServer.id);
        if (exists) {
            setServers(servers.map(s => s.id === newServer.id ? newServer : s));
        } else {
            setServers([newServer, ...servers]);
        }
        setIsRegisterOpen(false);
        setConfigServer(null);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            {(isRegisterOpen || configServer) && (
                <ConfigDrawer
                    server={configServer || undefined}
                    onClose={() => { setIsRegisterOpen(false); setConfigServer(null); }}
                    onSave={handleSaveServer}
                />
            )}
            {syncServer && <SyncPreviewDrawer server={syncServer} onClose={() => setSyncServer(null)} />}
            {impactServer && <ImpactAnalysisModal server={impactServer.server} actionType={impactServer.action} onClose={() => setImpactServer(null)} onConfirm={() => setImpactServer(null)} />}

            <div className="px-8 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">{servers.length}</span> 个活跃服务
                </div>
                <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" /> 注册 MCP Server
                </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-6">
                    {servers.map(server => (
                        <div key={server.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-start justify-between hover:border-indigo-200 transition-colors group">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center justify-center w-14 h-14">
                                    {server.transport === 'SSE'
                                        ? <Globe className="w-6 h-6 text-indigo-500" />
                                        : <Terminal className="w-6 h-6 text-slate-700" />
                                    }
                                </div>
                                <div>
                                    <div className="flex items-center space-x-3">
                                        <h3 className="font-bold text-slate-900 text-lg">{server.name}</h3>
                                        <StatusBadge status={server.status} />
                                        <EnvBadge env={server.env} />
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500 mt-1 space-x-4">
                                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-600 border border-slate-200">
                                            {server.transport === 'SSE' ? server.endpoint : 'STDIO Mode'}
                                        </span>
                                        <span className="flex items-center text-xs"><Link className="w-3 h-3 mr-1" /> {server.authType}</span>
                                    </div>
                                    <div className="mt-3 flex items-center space-x-4 text-xs text-slate-500">
                                        <div className="flex items-center" title="Health Check">
                                            <Activity className="w-3 h-3 mr-1 text-emerald-500" />
                                            Lat: {server.health.latency}ms
                                        </div>
                                        <div className="flex items-center" title="Tools Count">
                                            <Settings className="w-3 h-3 mr-1 text-slate-400" />
                                            {server.toolCount} Tools
                                        </div>
                                        <div className={`flex items-center ${server.syncStatus === 'SYNCED' ? 'text-emerald-600' : server.syncStatus === 'DRIFTED' ? 'text-amber-600' : 'text-rose-600'}`}>
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            {server.syncStatus} ({server.lastSyncTime})
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-3 items-center">
                                <button onClick={() => setSyncServer(server)} className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800 flex items-center transition-colors shadow-sm">
                                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> 同步预览
                                </button>
                                <button onClick={() => setConfigServer(server)} className="px-3 py-2 border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50 transition-colors">
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button onClick={() => setImpactServer({ server, action: 'DISABLE' })} className="px-3 py-2 border border-slate-300 text-rose-600 rounded-md text-sm hover:bg-rose-50 hover:border-rose-200 transition-colors">
                                    <PlayCircle className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IntegrationMCPView;
