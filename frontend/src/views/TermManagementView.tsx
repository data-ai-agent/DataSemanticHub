// ==========================================
// Term Management View
// ==========================================

import React, { useEffect, useState } from 'react';
import {
    Book,
    Plus,
    Search,
    Activity,
    Edit,
    Trash2,
    X,
    Copy,
    MoreHorizontal,
    ChevronRight,
    CheckCircle,
    Send,
    Archive,
    FileText,
    Link,
    GitBranch,
    History,
    MessageCircle,
    User,
    Clock
} from 'lucide-react';

interface Term {
    id: string;
    term: string;
    englishTerm: string;
    category: string;
    domain?: string;
    definition: string;
    synonyms: string[];
    relatedTerms: string[];
    usage: number;
    status: string;
    createTime: string;
    updateTime: string;
    creator: string;
    owner?: string;
    tags: string[];
}

type DetailTab =
    | 'overview'
    | 'definition'
    | 'relations'
    | 'references'
    | 'workflow'
    | 'versions'
    | 'comments';

const buildDefaultComments = (term: Term | null) => term ? [
    { author: '语义治理专员', date: term.updateTime, content: '请确认该术语在业务对象体系中的归属。' },
    { author: '数据管理员', date: term.updateTime, content: '定义已补充引用来源，可进入评审。' }
] : [];

interface TagInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ value = [], onChange, placeholder }) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
            e.preventDefault();
            const trimmed = input.trim();
            if (trimmed && !value.includes(trimmed)) {
                onChange([...value, trimmed]);
                setInput('');
            }
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg focus-within:border-indigo-500 bg-white min-h-[42px] cursor-text" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
            {value.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs">
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                        className="hover:text-indigo-900 focus:outline-none flex items-center"
                    >
                        <X size={12} />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                    const trimmed = input.trim();
                    if (trimmed && !value.includes(trimmed)) {
                        onChange([...value, trimmed]);
                        setInput('');
                    }
                }}
                className="flex-1 outline-none text-sm min-w-[80px] bg-transparent"
                placeholder={value.length === 0 ? placeholder : ''}
            />
        </div>
    );
};

