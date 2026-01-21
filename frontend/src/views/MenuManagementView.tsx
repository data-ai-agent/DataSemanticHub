import { useMemo, useState } from 'react';
import {
    LayoutGrid,
    Plus,
    Search,
    Filter,
    Settings,
    Pencil,
    Trash2,
    X,
    EyeOff,
    Eye,
    ChevronRight,
    ChevronDown,
    List,
    GitBranch,
    Link2,
    FileText,
    Folder,
    AlertTriangle,
    Shield,
    Copy,
    Check,
    RefreshCw
} from 'lucide-react';
import SyncMenuModal, { MenuDiff } from './components/SyncMenuModal';

type MenuStatus = '启用' | '隐藏' | '停用';
type MenuType = '目录' | '页面' | '操作' | '外链';
type ViewMode = 'tree' | 'list';

type MenuItem = {
    id: string;
    name: string;
    code: string;
    path: string;
    group: string;
    type: MenuType;
    visibility: '显示' | '隐藏';  // 可见性
    enablement: '启用' | '停用';  // 可用性
    status: MenuStatus;  // Keep for backward compatibility
    parentId: string | null;
    order: number;
    icon: string;
    permission: string;
    associatedRoles?: string[];  // Linked RBAC roles
    owner: string;
    builtIn: boolean;
    updatedAt: string;
    url?: string;  // For external links
    openMode?: '新窗口' | '当前';  // For external links
};

const groups = ['语义治理', '语义资产管理', '数据连接', '数据服务', '平台管理'];

const initialMenus: MenuItem[] = [
    {
        id: 'menu_dashboard',
        name: '语义治理总览',
        code: 'dashboard',
        path: '/dashboard',
        group: '语义治理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 1,
        icon: 'Activity',
        permission: 'view_dashboard',
        associatedRoles: ['平台管理员', '语义治理专员'],
        owner: '平台管理员',
        builtIn: true,
        updatedAt: '2024-06-25'
    },
    {
        id: 'menu_semantic_modeling',
        name: '语义建模',
        code: 'semantic_modeling',
        path: '/semantic/modeling',
        group: '语义治理',
        type: '目录',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 2,
        icon: 'Layout',
        permission: 'view_semantic_modeling',
        associatedRoles: ['平台管理员'],
        owner: '平台管理员',
        builtIn: true,
        updatedAt: '2024-06-23'
    },
    {
        id: 'menu_modeling_overview',
        name: '语义建模概览',
        code: 'modeling_overview',
        path: '/semantic/modeling/overview',
        group: '语义治理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: 'menu_semantic_modeling',
        order: 1,
        icon: 'Activity',
        permission: 'view_modeling_overview',
        associatedRoles: ['语义治理专员'],
        owner: '语义治理中心',
        builtIn: true,
        updatedAt: '2024-06-23'
    },
    {
        id: 'menu_business_object',
        name: '业务对象建模',
        code: 'td_modeling',
        path: '/semantic/modeling/bo',
        group: '语义治理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: 'menu_semantic_modeling',
        order: 2,
        icon: 'Layout',
        permission: 'manage_business_object',
        associatedRoles: ['语义治理专员'],
        owner: '语义治理中心',
        builtIn: false,
        updatedAt: '2024-06-20'
    },
    {
        id: 'menu_resource_network',
        name: '资源知识网络',
        code: 'resource_knowledge_network',
        path: '/assets/knowledge',
        group: '语义资产管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 1,
        icon: 'Network',
        permission: 'view_resource_network',
        owner: '语义治理中心',
        builtIn: false,
        updatedAt: '2024-06-18'
    },
    {
        id: 'menu_ask_data',
        name: '问数',
        code: 'ask_data',
        path: '/data/ask',
        group: '数据服务',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 1,
        icon: 'MessageCircle',
        permission: 'use_ask_data',
        owner: '数据服务运营',
        builtIn: false,
        updatedAt: '2024-06-19'
    },
    {
        id: 'menu_org_mgmt',
        name: '组织架构管理',
        code: 'org_mgmt',
        path: '/platform/org',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 1,
        icon: 'Building2',
        permission: 'manage_org',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-27'
    },
    {
        id: 'menu_user_permission',
        name: '角色与权限',
        code: 'user_permission',
        path: '/platform/permission',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 4,
        icon: 'Users',
        permission: 'manage_permissions',
        owner: '平台管理员',
        builtIn: true,
        updatedAt: '2024-06-15'
    },
    {
        id: 'menu_user_mgmt',
        name: '用户管理',
        code: 'user_mgmt',
        path: '/platform/users',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 2,
        icon: 'UserCog',
        permission: 'manage_user',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-27'
    },
    {
        id: 'menu_workflow_mgmt',
        name: '工作流管理',
        code: 'workflow_mgmt',
        path: '/platform/workflow',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 5,
        icon: 'GitBranch',
        permission: 'manage_workflow',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-27'
    },
    {
        id: 'menu_approval_policy',
        name: '审批策略',
        code: 'approval_policy',
        path: '/platform/approval',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 6,
        icon: 'FileCheck',
        permission: 'manage_approval_policy',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-27'
    },
    {
        id: 'menu_audit_log',
        name: '审计日志',
        code: 'audit_log',
        path: '/platform/audit',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 7,
        icon: 'FileText',
        permission: 'view_audit_log',
        owner: '安全审计',
        builtIn: true,
        updatedAt: '2024-06-16'
    },
    {
        id: 'menu_menu_mgmt',
        name: '菜单管理',
        code: 'menu_mgmt',
        path: '/platform/menu',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 3,
        icon: 'LayoutGrid',
        permission: 'manage_menu',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-26'
    },
    {
        id: 'menu_external_doc',
        name: '帮助文档',
        code: 'help_doc',
        path: '',
        url: 'https://docs.example.com/semantic-hub',
        openMode: '新窗口',
        group: '平台管理',
        type: '外链',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 8,
        icon: 'Link2',
        permission: '',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-28'
    },
    {
        id: 'menu_hidden_feature',
        name: '测试功能',
        code: 'test_feature',
        path: '/platform/test',
        group: '平台管理',
        type: '页面',
        visibility: '隐藏',
        enablement: '启用',
        status: '隐藏',
        parentId: null,
        order: 99,
        icon: 'Settings',
        permission: '',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-28'
    }
];

