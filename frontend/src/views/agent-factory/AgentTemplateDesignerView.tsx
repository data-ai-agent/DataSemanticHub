import { ArrowLeft, ChevronDown, ChevronRight, GripVertical, Info, Play, RotateCcw, Save, Sparkles, Activity, AlertTriangle, CheckCircle, XCircle, FileText, GitBranch, History, Settings, Shield, Bug, Search, Anchor, FileCode, Layers, Database as DbIcon, Lock, List as ListIcon, Maximize2, X, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/Toast';

interface AgentTemplateDesignerViewProps {
    setActiveModule?: (module: string) => void;
    template?: {
        id?: string;
        name?: string;
        description?: string;
        capability?: string;
        domain?: string;
        status?: string;
        semanticVersion?: string;
        category?: string;
        tags?: string | string[];
        skeleton?: string;
    };
    source?: 'create' | 'library';
    onSaveDraft?: (template: any) => void;
}

const statusTone: Record<string, string> = {
    Stable: 'bg-emerald-50 text-emerald-700',
    Draft: 'bg-slate-100 text-slate-600',
    Canary: 'bg-amber-50 text-amber-700',
    Deprecated: 'bg-rose-50 text-rose-600'
};

const buildTemplateState = (initialTemplate?: AgentTemplateDesignerViewProps['template']) => {
    const tagList = Array.isArray(initialTemplate?.tags)
        ? initialTemplate?.tags
        : initialTemplate?.tags
            ? initialTemplate.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            : ['供应链', '归因', '指标解释'];

    return {
        id: initialTemplate?.id,
        name: initialTemplate?.name ?? '供应链问数助手',
        description: initialTemplate?.description ?? '支持跨域指标问数、归因分析与结构化输出。',
        capability: initialTemplate?.capability ?? '问数 (QNA)',
        domain: initialTemplate?.domain ?? '供应链',
        status: initialTemplate?.status ?? 'Stable',
        semanticVersion: initialTemplate?.semanticVersion ?? 'v2.3.1',
        category: initialTemplate?.category ?? '分析助手',
        tags: tagList,
        skeleton: initialTemplate?.skeleton ?? '问数骨架'
    };
};

const AgentTemplateDesignerView = ({ setActiveModule, template: initialTemplate, source, onSaveDraft }: AgentTemplateDesignerViewProps) => {
    const toast = useToast();
    const [openPanels, setOpenPanels] = useState<string[]>([
        'knowledge', 'tools', 'model', 'experience', 'security'
    ]);
    const [activeSection, setActiveSection] = useState('basic-info');
    const [fieldDrawerOpen, setFieldDrawerOpen] = useState(false);
    const [stepDrawerOpen, setStepDrawerOpen] = useState(false);
    const [templateState, setTemplateState] = useState(() => buildTemplateState(initialTemplate));
    const [outputType, setOutputType] = useState<'text' | 'json' | 'multi'>('json');
    const [experienceConfig, setExperienceConfig] = useState({
        memory: true,
        relatedQuestions: true,
        opener: '自动生成',
        presetCount: 3,
        openerMode: 'auto',
        openerText: '你好，我可以帮你进行供应链指标分析与归因解释。'
    });
    const [openerCandidates, setOpenerCandidates] = useState<string[]>([
        '你好，我可以帮你进行供应链指标分析、归因解释与风险预警。',
        '欢迎使用供应链智能助手，我将为你提供指标洞察与行动建议。',
        '你好，我可以帮你分析库存、采购与供应商表现，并输出结构化结论。'
    ]);
    const [selectedOpenerIndex, setSelectedOpenerIndex] = useState(0);
    const [presetDraft, setPresetDraft] = useState('');
    const [presetQuestions, setPresetQuestions] = useState<string[]>([
        '近30天库存周转率下降的主要原因？',
        '供应商交付延迟对缺货率的影响？',
        '建议优先优化哪些补货策略？'
    ]);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const [issuesDrawerOpen, setIssuesDrawerOpen] = useState(false);
    const [compileStatus, setCompileStatus] = useState<'Ready' | 'Warning' | 'Blocked'>('Warning');
    const [mockIssues, setMockIssues] = useState([
        { type: 'error', location: 'Prompt', message: '引用了未定义变量 {{time_range}}', id: 1 },
        { type: 'warning', location: 'Workflow', message: 'SQLRunner 模块未配置最大行数限制', id: 2 }
    ]);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const togglePanel = (key: string) => {
        setOpenPanels(prev => prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]);
    };

    useEffect(() => {
        setTemplateState(buildTemplateState(initialTemplate));
    }, [initialTemplate]);

    const inputFields = [
        { name: 'question', label: '问题', type: 'string', required: true, source: '用户输入' },
        { name: 'time_range', label: '时间范围', type: 'enum', required: false, source: '会话上下文' },
        { name: 'scope', label: '对象范围', type: 'string', required: false, source: '语义资产' },
        { name: 'output_format', label: '输出格式', type: 'enum', required: true, source: '系统默认' }
    ];

    const toolItems = [
        { name: 'SemanticSearch', level: '普通', timeout: '2s', status: '可用' },
        { name: 'MetricResolver', level: '普通', timeout: '2s', status: '可用' },
        { name: 'SQLRunner', level: '高级', timeout: '6s', status: '限制' }
    ];

    const knowledgeSources = [
        { name: '业务知识网络', version: 'v2.1.0', status: '已连接' },
        { name: '指标库', version: 'v3.4', status: '已连接' },
        { name: '文档库', version: 'v1.8', status: '需要更新' }
    ];

    const modelConfig = [
        { label: '默认模型', value: 'gpt-4o' },
        { label: 'Fallback 模型', value: 'gpt-4o-mini' },
        { label: 'Temperature', value: '0.2' },
        { label: 'Max Tokens', value: '4096' }
    ];

    const rightPanels = [
        {
            key: 'knowledge',
            title: '知识源',
            content: (
                <div className="mt-3 space-y-3 text-sm">
                    <div className="space-y-2">
                        {knowledgeSources.map(source => (
                            <div key={source.name} className="rounded-lg border border-slate-200 p-2 text-xs flex items-center justify-between">
                                <div>
                                    <div className="text-slate-700 font-medium">{source.name}</div>
                                    <div className="text-slate-500 mt-1">版本：{source.version}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full ${source.status === '已连接' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {source.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500">
                        检索策略：topK=8 · 过滤条件=业务域 · 重排=启用
                    </div>
                </div>
            )
        },
        {
            key: 'tools',
            title: '工具与技能',
            content: (
                <div className="mt-3 space-y-3 text-sm">
                    <div className="space-y-2">
                        {toolItems.map(tool => (
                            <div key={tool.name} className="rounded-lg border border-slate-200 p-2 text-xs flex items-center justify-between">
                                <div>
                                    <div className="text-slate-700 font-medium">{tool.name}</div>
                                    <div className="text-slate-500 mt-1">权限：{tool.level} · 超时：{tool.timeout}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full ${tool.status === '可用' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {tool.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600">从注册表添加工具</button>
                </div>
            )
        },
        {
            key: 'model',
            title: '默认模型配置',
            content: (
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                    {modelConfig.map(item => (
                        <div key={item.label} className="rounded-lg border border-slate-200 p-2 flex items-center justify-between">
                            <span className="text-slate-500">{item.label}</span>
                            <span className="text-slate-700">{item.value}</span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            key: 'experience',
            title: '体验配置',
            content: (
                <div className="mt-3 space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                        <span className="text-slate-600">长期记忆</span>
                        <button
                            className={`px-2 py-0.5 rounded-full ${experienceConfig.memory ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                            onClick={() => setExperienceConfig(prev => ({ ...prev, memory: !prev.memory }))}
                        >
                            {experienceConfig.memory ? '开启' : '关闭'}
                        </button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                        <span className="text-slate-600">相关问题推荐</span>
                        <button
                            className={`px-2 py-0.5 rounded-full ${experienceConfig.relatedQuestions ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                            onClick={() => setExperienceConfig(prev => ({ ...prev, relatedQuestions: !prev.relatedQuestions }))}
                        >
                            {experienceConfig.relatedQuestions ? '开启' : '关闭'}
                        </button>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-2 space-y-2">
                        <div className="text-slate-600">默认开场白</div>
                        <div className="flex gap-2">
                            {[
                                { id: 'auto', label: '自动生成' },
                                { id: 'manual', label: '手动填写' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    className={`px-2 py-1 rounded-md border ${experienceConfig.openerMode === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                                    onClick={() => setExperienceConfig(prev => ({ ...prev, openerMode: item.id, opener: item.id === 'auto' ? '自动生成' : prev.opener }))}
                                >
                                    {item.label}
                                </button>
                            ))}
                            <button
                                className="ml-auto px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600 flex items-center gap-1"
                                onClick={() => {
                                    setExperienceConfig(prev => ({
                                        ...prev,
                                        openerMode: 'manual',
                                        opener: '手动填写',
                                        openerText: openerCandidates[selectedOpenerIndex] || prev.openerText
                                    }));
                                }}
                            >
                                <Sparkles size={12} /> AI 生成
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {openerCandidates.map((candidate, idx) => (
                                <button
                                    key={`${candidate}-${idx}`}
                                    className={`rounded-md border px-2 py-2 text-left text-xs ${selectedOpenerIndex === idx ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                                    onClick={() => {
                                        setSelectedOpenerIndex(idx);
                                        setExperienceConfig(prev => ({
                                            ...prev,
                                            openerMode: 'manual',
                                            opener: '手动填写',
                                            openerText: candidate
                                        }));
                                    }}
                                >
                                    {candidate}
                                </button>
                            ))}
                        </div>
                        {experienceConfig.openerMode === 'manual' && (
                            <textarea
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
                                rows={2}
                                value={experienceConfig.openerText}
                                onChange={(event) => setExperienceConfig(prev => ({ ...prev, openerText: event.target.value, opener: '手动填写' }))}
                            />
                        )}
                    </div>

                    <div className="rounded-lg border border-slate-200 p-2 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600">预设问题</span>
                            <span className="text-slate-500">{presetQuestions.length} 条</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
                                placeholder="新增一个预设问题"
                                value={presetDraft}
                                onChange={(event) => setPresetDraft(event.target.value)}
                            />
                            <button
                                className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600"
                                onClick={() => {
                                    if (!presetDraft.trim()) return;
                                    setPresetQuestions(prev => [...prev, presetDraft.trim()]);
                                    setPresetDraft('');
                                }}
                            >
                                添加
                            </button>
                        </div>
                        <div className="space-y-1">
                            {presetQuestions.map((q, idx) => (
                                <div
                                    key={`${q}-${idx}`}
                                    className={`flex items-center justify-between rounded-md border px-2 py-1 text-xs text-slate-600 ${dragOverIndex === idx ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}
                                    draggable
                                    onDragStart={() => setDragIndex(idx)}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setDragOverIndex(idx);
                                    }}
                                    onDragLeave={() => setDragOverIndex(null)}
                                    onDrop={() => {
                                        if (dragIndex === null || dragIndex === idx) {
                                            setDragIndex(null);
                                            setDragOverIndex(null);
                                            return;
                                        }
                                        setPresetQuestions(prev => {
                                            const next = [...prev];
                                            const [moved] = next.splice(dragIndex, 1);
                                            next.splice(idx, 0, moved);
                                            return next;
                                        });
                                        setDragIndex(null);
                                        setDragOverIndex(null);
                                    }}
                                    onDragEnd={() => {
                                        setDragIndex(null);
                                        setDragOverIndex(null);
                                    }}
                                >
                                    <span className="flex items-center gap-2 truncate">
                                        <GripVertical size={12} className="text-slate-400" />
                                        {q}
                                    </span>
                                    <button
                                        className="text-slate-400 hover:text-slate-600"
                                        onClick={() => setPresetQuestions(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'security',
            title: '运行限制与安全',
            content: (
                <div className="mt-3 space-y-2 text-xs">
                    {['最大耗时：8s', '最大扫描行数：100k', '分页策略：自动', 'SQL 安全策略：启用'].map(item => (
                        <div key={item} className="rounded-lg border border-slate-200 p-2 text-slate-600">
                            {item}
                        </div>
                    ))}
                </div>
            )
        }
    ];

    const handleSaveDraft = () => {
        const draftId = templateState.id ?? `tpl_${Date.now()}`;
        const updatedDraft = {
            ...templateState,
            id: draftId,
            status: 'Draft',
            semanticVersion: templateState.semanticVersion || 'v0.1.0'
        };
        setTemplateState(updatedDraft);
        onSaveDraft?.(updatedDraft);
        toast.success('草稿已保存');
        setActiveModule?.('agent_templates');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            {source === 'create' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
                    模板已创建：{templateState.name} · 请完善语义资产、流程与输出结构后发布。
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            className="p-2 rounded-lg border border-slate-200 hover:border-slate-300"
                            onClick={() => setActiveModule?.('agent_templates')}
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <div className="text-sm text-slate-500">模板名称</div>
                            <div className="text-lg font-semibold text-slate-800">{templateState.name}</div>
                            <div className="mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusTone[templateState.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                    {templateState.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            onClick={() => setActiveModule?.('agent_instances')}
                        >
                            去使用
                        </button>
                        <button
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2"
                            onClick={() => setActiveModule?.('agent_debug')}
                        >
                            <Play size={14} /> 打开调试
                        </button>
                        <button
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2"
                            onClick={handleSaveDraft}
                        >
                            <Save size={14} /> 保存草稿
                        </button>
                        <button
                            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
                            onClick={() => setActiveModule?.('agent_release')}
                        >
                            发布
                        </button>
                        <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                            <RotateCcw size={14} /> 回滚
                        </button>
                    </div>
                </div>
            </div>

            {/* VersionStrip (Frame 0 - Fixed under TopHeader) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-mono text-sm font-semibold">{templateState.semanticVersion} Stable</span>
                        </div>
                        <div className="hidden md:block h-4 w-px bg-slate-200" />
                        <div className="flex items-center gap-3 text-xs md:text-sm text-slate-600">
                            <span>Staging → v2.3.1</span>
                            <span className="text-slate-300">/</span>
                            <span className="flex items-center gap-1">
                                Prod → <span className="font-mono bg-amber-50 text-amber-700 px-1 rounded">v2.3.0 (20%)</span>
                            </span>
                        </div>
                    </div>

                    {/* Center */}
                    <div className="flex items-center gap-3">
                        <button
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${compileStatus === 'Ready'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : compileStatus === 'Warning'
                                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                                    : 'border-rose-200 bg-rose-50 text-rose-700'
                                }`}
                            onClick={() => setIssuesDrawerOpen(true)}
                        >
                            {compileStatus === 'Warning' && <AlertTriangle size={12} />}
                            {compileStatus === 'Blocked' && <XCircle size={12} />}
                            {compileStatus === 'Ready' ? 'Ready' : compileStatus === 'Blocked' ? 'Blocked' : '2 Warnings'}
                        </button>

                        <div className="hidden md:block h-3 w-px bg-slate-200" />

                        <div className="flex items-center gap-3 text-xs font-medium">
                            <span className="flex items-center gap-1 text-slate-600 cursor-pointer hover:text-emerald-600">
                                <Shield size={12} className="text-emerald-500" /> Gate Pass
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                <Activity size={12} /> 运行包: QNA-SupplyChain-v1
                            </span>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="hidden md:flex items-center gap-3 text-xs">
                        <button className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">版本历史</button>
                        <button className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">Diff 模式</button>
                        <button className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">从某版本拉草稿</button>
                    </div>
                </div>
            </div>

            {/* Left Anchor Nav (Frame 1) */}
            <div className="grid grid-cols-12 gap-6 items-start">
                <div className="col-span-2 hidden xl:block sticky top-24">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-2 space-y-1">
                            {[
                                { id: 'basic-info', label: '基本信息', icon: FileText },
                                { id: 'input-schema', label: '输入配置', icon: ListIcon },
                                { id: 'semantic', label: '绑定语义资产', icon: DbIcon },
                                { id: 'knowledge-source', label: '知识源', icon: Layers }, // Link to right panel? Requirements say "Jump to Right Panel" but let's keep it in flow for now or just scroll to section if we have one? Wait, requirement Frame 1 says "Knowledge Source (Jump to Right...)" but also Frame 2 doesn't have it. Let's strictly follow Frame 1 items.
                                { id: 'role-prompt', label: '角色指令', icon: Sparkles },
                                { id: 'workflow', label: '流程编排', icon: GitBranch },
                                { id: 'output-schema', label: '输出结构', icon: FileCode },
                                { id: 'runtime', label: '运行限制与安全', icon: Lock },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeSection === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <item.icon size={14} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                                <span>未保存</span>
                                <button className="hover:text-slate-600">Top</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Editor (Frame 2) */}
                <div className="col-span-12 lg:col-span-8 xl:col-span-7 space-y-4">
                    {/* 2.1 SectionCard: Basic Info */}
                    <div id="basic-info" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 scroll-mt-24">
                        <h3 className="text-sm font-semibold text-slate-800">基本信息</h3>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">模板名称</div>
                                <input
                                    className="mt-1 w-full border-none bg-transparent text-slate-800 font-medium focus:outline-none"
                                    value={templateState.name}
                                    onChange={(event) => setTemplateState(prev => ({ ...prev, name: event.target.value }))}
                                />
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">能力类型</div>
                                <div className="text-slate-800 font-medium mt-1">{templateState.capability}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3 md:col-span-2">
                                <div className="text-xs text-slate-400">简介</div>
                                <textarea
                                    className="mt-1 w-full border-none bg-transparent text-slate-700 focus:outline-none"
                                    rows={2}
                                    value={templateState.description}
                                    onChange={(event) => setTemplateState(prev => ({ ...prev, description: event.target.value }))}
                                />
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">业务域</div>
                                <div className="text-slate-800 font-medium mt-1">{templateState.domain}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">分类</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {Array.from(new Set([templateState.category, '辅助决策', '智能洞察', '分析助手'].filter(Boolean))).map((tag, index) => (
                                        <span key={`${tag}-${index}`} className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">标签</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {templateState.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2.2 SectionCard: Input Schema */}
                    <div id="input-schema" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 scroll-mt-24">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">输入配置 (Input Schema)</h3>
                            <button className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
                                + 新增字段
                            </button>
                        </div>
                        <div className="mt-4 space-y-2">
                            {inputFields.map(field => (
                                <div key={field.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-slate-700 font-medium">{field.name}</div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] ${field.required ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {field.required ? 'REQUIRED' : 'OPTIONAL'}
                                        </span>
                                        <span className="text-xs text-slate-400 px-2 border-l border-slate-200">
                                            {field.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>From: {field.source}</span>
                                        <button className="ml-2 hover:text-indigo-600" onClick={() => setFieldDrawerOpen(true)}>编辑</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* FieldEditorDrawer Mock */}
                    {fieldDrawerOpen && (
                        <div className="fixed inset-0 z-50 flex justify-end">
                            <div className="absolute inset-0 bg-black/20" onClick={() => setFieldDrawerOpen(false)} />
                            <div className="relative bg-white w-[500px] h-full shadow-2xl p-4 animate-in slide-in-from-right">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                    <h3 className="font-semibold text-slate-800">编辑字段: question</h3>
                                    <button onClick={() => setFieldDrawerOpen(false)}><X size={18} className="text-slate-400" /></button>
                                </div>
                                <div className="text-sm text-slate-500 text-center py-10">字段配置抽屉 (Mock)</div>
                            </div>
                        </div>
                    )}


                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-slate-800">绑定语义资产</h3>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">语义版本</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-slate-700 font-mono">v2.1.0</span>
                                    <button className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600">切换</button>
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">业务对象范围</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {['供应链', '采购', '库存'].map(item => (
                                        <span key={item} className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-600">{item}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">逻辑视图</div>
                                <div className="mt-2 text-slate-700">采购视图 · 库存周转视图</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">指标/术语/标签</div>
                                <div className="mt-2 text-slate-700">库存周转率、缺货率、供应商评分</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3 md:col-span-2 bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-slate-500">强一致性校验：知识源过期将阻断发布</div>
                                    <div className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs">On</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-slate-800">角色指令（Role / System Prompt）</h3>
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            你是供应链分析助手，需要结合语义版本与质量信号进行解释，输出可追溯证据与置信度。
                            输出需包含：指标趋势、关键驱动因素、风险提示。
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                            <Info size={14} /> 提示注入风险检测与敏感词提示已开启
                            <button className="ml-auto px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600">
                                插入变量
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">流程编排 (Workflow / DSL)</h3>
                            <button className="text-indigo-600 text-xs hover:underline flex items-center gap-1">
                                <Settings size={12} /> 骨架配置: {templateState.skeleton}
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3">
                            {[
                                { name: 'SemanticSearch', type: '工具', detail: 'query={term}', deps: ['v2.1.0'], status: 'Active' },
                                { name: 'MetricResolver', type: '工具', detail: 'metricId', deps: [], status: 'Active' },
                                { name: 'SQLRunner', type: '高级工具', detail: 'generate & execute', deps: ['SafePolicy-v1'], status: 'Warning' },
                                { name: 'Explanation', type: '模块', detail: '归因分析', deps: [], status: 'Active' }
                            ].map((mod, idx) => (
                                <div key={mod.name} className="relative rounded-lg border border-slate-200 p-3 flex items-start justify-between bg-white hover:border-indigo-300 hover:shadow-sm transition-all group">
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center gap-1 pt-1">
                                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {idx + 1}
                                            </div>
                                            {idx < 3 && <div className="w-0.5 h-full bg-slate-100" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900">{mod.name}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${mod.status === 'Warning' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {mod.type}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-1">{mod.detail}</div>
                                            {mod.deps.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {mod.deps.map(d => (
                                                        <span key={d} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 border border-slate-100 text-slate-500 flex items-center gap-1">
                                                            <GitBranch size={8} /> {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="px-2 py-1 rounded border border-slate-200 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-slate-50"
                                        onClick={() => setStepDrawerOpen(true)}
                                    >
                                        配置
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Info size={12} className="text-amber-500" /> SQLRunner 缺少行数限制配置</span>
                            <button className="text-indigo-600 hover:underline">去修复</button>
                            <div className="ml-auto flex gap-2">
                                <button className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded">
                                    <Sparkles size={12} /> Flow Editor
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* StepConfigDrawer Mock */}
                    {stepDrawerOpen && (
                        <div className="fixed inset-0 z-50 flex justify-end">
                            <div className="absolute inset-0 bg-black/20" onClick={() => setStepDrawerOpen(false)} />
                            <div className="relative bg-white w-[600px] h-full shadow-2xl p-4 animate-in slide-in-from-right">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                                    <h3 className="font-semibold text-slate-800">配置步骤: SemanticSearch</h3>
                                    <button onClick={() => setStepDrawerOpen(false)}><X size={18} className="text-slate-400" /></button>
                                </div>
                                <div className="text-sm text-slate-500 text-center py-10">步骤配置抽屉 (Mock)</div>
                            </div>
                        </div>
                    )}


                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-slate-800">输出结构（Output Schema）</h3>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {[
                                { id: 'text', label: 'Text' },
                                { id: 'json', label: 'JSON' },
                                { id: 'multi', label: '多段输出' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    className={`px-2 py-1 rounded-md border ${outputType === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                                    onClick={() => setOutputType(item.id as 'text' | 'json' | 'multi')}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {['Text', 'JSON', '多段输出'].map(type => (
                                <div key={type} className="rounded-lg border border-slate-200 p-3">
                                    <div className="text-xs text-slate-400">输出类型</div>
                                    <div className="text-slate-800 font-medium mt-1">{type}</div>
                                </div>
                            ))}
                            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                Schema 必填字段：entities / relations / evidence / confidence / conflicts
                            </div>
                        </div>
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto">
                            <pre className="leading-relaxed">{`{
  "type": "object",
  "required": ["entities", "evidence", "confidence"],
  "properties": {
    "entities": { "type": "array" },
    "relations": { "type": "array" },
    "confidence": { "type": "number" }
  }
}`}</pre>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">Schema 规则</div>
                                <div className="text-slate-700 mt-1">必填字段 · 枚举约束 · 最大数组长度</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">示例输出</div>
                                <div className="text-slate-700 mt-1">已生成 1 份结构化示例</div>
                            </div>
                        </div>
                    </div>

                    {/* 2.7 SectionCard: Runtime - Summary in Main */}
                    <div id="runtime" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 scroll-mt-24">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-800">运行限制与安全</h3>
                            <button className="text-indigo-600 text-xs hover:underline" onClick={() => togglePanel('security')}>
                                在右侧编辑详情
                            </button>
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600">
                            <div className="p-2 border border-slate-100 rounded bg-slate-50 text-center">最大耗时: 8s</div>
                            <div className="p-2 border border-slate-100 rounded bg-slate-50 text-center">最大扫行: 100k</div>
                            <div className="p-2 border border-slate-100 rounded bg-slate-50 text-center">分页: 自动</div>
                            <div className="p-2 border-emerald-100 rounded bg-emerald-50 text-center text-emerald-700">SQL 安全: On</div>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Frame 3) */}
                <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
                    {/* Knowledge jump target */}
                    <div id="knowledge-source" className="scroll-mt-24" />
                    {rightPanels.map(panel => (
                        <div key={panel.key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <button
                                className="w-full flex items-center justify-between"
                                onClick={() => togglePanel(panel.key)}
                            >
                                <h3 className="text-sm font-semibold text-slate-800">{panel.title}</h3>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${openPanels.includes(panel.key) ? 'rotate-180' : ''}`} />
                            </button>
                            {openPanels.includes(panel.key) && panel.content}
                        </div>
                    ))}
                </div>
            </div>


            {/* Issues Drawer (P0) */}
            {
                issuesDrawerOpen && (
                    <>
                        <div className="fixed inset-0 bg-black/20 z-[60]" onClick={() => setIssuesDrawerOpen(false)} />
                        <div className="fixed right-0 top-0 h-full w-96 bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h3 className="font-semibold text-slate-800">一致性校验</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-medium">1 阻断</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">1 警告</span>
                                    </div>
                                </div>
                                <button onClick={() => setIssuesDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <ArrowLeft className="rotate-180" size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {mockIssues.map(issue => (
                                    <div key={issue.id} className={`rounded-lg border p-3 ${issue.type === 'error' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
                                        <div className="flex items-start gap-3">
                                            {issue.type === 'error' ? <XCircle size={16} className="text-rose-600 mt-0.5" /> : <AlertTriangle size={16} className="text-amber-600 mt-0.5" />}
                                            <div>
                                                <div className={`text-sm font-medium ${issue.type === 'error' ? 'text-rose-800' : 'text-amber-800'}`}>
                                                    {issue.message}
                                                </div>
                                                <div className={`text-xs mt-1 ${issue.type === 'error' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                    位置: {issue.location}
                                                </div>
                                                <button className="mt-2 text-xs font-semibold underline hover:opacity-80">
                                                    自动修复
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                                <button className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50" onClick={() => {
                                    setMockIssues([]);
                                    setCompileStatus('Ready');
                                }}>
                                    重新编译校验
                                </button>
                            </div>
                        </div>
                    </>
                )
            }
        </div>
    );
};

export default AgentTemplateDesignerView;

