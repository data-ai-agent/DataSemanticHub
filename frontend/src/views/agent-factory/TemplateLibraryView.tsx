import { Filter, Plus, Search, Sliders, LayoutGrid, Table as TableIcon, Activity, AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Eye, TrendingUp, TrendingDown, MoreHorizontal, Copy, Trash2, Power, X, Play, Settings, Database, GitBranch, Shield, Zap, DollarSign } from 'lucide-react';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';
import { useToast } from '../../components/ui/Toast';
import BulkActionWizard from './components/BulkActionWizard';
import CreateTemplateModal from './components/CreateTemplateModal';

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
    cost?: string;
    category?: string;
    tags?: string | string[];
    skeleton?: string;
    // New Governance Fields
    prodStableVersion?: string;
    prodCanaryVersion?: string;
    prodCanaryPercent?: number;
    releaseGateStatus?: 'Pass' | 'Fail' | 'Unrun';
    healthStatus?: 'Normal' | 'Warning' | 'Error';
    owner?: string;
    updatedAt?: string;
    // New Trend Fields (Mocked)
    callsTrend?: 'up' | 'down';
    successRateTrend?: 'up' | 'down';
    p95Trend?: 'up' | 'down';
    costTrend?: 'up' | 'down';
    scenario?: string[];
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

const statusLabels: Record<string, string> = {
    Stable: '已发布',
    Canary: '灰度中',
    Draft: '草稿',
    Deprecated: '已废弃'
};