const TermManagementView: React.FC = () => {
    const [terms, setTerms] = useState<Term[]>([
        {
            id: 'TERM_001',
            term: '自然人',
            englishTerm: 'Natural Person',
            category: '业务对象',
            domain: '人口主题',
            definition: '具有民事权利能力和民事行为能力，依法独立享有民事权利和承担民事义务的个人',
            synonyms: ['个人', '公民'],
            relatedTerms: ['法人', '组织'],
            usage: 45,
            status: '已发布',
            createTime: '2024-01-15',
            updateTime: '2024-05-20',
            creator: '张业务',
            owner: '数据治理组',
            tags: ['核心术语', '法律术语']
        },
        {
            id: 'TERM_002',
            term: '出生医学证明',
            englishTerm: 'Birth Medical Certificate',
            category: '证照',
            domain: '政务服务',
            definition: '依据《中华人民共和国母婴保健法》出具的，证明婴儿出生状态、血亲关系以及申报国籍、户籍取得公民身份的法定医学证明',
            synonyms: ['出生证明', '出生证'],
            relatedTerms: ['身份证', '户口本'],
            usage: 28,
            status: '已发布',
            createTime: '2024-02-10',
            updateTime: '2024-05-18',
            creator: '李法务',
            owner: '证照标准组',
            tags: ['证照', '法定文件']
        },
        {
            id: 'TERM_003',
            term: '语义角色',
            englishTerm: 'Semantic Role',
            category: '技术术语',
            domain: '数据治理',
            definition: '数据字段在业务语义中的角色定位，如标识、属性、关联、状态、行为线索等',
            synonyms: ['字段语义', '语义类型'],
            relatedTerms: ['语义理解', '数据分类'],
            usage: 156,
            status: '已发布',
            createTime: '2024-03-05',
            updateTime: '2024-05-21',
            creator: '王技术',
            owner: '技术治理组',
            tags: ['技术术语', '数据治理']
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
    const [detailTab, setDetailTab] = useState<DetailTab>('overview');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTerm, setEditingTerm] = useState<Partial<Term> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [commentDraft, setCommentDraft] = useState('');

    const categories = ['all', '业务对象', '证照', '技术术语', '流程术语', '数据术语'];
    const statusStyles: Record<string, string> = {
        '草稿': 'bg-amber-100 text-amber-700',
        '待评审': 'bg-sky-100 text-sky-700',
        '已发布': 'bg-emerald-100 text-emerald-700',
        '变更中': 'bg-violet-100 text-violet-700',
        '已批准': 'bg-teal-100 text-teal-700',
        '已废弃': 'bg-slate-200 text-slate-600'
    };
    const tabs: Array<{ id: DetailTab; label: string; icon: React.ElementType }> = [
        { id: 'overview', label: '概览', icon: Book },
        { id: 'definition', label: '定义与口径', icon: FileText },
        { id: 'relations', label: '关系', icon: Link },
        { id: 'references', label: '引用', icon: Link },
        { id: 'workflow', label: '流程', icon: GitBranch },
        { id: 'versions', label: '版本与变更', icon: History },
        { id: 'comments', label: '评论', icon: MessageCircle }
    ];

    const filteredTerms = terms.filter(term => {
        const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            term.englishTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
            term.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const referencePreview = selectedTerm ? [
        {
            type: '字段',
            name: `${selectedTerm.term}名称`,
            role: '主绑定',
            updatedAt: selectedTerm.updateTime,
            path: `core/${selectedTerm.term}/name`
        },
        {
            type: '业务对象',
            name: `${selectedTerm.term}档案`,
            role: '引用',
            updatedAt: selectedTerm.updateTime,
            path: `domain/${selectedTerm.term}/profile`
        },
        {
            type: '指标',
            name: `${selectedTerm.term}统计`,
            role: '候选',
            updatedAt: selectedTerm.updateTime,
            path: `metric/${selectedTerm.term}/count`
        }
    ] : [];

    const versionTimeline = selectedTerm ? [
        {
            version: 'v1.0',
            actor: selectedTerm.creator,
            date: selectedTerm.createTime,
            note: '首次创建术语',
            status: '已发布',
            summary: '创建基础定义与分类'
        },
        {
            version: 'v1.1',
            actor: selectedTerm.creator,
            date: selectedTerm.updateTime,
            note: '补充定义与同义词',
            status: '已发布',
            summary: '补充同义词与引用'
        }
    ] : [];

    const [commentItems, setCommentItems] = useState(() => buildDefaultComments(null));

    const approvalHistory = selectedTerm ? [
        { step: '创建', actor: selectedTerm.creator, result: '完成', date: selectedTerm.createTime, note: '提交基础定义' },
        { step: '评审', actor: '数据治理组', result: '通过', date: selectedTerm.updateTime, note: '同义词补充完成' }
    ] : [];

    const versionDiff = selectedTerm ? [
        { field: '定义', from: '新增定义字段', to: selectedTerm.definition },
        { field: '同义词', from: '无', to: selectedTerm.synonyms.join('、') }
    ] : [];

    useEffect(() => {
        setCommentItems(buildDefaultComments(selectedTerm));
        setCommentDraft('');
    }, [selectedTerm?.id]);

    const handleCommentSubmit = () => {
        const content = commentDraft.trim();
        if (!content || !selectedTerm) {
            return;
        }
        const now = new Date().toISOString().split('T')[0];
        setCommentItems((items) => ([
            { author: '当前用户', date: now, content },
            ...items
        ]));
        setCommentDraft('');
    };

    const handleSave = (termData: Partial<Term>) => {
        if (isCreating) {
            setTerms([...terms, {
                ...termData,
                id: `TERM_${Date.now()}`,
                usage: 0,
                createTime: new Date().toISOString().split('T')[0],
                updateTime: new Date().toISOString().split('T')[0],
                creator: '当前用户',
                status: '已发布',
                tags: [],
                synonyms: termData.synonyms || [],
                relatedTerms: termData.relatedTerms || []
            } as Term]);
            setIsCreating(false);
        } else {
            setTerms(terms.map(t => t.id === editingTerm!.id ? {
                ...t,
                ...termData,
                updateTime: new Date().toISOString().split('T')[0],
                synonyms: termData.synonyms || [],
                relatedTerms: termData.relatedTerms || []
            } : t));
        }
        setShowEditModal(false);
        setEditingTerm(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('确定要删除该术语吗？')) {
            setTerms(terms.filter(t => t.id !== id));
        }
    };

    return (
        <div className="space-y-6 p-6 h-full flex flex-col overflow-hidden">
            {/* 头部 */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Book size={24} className="text-indigo-600" />
                        术语管理
                    </h2>
                    <p className="text-slate-500 mt-1">统一管理业务术语和技术术语，建立企业级术语库</p>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setEditingTerm({
                            term: '',
                            englishTerm: '',
                            category: '业务对象',
                            definition: '',
                            synonyms: [],
                            relatedTerms: []
                        });
                        setShowEditModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                    <Plus size={16} /> 新建术语
                </button>
            </div>

            {/* 搜索和筛选 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 shrink-0">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索术语名称、英文名或定义..."
                            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'all' ? '全部分类' : cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 术语列表 */}
            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">术语</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">英文名</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">分类</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">使用次数</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">状态</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTerms.map(term => (
                                    <tr
                                        key={term.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedTerm(term);
                                            setDetailTab('overview');
                                        }}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="font-medium text-slate-800">{term.term}</div>
                                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">{term.definition}</div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600">{term.englishTerm}</td>
                                        <td className="py-4 px-4">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                                                {term.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                <Activity size={14} />
                                                {term.usage}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${statusStyles[term.status] || 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {term.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingTerm(term);
                                                        setIsCreating(false);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(term.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 详情抽屉 */}
            {selectedTerm && !showEditModal && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setSelectedTerm(null)}
                    />
                    <div className="absolute right-0 top-0 h-full w-[840px] max-w-[92vw] bg-white shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900">{selectedTerm.term}</h1>
                                    <p className="text-sm text-slate-500 mt-1">{selectedTerm.englishTerm || '—'}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[selectedTerm.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {selectedTerm.status}
                                        </span>
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                            {selectedTerm.category}
                                        </span>
                                        {selectedTerm.domain && (
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                                {selectedTerm.domain}
                                            </span>
                                        )}
                                        {selectedTerm.tags?.[0] && (
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                                {selectedTerm.tags[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingTerm(selectedTerm);
                                            setIsCreating(false);
                                            setShowEditModal(true);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        <Edit size={14} />
                                        编辑
                                    </button>
                                    {(selectedTerm.status === '草稿' || selectedTerm.status === '变更中') && (
                                        <button className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
                                            <Send size={14} />
                                            提交评审
                                        </button>
                                    )}
                                    {selectedTerm.status === '待评审' && (
                                        <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                                            <CheckCircle size={14} />
                                            发布
                                        </button>
                                    )}
                                    {selectedTerm.status === '已发布' && (
                                        <button className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                                            <Archive size={14} />
                                            废弃
                                        </button>
                                    )}
                                    <button className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                                        <MoreHorizontal size={16} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedTerm(null)}
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="sticky top-[88px] z-10 border-b border-slate-200 bg-white px-6">
                            <div className="flex items-center gap-6 overflow-x-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setDetailTab(tab.id)}
                                        className={`flex items-center gap-2 border-b-2 py-3 text-sm font-semibold transition ${detailTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="flex gap-6 px-6 py-6">
                                <div className="flex-1 space-y-6">
                                    {detailTab === 'overview' && (
                                        <>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                    <div className="text-xs text-slate-500">使用次数</div>
                                                    <div className="mt-2 text-2xl font-semibold text-slate-800">{selectedTerm.usage}</div>
                                                    <div className="mt-1 text-xs text-slate-400">最近 30 天统计</div>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                    <div className="text-xs text-slate-500">引用资产数</div>
                                                    <div className="mt-2 text-2xl font-semibold text-slate-800">{referencePreview.length}</div>
                                                    <div className="mt-1 text-xs text-slate-400">Top 引用统计</div>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                    <div className="text-xs text-slate-500">最近更新</div>
                                                    <div className="mt-2 text-lg font-semibold text-slate-800">{selectedTerm.updateTime}</div>
                                                    <div className="mt-1 text-xs text-slate-400">更新人：{selectedTerm.creator}</div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-800">定义摘要</h3>
                                                    <button
                                                        onClick={() => setDetailTab('definition')}
                                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        展开全文
                                                    </button>
                                                </div>
                                                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                                    {selectedTerm.definition}
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {selectedTerm.tags.map((tag) => (
                                                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <h3 className="text-sm font-semibold text-slate-800">关系速览</h3>
                                                <div className="mt-4 space-y-4">
                                                    <div>
                                                        <div className="text-xs text-slate-500">同义词</div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {selectedTerm.synonyms.map((syn) => (
                                                                <span key={syn} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                                                                    {syn}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">相关术语</div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {selectedTerm.relatedTerms.map((rel) => (
                                                                <span key={rel} className="rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-700">
                                                                    {rel}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-800">引用资产 Top</h3>
                                                    <button
                                                        onClick={() => setDetailTab('references')}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        查看全部
                                                        <ChevronRight size={12} />
                                                    </button>
                                                </div>
                                                <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-slate-50 text-slate-500">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left">资产类型</th>
                                                                <th className="px-3 py-2 text-left">名称</th>
                                                                <th className="px-3 py-2 text-left">绑定角色</th>
                                                                <th className="px-3 py-2 text-left">更新时间</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-slate-600">
                                                            {referencePreview.map((row) => (
                                                                <tr key={`${row.type}-${row.name}`}>
                                                                    <td className="px-3 py-2">{row.type}</td>
                                                                    <td className="px-3 py-2">{row.name}</td>
                                                                    <td className="px-3 py-2">{row.role}</td>
                                                                    <td className="px-3 py-2">{row.updatedAt}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'definition' && (
                                        <>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <h3 className="text-sm font-semibold text-slate-800">定义</h3>
                                                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                                    {selectedTerm.definition}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <h3 className="text-sm font-semibold text-slate-800">业务口径</h3>
                                                <div className="mt-4 grid gap-4 text-sm text-slate-600">
                                                    <div>
                                                        <div className="text-xs text-slate-500">适用范围</div>
                                                        <div className="mt-1">核心业务对象，适用于数据服务与治理流程。</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">边界/不包含项</div>
                                                        <div className="mt-1">不包含暂存数据、临时结果或外部采集噪声字段。</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">示例</div>
                                                        <div className="mt-1">示例字段：{selectedTerm.term}_id；示例口径：以主数据系统为准。</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500">备注/引用来源</div>
                                                        <div className="mt-1">引用《数据资产管理规范 v2.1》与领域专家评审结论。</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'relations' && (
                                        <>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-800">同义词</h3>
                                                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">添加同义词</button>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {selectedTerm.synonyms.map((syn) => (
                                                        <span key={syn} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                                                            {syn}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-800">相关术语</h3>
                                                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">添加关系</button>
                                                </div>
                                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                                    {selectedTerm.relatedTerms.map((rel) => (
                                                        <div key={rel} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] text-purple-700">相关</span>
                                                                <span>{rel}</span>
                                                            </div>
                                                            <button className="text-xs text-slate-400 hover:text-slate-600">编辑</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'references' && (
                                        <>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <select className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                                        <option>资产类型</option>
                                                    </select>
                                                    <select className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                                        <option>绑定角色</option>
                                                    </select>
                                                    <div className="flex-1 min-w-[180px]">
                                                        <input
                                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                                            placeholder="搜索资产关键词"
                                                        />
                                                    </div>
                                                    <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                                        导出
                                                    </button>
                                                </div>
                                                <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-slate-50 text-slate-500">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left">资产类型</th>
                                                                <th className="px-3 py-2 text-left">资产名称</th>
                                                                <th className="px-3 py-2 text-left">路径</th>
                                                                <th className="px-3 py-2 text-left">绑定角色</th>
                                                                <th className="px-3 py-2 text-left">更新时间</th>
                                                                <th className="px-3 py-2 text-left">操作</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-slate-600">
                                                            {referencePreview.map((row) => (
                                                                <tr key={`${row.type}-${row.name}-ref`}>
                                                                    <td className="px-3 py-2">{row.type}</td>
                                                                    <td className="px-3 py-2">{row.name}</td>
                                                                    <td className="px-3 py-2 text-slate-400">{row.path}</td>
                                                                    <td className="px-3 py-2">{row.role}</td>
                                                                    <td className="px-3 py-2">{row.updatedAt}</td>
                                                                    <td className="px-3 py-2">
                                                                        <button className="text-xs text-indigo-600 hover:text-indigo-700">打开</button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'workflow' && (
                                        <>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <h3 className="text-sm font-semibold text-slate-800">状态流转</h3>
                                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        草稿 → 待评审 → 已批准 → 已发布 → 已废弃
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <h3 className="text-sm font-semibold text-slate-800">当前任务</h3>
                                                <div className="mt-3 text-sm text-slate-600">
                                                    当前节点：待评审（负责人：{selectedTerm.creator}）
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">通过</button>
                                                    <button className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600">驳回</button>
                                                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">补充材料</button>
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <h3 className="text-sm font-semibold text-slate-800">审批记录</h3>
                                                <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-slate-50 text-slate-500">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left">节点</th>
                                                                <th className="px-3 py-2 text-left">处理人</th>
                                                                <th className="px-3 py-2 text-left">结果</th>
                                                                <th className="px-3 py-2 text-left">意见</th>
                                                                <th className="px-3 py-2 text-left">时间</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-slate-600">
                                                            {approvalHistory.map((row) => (
                                                                <tr key={`${row.step}-${row.date}`}>
                                                                    <td className="px-3 py-2">{row.step}</td>
                                                                    <td className="px-3 py-2">{row.actor}</td>
                                                                    <td className="px-3 py-2">{row.result}</td>
                                                                    <td className="px-3 py-2">{row.note}</td>
                                                                    <td className="px-3 py-2">{row.date}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'versions' && (
                                        <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-800">版本记录</h3>
                                                    {selectedTerm.status === '已发布' && (
                                                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                                            创建变更单
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="mt-4 space-y-3">
                                                    {versionTimeline.map((item) => (
                                                        <div key={item.version} className="rounded-lg border border-slate-100 px-3 py-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-sm font-semibold text-slate-700">{item.version}</div>
                                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[item.status] || 'bg-slate-100 text-slate-600'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-1">{item.summary}</div>
                                                            <div className="text-xs text-slate-400 mt-1">{item.actor} · {item.date}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                                <h3 className="text-sm font-semibold text-slate-800">差异对比</h3>
                                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                                    {versionDiff.map((row) => (
                                                        <div key={row.field} className="rounded-lg border border-slate-100 px-3 py-2">
                                                            <div className="text-xs text-slate-500">{row.field}</div>
                                                            <div className="mt-1 text-xs text-slate-400">旧值：{row.from}</div>
                                                            <div className="mt-1 text-xs text-slate-600">新值：{row.to}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {detailTab === 'comments' && (
                                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                                            <h3 className="text-sm font-semibold text-slate-800">评论</h3>
                                            <div className="mt-4 space-y-3">
                                                <textarea
                                                    value={commentDraft}
                                                    onChange={(event) => setCommentDraft(event.target.value)}
                                                    rows={3}
                                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                    placeholder="补充评审意见或@相关同事"
                                                />
                                                <div className="flex items-center justify-end">
                                                    <button
                                                        onClick={handleCommentSubmit}
                                                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                                                        disabled={!commentDraft.trim()}
                                                    >
                                                        发送
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-4">
                                                {commentItems.map((item, index) => (
                                                    <div key={`${item.author}-${index}`} className="rounded-lg border border-slate-100 px-3 py-2">
                                                        <div className="text-xs text-slate-500">{item.author} · {item.date}</div>
                                                        <div className="mt-1 text-sm text-slate-600">{item.content}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Aside */}
                                <div className="w-72 shrink-0">
                                    <div className="sticky top-6 space-y-4">
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <h3 className="text-xs font-semibold text-slate-500">基础信息</h3>
                                            <div className="mt-3 space-y-3 text-sm text-slate-600">
                                                <div>
                                                    <div className="text-[11px] text-slate-400">Term ID</div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="text-xs font-mono text-slate-700">{selectedTerm.id}</span>
                                                        <button
                                                            className="text-slate-400 hover:text-slate-600"
                                                            onClick={() => navigator.clipboard?.writeText(selectedTerm.id)}
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-slate-400" />
                                                    <span>Owner：{selectedTerm.owner || selectedTerm.creator}</span>
                                                </div>
                                                {selectedTerm.domain && (
                                                    <div className="text-xs text-slate-500">主题域：{selectedTerm.domain}</div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-400" />
                                                    <span>创建：{selectedTerm.createTime}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-400" />
                                                    <span>更新：{selectedTerm.updateTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <h3 className="text-xs font-semibold text-slate-500">治理信息</h3>
                                            <div className="mt-3 space-y-3 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-emerald-500" />
                                                    当前状态：{selectedTerm.status}
                                                </div>
                                                <div className="text-xs text-slate-500">审批规则：按分类路由至数据治理组</div>
                                                {selectedTerm.status === '已废弃' && (
                                                    <div className="text-xs text-rose-500">替代术语：{selectedTerm.relatedTerms[0] || '—'}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 编辑/创建模态框 */}
            {showEditModal && editingTerm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">{isCreating ? '新建术语' : '编辑术语'}</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTerm(null);
                                    setIsCreating(false);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">术语名称 *</label>
                                <input
                                    type="text"
                                    value={editingTerm.term || ''}
                                    onChange={(e) => setEditingTerm({ ...editingTerm, term: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="请输入术语名称"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">英文名称</label>
                                <input
                                    type="text"
                                    value={editingTerm.englishTerm || ''}
                                    onChange={(e) => setEditingTerm({ ...editingTerm, englishTerm: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="请输入英文名称"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">分类</label>
                                <select
                                    value={editingTerm.category || '业务对象'}
                                    onChange={(e) => setEditingTerm({ ...editingTerm, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                >
                                    {categories.filter(c => c !== 'all').map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">定义 *</label>
                                <textarea
                                    value={editingTerm.definition || ''}
                                    onChange={(e) => setEditingTerm({ ...editingTerm, definition: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="请输入术语定义"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">同义词</label>
                                <div className="text-xs text-slate-500 mb-2">输入后按回车或逗号添加</div>
                                <TagInput
                                    value={editingTerm.synonyms || []}
                                    onChange={(val) => setEditingTerm({ ...editingTerm, synonyms: val })}
                                    placeholder="输入同义词..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">相关术语</label>
                                <div className="text-xs text-slate-500 mb-2">输入后按回车或逗号添加</div>
                                <TagInput
                                    value={editingTerm.relatedTerms || []}
                                    onChange={(val) => setEditingTerm({ ...editingTerm, relatedTerms: val })}
                                    placeholder="输入相关术语..."
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTerm(null);
                                    setIsCreating(false);
                                }}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md"
                            >
                                取消
                            </button>
                            <button onClick={() => handleSave(editingTerm)} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TermManagementView;
