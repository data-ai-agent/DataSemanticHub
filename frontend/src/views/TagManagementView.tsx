import { useState, useMemo } from 'react';
import { Tag, Plus, Search, Edit, Trash2, X, List, Folder, Upload, Download, Settings, Eye, EyeOff, Link, MoreHorizontal, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Extended Tag Interface
interface TagItem {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    color: string;
    parentId: string | null;
    scope: string[]; // 适用范围: table, field, term, business_object, metric
    usage: number;
    status: 'enabled' | 'disabled' | 'deprecated';
    createTime: string;
    updateTime: string;
    creator: string;
    owner?: string;
}

interface TagCategory {
    id: string;
    name: string;
    code: string;
    scope: string[];
    multiSelectAllowed: boolean;
}

const TagManagementView = () => {
    const [tags, setTags] = useState<TagItem[]>([
        {
            id: 'TAG_001',
            name: '核心资产',
            code: 'core_asset',
            category: '资产分类',
            description: '企业核心数据资产标签',
            color: '#3B82F6',
            parentId: null,
            scope: ['table', 'business_object'],
            usage: 42,
            status: 'enabled',
            createTime: '2024-01-10',
            updateTime: '2024-05-20',
            creator: '管理员',
            owner: '张三'
        },
        {
            id: 'TAG_002',
            name: '业务场景',
            code: 'business_scenario',
            category: '业务场景',
            description: '业务场景分类标签',
            color: '#8B5CF6',
            parentId: null,
            scope: ['table', 'business_object', 'term'],
            usage: 35,
            status: 'enabled',
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
            parentId: 'TAG_002',
            scope: ['table', 'business_object'],
            usage: 28,
            status: 'enabled',
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
            parentId: null,
            scope: ['table', 'field'],
            usage: 15,
            status: 'enabled',
            createTime: '2024-02-05',
            updateTime: '2024-05-10',
            creator: '数据团队'
        },
        {
            id: 'TAG_005',
            name: '已废弃标签',
            code: 'deprecated_tag',
            category: '技术标签',
            description: '此标签已废弃',
            color: '#94A3B8',
            parentId: null,
            scope: ['table'],
            usage: 0,
            status: 'deprecated',
            createTime: '2023-12-01',
            updateTime: '2024-04-15',
            creator: '系统'
        }
    ]);

    const categories: TagCategory[] = [
        { id: 'CAT_001', name: '资产分类', code: 'asset_category', scope: ['table', 'business_object'], multiSelectAllowed: false },
        { id: 'CAT_002', name: '业务场景', code: 'business_scenario', scope: ['table', 'business_object', 'term'], multiSelectAllowed: true },
        { id: 'CAT_003', name: '数据分类', code: 'data_category', scope: ['table', 'field'], multiSelectAllowed: true },
        { id: 'CAT_004', name: '技术标签', code: 'tech_tag', scope: ['table', 'field'], multiSelectAllowed: true },
        { id: 'CAT_005', name: '质量标签', code: 'quality_tag', scope: ['field'], multiSelectAllowed: true }
    ];

    const scopeOptions = [
        { value: 'table', label: '表' },
        { value: 'field', label: '字段' },
        { value: 'term', label: '术语' },
        { value: 'business_object', label: '业务对象' },
        { value: 'metric', label: '指标' }
    ];

    // UI State
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
    const [showDisabled, setShowDisabled] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedScope, setSelectedScope] = useState<string>('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Modal State
    const [showUpsertDrawer, setShowUpsertDrawer] = useState(false);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);
    const [showUsageDrawer, setShowUsageDrawer] = useState(false);
    const [showCategoryManagement, setShowCategoryManagement] = useState(false);
    const [editingTag, setEditingTag] = useState<Partial<TagItem> | null>(null);
    const [viewingTag, setViewingTag] = useState<TagItem | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'references' | 'rules' | 'audit'>('overview');

    // Filtered Tags
    const filteredTags = useMemo(() => {
        return tags.filter(tag => {
            const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tag.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tag.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;
            const matchesStatus = selectedStatus === 'all' || tag.status === selectedStatus;
            const matchesScope = selectedScope === 'all' || tag.scope.includes(selectedScope);
            const matchesDisabled = showDisabled || tag.status !== 'disabled';

            return matchesSearch && matchesCategory && matchesStatus && matchesScope && matchesDisabled;
        });
    }, [tags, searchTerm, selectedCategory, selectedStatus, selectedScope, showDisabled]);

    // Build Tag Tree
    const tagTree = useMemo(() => {
        const buildTree = (parentId: string | null): any[] => {
            return filteredTags
                .filter(t => t.parentId === parentId)
                .map(tag => ({
                    ...tag,
                    children: buildTree(tag.id)
                }));
        };
        return buildTree(null);
    }, [filteredTags]);

    // Get tag path
    const getTagPath = (tagId: string): string => {
        const path: string[] = [];
        let current: TagItem | undefined = tags.find(t => t.id === tagId);
        while (current) {
            path.unshift(current.name);
            current = current.parentId ? tags.find(t => t.id === current!.parentId) : undefined;
        }
        return path.join(' / ');
    };

    // Handlers
    const handleCreateTag = () => {
        setIsCreating(true);
        setEditingTag({
            name: '',
            code: '',
            category: categories[0].name,
            description: '',
            color: '#3B82F6',
            parentId: null,
            scope: ['table'],
            status: 'enabled'
        });
        setShowUpsertDrawer(true);
    };

    const handleEditTag = (tag: TagItem) => {
        setIsCreating(false);
        setEditingTag(tag);
        setShowUpsertDrawer(true);
    };

    const handleSaveTag = () => {
        if (!editingTag) return;

        if (isCreating) {
            const newTag: TagItem = {
                ...editingTag as TagItem,
                id: `TAG_${Date.now()}`,
                usage: 0,
                createTime: new Date().toISOString().split('T')[0],
                updateTime: new Date().toISOString().split('T')[0],
                creator: '当前用户'
            };
            setTags([...tags, newTag]);
        } else {
            setTags(tags.map(t =>
                t.id === editingTag.id
                    ? { ...t, ...editingTag, updateTime: new Date().toISOString().split('T')[0] }
                    : t
            ));
        }
        setShowUpsertDrawer(false);
        setEditingTag(null);
    };

    const handleDelete = (tag: TagItem) => {
        // Check constraints
        if (tag.usage > 0) {
            alert(`无法删除：该标签正在被 ${tag.usage} 个对象使用。请先解除绑定或迁移引用。`);
            return;
        }
        const hasChildren = tags.some(t => t.parentId === tag.id);
        if (hasChildren) {
            alert('无法删除：该标签存在子标签。请先删除或移动子标签。');
            return;
        }
        if (confirm(`确定要永久删除标签"${tag.name}"吗？此操作不可恢复。`)) {
            setTags(tags.filter(t => t.id !== tag.id));
        }
    };

    const handleToggleStatus = (tag: TagItem) => {
        const newStatus = tag.status === 'enabled' ? 'disabled' : 'enabled';
        setTags(tags.map(t =>
            t.id === tag.id
                ? { ...t, status: newStatus, updateTime: new Date().toISOString().split('T')[0] }
                : t
        ));
    };

    const handleBatchDelete = () => {
        const canDelete = selectedTags.every(id => {
            const tag = tags.find(t => t.id === id);
            return tag && tag.usage === 0 && !tags.some(t => t.parentId === id);
        });

        if (!canDelete) {
            alert('部分标签无法删除：存在使用中或包含子标签的项。');
            return;
        }

        if (confirm(`确定要删除 ${selectedTags.length} 个标签吗？`)) {
            setTags(tags.filter(t => !selectedTags.includes(t.id)));
            setSelectedTags([]);
        }
    };

    const StatusBadge = ({ status }: { status: TagItem['status'] }) => {
        const config = {
            enabled: { color: 'bg-green-100 text-green-700', label: '已启用', icon: CheckCircle },
            disabled: { color: 'bg-slate-100 text-slate-600', label: '已禁用', icon: XCircle },
            deprecated: { color: 'bg-orange-100 text-orange-700', label: '已废弃', icon: AlertTriangle }
        };
        const { color, label, icon: Icon } = config[status];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
                <Icon size={12} />
                {label}
            </span>
        );
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Tag className="text-indigo-600" size={24} />
                        标签管理
                    </h2>
                    <p className="text-slate-500 mt-1">统一管理数据资产标签，支持分类与层级关系</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                        <Upload size={16} />
                        导入
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                        <Download size={16} />
                        导出
                    </button>
                    <button
                        onClick={() => setShowCategoryManagement(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Settings size={16} />
                        分类管理
                    </button>
                    <button
                        onClick={handleCreateTag}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                    >
                        <Plus size={16} />
                        新建标签
                    </button>
                </div>
            </div>

            {/* View Switch & Stats */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            <List size={16} />
                            列表视图
                        </button>
                        <button
                            onClick={() => setViewMode('tree')}
                            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            <Folder size={16} />
                            树形视图
                        </button>
                    </div>
                    <button
                        onClick={() => setShowDisabled(!showDisabled)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {showDisabled ? <Eye size={14} /> : <EyeOff size={14} />}
                        {showDisabled ? '隐藏' : '显示'}禁用
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">总数:</span>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-medium">
                        {filteredTags.length}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="搜索标签名称、编码或描述..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                        <option value="all">全部分类</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                        <option value="all">全部状态</option>
                        <option value="enabled">已启用</option>
                        <option value="disabled">已禁用</option>
                        <option value="deprecated">已废弃</option>
                    </select>
                    <select
                        value={selectedScope}
                        onChange={e => setSelectedScope(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                        <option value="all">全部适用范围</option>
                        {scopeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('all');
                            setSelectedStatus('all');
                            setSelectedScope('all');
                        }}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        重置
                    </button>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'list' ? (
                <ListViewContinued />
            ) : (
                <div className="text-center py-12 text-slate-400">
                    树形视图开发中...
                </div>
            )}
        </div>
    );

    // List View Component
    function ListViewContinued() {
        return (
            <>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">标签列表</h3>
                        <span className="text-xs text-slate-500">显示 {filteredTags.length} 个标签</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 w-10">
                                        <input type="checkbox" className="rounded border-slate-300" />
                                    </th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">标签</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">编码</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">分类</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">适用范围</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">使用</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">状态</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">更新时间</th>
                                    <th className="px-6 py-3 text-right text-slate-600 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTags.map(tag => (
                                    <tr key={tag.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300"
                                                checked={selectedTags.includes(tag.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTags([...selectedTags, tag.id]);
                                                    } else {
                                                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                <div>
                                                    <div className="font-medium text-slate-800">{tag.name}</div>
                                                    {tag.parentId && (
                                                        <div className="text-xs text-slate-500">{getTagPath(tag.id)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-600">{tag.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                                {tag.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {tag.scope.map(s => (
                                                    <span key={s} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                                        {scopeOptions.find(opt => opt.value === s)?.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setViewingTag(tag);
                                                    setShowUsageDrawer(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                            >
                                                <Link size={12} />
                                                {tag.usage}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={tag.status} />
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{tag.updateTime}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditTag(tag)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="编辑"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(tag)}
                                                    className="text-slate-600 hover:text-slate-800"
                                                    title={tag.status === 'enabled' ? '禁用' : '启用'}
                                                >
                                                    {tag.status === 'enabled' ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setViewingTag(tag);
                                                        setShowDetailDrawer(true);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                    title="详情"
                                                >
                                                    <MoreHorizontal size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tag)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="删除"
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

                    {filteredTags.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <Tag size={48} className="mx-auto mb-4 opacity-20" />
                            <p>没有匹配的标签</p>
                            <p className="text-xs mt-1">尝试调整筛选条件或创建新标签</p>
                        </div>
                    )}
                </div>

                {/* Batch Action Bar */}
                {selectedTags.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex items-center gap-4 animate-slide-up">
                        <span className="text-sm font-medium text-slate-700">已选 {selectedTags.length} 个标签</span>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                                批量启用
                            </button>
                            <button className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                                批量禁用
                            </button>
                            <button className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                                移动分类
                            </button>
                            <button className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                                导出
                            </button>
                            <button
                                onClick={handleBatchDelete}
                                className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                            >
                                批量删除
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Upsert Drawer
    function UpsertDrawer() {
        if (!showUpsertDrawer || !editingTag) return null;

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
                <div className="w-[600px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">
                            {isCreating ? '新建标签' : '编辑标签'}
                        </h3>
                        <button
                            onClick={() => {
                                setShowUpsertDrawer(false);
                                setEditingTag(null);
                            }}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h4 className="font-bold text-slate-700 mb-4">基本信息</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        标签名称 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingTag.name || ''}
                                        onChange={e => setEditingTag({ ...editingTag, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="请输入标签名称"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        标签编码 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingTag.code || ''}
                                        onChange={e => setEditingTag({ ...editingTag, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="lower_snake_case"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        使用 lower_snake_case 格式，全局唯一
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        分类 <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={editingTag.category || ''}
                                        onChange={e => setEditingTag({ ...editingTag, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Hierarchy */}
                        <div>
                            <h4 className="font-bold text-slate-700 mb-4">层级关系</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        父级标签
                                    </label>
                                    <select
                                        value={editingTag.parentId || ''}
                                        onChange={e => setEditingTag({ ...editingTag, parentId: e.target.value || null })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="">-- 无（一级标签） --</option>
                                        {tags
                                            .filter(t => t.id !== editingTag.id) // 不能选择自己
                                            .map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {getTagPath(t.id)}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                {editingTag.parentId && (
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-600 mb-1">完整路径预览:</p>
                                        <p className="text-sm font-medium text-slate-800">
                                            {getTagPath(editingTag.parentId!)} / {editingTag.name || '(未命名)'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scope */}
                        <div>
                            <h4 className="font-bold text-slate-700 mb-4">适用范围</h4>
                            <div className="space-y-2">
                                {scopeOptions.map(opt => (
                                    <label key={opt.value} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingTag.scope?.includes(opt.value) || false}
                                            onChange={e => {
                                                const newScope = e.target.checked
                                                    ? [...(editingTag.scope || []), opt.value]
                                                    : (editingTag.scope || []).filter(s => s !== opt.value);
                                                setEditingTag({ ...editingTag, scope: newScope });
                                            }}
                                            className="rounded border-slate-300"
                                        />
                                        <span className="text-sm text-slate-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                描述
                            </label>
                            <textarea
                                value={editingTag.description || ''}
                                onChange={e => setEditingTag({ ...editingTag, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="请输入标签描述"
                            />
                        </div>

                        {/* Visual */}
                        <div>
                            <h4 className="font-bold text-slate-700 mb-4">视觉设计</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        颜色
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={editingTag.color || '#3B82F6'}
                                            onChange={e => setEditingTag({ ...editingTag, color: e.target.value })}
                                            className="w-16 h-10 rounded border border-slate-300"
                                        />
                                        <input
                                            type="text"
                                            value={editingTag.color || '#3B82F6'}
                                            onChange={e => setEditingTag({ ...editingTag, color: e.target.value })}
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="#3B82F6"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                        <button
                            onClick={() => {
                                setShowUpsertDrawer(false);
                                setEditingTag(null);
                            }}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSaveTag}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Detail Drawer
    function DetailDrawer() {
        if (!showDetailDrawer || !viewingTag) return null;

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
                <div className="w-[720px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                    <div className="p-6 border-b border-slate-200">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: viewingTag.color }} />
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{viewingTag.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {getTagPath(viewingTag.id)} • {viewingTag.code}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailDrawer(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={viewingTag.status} />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-200 px-6 flex gap-1">
                        {(['overview', 'references', 'rules', 'audit'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveDetailTab(tab)}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === tab
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab === 'overview' && '概览'}
                                {tab === 'references' && '引用明细'}
                                {tab === 'rules' && '规则'}
                                {tab === 'audit' && '审计'}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeDetailTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <p className="text-xs text-slate-500 mb-1">分类</p>
                                        <p className="text-sm font-medium text-slate-700">{viewingTag.category}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <p className="text-xs text-slate-500 mb-1">使用次数</p>
                                        <p className="text-sm font-medium text-slate-700">{viewingTag.usage}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-2">适用范围</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {viewingTag.scope.map(s => (
                                            <span key={s} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                                                {scopeOptions.find(opt => opt.value === s)?.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-2">描述</h4>
                                    <p className="text-sm text-slate-600">{viewingTag.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">创建人：</span>
                                        <span className="text-slate-700 font-medium">{viewingTag.creator}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">创建时间：</span>
                                        <span className="text-slate-700 font-medium">{viewingTag.createTime}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">负责人：</span>
                                        <span className="text-slate-700 font-medium">{viewingTag.owner || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">更新时间：</span>
                                        <span className="text-slate-700 font-medium">{viewingTag.updateTime}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'references' && (
                            <div className="text-center py-12 text-slate-400">
                                <Link size={48} className="mx-auto mb-4 opacity-20" />
                                <p>引用明细功能开发中...</p>
                            </div>
                        )}

                        {activeDetailTab === 'rules' && (
                            <div className="text-center py-12 text-slate-400">
                                <Settings size={48} className="mx-auto mb-4 opacity-20" />
                                <p>自动打标规则功能开发中...</p>
                            </div>
                        )}

                        {activeDetailTab === 'audit' && (
                            <div className="text-center py-12 text-slate-400">
                                <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                                <p>审计日志功能开发中...</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-200 flex justify-between bg-slate-50">
                        <button
                            onClick={() => setShowDetailDrawer(false)}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
                        >
                            关闭
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditTag(viewingTag)}
                                className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
                            >
                                编辑
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Usage Drawer
    function UsageDrawer() {
        if (!showUsageDrawer || !viewingTag) return null;

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
                <div className="w-[600px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">引用明细</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                标签: {viewingTag.name} • 共{viewingTag.usage}处引用
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUsageDrawer(false)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="text-center py-12 text-slate-400">
                            <Link size={48} className="mx-auto mb-4 opacity-20" />
                            <p>引用明细加载中...</p>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200">
                        <button
                            onClick={() => setShowUsageDrawer(false)}
                            className="w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {ListViewContinued()}
            {UpsertDrawer()}
            {DetailDrawer()}
            {UsageDrawer()}
        </>
    );
};

export default TagManagementView;
