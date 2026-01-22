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
    Eye,
    List,
    AlignLeft,
    ChevronRight,
    ChevronDown,
    MoreHorizontal,

    AlertTriangle,
    ShieldAlert,
    ArrowRight,
    Info,
    CheckCircle,
    UserPlus,
    Settings,
    Briefcase,
    Star,
    Layout
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
    updatedAt: string;
    description?: string;
    builtIn?: boolean; // built-in nodes
    functions?: string[]; // Governance functions assigned to this org

    // New Fields
    type?: 'organization' | 'department';
    isMainDepartment?: boolean;
    responsibilities?: string;
};

type Member = {
    id: string;
    name: string;
    title: string;
    role: string;
    permissions: string[]; // e.g. 'admin', 'read', 'write'
    isPrimary: boolean;    // Is this the primary organization
    status: '在岗' | '调岗' | '离职';
    joinDate: string;
};



const GOVERNANCE_ROLES = [
    { name: '语义治理', desc: '负责数据标准、业务含义的统一定义与维护' },
    { name: '版本管理', desc: '负责语义资产的版本发布、变更审核与生命周期管理' },
    { name: '数据安全', desc: '负责数据分级分类、权限审批与合规审计' },
    { name: '数据质量', desc: '负责数据质量规则配置、监控与问题治理' }
];

const CAPABILITIES = [
    { name: '业务场景', desc: '负责业务场景的梳理与价值验证' },
    { name: '问数', desc: '具备自然语言查数、取数的能力支持' },
    { name: '找数', desc: '提供数据资产检索与探查服务' }
];

// Combine for backward compatibility if needed, or migration
const roleCatalog = [...GOVERNANCE_ROLES, ...CAPABILITIES].map(r => r.name);

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
        functions: ['语义治理', '版本管理'],
        description: '负责语义治理、版本管理与统一裁决。',
        builtIn: true,
        updatedAt: '2024-06-26',
        type: 'organization'
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
        functions: ['语义治理', '业务场景'],
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
        functions: ['版本管理'],
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
        functions: ['数据安全'],
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
        functions: ['数据质量'],
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
        functions: ['数据服务', '问数', '找数'],
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
        functions: ['业务场景'],
        description: '推动业务场景上线与协同。',
        builtIn: false,
        updatedAt: '2024-06-08'
    }
];

