import { useMemo, useState } from 'react';
import {
    Building2,
    Plus,
    Search,
    Filter,
    Pencil,
    Trash2,
    X,
    Users,
    MapPin,
    BadgeCheck,
    EyeOff,
    Eye
} from 'lucide-react';

type OrgStatus = '启用' | '停用';

type Department = {
    id: string;
    name: string;
    code: string;
    parentId: string | null;
    manager: string;
    members: number;
    status: OrgStatus;
    region: string;
    order: number;
    roles: string[];
    description: string;
    builtIn: boolean;
    updatedAt: string;
};

type Member = {
    id: string;
    name: string;
    title: string;
    role: string;
    status: '在岗' | '调岗' | '离职';
};

const roleCatalog = ['语义治理', '版本管理', '数据服务', '数据安全', '数据质量', '业务场景', '问数', '找数'];

const initialDepartments: Department[] = [
    {
        id: 'dept_root',
        name: '数据语义治理中心',
        code: 'ds_center',
        parentId: null,
        manager: '王宁',
        members: 32,
        status: '启用',
        region: '集团',
        order: 1,
        roles: ['语义治理', '版本管理'],
        description: '负责语义治理、版本管理与统一裁决。',
        builtIn: true,
        updatedAt: '2024-06-26'
    },
    {
        id: 'dept_semantic_ops',
        name: '语义运营部',
        code: 'semantic_ops',
        parentId: 'dept_root',
        manager: '陈颖',
        members: 16,
        status: '启用',
        region: '集团',
        order: 1,
        roles: ['语义治理', '业务场景'],
        description: '推动语义资产落地与场景编排。',
        builtIn: false,
        updatedAt: '2024-06-21'
    },
    {
        id: 'dept_version_council',
        name: '版本委员会',
        code: 'version_board',
        parentId: 'dept_root',
        manager: '刘洋',
        members: 9,
        status: '启用',
        region: '集团',
        order: 2,
        roles: ['版本管理'],
        description: '负责语义版本评审与发布决策。',
        builtIn: true,
        updatedAt: '2024-06-18'
    },
    {
        id: 'dept_security',
        name: '安全合规部',
        code: 'security',
        parentId: null,
        manager: '张倩',
        members: 12,
        status: '启用',
        region: '总部',
        order: 2,
        roles: ['数据安全'],
        description: '负责敏感数据与合规审计。',
        builtIn: true,
        updatedAt: '2024-06-16'
    },
    {
        id: 'dept_quality',
        name: '数据质量中心',
        code: 'data_quality',
        parentId: null,
        manager: '李晨',
        members: 14,
        status: '启用',
        region: '总部',
        order: 3,
        roles: ['数据质量'],
        description: '主导质量规则与异常闭环。',
        builtIn: false,
        updatedAt: '2024-06-14'
    },
    {
        id: 'dept_data_service',
        name: '数据服务运营部',
        code: 'data_service_ops',
        parentId: null,
        manager: '赵敏',
        members: 18,
        status: '启用',
        region: '华东',
        order: 4,
        roles: ['数据服务', '问数', '找数'],
        description: '运营数据服务与问数找数能力。',
        builtIn: false,
        updatedAt: '2024-06-12'
    },
    {
        id: 'dept_scene',
        name: '业务场景推进组',
        code: 'scene_ops',
        parentId: 'dept_data_service',
        manager: '周琪',
        members: 8,
        status: '启用',
        region: '华东',
        order: 1,
        roles: ['业务场景'],
        description: '推动业务场景上线与协同。',
        builtIn: false,
        updatedAt: '2024-06-08'
    }
];

const memberMap: Record<string, Member[]> = {
    dept_root: [
        { id: 'm_01', name: '王宁', title: '语义治理负责人', role: '语义治理', status: '在岗' },
        { id: 'm_02', name: '刘洋', title: '版本委员会秘书', role: '版本管理', status: '在岗' },
        { id: 'm_03', name: '孙凯', title: '语义裁决专员', role: '语义治理', status: '在岗' }
    ],
    dept_semantic_ops: [
        { id: 'm_11', name: '陈颖', title: '语义运营经理', role: '语义治理', status: '在岗' },
        { id: 'm_12', name: '高原', title: '场景运营', role: '业务场景', status: '在岗' }
    ],
    dept_security: [
        { id: 'm_21', name: '张倩', title: '安全审计负责人', role: '数据安全', status: '在岗' },
        { id: 'm_22', name: '韩雪', title: '合规专员', role: '数据安全', status: '在岗' }
    ],
    dept_data_service: [
        { id: 'm_31', name: '赵敏', title: '服务运营经理', role: '数据服务', status: '在岗' },
        { id: 'm_32', name: '陈浩', title: '问数产品运营', role: '问数', status: '在岗' }
    ]
};

const formatDate = () => new Date().toISOString().split('T')[0];

