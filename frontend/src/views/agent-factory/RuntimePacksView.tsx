
import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Shield, Cpu, Zap, Play, CheckCircle, AlertTriangle, 
  Search, Plus, Settings, Layers, ArrowRight, GitBranch, 
  MoreHorizontal, RotateCcw, Save, X, Network, Filter,
  FileText, Activity, Clock, AlertOctagon, Check, ChevronRight,
  Database, Globe, Lock, Trash2, Eye, History, User, RefreshCw,
  GitCommit, Scale, MousePointer2, StopCircle
} from 'lucide-react';

// --- Types ---

type PackStatus = 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
type CapabilityType = 'QNA' | 'AGENT' | 'REPORT';
type EnvType = 'PROD' | 'STAGING' | 'DEV';

interface RuntimePack {
  id: string;
  name: string;
  domain: string;
  capability: CapabilityType;
  semanticVersion: string;
  status: PackStatus;
  env: EnvType;
  owner: string;
  updatedAt: string;
  deployment: {
    stable: string;
    canary?: string;
    canaryWeight?: number; // 0-100
  };
  policies: {
    model: {
        primary: string;
        fallback: string;
        budgetPerRequest: number; // USD
    };
    guardrails: {
        sqlInjection: { enabled: boolean; action: 'BLOCK' | 'WARN'; };
        piiRedaction: { enabled: boolean; method: 'MASK' | 'HASH'; };
        competitorFilter: { enabled: boolean; keywords: string[]; };
    };
    tools: {
        timeoutMs: number;
        maxRetries: number;
        allowedCategories: string[];
        toolAllowlist: string[]; // Tool IDs
        sideEffectGate: 'BLOCK' | 'APPROVAL' | 'ALLOW';
    };
  };
}

// --- Mock Data ---

const MOCK_PACKS: RuntimePack[] = [
  {
    id: 'pack_sc_01', name: '供应链-通用问数包', domain: 'Supply Chain', capability: 'QNA',
    semanticVersion: 'Retail_v4', status: 'ACTIVE', env: 'PROD', owner: 'SC Team', updatedAt: '10 mins ago',
    deployment: { stable: 'v2.1.0', canary: 'v2.2.0-rc1', canaryWeight: 10 },
    policies: {
        model: { primary: 'gpt-4-turbo', fallback: 'gpt-3.5-turbo', budgetPerRequest: 0.1 },
        guardrails: { 
            sqlInjection: { enabled: true, action: 'BLOCK' }, 
            piiRedaction: { enabled: true, method: 'MASK' },
            competitorFilter: { enabled: false, keywords: [] }
        },
        tools: { 
            timeoutMs: 5000, maxRetries: 3, allowedCategories: ['Read-Only'], 
            toolAllowlist: ['t_sql_gen', 't_inventory_check'], 
            sideEffectGate: 'BLOCK' 
        }
    }
  },
  {
    id: 'pack_hr_02', name: 'HR-招聘助手策略包', domain: 'HR', capability: 'AGENT',
    semanticVersion: 'HR_Policy_v1', status: 'ACTIVE', env: 'PROD', owner: 'HR Tech', updatedAt: '2 days ago',
    deployment: { stable: 'v1.0.5' },
    policies: {
        model: { primary: 'claude-3-opus', fallback: 'claude-3-sonnet', budgetPerRequest: 0.5 },
        guardrails: { 
            sqlInjection: { enabled: false, action: 'WARN' }, 
            piiRedaction: { enabled: true, method: 'HASH' },
            competitorFilter: { enabled: true, keywords: ['CompetitorX'] }
        },
        tools: { 
            timeoutMs: 10000, maxRetries: 1, allowedCategories: ['Email', 'Schedule'], 
            toolAllowlist: ['t_email_send', 't_calendar_book'], 
            sideEffectGate: 'APPROVAL' 
        }
    }
  }
];

