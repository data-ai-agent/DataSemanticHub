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
    X
} from 'lucide-react';

type Role = {
    id: string;
    name: string;
    code: string;
    description: string;
    scope: string[];
    users: number;
    status: '启用' | '停用';
    builtIn: boolean;
    updatedAt: string;
};

type PermissionItem = {
    module: string;
    actions: string[];
    note: string;
};

const initialRoles: Role[] = [
    {
        id: 'role_admin',
        name: '平台管理员',
        code: 'platform_admin',
        description: '负责平台配置、权限策略与跨域治理。',
        scope: ['集团', '全部数据域', '所有租户'],
        users: 6,
        status: '启用',
        builtIn: true,
        updatedAt: '2024-06-28'
    },
    {
        id: 'role_governance',
        name: '语义治理负责人',
        code: 'semantic_owner',
        description: '主导语义裁决、版本发布与审批流程。',
        scope: ['集团', '语义资产', '版本中心'],
        users: 14,
        status: '启用',
        builtIn: true,
        updatedAt: '2024-06-24'
    },
    {
        id: 'role_ops',
        name: '数据服务运营',
        code: 'data_service_ops',
        description: '保障问数、找数与数据服务的稳定运营。',
        scope: ['数据服务', '问数', '找数'],
        users: 23,
        status: '启用',
        builtIn: false,
        updatedAt: '2024-06-18'
    },
    {
        id: 'role_audit',
        name: '安全审计',
        code: 'security_auditor',
        description: '审阅语义变更、权限使用与合规日志。',
        scope: ['数据安全', '审计中心'],
        users: 5,
        status: '启用',
        builtIn: true,
        updatedAt: '2024-06-12'
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

const scopeOptions = [
    '集团',
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

const formatDate = () => new Date().toISOString().split('T')[0];

const normalizePermissions = (existing?: PermissionItem[]) => {
    const normalized = permissionCatalog.map((item) => {
        const match = existing?.find((permission) => permission.module === item.module);
        return match
            ? { ...item, actions: [...match.actions], note: match.note || item.note }
            : { ...item, actions: [] };
    });
    const extra = (existing ?? []).filter(
        (permission) => !permissionCatalog.some((catalog) => catalog.module === permission.module)
    );
    return [...normalized, ...extra.map((permission) => ({ ...permission, actions: [...permission.actions] }))];
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

    const filteredRoles = useMemo(
        () =>
            rolesState.filter(role =>
                `${role.name}${role.code}${role.description}`.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [rolesState, searchTerm]
    );

    const activeRole = rolesState.find(role => role.id === activeRoleId) ?? rolesState[0];
    const permissionItems = (rolePermissionsState[activeRole?.id ?? ''] ?? []).filter(
        (item) => item.actions.length > 0
    );
    const roleCount = rolesState.length;
    const builtInCount = rolesState.filter((role) => role.builtIn).length;
    const policyCount = Object.values(rolePermissionsState).reduce(
        (sum, items) => sum + items.filter((item) => item.actions.length > 0).length,
        0
    );

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
        setModalMode('create');
        setDraftRole({
            id: `role_${Date.now()}`,
            name: '',
            code: '',
            description: '',
            scope: [],
            users: 0,
            status: '启用',
            builtIn: false,
            updatedAt: formatDate()
        });
        setDraftTemplateId(templateId);
        setDraftPermissions(
            templateId === 'blank'
                ? normalizePermissions()
                : normalizePermissions(rolePermissionsState[templateId])
        );
        setModalOpen(true);
    };

    const openEditModal = (role: Role) => {
        setModalMode('edit');
        setDraftRole({ ...role });
        setDraftTemplateId('blank');
        setDraftPermissions(normalizePermissions(rolePermissionsState[role.id]));
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftRole(null);
    };

    const handleSaveRole = () => {
        if (!draftRole) {
            return;
        }
        if (!draftRole.name.trim() || !draftRole.code.trim()) {
            alert('请填写角色名称与编码。');
            return;
        }
        const nextRole = { ...draftRole, updatedAt: formatDate() };
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

    const toggleScope = (scope: string) => {
        if (!draftRole) {
            return;
        }
        const hasScope = draftRole.scope.includes(scope);
        setDraftRole({
            ...draftRole,
            scope: hasScope ? draftRole.scope.filter((item) => item !== scope) : [...draftRole.scope, scope]
        });
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

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck size={22} className="text-indigo-600" />
                        角色与权限管理
                    </h2>
                    <p className="text-slate-500 mt-1">
                        为语义治理配置角色、权限与范围，确保语义裁决可控可审计。
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openCreateModal(templateOptions[1]?.id ?? 'blank')}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300"
                    >
                        权限模板
                    </button>
                    <button
                        onClick={() => openCreateModal('blank')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建角色
                    </button>
                </div>
            </div>

            <div className="grid gap-4 px-1 md:grid-cols-3">
                {[
                    { label: '角色总数', value: `${roleCount}`, icon: Users, note: `含 ${builtInCount} 个系统内置` },
                    { label: '权限策略', value: `${policyCount}`, icon: KeyRound, note: `覆盖 ${scopeOptions.length} 个域` },
                    { label: '审计任务', value: '8', icon: Lock, note: '近 7 日待处理' }
                ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">{item.label}</p>
                            <item.icon size={18} className="text-indigo-500" />
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-slate-800">{item.value}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[1.05fr_1.4fr]">
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="搜索角色名称、编码或描述"
                            className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                        />
                    </div>

                    <div className="mt-4 space-y-3">
                        {filteredRoles.map((role) => {
                            const isActive = role.id === activeRoleId;
                            return (
                                <button
                                    key={role.id}
                                    onClick={() => setActiveRoleId(role.id)}
                                    className={`w-full text-left rounded-xl border p-4 transition ${
                                        isActive
                                            ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800">{role.name}</span>
                                                {role.builtIn && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                        系统内置
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${
                                                role.status === '启用'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {role.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Users size={14} /> {role.users} 人
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Layers size={14} /> {role.scope.length} 范围
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Sparkles size={14} /> {role.updatedAt}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">{activeRole?.name ?? '—'}</h3>
                            <p className="mt-1 text-sm text-slate-500">{activeRole?.description ?? '暂无描述'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => activeRole && openEditModal(activeRole)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                <Pencil size={14} /> 编辑角色
                            </button>
                            <button
                                onClick={handleToggleStatus}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800"
                            >
                                {activeRole?.status === '启用' ? '停用' : '启用'}
                            </button>
                            <button
                                onClick={() => activeRole && handleDeleteRole(activeRole.id)}
                                disabled={activeRole?.builtIn}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                                    activeRole?.builtIn
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
                            { label: '角色成员', value: `${activeRole?.users ?? 0} 人`, icon: Users },
                            { label: '覆盖范围', value: `${activeRole?.scope.length ?? 0} 类`, icon: Layers },
                            { label: '更新时间', value: activeRole?.updatedAt ?? '-', icon: UserCog }
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

                    <div>
                        <p className="text-sm font-semibold text-slate-700">授权范围</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {activeRole?.scope?.length ? (
                                activeRole.scope.map((scope) => (
                                    <span
                                        key={scope}
                                        className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs text-indigo-600"
                                    >
                                        {scope}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400">未设置范围</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700">权限策略</p>
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
                            {permissionItems.length === 0 && (
                                <div className="px-4 py-6 text-center text-xs text-slate-400">
                                    暂无可用权限策略，请在编辑中配置。
                                </div>
                            )}
                            {permissionItems.map((item, index) => (
                                <div
                                    key={item.module}
                                    className={`grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] text-xs text-slate-600 ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                    }`}
                                >
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
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-700">成员分配</p>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                {['张倩 · 语义治理部', '李晨 · 数据平台部', '王宁 · 业务应用部'].map((member) => (
                                    <div key={member} className="flex items-center justify-between">
                                        <span>{member}</span>
                                        <span className="text-slate-400">已授权</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-700">最近变更</p>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                {[
                                    '语义版本发布权限提升',
                                    '新增数据安全审计范围',
                                    '问数模板配置权限下放'
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-indigo-400" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {modalOpen && draftRole && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
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
                                {modalMode === 'create' && (
                                    <div className="space-y-2">
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
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {scopeOptions.map((scope) => {
                                        const active = draftRole.scope.includes(scope);
                                        return (
                                            <button
                                                key={scope}
                                                type="button"
                                                onClick={() => toggleScope(scope)}
                                                className={`rounded-full border px-3 py-1 text-xs transition ${
                                                    active
                                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                                        : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-slate-700'
                                                }`}
                                            >
                                                {scope}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-700">权限策略</p>
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
                                    {draftPermissions.map((item, index) => (
                                        <div
                                            key={item.module}
                                            className={`grid grid-cols-[1.1fr_repeat(4,0.7fr)_1fr] text-xs text-slate-600 ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                            }`}
                                        >
                                            <div className="px-4 py-3 font-semibold text-slate-700">{item.module}</div>
                                            {actionLabels.map((label) => (
                                                <label
                                                    key={label}
                                                    className="px-3 py-3 text-center"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={item.actions.includes(label)}
                                                        onChange={() => togglePermissionAction(item.module, label)}
                                                        className="h-4 w-4 accent-indigo-600"
                                                    />
                                                </label>
                                            ))}
                                            <div className="px-4 py-3 text-slate-500">{item.note}</div>
                                        </div>
                                    ))}
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
                                onClick={handleSaveRole}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                {modalMode === 'create' ? '创建角色' : '保存修改'}
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPermissionView;
