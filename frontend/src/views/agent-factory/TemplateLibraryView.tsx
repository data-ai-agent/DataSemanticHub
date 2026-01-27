import { Filter, Plus, Search, Sliders } from 'lucide-react';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';
import { useToast } from '../../components/ui/Toast';

interface TemplateLibraryItem {
    id: string;
    name: string;
    description: string;
    capability: string;
    domain: string;
    status: string;
    semanticVersion: string;
    calls: string;
    successRate: string;
    p95: string;
    category?: string;
    tags?: string | string[];
    skeleton?: string;
}

type HighlightReason = 'created' | 'saved';

interface TemplateLibraryViewProps {
    setActiveModule?: (module: string) => void;
    onNavigateWithParams?: (module: string, params: any) => void;
    templates: TemplateLibraryItem[];
    setTemplates: Dispatch<SetStateAction<TemplateLibraryItem[]>>;
    highlightId?: string | null;
    highlightReason?: HighlightReason;
    onClearHighlight?: () => void;
}

const statusStyle: Record<string, string> = {
    Stable: 'bg-emerald-50 text-emerald-700',
    Canary: 'bg-amber-50 text-amber-700',
    Draft: 'bg-slate-100 text-slate-600',
    Deprecated: 'bg-rose-50 text-rose-600'
};

