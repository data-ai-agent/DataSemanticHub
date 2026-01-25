import { useMemo, useState } from 'react';
import {
    GitBranch,
    Plus,
    Search,
    Clock,
    ShieldCheck,
    Settings,
    Trash2,
    Pencil,
    X,
    Filter
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

type WorkflowStatus = '启用' | '停用';

type WorkflowStep = {
    id: string;
    name: string;
    type: '裁决' | '审批' | '校验' | '发布' | '通知';
    role: string;
    sla: string;
    required: boolean;
};

type Workflow = {
    id: string;
    name: string;
    code: string;
    description: string;
    status: WorkflowStatus;
    scope: string[];
    triggers: string[];
    owner: string;
    version: string;
    usage: number;
    builtIn: boolean;
    updatedAt: string;
    steps: WorkflowStep[];
};

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

const triggerOptions = [
    '语义裁决申请',
    '语义版本发布',
    '资产扫描完成',
    '数据质量异常',
    '数据安全策略变更',
    '业务场景上线'
];

const stepTemplates: Array<Omit<WorkflowStep, 'required'>> = [
    { id: 'step_resolution', name: '语义裁决', type: '裁决', role: '语义治理负责人', sla: '2 天' },
    { id: 'step_review', name: '版本评审', type: '审批', role: '版本委员会', sla: '1 天' },
    { id: 'step_quality', name: '质量校验', type: '校验', role: '数据质量管理员', sla: '4 小时' },
    { id: 'step_security', name: '安全审计', type: '校验', role: '安全审计', sla: '1 天' },
    { id: 'step_release', name: '发布确认', type: '发布', role: '平台管理员', sla: '4 小时' },
    { id: 'step_notice', name: '通知同步', type: '通知', role: '数据服务运营', sla: '即时' }
];

const initialWorkflows: Workflow[] = [
    {
        id: 'wf_semantic_release',
        name: '语义裁决与版本发布',
        code: 'semantic_release',
        description: '覆盖语义裁决、评审与发布的核心流程。',
        status: '启用',
        scope: ['语义资产', '版本中心', '业务场景'],
        triggers: ['语义裁决申请', '语义版本发布'],
        owner: '语义治理中心',
        version: 'v1.4',
        usage: 128,
        builtIn: true,
        updatedAt: '2024-06-26',
        steps: [
            { id: 'step_resolution', name: '语义裁决', type: '裁决', role: '语义治理负责人', sla: '2 天', required: true },
            { id: 'step_review', name: '版本评审', type: '审批', role: '版本委员会', sla: '1 天', required: true },
            { id: 'step_quality', name: '质量校验', type: '校验', role: '数据质量管理员', sla: '4 小时', required: true },
            { id: 'step_release', name: '发布确认', type: '发布', role: '平台主管理员', sla: '4 小时', required: true },
            { id: 'step_notice', name: '通知同步', type: '通知', role: '数据服务运营', sla: '即时', required: false }
        ]
    },
    {
        id: 'wf_security_policy',
        name: '数据安全策略审批',
        code: 'security_policy',
        description: '安全策略变更需经过审计审批与发布。',
        status: '启用',
        scope: ['数据安全', '数据服务'],
        triggers: ['数据安全策略变更'],
        owner: '安全合规部',
        version: 'v1.1',
        usage: 46,
        builtIn: true,
        updatedAt: '2024-06-20',
        steps: [
            { id: 'step_security', name: '安全审计', type: '校验', role: '安全审计', sla: '1 天', required: true },
            { id: 'step_review', name: '版本评审', type: '审批', role: '安全委员会', sla: '1 天', required: true },
            { id: 'step_release', name: '发布确认', type: '发布', role: '平台管理员', sla: '4 小时', required: true },
            { id: 'step_notice', name: '通知同步', type: '通知', role: '数据服务运营', sla: '即时', required: false }
        ]
    },
    {
        id: 'wf_quality_incident',
        name: '数据质量异常处置',
        code: 'quality_incident',
        description: '质量异常协同处理与跟踪闭环。',
        status: '启用',
        scope: ['数据质量', '语义资产'],
        triggers: ['数据质量异常'],
        owner: '数据质量中心',
        version: 'v2.0',
        usage: 82,
        builtIn: false,
        updatedAt: '2024-06-12',
        steps: [
            { id: 'step_quality', name: '质量校验', type: '校验', role: '数据质量管理员', sla: '4 小时', required: true },
            { id: 'step_resolution', name: '语义裁决', type: '裁决', role: '语义治理负责人', sla: '1 天', required: true },
            { id: 'step_notice', name: '通知同步', type: '通知', role: '数据服务运营', sla: '即时', required: false }
        ]
    },
    {
        id: 'wf_scene_launch',
        name: '业务场景上线审批',
        code: 'scene_launch',
        description: '业务场景与服务发布前的治理审批。',
        status: '停用',
        scope: ['业务场景', '数据服务'],
        triggers: ['业务场景上线'],
        owner: '业务运营部',
        version: 'v1.0',
        usage: 18,
        builtIn: false,
        updatedAt: '2024-05-30',
        steps: [
            { id: 'step_review', name: '版本评审', type: '审批', role: '版本委员会', sla: '1 天', required: true },
            { id: 'step_release', name: '发布确认', type: '发布', role: '平台管理员', sla: '4 小时', required: true },
            { id: 'step_notice', name: '通知同步', type: '通知', role: '数据服务运营', sla: '即时', required: true }
        ]
    }
];

const formatDate = () => new Date().toISOString().split('T')[0];

const createStepFromTemplate = (template: Omit<WorkflowStep, 'required'>): WorkflowStep => ({
    ...template,
    required: true
});

const WorkflowManagementView = () => {
    const toast = useToast();
    const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
    const [activeWorkflowId, setActiveWorkflowId] = useState(initialWorkflows[0]?.id ?? '');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | WorkflowStatus>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [draftWorkflow, setDraftWorkflow] = useState<Workflow | null>(null);
    const [draftSteps, setDraftSteps] = useState<WorkflowStep[]>([]);

    const filteredWorkflows = useMemo(() => {
        return workflows.filter((workflow) => {
            const matchesSearch = `${workflow.name}${workflow.code}${workflow.description}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [workflows, searchTerm, statusFilter]);

    const activeWorkflow = workflows.find((workflow) => workflow.id === activeWorkflowId) ?? workflows[0];

    const stats = useMemo(() => {
        const enabledCount = workflows.filter((workflow) => workflow.status === '启用').length;
        const disabledCount = workflows.length - enabledCount;
        const totalUsage = workflows.reduce((sum, workflow) => sum + workflow.usage, 0);
        return { enabledCount, disabledCount, totalUsage };
    }, [workflows]);

    const recentRuns = [
        { id: 'run_01', name: '语义裁决与版本发布', status: '进行中', owner: '王宁', time: '10 分钟前' },
        { id: 'run_02', name: '数据质量异常处置', status: '已完成', owner: '李晨', time: '2 小时前' },
        { id: 'run_03', name: '数据安全策略审批', status: '待审批', owner: '张倩', time: '昨天 17:20' }
    ];

    const openCreateModal = () => {
        setModalMode('create');
        setDraftWorkflow({
            id: `wf_${Date.now()}`,
            name: '',
            code: '',
            description: '',
            status: '启用',
            scope: [],
            triggers: [],
            owner: '语义治理中心',
            version: 'v1.0',
            usage: 0,
            builtIn: false,
            updatedAt: formatDate(),
            steps: []
        });
        setDraftSteps(stepTemplates.map(createStepFromTemplate).slice(0, 3));
        setModalOpen(true);
    };

    const openEditModal = (workflow: Workflow) => {
        setModalMode('edit');
        setDraftWorkflow({ ...workflow });
        setDraftSteps(workflow.steps.map((step) => ({ ...step })));
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftWorkflow(null);
        setDraftSteps([]);
    };

    const handleSaveWorkflow = () => {
        if (!draftWorkflow) {
            return;
        }
        if (!draftWorkflow.name.trim() || !draftWorkflow.code.trim()) {
            toast.error('请填写工作流名称与编码。');
            return;
        }
        const nextWorkflow = {
            ...draftWorkflow,
            updatedAt: formatDate(),
            steps: draftSteps
        };
        if (modalMode === 'create') {
            setWorkflows((prev) => [nextWorkflow, ...prev]);
            setActiveWorkflowId(nextWorkflow.id);
        } else {
            setWorkflows((prev) => prev.map((item) => (item.id === nextWorkflow.id ? nextWorkflow : item)));
        }
        closeModal();
    };

    const handleToggleStatus = (workflow: Workflow) => {
        setWorkflows((prev) =>
            prev.map((item) =>
                item.id === workflow.id
                    ? {
                        ...item,
                        status: item.status === '启用' ? '停用' : '启用',
                        updatedAt: formatDate()
                    }
                    : item
            )
        );
    };

    const handleDeleteWorkflow = (workflow: Workflow) => {
        if (workflow.builtIn) {
            return;
        }
        if (!confirm('确定要删除该工作流吗？')) {
            return;
        }
        const next = workflows.filter((item) => item.id !== workflow.id);
        setWorkflows(next);
        if (activeWorkflowId === workflow.id) {
            setActiveWorkflowId(next[0]?.id ?? '');
        }
    };

    const toggleDraftScope = (scope: string) => {
        if (!draftWorkflow) {
            return;
        }
        const exists = draftWorkflow.scope.includes(scope);
        setDraftWorkflow({
            ...draftWorkflow,
            scope: exists ? draftWorkflow.scope.filter((item) => item !== scope) : [...draftWorkflow.scope, scope]
        });
    };

    const toggleDraftTrigger = (trigger: string) => {
        if (!draftWorkflow) {
            return;
        }
        const exists = draftWorkflow.triggers.includes(trigger);
        setDraftWorkflow({
            ...draftWorkflow,
            triggers: exists
                ? draftWorkflow.triggers.filter((item) => item !== trigger)
                : [...draftWorkflow.triggers, trigger]
        });
    };

    const toggleDraftStep = (templateId: string) => {
        const template = stepTemplates.find((item) => item.id === templateId);
        if (!template) {
            return;
        }
        setDraftSteps((prev) => {
            const exists = prev.some((step) => step.id === templateId);
            if (exists) {
                return prev.filter((step) => step.id !== templateId);
            }
            return [...prev, createStepFromTemplate(template)];
        });
    };

    const updateDraftStep = (id: string, updates: Partial<WorkflowStep>) => {
        setDraftSteps((prev) =>
            prev.map((step) => (step.id === id ? { ...step, ...updates } : step))
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <GitBranch size={22} className="text-indigo-600" />
                        工作流管理
                    </h2>
                    <p className="text-slate-500 mt-1">配置语义治理流程与审批路径，确保语义变更可控可追溯。</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300">
                        <Settings size={14} className="inline mr-1" /> 流程模板
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建工作流
                    </button>
                </div>
            </div>

            <div className="grid gap-4 px-1 md:grid-cols-3">
                {[
                    { label: '启用工作流', value: `${stats.enabledCount}`, icon: ShieldCheck, note: `停用 ${stats.disabledCount} 条` },
                    { label: '流程调用', value: `${stats.totalUsage}`, icon: Clock, note: '近 30 日累计' },
                    { label: '治理流程覆盖', value: '9', icon: GitBranch, note: '覆盖核心域' }
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
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <Search size={16} className="text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="搜索工作流名称、编码或描述"
                                className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Filter size={14} />
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | WorkflowStatus)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部状态</option>
                                <option value="启用">启用</option>
                                <option value="停用">停用</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {filteredWorkflows.map((workflow) => {
                            const isActive = workflow.id === activeWorkflowId;
                            return (
                                <button
                                    key={workflow.id}
                                    onClick={() => setActiveWorkflowId(workflow.id)}
                                    className={`w-full text-left rounded-xl border p-4 transition ${isActive
                                            ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800">{workflow.name}</span>
                                                {workflow.builtIn && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                        系统内置
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">{workflow.description}</p>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${workflow.status === '启用'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-slate-100 text-slate-500'
                                                }`}
                                        >
                                            {workflow.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        <span>版本 {workflow.version}</span>
                                        <span>调用 {workflow.usage}</span>
                                        <span>{workflow.updatedAt} 更新</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">{activeWorkflow?.name ?? '—'}</h3>
                            <p className="mt-1 text-sm text-slate-500">{activeWorkflow?.description ?? '暂无描述'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => activeWorkflow && openEditModal(activeWorkflow)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                <Pencil size={14} /> 编辑
                            </button>
                            <button
                                onClick={() => activeWorkflow && handleToggleStatus(activeWorkflow)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800"
                            >
                                {activeWorkflow?.status === '启用' ? '停用' : '启用'}
                            </button>
                            <button
                                onClick={() => activeWorkflow && handleDeleteWorkflow(activeWorkflow)}
                                disabled={activeWorkflow?.builtIn}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 ${activeWorkflow?.builtIn
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
                            { label: '责任团队', value: activeWorkflow?.owner ?? '-', icon: ShieldCheck },
                            { label: '触发次数', value: `${activeWorkflow?.usage ?? 0}`, icon: Clock },
                            { label: '版本', value: activeWorkflow?.version ?? '-', icon: GitBranch }
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
                        <p className="text-sm font-semibold text-slate-700">适用范围</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {activeWorkflow?.scope?.length ? (
                                activeWorkflow.scope.map((scope) => (
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
                        <p className="text-sm font-semibold text-slate-700">触发条件</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {activeWorkflow?.triggers?.length ? (
                                activeWorkflow.triggers.map((trigger) => (
                                    <span
                                        key={trigger}
                                        className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs text-emerald-600"
                                    >
                                        {trigger}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400">未设置触发条件</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700">流程节点</p>
                        <div className="mt-3 space-y-3">
                            {activeWorkflow?.steps?.length ? (
                                activeWorkflow.steps.map((step, index) => (
                                    <div key={step.id} className="flex items-start gap-3">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 rounded-xl border border-slate-200 p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-semibold text-slate-800">{step.name}</div>
                                                <span className="text-xs text-slate-500">{step.sla}</span>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {step.type} · {step.role}
                                                {step.required ? ' · 必选' : ' · 可选'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-400">暂无流程节点</div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-700">最近运行</p>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                {recentRuns.map((run) => (
                                    <div key={run.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-700">{run.name}</p>
                                            <p className="text-slate-400">{run.owner}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-500">{run.status}</p>
                                            <p className="text-slate-400">{run.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-700">治理提醒</p>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                {[
                                    '语义裁决节点 SLA 临近',
                                    '数据质量异常工单待确认',
                                    '安全审计节点已延期'
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

            {modalOpen && draftWorkflow && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {modalMode === 'create' ? '新建工作流' : '编辑工作流'}
                                    </h3>
                                    <p className="text-xs text-slate-500">配置流程信息、触发条件与节点策略。</p>
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
                                        <label className="text-xs font-semibold text-slate-600">工作流名称</label>
                                        <input
                                            value={draftWorkflow.name}
                                            onChange={(event) =>
                                                setDraftWorkflow({ ...draftWorkflow, name: event.target.value })
                                            }
                                            placeholder="例如：语义裁决与版本发布"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">工作流编码</label>
                                        <input
                                            value={draftWorkflow.code}
                                            onChange={(event) =>
                                                setDraftWorkflow({ ...draftWorkflow, code: event.target.value })
                                            }
                                            placeholder="semantic_release"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600">流程描述</label>
                                        <textarea
                                            value={draftWorkflow.description}
                                            onChange={(event) =>
                                                setDraftWorkflow({ ...draftWorkflow, description: event.target.value })
                                            }
                                            placeholder="描述该流程适用的业务与治理场景"
                                            className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">状态</label>
                                        <select
                                            value={draftWorkflow.status}
                                            onChange={(event) =>
                                                setDraftWorkflow({
                                                    ...draftWorkflow,
                                                    status: event.target.value as WorkflowStatus
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="启用">启用</option>
                                            <option value="停用">停用</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">责任团队</label>
                                        <input
                                            value={draftWorkflow.owner}
                                            onChange={(event) =>
                                                setDraftWorkflow({ ...draftWorkflow, owner: event.target.value })
                                            }
                                            placeholder="语义治理中心"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-700">适用范围</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {scopeOptions.map((scope) => {
                                            const active = draftWorkflow.scope.includes(scope);
                                            return (
                                                <button
                                                    key={scope}
                                                    type="button"
                                                    onClick={() => toggleDraftScope(scope)}
                                                    className={`rounded-full border px-3 py-1 text-xs transition ${active
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
                                    <p className="text-sm font-semibold text-slate-700">触发条件</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {triggerOptions.map((trigger) => {
                                            const active = draftWorkflow.triggers.includes(trigger);
                                            return (
                                                <button
                                                    key={trigger}
                                                    type="button"
                                                    onClick={() => toggleDraftTrigger(trigger)}
                                                    className={`rounded-full border px-3 py-1 text-xs transition ${active
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                                            : 'border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-slate-700'
                                                        }`}
                                                >
                                                    {trigger}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-700">流程节点</p>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        {stepTemplates.map((template) => {
                                            const active = draftSteps.some((step) => step.id === template.id);
                                            return (
                                                <div
                                                    key={template.id}
                                                    className={`rounded-xl border p-3 ${active ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200'
                                                        }`}
                                                >
                                                    <label className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-slate-700">
                                                            {template.name}
                                                        </span>
                                                        <input
                                                            type="checkbox"
                                                            checked={active}
                                                            onChange={() => toggleDraftStep(template.id)}
                                                            className="h-4 w-4 accent-indigo-600"
                                                        />
                                                    </label>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {template.type} · 默认 {template.role}
                                                    </p>
                                                    {active && (
                                                        <div className="mt-3 grid gap-2 text-xs text-slate-600">
                                                            <input
                                                                value={
                                                                    draftSteps.find((step) => step.id === template.id)?.role ??
                                                                    template.role
                                                                }
                                                                onChange={(event) =>
                                                                    updateDraftStep(template.id, { role: event.target.value })
                                                                }
                                                                placeholder="负责人角色"
                                                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                                                            />
                                                            <input
                                                                value={
                                                                    draftSteps.find((step) => step.id === template.id)?.sla ??
                                                                    template.sla
                                                                }
                                                                onChange={(event) =>
                                                                    updateDraftStep(template.id, { sla: event.target.value })
                                                                }
                                                                placeholder="SLA"
                                                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
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
                                    onClick={handleSaveWorkflow}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    {modalMode === 'create' ? '创建工作流' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowManagementView;
