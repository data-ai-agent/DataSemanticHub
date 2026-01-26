import { ArrowLeft, ChevronDown, ChevronRight, Info, Play, RotateCcw, Save, Sparkles, Wand2 } from 'lucide-react';
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
        'input', 'knowledge', 'tools', 'model', 'experience', 'security'
    ]);
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
    const [presetDraft, setPresetDraft] = useState('');
    const [presetQuestions, setPresetQuestions] = useState<string[]>([
        '近30天库存周转率下降的主要原因？',
        '供应商交付延迟对缺货率的影响？',
        '建议优先优化哪些补货策略？'
    ]);

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
            key: 'input',
            title: '输入配置',
            content: (
                <div className="mt-3 space-y-3 text-sm">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>字段列表</span>
                        <button className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600">新增字段</button>
                    </div>
                    <div className="space-y-2">
                        {inputFields.map(field => (
                            <div key={field.name} className="rounded-lg border border-slate-200 p-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700 font-medium">{field.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full ${field.required ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {field.required ? '必填' : '可选'}
                                    </span>
                                </div>
                                <div className="mt-1 text-slate-500">类型：{field.type} · 来源：{field.source}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
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
                                <div key={`${q}-${idx}`} className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
                                    <span className="truncate">{q}</span>
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                            当前版本 <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">{templateState.semanticVersion} {templateState.status}</span>
                        </div>
                        <div className="text-slate-500">环境指针：Staging → v2.3.1 / Prod → v2.2.8</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white">版本历史</button>
                        <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white">Diff</button>
                        <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white">从某版本拉草稿</button>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-500">
                    <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-slate-400">变更说明</div>
                        <div className="text-slate-700 mt-1">优化指标归因解释 + 新增 evidence 字段</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-slate-400">门禁状态</div>
                        <div className="text-emerald-600 mt-1">评测通过</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-slate-400">灰度进度</div>
                        <div className="text-slate-700 mt-1">Prod 20%</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-slate-400">绑定运行包</div>
                        <div className="text-slate-700 mt-1">QNA-供应链-稳定</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
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

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-slate-800">绑定语义资产</h3>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">语义版本</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-slate-700">v2.1.0</span>
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
                            <div className="rounded-lg border border-slate-200 p-3 md:col-span-2">
                                <div className="text-xs text-slate-400">质量/安全策略</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-slate-700">供应链质量门禁 v1 · SQL 安全策略</span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">已启用</span>
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
                        <h3 className="text-sm font-semibold text-slate-800">流程编排（Workflow / DSL）</h3>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            <span>当前骨架：{templateState.skeleton}</span>
                            <button className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600">切换骨架</button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {['语义检索', '指标解析', 'SQL 生成', '解释与归因'].map(stage => (
                                <div key={stage} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                                    <div>
                                        <div className="text-slate-800 font-medium">{stage}</div>
                                        <div className="text-xs text-slate-500 mt-1">模块状态：启用</div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-400" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 font-mono">
                            step: parse → ground → plan → generate → execute → explain
                            <br />
                            tool: SemanticSearch(query={'{'}term{'}'}) → MetricResolver(metricId)
                            <br />
                            guard: SQL安全策略 / 未加limit拦截
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <button className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600 flex items-center gap-1">
                                <Wand2 size={12} /> 插入工具
                            </button>
                            <button className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600">插入变量</button>
                            <button className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600">危险操作 lint</button>
                            <span className="ml-auto flex items-center gap-1">
                                <Sparkles size={12} /> Flow Editor
                            </span>
                        </div>
                    </div>

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
                </div>

                <div className="space-y-4">
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
        </div>
    );
};

export default AgentTemplateDesignerView;