const formatDate = () => new Date().toISOString().split('T')[0];

const MenuManagementView = () => {
    const [menus, setMenus] = useState<MenuItem[]>(initialMenus);
    const [activeMenuId, setActiveMenuId] = useState(initialMenus[0]?.id ?? '');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | MenuStatus>('all');
    const [groupFilter, setGroupFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState<'all' | MenuType>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [draftMenu, setDraftMenu] = useState<MenuItem | null>(null);
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('tree');
    const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(new Set(['menu_semantic_modeling'])); // Default expand first level

    const toggleExpand = (menuId: string) => {
        const next = new Set(expandedMenuIds);
        if (next.has(menuId)) {
            next.delete(menuId);
        } else {
            next.add(menuId);
        }
        setExpandedMenuIds(next);
    };

    // Flattened tree for rendering
    const menuTree = useMemo(() => {
        const build = (parentId: string | null, level: number): Array<{ item: MenuItem; level: number; hasChildren: boolean }> => {
            const children = menus
                .filter((item) => item.parentId === parentId)
                .sort((a, b) => a.order - b.order);

            return children.flatMap((item) => {
                const itemChildren = menus.filter(c => c.parentId === item.id);
                const hasChildren = itemChildren.length > 0;
                // In tree mode, only show children if expanded. In list mode (search), show all matches.
                const shouldShowChildren = viewMode === 'list' || searchTerm !== '' || expandedMenuIds.has(item.id);

                return [
                    { item, level, hasChildren },
                    ...(shouldShowChildren ? build(item.id, level + 1) : [])
                ];
            });
        };
        return build(null, 0);
    }, [menus, expandedMenuIds, viewMode, searchTerm]);

    const filteredMenus = useMemo(() => {
        // If searching or filtering, we might want to flatten everything or keep tree structure but filter nodes
        // Simple approach: Filter the tree result. 
        // Better approach for search: Flatten everything and show matches.
        if (searchTerm || statusFilter !== 'all' || groupFilter !== 'all' || typeFilter !== 'all') {
            return menus.filter(item => {
                const matchesSearch = `${item.name}${item.code}${item.path}`.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
                const matchesGroup = groupFilter === 'all' || item.group === groupFilter;
                const matchesType = typeFilter === 'all' || item.type === typeFilter;
                return matchesSearch && matchesStatus && matchesGroup && matchesType;
            }).map(item => ({ item, level: 0, hasChildren: false }));
        }

        return menuTree;
    }, [menuTree, menus, searchTerm, statusFilter, groupFilter, typeFilter]);

    const activeMenu = menus.find((item) => item.id === activeMenuId) ?? menus[0];
    const totalCount = menus.length;
    const enabledCount = menus.filter((item) => item.status === '启用').length; // Keeping status for now
    const hiddenCount = menus.filter((item) => item.visibility === '隐藏').length;
    const permissionCount = new Set(menus.map((item) => item.permission).filter(Boolean)).size;
    const unlinkedCount = menus.filter(item => item.type === '页面' && !item.permission).length;

    const parentOptions = menus.filter((item) => item.type === '目录');

    const openCreateModal = () => {
        setModalMode('create');
        setDraftMenu({
            id: `menu_${Date.now()}`,
            name: '',
            code: '',
            path: '',
            group: groups[0],
            type: '页面',
            visibility: '显示',
            enablement: '启用',
            status: '启用',
            parentId: null,
            order: 1,
            icon: 'LayoutGrid',
            permission: '',
            owner: '平台管理员',
            builtIn: false,
            updatedAt: formatDate()
        });
        setModalOpen(true);
    };

    const openEditModal = (menu: MenuItem) => {
        setModalMode('edit');
        setDraftMenu({ ...menu });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftMenu(null);
    };

    const handleSave = () => {
        if (!draftMenu) {
            return;
        }
        if (!draftMenu.name.trim() || !draftMenu.code.trim()) {
            alert('请填写菜单名称与编码。');
            return;
        }
        const nextMenu = { ...draftMenu, updatedAt: formatDate() };
        if (modalMode === 'create') {
            setMenus((prev) => [nextMenu, ...prev]);
            setActiveMenuId(nextMenu.id);
        } else {
            setMenus((prev) => prev.map((item) => (item.id === nextMenu.id ? nextMenu : item)));
        }
        closeModal();
    };

    const handleToggleStatus = (menu: MenuItem) => {
        const nextStatus: MenuStatus = menu.status === '启用' ? '隐藏' : '启用';
        setMenus((prev) =>
            prev.map((item) =>
                item.id === menu.id ? { ...item, status: nextStatus, updatedAt: formatDate() } : item
            )
        );
    };

    const handleDelete = (menu: MenuItem) => {
        if (menu.builtIn) {
            return;
        }
        if (!confirm('确定要删除该菜单吗？')) {
            return;
        }
        setMenus((prev) => {
            const next = prev.filter((item) => item.id !== menu.id && item.parentId !== menu.id);
            if (activeMenuId === menu.id) {
                setActiveMenuId(next[0]?.id ?? '');
            }
            return next;
        });
    };

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutGrid size={22} className="text-indigo-600" />
                        菜单管理
                    </h2>
                    <p className="text-slate-500 mt-1">维护平台菜单结构与权限映射，保证导航一致性。</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Sync functionality hidden as requested
                        <button
                        onClick={() => setSyncModalOpen(true)}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300"
                    >
                        <Settings size={14} className="inline mr-1" /> 同步菜单
                    </button> */}
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建菜单
                    </button>
                </div>
            </div>

            <div className="grid gap-3 px-1 md:grid-cols-6">
                {[
                    { label: '菜单总数', value: `${totalCount}`, note: '含目录与页面', color: 'indigo' },
                    { label: '启用菜单', value: `${enabledCount}`, note: '当前可访问', color: 'emerald' },
                    { label: '隐藏菜单', value: `${hiddenCount}`, note: '不对外展示', color: 'amber' },
                    { label: '未绑定权限', value: `${unlinkedCount}`, note: '高危风险', color: 'rose' }
                ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500">{item.label}</p>
                        </div>
                        <div className={`mt-1 text-xl font-semibold text-${item.color}-600`}>{item.value}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[0.50fr_2.0fr]">
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <Search size={16} className="text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="搜索菜单名称、编码或路径"
                                className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                            />
                        </div>

                    </div>

                    <div className="mt-4 space-y-2">
                        {filteredMenus.map(({ item, level, hasChildren }) => {
                            const isActive = item.id === activeMenuId;
                            return (
                                <div key={item.id} className="group">
                                    <button
                                        onClick={() => setActiveMenuId(item.id)}
                                        className={`w-full text-left rounded-xl border p-3 transition relative ${isActive
                                            ? 'border-indigo-200 bg-indigo-50 shadow-sm z-10'
                                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                            }`}
                                        style={{ marginLeft: searchTerm ? 0 : level * 20, width: searchTerm ? '100%' : `calc(100% - ${level * 20}px)` }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2 overflow-hidden">
                                                {/* Expand/Collapse Icon */}
                                                {hasChildren && !searchTerm && (
                                                    <div
                                                        className="p-1 rounded hover:bg-slate-200 mt-0.5 cursor-pointer text-slate-400"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleExpand(item.id);
                                                        }}
                                                    >
                                                        {expandedMenuIds.has(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </div>
                                                )}
                                                {!hasChildren && !searchTerm && <div className="w-6" />}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">


                                                        <span className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                            {item.name}
                                                        </span>

                                                        {item.visibility === '隐藏' && (
                                                            <div title="导航隐藏">
                                                                <EyeOff size={12} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                {/* Status Badge */}
                                                <div className="flex items-center gap-1">
                                                    {item.enablement === '停用' && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">停用</span>
                                                    )}
                                                    {item.builtIn && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">内置</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">{activeMenu?.name ?? '—'}</h3>
                            <p className="mt-1 text-sm text-slate-500">{activeMenu?.path || '未配置路径'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => activeMenu && openEditModal(activeMenu)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                <Pencil size={14} /> 编辑
                            </button>
                            <button
                                onClick={() => activeMenu && handleToggleStatus(activeMenu)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                {activeMenu?.status === '启用' ? <EyeOff size={14} /> : <Eye size={14} />}
                                {activeMenu?.status === '启用' ? '隐藏' : '启用'}
                            </button>
                            <button
                                onClick={() => activeMenu && handleDelete(activeMenu)}
                                disabled={activeMenu?.builtIn}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 ${activeMenu?.builtIn
                                    ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                    : 'border-rose-200 text-rose-600 hover:text-rose-700 hover:border-rose-300'
                                    }`}
                            >
                                <Trash2 size={14} /> 删除
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: '菜单类型', value: activeMenu?.type ?? '-' },
                            { label: '菜单分组', value: activeMenu?.group ?? '-' },
                            { label: '展示顺序', value: `${activeMenu?.order ?? 0}` }
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-slate-200 p-3">
                                <div className="text-xs text-slate-500">{item.label}</div>
                                <div className="mt-2 text-sm font-semibold text-slate-800">{item.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {[
                            { label: '菜单编码', value: activeMenu?.code ?? '-' },
                            { label: '权限标识', value: activeMenu?.permission || '未配置' },
                            { label: '维护人', value: activeMenu?.owner ?? '-' },
                            { label: '更新时间', value: activeMenu?.updatedAt ?? '-' }
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-slate-200 p-3">
                                <p className="text-xs text-slate-500">{item.label}</p>
                                <p className="mt-2 text-sm font-semibold text-slate-800">{item.value}</p>
                            </div>
                        ))}
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700">父级菜单</p>
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-600">
                            {activeMenu?.parentId
                                ? menus.find((item) => item.id === activeMenu.parentId)?.name || '未知父级'
                                : '顶级菜单'}
                        </div>
                    </div>
                </section>
            </div>

            {modalOpen && draftMenu && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {modalMode === 'create' ? '新建菜单' : '编辑菜单'}
                                    </h3>
                                    <p className="text-xs text-slate-500">配置菜单信息、权限标识与展示规则。</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-6 px-6 py-6 overflow-y-auto">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">菜单名称</label>
                                        <input
                                            value={draftMenu.name}
                                            onChange={(event) =>
                                                setDraftMenu({ ...draftMenu, name: event.target.value })
                                            }
                                            placeholder="例如：菜单管理"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">菜单编码</label>
                                        <input
                                            value={draftMenu.code}
                                            onChange={(event) =>
                                                setDraftMenu({ ...draftMenu, code: event.target.value })
                                            }
                                            placeholder="menu_mgmt"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    {draftMenu.type !== '目录' && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-semibold text-slate-600">
                                                {draftMenu.type === '外链' ? '链接地址 (URL)' : '路由地址'}
                                                <span className="text-rose-500 ml-1">*</span>
                                            </label>
                                            <input
                                                value={draftMenu.type === '外链' ? (draftMenu.url || '') : draftMenu.path}
                                                onChange={(event) =>
                                                    draftMenu.type === '外链'
                                                        ? setDraftMenu({ ...draftMenu, url: event.target.value })
                                                        : setDraftMenu({ ...draftMenu, path: event.target.value })
                                                }
                                                placeholder={draftMenu.type === '外链' ? "https://" : "/platform/menu"}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    {draftMenu.type === '外链' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-600">打开方式</label>
                                            <select
                                                value={draftMenu.openMode || '新窗口'}
                                                onChange={(event) => setDraftMenu({ ...draftMenu, openMode: event.target.value as any })}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                            >
                                                <option value="新窗口">新窗口打开</option>
                                                <option value="当前">当前窗口打开</option>
                                            </select>
                                        </div>
                                    )}

                                    {draftMenu.type === '页面' && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-semibold text-slate-600">
                                                权限标识
                                                <span className="text-rose-500 ml-1">*</span>
                                            </label>
                                            <input
                                                value={draftMenu.permission}
                                                onChange={(event) =>
                                                    setDraftMenu({ ...draftMenu, permission: event.target.value })
                                                }
                                                placeholder="manage_menu"
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">菜单分组</label>
                                        <select
                                            value={draftMenu.group}
                                            onChange={(event) =>
                                                setDraftMenu({ ...draftMenu, group: event.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            {groups.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">菜单类型</label>
                                        <select
                                            value={draftMenu.type}
                                            onChange={(event) =>
                                                setDraftMenu({ ...draftMenu, type: event.target.value as MenuType })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="目录">目录</option>
                                            <option value="页面">页面</option>
                                            <option value="操作">操作</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">父级菜单</label>
                                        <select
                                            value={draftMenu.parentId ?? ''}
                                            onChange={(event) =>
                                                setDraftMenu({
                                                    ...draftMenu,
                                                    parentId: event.target.value || null
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="">顶级菜单</option>
                                            {parentOptions.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">展示顺序</label>
                                        <input
                                            type="number"
                                            value={draftMenu.order}
                                            onChange={(event) =>
                                                setDraftMenu({ ...draftMenu, order: Number(event.target.value) })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">可见性</label>
                                        <select
                                            value={draftMenu.visibility}
                                            onChange={(event) =>
                                                setDraftMenu({ ...draftMenu, visibility: event.target.value as any })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="显示">显示</option>
                                            <option value="隐藏">隐藏</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-600">可用性</label>
                                    <select
                                        value={draftMenu.enablement}
                                        onChange={(event) =>
                                            setDraftMenu({ ...draftMenu, enablement: event.target.value as any })
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="启用">启用</option>
                                        <option value="停用">停用</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                {modalMode === 'create' ? '创建菜单' : '保存修改'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default MenuManagementView;