const AVAILABLE_TOOLS = [
    { id: 't_sql_gen', name: 'SQL Generator', type: 'TRANSFORM', risk: 'LOW' },
    { id: 't_email_send', name: 'Email Sender', type: 'ACTION', risk: 'HIGH' },
    { id: 't_inventory_check', name: 'Inventory Lookup', type: 'RETRIEVAL', risk: 'LOW' },
    { id: 't_calendar_book', name: 'Calendar Booking', type: 'ACTION', risk: 'MEDIUM' },
    { id: 't_web_search', name: 'Web Search', type: 'RETRIEVAL', risk: 'MEDIUM' },
];

const SEMANTIC_VERSIONS = [
    { id: 'Retail_v4', status: 'STABLE', coverage: '98%', objects: 142 },
    { id: 'Retail_v5-beta', status: 'BETA', coverage: '100%', objects: 156 },
    { id: 'Finance_GL_v2', status: 'STABLE', coverage: '95%', objects: 88 },
];

// --- Sub-Components (Drawers & Modals) ---

const ReleaseDrawer = ({ pack, onClose }: { pack: RuntimePack, onClose: () => void }) => {
    const [traffic, setTraffic] = useState(pack.deployment.canaryWeight || 0);

    return (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">发布管理 (Release)</h2>
                    <p className="text-xs text-slate-500">{pack.name} ({pack.id})</p>
                </div>
                <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Stable Section */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                            <span className="font-bold text-emerald-900">Stable (生产版)</span>
                        </div>
                        <span className="bg-white text-emerald-800 px-2 py-0.5 rounded text-xs font-mono border border-emerald-200">
                            {pack.deployment.stable}
                        </span>
                    </div>
                    <div className="text-xs text-emerald-700 mb-4">当前承接 {100 - traffic}% 流量</div>
                    {pack.deployment.canary && (
                        <button className="w-full py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 shadow-sm">
                            Promote Canary to Stable
                        </button>
                    )}
                </div>

                {/* Canary Section */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                            <GitBranch className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="font-bold text-blue-900">Canary (灰度版)</span>
                        </div>
                        {pack.deployment.canary ? (
                            <span className="bg-white text-blue-800 px-2 py-0.5 rounded text-xs font-mono border border-blue-200">
                                {pack.deployment.canary}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400 italic">无灰度版本</span>
                        )}
                    </div>
                    
                    {pack.deployment.canary ? (
                        <div className="space-y-4 mt-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-600">流量权重 (Traffic Weight)</span>
                                    <span className="font-bold text-blue-700">{traffic}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" step="5"
                                    value={traffic} onChange={(e) => setTraffic(parseInt(e.target.value))}
                                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button className="flex-1 py-2 border border-slate-300 bg-white text-slate-700 rounded text-sm font-medium hover:bg-slate-50">
                                    Publish Draft
                                </button>
                                <button className="flex-1 py-2 border border-rose-200 bg-rose-50 text-rose-600 rounded text-sm font-medium hover:bg-rose-100">
                                    Rollback
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 text-center">
                            <button className="px-4 py-2 border border-blue-300 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50">
                                发布 Draft 到 Canary
                            </button>
                        </div>
                    )}
                </div>

                {/* Diff Section Mock */}
                <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2">变更摘要 (Diff)</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono space-y-1">
                        <div className="text-emerald-600">+ guardrails.piiRedaction: enabled</div>
                        <div className="text-rose-600">- model.budgetPerRequest: 0.05</div>
                        <div className="text-emerald-600">+ model.budgetPerRequest: 0.10</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolPickerDrawer = ({ selected, onSelect, onClose }: { selected: string[], onSelect: (ids: string[]) => void, onClose: () => void }) => {
    const [localSelected, setLocalSelected] = useState<string[]>(selected);

    const toggle = (id: string) => {
        if (localSelected.includes(id)) setLocalSelected(localSelected.filter(i => i !== id));
        else setLocalSelected([...localSelected, id]);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-[60] flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">选择允许的工具</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr><th className="px-4 py-2">Select</th><th className="px-4 py-2">Tool Name</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Risk</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {AVAILABLE_TOOLS.map(tool => (
                                <tr key={tool.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => toggle(tool.id)}>
                                    <td className="px-4 py-3">
                                        <input type="checkbox" checked={localSelected.includes(tool.id)} readOnly className="rounded text-indigo-600" />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-700">{tool.name}</td>
                                    <td className="px-4 py-3"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{tool.type}</span></td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${tool.risk === 'HIGH' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{tool.risk}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded text-sm hover:bg-slate-50">取消</button>
                    <button onClick={() => { onSelect(localSelected); onClose(); }} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">确认添加 ({localSelected.length})</button>
                </div>
            </div>
        </div>
    );
};

// --- Wizard Component (P0) ---

const CreatePackWizard = ({ onClose, onComplete }: { onClose: () => void, onComplete: () => void }) => {
    const [step, setStep] = useState(1);
    
    // Mock Form State
    const [formData, setFormData] = useState({
        name: '', capability: 'QNA', domain: 'Supply Chain', env: 'PROD',
        semanticVersion: '', compatibilityMode: 'STRICT',
        primaryModel: 'gpt-4-turbo', fallbackModel: 'gpt-3.5-turbo',
        selectedTools: [] as string[]
    });

    const [isToolPickerOpen, setIsToolPickerOpen] = useState(false);

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in zoom-in-95 duration-200">
            {isToolPickerOpen && (
                <ToolPickerDrawer 
                    selected={formData.selectedTools} 
                    onSelect={(ids) => { setFormData({...formData, selectedTools: ids}); setIsToolPickerOpen(false); }} 
                    onClose={() => setIsToolPickerOpen(false)} 
                />
            )}
            
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                {/* Wizard Header */}
                <div className="px-8 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">创建运行包 (Create Runtime Pack)</h2>
                        <div className="flex space-x-2 mt-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`h-1.5 w-10 rounded-full transition-colors ${step >= i ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                            ))}
                            <span className="text-xs text-slate-500 ml-2 font-medium">Step {step} of 5</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
                </div>

                {/* Wizard Body */}
                <div className="flex-1 overflow-y-auto p-10">
                    
                    {/* STEP 1: Basic Info */}
                    {step === 1 && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">1. 基础信息</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">运行包名称</label>
                                    <input type="text" className="w-full border border-slate-300 rounded-md p-2.5 text-sm" placeholder="e.g. 供应链问数策略" 
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">能力类型</label>
                                    <select className="w-full border border-slate-300 rounded-md p-2.5 bg-white text-sm"
                                        value={formData.capability} onChange={e => setFormData({...formData, capability: e.target.value})}>
                                        <option value="QNA">智能问数 (QNA)</option>
                                        <option value="AGENT">智能体 (AGENT)</option>
                                        <option value="REPORT">报告生成 (REPORT)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">业务域</label>
                                    <select className="w-full border border-slate-300 rounded-md p-2.5 bg-white text-sm"
                                        value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})}>
                                        <option>Supply Chain</option>
                                        <option>Finance</option>
                                        <option>HR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">运行环境</label>
                                    <select className="w-full border border-slate-300 rounded-md p-2.5 bg-white text-sm"
                                        value={formData.env} onChange={e => setFormData({...formData, env: e.target.value})}>
                                        <option>PROD</option>
                                        <option>STAGING</option>
                                        <option>DEV</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Semantic Binding */}
                    {step === 2 && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">2. 语义版本绑定</h3>
                            
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-700">选择语义版本 (Semantic Version)</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {SEMANTIC_VERSIONS.map(ver => (
                                        <div 
                                            key={ver.id}
                                            onClick={() => setFormData({...formData, semanticVersion: ver.id})}
                                            className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center transition-all ${formData.semanticVersion === ver.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            <div className="flex items-center">
                                                <Database className={`w-5 h-5 mr-3 ${formData.semanticVersion === ver.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">{ver.id}</div>
                                                    <div className="text-xs text-slate-500">{ver.objects} Objects • Coverage {ver.coverage}</div>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ver.status === 'STABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {ver.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">兼容性策略</label>
                                <div className="flex space-x-4">
                                    {['STRICT', 'LOOSE'].map(mode => (
                                        <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="radio" name="compatibility" value={mode} 
                                                checked={formData.compatibilityMode === mode}
                                                onChange={() => setFormData({...formData, compatibilityMode: mode})}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700">{mode === 'STRICT' ? '严格模式 (Strict)' : '宽松模式 (Loose)'}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">严格模式下，当语义层发生 Breaking Change 时，运行包将自动阻断更新或告警。</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Model Policy */}
                    {step === 3 && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">3. 模型路由策略</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">主模型 (Primary)</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded-md p-2.5 bg-white text-sm"
                                        value={formData.primaryModel} onChange={e => setFormData({...formData, primaryModel: e.target.value})}
                                    >
                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        <option value="claude-3-opus">Claude 3 Opus</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">处理复杂任务的首选模型。</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">降级模型 (Fallback)</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded-md p-2.5 bg-white text-sm"
                                        value={formData.fallbackModel} onChange={e => setFormData({...formData, fallbackModel: e.target.value})}
                                    >
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">当主模型不可用时的备选项。</p>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-medium text-slate-700 mb-3">预算控制 (Budget Per Request)</label>
                                <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-lg">
                                    <span className="text-xs font-bold text-slate-500">$0.01</span>
                                    <input type="range" className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                    <span className="text-sm font-bold text-indigo-700">$0.10</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Tool Policy */}
                    {step === 4 && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">4. 工具链鉴权</h3>
                            
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-bold text-slate-700">允许的工具 (Allowlist)</label>
                                    <button 
                                        onClick={() => setIsToolPickerOpen(true)}
                                        className="text-xs bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-50 font-medium transition-colors"
                                    >
                                        + 添加工具
                                    </button>
                                </div>
                                {formData.selectedTools.length > 0 ? (
                                    <div className="space-y-2">
                                        {formData.selectedTools.map(tId => {
                                            const tool = AVAILABLE_TOOLS.find(t => t.id === tId);
                                            return (
                                                <div key={tId} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded text-sm">
                                                    <div className="flex items-center">
                                                        <Zap className="w-4 h-4 text-slate-400 mr-2" />
                                                        <span className="text-slate-700">{tool?.name || tId}</span>
                                                    </div>
                                                    <button onClick={() => setFormData({...formData, selectedTools: formData.selectedTools.filter(id => id !== tId)})}>
                                                        <X className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-300 rounded">
                                        暂无选中工具，点击右上角添加
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">副作用控制 (Side Effects)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['BLOCK', 'APPROVAL', 'ALLOW'].map(opt => (
                                        <label key={opt} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                            <input type="radio" name="sideEffect" defaultChecked={opt === 'BLOCK'} className="mr-2 text-indigo-600" />
                                            <span className="text-xs font-bold text-slate-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Guardrails */}
                    {step === 5 && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">5. 安全围栏 (Guardrails)</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors bg-white">
                                    <div className="flex items-start">
                                        <Shield className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">SQL 注入防护</div>
                                            <div className="text-xs text-slate-500">拦截 DROP / DELETE / TRUNCATE 等高危指令。</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <select className="text-xs border rounded p-1"><option>Block</option><option>Warn</option></select>
                                        <input type="checkbox" defaultChecked className="toggle-checkbox h-5 w-5" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors bg-white">
                                    <div className="flex items-start">
                                        <Eye className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">PII 敏感信息脱敏</div>
                                            <div className="text-xs text-slate-500">自动识别手机号、邮箱并进行掩码处理。</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <select className="text-xs border rounded p-1"><option>Mask</option><option>Hash</option></select>
                                        <input type="checkbox" defaultChecked className="toggle-checkbox h-5 w-5" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors bg-white">
                                    <div className="flex items-start">
                                        <AlertOctagon className="w-5 h-5 text-rose-500 mr-3 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">竞品关键词过滤</div>
                                            <div className="text-xs text-slate-500">禁止在输出中提及特定的竞争对手名称。</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button className="text-xs text-indigo-600 hover:underline">配置列表</button>
                                        <input type="checkbox" className="toggle-checkbox h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Wizard Footer */}
                <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-between">
                    <button 
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                        className="px-5 py-2 border border-slate-300 rounded-md text-slate-600 disabled:opacity-50 hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                        上一步
                    </button>
                    <div className="flex space-x-3">
                        <button onClick={onClose} className="px-5 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium">取消</button>
                        <button 
                            onClick={() => step < 5 ? setStep(step + 1) : onComplete()}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm text-sm font-medium transition-colors"
                        >
                            {step === 5 ? '创建并发布 Canary' : '下一步'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Editor Components ---

const PolicyEditor = ({ pack, onClose }: { pack: RuntimePack, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'MODEL' | 'TOOLS' | 'GUARDRAILS' | 'COMPATIBILITY'>('MODEL');
    const [isReleaseDrawerOpen, setIsReleaseDrawerOpen] = useState(false);
    const [isToolPickerOpen, setIsToolPickerOpen] = useState(false);
    
    // Simulator State
    const [simQuery, setSimQuery] = useState('');
    const [simResult, setSimResult] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // Mock State for Tools
    const [allowedTools, setAllowedTools] = useState<string[]>(pack.policies.tools.toolAllowlist);

    const handleRunSimulation = () => {
        if (!simQuery) return;
        setIsSimulating(true);
        setSimResult(null);
        setTimeout(() => {
            setIsSimulating(false);
            setSimResult({
                status: 'PASS',
                model: pack.policies.model.primary,
                trace: [
                    { step: 'Guardrails', status: 'PASS', detail: 'PII Check OK' },
                    { step: 'Model Route', status: 'PASS', detail: `Selected ${pack.policies.model.primary}` },
                    { step: 'Tool Check', status: 'PASS', detail: 'Allowed SQL Gen' },
                ]
            });
        }, 1000);
    };

    return (
        <div className="absolute inset-0 bg-white z-10 flex flex-col">
            {isReleaseDrawerOpen && <ReleaseDrawer pack={pack} onClose={() => setIsReleaseDrawerOpen(false)} />}
            {isToolPickerOpen && (
                <ToolPickerDrawer 
                    selected={allowedTools} 
                    onSelect={(ids) => setAllowedTools(ids)} 
                    onClose={() => setIsToolPickerOpen(false)} 
                />
            )}

            {/* Top Bar */}
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
                <div className="flex items-center space-x-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-lg font-bold text-slate-900">{pack.name}</h2>
                            <div className="flex space-x-2">
                                <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                                    Stable: {pack.deployment.stable}
                                </span>
                                {pack.deployment.canary && (
                                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                        Canary: {pack.deployment.canary}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-3">
                            <span>ID: {pack.id}</span>
                            <span>|</span>
                            <span>Semantic Ver: {pack.semanticVersion}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded text-sm border border-transparent hover:border-slate-200 transition-all">
                        重置更改
                    </button>
                    <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded text-sm border border-transparent hover:border-slate-200 transition-all">
                        保存草稿
                    </button>
                    <button 
                        onClick={() => setIsReleaseDrawerOpen(true)}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center"
                    >
                        <Network className="w-4 h-4 mr-2" />
                        发布管理
                    </button>
                </div>
            </div>

            {/* Split Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left: Config Pane */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 border-r border-slate-200">
                    <div className="max-w-4xl mx-auto p-8">
                        {/* Tabs */}
                        <div className="flex space-x-6 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'MODEL', label: '模型路由 (Model)', icon: Cpu },
                                { id: 'TOOLS', label: '工具链 (Tools)', icon: Zap },
                                { id: 'GUARDRAILS', label: '安全围栏 (Guardrails)', icon: Shield },
                                { id: 'COMPATIBILITY', label: '语义兼容性 (Checks)', icon: Scale },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center whitespace-nowrap ${
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

                        {/* Config Content */}
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {activeTab === 'MODEL' && (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">模型优先级配置</h3>
                                    <div className="grid grid-cols-2 gap-8 mb-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2">主模型 (Primary)</label>
                                            <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white" defaultValue={pack.policies.model.primary}>
                                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                <option value="claude-3-opus">Claude 3 Opus</option>
                                                <option value="gpt-4o">GPT-4o</option>
                                            </select>
                                            <p className="text-xs text-slate-400 mt-1">首选的高智商模型。</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2">降级模型 (Fallback)</label>
                                            <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white" defaultValue={pack.policies.model.fallback}>
                                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                <option value="claude-3-haiku">Claude 3 Haiku</option>
                                            </select>
                                            <p className="text-xs text-slate-400 mt-1">当主模型超时或超限时使用。</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-100 pt-6">
                                        <label className="block text-xs font-bold text-slate-500 mb-3">单次请求预算 (Budget Cap)</label>
                                        <div className="flex items-center space-x-4">
                                            <input type="range" className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                            <span className="font-mono text-slate-800 font-bold">$0.10</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'TOOLS' && (
                                <div className="space-y-6">
                                    {/* Runtime Policy */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">运行时限制</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2">执行超时 (Timeout)</label>
                                                <input type="number" defaultValue={5000} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2">最大重试 (Retries)</label>
                                                <input type="number" defaultValue={3} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Allowlist */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">工具白名单 (Allowlist)</h3>
                                            <button onClick={() => setIsToolPickerOpen(true)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded font-medium hover:bg-indigo-100 transition-colors">
                                                + 添加工具
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {allowedTools.map(tId => {
                                                const tool = AVAILABLE_TOOLS.find(t => t.id === tId);
                                                return (
                                                    <div key={tId} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-500">
                                                                <Zap className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-700">{tool?.name || tId}</div>
                                                                <div className="text-xs text-slate-400 font-mono">{tId}</div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setAllowedTools(allowedTools.filter(id => id !== tId))}
                                                            className="text-slate-400 hover:text-rose-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            {allowedTools.length === 0 && (
                                                <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded">
                                                    未配置工具，请点击右上角添加。
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Side Effect Gate */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">副作用门禁 (Side Effects)</h3>
                                        <div className="flex items-center space-x-4">
                                            {['BLOCK', 'APPROVAL', 'ALLOW'].map(opt => (
                                                <label key={opt} className={`
                                                    flex-1 border rounded-lg p-3 cursor-pointer transition-all text-center
                                                    ${pack.policies.tools.sideEffectGate === opt 
                                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                                                `}>
                                                    <input type="radio" name="sideEffect" className="hidden" defaultChecked={pack.policies.tools.sideEffectGate === opt} />
                                                    <span className="text-sm font-bold">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'GUARDRAILS' && (
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Shield className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg mr-4" />
                                            <div>
                                                <h4 className="font-bold text-slate-800">SQL 注入防护</h4>
                                                <p className="text-xs text-slate-500 mt-1">拦截 DROP / DELETE / TRUNCATE 等高危指令。</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <select className="border border-slate-300 rounded text-xs p-1.5 bg-white">
                                                <option>Block Request</option>
                                                <option>Warn Only</option>
                                            </select>
                                            <input type="checkbox" defaultChecked className="toggle-checkbox h-6 w-10" />
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Eye className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg mr-4" />
                                            <div>
                                                <h4 className="font-bold text-slate-800">PII 敏感信息脱敏</h4>
                                                <p className="text-xs text-slate-500 mt-1">自动识别手机号、邮箱并进行掩码处理。</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <select className="border border-slate-300 rounded text-xs p-1.5 bg-white">
                                                <option>Mask (***)</option>
                                                <option>Hash (SHA256)</option>
                                            </select>
                                            <input type="checkbox" defaultChecked className="toggle-checkbox h-6 w-10" />
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center">
                                            <AlertOctagon className="w-10 h-10 text-rose-500 bg-rose-50 p-2 rounded-lg mr-4" />
                                            <div>
                                                <h4 className="font-bold text-slate-800">竞品关键词过滤</h4>
                                                <p className="text-xs text-slate-500 mt-1">禁止在输出中提及特定的竞争对手名称。</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <button className="text-xs text-indigo-600 hover:underline font-medium">配置列表</button>
                                            <input type="checkbox" className="toggle-checkbox h-6 w-10" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'COMPATIBILITY' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <Database className="w-5 h-5 text-blue-600 mr-2" />
                                            <h4 className="text-sm font-bold text-blue-900">当前绑定: {pack.semanticVersion}</h4>
                                        </div>
                                        <p className="text-xs text-blue-700">此运行包依赖于 Retail_v4 版本的语义对象定义。检测到 2 个潜在的兼容性问题。</p>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 font-bold text-sm text-slate-700">兼容性检查报告</div>
                                        <div className="divide-y divide-slate-100">
                                            <div className="p-4 flex items-start">
                                                <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">Schema Integrity</div>
                                                    <div className="text-xs text-slate-500 mt-1">所有绑定的工具输入输出契约与语义层定义匹配。</div>
                                                </div>
                                            </div>
                                            <div className="p-4 flex items-start bg-amber-50/30">
                                                <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">Deprecated Field Usage</div>
                                                    <div className="text-xs text-slate-500 mt-1">工具 <code>t_inventory_check</code> 使用了即将废弃的字段 <code>stock_level_v1</code>。建议迁移至 v2。</div>
                                                </div>
                                            </div>
                                            <div className="p-4 flex items-start">
                                                <GitCommit className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">Version Drift</div>
                                                    <div className="text-xs text-slate-500 mt-1">当前语义版本落后主干 2 个次要版本。</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                                        <h4 className="text-sm font-bold text-slate-800 mb-4">影响分析 (Impact Analysis)</h4>
                                        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                                            <span>受影响工具</span>
                                            <span className="font-mono font-bold">2</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                                            <span>下游引用 Agent</span>
                                            <span className="font-mono font-bold">5</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-slate-600">
                                            <span>API Key 依赖</span>
                                            <span className="font-mono font-bold">12</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Simulator Pane */}
                <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center">
                            <Play className="w-4 h-4 mr-2 text-indigo-600" />
                            策略仿真 (Simulator)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">输入测试指令，验证路由与围栏逻辑。</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prompt Input</label>
                            <textarea 
                                value={simQuery}
                                onChange={e => setSimQuery(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                placeholder="输入测试指令，例如：查询所有用户并删除..."
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold">模拟环境</span>
                                <select className="bg-transparent border-none text-indigo-600 font-medium cursor-pointer outline-none">
                                    <option>Production</option>
                                    <option>Staging</option>
                                </select>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold">用户角色</span>
                                <select className="bg-transparent border-none text-indigo-600 font-medium cursor-pointer outline-none">
                                    <option>Admin</option>
                                    <option>Viewer</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleRunSimulation}
                            disabled={!simQuery || isSimulating}
                            className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-all shadow-sm
                                ${!simQuery || isSimulating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-900'}
                            `}
                        >
                            {isSimulating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                            {isSimulating ? 'Simulating...' : 'Run Simulation'}
                        </button>

                        {/* Result Visualization */}
                        {simResult && (
                            <div className="mt-6 border-t border-slate-100 pt-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase">执行轨迹 (Trace)</span>
                                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                                        Policy Pass
                                    </span>
                                </div>
                                <div className="space-y-0 relative pl-4 border-l-2 border-slate-200 ml-2">
                                    {simResult.trace.map((step: any, idx: number) => (
                                        <div key={idx} className="relative pb-6 last:pb-0">
                                            <div className={`absolute -left-[21px] top-0 border-2 w-3 h-3 rounded-full bg-white ${
                                                step.status === 'PASS' ? 'border-emerald-500' : 'border-indigo-500'
                                            }`}></div>
                                            <div className="text-xs font-bold text-slate-800">{step.step}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{step.detail}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                                    <span>Latency: 124ms</span>
                                    <span>Tokens: 45</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

const RuntimePacks: React.FC = () => {
  const [view, setView] = useState<'LIST' | 'WIZARD' | 'EDITOR'>('LIST');
  const [packs, setPacks] = useState<RuntimePack[]>(MOCK_PACKS);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedPack = packs.find(p => p.id === selectedPackId);

  const handleEdit = (packId: string) => {
      setSelectedPackId(packId);
      setView('EDITOR');
  };

  const handleWizardComplete = () => {
      // Mock create
      setView('LIST');
  };

  const filteredPacks = packs.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      
      {view === 'WIZARD' && (
          <CreatePackWizard onClose={() => setView('LIST')} onComplete={handleWizardComplete} />
      )}

      {view === 'EDITOR' && selectedPack && (
          <PolicyEditor pack={selectedPack} onClose={() => setView('LIST')} />
      )}

      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">运行包与策略</h1>
            <p className="text-sm text-slate-500 mt-1">管理智能体的模型路由、工具链权限与安全围栏策略包。</p>
        </div>
        <button 
            onClick={() => setView('WIZARD')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 flex items-center transition-colors"
        >
             <Plus className="w-4 h-4 mr-2" />
             创建运行包
        </button>
      </div>

      {/* Filter Bar */}
      <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center space-x-4 shrink-0">
          <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                  type="text" 
                  placeholder="搜索策略包..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
          </div>
          <select className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-600 outline-none">
               <option>所有业务域</option>
               <option>供应链</option>
               <option>HR</option>
               <option>财务</option>
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-600 outline-none">
               <option>所有环境</option>
               <option>PROD</option>
               <option>STAGING</option>
          </select>
      </div>

      {/* Table */}
      <div className="p-8 overflow-y-auto flex-1">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                          <th className="px-6 py-4">运行包名称 / ID</th>
                          <th className="px-6 py-4">能力类型</th>
                          <th className="px-6 py-4">语义绑定</th>
                          <th className="px-6 py-4">部署状态</th>
                          <th className="px-6 py-4">主要模型</th>
                          <th className="px-6 py-4 text-right">操作</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredPacks.map(pack => (
                          <tr key={pack.id} className="hover:bg-slate-50 group transition-colors">
                              <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800 flex items-center">
                                    <Package className="w-4 h-4 mr-2 text-indigo-500" />
                                    {pack.name}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono mt-0.5 ml-6">{pack.id}</div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-medium">
                                      {pack.capability}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center text-slate-600">
                                      <Database className="w-3 h-3 mr-1.5 text-slate-400" />
                                      {pack.semanticVersion}
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex flex-col space-y-1">
                                      <div className="flex items-center text-xs">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                                          <span className="text-slate-600">Stable: {pack.deployment.stable}</span>
                                      </div>
                                      {pack.deployment.canary && (
                                          <div className="flex items-center text-xs">
                                              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                              <span className="text-blue-600 font-medium">
                                                  Canary: {pack.deployment.canary} ({pack.deployment.canaryWeight}%)
                                              </span>
                                          </div>
                                      )}
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 flex items-center w-fit">
                                      <Cpu className="w-3 h-3 mr-1 text-slate-400" />
                                      {pack.policies.model.primary}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end space-x-2">
                                      <button 
                                        onClick={() => handleEdit(pack.id)}
                                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors flex items-center"
                                      >
                                          <Settings className="w-3 h-3 mr-1" />
                                          配置策略
                                      </button>
                                      <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100">
                                          <MoreHorizontal className="w-4 h-4" />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {filteredPacks.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>未找到匹配的运行包</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default RuntimePacks;