const getTrendIcon = (metric: 'calls' | 'success' | 'p95' | 'cost', trend: 'up' | 'down') => {
    // Logic: 
    // Success: Up is Good (Green), Down is Bad (Red)
    // Cost/P95: Up is Bad (Red), Down is Good (Green)
    // Calls: Up is Neutral/Good (Slate or Green), Down is Neutral

    const isPositive = trend === 'up';
    let color = 'text-slate-400';
    let Icon = isPositive ? TrendingUp : TrendingDown;

    if (metric === 'success') {
        color = isPositive ? 'text-emerald-500' : 'text-rose-500';
    } else if (metric === 'cost' || metric === 'p95') {
        color = isPositive ? 'text-rose-500' : 'text-emerald-500';
    } else {
        color = 'text-slate-400'; // Calls trend is neutral context usually
    }

    return <Icon size={12} className={color} />;
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

    // Expanded Filter State
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    // Filters
    const [capabilityType, setCapabilityType] = useState('全部');
    const [status, setStatus] = useState('全部');
    const [domain, setDomain] = useState('全部');
    const [gateStatus, setGateStatus] = useState('全部'); // New
    const [sortBy, setSortBy] = useState('最近更新');
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [lastHighlightId, setLastHighlightId] = useState<string | null>(null);
    const [lastHighlightReason, setLastHighlightReason] = useState<HighlightReason>('created');

    // Drawer State
    const [quickViewTemplate, setQuickViewTemplate] = useState<TemplateLibraryItem | null>(null);

    // Bulk Management State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);

    // Create Wizard State
    const [showCreate, setShowCreate] = useState(false);

    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

    // Extend templates with mock governance data & trends
    const enrichedTemplates = useMemo(() => {
        return templates.map(t => ({
            ...t,
            prodStableVersion: t.prodStableVersion || 'v1.0.0',
            prodCanaryVersion: t.prodCanaryVersion,
            prodCanaryPercent: t.prodCanaryPercent,
            releaseGateStatus: t.releaseGateStatus || (Math.random() > 0.8 ? 'Fail' : 'Pass'),
            healthStatus: t.healthStatus || (Math.random() > 0.9 ? 'Warning' : 'Normal'),
            owner: t.owner || 'Admin',
            updatedAt: t.updatedAt || '2024-01-20',
            cost: t.cost || `$${(Math.random() * 5).toFixed(2)}`,
            callsTrend: Math.random() > 0.5 ? 'up' : 'down',
            successRateTrend: Math.random() > 0.5 ? 'up' : 'down',
            p95Trend: Math.random() > 0.5 ? 'up' : 'down',
            costTrend: Math.random() > 0.5 ? 'up' : 'down',
            scenario: ['辅助决策', '智能洞察'] // Mock scenario tags
        } as TemplateLibraryItem));
    }, [templates]);

    const handleCreateTemplate = (templateData: any, navigateToDesigner: boolean) => {
        const newTemplateId = `tpl_${Date.now()}`;
        const newTemplate = {
            id: newTemplateId,
            name: templateData.name || '未命名模板',
            description: templateData.description || '待补充模板简介',
            capability: templateData.capability,
            domain: templateData.domain || '未分类',
            category: activeCategory === '全部' ? '分析助手' : activeCategory,
            tags: templateData.tags,
            skeleton: templateData.skeleton,
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
        setDomain(templateData.domain ? templateData.domain : '全部');
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
        let list = [...enrichedTemplates];

        if (capabilityType !== '全部') {
            list = list.filter(item => item.capability === capabilityType);
        }

        // Quick Filters Status
        if (statusFilter !== 'all') {
            list = list.filter(item => item.status === statusFilter);
        } else if (status !== '全部') {
            const statusMap: Record<string, string> = {
                草稿: 'Draft',
                已发布: 'Stable',
                灰度中: 'Canary',
                已废弃: 'Deprecated',
                待审核: 'Review'
            };
            const mapped = statusMap[status];
            list = mapped ? list.filter(item => item.status === mapped) : [];
        }

        if (domain !== '全部') {
            list = list.filter(item => item.domain === domain);
        }

        if (gateStatus !== '全部') {
            list = list.filter(item => item.releaseGateStatus === gateStatus);
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

        return list;
    }, [enrichedTemplates, capabilityType, status, domain, gateStatus, keyword, sortBy, statusFilter]);

    // Bulk Actions Handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredTemplates.map(t => t.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
            <PageHeader
                title="模板库"
                description="管理智能体模板、能力类型与治理状态。"
                actions={(
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setViewMode('card')}
                                title="卡片视图"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setViewMode('table')}
                                title="表格视图"
                            >
                                <TableIcon size={16} />
                            </button>
                        </div>

                        {/* Bulk Action Trigger */}
                        {selectedIds.size > 0 ? (
                            <button
                                className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm flex items-center gap-2 hover:bg-indigo-100 transition-colors animate-in fade-in slide-in-from-top-1"
                                onClick={() => setIsBulkWizardOpen(true)}
                            >
                                <Zap size={14} className="fill-current" />
                                批量管理 ({selectedIds.size})
                            </button>
                        ) : (
                            <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2 text-slate-400 cursor-not-allowed">
                                批量管理
                            </button>
                        )}

                        <button
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 placeholder:font-medium"
                            onClick={() => {
                                setShowCreate(true);
                            }}
                        >
                            <Plus size={14} /> 新建模板
                        </button>
                    </div>
                )}
            />

            {/* ... Highlight ... */}
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
                <div className="flex flex-col gap-4">
                    {/* Global Search Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-lg">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                                placeholder="搜索名称/标签/作者/业务域/模板ID"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                            {/* Quick Filters */}
                            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                {[
                                    { id: 'All', label: '全部' },
                                    { id: 'Stable', label: '已发布' },
                                    { id: 'Canary', label: '灰度中' },
                                    { id: 'Draft', label: '草稿' }
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setStatusFilter(s.id === 'All' ? 'all' : s.id)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-6 w-px bg-slate-200 mx-1" />

                            <button
                                className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 text-xs hover:bg-slate-50 ${isFilterExpanded ? 'bg-slate-50 border-slate-300 text-slate-900' : 'border-slate-200 bg-white text-slate-600'}`}
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            >
                                <Filter size={14} /> 高级筛选
                                {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            <div className="flex items-center gap-2">
                                <Sliders size={14} className="text-slate-400" />
                                <select
                                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-slate-400"
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                >
                                    {['最近更新', '调用量', '成功率下降', 'P95 上升', '成本上升'].map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {isFilterExpanded && (
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs animate-in slide-in-from-top-2 duration-200">
                        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                            <div className="text-slate-400 mb-2 font-medium">能力类型</div>
                            <select
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none"
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
                            <div className="text-slate-400 mb-2 font-medium">业务域</div>
                            <select
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none"
                                value={domain}
                                onChange={(event) => setDomain(event.target.value)}
                            >
                                {['全部', '供应链', '运营', '法务', '政务', '销售', '采购'].map(item => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                            <div className="text-slate-400 mb-2 font-medium">门禁状态 (Governance)</div>
                            <select
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none"
                                value={gateStatus}
                                onChange={(event) => setGateStatus(event.target.value)}
                            >
                                <option value="全部">全部</option>
                                <option value="Pass">Pass (通过)</option>
                                <option value="Fail">Fail (未通过)</option>
                                <option value="Unrun">Unrun (未运行)</option>
                            </select>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                            <div className="text-slate-400 mb-2 font-medium">指标筛选</div>
                            <div className="flex gap-2 text-slate-600">
                                <div className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-center">成功率 &lt; 90%</div>
                                <div className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-center">成本 &gt; $100</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {templateLibrary.categories.map(item => (
                        <button
                            key={item}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${activeCategory === item ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                            onClick={() => setActiveCategory(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                        <div
                            key={template.id}
                            className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3 group hover:shadow-md transition-shadow relative ${template.id === lastHighlightId ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-slate-200'} ${selectedIds.has(template.id) ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
                        >
                            {/* Card Select Checkbox (visible on hover or if selected) */}
                            <div className={`absolute left-4 top-4 z-10 transition-opacity ${selectedIds.has(template.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    checked={selectedIds.has(template.id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleSelectOne(template.id);
                                    }}
                                />
                            </div>

                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3 pl-5">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3
                                            className="text-base font-semibold text-slate-800 truncate cursor-pointer hover:text-indigo-600"
                                            onClick={() => setQuickViewTemplate(template)}
                                            title="点击查看快速详情"
                                        >
                                            {template.name}
                                        </h3>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${template.healthStatus === 'Normal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : template.healthStatus === 'Warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {template.healthStatus === 'Normal' ? '正常' : template.healthStatus === 'Warning' ? '警告' : '错误'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{template.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle[template.status] || 'bg-slate-100 text-slate-600'}`}>{statusLabels[template.status] || template.status}</span>
                                </div>
                            </div>

                            {/* Card Meta with Scenario Tags */}
                            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="px-2 py-1 rounded border border-slate-100 bg-slate-50 font-medium text-slate-700">{template.capability}</span>
                                <span className="px-2 py-1 rounded border border-slate-100 bg-slate-50">{template.domain}</span>
                                {template.scenario?.map(tag => (
                                    <span key={tag} className="px-2 py-1 rounded border border-slate-100 bg-indigo-50 text-indigo-600">{tag}</span>
                                ))}
                            </div>

                            {/* Governance Summary Row (P0) */}
                            <div className="flex items-center gap-3 text-xs bg-slate-50 rounded-lg p-2 border border-slate-100 group/gov cursor-help" title="Prod Stable | Canary (Percent) | Gate Status">
                                <div className="flex items-center gap-1.5 flex-1 border-r border-slate-200 pr-2">
                                    <div className="text-slate-400">版本</div>
                                    <div className="font-mono text-slate-700">{template.prodStableVersion}</div>
                                    {template.prodCanaryPercent && (
                                        <div className="text-[10px] px-1 rounded bg-amber-100 text-amber-700 font-mono">
                                            {template.prodCanaryVersion} ({template.prodCanaryPercent}%)
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="text-slate-400">门禁</div>
                                    {template.releaseGateStatus === 'Pass' ? (
                                        <CheckCircle size={14} className="text-emerald-500" />
                                    ) : template.releaseGateStatus === 'Fail' ? (
                                        <XCircle size={14} className="text-rose-500" />
                                    ) : (
                                        <Activity size={14} className="text-slate-400" />
                                    )}
                                </div>
                            </div>

                            {/* Metrics Row with Trends */}
                            <div className="grid grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-100">
                                <div>
                                    <div className="text-slate-400 scale-90 origin-left">调用量</div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-semibold text-slate-800 font-mono">{template.calls}</span>
                                        {getTrendIcon('calls', template.callsTrend!)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 scale-90 origin-left">成功率</div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-semibold text-slate-800 font-mono">{template.successRate}</span>
                                        {getTrendIcon('success', template.successRateTrend!)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 scale-90 origin-left">P95</div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-semibold text-slate-800 font-mono">{template.p95}</span>
                                        {getTrendIcon('p95', template.p95Trend!)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 scale-90 origin-left">成本(7d)</div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-semibold text-slate-800 font-mono">{template.cost}</span>
                                        {getTrendIcon('cost', template.costTrend!)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                <span className="flex items-center gap-1"><Clock size={12} /> {template.updatedAt || '最近'}</span>
                                <div className="flex gap-2">
                                    <button
                                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        onClick={() => setQuickViewTemplate(template)}
                                        title="快速预览"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-colors"
                                        onClick={() => setActiveModule?.('agent_instances')}
                                    >
                                        去使用
                                    </button>
                                    <button
                                        className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center gap-1"
                                        onClick={() => setActiveModule?.('agent_debug')}
                                    >
                                        <Play size={12} /> 调试
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium whitespace-nowrap">
                                <tr>
                                    <th className="px-4 py-3 w-8">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3">模板详情</th>
                                    <th className="px-4 py-3">生产版本</th>
                                    <th className="px-4 py-3 text-center">门禁</th>
                                    <th className="px-4 py-3 text-right">调用量 (7d)</th>
                                    <th className="px-4 py-3 text-right">成功率</th>
                                    <th className="px-4 py-3 text-right">P95</th>
                                    <th className="px-4 py-3 text-right">成本</th>
                                    <th className="px-4 py-3">负责人</th>
                                    <th className="px-4 py-3">更新时间</th>
                                    <th className="px-4 py-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTemplates.map(template => (
                                    <tr key={template.id} className={`hover:bg-slate-50 group transition-colors ${selectedIds.has(template.id) ? 'bg-indigo-50 hover:bg-indigo-100' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={selectedIds.has(template.id)}
                                                onChange={() => toggleSelectOne(template.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-800 cursor-pointer hover:text-indigo-600" onClick={() => setQuickViewTemplate(template)}>{template.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusStyle[template.status]}`}>{statusLabels[template.status] || template.status}</span>
                                                <span className="text-slate-400 border border-slate-100 px-1.5 rounded bg-slate-50">{template.capability}</span>
                                                {template.scenario?.map(tag => (
                                                    <span key={tag} className="text-indigo-500 bg-indigo-50 px-1.5 rounded">{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono">
                                            <div className="text-slate-700">{template.prodStableVersion}</div>
                                            {template.prodCanaryPercent && (
                                                <div className="text-[10px] text-amber-600">
                                                    {template.prodCanaryVersion} ({template.prodCanaryPercent}%)
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {template.releaseGateStatus === 'Pass' ? (
                                                <div className="inline-flex items-center gap-1 text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50">
                                                    <CheckCircle size={12} /> Pass
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1 text-slate-400">
                                                    <Activity size={12} /> —
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600">{template.calls}</td>
                                        <td className="px-4 py-3 text-right font-mono text-emerald-600">{template.successRate}</td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600">{template.p95}</td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-600">{template.cost}</td>
                                        <td className="px-4 py-3 text-slate-600">{template.owner}</td>
                                        <td className="px-4 py-3 text-slate-400">{template.updatedAt}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-indigo-600 hover:underline" onClick={() => setQuickViewTemplate(template)}>查看</button>
                                                <button className="text-slate-600 hover:text-slate-900" onClick={() => setActiveModule?.('agent_debug')}>调试</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">创建新模板</h3>
                        <p className="text-xs text-slate-500 mt-1">从头开始创建一个新的模板。</p>
                    </div>
                    <button
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        onClick={() => {
                            setShowCreate(true);
                        }}
                    >
                        创建模板
                    </button>
                </div>
            </div>

            {/* Quick View Drawer (Optimized Layout) */}
            {quickViewTemplate && (
                <>
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[60]" onClick={() => setQuickViewTemplate(null)} />
                    <div className="fixed right-0 top-0 h-full w-[560px] bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-100">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white relative">
                            <div>
                                <h3 className="font-bold text-slate-800 text-xl tracking-tight">{quickViewTemplate.name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${quickViewTemplate.status === 'Stable' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {statusLabels[quickViewTemplate.status] || quickViewTemplate.status}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400">ID: {quickViewTemplate.id}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setQuickViewTemplate(null)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Governance Summary */}
                            <section>
                                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <Shield size={12} /> 治理与发布
                                </h4>
                                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                            <GitBranch size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-0.5">生产版本</div>
                                            <div className="font-mono font-bold text-slate-800 text-sm">{quickViewTemplate.prodStableVersion}</div>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px bg-slate-200" />

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-0.5">门禁状态</div>
                                            <div className="font-medium text-sm">
                                                {quickViewTemplate.releaseGateStatus === 'Pass' ? (
                                                    <span className="text-emerald-600 flex items-center gap-1">通过 <CheckCircle size={12} /></span>
                                                ) : (
                                                    <span className="text-rose-600 flex items-center gap-1">失败 <XCircle size={12} /></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px bg-slate-200" />

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                            <Activity size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-0.5">灰度版本</div>
                                            <div className="font-mono font-bold text-slate-800 text-sm">
                                                {quickViewTemplate.prodCanaryPercent ? `${quickViewTemplate.prodCanaryVersion}` : '未开启'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Metrics */}
                            <section>
                                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={12} /> 核心指标 (7 Days)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                                        <div className="text-xs text-slate-500 mb-2">总调用量</div>
                                        <div className="text-3xl font-bold font-mono text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {quickViewTemplate.calls}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">
                                            <TrendingUp size={12} /> +5.2%
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                                        <div className="text-xs text-slate-500 mb-2">成功率</div>
                                        <div className="text-3xl font-bold font-mono text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {quickViewTemplate.successRate}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">
                                            <TrendingUp size={12} /> 持平
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                                        <div className="text-xs text-slate-500 mb-2">P95 延迟</div>
                                        <div className="text-3xl font-bold font-mono text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {quickViewTemplate.p95}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 mt-2 bg-rose-50 w-fit px-2 py-0.5 rounded-full border border-rose-100">
                                            <TrendingUp size={12} /> +20ms
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                                        <div className="text-xs text-slate-500 mb-2">平均成本</div>
                                        <div className="text-3xl font-bold font-mono text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {quickViewTemplate.cost}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">
                                            <TrendingDown size={12} /> -8%
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Recent Changes */}
                            <section>
                                <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={12} /> 最近更新
                                </h4>
                                <div className="space-y-0 relative">
                                    <div className="absolute left-2.5 top-2 bottom-6 w-px bg-slate-200" />

                                    {[1, 2].map((i, idx) => (
                                        <div key={i} className="flex gap-4 group relative pb-6 last:pb-0">
                                            <div className="relative z-10 mt-1.5">
                                                <div className={`w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                    {idx === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 group-hover:shadow-sm transition-all">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        v{parseInt(quickViewTemplate.prodStableVersion!.split('.')[1]) + (2 - idx)}.0.0 已发布
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono">2 天前</span>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    优化了 Semantic Search 的召回策略，提升准确率。
                                                    {idx === 0 && " 新增了 query rewriting 模块。"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
                            <button
                                className="flex-[2] py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 shadow-md shadow-slate-200 transition-all flex items-center justify-center gap-2"
                                onClick={() => {
                                    if (onNavigateWithParams) {
                                        onNavigateWithParams('agent_designer', { template: quickViewTemplate, source: 'library' });
                                        return;
                                    }
                                    setActiveModule?.('agent_designer');
                                }}
                            >
                                进入详情 / 编辑
                            </button>
                            <button
                                className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
                                onClick={() => setActiveModule?.('agent_debug')}
                            >
                                仅调试
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Bulk Action Wizard */}
            <BulkActionWizard
                isOpen={isBulkWizardOpen}
                onClose={() => setIsBulkWizardOpen(false)}
                selectedCount={selectedIds.size}
                onComplete={() => {
                    setIsBulkWizardOpen(false);
                    setSelectedIds(new Set());
                    toast.success(`成功对 ${selectedIds.size} 个模板执行了批量操作`);
                }}
            />

            <CreateTemplateModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onCreate={handleCreateTemplate}
            />
        </div >
    );
};

export default TemplateLibraryView;