const TemplateLibraryView = ({
    setActiveModule,
    onNavigateWithParams,
    templates,
    setTemplates,
    highlightId,
    highlightReason,
    onClearHighlight
}: TemplateLibraryViewProps) => {
    const { templateLibrary } = agentFactoryMock;
    const toast = useToast();
    const [activeCategory, setActiveCategory] = useState(templateLibrary.categories[0]);
    const [capabilityType, setCapabilityType] = useState('全部');
    const [status, setStatus] = useState('全部');
    const [domain, setDomain] = useState('全部');
    const [sortBy, setSortBy] = useState('最近更新');
    const [keyword, setKeyword] = useState('');
    const [lastHighlightId, setLastHighlightId] = useState<string | null>(null);
    const [lastHighlightReason, setLastHighlightReason] = useState<HighlightReason>('created');
    const initialCreateForm = {
        capability: '问数(QNA)',
        skeleton: '问数骨架',
        name: '',
        description: '',
        domain: '',
        tags: ''
    };
    const [showCreate, setShowCreate] = useState(false);
    const [createStep, setCreateStep] = useState(0);
    const [createForm, setCreateForm] = useState(initialCreateForm);

    const steps = ['选择能力类型', '选择骨架', '基本信息', '确认创建'];

    const handleCreateTemplate = (navigateToDesigner: boolean) => {
        const newTemplateId = `tpl_${Date.now()}`;
        const newTemplate = {
            id: newTemplateId,
            name: createForm.name || '未命名模板',
            description: createForm.description || '待补充模板简介',
            capability: createForm.capability,
            domain: createForm.domain || '未分类',
            category: activeCategory === '全部' ? '分析助手' : activeCategory,
            tags: createForm.tags,
            skeleton: createForm.skeleton,
            status: 'Draft',
            semanticVersion: 'v0.1.0',
            calls: '—',
            successRate: '—',
            p95: '—'
        };
        setTemplates(prev => [newTemplate, ...prev]);
        setLastHighlightId(newTemplateId);
        setLastHighlightReason('created');
        setShowCreate(false);
        setActiveCategory('全部');
        setCapabilityType(newTemplate.capability);
        setStatus('草稿');
        setDomain(createForm.domain ? createForm.domain : '全部');
        setSortBy('最近更新');
        setKeyword('');
        toast.success(`模板已创建：${newTemplate.name}`);
        if (navigateToDesigner) {
            if (onNavigateWithParams) {
                onNavigateWithParams('agent_designer', { template: newTemplate, source: 'create' });
            } else {
                setActiveModule?.('agent_designer');
            }
        }
    };

    useEffect(() => {
        if (!highlightId) {
            return;
        }
        setLastHighlightId(highlightId);
        setLastHighlightReason(highlightReason ?? 'saved');
        onClearHighlight?.();
    }, [highlightId, highlightReason, onClearHighlight]);

    const filteredTemplates = useMemo(() => {
        const statusMap: Record<string, string> = {
            草稿: 'Draft',
            已发布: 'Stable',
            灰度中: 'Canary',
            已废弃: 'Deprecated',
            待审核: 'Review'
        };
        let list = [...templates];
        if (capabilityType !== '全部') {
            list = list.filter(item => item.capability === capabilityType);
        }
        if (status !== '全部') {
            const mapped = statusMap[status];
            list = mapped ? list.filter(item => item.status === mapped) : [];
        }
        if (domain !== '全部') {
            list = list.filter(item => item.domain === domain);
        }
        if (keyword.trim()) {
            const key = keyword.trim();
            list = list.filter(item => (
                item.name.includes(key)
                || item.description.includes(key)
                || item.domain.includes(key)
                || item.capability.includes(key)
            ));
        }
        switch (sortBy) {
            case '使用量': {
                const parseCalls = (value: string) => {
                    if (!value || value === '—') return 0;
                    const normalized = value.toLowerCase();
                    if (normalized.includes('k')) return parseFloat(normalized) * 1000;
                    if (normalized.includes('m')) return parseFloat(normalized) * 1000000;
                    return Number(normalized.replace(/,/g, '')) || 0;
                };
                list.sort((a, b) => parseCalls(b.calls) - parseCalls(a.calls));
                break;
            }
            case '成功率': {
                const parseRate = (value: string) => Number(value.replace('%', '')) || 0;
                list.sort((a, b) => parseRate(b.successRate) - parseRate(a.successRate));
                break;
            }
            default:
                break;
        }
        return list;
    }, [templates, capabilityType, status, domain, keyword, sortBy]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="模板库"
                description="管理智能体模板、能力类型与治理状态。"
                actions={(
                    <button
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2"
                        onClick={() => {
                            setShowCreate(true);
                            setCreateStep(0);
                            setCreateForm(initialCreateForm);
                        }}
                    >
                        <Plus size={14} /> 新建模板
                    </button>
                )}
            />

            {lastHighlightId && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm">
                    <div>
                        {lastHighlightReason === 'saved' ? '草稿已保存：' : '模板已创建：'}
                        <span className="font-semibold">{templates.find(item => item.id === lastHighlightId)?.name ?? '新模板'}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-white"
                            onClick={() => {
                                const template = templates.find(item => item.id === lastHighlightId);
                                if (template && onNavigateWithParams) {
                                    onNavigateWithParams('agent_designer', { template, source: lastHighlightReason === 'saved' ? 'library' : 'create' });
                                    return;
                                }
                                setActiveModule?.('agent_designer');
                            }}
                        >
                            继续编辑
                        </button>
                        <button
                            className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-white"
                            onClick={() => setLastHighlightId(null)}
                        >
                            关闭提示
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                            placeholder="搜索名称/标签/作者/业务域"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
                            <Filter size={14} /> 高级筛选
                        </button>
                        <div className="flex items-center gap-2">
                            <Sliders size={14} />
                            <select
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                                value={sortBy}
                                onChange={(event) => setSortBy(event.target.value)}
                            >
                                {['最近更新', '最近发布', '使用量', '成功率'].map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {templateLibrary.categories.map(item => (
                        <button
                            key={item}
                            className={`px-3 py-1.5 rounded-full text-xs border ${activeCategory === item ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                            onClick={() => setActiveCategory(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="text-slate-400 mb-2">能力类型</div>
                        <select
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                            value={capabilityType}
                            onChange={(event) => setCapabilityType(event.target.value)}
                        >
                            <option>全部</option>
                            {templateLibrary.capabilityTypes.map(item => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="text-slate-400 mb-2">状态</div>
                        <select
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option>全部</option>
                            {templateLibrary.statuses.map(item => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="text-slate-400 mb-2">业务域</div>
                        <select
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                            value={domain}
                            onChange={(event) => setDomain(event.target.value)}
                        >
                            {['全部', '供应链', '运营', '法务', '政务', '销售', '采购'].map(item => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="text-slate-400 mb-2">筛选摘要</div>
                        <div className="text-xs text-slate-600">
                            {activeCategory} · {capabilityType} · {status} · {domain}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            共 {filteredTemplates.length} 条结果
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                    <div
                        key={template.id}
                        className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-4 group ${template.id === lastHighlightId ? 'border-emerald-400 shadow-md' : 'border-slate-200'}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800">{template.name}</h3>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${statusStyle[template.status]}`}>{template.status}</span>
                                {template.id === lastHighlightId && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700">
                                        {lastHighlightReason === 'saved' ? '草稿' : '新建'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            <span className="px-2 py-1 rounded-full bg-slate-100">{template.capability}</span>
                            <span className="px-2 py-1 rounded-full bg-slate-100">{template.domain}</span>
                            <span className="px-2 py-1 rounded-full bg-slate-100">语义 {template.semanticVersion}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                            <div>
                                <div className="text-slate-400">近7天调用</div>
                                <div className="text-sm font-semibold text-slate-800">{template.calls}</div>
                            </div>
                            <div>
                                <div className="text-slate-400">成功率</div>
                                <div className="text-sm font-semibold text-slate-800">{template.successRate}</div>
                            </div>
                            <div>
                                <div className="text-slate-400">P95耗时</div>
                                <div className="text-sm font-semibold text-slate-800">{template.p95}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>操作</span>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                    onClick={() => {
                                        if (onNavigateWithParams) {
                                            onNavigateWithParams('agent_designer', { template, source: 'library' });
                                            return;
                                        }
                                        setActiveModule?.('agent_designer');
                                    }}
                                >
                                    查看
                                </button>
                                <button
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                    onClick={() => setActiveModule?.('agent_instances')}
                                >
                                    去使用
                                </button>
                                <button
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white"
                                    onClick={() => setActiveModule?.('agent_debug')}
                                >
                                    调试
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">创建模板向导</h3>
                        <p className="text-xs text-slate-500 mt-1">引导式配置模板能力、骨架与基本信息。</p>
                    </div>
                    <button
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        onClick={() => {
                            setShowCreate(true);
                            setCreateStep(0);
                            setCreateForm(initialCreateForm);
                        }}
                    >
                        打开向导
                    </button>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    {steps.map((step, index) => (
                        <div key={step} className="rounded-lg border border-dashed border-slate-200 p-3">
                            <div className="text-xs text-slate-400">Step {index + 1}</div>
                            <div className="mt-1 text-slate-700 font-medium">{step}</div>
                            <div className="text-xs text-slate-400 mt-1">建议用 3 分钟完成配置</div>
                        </div>
                    ))}
                </div>
            </div>

            {showCreate && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowCreate(false)} />
                    <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl border-l border-slate-200 flex flex-col">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">新建模板</h3>
                                    <p className="text-xs text-slate-500 mt-1">按步骤完成模板创建</p>
                                </div>
                                <button
                                    className="px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600"
                                    onClick={() => setShowCreate(false)}
                                >
                                    关闭
                                </button>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs">
                                {steps.map((step, index) => (
                                    <div key={step} className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 rounded-full ${createStep === index ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className={createStep === index ? 'text-slate-900' : 'text-slate-400'}>
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 space-y-4 text-sm">
                            {createStep === 0 && (
                                <div className="space-y-3">
                                    <div className="text-slate-700 font-medium">选择能力类型</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {templateLibrary.capabilityTypes.map(item => (
                                            <button
                                                key={item}
                                                className={`rounded-lg border p-3 text-left ${createForm.capability === item ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                                                onClick={() => setCreateForm(prev => ({ ...prev, capability: item }))}
                                            >
                                                <div className="text-sm font-medium">{item}</div>
                                                <div className="text-xs mt-1 text-slate-400">
                                                    适配 {item} 的模板骨架与能力配置
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {createStep === 1 && (
                                <div className="space-y-3">
                                    <div className="text-slate-700 font-medium">选择骨架</div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {['问数骨架', '语义理解骨架', '知识网络骨架'].map(item => (
                                            <button
                                                key={item}
                                                className={`rounded-lg border p-3 text-left ${createForm.skeleton === item ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                                                onClick={() => setCreateForm(prev => ({ ...prev, skeleton: item }))}
                                            >
                                                <div className="text-sm font-medium">{item}</div>
                                                <div className="text-xs mt-1 text-slate-400">包含默认 Prompt、Schema 与流程配置</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {createStep === 2 && (
                                <div className="space-y-3">
                                    <div className="text-slate-700 font-medium">填写基本信息</div>
                                    <div className="rounded-lg border border-slate-200 p-3">
                                        <div className="text-xs text-slate-400">模板名称</div>
                                        <input
                                            className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                                            placeholder="例如：供应链问数助手"
                                            value={createForm.name}
                                            onChange={(event) => setCreateForm(prev => ({ ...prev, name: event.target.value }))}
                                        />
                                    </div>
                                    <div className="rounded-lg border border-slate-200 p-3">
                                        <div className="text-xs text-slate-400">模板简介</div>
                                        <textarea
                                            className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                                            rows={3}
                                            placeholder="描述该模板的用途与输出"
                                            value={createForm.description}
                                            onChange={(event) => setCreateForm(prev => ({ ...prev, description: event.target.value }))}
                                        />
                                    </div>
                                    <div className="rounded-lg border border-slate-200 p-3">
                                        <div className="text-xs text-slate-400">业务域</div>
                                        <input
                                            className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                                            placeholder="例如：供应链"
                                            value={createForm.domain}
                                            onChange={(event) => setCreateForm(prev => ({ ...prev, domain: event.target.value }))}
                                        />
                                    </div>
                                    <div className="rounded-lg border border-slate-200 p-3">
                                        <div className="text-xs text-slate-400">标签</div>
                                        <input
                                            className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                                            placeholder="用逗号分隔多个标签"
                                            value={createForm.tags}
                                            onChange={(event) => setCreateForm(prev => ({ ...prev, tags: event.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {createStep === 3 && (
                                <div className="space-y-3">
                                    <div className="text-slate-700 font-medium">确认创建</div>
                                    <div className="rounded-lg border border-slate-200 p-3 text-sm">
                                        <div className="text-xs text-slate-400">能力类型</div>
                                        <div className="text-slate-800 mt-1">{createForm.capability}</div>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 p-3 text-sm">
                                        <div className="text-xs text-slate-400">模板骨架</div>
                                        <div className="text-slate-800 mt-1">{createForm.skeleton}</div>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 p-3 text-sm">
                                        <div className="text-xs text-slate-400">模板名称</div>
                                        <div className="text-slate-800 mt-1">{createForm.name || '未填写'}</div>
                                        <div className="text-xs text-slate-400 mt-2">业务域：{createForm.domain || '未填写'}</div>
                                        <div className="text-xs text-slate-400">标签：{createForm.tags || '未填写'}</div>
                                    </div>
                                    {!createForm.name && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                                            请填写模板名称，便于后续治理与追踪。
                                        </div>
                                    )}
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                                        创建后将自动进入设计器补充语义资产与工作流配置。
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                            <button
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                onClick={() => setShowCreate(false)}
                            >
                                取消
                            </button>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                    onClick={() => setCreateStep(prev => Math.max(prev - 1, 0))}
                                    disabled={createStep === 0}
                                >
                                    上一步
                                </button>
                                {createStep < steps.length - 1 ? (
                                    <button
                                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
                                        onClick={() => setCreateStep(prev => Math.min(prev + 1, steps.length - 1))}
                                    >
                                        下一步
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleCreateTemplate(false)}
                                            disabled={!createForm.name}
                                        >
                                            创建并返回列表
                                        </button>
                                        <button
                                            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleCreateTemplate(true)}
                                            disabled={!createForm.name}
                                        >
                                            创建并进入设计器
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TemplateLibraryView;
