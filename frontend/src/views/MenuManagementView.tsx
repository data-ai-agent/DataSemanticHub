import { useMemo, useState, useEffect } from 'react';
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
    Link,
    FileText,
    Folder,
    AlertTriangle,
    Shield,
    Copy,
    Check,
    RefreshCw,
    Loader2,
    GripVertical
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { menuService, MenuItem, MenuStatus, PermissionItem, GetMenuStatsResp, convertMenuToMenuItem } from '../services/menuService';
import { IconSelector } from '../components/menu/IconSelector';
import { getIconByName } from '../utils/iconUtils';
import { clearCachedMenus } from '../services/menuCacheService';
import { recommendIconByName } from '../utils/iconRecommendation';

const formatDate = () => new Date().toISOString().split('T')[0];
const groups = ['语义治理', '语义资产管理', '数据连接', '数据服务', '平台管理'];

const MenuManagementView = () => {
    const toast = useToast();
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | MenuStatus>('all');
    const [groupFilter, setGroupFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState<'all' | MenuItem['type']>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [draftMenu, setDraftMenu] = useState<MenuItem | null>(null);
    const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
    const [formError, setFormError] = useState<string | null>(null);
    const [permissionFilter, setPermissionFilter] = useState<'all' | 'bound' | 'unbound'>('all');
    const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
    const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(new Set(['menu_semantic_modeling']));
    const [permissions, setPermissions] = useState<PermissionItem[]>([]);
    const [isPermissionLoading, setIsPermissionLoading] = useState(false);
    const [menuStats, setMenuStats] = useState<GetMenuStatsResp | null>(null);

    // 拖拽排序相关状态
    const [draggedMenuId, setDraggedMenuId] = useState<string | null>(null);
    const [dragOverMenuId, setDragOverMenuId] = useState<string | null>(null);
    const [dragOverType, setDragOverType] = useState<'same-level' | 'cross-level' | null>(null); // 拖拽类型：同级或跨层级

    // Fetch menus on mount
    useEffect(() => {
        fetchMenus();
        fetchMenuStats();
    }, []);

    const fetchMenus = async () => {
        setIsLoading(true);
        try {
            const data = await menuService.getMenus();
            setMenus(data);
            if (!activeMenuId && data.length > 0) {
                setActiveMenuId(data[0].id);
            }
        } catch (error) {
            console.error('Fetch menus error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPermissions = async () => {
        setIsPermissionLoading(true);
        try {
            const data = await menuService.getPermissions();
            setPermissions(data);
        } catch (error) {
            console.error('Fetch permissions error:', error);
        } finally {
            setIsPermissionLoading(false);
        }
    };

    const fetchMenuStats = async () => {
        try {
            const data = await menuService.getMenuStats();
            setMenuStats(data);
        } catch (error) {
            console.error('Fetch menu stats error:', error);
        }
    };

    const getMenuRisk = (menu: MenuItem) => {
        if (menu.riskFlags?.includes('UNBOUND_PERMISSION')) return 'high';
        if (menu.riskFlags?.includes('ROUTE_CONFLICT') || menu.riskFlags?.includes('ORDER_CONFLICT')) return 'medium';
        if (menu.type === '页面' && !menu.permission) return 'high';
        if (menu.type === '页面' && !menu.path) return 'medium';
        return 'none';
    };

    const toggleExpand = (menuId: string) => {
        const next = new Set(expandedMenuIds);
        if (next.has(menuId)) {
            next.delete(menuId);
        } else {
            next.add(menuId);
        }
        setExpandedMenuIds(next);
    };

    // 拖拽排序处理函数
    const handleDragStart = (e: React.DragEvent, menuId: string) => {
        setDraggedMenuId(menuId);
        e.dataTransfer.setData('text/plain', menuId);
        e.dataTransfer.effectAllowed = 'move';
        // 设置拖拽时的视觉效果
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragEnd = () => {
        setDraggedMenuId(null);
        setDragOverMenuId(null);
        setDragOverType(null);
    };

    const handleDragOver = (e: React.DragEvent, menuId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        if (draggedMenuId && draggedMenuId !== menuId) {
            setDragOverMenuId(menuId);
            
            // 判断是同级排序还是跨层级移动
            const sourceMenu = menus.find(m => m.id === draggedMenuId);
            const targetMenu = menus.find(m => m.id === menuId);
            
            if (sourceMenu && targetMenu) {
                const sourceParentId = sourceMenu.parentId || null;
                const targetParentId = targetMenu.parentId || null;
                
                if (sourceParentId === targetParentId) {
                    setDragOverType('same-level'); // 同级排序
                } else {
                    setDragOverType('cross-level'); // 跨层级移动
                }
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // 只有当离开当前元素时才清除 dragOver 状态
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setDragOverMenuId(null);
            setDragOverType(null);
        }
    };

    const handleDrop = async (e: React.DragEvent, targetMenuId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverMenuId(null);
        setDragOverType(null);

        const sourceMenuId = draggedMenuId;
        if (!sourceMenuId || sourceMenuId === targetMenuId) {
            setDraggedMenuId(null);
            setDragOverType(null);
            return;
        }

        // 查找源菜单和目标菜单
        const sourceMenu = menus.find(m => m.id === sourceMenuId);
        const targetMenu = menus.find(m => m.id === targetMenuId);

        if (!sourceMenu || !targetMenu) {
            setDraggedMenuId(null);
            setDragOverType(null);
            return;
        }

        // 检查是否尝试移动到自己的子菜单下（防止循环）
        const isDescendant = (menuId: string, ancestorId: string): boolean => {
            const menu = menus.find(m => m.id === menuId);
            if (!menu || !menu.parentId) return false;
            if (menu.parentId === ancestorId) return true;
            return isDescendant(menu.parentId, ancestorId);
        };

        if (isDescendant(targetMenuId, sourceMenuId)) {
            toast.error('不能将菜单移动到自己的子菜单下');
            setDraggedMenuId(null);
            setDragOverType(null);
            return;
        }

        // 判断是同级排序还是跨层级移动
        const sourceParentId = sourceMenu.parentId || null;
        const targetParentId = targetMenu.parentId || null;

        if (sourceParentId === targetParentId) {
            // 同级排序：使用 reorderMenus API
            const siblings = menus
                .filter(m => {
                    const mParentId = m.parentId || null;
                    return mParentId === sourceParentId;
                })
                .sort((a, b) => a.order - b.order);

            const sourceIndex = siblings.findIndex(m => m.id === sourceMenuId);
            const targetIndex = siblings.findIndex(m => m.id === targetMenuId);

            if (sourceIndex === -1 || targetIndex === -1) {
                setDraggedMenuId(null);
                setDragOverType(null);
                return;
            }

            // 计算新的顺序
            const newSiblings = [...siblings];
            const [moved] = newSiblings.splice(sourceIndex, 1);
            newSiblings.splice(targetIndex, 0, moved);

            // 构建批量更新请求
            const updates = newSiblings.map((menu, index) => ({
                id: menu.id,
                order: index + 1
            }));

            try {
                await menuService.reorderMenus({ updates });
                toast.success('菜单顺序已更新');
                await fetchMenus();
                // 清除菜单缓存，让侧边栏立即刷新
                clearCachedMenus();
                // 触发全局事件，通知 App.tsx 刷新菜单
                window.dispatchEvent(new CustomEvent('menus-updated'));
            } catch (error: any) {
                console.error('Reorder menus error:', error);
                toast.error(error.message || '更新菜单顺序失败');
            } finally {
                setDraggedMenuId(null);
                setDragOverType(null);
            }
        } else {
            // 跨层级移动：使用 moveMenu API
            // 将源菜单移动到目标菜单的父级下，作为目标菜单的兄弟
            const newParentId = targetParentId; // 目标菜单的父级ID（null 表示根节点）
            const newOrder = targetMenu.order; // 使用目标菜单的 order

            try {
                await menuService.moveMenu(sourceMenuId, {
                    new_parent_id: newParentId || undefined, // 如果是 null，传 undefined
                    new_order: newOrder
                });
                toast.success('菜单已移动到新位置');
                await fetchMenus();
                // 清除菜单缓存，让侧边栏立即刷新
                clearCachedMenus();
                // 触发全局事件，通知 App.tsx 刷新菜单
                window.dispatchEvent(new CustomEvent('menus-updated'));
            } catch (error: any) {
                console.error('Move menu error:', error);
                toast.error(error.message || '移动菜单失败');
            } finally {
                setDraggedMenuId(null);
                setDragOverType(null);
            }
        }
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
        if (searchTerm || statusFilter !== 'all' || groupFilter !== 'all' || typeFilter !== 'all' || permissionFilter !== 'all' || visibilityFilter !== 'all') {
            return menus.filter(item => {
                const matchesSearch = `${item.name}${item.code}${item.path}`.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
                const matchesGroup = groupFilter === 'all' || item.group === groupFilter;
                const matchesType = typeFilter === 'all' || item.type === typeFilter;

                const matchesPermission = permissionFilter === 'all'
                    ? true
                    : permissionFilter === 'bound' ? !!item.permission : !item.permission;
                const matchesVisibility = visibilityFilter === 'all'
                    ? true
                    : visibilityFilter === 'visible' ? item.visibility === '显示' : item.visibility === '隐藏';

                return matchesSearch && matchesStatus && matchesGroup && matchesType && matchesPermission && matchesVisibility;
            }).map(item => ({ item, level: 0, hasChildren: false }));
        }

        return menuTree;
    }, [menuTree, menus, searchTerm, statusFilter, groupFilter, typeFilter, permissionFilter, visibilityFilter]);

    const activeMenu = menus.find((item) => item.id === activeMenuId) ?? menus[0];
    const totalCount = menuStats?.total ?? menus.length;
    const enabledCount = menuStats?.enabled ?? menus.filter((item) => item.status === '启用').length;
    const hiddenCount = menuStats?.hidden ?? menus.filter((item) => item.visibility === '隐藏').length;
    const unlinkedCount = menuStats?.unbound_permission ?? menus.filter(item => item.type === '页面' && !item.permission).length;

    const parentOptions = menus.filter((item) => item.type === '目录');

    const openCreateModal = () => {
        setModalMode('create');
        // 初始时没有名称，使用默认图标，后续会根据名称自动推荐
        setDraftMenu({
            id: '',
            name: '',
            code: '',
            path: '',
            group: groups[0],
            type: '页面',
            visibility: '显示',
            enablement: '启用',
            status: '启用',
            parentId: null,
            order: menus.length + 1,
            icon: 'LayoutGrid', // 默认图标，会根据名称自动推荐
            permission: '',
            owner: '平台管理员',
            builtIn: false,
            updatedAt: formatDate()
        });
        setFormError(null);
        setModalOpen(true);
        fetchPermissions();
    };

    const openEditModal = async (menu: MenuItem) => {
        setModalMode('edit');
        // 从后端重新获取菜单详情，确保获取最新的 icon 字段
        try {
            const menuDetail = await menuService.getMenu(menu.id);
            const updatedMenuItem = convertMenuToMenuItem(menuDetail.menu);
            setDraftMenu({ ...updatedMenuItem });
        } catch (error) {
            console.error('获取菜单详情失败，使用本地数据:', error);
            // 如果获取失败，使用本地数据
            setDraftMenu({ ...menu });
        }
        setFormError(null);
        setModalOpen(true);
        fetchPermissions();
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftMenu(null);
    };

    const handleSave = async () => {
        if (!draftMenu) return;
        setFormError(null);

        // 1. Required Fields Validation
        if (!draftMenu.name.trim()) {
            setFormError('请输入菜单名称');
            return;
        }
        if (!draftMenu.code.trim()) {
            setFormError('请输入菜单编码');
            return;
        }
        if (draftMenu.type !== '目录' && !draftMenu.path && !draftMenu.url) {
            setFormError(draftMenu.type === '外链' ? '请输入外链地址 (URL)' : '请输入路由路径 (Path)');
            return;
        }

        // 2. Uniqueness Check (Local check across loaded menus)
        const isDuplicateCode = menus.some(m => m.id !== draftMenu.id && m.code === draftMenu.code);
        if (isDuplicateCode) {
            setFormError(`菜单编码 "${draftMenu.code}" 已被使用，请更换唯一的编码`);
            return;
        }

        // 3. Path Uniqueness (Simplified)
        if (draftMenu.type === '页面' && menus.some(m => m.id !== draftMenu.id && m.path === draftMenu.path)) {
            setFormError(`路由路径 "${draftMenu.path}" 已被使用，请更换`);
            return;
        }

        try {
            if (modalMode === 'create') {
                const newMenu = await menuService.createMenu(draftMenu) as MenuItem;
                // 确保使用后端返回的完整数据（包括 icon 字段）
                setMenus(prev => [newMenu, ...prev]);
                setActiveMenuId(newMenu.id);
            } else {
                // 更新菜单
                const updatedMenu = await menuService.updateMenu(draftMenu.id, draftMenu);
                // 如果后端返回了更新后的菜单，使用返回的数据（包含最新的 icon 字段）
                if (updatedMenu) {
                    const updatedMenuItem = convertMenuToMenuItem(updatedMenu);
                    setMenus(prev => prev.map(item => (item.id === draftMenu.id ? updatedMenuItem : item)));
                } else {
                    // 如果后端没有返回数据，重新获取菜单详情
                    try {
                        const menuDetail = await menuService.getMenu(draftMenu.id);
                        const updatedMenuItem = convertMenuToMenuItem(menuDetail.menu);
                        setMenus(prev => prev.map(item => (item.id === draftMenu.id ? updatedMenuItem : item)));
                    } catch (error) {
                        console.error('获取更新后的菜单详情失败，使用本地数据:', error);
                        // 如果获取失败，使用本地数据
                        setMenus(prev => prev.map(item => (item.id === draftMenu.id ? draftMenu : item)));
                    }
                }
            }
            await fetchMenuStats();
            // 清除菜单缓存，让侧边栏立即刷新
            clearCachedMenus();
            // 触发全局事件，通知 App.tsx 刷新菜单
            window.dispatchEvent(new CustomEvent('menus-updated'));
            closeModal();
        } catch (error: any) {
            setFormError(error.message || '保存失败');
        }
    };

    const handleToggleStatus = async (menu: MenuItem) => {
        const nextVisible = menu.visibility !== '显示';
        try {
            const updatedMenu = await menuService.toggleMenuVisible(menu.id, nextVisible);
            const updatedItem = convertMenuToMenuItem(updatedMenu);
            setMenus((prev) =>
                prev.map((item) => (item.id === menu.id ? { ...item, ...updatedItem } : item))
            );
            await fetchMenuStats();
            // 清除菜单缓存，让侧边栏立即刷新（因为 visible 状态影响菜单显示）
            clearCachedMenus();
            // 触发全局事件，通知 App.tsx 刷新菜单
            window.dispatchEvent(new CustomEvent('menus-updated'));
        } catch (error) {
            toast.error('操作失败');
        }
    };

    const handleDelete = async (menu: MenuItem) => {
        if (menu.builtIn) return;
        if (!confirm('确定要删除该菜单吗？删除后不可恢复。')) return;

        try {
            await menuService.deleteMenu(menu.id);
            setMenus((prev) => {
                const next = prev.filter((item) => item.id !== menu.id && item.parentId !== menu.id);
                if (activeMenuId === menu.id) {
                    setActiveMenuId(next[0]?.id ?? '');
                }
                return next;
            });
            await fetchMenuStats();
            // 清除菜单缓存，让侧边栏立即刷新
            clearCachedMenus();
            // 触发全局事件，通知 App.tsx 刷新菜单
            window.dispatchEvent(new CustomEvent('menus-updated'));
            toast.success('菜单已删除');
        } catch (error) {
            toast.error('删除失败');
        }
    };

    return (
        <div className="flex flex-col h-full pt-6 pb-2 px-1 gap-4 overflow-hidden">
            {/* Header & KPI Area */}
            <div className="flex flex-col gap-4 px-1 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <LayoutGrid size={22} className="text-indigo-600" />
                            菜单管理
                        </h2>
                        <p className="text-slate-500 mt-1">维护平台菜单结构与权限映射，保证导航一致性。</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
                        >
                            <Plus size={16} /> 新建菜单
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 grid-cols-4">
                    {[
                        { label: '菜单总数', value: totalCount, note: '含目录与页面', color: 'indigo', action: () => { setStatusFilter('all'); setTypeFilter('all'); setPermissionFilter('all'); } },
                        { label: '启用菜单', value: enabledCount, note: '当前可访问', color: 'emerald', action: () => setStatusFilter('启用') },
                        { label: '隐藏菜单', value: hiddenCount, note: '不对外展示', color: 'amber', action: () => setVisibilityFilter('hidden') },
                        { label: '未绑定权限', value: unlinkedCount, note: '高危风险', color: 'rose', action: () => { setTypeFilter('页面'); setPermissionFilter('unbound'); } }
                    ].map((item) => (
                        <div
                            key={item.label}
                            onClick={item.action}
                            className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500 group-hover:text-indigo-600 transition-colors">{item.label}</p>
                            </div>
                            <div className={`mt-1 text-xl font-semibold text-${item.color}-600`}>{item.value}</div>
                            <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content: Split View */}
            <div className="flex-1 flex gap-4 min-h-0 px-1 relative">
                {/* Left: Tree Pane */}
                <section className="flex flex-col w-[320px] bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">
                    <div className="p-3 border-b border-slate-100 space-y-3 bg-slate-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="搜索名称、编码、路由..."
                                className="w-full text-xs text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <div className="flex gap-2 text-xs overflow-x-auto pb-1 no-scrollbar">
                            <select
                                className="border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 outline-none focus:border-indigo-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">状态: 全部</option>
                                <option value="启用">启用</option>
                                <option value="停用">停用</option>
                            </select>
                            <select
                                className="border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 outline-none focus:border-indigo-500"
                                value={permissionFilter}
                                onChange={(e) => setPermissionFilter(e.target.value as any)}
                            >
                                <option value="all">权限: 全部</option>
                                <option value="bound">已绑定</option>
                                <option value="unbound">未绑定</option>
                            </select>
                            <select
                                className="border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 outline-none focus:border-indigo-500"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                            >
                                <option value="all">类型: 全部</option>
                                <option value="目录">目录</option>
                                <option value="页面">页面</option>
                                <option value="外链">外链</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredMenus.map(({ item, level, hasChildren }) => {
                            const isActive = item.id === activeMenuId;
                            const riskLevel = getMenuRisk(item);
                            const isDragging = draggedMenuId === item.id;
                            const isDragOver = dragOverMenuId === item.id;
                            const dragType = isDragOver ? dragOverType : null;

                            return (
                                <div
                                    key={item.id}
                                    draggable={!item.builtIn}
                                    onDragStart={(e) => {
                                        if (!item.builtIn) {
                                            handleDragStart(e, item.id);
                                        }
                                    }}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => {
                                        if (draggedMenuId && draggedMenuId !== item.id && !item.builtIn) {
                                            handleDragOver(e, item.id);
                                        }
                                    }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => {
                                        if (!item.builtIn) {
                                            handleDrop(e, item.id);
                                        }
                                    }}
                                    className={`group flex items-center gap-2 rounded-lg p-2 text-sm transition-all ${isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                                        } ${isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-pointer'
                                        } ${isDragOver && dragType === 'same-level' ? 'ring-2 ring-indigo-400 bg-indigo-50 border-2 border-indigo-300' : ''
                                        } ${isDragOver && dragType === 'cross-level' ? 'ring-2 ring-emerald-400 bg-emerald-50 border-2 border-emerald-300' : ''
                                        } ${item.builtIn ? 'cursor-default' : ''
                                        }`}
                                    style={{ paddingLeft: level * 16 + 8 }}
                                    onClick={() => setActiveMenuId(item.id)}
                                >
                                    {/* 拖拽手柄 - 只在非内置菜单时显示 */}
                                    {!item.builtIn && (
                                        <div
                                            className="p-0.5 rounded hover:bg-slate-100 cursor-grab active:cursor-grabbing text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                            }}
                                            title="拖拽排序"
                                        >
                                            <GripVertical size={12} />
                                        </div>
                                    )}

                                    {/* 展开/收起按钮 */}
                                    <div
                                        className={`p-0.5 rounded hover:bg-black/5 cursor-pointer text-slate-400 shrink-0 ${hasChildren ? 'visible' : 'invisible'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(item.id);
                                        }}
                                    >
                                        {expandedMenuIds.has(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>

                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {/* Menu Icon */}
                                            {(() => {
                                                const IconComponent = getIconByName(item.icon, LayoutGrid);
                                                return <IconComponent size={14} className="text-slate-500 shrink-0" />;
                                            })()}

                                            <span className={`truncate font-medium ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                {item.name}
                                            </span>

                                            {riskLevel === 'high' && (
                                                <div title="高风险：未绑定权限">
                                                    <AlertTriangle size={12} className="text-rose-500 shrink-0" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {item.visibility === '隐藏' && (
                                                <div title="隐藏">
                                                    <EyeOff size={12} className="text-slate-400" />
                                                </div>
                                            )}
                                            {item.enablement === '停用' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="已停用" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredMenus.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                没有找到匹配的菜单
                            </div>
                        )}
                    </div>
                </section>

                {/* Right: Detail Pane */}
                <section className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    {activeMenu ? (
                        <>
                            {/* Detail Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/30">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white">
                                            {(() => {
                                                const IconComponent = getIconByName(activeMenu.icon, LayoutGrid);
                                                return <IconComponent size={18} className="text-slate-600" />;
                                            })()}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">{activeMenu.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs border ${activeMenu.type === '目录' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            activeMenu.type === '外链' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>{activeMenu.type}</span>
                                        {getMenuRisk(activeMenu) === 'high' && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-rose-50 text-rose-600 border border-rose-100">
                                                <AlertTriangle size={10} /> 风险: 未绑权限
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1.5 text-sm text-slate-500 font-mono flex items-center gap-2">
                                        <span className="select-all">{activeMenu.path || (activeMenu.type === '外链' ? activeMenu.url : activeMenu.code)}</span>
                                        <Copy size={12} className="text-slate-300 hover:text-indigo-500 cursor-pointer" />
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(activeMenu)}
                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
                                    >
                                        <Pencil size={14} /> 编辑
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(activeMenu)}
                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1.5"
                                    >
                                        {activeMenu.status === '启用' ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {activeMenu.status === '启用' ? '隐藏' : '显示'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(activeMenu)}
                                        disabled={activeMenu.builtIn}
                                        className={`px-3 py-1.5 bg-white border rounded-lg text-sm transition-colors flex items-center gap-1.5 ${activeMenu.builtIn
                                            ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                            : 'border-slate-200 text-rose-600 hover:border-rose-200 hover:bg-rose-50'
                                            }`}
                                    >
                                        <Trash2 size={14} /> 删除
                                    </button>
                                </div>
                            </div>

                            {/* Detail Content Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Basic Info Card */}
                                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Folder size={16} className="text-indigo-500" /> 基础信息
                                    </h4>
                                    <div className="grid grid-cols-3 gap-6">
                                        {[
                                            { label: '菜单编码', value: activeMenu.code },
                                            { 
                                                label: '菜单图标', 
                                                value: activeMenu.icon || 'Layout', 
                                                color: 'text-indigo-600',
                                                isIcon: true // 标记这是图标字段，需要特殊渲染
                                            },
                                            { label: '菜单分组', value: activeMenu.group },
                                            { label: '排序权重', value: activeMenu.order },
                                            { label: '父级节点', value: activeMenu.parentId ? menus.find(m => m.id === activeMenu.parentId)?.name : '顶级菜单' },
                                            { label: '当前状态', value: activeMenu.enablement, color: activeMenu.enablement === '启用' ? 'text-emerald-600' : 'text-rose-600' },
                                            { label: '可见性', value: activeMenu.visibility, color: activeMenu.visibility === '显示' ? 'text-slate-600' : 'text-slate-400' }
                                        ].map(f => (
                                            <div key={f.label}>
                                                <div className="text-xs text-slate-400 mb-1">{f.label}</div>
                                                {f.isIcon ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded bg-white">
                                                            {(() => {
                                                                const IconComponent = getIconByName(f.value as string, LayoutGrid);
                                                                return <IconComponent size={14} className="text-slate-600" />;
                                                            })()}
                                                        </div>
                                                        <span className={`text-sm font-medium ${f.color || 'text-slate-700'}`}>{f.value}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`text-sm font-medium ${f.color || 'text-slate-700'}`}>{f.value}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Routing Card */}
                                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Link size={16} className="text-indigo-500" /> 路由配置
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <div className="text-xs text-slate-400 mb-1">
                                                {activeMenu.type === '外链' ? '外链地址 (URL)' : '路由路径 (Path)'}
                                            </div>
                                            <div className="text-sm font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded w-fit">
                                                {activeMenu.type === '外链' ? activeMenu.url : activeMenu.path}
                                            </div>
                                        </div>
                                        {activeMenu.type === '外链' && (
                                            <div>
                                                <div className="text-xs text-slate-400 mb-1">打开方式</div>
                                                <div className="text-sm font-medium text-slate-700">{activeMenu.openMode}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Permission Card */}
                                <div className={`bg-white rounded-xl border p-4 shadow-sm ${getMenuRisk(activeMenu) === 'high' ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'}`}>
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Shield size={16} className="text-indigo-500" /> 权限管控
                                    </h4>
                                    {activeMenu.type === '页面' ? (
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <div className="text-xs text-slate-400 mb-1">绑定权限标识</div>
                                                {activeMenu.permission ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                            {activeMenu.permission}
                                                        </span>
                                                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                                                            <Check size={12} /> 已绑定
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-rose-600 flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                                                        <AlertTriangle size={14} />
                                                        未绑定权限标识，所有登录用户均可见（高危）
                                                    </div>
                                                )}
                                            </div>
                                            {activeMenu.associatedRoles && (
                                                <div className="flex-1">
                                                    <div className="text-xs text-slate-400 mb-1">已授权角色</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {activeMenu.associatedRoles.map(role => (
                                                            <span key={role} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                                {role}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">目录与外链无需绑定应用级权限。</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <LayoutGrid size={48} className="text-slate-200 mb-4" />
                            <p>请选择一个菜单查看详情</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Modal - Reusing logic, enhanced layout */}
            {modalOpen && draftMenu && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50 rounded-t-xl">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">
                                    {modalMode === 'create' ? '新建菜单' : '编辑菜单'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">配置菜单属性、路由与权限规则</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                            {/* Validation Error Banner */}
                            {formError && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                    <div className="text-sm font-medium">{formError}</div>
                                </div>
                            )}

                            {/* Section 1: Basic Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> 基础信息
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">菜单类型 <span className="text-rose-500">*</span></label>
                                        <select
                                            value={draftMenu.type}
                                            onChange={(e) => setDraftMenu({ ...draftMenu, type: e.target.value as MenuItem['type'] })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                        >
                                            <option value="目录">目录 (Folder)</option>
                                            <option value="页面">页面 (Page)</option>
                                            <option value="外链">外链 (Link)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">父级菜单</label>
                                        <select
                                            value={draftMenu.parentId ?? ''}
                                            onChange={(e) => setDraftMenu({ ...draftMenu, parentId: e.target.value || null })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">作为根目录</option>
                                            {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">菜单名称 <span className="text-rose-500">*</span></label>
                                        <input
                                            value={draftMenu.name}
                                            onChange={(e) => {
                                                const newName = e.target.value;
                                                // 如果当前图标是默认图标或为空，根据名称自动推荐图标
                                                const currentIcon = draftMenu.icon || 'LayoutGrid';
                                                const shouldRecommend = !draftMenu.icon || currentIcon === 'LayoutGrid' || currentIcon === 'Layout';
                                                const recommendedIcon = shouldRecommend && newName.trim()
                                                    ? recommendIconByName(newName, draftMenu.code, draftMenu.type)
                                                    : draftMenu.icon;
                                                
                                                setDraftMenu({ 
                                                    ...draftMenu, 
                                                    name: newName,
                                                    icon: recommendedIcon
                                                });
                                            }}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                            placeholder="如：系统设置"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">编码 (Code) <span className="text-rose-500">*</span></label>
                                        <input
                                            value={draftMenu.code}
                                            onChange={(e) => {
                                                const newCode = e.target.value;
                                                // 如果当前图标是默认图标或为空，根据编码自动推荐图标
                                                const currentIcon = draftMenu.icon || 'LayoutGrid';
                                                const shouldRecommend = !draftMenu.icon || currentIcon === 'LayoutGrid' || currentIcon === 'Layout';
                                                const recommendedIcon = shouldRecommend && (newCode.trim() || draftMenu.name.trim())
                                                    ? recommendIconByName(draftMenu.name, newCode, draftMenu.type)
                                                    : draftMenu.icon;
                                                
                                                setDraftMenu({ 
                                                    ...draftMenu, 
                                                    code: newCode,
                                                    icon: recommendedIcon
                                                });
                                            }}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none font-mono"
                                            placeholder="system_settings"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <IconSelector
                                            value={draftMenu.icon || 'Layout'}
                                            onChange={(iconName) => setDraftMenu({ ...draftMenu, icon: iconName })}
                                            label="菜单图标"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Routing */}
                            {draftMenu.type !== '目录' && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 路由配置
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">
                                                {draftMenu.type === '外链' ? '链接地址 (URL)' : '路由路径 (Path)'} <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                value={draftMenu.type === '外链' ? (draftMenu.url || '') : draftMenu.path}
                                                onChange={(e) => draftMenu.type === '外链' ? setDraftMenu({ ...draftMenu, url: e.target.value }) : setDraftMenu({ ...draftMenu, path: e.target.value })}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none font-mono"
                                                placeholder={draftMenu.type === '外链' ? 'https://example.com' : '/system/settings'}
                                            />
                                        </div>
                                        {draftMenu.type === '外链' && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-700">打开方式</label>
                                                <select
                                                    value={draftMenu.openMode}
                                                    onChange={(e) => setDraftMenu({ ...draftMenu, openMode: e.target.value as any })}
                                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                                >
                                                    <option value="新窗口">新窗口打开 (Blank)</option>
                                                    <option value="当前">当前窗口 (Self)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Permission (Only for Page) */}
                            {draftMenu.type === '页面' && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> 权限管控
                                    </h4>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700">权限标识 (Permission Key)</label>
                                            <div className="flex gap-2 relative">
                                                <div className="flex-1 relative">
                                                    <input
                                                        value={draftMenu.permission}
                                                        onChange={(e) => setDraftMenu({ ...draftMenu, permission: e.target.value })}
                                                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none font-mono transition-colors ${!draftMenu.permission ? 'border-amber-300 focus:border-amber-500 bg-amber-50/30' : 'border-slate-200 focus:border-indigo-500'
                                                            }`}
                                                        placeholder="请输入或选择权限标识..."
                                                        list="permission-list"
                                                    />
                                                    <datalist id="permission-list">
                                                        {permissions.map((p) => (
                                                            <option key={p.key} value={p.key}>{p.name} ({p.key})</option>
                                                        ))}
                                                    </datalist>
                                                </div>
                                                {/* <button className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50">
                                                    选择...
                                                </button> */}
                                            </div>
                                            {!draftMenu.permission ? (
                                                <div className="text-xs text-amber-600 flex items-start gap-1.5 bg-amber-50 p-2 rounded border border-amber-100 mt-2">
                                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                                    <span>注意：未配置权限标识，该页面将对所有登录用户可见（公开访问）。</span>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500">
                                                    对应 RBAC 权限系统中的资源标识。
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section 4: Display Control */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 展示规则
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">显示状态</label>
                                        <select
                                            value={draftMenu.visibility}
                                            onChange={(e) => setDraftMenu({ ...draftMenu, visibility: e.target.value as any })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                        >
                                            <option value="显示">显示</option>
                                            <option value="隐藏">隐藏</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">启用状态</label>
                                        <select
                                            value={draftMenu.enablement}
                                            onChange={(e) => setDraftMenu({ ...draftMenu, enablement: e.target.value as any })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                        >
                                            <option value="启用">启用</option>
                                            <option value="停用">停用</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">排序权重</label>
                                        <input
                                            type="number"
                                            value={draftMenu.order}
                                            onChange={(e) => setDraftMenu({ ...draftMenu, order: Number(e.target.value) })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                            <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-colors">
                                取消
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
                                {modalMode === 'create' ? '立即创建' : '保存变更'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default MenuManagementView;
