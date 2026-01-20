import { useMemo, useState, useCallback, useEffect } from 'react';
import {
    Plus,
    Search,
    UserCog,
    Pencil,
    Trash2,
    X,
    Eye,
    EyeOff,
    Mail,
    Phone,
    Building2,
    BadgeCheck,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Check,
    Users,
    FileSpreadsheet,
    Download
} from 'lucide-react';

type UserStatus = '启用' | '停用' | '锁定';

type Department = {
    id: string;
    name: string;
    parentId: string | null;
    order: number;
};

type UserItem = {
    id: string;
    name: string;
    email: string;
    phone: string;
    deptId: string;
    role: string;
    status: UserStatus;
    lastLogin: string;
    createdAt: string;
};

type SortField = 'name' | 'role' | 'status' | 'createdAt' | null;
type SortOrder = 'asc' | 'desc';

const departments: Department[] = [
    { id: 'dept_root', name: '数据语义治理中心', parentId: null, order: 1 },
    { id: 'dept_semantic_ops', name: '语义运营部', parentId: 'dept_root', order: 1 },
    { id: 'dept_version_council', name: '版本委员会', parentId: 'dept_root', order: 2 },
    { id: 'dept_security', name: '安全合规部', parentId: null, order: 2 },
    { id: 'dept_quality', name: '数据质量中心', parentId: null, order: 3 },
    { id: 'dept_data_service', name: '数据服务运营部', parentId: null, order: 4 },
    { id: 'dept_scene', name: '业务场景推进组', parentId: 'dept_data_service', order: 1 }
];

const rootDeptIds = departments.filter((dept) => !dept.parentId).map((dept) => dept.id);

const roles = [
    '语义治理负责人',
    '语义治理专员',
    '版本委员会成员',
    '数据质量管理员',
    '安全审计',
    '数据服务运营',
    '业务分析师'
];

const initialUsers: UserItem[] = [
    {
        id: 'user_01',
        name: '王宁',
        email: 'wangning@company.com',
        phone: '13800001111',
        deptId: 'dept_root',
        role: '语义治理负责人',
        status: '启用',
        lastLogin: '2024-06-28 09:32',
        createdAt: '2023-11-12'
    },
    {
        id: 'user_02',
        name: '陈颖',
        email: 'chenying@company.com',
        phone: '13800002222',
        deptId: 'dept_semantic_ops',
        role: '语义治理专员',
        status: '启用',
        lastLogin: '2024-06-28 08:15',
        createdAt: '2024-01-08'
    },
    {
        id: 'user_03',
        name: '刘洋',
        email: 'liuyang@company.com',
        phone: '13800003333',
        deptId: 'dept_version_council',
        role: '版本委员会成员',
        status: '启用',
        lastLogin: '2024-06-27 17:40',
        createdAt: '2023-10-05'
    },
    {
        id: 'user_04',
        name: '张倩',
        email: 'zhangqian@company.com',
        phone: '13800004444',
        deptId: 'dept_security',
        role: '安全审计',
        status: '启用',
        lastLogin: '2024-06-27 16:22',
        createdAt: '2023-09-21'
    },
    {
        id: 'user_05',
        name: '李晨',
        email: 'lichen@company.com',
        phone: '13800005555',
        deptId: 'dept_quality',
        role: '数据质量管理员',
        status: '启用',
        lastLogin: '2024-06-27 15:02',
        createdAt: '2023-12-18'
    },
    {
        id: 'user_06',
        name: '赵敏',
        email: 'zhaomin@company.com',
        phone: '13800006666',
        deptId: 'dept_data_service',
        role: '数据服务运营',
        status: '停用',
        lastLogin: '2024-06-20 11:30',
        createdAt: '2024-02-09'
    },
    {
        id: 'user_07',
        name: '周琪',
        email: 'zhouqi@company.com',
        phone: '13800007777',
        deptId: 'dept_scene',
        role: '业务分析师',
        status: '锁定',
        lastLogin: '2024-06-19 14:20',
        createdAt: '2024-03-14'
    }
];