const OrgManagementView = () => {
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [activeDeptId, setActiveDeptId] = useState(initialDepartments[0]?.id ?? '');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | OrgStatus>('all');
    const [regionFilter, setRegionFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [draftDept, setDraftDept] = useState<Department | null>(null);

    const regionOptions = useMemo(
        () => ['全部', ...Array.from(new Set(departments.map((item) => item.region)))],
        [departments]
    );

    const deptTree = useMemo(() => {
        const build = (parentId: string | null, level: number): Array<{ item: Department; level: number }> => {
            return departments
                .filter((item) => item.parentId === parentId)
                .sort((a, b) => a.order - b.order)
                .flatMap((item) => [{ item, level }, ...build(item.id, level + 1)]);
        };
        return build(null, 0);
    }, [departments]);

    const filteredDepartments = useMemo(() => {
        return deptTree.filter(({ item }) => {
            const matchesSearch = `${item.name}${item.code}${item.manager}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesRegion = regionFilter === 'all' || item.region === regionFilter;
            return matchesSearch && matchesStatus && matchesRegion;
        });
    }, [deptTree, searchTerm, statusFilter, regionFilter]);

    const activeDept = departments.find((item) => item.id === activeDeptId) ?? departments[0];
    const totalCount = departments.length;
    const enabledCount = departments.filter((item) => item.status === '启用').length;
    const totalMembers = departments.reduce((sum, item) => sum + item.members, 0);
    const children = departments.filter((item) => item.parentId === activeDept?.id);

    const getDeptPath = (dept?: Department) => {
        if (!dept) {
            return [];
        }
        const path: string[] = [dept.name];
        let current = dept;
        while (current.parentId) {
            const parent = departments.find((item) => item.id === current.parentId);
            if (!parent) {
                break;
            }
            path.unshift(parent.name);
            current = parent;
        }
        return path;
    };

    const openCreateModal = () => {
        setModalMode('create');
        setDraftDept({
            id: `dept_${Date.now()}`,
            name: '',
            code: '',
            parentId: null,
            manager: '',
            members: 0,
            status: '启用',
            region: '集团',
            order: 1,
            roles: [],
            description: '',
            builtIn: false,
            updatedAt: formatDate()
        });
        setModalOpen(true);
    };

    const openEditModal = (dept: Department) => {
        setModalMode('edit');
        setDraftDept({ ...dept });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftDept(null);
    };

    const handleSave = () => {
        if (!draftDept) {
            return;
        }
        if (!draftDept.name.trim() || !draftDept.code.trim()) {
            alert('请填写组织名称与编码。');
            return;
        }
        const nextDept = { ...draftDept, updatedAt: formatDate() };
        if (modalMode === 'create') {
            setDepartments((prev) => [nextDept, ...prev]);
            setActiveDeptId(nextDept.id);
        } else {
            setDepartments((prev) => prev.map((item) => (item.id === nextDept.id ? nextDept : item)));
        }
        closeModal();
    };

    const handleToggleStatus = (dept: Department) => {
        const nextStatus: OrgStatus = dept.status === '启用' ? '停用' : '启用';
        setDepartments((prev) =>
            prev.map((item) =>
                item.id === dept.id ? { ...item, status: nextStatus, updatedAt: formatDate() } : item
            )
        );
    };

    const handleDelete = (dept: Department) => {
        if (dept.builtIn) {
            return;
        }
        if (!confirm('确定要删除该组织节点吗？')) {
            return;
        }
        setDepartments((prev) => {
            const next = prev.filter((item) => item.id !== dept.id && item.parentId !== dept.id);
            if (activeDeptId === dept.id) {
                setActiveDeptId(next[0]?.id ?? '');
            }
            return next;
        });
    };

    const toggleRole = (role: string) => {
        if (!draftDept) {
            return;
        }
        const exists = draftDept.roles.includes(role);
        setDraftDept({
            ...draftDept,
            roles: exists ? draftDept.roles.filter((item) => item !== role) : [...draftDept.roles, role]
        });
    };

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 size={22} className="text-indigo-600" />
                        组织架构管理
                    </h2>
                    <p className="text-slate-500 mt-1">维护组织层级、角色职责与人员归属，支撑治理协同。</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300">
                        <Filter size={14} className="inline mr-1" /> 导入组织
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建组织
                    </button>
                </div>
            </div>

            <div className="grid gap-4 px-1 md:grid-cols-4">
                {[
                    { label: '组织数量', value: `${totalCount}`, note: '含层级节点' },
                    { label: '启用组织', value: `${enabledCount}`, note: '当前可用' },
                    { label: '人员规模', value: `${totalMembers}`, note: '全部部门' },
                    { label: '覆盖角色', value: `${roleCatalog.length}`, note: '语义治理角色' }
                ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <div className="mt-2 text-2xl font-semibold text-slate-800">{item.value}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[1.05fr_1.4fr]">
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <Search size={16} className="text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="搜索组织名称、编码或负责人"
                                className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Filter size={14} />
                            <select
                                value={regionFilter}
                                onChange={(event) => setRegionFilter(event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                {regionOptions.map((item) => (
                                    <option key={item} value={item === '全部' ? 'all' : item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | OrgStatus)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部状态</option>
                                <option value="启用">启用</option>
                                <option value="停用">停用</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {filteredDepartments.map(({ item, level }) => {
                            const isActive = item.id === activeDeptId;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveDeptId(item.id)}
                                    className={`w-full text-left rounded-xl border p-4 transition ${
                                        isActive
                                            ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800" style={{ marginLeft: level * 12 }}>
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-slate-400">{item.code}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {item.manager} · {item.region}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${
                                                item.status === '启用'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Users size={14} /> {item.members} 人
                                        </span>
                                        <span>顺序 {item.order}</span>
                                        <span>{item.updatedAt} 更新</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">{activeDept?.name ?? '—'}</h3>
                            <p className="mt-1 text-sm text-slate-500">{activeDept?.description ?? '暂无描述'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => activeDept && openEditModal(activeDept)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                <Pencil size={14} /> 编辑
                            </button>
                            <button
                                onClick={() => activeDept && handleToggleStatus(activeDept)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                {activeDept?.status === '启用' ? <EyeOff size={14} /> : <Eye size={14} />}
                                {activeDept?.status === '启用' ? '停用' : '启用'}
                            </button>
                            <button
                                onClick={() => activeDept && handleDelete(activeDept)}
                                disabled={activeDept?.builtIn}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                                    activeDept?.builtIn
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
                            { label: '负责人', value: activeDept?.manager ?? '-', icon: BadgeCheck },
                            { label: '所属区域', value: activeDept?.region ?? '-', icon: MapPin },
                            { label: '人员规模', value: `${activeDept?.members ?? 0} 人`, icon: Users }
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
                        <p className="text-sm font-semibold text-slate-700">组织层级</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {getDeptPath(activeDept).map((node) => (
                                <span key={node} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                                    {node}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700">职责角色</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {activeDept?.roles?.length ? (
                                activeDept.roles.map((role) => (
                                    <span
                                        key={role}
                                        className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs text-indigo-600"
                                    >
                                        {role}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400">未配置角色</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700">下属部门</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {children.length ? (
                                children.map((child) => (
                                    <span
                                        key={child.id}
                                        className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs text-emerald-600"
                                    >
                                        {child.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400">暂无下属部门</span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-700">成员列表</p>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                            {(memberMap[activeDept?.id ?? ''] ?? []).length ? (
                                memberMap[activeDept?.id ?? ''].map((member) => (
                                    <div key={member.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-700">{member.name}</p>
                                            <p className="text-slate-400">{member.title}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-500">{member.role}</p>
                                            <p className="text-slate-400">{member.status}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-400">暂无成员数据</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {modalOpen && draftDept && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {modalMode === 'create' ? '新建组织' : '编辑组织'}
                                    </h3>
                                    <p className="text-xs text-slate-500">配置组织层级、角色与人员归属。</p>
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
                                        <label className="text-xs font-semibold text-slate-600">组织名称</label>
                                        <input
                                            value={draftDept.name}
                                            onChange={(event) => setDraftDept({ ...draftDept, name: event.target.value })}
                                            placeholder="例如：语义治理中心"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">组织编码</label>
                                        <input
                                            value={draftDept.code}
                                            onChange={(event) => setDraftDept({ ...draftDept, code: event.target.value })}
                                            placeholder="semantic_center"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600">组织描述</label>
                                        <textarea
                                            value={draftDept.description}
                                            onChange={(event) =>
                                                setDraftDept({ ...draftDept, description: event.target.value })
                                            }
                                            placeholder="描述该组织的职责与定位"
                                            className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">负责人</label>
                                        <input
                                            value={draftDept.manager}
                                            onChange={(event) =>
                                                setDraftDept({ ...draftDept, manager: event.target.value })
                                            }
                                            placeholder="负责人姓名"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">所属区域</label>
                                        <input
                                            value={draftDept.region}
                                            onChange={(event) =>
                                                setDraftDept({ ...draftDept, region: event.target.value })
                                            }
                                            placeholder="集团 / 华东 / 总部"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">父级组织</label>
                                        <select
                                            value={draftDept.parentId ?? ''}
                                            onChange={(event) =>
                                                setDraftDept({
                                                    ...draftDept,
                                                    parentId: event.target.value || null
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="">顶级组织</option>
                                            {departments
                                                .filter((item) => item.id !== draftDept.id)
                                                .map((item) => (
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
                                            value={draftDept.order}
                                            onChange={(event) =>
                                                setDraftDept({ ...draftDept, order: Number(event.target.value) })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">状态</label>
                                        <select
                                            value={draftDept.status}
                                            onChange={(event) =>
                                                setDraftDept({ ...draftDept, status: event.target.value as OrgStatus })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="启用">启用</option>
                                            <option value="停用">停用</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-700">职责角色</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {roleCatalog.map((role) => {
                                            const active = draftDept.roles.includes(role);
                                            return (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => toggleRole(role)}
                                                    className={`rounded-full border px-3 py-1 text-xs transition ${
                                                        active
                                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                                            : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-slate-700'
                                                    }`}
                                                >
                                                    {role}
                                                </button>
                                            );
                                        })}
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
                                    {modalMode === 'create' ? '创建组织' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgManagementView;
