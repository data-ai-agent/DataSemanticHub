// ==========================================
// Term Management View
// ==========================================

import React, { useState } from 'react';
import { Book, Plus, Search, Activity, Edit, Trash2, X } from 'lucide-react';

interface Term {
    id: string;
    term: string;
    englishTerm: string;
    category: string;
    definition: string;
    synonyms: string[];
    relatedTerms: string[];
    usage: number;
    status: string;
    createTime: string;
    updateTime: string;
    creator: string;
    tags: string[];
}

const TermManagementView: React.FC = () => {
    const [terms, setTerms] = useState<Term[]>([
        {
            id: 'TERM_001',
            term: '自然人',
            englishTerm: 'Natural Person',
            category: '业务对象',
            definition: '具有民事权利能力和民事行为能力，依法独立享有民事权利和承担民事义务的个人',
            synonyms: ['个人', '公民'],
            relatedTerms: ['法人', '组织'],
            usage: 45,
            status: '已发布',
            createTime: '2024-01-15',
            updateTime: '2024-05-20',
            creator: '张业务',
            tags: ['核心术语', '法律术语']
        },
        {
            id: 'TERM_002',
            term: '出生医学证明',
            englishTerm: 'Birth Medical Certificate',
            category: '证照',
            definition: '依据《中华人民共和国母婴保健法》出具的，证明婴儿出生状态、血亲关系以及申报国籍、户籍取得公民身份的法定医学证明',
            synonyms: ['出生证明', '出生证'],
            relatedTerms: ['身份证', '户口本'],
            usage: 28,
            status: '已发布',
            createTime: '2024-02-10',
            updateTime: '2024-05-18',
            creator: '李法务',
            tags: ['证照', '法定文件']
        },
        {
            id: 'TERM_003',
            term: '语义角色',
            englishTerm: 'Semantic Role',
            category: '技术术语',
            definition: '数据字段在业务语义中的角色定位，如标识、属性、关联、状态、行为线索等',
            synonyms: ['字段语义', '语义类型'],
            relatedTerms: ['语义理解', '数据分类'],
            usage: 156,
            status: '已发布',
            createTime: '2024-03-05',
            updateTime: '2024-05-21',
            creator: '王技术',
            tags: ['技术术语', '数据治理']
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTerm, setEditingTerm] = useState<Partial<Term> | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const categories = ['all', '业务对象', '证照', '技术术语', '流程术语', '数据术语'];

    const filteredTerms = terms.filter(term => {
        const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            term.englishTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
            term.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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
                                        onClick={() => setSelectedTerm(term)}
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
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${term.status === '已发布' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
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

            {/* 详情模态框 */}
            {selectedTerm && !showEditModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">{selectedTerm.term}</h3>
                            <button onClick={() => setSelectedTerm(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">英文名称</div>
                                    <div className="text-sm font-medium text-slate-700">{selectedTerm.englishTerm}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">分类</div>
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                                        {selectedTerm.category}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-xs text-slate-500 mb-1">定义</div>
                                    <div className="text-sm text-slate-700 leading-relaxed">{selectedTerm.definition}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">同义词</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedTerm.synonyms.map((syn) => (
                                            <span key={syn} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                {syn}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">相关术语</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedTerm.relatedTerms.map((rel) => (
                                            <span key={rel} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                                {rel}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">使用次数</div>
                                    <div className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Activity size={14} />
                                        {selectedTerm.usage}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">状态</div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${selectedTerm.status === '已发布' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {selectedTerm.status}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">创建人</div>
                                    <div className="text-sm text-slate-700">{selectedTerm.creator}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">更新时间</div>
                                    <div className="text-sm text-slate-700">{selectedTerm.updateTime}</div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setSelectedTerm(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md">
                                关闭
                            </button>
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
                                <label className="text-sm font-medium text-slate-700 mb-1 block">同义词（用逗号分隔）</label>
                                <input
                                    type="text"
                                    value={Array.isArray(editingTerm.synonyms) ? editingTerm.synonyms.join(', ') : ''}
                                    onChange={(e) => setEditingTerm({
                                        ...editingTerm,
                                        synonyms: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                    })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="例如: 同义词1, 同义词2"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">相关术语（用逗号分隔）</label>
                                <input
                                    type="text"
                                    value={Array.isArray(editingTerm.relatedTerms) ? editingTerm.relatedTerms.join(', ') : ''}
                                    onChange={(e) => setEditingTerm({
                                        ...editingTerm,
                                        relatedTerms: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                    })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="例如: 相关术语1, 相关术语2"
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
