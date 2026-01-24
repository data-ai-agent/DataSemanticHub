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
    Download,
    Lock,
    Unlock,
    MoreHorizontal,
    Clock,
    Shield,
    AlertTriangle,
    Info,
    History,
    UserPlus,
    Briefcase
} from 'lucide-react';
import {
    userManagementService,
    type User as ApiUser,
    type RoleBinding as ApiRoleBinding,
    type AuditLog as ApiAuditLog,
    type GetStatisticsResp,
    type UserStatusCode
} from '../services/userManagement';


type UserStatus = '未激活' | '启用' | '停用' | '锁定' | '归档';

type Department = {
    id: string;
    name: string;
    parentId: string | null;
    order: number;
};

type RoleBinding = {
    orgId: string;
    position?: string;  // 岗位职责
    permissionRole?: string;  // 权限角色
};

type AuditLog = {
    id: number;
    action: string;
    operator: string;
    timestamp: string;
    changes?: Record<string, unknown>;
};

type UserDetail = {
    roleBindings: RoleBinding[];
    auditLogs: AuditLog[];
};

type UserItem = {
    id: string;
    name: string;
    email: string;
    phone: string;
    deptId: string;  // Primary org
    roleBindings: RoleBinding[];
    status: UserStatus;
    accountSource: '本地' | 'SSO';
    lastLogin: string;
    createdAt: string;
    lockReason?: string;
    lockTime?: string;
    lockBy?: string;
};

type SortField = 'name' | 'status' | 'createdAt' | null;
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

// 岗位职责 (Org-scoped responsibilities)
const positions = [
    '语义治理负责人',
    '语义治理专员',
    '版本委员会成员',
    '数据质量管理员',
    '安全审计',
    '数据服务运营',
    '业务分析师'
];

// 权限角色 (RBAC Permission Roles)
const permissionRoles = [
    '平台管理员',
    '审批人',
    '编辑者',
    '只读用户'
];

const formatDate = () => new Date().toISOString().split('T')[0];

const statusLabelMap: Record<number, UserStatus> = {
    0: '未激活',
    1: '启用',
    2: '停用',
    3: '锁定',
    4: '归档'
};

const statusCodeMap: Record<UserStatus, UserStatusCode> = {
    '未激活': 0,
    '启用': 1,
    '停用': 2,
    '锁定': 3,
    '归档': 4
};

const accountSourceLabelMap: Record<string, '本地' | 'SSO'> = {
    local: '本地',
    sso: 'SSO'
};

