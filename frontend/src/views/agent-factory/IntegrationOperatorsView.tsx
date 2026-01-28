
import React, { useState } from 'react';
import {
    FunctionSquare, Search, Plus, Filter, Box, Shield, GitBranch, Cpu, Code,
    X, Save, CheckCircle, FileCode, Container, AlertTriangle, Layers,
    Terminal, Play, Activity, Clock, Zap, AlertOctagon, RefreshCw, FileJson,
    ArrowRight, Lock, Database, ChevronRight
} from 'lucide-react';

// --- Domain Types ---

type OperatorType = 'TRANSFORM' | 'VALIDATE' | 'ROUTING' | 'ACTION';
type OperatorStatus = 'DRAFT' | 'BUILDING' | 'CANARY' | 'ACTIVE' | 'DEPRECATED';
type SideEffectType = 'NONE' | 'WRITE_DB' | 'SEND_MSG' | 'FILE_OP' | 'EXTERNAL_CALL';

interface OperatorResource {
    timeoutMs: number;
    memoryMb: number;
    cpuShares: number;
    allowNetwork: boolean;
}

interface OperatorUnitTest {
    id: string;
    name: string;
    input: string;
    expectedOutput: string;
    status?: 'PASS' | 'FAIL' | 'PENDING';
}

interface Operator {
    id: string;
    name: string;
    type: OperatorType;
    version: string;
    desc: string;
    status: OperatorStatus;

    // Implementation
    runtime: 'PYTHON' | 'DOCKER' | 'GO';
    sourcePath?: string;
    imageTag?: string;

    // Governance (P0)
    risk: {
        sideEffect: SideEffectType;
        approvalRequired: boolean;
        auditLevel: 'NONE' | 'BASIC' | 'FULL';
    };
    resources: OperatorResource;

    // Contracts (P0)
    schema: {
        input: string;
        output: string;
    };

    // Testing (P0)
    tests: OperatorUnitTest[];

    // Stats (P1)
    stats: {
        p95Latency: number;
        errorRate: number;
        calls7d: number;
    };

    // References (P0 - Reverse Lookup)
    references: {
        tools: string[]; // IDs of tools wrapping this op
        agents: string[]; // IDs of agents using those tools
    };
}

// --- Mock Data ---

const INITIAL_OPERATORS: Operator[] = [
    {
        id: 'op_pii_scrub', name: 'PII 敏感信息脱敏', type: 'TRANSFORM', version: 'v1.2.0',
        desc: '使用正则和 NLP 识别手机号、身份证并替换为掩码。', status: 'ACTIVE',
        runtime: 'PYTHON', sourcePath: 'src/transforms/pii_scrubber.py',
        risk: { sideEffect: 'NONE', approvalRequired: false, auditLevel: 'BASIC' },
        resources: { timeoutMs: 1000, memoryMb: 128, cpuShares: 0.5, allowNetwork: false },
        schema: { input: '{"text": "string"}', output: '{"masked_text": "string", "detected_types": ["string"]}' },
        tests: [{ id: 't1', name: 'Mask Phone', input: '{"text": "Call 13800138000"}', expectedOutput: '{"masked_text": "Call 138****8000"}' }],
        stats: { p95Latency: 45, errorRate: 0.01, calls7d: 125000 },
        references: { tools: ['tool_safe_print', 'tool_log_sanitizer'], agents: ['Agent_Customer_Service'] }
    },
    {
        id: 'op_sql_validate', name: 'SQL 语法安全校验', type: 'VALIDATE', version: 'v2.0.1',
        desc: '解析 SQL AST，拦截 DROP/DELETE 等高危操作。', status: 'ACTIVE',
        runtime: 'GO', sourcePath: 'src/security/sql_guard.go',
        risk: { sideEffect: 'NONE', approvalRequired: true, auditLevel: 'FULL' },
        resources: { timeoutMs: 500, memoryMb: 64, cpuShares: 0.2, allowNetwork: false },
        schema: { input: '{"sql": "string"}', output: '{"is_safe": "boolean", "risk_score": "number"}' },
        tests: [],
        stats: { p95Latency: 20, errorRate: 0.0, calls7d: 89000 },
        references: { tools: ['tool_sql_generator'], agents: ['Agent_Data_Analyst'] }
    },
    {
        id: 'op_email_send', name: 'SMTP 邮件发送', type: 'ACTION', version: 'v1.0-rc',
        desc: '通过企业 SMTP 网关发送事务性邮件。', status: 'CANARY',
        runtime: 'DOCKER', imageTag: 'registry.internal/ops/smtp-sender:v1.0-rc',
        risk: { sideEffect: 'SEND_MSG', approvalRequired: true, auditLevel: 'FULL' },
        resources: { timeoutMs: 5000, memoryMb: 256, cpuShares: 1.0, allowNetwork: true },
        schema: { input: '{"to": "email", "subject": "string"}', output: '{"status": "sent"}' },
        tests: [],
        stats: { p95Latency: 800, errorRate: 1.2, calls7d: 400 },
        references: { tools: ['tool_notify_user'], agents: [] }
    }
];

