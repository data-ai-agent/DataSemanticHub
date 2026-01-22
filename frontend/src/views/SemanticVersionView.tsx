import { useMemo, useState } from 'react';
import {
    ArrowLeft,
    FileText,
    GitCompare,
    History,
    Layers,
    ShieldCheck,
    Tag
} from 'lucide-react';
import { mockBusinessObjects, mockScanResults } from '../data/mockData';
import { semanticVersionMock } from '../data/semanticVersionMock';
import { ReadOnlyBadge } from '../components/common/ReadOnlyBadge';
import { ReadOnlyNotice } from '../components/common/ReadOnlyNotice';
import BusinessModelingView from './BusinessModelingView';
import DataSemanticUnderstandingView from './DataSemanticUnderstandingView';
import { VersionProvider } from '../contexts/VersionContext';

type VersionStatus = 'draft' | 'published' | 'deprecated' | 'rolled_back';
type VersionRow = (typeof semanticVersionMock.versions)[number];

const statusMeta: Record<VersionStatus, { label: string; badge: string }> = {
    draft: { label: '草稿', badge: 'bg-amber-100 text-amber-700' },
    published: { label: '已发布', badge: 'bg-emerald-100 text-emerald-700' },
    deprecated: { label: '已废弃', badge: 'bg-slate-200 text-slate-600' },
    rolled_back: { label: '已回滚', badge: 'bg-rose-100 text-rose-700' }
};

const tabOptions = [
    { id: 'object', label: '对象快照' },
    { id: 'field', label: '字段语义' },
    { id: 'quality', label: '质量 & 安全' },
    { id: 'binding', label: '下游绑定' },
    { id: 'diff', label: 'Diff' }
] as const;

type DetailTab = typeof tabOptions[number]['id'];

const {
    versions: mockVersions,
    qualitySnapshot: mockQualitySnapshot,
    qualityFailures: mockQualityFailures,
    securitySnapshot: mockSecuritySnapshot,
    bindings: mockBindings,
    bindingAudit: mockBindingAudit,
    diffSummary: mockDiffSummary,
    diffItems: mockDiffItems
} = semanticVersionMock;

