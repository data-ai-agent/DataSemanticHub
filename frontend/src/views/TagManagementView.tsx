import { useState, useMemo } from 'react';
import { Tag, Plus, Search, Edit, Trash2, X, List, Folder, Upload, Download, Settings, Eye, EyeOff, Link, MoreHorizontal, CheckCircle, XCircle, AlertTriangle, ChevronRight, ChevronDown, Check, GripVertical, User } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

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
    const toast = useToast();
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

    const [categories, setCategories] = useState<TagCategory[]>([
        { id: 'CAT_001', name: '资产分类', code: 'asset_category', scope: ['table', 'business_object'], multiSelectAllowed: false },
        { id: 'CAT_002', name: '业务场景', code: 'business_scenario', scope: ['table', 'business_object', 'term'], multiSelectAllowed: true },
        { id: 'CAT_003', name: '数据分类', code: 'data_category', scope: ['table', 'field'], multiSelectAllowed: true },
        { id: 'CAT_004', name: '技术标签', code: 'tech_tag', scope: ['table', 'field'], multiSelectAllowed: true },
        { id: 'CAT_005', name: '质量标签', code: 'quality_tag', scope: ['field'], multiSelectAllowed: true }
    ]);

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

    // Tree View State
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    const [activeTreeNodeId, setActiveTreeNodeId] = useState<string | null>(null);

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
            toast.error(`无法删除：该标签正在被 ${tag.usage} 个对象使用。请先解除绑定或迁移引用。`);
            return;
        }
        const hasChildren = tags.some(t => t.parentId === tag.id);
        if (hasChildren) {
            toast.error('无法删除：该标签存在子标签。请先删除或移动子标签。');
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
            toast.error('部分标签无法删除：存在使用中或包含子标签的项。');
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
                <TreeSplitView />
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

        const selectedCatObj = categories.find(c => c.name === editingTag.category);
        const codeConflict = editingTag.code ? tags.some(t => t.code === editingTag.code && t.id !== editingTag.id) : false;
        const isValid = editingTag.name && editingTag.code && !codeConflict;

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
                                        className={`w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${codeConflict ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                        placeholder="lower_snake_case"
                                    />
                                    <div className="flex justify-between mt-1">
                                        <p className={`text-xs ${codeConflict ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                                            {codeConflict ? '该编码已被占用，请更换' : '使用 lower_snake_case 格式，全局唯一'}
                                        </p>
                                        {!codeConflict && editingTag.code && (
                                            <span className="text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircle size={10} />
                                                可用
                                            </span>
                                        )}
                                    </div>
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
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-700">适用范围</h4>
                                {selectedCatObj && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${selectedCatObj.multiSelectAllowed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {selectedCatObj.multiSelectAllowed ? '允许同对象多选' : '仅限单选'}
                                    </span>
                                )}
                            </div>

                            {selectedCatObj && (
                                <div className="mb-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                    <div className="flex gap-2 items-start">
                                        <AlertTriangle size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                                        <div className="text-xs text-indigo-800">
                                            <span className="font-semibold">分类约束：</span>
                                            当前分类仅支持应用于：{selectedCatObj.scope.map(s => scopeOptions.find(o => o.value === s)?.label).join('、')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {scopeOptions.map(opt => {
                                    const isAllowed = !selectedCatObj || selectedCatObj.scope.includes(opt.value);
                                    return (
                                        <label
                                            key={opt.value}
                                            className={`flex items-center gap-2 p-3 border rounded-lg transition-colors cursor-pointer ${isAllowed
                                                ? 'border-slate-200 hover:bg-slate-50'
                                                : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={editingTag.scope?.includes(opt.value) || false}
                                                disabled={!isAllowed}
                                                onChange={e => {
                                                    if (!isAllowed) return;
                                                    const newScope = e.target.checked
                                                        ? [...(editingTag.scope || []), opt.value]
                                                        : (editingTag.scope || []).filter(s => s !== opt.value);
                                                    setEditingTag({ ...editingTag, scope: newScope });
                                                }}
                                                className="rounded border-slate-300"
                                            />
                                            <span className="text-sm text-slate-700">{opt.label}</span>
                                        </label>
                                    );
                                })}
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

                        {/* Governance (New) */}
                        <div>
                            <h4 className="font-bold text-slate-700 mb-4">治理属性</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        负责人
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={editingTag.owner || ''}
                                            onChange={e => setEditingTag({ ...editingTag, owner: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="输入负责人"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        权限可见性
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="public">全员可见</option>
                                        <option value="team">团队可见</option>
                                        <option value="private">仅管理员可见</option>
                                    </select>
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
                            disabled={!isValid}
                            className={`px-4 py-2 text-sm text-white rounded-lg shadow-sm transition-colors ${isValid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'
                                }`}
                        >
                            保存
                        </button>
                    </div>
                </div >
            </div >
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
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-slate-700">引用列表</h4>
                                    <button className="text-xs text-indigo-600 hover:underline">查看全部</button>
                                </div>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-xs font-medium text-slate-500">对象名称</th>
                                                <th className="px-4 py-2 text-xs font-medium text-slate-500">类型</th>
                                                <th className="px-4 py-2 text-xs font-medium text-slate-500">绑定时间</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr>
                                                <td className="px-4 py-2 text-slate-700">user_profile</td>
                                                <td className="px-4 py-2"><span className="bg-blue-50 text-blue-600 text-xs px-1 rounded">table</span></td>
                                                <td className="px-4 py-2 text-slate-500 text-xs">2024-05-20</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2 text-slate-700">age</td>
                                                <td className="px-4 py-2"><span className="bg-green-50 text-green-600 text-xs px-1 rounded">field</span></td>
                                                <td className="px-4 py-2 text-slate-500 text-xs">2024-05-21</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2 text-slate-700">每日活跃用户</td>
                                                <td className="px-4 py-2"><span className="bg-orange-50 text-orange-600 text-xs px-1 rounded">metric</span></td>
                                                <td className="px-4 py-2 text-slate-500 text-xs">2024-05-22</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'rules' && (
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-6 rounded-lg text-center border border-dashed border-slate-300">
                                    <p className="text-sm text-slate-600 font-medium">暂无自动打标规则</p>
                                    <p className="text-xs text-slate-400 mt-1">配置规则后，系统将自动为匹配的数据资产打上此标签</p>
                                    <button className="mt-3 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium transition-colors shadow-sm">+ 添加规则</button>
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'audit' && (
                            <div className="space-y-4 p-2">
                                <div className="border-l-2 border-slate-200 pl-4 space-y-6">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-4 ring-white"></div>
                                        <p className="text-sm font-medium text-slate-800">标签更新</p>
                                        <p className="text-xs text-slate-500 mt-0.5">管理员 于 2024-05-20 14:30 更新了基本信息与描述</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-slate-300 rounded-full ring-4 ring-white"></div>
                                        <p className="text-sm font-medium text-slate-800">标签创建</p>
                                        <p className="text-xs text-slate-500 mt-0.5">管理员 于 2024-01-10 09:00 创建了标签</p>
                                    </div>
                                </div>
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

        const mockUsageList = [
            { id: 'U001', name: 'user_profile_v2', type: 'table', system: '数仓-ODS', owner: '张三', time: '2024-05-20 10:30' },
            { id: 'U002', name: 'mobile_encrypted', type: 'field', system: '数仓-DWD', owner: '李四', time: '2024-05-21 14:20' },
            { id: 'U003', name: '高价值客户', type: 'business_object', system: '指标平台', owner: '王五', time: '2024-05-22 09:15' },
            { id: 'U004', name: 'order_amount', type: 'field', system: '数仓-ADS', owner: '赵六', time: '2024-05-23 16:45' },
        ];

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
                <div className="w-[800px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Link className="text-indigo-600" size={20} />
                                引用明细
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                标签 <span className="font-medium text-slate-800">{viewingTag.name}</span> 正被 {viewingTag.usage} 个对象使用
                            </p>
                        </div>
                        <button
                            onClick={() => setShowUsageDrawer(false)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
                        <select className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-indigo-500">
                            <option>全部对象类型</option>
                            <option>数据表</option>
                            <option>字段</option>
                            <option>业务对象</option>
                        </select>
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                placeholder="搜索对象名称..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-600">对象名称</th>
                                    <th className="px-6 py-3 font-medium text-slate-600">类型</th>
                                    <th className="px-6 py-3 font-medium text-slate-600">所属系统</th>
                                    <th className="px-6 py-3 font-medium text-slate-600">绑定人</th>
                                    <th className="px-6 py-3 font-medium text-slate-600">绑定时间</th>
                                    <th className="px-6 py-3 font-medium text-slate-600 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mockUsageList.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-700">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-xs ${item.type === 'table' ? 'bg-blue-50 text-blue-600' :
                                                item.type === 'field' ? 'bg-green-50 text-green-600' :
                                                    'bg-orange-50 text-orange-600'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{item.system}</td>
                                        <td className="px-6 py-4 text-slate-600">{item.owner}</td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">{item.time}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-red-600 text-xs border border-slate-200 hover:border-red-200 px-2 py-1 rounded">解绑</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                        <button
                            className="px-4 py-2 text-sm border border-slate-300 text-slate-600 hover:bg-white rounded-lg"
                        >
                            批量解绑
                        </button>
                        <button
                            onClick={() => setShowUsageDrawer(false)}
                            className="px-4 py-2 text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Category Management Modal
    function CategoryManagementModal() {
        if (!showCategoryManagement) return null;

        const [draftCat, setDraftCat] = useState<Partial<TagCategory>>({
            name: '', code: '', scope: ['table'], multiSelectAllowed: true
        });
        const [mode, setMode] = useState<'create' | 'edit'>('create');
        const [editingId, setEditingId] = useState<string | null>(null);

        const handleEdit = (cat: TagCategory) => {
            setMode('edit');
            setEditingId(cat.id);
            setDraftCat({ ...cat });
        };

        const handleCancelEdit = () => {
            setMode('create');
            setEditingId(null);
            setDraftCat({ name: '', code: '', scope: ['table'], multiSelectAllowed: true });
        };

        const handleSubmit = () => {
            if (!draftCat.name || !draftCat.code) return;

            if (mode === 'create') {
                const newCat: TagCategory = {
                    id: `CAT_${Date.now()}`,
                    name: draftCat.name!,
                    code: draftCat.code!,
                    scope: draftCat.scope || [],
                    multiSelectAllowed: draftCat.multiSelectAllowed ?? true
                };
                setCategories([...categories, newCat]);
                toast.success('分类创建成功');
            } else {
                setCategories(categories.map(c => c.id === editingId ? { ...c, ...draftCat } as TagCategory : c));
                toast.success('分类更新成功');
            }
            handleCancelEdit();
        };

        const handleDeleteCat = (id: string) => {
            const inUse = tags.some(t => t.category === categories.find(c => c.id === id)?.name);
            if (inUse) {
                toast.error('无法删除：该分类下存在标签');
                return;
            }
            if (confirm('确定删除该分类吗？')) {
                setCategories(categories.filter(c => c.id !== id));
                if (editingId === id) handleCancelEdit();
            }
        };

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-[900px] h-[600px] flex overflow-hidden animate-scale-up">
                    {/* Left: List */}
                    <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
                        <div className="p-4 border-b border-slate-200 bg-white">
                            <h3 className="font-bold text-slate-800">分类列表</h3>
                            <button onClick={handleCancelEdit} className="mt-3 w-full py-2 text-xs bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1 font-medium text-slate-700 shadow-sm">
                                <Plus size={14} /> 新建分类
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    onClick={() => handleEdit(cat)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all flex justify-between items-start group border ${editingId === cat.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200'}`}
                                >
                                    <div>
                                        <div className={`font-medium ${editingId === cat.id ? 'text-indigo-700' : 'text-slate-700'}`}>{cat.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{cat.code}</div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="删除分类"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="flex-1 flex flex-col bg-white">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Settings size={18} className="text-indigo-600" />
                                <h3 className="font-bold text-slate-800">{mode === 'create' ? '新建分类' : '编辑分类'}</h3>
                            </div>
                            <button onClick={() => setShowCategoryManagement(false)} className="p-1 rounded hover:bg-slate-100"><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            {/* Name & Code */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">分类名称 <span className="text-red-500">*</span></label>
                                    <input
                                        value={draftCat.name}
                                        onChange={e => setDraftCat({ ...draftCat, name: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                        placeholder="例如：业务场景"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">分类编码 <span className="text-red-500">*</span></label>
                                    <input
                                        value={draftCat.code}
                                        onChange={e => setDraftCat({ ...draftCat, code: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm transition-shadow"
                                        placeholder="例如：business_scenario"
                                    />
                                </div>
                            </div>

                            {/* Scope */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-3 block">允许适用对象范围</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {scopeOptions.map(opt => (
                                        <label key={opt.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={draftCat.scope?.includes(opt.value)}
                                                onChange={e => {
                                                    const current = draftCat.scope || [];
                                                    const next = e.target.checked ? [...current, opt.value] : current.filter(x => x !== opt.value);
                                                    setDraftCat({ ...draftCat, scope: next });
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-700">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Config */}
                            <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">高级配置</h4>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={draftCat.multiSelectAllowed}
                                        onChange={e => setDraftCat({ ...draftCat, multiSelectAllowed: e.target.checked })}
                                        className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-slate-700 select-none">允许多选 (Multi-select)</span>
                                        <p className="text-xs text-slate-500 mt-1">启用后，一个数据对象（如一张表）可以同时拥有该分类下的多个标签。</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                            {mode === 'edit' && (
                                <button onClick={handleCancelEdit} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">取消编辑</button>
                            )}
                            <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors font-medium">
                                {mode === 'create' ? '立即创建' : '保存修改'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Tree Split View
    function TreeSplitView() {
        const renderTreeNode = (node: any, level = 0) => {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = expandedKeys.has(node.id);
            const isActive = activeTreeNodeId === node.id;

            const handleToggle = (e: React.MouseEvent) => {
                e.stopPropagation();
                const newKeys = new Set(expandedKeys);
                if (isExpanded) newKeys.delete(node.id);
                else newKeys.add(node.id);
                setExpandedKeys(newKeys);
            };

            return (
                <div key={node.id}>
                    <div
                        className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100 text-slate-700'}`}
                        style={{ paddingLeft: level * 16 + 8 }}
                        onClick={() => setActiveTreeNodeId(node.id)}
                    >
                        <button
                            onClick={handleToggle}
                            className={`p-0.5 rounded hover:bg-black/5 ${hasChildren ? 'visible' : 'invisible'}`}
                        >
                            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                        </button>
                        <Folder size={14} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
                        <span className="text-sm truncate">{node.name}</span>
                        {node.usage > 0 && <span className="text-xs text-slate-400 ml-auto bg-slate-100 px-1.5 rounded-full">{node.usage}</span>}
                    </div>
                    {hasChildren && isExpanded && (
                        <div>
                            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        };

        // Filter list based on active node
        // Logic: if active node selected, show tags with parentId === activeNodeId (direct children) OR tags with this tag in path?
        // Usually Tree View shows content of the folder. 
        // Let's filter tags that have `parentId === activeTreeNodeId`.
        const treeFilteredTags = activeTreeNodeId
            ? filteredTags.filter(t => t.parentId === activeTreeNodeId)
            : filteredTags.filter(t => !t.parentId); // Root level if no selection? Or all? 
        // If nothing selected, maybe show Root Level tags.

        return (
            <div className="flex h-[calc(100vh-240px)] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
                {/* Left Tree */}
                <div className="w-[280px] border-r border-slate-200 flex flex-col bg-slate-50">
                    <div className="p-3 border-b border-slate-200 bg-white">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                placeholder="过滤节点..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <div
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer mb-2 ${activeTreeNodeId === null ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-100 text-slate-600'}`}
                            onClick={() => setActiveTreeNodeId(null)}
                        >
                            <List size={14} />
                            <span className="text-sm">全部根标签</span>
                        </div>
                        {tagTree.map(node => renderTreeNode(node))}
                    </div>
                </div>

                {/* Right List - Reusing Table Logic somewhat simplified */}
                <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800">
                                {activeTreeNodeId ? tags.find(t => t.id === activeTreeNodeId)?.name : '根标签'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">包含 {treeFilteredTags.length} 个子标签</p>
                        </div>
                        <button onClick={handleCreateTag} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                            <Plus size={14} /> 在此新建
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-slate-600 font-medium bg-slate-50">标签名称</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium bg-slate-50">编码</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium bg-slate-50">分类</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium bg-slate-50">状态</th>
                                    <th className="px-6 py-3 text-right text-slate-600 font-medium bg-slate-50">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {treeFilteredTags.length > 0 ? treeFilteredTags.map(tag => (
                                    <tr key={tag.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                <span className="font-medium text-slate-700">{tag.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs text-slate-600">{tag.code}</td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{tag.category}</span>
                                        </td>
                                        <td className="px-6 py-3"><StatusBadge status={tag.status} /></td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => handleEditTag(tag)} className="text-indigo-600 hover:text-indigo-800 mr-3">编辑</button>
                                            <button onClick={() => handleDelete(tag)} className="text-red-600 hover:text-red-800">删除</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            暂无子标签
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
            {CategoryManagementModal()}
        </>
    );
};

export default TagManagementView;