// --- Helper Components ---

const StatusBadge = ({ status }: { status: OperatorStatus }) => {
    switch (status) {
        case 'ACTIVE': return <span className="bg-emerald-50 text-emerald-600 border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold border">ACTIVE</span>;
        case 'CANARY': return <span className="bg-blue-50 text-blue-600 border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold border">CANARY</span>;
        case 'BUILDING': return <span className="bg-amber-50 text-amber-600 border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold border flex items-center"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />BUILD</span>;
        case 'DRAFT': return <span className="bg-slate-100 text-slate-500 border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold border">DRAFT</span>;
        default: return null;
    }
};

const TypeIcon = ({ type }: { type: OperatorType }) => {
    switch (type) {
        case 'TRANSFORM': return <Code className="w-4 h-4 text-indigo-500" />;
        case 'VALIDATE': return <Shield className="w-4 h-4 text-emerald-500" />;
        case 'ROUTING': return <GitBranch className="w-4 h-4 text-slate-500" />;
        case 'ACTION': return <Zap className="w-4 h-4 text-amber-500" />;
    }
};

const OperatorDetailDrawer = ({ op: initialOp, onClose, onSave }: { op?: Operator, onClose: () => void, onSave: (op: Operator) => void }) => {
    // Default or Existing State
    const [op, setOp] = useState<Operator>(initialOp || {
        id: `op_${Date.now()}`,
        name: '',
        type: 'TRANSFORM',
        version: 'v0.0.1',
        desc: '',
        status: 'DRAFT',
        runtime: 'PYTHON',
        risk: { sideEffect: 'NONE', approvalRequired: false, auditLevel: 'BASIC' },
        resources: { timeoutMs: 1000, memoryMb: 128, cpuShares: 0.5, allowNetwork: false },
        schema: { input: '{}', output: '{}' },
        tests: [],
        stats: { p95Latency: 0, errorRate: 0, calls7d: 0 },
        references: { tools: [], agents: [] }
    });

    const [activeTab, setActiveTab] = useState<'DEF' | 'INTERFACE' | 'TEST' | 'GOVERNANCE' | 'USAGE'>('DEF');

    // Test Runner Simulation
    const runTests = () => {
        const updatedTests = op.tests.map(t => ({ ...t, status: 'PASS' as const }));
        setOp({ ...op, tests: updatedTests });
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[800px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <FunctionSquare className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-bold text-slate-900">{op.name || '新建算子'}</h2>
                            <StatusBadge status={op.status} />
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-1 font-mono">
                            {op.id}
                            <span className="mx-2">•</span>
                            {op.version}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <div className="px-6 border-b border-slate-200 flex space-x-6">
                {[
                    { id: 'DEF', label: '定义与实现', icon: Code },
                    { id: 'INTERFACE', label: 'I/O 契约', icon: FileJson },
                    { id: 'TEST', label: '单元测试', icon: Play },
                    { id: 'GOVERNANCE', label: '资源与风控', icon: Shield },
                    { id: 'USAGE', label: '引用链路', icon: Layers },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-3 text-sm font-medium transition-colors border-b-2 flex items-center ${activeTab === tab.id
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

                {/* Definition Tab */}
                {activeTab === 'DEF' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">基础属性</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">算子名称</label>
                                    <input type="text" value={op.name} onChange={e => setOp({ ...op, name: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">唯一标识 (ID)</label>
                                    <input type="text" value={op.id} onChange={e => setOp({ ...op, id: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">功能类型</label>
                                    <select value={op.type} onChange={e => setOp({ ...op, type: e.target.value as any })} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                                        <option value="TRANSFORM">数据转换 (Transform)</option>
                                        <option value="VALIDATE">规则校验 (Validate)</option>
                                        <option value="ROUTING">逻辑路由 (Routing)</option>
                                        <option value="ACTION">副作用动作 (Action)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">当前版本</label>
                                    <input type="text" value={op.version} onChange={e => setOp({ ...op, version: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">描述</label>
                                <textarea value={op.desc} onChange={e => setOp({ ...op, desc: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm h-20 resize-none" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center">
                                <Terminal className="w-4 h-4 mr-2" /> 运行时实现
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">运行环境</label>
                                <div className="flex space-x-3">
                                    {['PYTHON', 'GO', 'DOCKER'].map(rt => (
                                        <button
                                            key={rt}
                                            onClick={() => setOp({ ...op, runtime: rt as any })}
                                            className={`px-4 py-2 border rounded-md text-xs font-bold transition-all ${op.runtime === rt
                                                    ? 'bg-slate-800 text-white border-slate-800'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {rt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {op.runtime !== 'DOCKER' ? (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">源代码路径 (Repository Path)</label>
                                    <div className="relative">
                                        <FileCode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={op.sourcePath || ''}
                                            onChange={e => setOp({ ...op, sourcePath: e.target.value })}
                                            className="w-full border border-slate-300 rounded pl-9 p-2 text-sm font-mono"
                                            placeholder="src/handlers/..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">容器镜像 (Image Tag)</label>
                                    <div className="relative">
                                        <Container className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={op.imageTag || ''}
                                            onChange={e => setOp({ ...op, imageTag: e.target.value })}
                                            className="w-full border border-slate-300 rounded pl-9 p-2 text-sm font-mono"
                                            placeholder="registry.internal/ops/..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Interface Tab */}
                {activeTab === 'INTERFACE' && (
                    <div className="space-y-6 h-full flex flex-col">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start">
                            <FileJson className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-bold">I/O 契约定义</p>
                                <p className="mt-1 opacity-90 text-xs">
                                    请使用 JSON Schema 定义输入输出结构。系统将基于此 Schema 自动生成 Python/Go 的类型定义并进行运行时强校验。
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                            <div className="flex flex-col h-full">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Input Schema</label>
                                <textarea
                                    value={op.schema.input}
                                    onChange={e => setOp({ ...op, schema: { ...op.schema, input: e.target.value } })}
                                    className="flex-1 w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-lg border border-slate-700 outline-none resize-none"
                                    spellCheck={false}
                                />
                            </div>
                            <div className="flex flex-col h-full">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Output Schema</label>
                                <textarea
                                    value={op.schema.output}
                                    onChange={e => setOp({ ...op, schema: { ...op.schema, output: e.target.value } })}
                                    className="flex-1 w-full bg-slate-900 text-blue-400 font-mono text-xs p-4 rounded-lg border border-slate-700 outline-none resize-none"
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Testing Tab */}
                {activeTab === 'TEST' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800 uppercase">单元测试用例</h3>
                            <button
                                onClick={runTests}
                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center hover:bg-indigo-700 transition-colors"
                            >
                                <Play className="w-3 h-3 mr-1.5 fill-current" />
                                运行所有测试
                            </button>
                        </div>

                        <div className="space-y-3">
                            {op.tests.map((test, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm group">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center space-x-3">
                                            <span className="font-bold text-sm text-slate-700">#{idx + 1}: {test.name}</span>
                                            {test.status === 'PASS' && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">PASS</span>}
                                            {test.status === 'FAIL' && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">FAIL</span>}
                                        </div>
                                        <button className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] text-slate-400 uppercase mb-1">Input (JSON)</label>
                                            <div className="bg-slate-50 p-2 rounded text-xs font-mono text-slate-600">{test.input}</div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-400 uppercase mb-1">Expected Output (JSON)</label>
                                            <div className="bg-slate-50 p-2 rounded text-xs font-mono text-slate-600">{test.expectedOutput}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setOp({ ...op, tests: [...op.tests, { id: Date.now().toString(), name: 'New Test Case', input: '{}', expectedOutput: '{}' }] })}
                                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-300 text-xs font-medium transition-colors"
                            >
                                + 添加测试用例
                            </button>
                        </div>
                    </div>
                )}

                {/* Governance Tab */}
                {activeTab === 'GOVERNANCE' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-5">
                            <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center">
                                <Shield className="w-4 h-4 mr-2 text-indigo-500" /> 风险控制 (Risk Control)
                            </h3>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-2">副作用类型 (Side Effect)</label>
                                <div className="flex flex-wrap gap-3">
                                    {['NONE', 'WRITE_DB', 'SEND_MSG', 'FILE_OP', 'EXTERNAL_CALL'].map(se => (
                                        <label key={se} className={`
                                            flex items-center px-3 py-2 rounded-md border cursor-pointer transition-all
                                            ${op.risk.sideEffect === se
                                                ? 'bg-rose-50 border-rose-200 text-rose-700 ring-1 ring-rose-200'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                                        `}>
                                            <input
                                                type="radio"
                                                name="sideEffect"
                                                className="hidden"
                                                checked={op.risk.sideEffect === se}
                                                onChange={() => setOp({ ...op, risk: { ...op.risk, sideEffect: se as any } })}
                                            />
                                            {se === 'NONE' ? <CheckCircle className="w-3.5 h-3.5 mr-2 text-emerald-500" /> : <AlertOctagon className="w-3.5 h-3.5 mr-2 text-amber-500" />}
                                            <span className="text-xs font-bold">{se}</span>
                                        </label>
                                    ))}
                                </div>
                                {op.risk.sideEffect !== 'NONE' && (
                                    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded text-xs text-rose-700 flex items-start animate-in fade-in">
                                        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span>注意：非纯函数算子（Action）必须经过安全审批，且强制开启全量审计日志。</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                <div>
                                    <div className="text-sm font-bold text-slate-700">人工审批 (Approval)</div>
                                    <div className="text-xs text-slate-500">调用此算子前是否需要人工确认</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={op.risk.approvalRequired}
                                    onChange={e => setOp({ ...op, risk: { ...op.risk, approvalRequired: e.target.checked } })}
                                    className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-5">
                            <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center">
                                <Cpu className="w-4 h-4 mr-2 text-indigo-500" /> 资源限制 (Resource Limits)
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">执行超时 (Timeout ms)</label>
                                    <input type="number" value={op.resources.timeoutMs} onChange={e => setOp({ ...op, resources: { ...op.resources, timeoutMs: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">内存限制 (MB)</label>
                                    <input type="number" value={op.resources.memoryMb} onChange={e => setOp({ ...op, resources: { ...op.resources, memoryMb: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">CPU Shares</label>
                                    <input type="number" step="0.1" value={op.resources.cpuShares} onChange={e => setOp({ ...op, resources: { ...op.resources, cpuShares: Number(e.target.value) } })} className="w-full border border-slate-300 rounded p-2 text-sm" />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center space-x-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={op.resources.allowNetwork} onChange={e => setOp({ ...op, resources: { ...op.resources, allowNetwork: e.target.checked } })} className="rounded text-indigo-600" />
                                        <span>允许公网访问</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Usage Tab */}
                {activeTab === 'USAGE' && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center text-sm text-slate-600">
                                <Activity className="w-4 h-4 mr-2 text-slate-400" />
                                <span>7日调用量: <span className="font-bold text-slate-800">{op.stats.calls7d}</span></span>
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                <span>P95 耗时: <span className="font-bold text-slate-800">{op.stats.p95Latency}ms</span></span>
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                                <AlertTriangle className="w-4 h-4 mr-2 text-slate-400" />
                                <span>错误率: <span className={`font-bold ${op.stats.errorRate > 1 ? 'text-rose-600' : 'text-slate-800'}`}>{op.stats.errorRate}%</span></span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center">
                                <Layers className="w-4 h-4 mr-2 text-indigo-500" /> 封装与引用 (Lineage)
                            </h3>
                            {op.references.tools.length > 0 ? (
                                <div className="space-y-4">
                                    {op.references.tools.map((tool, idx) => (
                                        <div key={idx} className="flex items-center p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                                            <div className="flex items-center flex-1">
                                                <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center mr-3">
                                                    <Zap className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-500 uppercase">Wrapped By Tool</div>
                                                    <div className="text-sm font-mono text-indigo-600">{tool}</div>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 mx-4" />
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Referenced By Agents</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {op.references.agents.map(agent => (
                                                        <span key={agent} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                            {agent}
                                                        </span>
                                                    ))}
                                                    {op.references.agents.length === 0 && <span className="text-[10px] text-slate-400 italic">No active agents</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">当前算子未被任何工具封装</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center">
                <div className="flex items-center text-xs text-slate-400 space-x-4">
                    <span>Validation: {op.schema.input ? 'Schema Ready' : 'Missing Schema'}</span>
                    <span>Tests: {op.tests.length} defined</span>
                </div>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50">取消</button>
                    <button onClick={() => onSave(op)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm flex items-center">
                        <Save className="w-4 h-4 mr-2" />
                        保存算子
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const IntegrationOperatorsView: React.FC = () => {
    const [operators, setOperators] = useState<Operator[]>(INITIAL_OPERATORS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
    const [isCreateMode, setIsCreateMode] = useState(false);

    const handleSaveOperator = (updatedOp: Operator) => {
        const exists = operators.find(o => o.id === updatedOp.id);
        if (exists) {
            setOperators(operators.map(o => o.id === updatedOp.id ? updatedOp : o));
        } else {
            setOperators([...operators, updatedOp]);
        }
        setSelectedOp(null);
        setIsCreateMode(false);
    };

    const filteredOperators = operators.filter(op =>
        op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">

            {(selectedOp || isCreateMode) && (
                <OperatorDetailDrawer
                    op={selectedOp || undefined}
                    onClose={() => { setSelectedOp(null); setIsCreateMode(false); }}
                    onSave={handleSaveOperator}
                />
            )}

            <div className="px-8 py-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">{operators.length}</span> 个算子
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="搜索算子..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateMode(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 flex items-center transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" /> 注册算子
                    </button>
                </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOperators.map(op => (
                        <div
                            key={op.id}
                            onClick={() => setSelectedOp(op)}
                            className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group cursor-pointer hover:shadow-md relative"
                        >
                            {op.risk.sideEffect !== 'NONE' && (
                                <div className="absolute top-0 right-0 p-1.5 bg-rose-50 rounded-bl-lg border-b border-l border-rose-100" title={`Side Effect: ${op.risk.sideEffect}`}>
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <TypeIcon type={op.type} />
                                </div>
                                <StatusBadge status={op.status} />
                            </div>

                            <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-700 transition-colors">{op.name}</h3>
                            <div className="text-xs text-slate-500 font-mono mt-0.5 bg-slate-50 inline-block px-1 rounded border border-slate-100">{op.id}</div>
                            <p className="text-sm text-slate-600 mt-3 line-clamp-2 h-10 leading-relaxed">{op.desc}</p>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-3 text-slate-500">
                                    <span className="flex items-center font-mono"><GitBranch className="w-3 h-3 mr-1" /> {op.version}</span>
                                    <span className="flex items-center"><Cpu className="w-3 h-3 mr-1" /> {op.runtime}</span>
                                </div>
                                {op.risk.sideEffect !== 'NONE' && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">ACTION</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IntegrationOperatorsView;