const accountSourceCodeMap: Record<'本地' | 'SSO', 'local' | 'sso'> = {
    '本地': 'local',
    'SSO': 'sso'
};

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (num: number) => `${num}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const mapRoleBindings = (bindings: ApiRoleBinding[]): RoleBinding[] => (
    bindings.map((rb) => ({
        orgId: rb.org_id,
        position: rb.position,
        permissionRole: rb.permission_role
    }))
);

const mapAuditLogs = (logs: ApiAuditLog[]): AuditLog[] => (
    logs.map((log) => ({
        id: log.id,
        action: log.action,
        operator: log.operator,
        timestamp: formatDateTime(log.timestamp),
        changes: log.changes
    }))
);

const mapApiUser = (user: ApiUser): UserItem => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    deptId: user.dept_id ?? '',
    roleBindings: [],
    status: statusLabelMap[user.status] ?? '停用',
    accountSource: accountSourceLabelMap[user.account_source] ?? '本地',
    lastLogin: formatDateTime(user.last_login),
    createdAt: formatDateTime(user.created_at)
});

const formatAuditAction = (action: string) => {
    switch (action) {
        case 'create':
            return '账号创建';
        case 'update':
            return '信息更新';
        case 'delete':
            return '账号删除';
        case 'unlock':
            return '账号解锁';
        case 'batch_update_status':
            return '状态更新';
        case 'reset_password':
            return '密码重置';
        default:
            return action;
    }
};

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const UserManagementView = () => {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [userDetails, setUserDetails] = useState<Record<string, UserDetail>>({});
    const [stats, setStats] = useState<GetStatisticsResp | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [listLoading, setListLoading] = useState(false);
    const [activeDeptId, setActiveDeptId] = useState<string>('all');
    const [activeUserId, setActiveUserId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
    const [positionFilter, setPositionFilter] = useState('all');
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
    const [showValidation, setShowValidation] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    const mergedUsers = useMemo(() => (
        users.map((user) => ({
            ...user,
            roleBindings: userDetails[user.id]?.roleBindings ?? user.roleBindings
        }))
    ), [users, userDetails]);

    const displayUsers = useMemo(() => {
        let result = mergedUsers;
        if (positionFilter !== 'all') {
            result = result.filter((user) => user.roleBindings.some((rb) => rb.position === positionFilter));
        }
        if (sortField === 'status') {
            const order = sortOrder === 'asc' ? 1 : -1;
            result = [...result].sort((a, b) => (statusCodeMap[a.status] - statusCodeMap[b.status]) * order);
        }
        return result;
    }, [mergedUsers, positionFilter, sortField, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const activeUser = mergedUsers.find((user) => user.id === activeUserId);
    const activeAuditLogs = activeUserId ? (userDetails[activeUserId]?.auditLogs ?? []) : [];
    const totalUsers = stats?.total ?? 0;
    const enabledUsers = stats?.active ?? 0;
    const lockedUsers = stats?.locked ?? 0;
    // Governance KPIs
    const inactiveUsers = stats?.inactive ?? 0;
    const noOrgUsers = stats?.no_org_binding ?? 0;
    const noPermissionUsers = stats?.no_permission_role ?? 0;

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const resolveSortField = (field: SortField) => {
        if (field === 'name') return 'name';
        if (field === 'createdAt') return 'created_at';
        return undefined;
    };

    const fetchUsers = useCallback(async () => {
        setListLoading(true);
        try {
            const response = await userManagementService.listUsers({
                page: currentPage,
                page_size: pageSize,
                keyword: debouncedSearchTerm.trim() || undefined,
                dept_id: activeDeptId === 'all' ? undefined : activeDeptId,
                status: statusFilter === 'all' ? undefined : statusCodeMap[statusFilter],
                sort_field: resolveSortField(sortField),
                sort_order: resolveSortField(sortField) ? sortOrder : undefined
            });
            setUsers(response.users.map(mapApiUser));
            setTotalCount(response.total);
            setSelectedUserIds(new Set());
        } catch (error: any) {
            showToast(error?.message || '用户列表加载失败', 'error');
        } finally {
            setListLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearchTerm, activeDeptId, statusFilter, sortField, sortOrder, showToast]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await userManagementService.getStatistics();
            setStats(response);
        } catch (error: any) {
            showToast(error?.message || '统计信息加载失败', 'error');
        }
    }, [showToast]);

    const ensureUserDetail = useCallback(async (userId: string) => {
        if (userDetails[userId]) return userDetails[userId];
        const response = await userManagementService.getUser(userId);
        const detail = {
            roleBindings: mapRoleBindings(response.role_bindings),
            auditLogs: mapAuditLogs(response.audit_logs)
        };
        setUserDetails((prev) => ({ ...prev, [userId]: detail }));
        return detail;
    }, [userDetails]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, statusFilter, activeDeptId]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        const missingIds = users.filter((user) => !userDetails[user.id]).map((user) => user.id);
        if (missingIds.length === 0) return;
        let cancelled = false;

        const loadDetails = async () => {
            const results = await Promise.allSettled(missingIds.map((id) => userManagementService.getUser(id)));
            if (cancelled) return;
            setUserDetails((prev) => {
                const next = { ...prev };
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        next[missingIds[index]] = {
                            roleBindings: mapRoleBindings(result.value.role_bindings),
                            auditLogs: mapAuditLogs(result.value.audit_logs)
                        };
                    }
                });
                return next;
            });
        };

        loadDetails();
        return () => {
            cancelled = true;
        };
    }, [users, userDetails]);

    const openCreateModal = () => {
        setModalMode('create');
        setErrorMessage(null); // 清除错误信息
        setDraftUser({
            id: `user_${Date.now()}`,
            name: '',
            email: '',
            phone: '',
            deptId: activeDeptId === 'all' ? departments[0]?.id ?? '' : activeDeptId,
            roleBindings: [],
            status: '启用',
            accountSource: '本地',
            lastLogin: '-',
            createdAt: formatDate()
        });
        setModalOpen(true);
    };

    const openEditModal = (user: UserItem) => {
        const openWithDetail = async () => {
            setModalMode('edit');
            try {
                const detail = await ensureUserDetail(user.id);
                setDraftUser({ ...user, roleBindings: detail?.roleBindings ?? user.roleBindings });
            } catch (error: any) {
                showToast(error?.message || '加载用户详情失败', 'error');
                setDraftUser({ ...user });
            } finally {
                setErrorMessage(null); // 清除错误信息
                setModalOpen(true);
            }
        };

        void openWithDetail();
    };

    const openDrawer = (user: UserItem) => {
        setActiveUserId(user.id);
        setDrawerOpen(true);
        ensureUserDetail(user.id).catch((error: any) => {
            showToast(error?.message || '加载用户详情失败', 'error');
        });
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftUser(null);
        setShowValidation(false);
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

    const handleSave = async () => {
        if (!draftUser) {
            return;
        }

        // 显示验证提示
        setShowValidation(true);
        setErrorMessage(null);

        // 验证必填字段
        if (!draftUser.name.trim() || !draftUser.deptId || !draftUser.phone || !draftUser.phone.trim()) {
            return;
        }

        // 验证邮箱格式（如果填写了）
        if (draftUser.email && !validateEmail(draftUser.email)) {
            showToast('请输入有效的邮箱地址', 'error');
            return;
        }

        // 验证手机号格式
        if (!validatePhone(draftUser.phone)) {
            showToast('请输入有效的手机号码（11位数字）', 'error');
            return;
        }

        const roleBindings = draftUser.roleBindings.map((rb) => ({
            org_id: rb.orgId || draftUser.deptId,
            position: rb.position,
            permission_role: rb.permissionRole
        }));

        try {
            if (modalMode === 'create') {
                const response = await userManagementService.createUser({
                    name: draftUser.name,
                    email: draftUser.email,
                    phone: draftUser.phone.trim(),
                    dept_id: draftUser.deptId,
                    role_bindings: roleBindings.length > 0 ? roleBindings : undefined,
                    account_source: accountSourceCodeMap[draftUser.accountSource] ?? 'local',
                    send_invitation: false
                });

                if (draftUser.status !== '未激活') {
                    const targetStatus = statusCodeMap[draftUser.status];
                    if (targetStatus !== 0) {
                        await userManagementService.batchUpdateStatus({
                            user_ids: [response.user_id],
                            status: targetStatus,
                            reason: draftUser.status === '锁定' ? '创建时锁定' : undefined
                        });
                    }
                }

                showToast('用户创建成功', 'success');
            } else {
                await userManagementService.updateUser(draftUser.id, {
                    name: draftUser.name,
                    phone: draftUser.phone || '',
                    dept_id: draftUser.deptId,
                    role_bindings: roleBindings
                });
                setUserDetails((prev) => ({
                    ...prev,
                    [draftUser.id]: {
                        roleBindings: draftUser.roleBindings,
                        auditLogs: prev[draftUser.id]?.auditLogs ?? []
                    }
                }));
                showToast('用户信息已更新', 'success');
            }
            closeModal();
            await fetchUsers();
            await fetchStats();
        } catch (error: any) {
            setErrorMessage(error?.message || '操作失败');
        }
    };

    const handleToggleStatus = async (user: UserItem) => {
        try {
            if (user.status === '锁定') {
                await userManagementService.unlockUser(user.id, '手动解锁');
                showToast('用户已解锁', 'success');
            } else {
                const nextStatus: UserStatus = user.status === '启用' ? '停用' : '启用';
                await userManagementService.batchUpdateStatus({
                    user_ids: [user.id],
                    status: statusCodeMap[nextStatus]
                });
                showToast(`用户已${nextStatus === '启用' ? '启用' : '停用'}`, 'success');
            }
            await fetchUsers();
            await fetchStats();
        } catch (error: any) {
            showToast(error?.message || '更新用户状态失败', 'error');
        }
    };

    const handleDelete = async (user: UserItem) => {
        try {
            await userManagementService.deleteUser(user.id, { force: false });
            if (activeUserId === user.id) {
                setActiveUserId('');
                if (drawerOpen) setDrawerOpen(false);
            }
            setUserDetails((prev) => {
                const next = { ...prev };
                delete next[user.id];
                return next;
            });
            setSelectedUserIds((prev) => {
                const next = new Set(prev);
                next.delete(user.id);
                return next;
            });
            showToast('用户已删除', 'success');
            await fetchUsers();
            await fetchStats();
        } catch (error: any) {
            showToast(error?.message || '删除用户失败', 'error');
        }
    };

    const handleBatchDelete = async () => {
        if (selectedUserIds.size === 0) return;
        const targets = Array.from(selectedUserIds);
        const results = await Promise.allSettled(targets.map((id) => userManagementService.deleteUser(id, { force: false })));
        const successCount = results.filter((result) => result.status === 'fulfilled').length;
        const failedCount = results.length - successCount;
        if (activeUserId && selectedUserIds.has(activeUserId)) {
            setActiveUserId('');
            if (drawerOpen) setDrawerOpen(false);
        }
        setSelectedUserIds(new Set());
        showToast(`已删除 ${successCount} 个用户${failedCount ? `，失败 ${failedCount} 个` : ''}`, failedCount ? 'error' : 'success');
        await fetchUsers();
        await fetchStats();
    };

    const handleBatchToggleStatus = async (status: UserStatus) => {
        if (selectedUserIds.size === 0) return;
        try {
            const response = await userManagementService.batchUpdateStatus({
                user_ids: Array.from(selectedUserIds),
                status: statusCodeMap[status],
                reason: status === '锁定' ? '批量锁定' : undefined
            });
            setSelectedUserIds(new Set());
            if (response.failed_count > 0) {
                showToast(`已更新 ${response.success_count} 个用户，失败 ${response.failed_count} 个`, 'error');
            } else {
                showToast(`已批量${status === '启用' ? '启用' : status === '停用' ? '停用' : '锁定'}用户`, 'success');
            }
            await fetchUsers();
            await fetchStats();
        } catch (error: any) {
            showToast(error?.message || '批量更新失败', 'error');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(new Set(displayUsers.map((u) => u.id)));
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
            const userCount = mergedUsers.filter((u) => u.deptId === dept.id).length;

            return (
                <div key={dept.id}>
                    <div
                        className={`group flex items-center gap-2 rounded-lg p-2 text-sm transition-colors cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                        style={{ paddingLeft: level * 20 + 8 }}
                        onClick={() => setActiveDeptId(dept.id)}
                    >
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(dept.id);
                            }}
                            className={`p-0.5 rounded hover:bg-black/5 ${hasChildren ? 'visible' : 'invisible'}`}
                        >
                            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                        </button>

                        <div className="flex-1 flex items-center gap-2 min-w-0">
                            <Building2 size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />

                            <span className={`font-medium truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {dept.name}
                            </span>
                        </div>

                        <span className="text-xs text-slate-400 scale-90 origin-left flex-shrink-0 ml-auto">
                            {userCount}
                        </span>
                    </div>
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
                {debouncedSearchTerm || statusFilter !== 'all' || positionFilter !== 'all' || activeDeptId !== 'all'
                    ? '尝试调整筛选条件或清除搜索'
                    : '点击下方按钮创建第一个用户'}
            </p>
            {!debouncedSearchTerm && statusFilter === 'all' && positionFilter === 'all' && activeDeptId === 'all' && (
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

    const allSelected = displayUsers.length > 0 && displayUsers.every((u) => selectedUserIds.has(u.id));
    const someSelected = displayUsers.some((u) => selectedUserIds.has(u.id));

    return (
        <div className="space-y-6 h-full flex flex-col pt-0 pb-2 px-1">
            {/* Toast 通知 */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[280px] ${toast.type === 'success'
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
            <div className="grid gap-4 px-1 md:grid-cols-5">
                {[
                    { label: '用户总数', value: `${totalUsers}`, note: '平台用户', color: 'indigo', icon: Users },
                    { label: '启用用户', value: `${enabledUsers}`, note: '可登录使用', color: 'emerald', icon: Check },
                    { label: '锁定用户', value: `${lockedUsers}`, note: '安全冻结', color: 'rose', icon: Lock },
                    { label: '未激活', value: `${inactiveUsers}`, note: '待邀请确认', color: 'amber', icon: Clock },
                    { label: '无权限用户', value: `${noPermissionUsers}`, note: '缺少角色绑定', color: 'slate', icon: AlertTriangle }
                ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">{item.label}</p>
                            <item.icon size={16} className={`text-${item.color}-400`} />
                        </div>
                        <div className={`mt-2 text-2xl font-semibold text-${item.color}-600`}>{item.value}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[0.50fr_2.0fr]">
                {/* 左侧组织树 */}
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-700">组织架构</h3>
                        <span className="text-xs text-slate-400">{departments.length} 个</span>
                    </div>
                    <div className="space-y-1">
                        <button
                            type="button"
                            onClick={() => setActiveDeptId('all')}
                            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${activeDeptId === 'all'
                                ? 'bg-indigo-50 text-indigo-600 font-medium'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Building2 size={14} />
                            <span>全部组织</span>
                            <span className="ml-auto text-slate-400">{totalUsers}</span>
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
                                value={positionFilter}
                                onChange={(event) => setPositionFilter(event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="all">全部岗位</option>
                                {positions.map((pos: string) => (
                                    <option key={pos} value={pos}>
                                        {pos}
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
                                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
                                >
                                    <Eye size={12} /> 批量启用
                                </button>
                                <button
                                    onClick={() => handleBatchToggleStatus('停用')}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 flex items-center gap-1"
                                >
                                    <EyeOff size={12} /> 批量停用
                                </button>
                                <button
                                    onClick={() => handleBatchToggleStatus('锁定')}
                                    className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 flex items-center gap-1"
                                >
                                    <Lock size={12} /> 批量锁定
                                </button>
                                <button
                                    onClick={() => showToast(`已导出 ${selectedUserIds.size} 个用户`, 'success')}
                                    className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 flex items-center gap-1"
                                >
                                    <Download size={12} /> 导出所选
                                </button>
                                <button
                                    onClick={handleBatchDelete}
                                    className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> 批量删除
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
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                        岗位职责
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                                        权限角色
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
                                {listLoading ? (
                                    <tr>
                                        <td colSpan={9}>
                                            <div className="p-4">
                                                {renderSkeleton()}
                                            </div>
                                        </td>
                                    </tr>
                                ) : displayUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={9}>
                                            <div className="py-8">
                                                {renderEmptyState()}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayUsers.map((user) => {
                                        const isSelected = selectedUserIds.has(user.id);
                                        return (
                                            <tr
                                                key={user.id}
                                                className={`border-b border-slate-100 hover:bg-indigo-50/30 transition ${isSelected ? 'bg-indigo-50/50' : ''
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
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roleBindings.length > 0 ? user.roleBindings.map((rb, idx) => (
                                                            <span key={idx} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                                                                {rb.position || '-'}
                                                            </span>
                                                        )) : <span className="text-xs text-slate-400">无岗位</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roleBindings.length > 0 ? user.roleBindings.map((rb, idx) => (
                                                            <span key={idx} className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                                                                {rb.permissionRole || '-'}
                                                            </span>
                                                        )) : <span className="text-xs text-slate-400">无权限</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-slate-600">{getDeptName(user.deptId)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full font-medium ${user.status === '启用'
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
                                                            title={user.status === '启用' ? '停用' : user.status === '锁定' ? '解锁' : '启用'}
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
                    {totalCount > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>共 {totalCount} 条</span>
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
                                {errorMessage && (
                                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-sm animate-in fade-in slide-in-from-top-2">
                                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">
                                            姓名 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={draftUser.name}
                                            onChange={(event) => setDraftUser({ ...draftUser, name: event.target.value })}
                                            placeholder="请输入姓名"
                                            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none ${showValidation && !draftUser.name.trim()
                                                ? 'border-red-500 focus:border-red-500'
                                                : 'border-slate-200 focus:border-indigo-500'
                                                }`}
                                        />
                                        {showValidation && !draftUser.name.trim() && (
                                            <p className="text-xs text-red-500 mt-1">请输入用户姓名</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">
                                            所属组织 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={draftUser.deptId}
                                            onChange={(event) =>
                                                setDraftUser({ ...draftUser, deptId: event.target.value })
                                            }
                                            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none ${showValidation && !draftUser.deptId
                                                ? 'border-red-500 focus:border-red-500'
                                                : 'border-slate-200 focus:border-indigo-500'
                                                }`}
                                        >
                                            <option value="">请选择所属组织</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                        {showValidation && !draftUser.deptId && (
                                            <p className="text-xs text-red-500 mt-1">请选择所属组织</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">邮箱</label>
                                        <input
                                            value={draftUser.email}
                                            onChange={(event) => setDraftUser({ ...draftUser, email: event.target.value })}
                                            placeholder="name@company.com"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">
                                            手机号 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={draftUser.phone}
                                            onChange={(event) => setDraftUser({ ...draftUser, phone: event.target.value })}
                                            placeholder="请输入手机号"
                                            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none ${showValidation && (!draftUser.phone || !draftUser.phone.trim())
                                                ? 'border-red-500 focus:border-red-500'
                                                : 'border-slate-200 focus:border-indigo-500'
                                                }`}
                                        />
                                        {showValidation && (!draftUser.phone || !draftUser.phone.trim()) && (
                                            <p className="text-xs text-red-500 mt-1">请输入手机号</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">岗位职责</label>
                                        <select
                                            value={draftUser.roleBindings[0]?.position || ''}
                                            onChange={(event) => setDraftUser({
                                                ...draftUser,
                                                roleBindings: [{
                                                    orgId: draftUser.deptId,
                                                    position: event.target.value,
                                                    permissionRole: draftUser.roleBindings[0]?.permissionRole
                                                }]
                                            })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="">请选择岗位</option>
                                            {positions.map((pos: string) => (
                                                <option key={pos} value={pos}>
                                                    {pos}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">权限角色</label>
                                        <select
                                            value={draftUser.roleBindings[0]?.permissionRole || ''}
                                            onChange={(event) => setDraftUser({
                                                ...draftUser,
                                                roleBindings: [{
                                                    orgId: draftUser.deptId,
                                                    position: draftUser.roleBindings[0]?.position,
                                                    permissionRole: event.target.value
                                                }]
                                            })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="">请选择权限</option>
                                            {permissionRoles.map((role: string) => (
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
                                    <p className="text-sm text-slate-500 mt-1">
                                        {activeUser.roleBindings.length > 0
                                            ? activeUser.roleBindings.map(rb => rb.position).filter(Boolean).join(', ')
                                            : '无岗位'
                                        }
                                    </p>
                                </div>
                                <span
                                    className={`text-sm px-3 py-1 rounded-full font-medium ${activeUser.status === '启用'
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
                                    { label: '账号来源', value: activeUser.accountSource, icon: Shield },
                                    { label: '创建时间', value: activeUser.createdAt, icon: Clock },
                                    { label: '最近登录', value: activeUser.lastLogin, icon: History }
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

                            {/* 角色绑定区 */}
                            <div className="border-t border-slate-200 pt-4">
                                <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <Briefcase size={14} /> 组织与职责绑定
                                </h5>
                                {activeUser.roleBindings.length > 0 ? (
                                    <div className="space-y-2">
                                        {activeUser.roleBindings.map((rb, idx) => (
                                            <div key={idx} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-slate-600">{getDeptName(rb.orgId)}</span>
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    {rb.position && (
                                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{rb.position}</span>
                                                    )}
                                                    {rb.permissionRole && (
                                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{rb.permissionRole}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">无角色绑定</p>
                                )}
                            </div>

                            {/* 锁定信息区 (仅锁定用户显示) */}
                            {activeUser.status === '锁定' && (
                                <div className="border-t border-slate-200 pt-4">
                                    <h5 className="text-sm font-semibold text-rose-600 mb-3 flex items-center gap-2">
                                        <Lock size={14} /> 锁定信息
                                    </h5>
                                    <div className="rounded-lg border border-rose-200 p-3 bg-rose-50">
                                        <div className="text-xs text-rose-700 space-y-1">
                                            <p><strong>锁定原因：</strong>{activeUser.lockReason || '-'}</p>
                                            <p><strong>锁定时间：</strong>{activeUser.lockTime || '-'}</p>
                                            <p><strong>操作者：</strong>{activeUser.lockBy || '-'}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleToggleStatus(activeUser);
                                                closeDrawer();
                                            }}
                                            className="mt-3 w-full px-3 py-2 text-xs font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 flex items-center justify-center gap-1"
                                        >
                                            <Unlock size={12} /> 解锁用户
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 审计日志区 */}
                            <div className="border-t border-slate-200 pt-4">
                                <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <History size={14} /> 变更记录
                                </h5>
                                {activeAuditLogs.length > 0 ? (
                                    <div className="space-y-2 text-xs text-slate-500">
                                        {activeAuditLogs.map((log) => (
                                            <div key={log.id} className="flex justify-between py-2 border-b border-slate-100">
                                                <span>{formatAuditAction(log.action)}</span>
                                                <span className="text-slate-400">{log.operator} · {log.timestamp}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">暂无变更记录</p>
                                )}
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
