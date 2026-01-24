import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    ShieldCheck,
    KeyRound,
    Plus,
    Search,
    Check,
    Lock,
    UserCog,
    Layers,
    Sparkles,
    Pencil,
    Trash2,
    X,
    SlidersHorizontal,
    ArrowUpDown,
    Copy,
    History,
    AlertTriangle,
    RefreshCw,
    UserPlus,
    FolderPlus,
    FileText,
    Link2
} from 'lucide-react';
import RoleChangeConfirmModal from './components/RoleChangeConfirmModal';
import { EffectivePermissionPreviewModal } from './components/EffectivePermissionPreviewModal';
import SoDRulesModal from './components/SoDRulesModal';

type ScopeType = 'Global' | 'Tenant' | 'Organization' | 'Domain';

type Scope = {
    type: ScopeType;
    ids: string[]; // e.g., ['*'], ['org_1'], ['domain_sales']
};

type RiskLevel = '低' | '中' | '高';

type Role = {
    id: string;
    name: string;
    code: string;
    description: string;
    scope: Scope;
    memberCount: number;
    status: '启用' | '停用';
    builtIn: boolean;
    updatedAt: string;
    updatedBy: string;
    riskLevel: RiskLevel;
    version: string;
    dataFilters: string[];
    parentRoleIds: string[];
};

type PermissionItem = {
    module: string;
    actions: string[];
    operationPoints?: string[]; // Granular permissions e.g. ['approve', 'rollback']
    note: string;
};

const initialRoles: Role[] = [
    {
        id: 'role_admin',
        name: '平台管理员',
        code: 'platform_admin',
        description: '负责平台配置、权限策略与跨域治理。',
        scope: { type: 'Global', ids: ['*'] },
        memberCount: 6,
        status: '启用',
        builtIn: true,
        updatedAt: '2024-06-28',
        updatedBy: '系统',
        riskLevel: '高',
        version: 'v1.3',
        dataFilters: ['SecurityLevel <= 2'],
        parentRoleIds: []
    },
    {
        id: 'role_governance',
        name: '语义治理负责人',
        code: 'semantic_owner',
        description: '主导语义裁决、版本发布与审批流程。',
        scope: { type: 'Organization', ids: ['org_group'] },
        memberCount: 14,
        status: '启用',
        builtIn: true,
        updatedAt: '2024-06-24',
        updatedBy: '韩梅',
        riskLevel: '中',
        version: 'v1.2',
        dataFilters: ['Dept IN (治理一组, 治理二组)'],
        parentRoleIds: ['role_admin']
    },
    {
        id: 'role_ops',
        name: '数据服务运营',
        code: 'data_service_ops',
        description: '保障问数、找数与数据服务的稳定运营。',
        scope: { type: 'Domain', ids: ['domain_service', 'domain_search'] },
        memberCount: 23,
        status: '启用',
        builtIn: false,
        updatedAt: '2024-06-18',
        updatedBy: '刘维',
        riskLevel: '中',
        version: 'v1.1',
        dataFilters: [],
        parentRoleIds: []
    },
    {
        id: 'role_audit',
        name: '安全审计',
        code: 'security_auditor',
        description: '审阅语义变更、权限使用与合规日志。',
        scope: { type: 'Tenant', ids: ['tenant_default'] },
        memberCount: 5,
        status: '启用',
        builtIn: true,
        updatedAt: '2024-06-12',
        updatedBy: '系统',
        riskLevel: '低',
        version: 'v1.0',
        dataFilters: ['AuditScope = "semantic"'],
        parentRoleIds: []
    }
];

const actionLabels = ['查看', '编辑', '发布', '管理'];

const initialRolePermissions: Record<string, PermissionItem[]> = {
    role_admin: [
        { module: '语义资产', actions: ['查看', '编辑', '发布', '管理'], note: '全量可操作' },
        { module: '语义版本', actions: ['查看', '编辑', '发布', '管理'], note: '版本策略配置' },
        { module: '数据安全', actions: ['查看', '管理'], note: '策略与审计' },
        { module: '数据服务', actions: ['查看', '编辑', '发布', '管理'], note: '服务配置与路由' }
    ],
    role_governance: [
        { module: '语义资产', actions: ['查看', '编辑', '发布'], note: '裁决与发布' },
        { module: '语义版本', actions: ['查看', '编辑', '发布'], note: '版本评审' },
        { module: '数据质量', actions: ['查看', '管理'], note: '质量规则' },
        { module: '业务场景', actions: ['查看', '编辑'], note: '编排确认' }
    ],
    role_ops: [
        { module: '数据服务', actions: ['查看', '编辑', '发布'], note: '服务运营' },
        { module: '问数/找数', actions: ['查看', '编辑'], note: '模板与词典' },
        { module: '语义资产', actions: ['查看'], note: '引用语义' },
        { module: '数据质量', actions: ['查看'], note: '质量追踪' }
    ],
    role_audit: [
        { module: '审计日志', actions: ['查看', '管理'], note: '合规审计' },
        { module: '权限策略', actions: ['查看'], note: '只读' },
        { module: '语义版本', actions: ['查看'], note: '变更追溯' },
        { module: '数据安全', actions: ['查看'], note: '风险核查' }
    ]
};