const SemanticVersionView = () => {
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [activeTab, setActiveTab] = useState<DetailTab>('object');
    const [selectedVersionId, setSelectedVersionId] = useState<string>(mockVersions[0].id);
    const [fieldSearch, setFieldSearch] = useState('');
    const [diffSearch, setDiffSearch] = useState('');
    const [businessObjects, setBusinessObjects] = useState(mockBusinessObjects);
    const [scanResults, setScanResults] = useState<any[]>(mockScanResults);
    const [candidateResults, setCandidateResults] = useState<any[]>([]);

    const selectedVersion = useMemo(
        () => mockVersions.find(item => item.id === selectedVersionId) || mockVersions[0],
        [selectedVersionId]
    );
    const filteredScanResults = useMemo(() => {
        const keyword = fieldSearch.trim().toLowerCase();
        if (!keyword) return scanResults;
        return scanResults.filter(item => {
            const tableMatch = item.table?.toLowerCase().includes(keyword);
            const commentMatch = item.comment?.toLowerCase().includes(keyword);
            const fieldMatch = Array.isArray(item.fields)
                && item.fields.some((field: any) => {
                    const nameMatch = field.name?.toLowerCase().includes(keyword);
                    const fieldCommentMatch = field.comment?.toLowerCase().includes(keyword);
                    return nameMatch || fieldCommentMatch;
                });
            return tableMatch || commentMatch || fieldMatch;
        });
    }, [fieldSearch, scanResults]);
    const filteredDiffItems = useMemo(() => {
        const keyword = diffSearch.trim();
        if (!keyword) return mockDiffItems;
        return mockDiffItems
            .map(section => ({
                ...section,
                items: section.items.filter(item => item.includes(keyword))
            }))
            .filter(section => section.items.length > 0);
    }, [diffSearch, mockDiffItems]);

    const openDetail = (versionId: string, tab?: DetailTab) => {
        setSelectedVersionId(versionId);
        setActiveTab(tab ?? 'object');
        setViewMode('detail');
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto animate-fade-in">
            {viewMode === 'list' ? (
                <>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">语义版本</h2>
                            <p className="text-slate-500 mt-1">冻结后的语义 / 质量 / 安全治理事实</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium">
                                新建版本（草稿）
                            </button>
                            <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-slate-300">
                                帮助 / 说明
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            <span className="px-3 py-1 rounded-full bg-slate-100">状态</span>
                            <span className="px-3 py-1 rounded-full bg-slate-100">范围</span>
                            <span className="px-3 py-1 rounded-full bg-slate-100">创建人</span>
                            <span className="px-3 py-1 rounded-full bg-slate-100">发布时间</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-[1.1fr_0.9fr_1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr_1fr] gap-2 px-4 py-3 text-[11px] text-slate-500 border-b border-slate-200">
                            <span>Version</span>
                            <span>Status</span>
                            <span>Scope</span>
                            <span>Objects</span>
                            <span>Fields</span>
                            <span>Quality Rules</span>
                            <span>Security Policies</span>
                            <span>Published At</span>
                            <span>Actions</span>
                        </div>
                        {mockVersions.map(version => (
                            <div
                                key={version.id}
                                className="grid grid-cols-[1.1fr_0.9fr_1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr_1fr] gap-2 px-4 py-3 text-xs text-slate-700 border-b border-slate-100 last:border-b-0"
                            >
                                <div className="font-semibold text-slate-800">{version.version}</div>
                                <div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusMeta[version.status as VersionStatus].badge}`}>
                                        {statusMeta[version.status as VersionStatus].label}
                                    </span>
                                </div>
                                <div>{version.scope}</div>
                                <div>{version.objects}</div>
                                <div>{version.fields}</div>
                                <div>{version.qualityRules}</div>
                                <div>{version.securityPolicies}</div>
                                <div>{version.publishedAt}</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        onClick={() => openDetail(version.id, 'object')}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        查看
                                    </button>
                                    <button
                                        onClick={() => openDetail(version.id, 'diff')}
                                        className="text-slate-500 hover:text-slate-700"
                                    >
                                        Diff
                                    </button>
                                    <button className="text-slate-500 hover:text-slate-700">
                                        发布 / 回滚
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <VersionProvider value={{ readOnly: true, versionId: selectedVersion.version }}>
                    <>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">语义版本详情</h2>
                                    <p className="text-slate-500 mt-1">语义版本快照视角（只读）</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-slate-300">
                                    查看 Diff
                                </button>
                                <button className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-slate-300">
                                    回滚
                                </button>
                                <button className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium">
                                    导出
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100">工作态</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white">
                                    查看版本 {selectedVersion.version}
                                </span>
                                <ReadOnlyBadge className="text-[11px] text-slate-500" />
                            </div>
                            <ReadOnlyNotice />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                                <div className="flex items-center gap-2">
                                    <History size={14} className="text-slate-400" />
                                    版本：<span className="text-slate-800 font-semibold">{selectedVersion.version}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-slate-400" />
                                    状态：
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusMeta[selectedVersion.status as VersionStatus].badge}`}>
                                        {statusMeta[selectedVersion.status as VersionStatus].label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Layers size={14} className="text-slate-400" />
                                    范围：{selectedVersion.scope}
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-slate-400" />
                                    基线版本：{selectedVersion.baseVersion}
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-slate-400" />
                                    发布时间：{selectedVersion.publishedAt}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-slate-400" />
                                    发布人：{selectedVersion.createdBy}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap gap-2 text-xs">
                            {tabOptions.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-full border transition ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'object' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800">对象快照</h3>
                                    <span className="text-[10px] text-slate-500">复用业务对象建模页（只读）</span>
                                </div>
                                <BusinessModelingView
                                    businessObjects={businessObjects}
                                    setBusinessObjects={setBusinessObjects}
                                    onNavigateToMapping={() => { }}
                                />
                            </div>
                        )}

                        {activeTab === 'field' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800">字段语义快照</h3>
                                    <span className="text-[10px] text-slate-500">只读列表 + 变更筛选</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <input
                                        value={fieldSearch}
                                        onChange={(e) => setFieldSearch(e.target.value)}
                                        placeholder="筛选字段/表名..."
                                        className="w-full md:w-64 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
                                    />
                                    <span className="text-[10px] text-slate-400">筛选结果 {filteredScanResults.length} 张</span>
                                </div>
                                <DataSemanticUnderstandingView
                                    scanResults={filteredScanResults}
                                    setScanResults={setScanResults}
                                    candidateResults={candidateResults}
                                    setCandidateResults={setCandidateResults}
                                    businessObjects={businessObjects}
                                    setBusinessObjects={setBusinessObjects}
                                />
                            </div>
                        )}

                        {activeTab === 'quality' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800">质量 & 安全快照</h3>
                                    <span className="text-[10px] text-slate-500">规则/策略快照</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">质量快照</span>
                                            <span className="text-[10px] text-slate-400">Rule Set {mockQualitySnapshot.ruleSetVersion}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            <div>规则数：<span className="font-medium text-slate-700">{mockQualitySnapshot.ruleCount}</span></div>
                                            <div>通过率：<span className="font-medium text-emerald-600">{Math.round(mockQualitySnapshot.passRate * 100)}%</span></div>
                                            <div>失败字段：<span className="font-medium text-rose-600">{mockQualitySnapshot.failedFields}</span></div>
                                            <div>最近执行：<span className="font-medium text-slate-700">{mockQualitySnapshot.latestRun}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                            失败字段 Top：
                                            <div className="mt-1 space-y-1">
                                                {mockQualityFailures.map(item => (
                                                    <div key={item} className="font-mono text-slate-600">{item}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">安全快照</span>
                                            <span className="text-[10px] text-slate-400">策略与分级</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            <div>脱敏规则：<span className="font-medium text-slate-700">{mockSecuritySnapshot.maskingRules}</span></div>
                                            <div>高风险字段：<span className="font-medium text-rose-600">{mockSecuritySnapshot.highRiskFields}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                            分级分布：
                                            <div className="mt-1 space-y-1">
                                                {mockSecuritySnapshot.classification.map(item => (
                                                    <div key={item.label} className="flex items-center justify-between text-slate-600">
                                                        <span>{item.label}</span>
                                                        <span className="font-medium">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'binding' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800">下游绑定</h3>
                                    <span className="text-[10px] text-slate-500">只读审计</span>
                                </div>
                                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs text-slate-600">
                                    <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_1fr] gap-2 px-3 py-2 bg-slate-50 text-[11px] text-slate-500 border-b border-slate-100">
                                        <span>类型</span>
                                        <span>消费方</span>
                                        <span>绑定版本</span>
                                        <span>负责人</span>
                                        <span>最后切换</span>
                                    </div>
                                    {mockBindings.map(item => (
                                        <div key={item.name} className="grid grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_1fr] gap-2 px-3 py-2 border-b border-slate-100 last:border-b-0">
                                            <span>{item.type}</span>
                                            <span className="font-medium text-slate-700">{item.name}</span>
                                            <span className="text-slate-500">{item.version}</span>
                                            <span>{item.owner}</span>
                                            <span>{item.lastSwitch}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                                    <div className="text-[11px] text-slate-500 mb-2">切换记录</div>
                                    <div className="space-y-1">
                                        {mockBindingAudit.map(item => (
                                            <div key={`${item.target}-${item.time}`} className="flex items-center justify-between text-[11px] text-slate-600">
                                                <span>{item.action} · {item.target} · {item.from} → {item.to}</span>
                                                <span className="text-slate-400">{item.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'diff' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <GitCompare size={16} className="text-slate-500" />
                                        版本 Diff
                                    </h3>
                                    <span className="text-[10px] text-slate-500">Added / Removed / Changed</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <input
                                        value={diffSearch}
                                        onChange={(e) => setDiffSearch(e.target.value)}
                                        placeholder="筛选 Diff 关键词..."
                                        className="w-full md:w-64 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
                                    />
                                    <span className="text-[10px] text-slate-400">支持标题与条目关键词</span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">新增 {mockDiffSummary.added}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">变更 {mockDiffSummary.changed}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">移除 {mockDiffSummary.removed}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                                    {filteredDiffItems.length ? (
                                        filteredDiffItems.map(section => (
                                            <div key={section.title} className="border border-slate-200 rounded-lg p-3 space-y-2">
                                                <div className="text-[11px] text-slate-500">{section.title}</div>
                                                <div className="space-y-1">
                                                    {section.items.map(item => (
                                                        <div key={item} className="text-slate-600">{item}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg p-4 text-center">
                                            未找到匹配的 Diff 项
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                </VersionProvider>
            )}
        </div>
    );
};

export default SemanticVersionView;