const formatDate = () => new Date().toISOString().split('T')[0];

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const UserManagementView = () => {
    const [users, setUsers] = useState<UserItem[]>(initialUsers);
    const [activeDeptId, setActiveDeptId] = useState<string>('all');
    const [activeUserId, setActiveUserId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [draftUser, setDraftUser] = useState<UserItem | null>(null);
    const [expandedDeptIds, setExpandedDeptIds] = useState<string[]>(() => rootDeptIds);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const deptChildren = useMemo(() => {
        const map: Record<string, Department[]> = {};
        departments.forEach((dept) => {
            const key = dept.parentId ?? 'root';
            if (!map[key]) {
                map[key] = [];
            }
            map[key].push(dept);
        });
        Object.keys(map).forEach((key) => {
            map[key].sort((a, b) => a.order - b.order);
        });
        return map;
    }, []);

    const filteredAndSortedUsers = useMemo(() => {
        let result = users.filter((user) => {
            const matchesSearch = `${user.name}${user.email}${user.phone}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesDept = activeDeptId === 'all' || user.deptId === activeDeptId;
            return matchesSearch && matchesStatus && matchesRole && matchesDept;
        });

        if (sortField) {
            result.sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];
                const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [users, debouncedSearchTerm, statusFilter, roleFilter, activeDeptId, sortField, sortOrder]);

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSortedUsers.slice(start, start + pageSize);
    }, [filteredAndSortedUsers, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize);

    const activeUser = users.find((user) => user.id === activeUserId);
    const totalUsers = users.length;
    const enabledUsers = users.filter((user) => user.status === '启用').length;
    const lockedUsers = users.filter((user) => user.status === '锁定').length;

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const openCreateModal = () => {
        setModalMode('create');
        setDraftUser({
            id: `user_${Date.now()}`,
            name: '',
            email: '',
            phone: '',
            deptId: activeDeptId === 'all' ? departments[0]?.id ?? '' : activeDeptId,
            role: roles[0],
            status: '启用',
            lastLogin: '-',
            createdAt: formatDate()
        });
        setModalOpen(true);
    };

    const openEditModal = (user: UserItem) => {
        setModalMode('edit');
        setDraftUser({ ...user });
        setModalOpen(true);
    };

    const openDrawer = (user: UserItem) => {
        setActiveUserId(user.id);
        setDrawerOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftUser(null);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
    };

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        return /^1[3-9]\d{9}$/.test(phone);
    };

    const handleSave = () => {
        if (!draftUser) {
            return;
        }
        if (!draftUser.name.trim() || !draftUser.email.trim()) {
            showToast('请填写用户姓名与邮箱', 'error');
            return;
        }
        if (!validateEmail(draftUser.email)) {
            showToast('请输入有效的邮箱地址', 'error');
            return;
        }
        if (draftUser.phone && !validatePhone(draftUser.phone)) {
            showToast('请输入有效的手机号码', 'error');
            return;
        }
        if (modalMode === 'create') {
            setUsers((prev) => [draftUser, ...prev]);
            showToast('用户创建成功', 'success');
        } else {
            setUsers((prev) => prev.map((item) => (item.id === draftUser.id ? draftUser : item)));
            showToast('用户信息已更新', 'success');
        }
        closeModal();
    };

    const handleToggleStatus = (user: UserItem) => {
        const nextStatus: UserStatus = user.status === '启用' ? '停用' : '启用';
        setUsers((prev) =>
            prev.map((item) => (item.id === user.id ? { ...item, status: nextStatus } : item))
        );
        showToast(`用户已${nextStatus === '启用' ? '启用' : '停用'}`, 'success');
    };

    const handleDelete = (user: UserItem) => {
        setUsers((prev) => {
            const next = prev.filter((item) => item.id !== user.id);
            if (activeUserId === user.id) {
                setActiveUserId('');
                if (drawerOpen) setDrawerOpen(false);
            }
            return next;
        });
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            next.delete(user.id);
            return next;
        });
        showToast('用户已删除', 'success');
    };

    const handleBatchDelete = () => {
        if (selectedUserIds.size === 0) return;
        setUsers((prev) => prev.filter((item) => !selectedUserIds.has(item.id)));
        setSelectedUserIds(new Set());
        showToast(`已删除 ${selectedUserIds.size} 个用户`, 'success');
    };

    const handleBatchToggleStatus = (status: UserStatus) => {
        if (selectedUserIds.size === 0) return;
        setUsers((prev) =>
            prev.map((item) => (selectedUserIds.has(item.id) ? { ...item, status } : item))
        );
        setSelectedUserIds(new Set());
        showToast(`已批量${status === '启用' ? '启用' : '停用'}用户`, 'success');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(new Set(paginatedUsers.map((u) => u.id)));
        } else {
            setSelectedUserIds(new Set());
        }
    };

    const handleSelectUser = (userId: string, checked: boolean) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(userId);
            } else {
                next.delete(userId);
            }
            return next;
        });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getDeptName = (deptId: string) => departments.find((dept) => dept.id === deptId)?.name ?? '未归属';

    const toggleExpand = (deptId: string) => {
        setExpandedDeptIds((prev) =>
            prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
        );
    };

    const renderDeptTree = (parentId: string | null, level: number) => {
        const key = parentId ?? 'root';
        const items = deptChildren[key] ?? [];
        if (items.length === 0) return null;

        return items.map((dept) => {
            const hasChildren = (deptChildren[dept.id] ?? []).length > 0;
            const isExpanded = expandedDeptIds.includes(dept.id);
            const isActive = activeDeptId === dept.id;
            const userCount = users.filter((u) => u.deptId === dept.id).length;

            return (
                <div key={dept.id}>
                    <button
                        type="button"
                        onClick={() => setActiveDeptId(dept.id)}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                            isActive
                                ? 'bg-indigo-50 text-indigo-600 font-medium'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        style={{ paddingLeft: `${12 + level * 16}px` }}
                    >
                        {hasChildren ? (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(dept.id);
                                }}
                                className="flex-shrink-0"
                            >
                                <ChevronRight
                                    size={12}
                                    className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                />
                            </span>
                        ) : (
                            <span className="w-3 flex-shrink-0" />
                        )}
                        <span className="flex-1 text-left truncate">{dept.name}</span>
                        <span className="text-slate-400 flex-shrink-0">{userCount}</span>
                    </button>
                    {hasChildren && isExpanded && renderDeptTree(dept.id, level + 1)}
                </div>
            );
        });
    };

    const renderSkeleton = () => (
        <div className="space-y-3">
            {[...Array(pageSize)].map((_, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-4 h-4 bg-slate-200 rounded" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-1/4" />
                            <div className="h-3 bg-slate-200 rounded w-1/3" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-2">暂无用户数据</h3>
            <p className="text-sm text-slate-500 mb-6">
                {debouncedSearchTerm || statusFilter !== 'all' || roleFilter !== 'all' || activeDeptId !== 'all'
                    ? '尝试调整筛选条件或清除搜索'
                    : '点击下方按钮创建第一个用户'}
            </p>
            {!debouncedSearchTerm && statusFilter === 'all' && roleFilter === 'all' && activeDeptId === 'all' && (
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                    <Plus size={16} /> 新建用户
                </button>
            )}
        </div>
    );

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const allSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.has(u.id));
    const someSelected = paginatedUsers.some((u) => selectedUserIds.has(u.id));

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            {/* Toast 通知 */}
            <div className="fixed top-4 right-4 z-[100] space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[280px] ${
                            toast.type === 'success'
                                ? 'bg-emerald-600 text-white'
                                : toast.type === 'error'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-800 text-white'
                        }`}
                    >
                        {toast.type === 'success' && <Check size={18} />}
                        {toast.type === 'error' && <X size={18} />}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                ))}
            </div>

            {/* 头部 */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UserCog size={22} className="text-indigo-600" />
                        用户管理
                    </h2>
                    <p className="text-slate-500 mt-1">将用户归属到组织架构，并统一管理角色与状态。</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 flex items-center gap-2">
                        <FileSpreadsheet size={14} /> 批量导入
                    </button>
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 flex items-center gap-2">
                        <Download size={14} /> 导出
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建用户
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid gap-4 px-1 md:grid-cols-3">
                {[
                    { label: '用户总数', value: `${totalUsers}`, note: '平台用户', color: 'indigo' },
                    { label: '启用用户', value: `${enabledUsers}`, note: '可登录使用', color: 'emerald' },
                    { label: '锁定用户', value: `${lockedUsers}`, note: '安全冻结', color: 'rose' }
                ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <div className={`mt-2 text-2xl font-semibold text-${item.color}-600`}>{item.value}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[240px_1fr]">
                {/* 左侧组织树 */}
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-fit">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-700">组织架构</h3>
                        <span className="text-xs text-slate-400">{departments.length} 个</span>
                    </div>
                    <div className="space-y-1">
                        <button
                            type="button"
                            onClick={() => setActiveDeptId('all')}
                            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                                activeDeptId === 'all'
                                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Building2 size={14} />
                            <span>全部组织</span>
                            <span className="ml-auto text-slate-400">{users.length}</span>
                        </button>
                        {renderDeptTree(null, 0)}
                    </div>
                </section>

                {/* 右侧表格区域 */}
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
                    {/* 搜索和筛选栏 */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                        <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                            <Search size={16} className="text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="搜索姓名、邮箱或手机号"
                                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | UserStatus)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="all">全部状态</option>
                                <option value="启用">启用</option>
                                <option value="停用">停用</option>
                                <option value="锁定">锁定</option>
                            </select>
                            <select
                                value={roleFilter}
                                onChange={(event) => setRoleFilter(event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="all">全部角色</option>
                                {roles.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 批量操作栏 */}
                    {selectedUserIds.size > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                            <span className="text-sm text-indigo-700 font-medium">
                                已选择 <strong>{selectedUserIds.size}</strong> 个用户
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleBatchToggleStatus('启用')}
                                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                                >
                                    批量启用
                                </button>
                                <button
                                    onClick={() => handleBatchToggleStatus('停用')}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                                >
                                    批量停用
                                </button>
                                <button
                                    onClick={handleBatchDelete}
                                    className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100"
                                >
                                    批量删除
                                </button>
                                <button
                                    onClick={() => setSelectedUserIds(new Set())}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                                >
                                    取消选择
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 表格 */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={(input) => {
                                                if (input) {
                                                    input.indeterminate = someSelected && !allSelected;
                                                }
                                            }}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600"
                                        >
                                            姓名 <SortIcon field="name" />
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                        邮箱
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                        手机号
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <button
                                            onClick={() => handleSort('role')}
                                            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600"
                                        >
                                            角色 <SortIcon field="role" />
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                            所属组织
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        <button
                                            onClick={() => handleSort('status')}
                                            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600"
                                        >
                                            状态 <SortIcon field="status" />
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8}>
                                            <div className="py-8">
                                                {renderEmptyState()}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user) => {
                                        const isSelected = selectedUserIds.has(user.id);
                                        return (
                                            <tr
                                                key={user.id}
                                                className={`border-b border-slate-100 hover:bg-indigo-50/30 transition ${
                                                    isSelected ? 'bg-indigo-50/50' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-medium text-slate-800">{user.name}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-600">{user.email}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-600">{user.phone}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-600">{user.role}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-600">{getDeptName(user.deptId)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            user.status === '启用'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : user.status === '锁定'
                                                                    ? 'bg-rose-50 text-rose-600'
                                                                    : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                    >
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openDrawer(user)}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                            title="查看详情"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                            title="编辑"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(user)}
                                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                            title={user.status === '启用' ? '停用' : '启用'}
                                                        >
                                                            {user.status === '启用' ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                            title="删除"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 分页 */}
                    {filteredAndSortedUsers.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>共 {filteredAndSortedUsers.length} 条</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="border border-slate-200 rounded px-2 py-1 text-xs"
                                >
                                    <option value={10}>10 条/页</option>
                                    <option value={20}>20 条/页</option>
                                    <option value={50}>50 条/页</option>
                                    <option value={100}>100 条/页</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    首页
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    上一页
                                </button>
                                <span className="px-3 py-1 text-sm text-slate-600 bg-slate-100 rounded">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    下一页
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    末页
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* 创建/编辑弹窗 */}
            {modalOpen && draftUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {modalMode === 'create' ? '新建用户' : '编辑用户'}
                                    </h3>
                                    <p className="text-xs text-slate-500">配置用户信息与组织归属。</p>
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
                                        <label className="text-xs font-semibold text-slate-600">姓名</label>
                                        <input
                                            value={draftUser.name}
                                            onChange={(event) => setDraftUser({ ...draftUser, name: event.target.value })}
                                            placeholder="用户姓名"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">邮箱</label>
                                        <input
                                            value={draftUser.email}
                                            onChange={(event) => setDraftUser({ ...draftUser, email: event.target.value })}
                                            placeholder="name@company.com"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">手机号</label>
                                        <input
                                            value={draftUser.phone}
                                            onChange={(event) => setDraftUser({ ...draftUser, phone: event.target.value })}
                                            placeholder="138xxxxxxx"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">所属组织</label>
                                        <select
                                            value={draftUser.deptId}
                                            onChange={(event) =>
                                                setDraftUser({ ...draftUser, deptId: event.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">角色</label>
                                        <select
                                            value={draftUser.role}
                                            onChange={(event) => setDraftUser({ ...draftUser, role: event.target.value })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">状态</label>
                                        <select
                                            value={draftUser.status}
                                            onChange={(event) =>
                                                setDraftUser({ ...draftUser, status: event.target.value as UserStatus })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="启用">启用</option>
                                            <option value="停用">停用</option>
                                            <option value="锁定">锁定</option>
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
                                    {modalMode === 'create' ? '创建用户' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 详情抽屉 */}
            {drawerOpen && activeUser && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-slate-900/20" onClick={closeDrawer} />
                    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-slate-800">用户详情</h3>
                            <button
                                onClick={closeDrawer}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-xl font-semibold text-slate-800">{activeUser.name}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{activeUser.role}</p>
                                </div>
                                <span
                                    className={`text-sm px-3 py-1 rounded-full font-medium ${
                                        activeUser.status === '启用'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : activeUser.status === '锁定'
                                                ? 'bg-rose-50 text-rose-600'
                                                : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {activeUser.status}
                                </span>
                            </div>

                            <div className="grid gap-3">
                                {[
                                    { label: '邮箱', value: activeUser.email, icon: Mail },
                                    { label: '手机号', value: activeUser.phone, icon: Phone },
                                    { label: '所属组织', value: getDeptName(activeUser.deptId), icon: Building2 },
                                    { label: '创建时间', value: activeUser.createdAt, icon: BadgeCheck },
                                    { label: '最近登录', value: activeUser.lastLogin, icon: null }
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg border border-slate-200 p-4">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{item.label}</span>
                                            {item.icon && <item.icon size={16} className="text-indigo-500" />}
                                        </div>
                                        <div className="mt-2 text-sm font-semibold text-slate-800">{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <h5 className="text-sm font-semibold text-slate-700 mb-3">快捷操作</h5>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            openEditModal(activeUser);
                                            closeDrawer();
                                        }}
                                        className="px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
                                    >
                                        <Pencil size={14} /> 编辑
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleToggleStatus(activeUser);
                                            closeDrawer();
                                        }}
                                        className="px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
                                    >
                                        {activeUser.status === '启用' ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {activeUser.status === '启用' ? '停用' : '启用'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDelete(activeUser);
                                            closeDrawer();
                                        }}
                                        className="col-span-2 px-3 py-2 text-sm text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} /> 删除用户
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementView;