const permissionCatalog: PermissionItem[] = [
    { module: '语义资产', actions: [], note: '裁决与发布' },
    { module: '语义版本', actions: [], note: '版本评审与回溯' },
    { module: '数据质量', actions: [], note: '质量规则维护' },
    { module: '数据安全', actions: [], note: '安全策略与审计' },
    { module: '数据服务', actions: [], note: '服务配置与路由' },
    { module: '问数/找数', actions: [], note: '模板与词典' },
    { module: '业务场景', actions: [], note: '场景编排' },
    { module: '资源知识网络', actions: [], note: '关系维护' }
];

const operationPointDefinitions: Record<string, { label: string; key: string; parentAction: string }[]> = {
    '语义资产': [
        { label: '强制解锁', key: 'force_unlock', parentAction: '管理' },
        { label: '变更历史回滚', key: 'revert_history', parentAction: '编辑' },
        { label: '批量下架', key: 'batch_offline', parentAction: '发布' }
    ],
    '语义版本': [
        { label: '版本审批', key: 'approve_version', parentAction: '发布' },
        { label: '版本回滚', key: 'rollback_version', parentAction: '管理' },
        { label: '强制发布', key: 'force_publish', parentAction: '管理' }
    ],
    '数据安全': [
        { label: '审计日志导出', key: 'export_audit', parentAction: '管理' },
        { label: '敏感级调整', key: 'adjust_sensitivity', parentAction: '编辑' }
    ]
};

const scopeOptions = [
    '语义资产',
    '版本中心',
    '数据质量',
    '数据安全',
    '数据服务',
    '问数',
    '找数',
    '业务场景',
    '资源知识网络'
];

const scopeTypeLabel: Record<ScopeType, string> = {
    Global: '全平台',
    Tenant: '租户',
    Organization: '组织',
    Domain: '数据域'
};

const riskStyles: Record<RiskLevel, string> = {
    '高': 'bg-rose-100 text-rose-700',
    '中': 'bg-amber-100 text-amber-700',
    '低': 'bg-emerald-100 text-emerald-700'
};

const riskOrder: Record<RiskLevel, number> = { '高': 3, '中': 2, '低': 1 };

const formatDate = () => new Date().toISOString().split('T')[0];

const normalizePermissions = (existing?: PermissionItem[]) => {
    const normalized = permissionCatalog.map((item) => {
        const match = existing?.find((permission) => permission.module === item.module);
        return match
            ? { ...item, actions: [...match.actions], note: match.note || item.note, operationPoints: match.operationPoints }
            : { ...item, actions: [] };
    });
    const extra = (existing ?? []).filter(
        (permission) => !permissionCatalog.some((catalog) => catalog.module === permission.module)
    );
    return [...normalized, ...extra.map((permission) => ({ ...permission, actions: [...permission.actions] }))];
};

const computeRiskLevel = (role: Role, permissions: PermissionItem[]): RiskLevel => {
    const hasManage = permissions.some((item) => item.actions.includes('管理'));
    const hasPublish = permissions.some((item) => item.actions.includes('发布'));
    if (role.scope.type === 'Global' && hasManage) return '高';
    if (hasManage || hasPublish) return '中';
    return '低';
};

