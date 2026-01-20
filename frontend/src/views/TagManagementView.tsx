// ==========================================
// Tag Management View
// ==========================================

import React, { useState, useMemo } from 'react';
import { Tag, Plus, Search, Edit, Trash2, X, List, Folder } from 'lucide-react';

interface Tag {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    color: string;
    parentId: string | null;
    usage: number;
    status: string;
    createTime: string;
    updateTime: string;
    creator: string;
}

const TagManagementView: React.FC = () => {
    const [tags, setTags] = useState<Tag[]>([
        {
            id: 'TAG_001',
            name: '核心资产',
            code: 'core_asset',
            category: '资产分类',
            description: '企业核心数据资产标签',
            color: '#3B82F6',
            parentId: null,
            usage: 42,
            status: '已启用',
            createTime: '2024-01-10',
            updateTime: '2024-05-20',
            creator: '管理员'
        },
        {
            id: 'TAG_002',
            name: '业务对象',
            code: 'business_object',
            category: '资产分类',
            description: '业务对象相关标签',
            color: '#8B5CF6',
            parentId: null,
            usage: 35,
            status: '已启用',
            createTime: '2024-01-15',
            updateTime: '2024-05-18',
            creator: '管理员'
        },
        {
            id: 'TAG_003',
            name: '出生一件事',
            code: 'birth_event',
            category: '业务场景',
            description: '出生一件事相关业务标签',
            color: '#10B981',
            parentId: null,
            usage: 28,
            status: '已启用',
            createTime: '2024-02-01',
            updateTime: '2024-05-15',
            creator: '业务团队'
        },
        {
            id: 'TAG_004',
            name: '人口数据',
            code: 'population_data',
            category: '数据分类',
            description: '人口相关数据标签',
            color: '#F59E0B',
            parentId: 'TAG_002',
            usage: 15,
            status: '已启用',
            createTime: '2024-02-05',
            updateTime: '2024-05-10',
            creator: '数据团队'
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTag, setEditingTag] = useState<Partial<Tag> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    const categories = ['all', '资产分类', '业务场景', '数据分类', '技术标签', '质量标签'];

    const filteredTags = tags.filter(tag => {
        const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tag.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tag.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // 构建标签树
    const tagTree = useMemo(() => {
        const rootTags = tags.filter(t => !t.parentId);
        return rootTags.map(root => ({
            ...root,
            children: tags.filter(t => t.parentId === root.id)
        }));
    }, [tags]);

    const handleSave = (tagData: Partial<Tag>) => {
        if (isCreating) {
            setTags([...tags, {
                ...tagData,
                id: `TAG_${Date.now()}`,
                usage: 0,
                createTime: new Date().toISOString().split('T')[0],
                updateTime: new Date().toISOString().split('T')[0],
                creator: '当前用户',
                status: '已启用',
                parentId: null
            } as Tag]);
            setIsCreating(false);
        } else {
            setTags(tags.map(t => t.id === editingTag!.id ? {
                ...t,
                ...tagData,
                updateTime: new Date().toISOString().split('T')[0]
            } : t));
        }
        setShowEditModal(false);
        setEditingTag(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('确定要删除该标签吗？')) {
            setTags(tags.filter(t => t.id !== id));
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            {/* 头部调整 padding */}
            <div className="flex justify-between items-center shrink-0 px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Tag size={24} className="text-indigo-600" />
                        标签管理
                    </h2>
                    <p className="text-slate-500 mt-1">统一管理数据资产标签，支持标签分类和层级关系</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('tree')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'tree'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Folder size={16} />
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setIsCreating(true);
                            setEditingTag({
                                name: '',
                                code: '',
                                category: '资产分类',
                                description: '',
                                color: '#3B82F6',
                                parentId: null
                            });
                            setShowEditModal(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建标签
                    </button>
                </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 shrink-0 mx-1">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索标签名称、编码或描述..."
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

            {/* 标签列表/树 */}
            <div className="flex-1 overflow-auto px-1">
                {viewMode === 'list' ? (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">标签</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">编码</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">分类</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">使用</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">状态</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTags.map(tag => (
                                    <tr
                                        key={tag.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedTag(tag)}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: tag.color }}
                                                ></div>
                                                <span className="font-medium text-slate-800">{tag.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600 font-mono">{tag.code}</td>
                                        <td className="py-4 px-4">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                                                {tag.category}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600">{tag.usage}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${tag.status === '已启用' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {tag.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingTag(tag);
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
                                                        handleDelete(tag.id);
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
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tagTree.map(tagNode => (
                            <div key={tagNode.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: tagNode.color }}
                                    ></div>
                                    <span className="font-bold text-slate-800">{tagNode.name}</span>
                                </div>
                                <div className="text-xs text-slate-500 mb-2">{tagNode.description}</div>
                                <div className="text-xs text-slate-400">
                                    使用: {tagNode.usage} | 编码: {tagNode.code}
                                </div>
                                {tagNode.children && tagNode.children.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="text-xs font-medium text-slate-500 mb-2">子标签</div>
                                        {tagNode.children.map(child => (
                                            <div key={child.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-50">
                                                <div className="w-3 h-3 rounded" style={{ backgroundColor: child.color }}></div>
                                                <span className="text-sm text-slate-700">{child.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 详情模态框 */}
            {selectedTag && !showEditModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedTag.color }}></div>
                                <h3 className="font-bold text-lg text-slate-800">{selectedTag.name}</h3>
                            </div>
                            <button onClick={() => setSelectedTag(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">编码:</span>
                                    <span className="ml-2 text-slate-800 font-mono">{selectedTag.code}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">分类:</span>
                                    <span className="ml-2 text-slate-800">{selectedTag.category}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">使用次数:</span>
                                    <span className="ml-2 text-slate-800">{selectedTag.usage}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">状态:</span>
                                    <span className="ml-2 text-slate-800">{selectedTag.status}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-slate-500 text-sm">描述:</span>
                                <p className="text-slate-800 mt-1 text-sm">{selectedTag.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">创建人:</span>
                                    <span className="ml-2 text-slate-800">{selectedTag.creator}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">创建时间:</span>
                                    <span className="ml-2 text-slate-800">{selectedTag.createTime}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setSelectedTag(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md">
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 编辑/创建模态框 */}
            {showEditModal && editingTag && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">{isCreating ? '新建标签' : '编辑标签'}</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTag(null);
                                    setIsCreating(false);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">标签名称 *</label>
                                <input
                                    type="text"
                                    value={editingTag.name || ''}
                                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="请输入标签名称"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">编码</label>
                                <input
                                    type="text"
                                    value={editingTag.code || ''}
                                    onChange={(e) => setEditingTag({ ...editingTag, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="请输入编码"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">分类</label>
                                <select
                                    value={editingTag.category || '资产分类'}
                                    onChange={(e) => setEditingTag({ ...editingTag, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                >
                                    {categories.filter(c => c !== 'all').map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">描述</label>
                                <textarea
                                    value={editingTag.description || ''}
                                    onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="请输入描述"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">颜色</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={editingTag.color || '#3B82F6'}
                                        onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                                        className="w-16 h-10 rounded border border-slate-200"
                                    />
                                    <input
                                        type="text"
                                        value={editingTag.color || '#3B82F6'}
                                        onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder="#3B82F6"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingTag(null);
                                    setIsCreating(false);
                                }}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md"
                            >
                                取消
                            </button>
                            <button onClick={() => handleSave(editingTag)} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagManagementView;
