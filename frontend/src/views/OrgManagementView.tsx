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
    Layout,
    Loader2
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import {
    organizationService,
    OrgTreeNode,
    GetOrgTreeReq,
    CreateOrgReq,
    UpdateOrgReq,
    DeptUser,
    SetUserPrimaryDeptReq,
    AddUserAuxDeptReq,
    RemoveUserAuxDeptReq
} from '../services/organizationService';
import { userManagementService, User } from '../services/userManagement';
import { useEffect } from 'react';

type OrgStatus = '启用' | '停用';

type Department = {
    id: string;
    name: string;
    code: string;
    parentId: string | null;
    manager: string;
    leaderId?: string; // 负责人ID
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

// Map API types to Frontend types
const mapNodeToDepartment = (node: OrgTreeNode): Department => {
    return {
        id: node.id,
        name: node.name,
        code: node.code,
        parentId: (node.parentId === '0' || !node.parentId) ? null : node.parentId,
        manager: node.leaderName || '-',
        leaderId: node.leaderId || undefined,
        members: 0, // Not returned by tree API yet
        status: node.status === 1 ? '启用' : '停用',
        region: '集团', // Default
        order: node.sortOrder,
        updatedAt: new Date().toISOString().split('T')[0], // Mock for list
        description: '', // Not in tree
        builtIn: false,
        type: node.type === 1 ? 'organization' : 'department',
        functions: [], // Mock
    };
};

const flattenTree = (nodes: OrgTreeNode[]): Department[] => {
    let result: Department[] = [];
    nodes.forEach(node => {
        result.push(mapNodeToDepartment(node));
        if (node.children && node.children.length > 0) {
            result = result.concat(flattenTree(node.children));
        }
    });
    return result;
};


const formatDate = () => new Date().toISOString().split('T')[0];

const OrgManagementView = () => {
    const toast = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch data logic
    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const resp = await organizationService.getOrgTree({});
            const flatDepts = flattenTree(resp.tree);
            // Sort by order locally if needed, though API might already sort
            setDepartments(flatDepts);

            if (activeDeptId === '' && flatDepts.length > 0) {
                setActiveDeptId(flatDepts[0].id);
            }
        } catch (error) {
            console.error(error);
            toast.error('获取组织架构失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const [activeDeptId, setActiveDeptId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | OrgStatus>('all');
    const [regionFilter, setRegionFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [createStep, setCreateStep] = useState<'form' | 'success'>('form'); // New state for post-create guide
    const [draftDept, setDraftDept] = useState<Department | null>(null);
    const [showValidation, setShowValidation] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    // User Selection Modal State
    const [showUserSelectModal, setShowUserSelectModal] = useState(false);
    const [userList, setUserList] = useState<User[]>([]);
    const [userListLoading, setUserListLoading] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userTotal, setUserTotal] = useState(0);
    const userPageSize = 20;

    // Member Form State
    const [memberForm, setMemberForm] = useState({
        id: '',
        userIdInput: '', // Start with empty for new add
        name: '', // Display only for edit
        role: '',
        isPrimary: true,
        permissions: [] as string[],
        status: '在岗' as Member['status']
    });

    // Adapted to use DeptUser type partially
    const openMemberModal = (member?: any) => { // Using any for transition from Member type to DeptUser
        if (member) {
            // Edit Mode
            setMemberForm({
                id: member.userId, // Map userId to id for internal form logic
                userIdInput: member.userId,
                name: member.userName,
                role: '语义治理', // Mock
                isPrimary: member.isPrimary,
                permissions: [], // Mock
                status: '在岗'
            });
        } else {
            // Create Mode
            setMemberForm({
                id: '',
                userIdInput: '', // Clear input
                name: '',
                role: '语义治理', // Default
                isPrimary: true,
                permissions: [],
                status: '在岗'
            });
        }
        setShowMemberModal(true);
    };

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

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        const sourceId = draggedNodeId;
        if (!sourceId || sourceId === targetId) return;

        // Find source and target
        const source = departments.find(d => d.id === sourceId);
        const target = departments.find(d => d.id === targetId);
        if (!source || !target) return;

        // Current limitation: Only support reordering within same parent, OR reparenting if logic added.
        // For now, let's keep the existing constraint: same parent only.
        if (source.parentId !== target.parentId) {
            toast.info('暂不支持跨层级移动');
            return;
        }

        // Calculate new order
        const siblings = departments
            .filter(d => d.parentId === source.parentId)
            .sort((a, b) => a.order - b.order);

        const sourceIndex = siblings.findIndex(s => s.id === sourceId);
        const targetIndex = siblings.findIndex(s => s.id === targetId);

        const newSiblings = [...siblings];
        const [moved] = newSiblings.splice(sourceIndex, 1);
        newSiblings.splice(targetIndex, 0, moved);

        const sortOrders = newSiblings.map(s => s.id);

        try {
            await organizationService.moveOrg({
                id: sourceId,
                targetParentId: source.parentId || '0',
                sortOrders: sortOrders
            });
            toast.success('移动成功');
            fetchDepartments();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '移动失败');
        }
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

    const [members, setMembers] = useState<DeptUser[]>([]);
    const [memberLoading, setMemberLoading] = useState(false);

    const fetchMembers = async (deptId: string) => {
        if (!deptId) return;
        setMemberLoading(true);
        try {
            const resp = await organizationService.getOrgUsers(deptId, false);
            setMembers(resp.users);
        } catch (error) {
            console.error(error);
            toast.error('获取部门成员失败');
        } finally {
            setMemberLoading(false);
        }
    };

    const handleRemoveMember = async (memberUserId: string, isPrimary: boolean) => {
        if (!activeDeptId) return;

        if (isPrimary) {
            toast.warning('无法直接移除主归属成员，请先调整其主部门或删除用户');
            return;
        }

        if (!confirm('确定要移除该辅助部门成员吗？')) return;

        try {
            await organizationService.removeUserAuxDept({
                userId: memberUserId,
                deptId: activeDeptId
            });
            toast.success('成员移除成功');
            fetchMembers(activeDeptId);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '移除失败');
        }
    };

    const handleSaveMember = async () => {
        if (!activeDeptId) return;
        // Check required fields
        if (!memberForm.id && !memberForm.userIdInput) { // Assuming we add an input for userId if creating
            toast.error('请选择或输入用户');
            return;
        }

        const targetUserId = memberForm.id || memberForm.userIdInput;

        try {
            if (memberForm.isPrimary) {
                // Set as Primary
                await organizationService.setUserPrimaryDept({
                    userId: targetUserId,
                    deptId: activeDeptId
                });
            } else {
                // Add as Aux (only valid for adding new aux, not updating existing aux to aux - though idempotent often)
                // If we are editing, and it was already aux, this might be redundant but safe.
                // If it was primary and we want to change to aux, we can't do it via AddUserAuxDept usually (need to set another primary).
                // Let's assume this is mostly for "Add Member" or "Change to Primary".
                await organizationService.addUserAuxDept({
                    userId: targetUserId,
                    deptId: activeDeptId
                });
            }

            toast.success(memberForm.id ? '成员信息已更新' : '已添加成员');
            setShowMemberModal(false);
            fetchMembers(activeDeptId);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '操作失败');
        }
    };

    const [activeDeptDetail, setActiveDeptDetail] = useState<Department | null>(null);

    const fetchDeptDetail = async (id: string) => {
        if (!id) return;
        try {
            const { detail } = await organizationService.getOrgDetail(id);
            // Map OrgDetail to Department
            const detailedDept: Department = {
                id: detail.id,
                name: detail.name,
                code: detail.code,
                parentId: detail.parentId,
                manager: detail.leaderName,
                leaderId: detail.leaderId || undefined,
                members: 0, // Still not in detail
                status: detail.status === 1 ? '启用' : '停用',
                region: '集团',
                order: detail.sortOrder,
                updatedAt: detail.updatedAt,
                description: detail.desc,
                builtIn: false,
                type: detail.type === 1 ? 'organization' : 'department',
                // responsibilities not in API explicitly, maybe map from desc? 
                // Or if 'desc' stores responsibilities? 
                // Let's assume desc is description.
            };
            setActiveDeptDetail(detailedDept);
        } catch (error) {
            console.error('Failed to fetch detail', error);
        }
    };

    useEffect(() => {
        if (activeDeptId) {
            fetchMembers(activeDeptId);
            fetchDeptDetail(activeDeptId);
        } else {
            setMembers([]);
            setActiveDeptDetail(null);
        }
    }, [activeDeptId]);

    const activeDept = (activeDeptDetail || departments.find((item) => item.id === activeDeptId)) ?? departments[0];

    const filteredMembers = useMemo(() => {
        if (!activeDept) return [];
        return members.filter(m => {
            const matchesSearch = memberSearch ? (m.userName.includes(memberSearch)) : true; // Only name available in DeptUser
            // Role filter is not applicable as DeptUser doesn't have role yet, need to fetch detail or ignore for now
            const matchesRole = memberRoleFilter === 'all' ? true : true; // m.role === memberRoleFilter; 
            return matchesSearch && matchesRole;
        });
    }, [activeDept, members, memberSearch, memberRoleFilter]);

    const handleSelectMember = (id: string, checked: boolean) => {
        const next = new Set(selectedMembers);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedMembers(next);
    };

    const handleSelectAllMembers = (checked: boolean) => {
        if (checked) {
            setSelectedMembers(new Set(filteredMembers.map(m => m.userId)));
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
        setShowValidation(false);
        setErrorMessage(null);
        setDraftDept({
            id: '',
            name: '',
            code: '',
            parentId: activeDeptId || null,
            manager: '',
            leaderId: undefined,
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

    const openEditModal = async (dept: Department) => {
        setModalMode('edit');
        // If we are editing the active dept and have detail, use it.
        // Otherwise fetch detail to ensure we have description etc.
        let targetDept = dept;
        if (dept.id === activeDeptDetail?.id) {
            targetDept = activeDeptDetail;
        } else {
            try {
                const { detail } = await organizationService.getOrgDetail(dept.id);
                targetDept = {
                    ...dept,
                    description: detail.desc,
                    parentId: detail.parentId,
                    manager: detail.leaderName || dept.manager,
                    leaderId: detail.leaderId || dept.leaderId,
                    // functions? 
                };
            } catch (e) {
                // ignore, just use list info
            }
        }

        setDraftDept({ ...targetDept });
        setShowValidation(false);
        setErrorMessage(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftDept(null);
        setCreateStep('form'); // Reset step on close
    };

    const saveDepartment = async () => {
        if (!draftDept) {
            return;
        }
        setShowValidation(true);
        if (!draftDept.name.trim() || !draftDept.code.trim()) {
            return;
        }

        try {
            if (modalMode === 'create') {
                const req: CreateOrgReq = {
                    parentId: draftDept.parentId ?? '0',
                    name: draftDept.name,
                    code: draftDept.code,
                    type: draftDept.type === 'organization' ? 1 : 2,
                    desc: draftDept.description || draftDept.responsibilities,
                    leaderId: draftDept.leaderId,
                    // sortOrder: 0
                };
                await organizationService.createOrg(req);
                toast.success('组织创建成功');
                // Show Success Step instead of closing immediately
                setCreateStep('success');
                // Refresh list
                fetchDepartments();
            } else {
                const req: UpdateOrgReq = {
                    name: draftDept.name,
                    code: draftDept.code,
                    desc: draftDept.description || draftDept.responsibilities,
                    status: draftDept.status === '启用' ? 1 : 0,
                    sortOrder: draftDept.order,
                    // 如果 leaderId 是 undefined，传递空字符串以支持清空负责人
                    leaderId: draftDept.leaderId || ''
                };
                await organizationService.updateOrg(draftDept.id, req);
                toast.success('组织更新成功');
                fetchDepartments();
                closeModal();
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '操作失败');
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

    // Fetch Users for Selection
    const fetchUsers = async (page: number = 1, keyword: string = '') => {
        setUserListLoading(true);
        try {
            const response = await userManagementService.listUsers({
                page,
                page_size: userPageSize,
                keyword: keyword.trim() || undefined,
            });
            setUserList(response.users);
            setUserTotal(response.total);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '获取用户列表失败');
        } finally {
            setUserListLoading(false);
        }
    };

    // Open User Selection Modal
    const openUserSelectModal = () => {
        setShowUserSelectModal(true);
        setUserSearchTerm('');
        setUserPage(1);
        fetchUsers(1, '');
    };

    // Handle User Selection
    const handleSelectUser = (user: User) => {
        setDraftDept(prev => prev ? ({
            ...prev,
            manager: user.name,
            leaderId: user.id
        }) : null);
        setShowUserSelectModal(false);
    };

    // Clear Manager
    const handleClearManager = () => {
        setDraftDept(prev => prev ? ({
            ...prev,
            manager: '',
            leaderId: undefined
        }) : null);
    };

    const toggleFunction = (func: string) => {
        if (!draftDept) return;
        const current = draftDept.functions || [];
        const next = current.includes(func)
            ? current.filter(f => f !== func)
            : [...current, func];
        setDraftDept({ ...draftDept, functions: next });
    };

    const handleDelete = async (dept: Department, force = false) => {
        if (dept.builtIn && !force) {
            return;
        }
        // if (!confirm('确定要删除该组织节点吗？')) {
        //     return;
        // }

        try {
            await organizationService.deleteOrg(dept.id);
            toast.success('删除成功');
            if (activeDeptId === dept.id) {
                setActiveDeptId(''); // Will reset to first available in fetchDepartments or effect
            }
            fetchDepartments();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '删除失败');
        }
    };

    const handleToggleStatus = async (dept: Department, force = false) => {
        try {
            const newStatus = dept.status === '启用' ? 0 : 1;
            await organizationService.updateOrg(dept.id, {
                status: newStatus
            });
            toast.success('状态更新成功');
            fetchDepartments();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '更新状态失败');
        }
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
                                    onClick={() => openMemberModal()}
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
                                            <tr key={member.userId} className="group hover:bg-slate-50">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300"
                                                        checked={selectedMembers.has(member.userId)}
                                                        onChange={e => handleSelectMember(member.userId, e.target.checked)}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="font-medium text-slate-700">{member.userName}</div>
                                                    <div className="text-slate-400 scale-90 origin-left">{'暂无职位'}</div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{'普通成员'}</span>
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
                                                    {'-'}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`flex items-center gap-1.5 text-slate-600`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400`} />
                                                        {'在岗'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        className="text-indigo-600 hover:text-indigo-700 mr-2"
                                                        onClick={() => toast.info('编辑成员暂未实现')}
                                                    >
                                                        设置
                                                    </button>
                                                    <button
                                                        className="text-rose-600 hover:text-rose-700"
                                                        onClick={() => handleRemoveMember(member.userId, member.isPrimary)}
                                                    >
                                                        移除
                                                    </button>
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
            </div >

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
                                    {errorMessage && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-sm animate-in fade-in slide-in-from-top-2">
                                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                            <span>{errorMessage}</span>
                                        </div>
                                    )}
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
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none ${showValidation && !draftDept.name.trim()
                                                        ? 'border-red-500 focus:border-red-500'
                                                        : 'border-slate-200 focus:border-indigo-500'
                                                        }`}
                                                />
                                                {showValidation && !draftDept.name.trim() && (
                                                    <p className="text-xs text-red-500 mt-1">请输入组织名称</p>
                                                )}
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
                                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none ${showValidation && !draftDept.code.trim()
                                                            ? 'border-red-500 focus:border-red-500'
                                                            : 'border-slate-200 focus:border-indigo-500'
                                                            }`}
                                                    />
                                                    <button
                                                        onClick={generateCode}
                                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 whitespace-nowrap"
                                                    >
                                                        自动生成
                                                    </button>
                                                </div>
                                                {showValidation && !draftDept.code.trim() && (
                                                    <p className="text-xs text-red-500 mt-1">请输入组织编码</p>
                                                )}
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
                                                                <span className="flex-1">{draftDept.manager}</span>
                                                                <button
                                                                    onClick={handleClearManager}
                                                                    className="text-slate-400 hover:text-slate-600 p-1"
                                                                    title="清除负责人"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400">未指定</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={openUserSelectModal}
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
                                        onClick={() => { closeModal(); openMemberModal(); }}
                                        className="flex flex-col items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                    >
                                        <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600">
                                            <UserPlus size={24} />
                                        </div>
                                        <div className="text-sm font-semibold text-slate-700">添加成员</div>
                                    </button>
                                    <button
                                        onClick={() => { toast.info('跳转权限配置 (Mock)'); closeModal(); }}
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
                                <h3 className="text-base font-bold text-slate-800">
                                    {memberForm.id ? '编辑成员配置' : '添加成员'}
                                </h3>
                                <button
                                    onClick={() => setShowMemberModal(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 space-y-5 overflow-y-auto">
                                {/* User Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">用户 <span className="text-rose-500">*</span></label>
                                    {memberForm.id ? (
                                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-700 font-medium flex items-center justify-between">
                                            {memberForm.name}
                                            <span className="text-xs text-slate-400">不可修改</span>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="请输入用户ID (临时)"
                                            className="w-full p-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                            value={memberForm.userIdInput}
                                            onChange={(e) => setMemberForm({ ...memberForm, userIdInput: e.target.value })}
                                        />
                                    )}
                                </div>

                                {/* Governance Role */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">分配治理角色</label>
                                    <div className="flex flex-wrap gap-2">
                                        {roleCatalog.map(role => (
                                            <label key={role} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs cursor-pointer transition-colors ${memberForm.role === role
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                : 'border-slate-200 hover:border-indigo-300'
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    className="accent-indigo-600 hidden"
                                                    checked={memberForm.role === role}
                                                    onChange={() => setMemberForm({ ...memberForm, role })}
                                                />
                                                {role}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Function & Permission */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">权限与归属</label>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 accent-indigo-600 w-4 h-4"
                                                checked={memberForm.isPrimary}
                                                onChange={(e) => setMemberForm({ ...memberForm, isPrimary: e.target.checked })}
                                            />
                                            设为主归属组织 (Primary Org)
                                        </label>
                                        <div className="h-px bg-slate-200 my-1" />
                                        <div className="space-y-2">
                                            <div className="text-xs font-semibold text-slate-500">操作权限</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'manage', label: '部门管理 (Manager)' },
                                                    { id: 'audit', label: '审核 (Audit)' },
                                                    { id: 'operate', label: '操作 (Operate)' },
                                                    { id: 'view', label: '只读 (View)' }
                                                ].map(perm => {
                                                    const hasPerm = memberForm.permissions.includes(perm.id);
                                                    return (
                                                        <label key={perm.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-slate-300 accent-indigo-600"
                                                                checked={hasPerm}
                                                                onChange={(e) => {
                                                                    const next = e.target.checked
                                                                        ? [...memberForm.permissions, perm.id]
                                                                        : memberForm.permissions.filter(p => p !== perm.id);
                                                                    setMemberForm({ ...memberForm, permissions: next });
                                                                }}
                                                            />
                                                            {perm.label}
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {memberForm.id && (
                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                        <label className="text-sm font-semibold text-slate-700">成员状态</label>
                                        <select
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                            value={memberForm.status}
                                            onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as any })}
                                        >
                                            <option value="在岗">在岗</option>
                                            <option value="调岗">调岗</option>
                                            <option value="离职">离职</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 px-5 py-4 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                                <button
                                    onClick={() => setShowMemberModal(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveMember}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                                >
                                    {memberForm.id ? '保存修改' : '确认添加'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* User Selection Modal */}
            {showUserSelectModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-800">选择负责人</h3>
                            <button
                                onClick={() => setShowUserSelectModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex flex-col gap-4">
                            {/* Search */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="搜索用户姓名、邮箱或手机号..."
                                        value={userSearchTerm}
                                        onChange={(e) => {
                                            setUserSearchTerm(e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setUserPage(1);
                                                fetchUsers(1, userSearchTerm);
                                            }
                                        }}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setUserPage(1);
                                        fetchUsers(1, userSearchTerm);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 whitespace-nowrap"
                                >
                                    搜索
                                </button>
                            </div>

                            {/* User List */}
                            <div className="flex-1 overflow-y-auto min-h-[300px]">
                                {userListLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 size={24} className="animate-spin text-indigo-600" />
                                        <span className="ml-2 text-sm text-slate-500">加载中...</span>
                                    </div>
                                ) : userList.length > 0 ? (
                                    <div className="space-y-2">
                                        {userList.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleSelectUser(user)}
                                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-colors"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-slate-800">{user.name}</div>
                                                    <div className="text-xs text-slate-500 truncate">
                                                        {user.email}
                                                        {user.phone && ` • ${user.phone}`}
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-400" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Users size={32} className="mb-2" />
                                        <p className="text-sm">暂无用户数据</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {userTotal > 0 && (
                                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                    <div className="text-sm text-slate-500">
                                        共 {userTotal} 个用户，第 {userPage} / {Math.ceil(userTotal / userPageSize)} 页
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (userPage > 1) {
                                                    const newPage = userPage - 1;
                                                    setUserPage(newPage);
                                                    fetchUsers(newPage, userSearchTerm);
                                                }
                                            }}
                                            disabled={userPage <= 1}
                                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            上一页
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (userPage < Math.ceil(userTotal / userPageSize)) {
                                                    const newPage = userPage + 1;
                                                    setUserPage(newPage);
                                                    fetchUsers(newPage, userSearchTerm);
                                                }
                                            }}
                                            disabled={userPage >= Math.ceil(userTotal / userPageSize)}
                                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            下一页
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowUserSelectModal(false)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default OrgManagementView;