const UserPermissionView = () => {
    const [rolesState, setRolesState] = useState<Role[]>(initialRoles);
    const [rolePermissionsState, setRolePermissionsState] = useState<Record<string, PermissionItem[]>>(
        initialRolePermissions
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRoleId, setActiveRoleId] = useState<string>(initialRoles[0]?.id ?? '');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [draftRole, setDraftRole] = useState<Role | null>(null);
    const [draftPermissions, setDraftPermissions] = useState<PermissionItem[]>([]);
    const [draftTemplateId, setDraftTemplateId] = useState('blank');
    const [showAdvancedPermissions, setShowAdvancedPermissions] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [statusFilter, setStatusFilter] = useState<'all' | Role['status']>('all');
    const [scopeFilter, setScopeFilter] = useState<'all' | ScopeType>('all');
    const [builtinFilter, setBuiltinFilter] = useState<'all' | 'builtin' | 'custom'>('all');
    const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
    const [sortBy, setSortBy] = useState<'updatedAt' | 'members' | 'risk'>('updatedAt');
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [showAdvancedMatrix, setShowAdvancedMatrix] = useState(false);
    const [showUnusedPerms, setShowUnusedPerms] = useState(false);
    const [rlsEnabled, setRlsEnabled] = useState(false);
    const [showSoDModal, setShowSoDModal] = useState(false);

    const templateOptions = useMemo(() => {
        const builtInTemplates = rolesState.filter((role) => role.builtIn);
        return [
            { id: 'blank', label: '空白模板', description: '从零配置权限' },
            ...builtInTemplates.map((role) => ({
                id: role.id,
                label: role.name,
                description: role.description
            }))
        ];
    }, [rolesState]);
    const activeTemplate = templateOptions.find((option) => option.id === draftTemplateId);

    const filteredRoles = useMemo(() => {
        const filtered = rolesState.filter(role => {
            const matchesSearch = `${role.name}${role.code}${role.description}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || role.status === statusFilter;
            const matchesScope = scopeFilter === 'all' || role.scope.type === scopeFilter;
            const matchesBuiltin = builtinFilter === 'all'
                || (builtinFilter === 'builtin' && role.builtIn)
                || (builtinFilter === 'custom' && !role.builtIn);
            const matchesRisk = riskFilter === 'all' || role.riskLevel === riskFilter;
            return matchesSearch && matchesStatus && matchesScope && matchesBuiltin && matchesRisk;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'members') return b.memberCount - a.memberCount;
            if (sortBy === 'risk') return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
            return b.updatedAt.localeCompare(a.updatedAt);
        });
    }, [rolesState, searchTerm, statusFilter, scopeFilter, builtinFilter, riskFilter, sortBy]);

    const activeRole = rolesState.find(role => role.id === activeRoleId);

    const permissionItems = useMemo(() => {
        if (!activeRole) return [];
        return normalizePermissions(rolePermissionsState[activeRole.id]);
    }, [activeRole, rolePermissionsState]);

    const roleCount = rolesState.length;
    const builtInCount = rolesState.filter((role) => role.builtIn).length;
    const policyCount = Object.values(rolePermissionsState).reduce(
        (sum, items) => sum + items.filter((item) => item.actions.length > 0).length,
        0
    );
    const riskCount = rolesState.filter((role) => role.riskLevel === '高').length;
    const auditTaskCount = 8;

    const unusedModules = new Set(['数据质量', '业务场景']);

    useEffect(() => {
        if (!modalOpen || modalMode !== 'create') {
            return;
        }
        if (draftTemplateId === 'blank') {
            setDraftPermissions(normalizePermissions());
            return;
        }
        setDraftPermissions(normalizePermissions(rolePermissionsState[draftTemplateId]));
    }, [draftTemplateId, modalMode, modalOpen, rolePermissionsState]);

    const openCreateModal = (templateId: string) => {
        const newRole: Role = {
            id: `role_${Date.now()}`,
            name: '',
            code: '',
            description: '',
            scope: { type: 'Global', ids: ['*'] },
            memberCount: 0,
            status: '启用',
            builtIn: false,
            updatedAt: formatDate(),
            updatedBy: '当前用户',
            riskLevel: '低',
            version: 'v1.0',
            dataFilters: [],
            parentRoleIds: []
        };
        setModalMode('create');
        setDraftRole(newRole);
        setDraftTemplateId(templateId);
        setDraftPermissions(
            templateId === 'blank'
                ? normalizePermissions()
                : normalizePermissions(rolePermissionsState[templateId])
        );
        setRlsEnabled(false);
        setModalOpen(true);
    };

    const openEditModal = (role: Role) => {
        setModalMode('edit');
        setDraftRole({ ...role });
        setDraftTemplateId('blank');
        setDraftPermissions(normalizePermissions(rolePermissionsState[role.id]));
        setRlsEnabled(role.dataFilters.length > 0);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftRole(null);
    };

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const handleCheckBeforeSave = () => {
        if (!draftRole) {
            return;
        }
        if (!draftRole.name.trim() || !draftRole.code.trim()) {
            alert('请填写角色名称与编码。');
            return;
        }
        setConfirmModalOpen(true);
    };

    const finalizeSave = () => {
        if (!draftRole) return;

        const nextRole = {
            ...draftRole,
            updatedAt: formatDate(),
            updatedBy: '当前用户',
            riskLevel: computeRiskLevel(draftRole, draftPermissions),
            dataFilters: rlsEnabled ? draftRole.dataFilters : []
        };
        if (modalMode === 'create') {
            setRolesState((prev) => [nextRole, ...prev]);
            setActiveRoleId(nextRole.id);
        } else {
            setRolesState((prev) => prev.map((role) => (role.id === nextRole.id ? nextRole : role)));
        }
        setRolePermissionsState((prev) => ({
            ...prev,
            [nextRole.id]: draftPermissions
        }));
        setConfirmModalOpen(false);
        closeModal();
    };

    const handleToggleStatus = () => {
        if (!activeRole) {
            return;
        }
        const nextStatus = activeRole.status === '启用' ? '停用' : '启用';
        setRolesState((prev) =>
            prev.map((role) =>
                role.id === activeRole.id ? { ...role, status: nextStatus, updatedAt: formatDate() } : role
            )
        );
    };

    const handleDeleteRole = (roleId: string) => {
        const role = rolesState.find((item) => item.id === roleId);
        if (!role || role.builtIn) {
            return;
        }
        if (!confirm('确定要删除该角色吗？')) {
            return;
        }
        const nextRoles = rolesState.filter((item) => item.id !== roleId);
        setRolesState(nextRoles);
        setRolePermissionsState((prev) => {
            const next = { ...prev };
            delete next[roleId];
            return next;
        });
        if (activeRoleId === roleId) {
            setActiveRoleId(nextRoles[0]?.id ?? '');
        }
    };

    const handleCloneRole = () => {
        if (!activeRole) return;
        const cloned = {
            ...activeRole,
            id: `role_${Date.now()}`,
            name: `${activeRole.name}-副本`,
            builtIn: false,
            memberCount: 0,
            version: 'v1.0',
            updatedAt: formatDate(),
            updatedBy: '当前用户'
        };
        setRolesState((prev) => [cloned, ...prev]);
        setRolePermissionsState((prev) => ({
            ...prev,
            [cloned.id]: normalizePermissions(rolePermissionsState[activeRole.id])
        }));
        setActiveRoleId(cloned.id);
    };

    const togglePermissionAction = (module: string, action: string) => {
        setDraftPermissions((prev) =>
            prev.map((item) =>
                item.module === module
                    ? {
                        ...item,
                        actions: item.actions.includes(action)
                            ? item.actions.filter((itemAction) => itemAction !== action)
                            : [...item.actions, action]
                    }
                    : item
            )
        );
    };

    const toggleOperationPoint = (module: string, pointKey: string) => {
        setDraftPermissions((prev) =>
            prev.map((item) => {
                if (item.module !== module) return item;
                const currentPoints = item.operationPoints || [];
                return {
                    ...item,
                    operationPoints: currentPoints.includes(pointKey)
                        ? currentPoints.filter(p => p !== pointKey)
                        : [...currentPoints, pointKey]
                };
            })
        );
    };

    const toggleRoleSelection = (roleId: string) => {
        setSelectedRoleIds((prev) =>
            prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
        );
    };

    const clearSelection = () => setSelectedRoleIds([]);

    const handleBatchStatus = (status: Role['status']) => {
        setRolesState((prev) => prev.map((role) => (
            selectedRoleIds.includes(role.id) ? { ...role, status, updatedAt: formatDate() } : role
        )));
        clearSelection();
    };

    const handleBatchDelete = () => {
        if (!confirm('确定批量删除已选角色吗？')) {
            return;
        }
        const deletableIds = selectedRoleIds.filter((id) => !rolesState.find((role) => role.id === id)?.builtIn);
        setRolesState((prev) => prev.filter((role) => !deletableIds.includes(role.id)));
        setRolePermissionsState((prev) => {
            const next = { ...prev };
            deletableIds.forEach((id) => delete next[id]);
            return next;
        });
        if (deletableIds.includes(activeRoleId)) {
            const nextRoles = rolesState.filter((role) => !deletableIds.includes(role.id));
            setActiveRoleId(nextRoles[0]?.id ?? '');
        }
        clearSelection();
    };

    const handleBatchRecertify = () => {
        alert('已发起权限重新认证任务');
        clearSelection();
    };

    const noRoleSelected = !activeRole;

    const navigateToModule = (moduleId: string) => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.set('tab', moduleId);
        window.history.pushState({ path: url.href }, '', url.href);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <div className="text-xs text-slate-400">平台管理 / 角色与权限</div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck size={22} className="text-indigo-600" />
                        角色与权限管理
                    </h2>
                    <p className="text-slate-500 mt-1">
                        为语义治理配置角色、权限与范围，确保语义裁决可控可审计。
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowPreviewModal(true)}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 flex items-center gap-2"
                    >
                        <ShieldCheck size={16} /> 有效权限预览
                    </button>
                    <button
                        onClick={() => navigateToModule('permission_templates')}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 flex items-center gap-2"
                    >
                        <FileText size={16} /> 权限模板
                    </button>
                    <button
                        onClick={() => setShowSoDModal(true)}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 flex items-center gap-2"
                    >
                        <AlertTriangle size={16} /> SoD 规则
                    </button>
                    <button
                        onClick={() => openCreateModal('blank')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建角色
                    </button>
                </div>
            </div>

            <div className="grid gap-4 px-1 md:grid-cols-4">
                {[{
                    label: '角色总数',
                    value: `${roleCount}`,
                    icon: Users,
                    note: `含 ${builtInCount} 个系统内置`,
                    onClick: () => setStatusFilter('all')
                }, {
                    label: '权限策略',
                    value: `${policyCount}`,
                    icon: KeyRound,
                    note: `覆盖 ${scopeOptions.length} 个域`,
                    onClick: () => setStatusFilter('all')
                }, {
                    label: '合规风险',
                    value: `${riskCount}`,
                    icon: AlertTriangle,
                    note: 'SoD 冲突/过度授权',
                    onClick: () => setRiskFilter('高')
                }, {
                    label: '审计任务',
                    value: `${auditTaskCount}`,
                    icon: Lock,
                    note: '近 7 日待处理',
                    onClick: () => navigateToModule('audit_log')
                }].map((item) => (
                    <button
                        key={item.label}
                        onClick={item.onClick}
                        className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm text-left hover:border-indigo-200"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">{item.label}</p>
                            <item.icon size={18} className="text-indigo-500" />
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-slate-800">{item.value}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                    </button>
                ))}
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[1.1fr_1.6fr]">
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="搜索角色名称、编码或描述"
                            className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                        />
                    </div>

                    <div className="grid gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部状态</option>
                                <option value="启用">启用</option>
                                <option value="停用">停用</option>
                            </select>
                            <select
                                value={scopeFilter}
                                onChange={(event) => setScopeFilter(event.target.value as typeof scopeFilter)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部范围</option>
                                <option value="Global">全平台</option>
                                <option value="Tenant">租户</option>
                                <option value="Organization">组织</option>
                                <option value="Domain">数据域</option>
                            </select>
                            <select
                                value={builtinFilter}
                                onChange={(event) => setBuiltinFilter(event.target.value as typeof builtinFilter)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部类型</option>
                                <option value="builtin">系统内置</option>
                                <option value="custom">自定义</option>
                            </select>
                            <select
                                value={riskFilter}
                                onChange={(event) => setRiskFilter(event.target.value as typeof riskFilter)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部风险</option>
                                <option value="高">高风险</option>
                                <option value="中">中风险</option>
                                <option value="低">低风险</option>
                            </select>
                            <button
                                onClick={() => {
                                    setStatusFilter('all');
                                    setScopeFilter('all');
                                    setBuiltinFilter('all');
                                    setRiskFilter('all');
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-slate-300"
                            >
                                重置
                            </button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={14} />
                                过滤与排序
                            </div>
                            <button
                                onClick={() => setSortBy(sortBy === 'updatedAt' ? 'members' : sortBy === 'members' ? 'risk' : 'updatedAt')}
                                className="flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                            >
                                <ArrowUpDown size={12} />
                                {sortBy === 'updatedAt' && '更新时间'}
                                {sortBy === 'members' && '成员数'}
                                {sortBy === 'risk' && '风险等级'}
                            </button>
                        </div>
                        {selectedRoleIds.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                                <span>已选 {selectedRoleIds.length} 个角色</span>
                                <button
                                    onClick={() => handleBatchStatus('启用')}
                                    className="rounded-full border border-indigo-200 px-2 py-0.5 hover:bg-white"
                                >
                                    批量启用
                                </button>
                                <button
                                    onClick={() => handleBatchStatus('停用')}
                                    className="rounded-full border border-indigo-200 px-2 py-0.5 hover:bg-white"
                                >
                                    批量停用
                                </button>
                                <button
                                    onClick={handleBatchDelete}
                                    className="rounded-full border border-rose-200 px-2 py-0.5 text-rose-600 hover:bg-white"
                                >
                                    批量删除
                                </button>
                                <button
                                    onClick={handleBatchRecertify}
                                    className="rounded-full border border-indigo-200 px-2 py-0.5 hover:bg-white"
                                >
                                    重新认证
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="rounded-full border border-indigo-200 px-2 py-0.5 hover:bg-white"
                                >
                                    清空
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {filteredRoles.length === 0 && (
                            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-xs text-slate-400">
                                未找到符合条件的角色
                            </div>
                        )}
                        {filteredRoles.map((role) => {
                            const isActive = role.id === activeRoleId;
                            const isSelected = selectedRoleIds.includes(role.id);
                            return (
                                <div
                                    key={role.id}
                                    className={`w-full rounded-xl border p-4 transition ${isActive
                                        ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                                        : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleRoleSelection(role.id)}
                                                className="mt-1 h-4 w-4 accent-indigo-600"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setActiveRoleId(role.id)}
                                                        className="text-sm font-semibold text-slate-800 hover:text-indigo-600"
                                                    >
                                                        {role.name}
                                                    </button>
                                                    {role.builtIn && (
                                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                            系统内置
                                                        </span>
                                                    )}
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${riskStyles[role.riskLevel]}`}>
                                                        {role.riskLevel}风险
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{role.description}</p>
                                            </div>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${role.status === '启用'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}
                                        >
                                            {role.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Users size={14} /> {role.memberCount} 人
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Layers size={14} />
                                            {scopeTypeLabel[role.scope.type]} ({role.scope.type === 'Global' ? '全局' : role.scope.ids.length})
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Sparkles size={14} /> {role.updatedAt}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-6">
                    {noRoleSelected && (
                        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                            请从左侧选择一个角色查看详情。
                        </div>
                    )}
                    {activeRole && (
                        <>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-semibold text-slate-800">{activeRole.name}</h3>
                                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500">
                                            {activeRole.version}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${riskStyles[activeRole.riskLevel]}`}>
                                            {activeRole.riskLevel}风险
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">{activeRole.description}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(activeRole)}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                    >
                                        <Pencil size={14} /> 编辑角色
                                    </button>
                                    <button
                                        onClick={handleToggleStatus}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800"
                                    >
                                        {activeRole.status === '启用' ? '停用' : '启用'}
                                    </button>
                                    <button
                                        onClick={handleCloneRole}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                    >
                                        <Copy size={14} /> 复制
                                    </button>
                                    <button
                                        onClick={() => alert('查看角色历史版本')}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                    >
                                        <History size={14} /> 历史版本
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRole(activeRole.id)}
                                        disabled={activeRole.builtIn || activeRole.memberCount > 0 || activeRole.riskLevel === '高'}
                                        className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 ${activeRole.builtIn || activeRole.memberCount > 0 || activeRole.riskLevel === '高'
                                            ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                            : 'border-rose-200 text-rose-600 hover:text-rose-700 hover:border-rose-300'
                                            }`}
                                    >
                                        <Trash2 size={14} /> 删除
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-4">
                                {[
                                    { label: '角色成员', value: `${activeRole.memberCount} 人`, icon: Users },
                                    { label: '覆盖范围', value: activeRole.scope.type === 'Global' ? '全平台' : `${activeRole.scope.ids.length} 个对象`, icon: Layers },
                                    { label: '更新时间', value: activeRole.updatedAt, icon: UserCog },
                                    { label: '继承来源', value: activeRole.parentRoleIds.length ? `${activeRole.parentRoleIds.length} 个` : '无', icon: Link2 }
                                ].map((item) => (
                                    <div key={item.label} className="rounded-xl border border-slate-200 p-3">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{item.label}</span>
                                            <item.icon size={14} className="text-indigo-500" />
                                        </div>
                                        <div className="mt-2 text-sm font-semibold text-slate-800">{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">授权范围与数据过滤</p>
                                    <button
                                        onClick={() => alert('查看范围明细')}
                                        className="text-xs text-indigo-600 hover:text-indigo-700"
                                    >
                                        查看全部范围
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        {scopeTypeLabel[activeRole.scope.type]}
                                    </span>
                                    {activeRole.scope.ids.map((id) => (
                                        <span
                                            key={id}
                                            className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs text-indigo-600"
                                        >
                                            {id === '*' ? '所有资源' : id}
                                        </span>
                                    ))}
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                                    数据过滤规则：{activeRole.dataFilters.length > 0
                                        ? activeRole.dataFilters.join('；')
                                        : '未配置'}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">权限策略矩阵</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <button
                                            onClick={() => setShowAdvancedMatrix(!showAdvancedMatrix)}
                                            className={`flex items-center gap-1 ${showAdvancedMatrix ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}
                                        >
                                            <Sparkles size={12} />
                                            {showAdvancedMatrix ? '隐藏高级权限点' : '显示高级权限点'}
                                        </button>
                                        <button
                                            onClick={() => setShowUnusedPerms(!showUnusedPerms)}
                                            className={`flex items-center gap-1 ${showUnusedPerms ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}
                                        >
                                            <AlertTriangle size={12} />
                                            {showUnusedPerms ? '隐藏未使用权限' : '高亮未使用'}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] bg-slate-50 text-xs font-semibold text-slate-500">
                                        <div className="px-4 py-2">治理模块</div>
                                        {actionLabels.map((label) => (
                                            <div key={label} className="px-3 py-2 text-center">
                                                {label}
                                            </div>
                                        ))}
                                        <div className="px-4 py-2">说明</div>
                                    </div>
                                    {permissionItems.map((item, index) => {
                                        const isUnused = showUnusedPerms && unusedModules.has(item.module);
                                        const ops = operationPointDefinitions[item.module];
                                        const hasOps = ops && ops.length > 0;
                                        return (
                                            <div
                                                key={item.module}
                                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${isUnused ? 'bg-amber-50' : ''}`}
                                            >
                                                <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] text-xs text-slate-600">
                                                    <div className="px-4 py-3 font-semibold text-slate-700">{item.module}</div>
                                                    {actionLabels.map((label) => (
                                                        <div key={label} className="px-3 py-3 text-center">
                                                            {item.actions.includes(label) ? (
                                                                <Check size={14} className="inline text-emerald-500" />
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="px-4 py-3 text-slate-500">{item.note}</div>
                                                </div>
                                                {showAdvancedMatrix && hasOps && (
                                                    <div className="px-4 pb-3 pt-0 border-t border-slate-100 bg-slate-50/30">
                                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                                                            {ops.map(op => (
                                                                <div key={op.key} className="flex items-center gap-2 text-xs text-slate-600">
                                                                    <span className={`h-2 w-2 rounded-full ${item.operationPoints?.includes(op.key) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                                                    <span>{op.label}</span>
                                                                    <span className="text-[10px] text-slate-400">({op.parentAction})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">成员分配与认证</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1">
                                            <UserPlus size={14} /> 添加用户
                                        </button>
                                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1">
                                            <FolderPlus size={14} /> 添加用户组
                                        </button>
                                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1">
                                            <RefreshCw size={14} /> 发起确认
                                        </button>
                                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800">
                                            导出
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-lg border border-slate-100">
                                    <table className="w-full text-xs text-slate-600">
                                        <thead className="bg-slate-50 text-slate-400">
                                            <tr>
                                                <th className="px-3 py-2 text-left">用户/组</th>
                                                <th className="px-3 py-2 text-left">来源</th>
                                                <th className="px-3 py-2 text-left">有效期</th>
                                                <th className="px-3 py-2 text-left">上次使用</th>
                                                <th className="px-3 py-2 text-left">状态</th>
                                                <th className="px-3 py-2 text-left">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {[
                                                { name: '张倩 · 语义治理部', source: '手动', expiry: '永久', lastUsed: '3 天前', status: '活跃' },
                                                { name: '李晨 · 数据平台部', source: '同步', expiry: '2 天后过期', lastUsed: '15 天前', status: '临时' },
                                                { name: '王宁 · 业务应用部', source: '手动', expiry: '永久', lastUsed: '60 天前', status: '僵尸账号' }
                                            ].map((member) => (
                                                <tr key={member.name}>
                                                    <td className="px-3 py-2">{member.name}</td>
                                                    <td className="px-3 py-2">{member.source}</td>
                                                    <td className="px-3 py-2">{member.expiry}</td>
                                                    <td className="px-3 py-2">{member.lastUsed}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${member.status === '活跃'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : member.status === '临时'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-rose-100 text-rose-700'
                                                            }`}>
                                                            {member.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-indigo-600">移除/续期</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-sm font-semibold text-slate-700">合规分析 (SoD)</p>
                                    <div className="mt-3 text-xs text-slate-600">
                                        {activeRole.riskLevel === '高'
                                            ? '检测到高危权限组合，请关注审批与执行分离。'
                                            : '未检测到互斥权限冲突。'}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-400">建议：启用审批链与二次确认。</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-sm font-semibold text-slate-700">最小权限建议</p>
                                    <div className="mt-3 text-xs text-slate-600">
                                        建议移除长期未使用的权限：数据质量 / 业务场景
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">最近变更</p>
                                    <button className="text-xs text-indigo-600 hover:text-indigo-700">查看审计</button>
                                </div>
                                <div className="mt-3 space-y-3 text-xs text-slate-600">
                                    {[
                                        { title: '语义版本发布权限提升', actor: '韩梅', version: 'v1.1 → v1.2' },
                                        { title: '新增数据安全审计范围', actor: '系统', version: 'v1.0 → v1.1' },
                                        { title: '问数模板配置权限下放', actor: '刘维', version: 'v1.0 → v1.0' }
                                    ].map((item) => (
                                        <div key={item.title} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                                            <div>
                                                <div className="font-semibold text-slate-700">{item.title}</div>
                                                <div className="text-[11px] text-slate-400">{item.actor} · {item.version}</div>
                                            </div>
                                            <button className="text-xs text-indigo-600">查看差异</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {modalOpen && draftRole && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {modalMode === 'create' ? '新建角色' : '编辑角色'}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        配置角色信息、授权范围与权限策略。
                                    </p>
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
                                        <label className="text-xs font-semibold text-slate-600">角色名称</label>
                                        <input
                                            value={draftRole.name}
                                            onChange={(event) =>
                                                setDraftRole({ ...draftRole, name: event.target.value })
                                            }
                                            placeholder="例如：语义治理负责人"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">角色编码</label>
                                        <input
                                            value={draftRole.code}
                                            onChange={(event) =>
                                                setDraftRole({ ...draftRole, code: event.target.value })
                                            }
                                            placeholder="semantic_owner"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600">角色描述</label>
                                        <textarea
                                            value={draftRole.description}
                                            onChange={(event) =>
                                                setDraftRole({ ...draftRole, description: event.target.value })
                                            }
                                            placeholder="描述该角色在语义治理流程中的职责"
                                            className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">状态</label>
                                        <select
                                            value={draftRole.status}
                                            onChange={(event) =>
                                                setDraftRole({
                                                    ...draftRole,
                                                    status: event.target.value as Role['status']
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="启用">启用</option>
                                            <option value="停用">停用</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">继承角色</label>
                                        <select
                                            value={draftRole.parentRoleIds[0] || ''}
                                            onChange={(event) =>
                                                setDraftRole({
                                                    ...draftRole,
                                                    parentRoleIds: event.target.value ? [event.target.value] : []
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="">不继承</option>
                                            {rolesState.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {modalMode === 'create' && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-semibold text-slate-600">权限模板</label>
                                            <select
                                                value={draftTemplateId}
                                                onChange={(event) => setDraftTemplateId(event.target.value)}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                            >
                                                {templateOptions.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-400">{activeTemplate?.description}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-700">授权范围</p>
                                    <div className="mt-3 grid gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-600">范围类型</label>
                                            <div className="flex flex-wrap gap-2">
                                                {(['Global', 'Tenant', 'Organization', 'Domain'] as ScopeType[]).map((type) => {
                                                    const isActive = draftRole.scope.type === type;
                                                    return (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setDraftRole({
                                                                ...draftRole,
                                                                scope: { type, ids: type === 'Global' ? ['*'] : [] }
                                                            })}
                                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${isActive
                                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            {scopeTypeLabel[type]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {draftRole.scope.type !== 'Global' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-600">
                                                    选择{draftRole.scope.type === 'Tenant' ? '租户' :
                                                        draftRole.scope.type === 'Organization' ? '组织' : '数据域'}
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {(draftRole.scope.type === 'Tenant' ? ['tenant_default', 'tenant_a', 'tenant_b'] :
                                                        draftRole.scope.type === 'Organization' ? ['org_group', 'org_hr', 'org_tech'] :
                                                            ['domain_service', 'domain_search', 'domain_quality']).map((id) => {
                                                                const isSelected = draftRole.scope.ids.includes(id);
                                                                return (
                                                                    <button
                                                                        key={id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const currentIds = draftRole.scope.ids;
                                                                            const newIds = currentIds.includes(id)
                                                                                ? currentIds.filter(i => i !== id)
                                                                                : [...currentIds, id];
                                                                            setDraftRole({
                                                                                ...draftRole,
                                                                                scope: { ...draftRole.scope, ids: newIds }
                                                                            });
                                                                        }}
                                                                        className={`rounded-full border px-3 py-1 text-xs transition ${isSelected
                                                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                                                            : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-slate-700'
                                                                            }`}
                                                                    >
                                                                        {id}
                                                                    </button>
                                                                );
                                                            })}
                                                </div>
                                                {draftRole.scope.ids.length === 0 && (
                                                    <p className="text-xs text-rose-500 flex items-center gap-1">
                                                        <X size={12} /> 请至少选择一个范围
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                                            <label className="flex items-center gap-2 text-xs text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={rlsEnabled}
                                                    onChange={(event) => setRlsEnabled(event.target.checked)}
                                                    className="h-4 w-4 accent-indigo-600"
                                                />
                                                启用行级/数据级过滤
                                            </label>
                                            <input
                                                type="text"
                                                value={draftRole.dataFilters.join(', ')}
                                                onChange={(event) => setDraftRole({
                                                    ...draftRole,
                                                    dataFilters: event.target.value.split(',').map((item) => item.trim()).filter(Boolean)
                                                })}
                                                placeholder="例如: SecurityLevel <= 2, Dept IN (治理一组)"
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
                                                disabled={!rlsEnabled}
                                            />
                                            <div className="text-[11px] text-slate-400">将用于数据访问范围裁剪</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-700">权限策略</p>
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedPermissions(!showAdvancedPermissions)}
                                            className={`text-xs flex items-center gap-1 ${showAdvancedPermissions ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}
                                        >
                                            <Sparkles size={12} />
                                            {showAdvancedPermissions ? '隐藏高级权限点' : '显示高级权限点'}
                                        </button>
                                    </div>
                                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                                        <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] bg-slate-50 text-xs font-semibold text-slate-500">
                                            <div className="px-4 py-2">治理模块</div>
                                            {actionLabels.map((label) => (
                                                <div key={label} className="px-3 py-2 text-center">
                                                    {label}
                                                </div>
                                            ))}
                                            <div className="px-4 py-2">说明</div>
                                        </div>
                                        {draftPermissions.map((item, index) => {
                                            const ops = operationPointDefinitions[item.module];
                                            const hasOps = ops && ops.length > 0;
                                            return (
                                                <div key={item.module} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                    <div className="grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] text-xs text-slate-600">
                                                        <div className="px-4 py-3 font-semibold text-slate-700 flex flex-col justify-center">
                                                            {item.module}
                                                            {showAdvancedPermissions && hasOps && (
                                                                <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                                                                    包含 {ops.length} 个细分权限点
                                                                </span>
                                                            )}
                                                        </div>
                                                        {actionLabels.map((label) => (
                                                            <label
                                                                key={label}
                                                                className="px-3 py-3 text-center flex items-center justify-center cursor-pointer hover:bg-slate-100/50"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.actions.includes(label)}
                                                                    onChange={() => togglePermissionAction(item.module, label)}
                                                                    className="h-4 w-4 accent-indigo-600 rounded"
                                                                />
                                                            </label>
                                                        ))}
                                                        <div className="px-4 py-3 text-slate-500 flex items-center">{item.note}</div>
                                                    </div>

                                                    {showAdvancedPermissions && hasOps && (
                                                        <div className="px-4 pb-3 pt-0 border-t border-slate-100 bg-slate-50/30">
                                                            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                                                                {ops.map(op => (
                                                                    <label key={op.key} className="flex items-center gap-2 cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={(item.operationPoints || []).includes(op.key)}
                                                                            onChange={() => toggleOperationPoint(item.module, op.key)}
                                                                            className="h-3 w-3 accent-indigo-500 rounded-sm"
                                                                        />
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs text-slate-600 group-hover:text-indigo-600">{op.label}</span>
                                                                            <span className="text-[10px] text-slate-400 scale-90 origin-top-left">
                                                                                归属: {op.parentAction}
                                                                            </span>
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        风险提示：全平台范围 + 管理权限可能被识别为高风险配置。
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
                                    onClick={handleCheckBeforeSave}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    {modalMode === 'create' ? '创建角色' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {modalOpen && draftRole && (
                <RoleChangeConfirmModal
                    isOpen={confirmModalOpen}
                    onClose={() => setConfirmModalOpen(false)}
                    onConfirm={finalizeSave}
                    draftRole={draftRole}
                    originalRole={modalMode === 'edit' ? rolesState.find(r => r.id === draftRole.id) || null : null}
                    permissions={draftPermissions}
                />
            )}

            <EffectivePermissionPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                allRoles={rolesState.map(r => ({
                    ...r,
                    permissions: rolePermissionsState[r.id] || [],
                    dataFilters: r.dataFilters,
                    scope: r.scope
                }))}
            />

            <SoDRulesModal
                isOpen={showSoDModal}
                onClose={() => setShowSoDModal(false)}
            />
        </div>
    );
};

export default UserPermissionView;