const memberMap: Record<string, Member[]> = {
    dept_root: [
        { id: 'm_01', name: '王宁', title: '语义治理负责人', role: '语义治理', permissions: ['manage', 'audit'], isPrimary: true, status: '在岗', joinDate: '2023-01-10' },
        { id: 'm_02', name: '刘洋', title: '版本委员会秘书', role: '版本管理', permissions: ['audit'], isPrimary: true, status: '在岗', joinDate: '2023-03-15' },
        { id: 'm_03', name: '孙凯', title: '语义裁决专员', role: '语义治理', permissions: ['operate'], isPrimary: true, status: '在岗', joinDate: '2023-05-20' }
    ],
    dept_semantic_ops: [
        { id: 'm_11', name: '陈颖', title: '语义运营经理', role: '语义治理', permissions: ['operate'], isPrimary: true, status: '在岗', joinDate: '2023-02-01' },
        { id: 'm_12', name: '高原', title: '场景运营', role: '业务场景', permissions: ['operate'], isPrimary: false, status: '在岗', joinDate: '2023-06-01' }
    ],
    dept_security: [
        { id: 'm_21', name: '张倩', title: '安全审计负责人', role: '数据安全', permissions: ['audit'], isPrimary: true, status: '在岗', joinDate: '2023-01-15' },
        { id: 'm_22', name: '韩雪', title: '合规专员', role: '数据安全', permissions: ['view'], isPrimary: true, status: '在岗', joinDate: '2023-04-10' }
    ],
    dept_data_service: [
        { id: 'm_31', name: '赵敏', title: '服务运营经理', role: '数据服务', permissions: ['manage'], isPrimary: true, status: '在岗', joinDate: '2023-03-01' },
        { id: 'm_32', name: '陈浩', title: '问数产品运营', role: '问数', permissions: ['operate'], isPrimary: true, status: '在岗', joinDate: '2023-07-01' }
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
    const [createStep, setCreateStep] = useState<'form' | 'success'>('form'); // New state for post-create guide
    const [draftDept, setDraftDept] = useState<Department | null>(null);

    // V2.4 Refactor: Tree State
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set(['dept_root']));
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

    // Filters
    const [hasMembersFilter, setHasMembersFilter] = useState<'all' | 'yes' | 'no'>('all');
    const [hasSubOrgFilter, setHasSubOrgFilter] = useState<'all' | 'yes' | 'no'>('all');

    // Member Management State
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberRoleFilter, setMemberRoleFilter] = useState('all');
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const next = new Set(expandedNodeIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setExpandedNodeIds(next);
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedNodeId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        const sourceId = draggedNodeId;
        if (!sourceId || sourceId === targetId) return;

        // Reorder logic:
        // 1. Find source and target departments
        // 2. Ensure they share the same parent (for simple reordering within same level in sorting)
        //    OR support reparenting (moving to another folder). 
        //    Requirement said "Drag Sort (replace display order)", usually implies sorting.
        //    Let's support sorting within same parent for safety first, or allow reparenting if user drops ON a node?
        //    "Drag Sort" usually means re-arranging.

        // Let's implement full re-ordering. 
        // If dropped ON a node -> reparent? No, usually "sort" means in-between.
        // Simplification for MVP: Swap orders if same parent.

        setDepartments(prev => {
            const sourceIndex = prev.findIndex(d => d.id === sourceId);
            const targetIndex = prev.findIndex(d => d.id === targetId);
            if (sourceIndex === -1 || targetIndex === -1) return prev;

            const source = prev[sourceIndex];
            const target = prev[targetIndex];

            // Only allow reordering within same level for now to avoid confusion
            if (source.parentId !== target.parentId) {
                // Optional: Allow reparenting? 
                // Let's stick to Requirements: "Drag Sort (substitute display order filling)"
                // So purely order adjustment.
                return prev;
            }

            // Swap orders? Or insert?
            // True sort: items with same parentId should be re-indexed.
            const siblings = prev.filter(d => d.parentId === source.parentId).sort((a, b) => a.order - b.order);
            const sourceSiblingIndex = siblings.findIndex(s => s.id === sourceId);
            const targetSiblingIndex = siblings.findIndex(s => s.id === targetId);

            // Move source to target's position
            const newSiblings = [...siblings];
            const [moved] = newSiblings.splice(sourceSiblingIndex, 1);
            newSiblings.splice(targetSiblingIndex, 0, moved);

            // Re-assign orders based on new index
            // We need to update ALL departments because we only have a flat list
            // Map the new orders back to the full list
            const newOrderMap = new Map(newSiblings.map((s, index) => [s.id, index + 1]));

            return prev.map(dept => {
                if (newOrderMap.has(dept.id)) {
                    return { ...dept, order: newOrderMap.get(dept.id)! };
                }
                return dept;
            });
        });
        setDraggedNodeId(null);
    };

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

            const hasMembers = item.members > 0;
            const matchesMemberFilter = hasMembersFilter === 'all'
                ? true
                : hasMembersFilter === 'yes' ? hasMembers : !hasMembers;

            const hasSubOrgs = departments.some(d => d.parentId === item.id);
            const matchesSubOrgFilter = hasSubOrgFilter === 'all'
                ? true
                : hasSubOrgFilter === 'yes' ? hasSubOrgs : !hasSubOrgs;

            return matchesSearch && matchesStatus && matchesRegion && matchesMemberFilter && matchesSubOrgFilter;
        });
    }, [deptTree, searchTerm, statusFilter, regionFilter, hasMembersFilter, hasSubOrgFilter]);

    const activeDept = departments.find((item) => item.id === activeDeptId) ?? departments[0];

    const filteredMembers = useMemo(() => {
        if (!activeDept) return [];
        const members = memberMap[activeDept.id] || [];
        return members.filter(m => {
            const matchesSearch = memberSearch ? (m.name.includes(memberSearch) || m.title?.includes(memberSearch)) : true;
            const matchesRole = memberRoleFilter === 'all' ? true : m.role === memberRoleFilter;
            return matchesSearch && matchesRole;
        });
    }, [activeDept, memberSearch, memberRoleFilter]);

    const handleSelectMember = (id: string, checked: boolean) => {
        const next = new Set(selectedMembers);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedMembers(next);
    };

    const handleSelectAllMembers = (checked: boolean) => {
        if (checked) {
            setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
        } else {
            setSelectedMembers(new Set());
        }
    };

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


    // Impact Analysis State
    const [impactModalOpen, setImpactModalOpen] = useState(false);
    const [impactType, setImpactType] = useState<'deactivate' | 'delete'>('deactivate');
    const [impactTarget, setImpactTarget] = useState<Department | null>(null);
    const [transferTarget, setTransferTarget] = useState('');

    // Mock Impact Analysis Data
    const getImpactRisk = (dept: Department) => {
        const subCount = departments.filter(d => d.parentId === dept.id).length;
        const memberCount = dept.members;
        const workflowCount = dept.code === 'version_board' ? 2 : 0; // Mock dependency
        const assetCount = dept.code === 'data_quality' ? 5 : 0;

        const riskLevel = (subCount > 0 || memberCount > 0 || workflowCount > 0) ? 'high' : 'low';

        return {
            level: riskLevel,
            subOrgs: subCount,
            members: memberCount,
            workflows: workflowCount,
            assets: assetCount
        };
    };

    const openImpactModal = (type: 'deactivate' | 'delete', dept: Department) => {
        setImpactTarget(dept);
        setImpactType(type);
        setImpactModalOpen(true);
        setTransferTarget('');
    };

    const confirmImpactAction = () => {
        if (!impactTarget) return;

        if (impactType === 'delete') {
            handleDelete(impactTarget, true); // Add force flag to handleDelete signature
        } else {
            handleToggleStatus(impactTarget, true);
        }
        setImpactModalOpen(false);
        setImpactTarget(null);
    };

    const openCreateModal = () => {
        setModalMode('create');
        setCreateStep('form');
        setDraftDept({
            id: '',
            name: '',
            code: '',
            parentId: activeDeptId || null,
            manager: '',
            members: 0,
            status: '启用',
            region: '华东',
            order: 0,
            builtIn: false,
            updatedAt: formatDate(),
            functions: [],
            type: 'department', // Default to department
            isMainDepartment: false,
            responsibilities: ''
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
        setCreateStep('form'); // Reset step on close
    };

    const saveDepartment = () => {
        if (!draftDept) {
            return;
        }
        if (!draftDept.name.trim() || !draftDept.code.trim()) {
            alert('请填写组织名称与编码。');
            return;
        }
        if (modalMode === 'create') {
            const newDept = {
                ...draftDept,
                id: `dept_${Math.random().toString(36).substr(2, 6)}`,
                members: 0,
                updatedAt: formatDate(),
                builtIn: false
            };
            setDepartments([...departments, newDept]);
            // Show Success Step instead of closing immediately
            setCreateStep('success');
        } else {
            setDepartments(
                departments.map((item) => (item.id === draftDept.id ? { ...draftDept, updatedAt: formatDate() } : item))
            );
            closeModal();
        }
    };

    // Helper for Path Preview
    const getPathPreview = (parentId: string | null) => {
        if (!parentId) return '根组织';
        const parent = departments.find(d => d.id === parentId);
        const ancestors = getDeptPath(parent);
        return [...ancestors, draftDept?.name || '[当前组织]'].join(' > ');
    };

    // Helper for Code Auto-Gen
    const generateCode = () => {
        if (!draftDept?.name) return;
        // Mock pinyin/random generation
        const mockPinyin = 'org_' + Math.random().toString(36).substring(2, 5);
        setDraftDept(prev => prev ? ({ ...prev, code: mockPinyin }) : null);
    };

    // Helper for Manager Selection (Mock)
    const handleSelectManager = () => {
        // Just set a mock user for now
        setDraftDept(prev => prev ? ({ ...prev, manager: '王宁' }) : null);
    };

    const toggleFunction = (func: string) => {
        if (!draftDept) return;
        const current = draftDept.functions || [];
        const next = current.includes(func)
            ? current.filter(f => f !== func)
            : [...current, func];
        setDraftDept({ ...draftDept, functions: next });
    };

    const handleDelete = (dept: Department, force = false) => {
        if (dept.builtIn && !force) {
            return;
        }
        // if (!confirm('确定要删除该组织节点吗？')) {
        //     return;
        // }
        setDepartments((prev) => {
            const next = prev.filter((item) => item.id !== dept.id && item.parentId !== dept.id);
            if (activeDeptId === dept.id) {
                setActiveDeptId(next[0]?.id ?? '');
            }
            return next;
        });
    };

    const handleToggleStatus = (dept: Department, force = false) => {
        setDepartments((prev) =>
            prev.map((item) =>
                item.id === dept.id
                    ? { ...item, status: item.status === '启用' ? '停用' : '启用', updatedAt: formatDate() }
                    : item
            )
        );
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

            <div className="grid gap-3 px-1 md:grid-cols-6">
                {/* Mock Stats for KPIs */}
                {(() => {
                    const totalDepts = departments.length;
                    const totalMembers = departments.reduce((acc, cur) => acc + cur.members, 0);
                    // New Governance KPIs
                    const orgsWithoutManager = departments.filter(d => !d.manager || d.manager === '-').length;
                    const orgsWithoutFunction = departments.filter(d => !d.functions || d.functions.length === 0).length;
                    const functionCoverage = totalDepts > 0 ? Math.round(((totalDepts - orgsWithoutFunction) / totalDepts) * 100) : 0;

                    const StatCard = ({ title, value, label, trend, color = 'indigo' }: any) => (
                        <div className="relative overflow-hidden rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">{title}</p>
                            <div className="mt-1 flex items-baseline gap-1.5">
                                <span className="text-xl font-bold text-slate-800">{value}</span>
                                <span className="text-xs text-slate-400">{label}</span>
                            </div>
                        </div>
                    );

                    return (
                        <>
                            <StatCard title="组织总数" value={totalCount} label="个" />
                            <StatCard title="启用组织" value={enabledCount} label="个" />
                            <StatCard title="人员规模" value={totalMembers} label="人" />
                            <StatCard title="角色覆盖" value={roleCatalog.length} label="种" />
                            <StatCard title="无负责人组织" value={orgsWithoutManager} label="个" color="rose" />
                            <StatCard title="职能覆盖率" value={`${functionCoverage}%`} label="组织" color="emerald" />
                        </>
                    );
                })()}
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[0.50fr_2.0fr]">
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
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | OrgStatus)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">所有状态</option>
                                <option value="启用">启用</option>
                                <option value="停用">停用</option>
                            </select>


                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {/* Tree View */}
                        {deptTree.map(({ item, level }) => {
                            // For Tree View, we need to respect parent expansion state
                            // Simple check: if any parent in the path is NOT expanded, hide this node.
                            // However, finding path efficiently for each node:
                            //   We can check if item.parentId is in expanded list if strict hierarchy.
                            //   Better: Filter `deptTree` before mapping or use a recursive component.
                            //   Here, since `deptTree` is already flattened but sorted, we can check visibility.

                            // Simplified approach: Check visibility based on hierarchy.
                            // A node is visible if correct root, OR its parent is visible AND expanded.
                            // Since `deptTree` is strictly ordered by hierarchy:

                            // Just for MVP step 1: Render all, add indentation and expand toggles
                            // Improved: Only show if parent is expanded (except for root level if parentId is null)

                            const isActive = item.id === activeDeptId;
                            const hasChildren = departments.some(d => d.parentId === item.id);
                            const isExpanded = expandedNodeIds.has(item.id);

                            // Visibility Check (to be optimized later with recursive component if needed)
                            // Only hide if parent is collapsed. 
                            // But `deptTree` is flat. We need to know if any ancestor is collapsed.
                            // Let's use a helper in render or filter beforehand.

                            const isVisible = (dept: Department): boolean => {
                                if (!dept.parentId) return true;
                                if (!expandedNodeIds.has(dept.parentId)) return false;
                                const parent = departments.find(d => d.id === dept.parentId);
                                return parent ? isVisible(parent) : true;
                            };

                            if (!isVisible(item)) return null;

                            return (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, item.id)}
                                    className={`group flex items-center gap-2 rounded-lg p-2 text-sm transition-colors cursor-move ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                                        } ${draggedNodeId === item.id ? 'opacity-50 dashed border border-indigo-300' : ''}`}
                                    style={{ paddingLeft: level * 20 + 8 }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(item.id);
                                        }}
                                        className={`p-0.5 rounded hover:bg-black/5 ${hasChildren ? 'visible' : 'invisible'}`}
                                    >
                                        {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                    </button>

                                    <div
                                        className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                                        onClick={() => setActiveDeptId(item.id)}
                                    >
                                        {/* Type Icon */}
                                        {item.type === 'organization' ? (
                                            <Building2 size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                        ) : (
                                            <Layout size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                        )}

                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={`font-medium truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                {item.name}
                                            </span>
                                            {item.isMainDepartment && (
                                                <Star size={10} className="text-amber-500 fill-amber-500 shrink-0" />
                                            )}
                                        </div>

                                        <span className="text-xs text-slate-400 scale-90 origin-left ml-auto whitespace-nowrap">
                                            {item.members}人
                                        </span>
                                    </div>

                                    {/* Actions on Hover */}
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                            className="p-1 text-slate-400 hover:text-indigo-600"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                    {activeDept?.name ?? '—'}
                                </h3>
                                {activeDept?.type === 'organization' && <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-600 border border-indigo-100">组织</span>}
                                {activeDept?.type === 'department' && <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200">部门</span>}
                                {activeDept?.isMainDepartment && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-600 border border-amber-100">
                                        <Star size={10} className="fill-amber-500 text-amber-500" />
                                        主部门
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{activeDept?.description ?? '暂无描述'}</p>

                            {/* Responsibilities Display */}
                            {activeDept?.responsibilities && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Briefcase size={12} /> 部门职责
                                    </h4>
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{activeDept.responsibilities}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => activeDept && openEditModal(activeDept)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                <Pencil size={14} /> 编辑
                            </button>
                            <button
                                onClick={() => activeDept && openImpactModal('deactivate', activeDept)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                {activeDept?.status === '启用' ? <EyeOff size={14} /> : <Eye size={14} />}
                                {activeDept?.status === '启用' ? '停用' : '启用'}
                            </button>
                            <button
                                onClick={() => activeDept && openImpactModal('delete', activeDept)}
                                disabled={activeDept?.builtIn}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 ${activeDept?.builtIn
                                    ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                    : 'border-rose-200 text-rose-600 hover:text-rose-700 hover:border-rose-300'
                                    }`}
                            >
                                <Trash2 size={14} /> 删除
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            { label: '负责人', value: activeDept?.manager ?? '-', icon: BadgeCheck },
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
                        <p className="text-sm font-semibold text-slate-700 mb-2">组织路径</p>
                        <nav className="flex items-center text-sm text-slate-500">
                            {getDeptPath(activeDept).map((node, index, arr) => (
                                <div key={node} className="flex items-center">
                                    <span className={`${index === arr.length - 1 ? 'font-semibold text-slate-800' : 'hover:text-slate-700 cursor-default'}`}>
                                        {node}
                                    </span>
                                    {index < arr.length - 1 && (
                                        <ChevronRight size={14} className="mx-1 text-slate-400" />
                                    )}
                                </div>
                            ))}
                        </nav>
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
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                            <p className="text-sm font-semibold text-slate-700">成员列表</p>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="搜索成员..."
                                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-32 focus:outline-none focus:border-indigo-500"
                                        value={memberSearch}
                                        onChange={e => setMemberSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
                                    value={memberRoleFilter}
                                    onChange={e => setMemberRoleFilter(e.target.value)}
                                >
                                    <option value="all">所有角色</option>
                                    {roleCatalog.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                                    onClick={() => setShowMemberModal(true)}
                                >
                                    <Plus size={14} /> 添加成员
                                </button>
                            </div>
                        </div>

                        {selectedMembers.size > 0 && (
                            <div className="mb-3 flex items-center gap-3 bg-indigo-50 px-3 py-2 rounded-lg text-xs">
                                <span className="text-indigo-700 font-medium">已选 {selectedMembers.size} 人</span>
                                <div className="h-3 w-px bg-indigo-200" />
                                <button className="text-slate-600 hover:text-indigo-700">批量移除</button>
                                <button className="text-slate-600 hover:text-indigo-700">分配角色</button>
                                <button className="text-slate-600 hover:text-indigo-700">调整归属</button>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                    <tr>
                                        <th className="px-3 py-2 w-8">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300"
                                                checked={filteredMembers.length > 0 && selectedMembers.size === filteredMembers.length}
                                                onChange={e => handleSelectAllMembers(e.target.checked)}
                                            />
                                        </th>
                                        <th className="px-3 py-2">姓名 / 职位</th>
                                        <th className="px-3 py-2">治理角色</th>
                                        <th className="px-3 py-2">归属性质</th>
                                        <th className="px-3 py-2">权限</th>
                                        <th className="px-3 py-2">状态</th>
                                        <th className="px-3 py-2 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((member) => (
                                            <tr key={member.id} className="group hover:bg-slate-50">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300"
                                                        checked={selectedMembers.has(member.id)}
                                                        onChange={e => handleSelectMember(member.id, e.target.checked)}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="font-medium text-slate-700">{member.name}</div>
                                                    <div className="text-slate-400 scale-90 origin-left">{member.title}</div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{member.role}</span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {member.isPrimary ? (
                                                        <span className="flex items-center gap-1 text-emerald-600">
                                                            <BadgeCheck size={12} />
                                                            主归属
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">兼职</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-slate-500">
                                                    {member.permissions?.join(', ') || '-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`flex items-center gap-1.5 ${member.status === '在岗' ? 'text-slate-600' : 'text-amber-600'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === '在岗' ? 'bg-emerald-400' : 'bg-amber-400'
                                                            }`} />
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="text-indigo-600 hover:text-indigo-700 mr-2">设置</button>
                                                    <button className="text-rose-600 hover:text-rose-700">移除</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                                                暂无成员数据
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {modalOpen && draftDept && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                        {createStep === 'form' ? (
                            <>
                                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {modalMode === 'create' ? '新建组织' : '编辑组织信息'}
                                    </h3>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto space-y-6">
                                    {/* Basic Info Group */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">基本信息</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <label className="text-sm font-semibold text-slate-700">组织类型 <span className="text-rose-500">*</span></label>
                                                <div className="flex items-center gap-6 mt-1.5 px-1 py-1">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input
                                                            type="radio"
                                                            name="orgType"
                                                            checked={draftDept.type === 'organization'}
                                                            onChange={() => setDraftDept({ ...draftDept, type: 'organization', isMainDepartment: false, responsibilities: '' })}
                                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                        />
                                                        <span className={`text-sm ${draftDept.type === 'organization' ? 'text-indigo-700 font-medium' : 'text-slate-600'}`}>组织 (Organization)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input
                                                            type="radio"
                                                            name="orgType"
                                                            checked={draftDept.type === 'department'}
                                                            onChange={() => setDraftDept({ ...draftDept, type: 'department' })}
                                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                        />
                                                        <span className={`text-sm ${draftDept.type === 'department' ? 'text-indigo-700 font-medium' : 'text-slate-600'}`}>部门 (Department)</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="space-y-2 col-span-2">
                                                <label className="text-sm font-semibold text-slate-700">组织名称 <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={draftDept.name}
                                                    onChange={(event) =>
                                                        setDraftDept({ ...draftDept, name: event.target.value })
                                                    }
                                                    placeholder="请输入组织名称，如：语义运营部"
                                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">组织编码 <span className="text-rose-500">*</span></label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={draftDept.code}
                                                        onChange={(event) =>
                                                            setDraftDept({ ...draftDept, code: event.target.value })
                                                        }
                                                        placeholder="小写字母+下划线"
                                                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={generateCode}
                                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 whitespace-nowrap"
                                                    >
                                                        自动生成
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">负责人</label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-slate-50 flex items-center gap-2">
                                                        {draftDept.manager ? (
                                                            <>
                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                                    {draftDept.manager.charAt(0)}
                                                                </div>
                                                                {draftDept.manager}
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400">未指定</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => alert('打开用户选择弹窗（待实现）')}
                                                        className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs hover:bg-indigo-100"
                                                    >
                                                        选择
                                                    </button>
                                                </div>
                                            </div>

                                            {draftDept.type === 'department' && (
                                                <>
                                                    <div className="col-span-2 pt-2 border-t border-slate-100 mt-1">
                                                        <div className="flex items-start gap-3 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                                                            <div className="pt-0.5">
                                                                <input
                                                                    type="checkbox"
                                                                    id="isMain"
                                                                    checked={draftDept.isMainDepartment || false}
                                                                    onChange={(e) => setDraftDept({ ...draftDept, isMainDepartment: e.target.checked })}
                                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label htmlFor="isMain" className="text-sm font-medium text-slate-700 cursor-pointer select-none">设为主部门 (Main Department)</label>
                                                                <p className="text-xs text-slate-400 mt-0.5">主部门通常承载该层级的核心业务职能，将在架构图中高亮显示。</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 col-span-2">
                                                        <label className="text-sm font-semibold text-slate-700">部门职责</label>
                                                        <textarea
                                                            value={draftDept.responsibilities || ''}
                                                            onChange={(e) => setDraftDept({ ...draftDept, responsibilities: e.target.value })}
                                                            placeholder="请输入部门的主要职责描述、负责业务范围等..."
                                                            rows={3}
                                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none resize-none placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hierarchy Group */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">层级关系</h4>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">上级组织</label>
                                            <select
                                                value={draftDept.parentId || ''}
                                                onChange={(event) =>
                                                    setDraftDept({ ...draftDept, parentId: event.target.value || null })
                                                }
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                            >
                                                <option value="">作为根组织</option>
                                                {departments
                                                    .filter((d) => d.id !== draftDept.id)
                                                    .map((d) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.name}
                                                        </option>
                                                    ))}
                                            </select>
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
                                                <MapPin size={12} className="text-slate-400" />
                                                <span>路径预览：</span>
                                                <span className="font-medium text-slate-700">{getPathPreview(draftDept.parentId)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status - moved up */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">状态</label>
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
                                        onClick={saveDepartment}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                    >
                                        {modalMode === 'create' ? '创建组织' : '保存修改'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Success Step
                            <div className="p-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 leading-relaxed">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">组织创建成功</h3>
                                <p className="text-slate-500 mb-8 max-w-sm">
                                    <strong className="text-slate-700">{draftDept.name}</strong> ({draftDept.code}) 已成功创建，
                                    建议您立即完善以下信息以确保治理工作正常开展。
                                </p>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => { closeModal(); setShowMemberModal(true); }}
                                        className="flex flex-col items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600">
                                            <UserPlus size={24} />
                                        </div>
                                        <div className="text-sm font-semibold text-slate-700">添加成员</div>
                                    </button>
                                    <button
                                        onClick={() => { alert('跳转权限配置 (Mock)'); closeModal(); }}
                                        className="flex flex-col items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600">
                                            <Settings size={24} />
                                        </div>
                                        <div className="text-sm font-semibold text-slate-700">配置权限组</div>
                                    </button>
                                </div>

                                <button
                                    onClick={closeModal}
                                    className="mt-8 text-slate-400 hover:text-slate-600 text-sm"
                                >
                                    暂不处理，稍后完善
                                </button>
                            </div>
                        )}
                    </div>
                </div >
            )
            }

            {
                showMemberModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
                        <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                <h3 className="text-base font-bold text-slate-800">添加成员</h3>
                                <button
                                    onClick={() => setShowMemberModal(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 overflow-y-auto">
                                {/* Mock User Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">选择用户 <span className="text-rose-500">*</span></label>
                                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-400 cursor-not-allowed">
                                        点击搜索用户 (Mock: 暂时不支持真实搜索)
                                    </div>
                                </div>

                                {/* Governance Role */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">分配治理角色</label>
                                    <div className="flex flex-wrap gap-2">
                                        {roleCatalog.map(role => (
                                            <label key={role} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs cursor-pointer hover:border-indigo-300 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-200 has-[:checked]:text-indigo-700">
                                                <input type="radio" name="role" className="accent-indigo-600" />
                                                {role}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Function & Permission */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">权限与归属</label>
                                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input type="checkbox" className="rounded border-slate-300 accent-indigo-600" defaultChecked />
                                            设为主归属组织 (Primary Org)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input type="checkbox" className="rounded border-slate-300 accent-indigo-600" />
                                            授予部门管理权限 (Manager)
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 px-5 py-4 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                                <button
                                    onClick={() => setShowMemberModal(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        alert('已添加成员 (Mock action)');
                                        setShowMemberModal(false);
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                                >
                                    确认添加
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default OrgManagementView;

