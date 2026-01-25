import { useMemo, useState } from 'react';
import {
    ShieldCheck,
    Plus,
    Search,
    Filter,
    Clock,
    Settings,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

type PolicyStatus = '启用' | '停用';

type PolicyStep = {
    id: string;
    name: string;
    role: string;
    sla: string;
    required: boolean;
};

type PolicyRule = {
    id: string;
    name: string;
    condition: string;
    action: string;
};

type ApprovalPolicy = {
    id: string;
    name: string;
    code: string;
    description: string;
    status: PolicyStatus;
    scope: string[];
    triggers: string[];
    owner: string;
    level: '高' | '中' | '低';
    usage: number;
    builtIn: boolean;
    updatedAt: string;
    sla: string;
    steps: PolicyStep[];
    rules: PolicyRule[];
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
    '语义版本发布',
    '语义裁决结论',
    '高风险字段变更',
    '数据安全权限申请',
    '数据质量异常复核',
    '业务场景上线'
];

const ruleCatalog: PolicyRule[] = [
    {
        id: 'rule_sensitive',
        name: '高敏字段变更',
        condition: '字段安全等级 ≥ 3',
        action: '必须安全审计与治理负责人审批'
    },
    {
        id: 'rule_version_major',
        name: '主版本发布',
        condition: '版本类型为 Major',
        action: '需版本委员会审批'
    },
    {
        id: 'rule_quality',
        name: '质量异常复核',
        condition: '连续 2 次质量预警',
        action: '触发质量负责人复核'
    },
    {
        id: 'rule_scene',
        name: '场景上线',
        condition: '涉及生产数据服务',
        action: '需数据服务运营确认'
    }
];

const stepTemplates: Array<Omit<PolicyStep, 'required'>> = [
    { id: 'step_owner', name: '治理负责人', role: '语义治理负责人', sla: '1 天' },
    { id: 'step_committee', name: '版本委员会', role: '版本委员会', sla: '1 天' },
    { id: 'step_security', name: '安全审计', role: '安全审计', sla: '1 天' },
    { id: 'step_quality', name: '质量复核', role: '数据质量管理员', sla: '4 小时' },
    { id: 'step_ops', name: '服务运营确认', role: '数据服务运营', sla: '4 小时' }
];

const initialPolicies: ApprovalPolicy[] = [
    {
        id: 'ap_semantic_publish',
        name: '语义版本发布审批',
        code: 'semantic_publish',
        description: '语义版本发布前进行审批与风险核查。',
        status: '启用',
        scope: ['语义资产', '版本中心'],
        triggers: ['语义版本发布'],
        owner: '语义治理中心',
        level: '高',
        usage: 64,
        builtIn: true,
        updatedAt: '2024-06-25',
        sla: '2 天',
        steps: [
            { id: 'step_owner', name: '治理负责人', role: '语义治理负责人', sla: '1 天', required: true },
            { id: 'step_committee', name: '版本委员会', role: '版本委员会', sla: '1 天', required: true },
            { id: 'step_quality', name: '质量复核', role: '数据质量管理员', sla: '4 小时', required: true }
        ],
        rules: [ruleCatalog[1], ruleCatalog[2]]
    },
    {
        id: 'ap_sensitive_change',
        name: '高敏字段变更审批',
        code: 'sensitive_change',
        description: '高敏字段变更需安全与治理双重审批。',
        status: '启用',
        scope: ['数据安全', '语义资产'],
        triggers: ['高风险字段变更', '语义裁决结论'],
        owner: '安全合规部',
        level: '高',
        usage: 38,
        builtIn: true,
        updatedAt: '2024-06-18',
        sla: '1 天',
        steps: [
            { id: 'step_security', name: '安全审计', role: '安全审计', sla: '1 天', required: true },
            { id: 'step_owner', name: '治理负责人', role: '语义治理负责人', sla: '1 天', required: true }
        ],
        rules: [ruleCatalog[0]]
    },
    {
        id: 'ap_quality_review',
        name: '数据质量异常复核',
        code: 'quality_review',
        description: '质量异常复核确认与责任归属。',
        status: '启用',
        scope: ['数据质量'],
        triggers: ['数据质量异常复核'],
        owner: '数据质量中心',
        level: '中',
        usage: 91,
        builtIn: false,
        updatedAt: '2024-06-10',
        sla: '8 小时',
        steps: [
            { id: 'step_quality', name: '质量复核', role: '数据质量管理员', sla: '4 小时', required: true },
            { id: 'step_owner', name: '治理负责人', role: '语义治理负责人', sla: '4 小时', required: false }
        ],
        rules: [ruleCatalog[2]]
    },
    {
        id: 'ap_scene_release',
        name: '业务场景上线审批',
        code: 'scene_release',
        description: '业务场景上线前确认语义与服务可用。',
        status: '停用',
        scope: ['业务场景', '数据服务'],
        triggers: ['业务场景上线'],
        owner: '业务运营部',
        level: '中',
        usage: 12,
        builtIn: false,
        updatedAt: '2024-05-28',
        sla: '1 天',
        steps: [
            { id: 'step_ops', name: '服务运营确认', role: '数据服务运营', sla: '4 小时', required: true },
            { id: 'step_committee', name: '版本委员会', role: '版本委员会', sla: '1 天', required: true }
        ],
        rules: [ruleCatalog[3]]
    }
];

const formatDate = () => new Date().toISOString().split('T')[0];

const ApprovalPolicyView = () => {
    const toast = useToast();
    const [policies, setPolicies] = useState<ApprovalPolicy[]>(initialPolicies);
    const [activePolicyId, setActivePolicyId] = useState(initialPolicies[0]?.id ?? '');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | PolicyStatus>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [draftPolicy, setDraftPolicy] = useState<ApprovalPolicy | null>(null);
    const [draftSteps, setDraftSteps] = useState<PolicyStep[]>([]);
    const [draftRuleIds, setDraftRuleIds] = useState<string[]>([]);

    const filteredPolicies = useMemo(() => {
        return policies.filter((policy) => {
            const matchesSearch = `${policy.name}${policy.code}${policy.description}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [policies, searchTerm, statusFilter]);

    const activePolicy = policies.find((policy) => policy.id === activePolicyId) ?? policies[0];

    const stats = useMemo(() => {
        const enabledCount = policies.filter((policy) => policy.status === '启用').length;
        const highRiskCount = policies.filter((policy) => policy.level === '高').length;
        const totalUsage = policies.reduce((sum, policy) => sum + policy.usage, 0);
        return { enabledCount, highRiskCount, totalUsage };
    }, [policies]);

    const recentApprovals = [
        { id: 'ap_01', name: '语义版本发布审批', status: '进行中', owner: '王宁', time: '30 分钟前' },
        { id: 'ap_02', name: '高敏字段变更审批', status: '已通过', owner: '张倩', time: '2 小时前' },
        { id: 'ap_03', name: '数据质量异常复核', status: '待处理', owner: '李晨', time: '昨天 18:20' }
    ];

    const openCreateModal = () => {
        setModalMode('create');
        setDraftPolicy({
            id: `ap_${Date.now()}`,
            name: '',
            code: '',
            description: '',
            status: '启用',
            scope: [],
            triggers: [],
            owner: '语义治理中心',
            level: '中',
            usage: 0,
            builtIn: false,
            updatedAt: formatDate(),
            sla: '1 天',
            steps: [],
            rules: []
        });
        setDraftSteps(stepTemplates.slice(0, 2).map((item) => ({ ...item, required: true })));
        setDraftRuleIds([]);
        setModalOpen(true);
    };

    const openEditModal = (policy: ApprovalPolicy) => {
        setModalMode('edit');
        setDraftPolicy({ ...policy });
        setDraftSteps(policy.steps.map((step) => ({ ...step })));
        setDraftRuleIds(policy.rules.map((rule) => rule.id));
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftPolicy(null);
        setDraftSteps([]);
        setDraftRuleIds([]);
    };

    const handleSavePolicy = () => {
        if (!draftPolicy) {
            return;
        }
        if (!draftPolicy.name.trim() || !draftPolicy.code.trim()) {
            toast.error('请填写审批策略名称与编码。');
            return;
        }
        const nextPolicy: ApprovalPolicy = {
            ...draftPolicy,
            updatedAt: formatDate(),
            steps: draftSteps,
            rules: ruleCatalog.filter((rule) => draftRuleIds.includes(rule.id))
        };
        if (modalMode === 'create') {
            setPolicies((prev) => [nextPolicy, ...prev]);
            setActivePolicyId(nextPolicy.id);
        } else {
            setPolicies((prev) => prev.map((item) => (item.id === nextPolicy.id ? nextPolicy : item)));
        }
        closeModal();
    };

    const handleToggleStatus = (policy: ApprovalPolicy) => {
        setPolicies((prev) =>
            prev.map((item) =>
                item.id === policy.id
                    ? { ...item, status: item.status === '启用' ? '停用' : '启用', updatedAt: formatDate() }
                    : item
            )
        );
    };

    const handleDeletePolicy = (policy: ApprovalPolicy) => {
        if (policy.builtIn) {
            return;
        }
        if (!confirm('确定要删除该审批策略吗？')) {
            return;
        }
        const next = policies.filter((item) => item.id !== policy.id);
        setPolicies(next);
        if (activePolicyId === policy.id) {
            setActivePolicyId(next[0]?.id ?? '');
        }
    };

    const toggleDraftScope = (scope: string) => {
        if (!draftPolicy) {
            return;
        }
        const exists = draftPolicy.scope.includes(scope);
        setDraftPolicy({
            ...draftPolicy,
            scope: exists ? draftPolicy.scope.filter((item) => item !== scope) : [...draftPolicy.scope, scope]
        });
    };

    const toggleDraftTrigger = (trigger: string) => {
        if (!draftPolicy) {
            return;
        }
        const exists = draftPolicy.triggers.includes(trigger);
        setDraftPolicy({
            ...draftPolicy,
            triggers: exists
                ? draftPolicy.triggers.filter((item) => item !== trigger)
                : [...draftPolicy.triggers, trigger]
        });
    };

    const toggleDraftRule = (ruleId: string) => {
        setDraftRuleIds((prev) => (prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]));
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
            return [...prev, { ...template, required: true }];
        });
    };

    const updateDraftStep = (id: string, updates: Partial<PolicyStep>) => {
        setDraftSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...updates } : step)));
    };

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck size={22} className="text-indigo-600" />
                        审批策略
                    </h2>
                    <p className="text-slate-500 mt-1">配置语义治理审批策略，保障语义变更合规、可追溯。</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300">
                        <Settings size={14} className="inline mr-1" /> 策略模板
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建策略
                    </button>
                </div>
            </div>

            <div className="grid gap-4 px-1 md:grid-cols-3">
                {[
                    { label: '启用策略', value: `${stats.enabledCount}`, icon: CheckCircle2, note: '覆盖核心治理流程' },
                    { label: '高风险策略', value: `${stats.highRiskCount}`, icon: AlertTriangle, note: '需重点监控' },
                    { label: '审批触发', value: `${stats.totalUsage}`, icon: Clock, note: '近 30 日累计' }
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
                                placeholder="搜索策略名称、编码或描述"
                                className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Filter size={14} />
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | PolicyStatus)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部状态</option>
                                <option value="启用">启用</option>
                                <option value="停用">停用</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {filteredPolicies.map((policy) => {
                            const isActive = policy.id === activePolicyId;
                            return (
                                <button
                                    key={policy.id}
                                    onClick={() => setActivePolicyId(policy.id)}
                                    className={`w-full text-left rounded-xl border p-4 transition ${isActive
                                            ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800">{policy.name}</span>
                                                {policy.builtIn && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                        系统内置
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">{policy.description}</p>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${policy.status === '启用'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-slate-100 text-slate-500'
                                                }`}
                                        >
                                            {policy.status}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        <span>等级 {policy.level}</span>
                                        <span>触发 {policy.usage}</span>
                                        <span>{policy.updatedAt} 更新</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">{activePolicy?.name ?? '—'}</h3>
                            <p className="mt-1 text-sm text-slate-500">{activePolicy?.description ?? '暂无描述'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => activePolicy && openEditModal(activePolicy)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                            >
                                <Pencil size={14} /> 编辑
                            </button>
                            <button
                                onClick={() => activePolicy && handleToggleStatus(activePolicy)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800"
                            >
                                {activePolicy?.status === '启用' ? '停用' : '启用'}
                            </button>
                            <button
                                onClick={() => activePolicy && handleDeletePolicy(activePolicy)}
                                disabled={activePolicy?.builtIn}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 ${activePolicy?.builtIn
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
                            { label: '责任团队', value: activePolicy?.owner ?? '-', icon: ShieldCheck },
                            { label: '策略等级', value: activePolicy?.level ?? '-', icon: AlertTriangle },
                            { label: '审批 SLA', value: activePolicy?.sla ?? '-', icon: Clock }
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
                            {activePolicy?.scope?.length ? (
                                activePolicy.scope.map((scope) => (
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
                            {activePolicy?.triggers?.length ? (
                                activePolicy.triggers.map((trigger) => (
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
                        <p className="text-sm font-semibold text-slate-700">审批节点</p>
                        <div className="mt-3 space-y-3">
                            {activePolicy?.steps?.length ? (
                                activePolicy.steps.map((step, index) => (
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
                                                {step.role} · {step.required ? '必选' : '可选'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-400">暂无审批节点</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700">审批规则</p>
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                            <div className="grid grid-cols-[1.1fr_1.2fr_1.3fr] bg-slate-50 text-xs font-semibold text-slate-500">
                                <div className="px-4 py-2">规则</div>
                                <div className="px-4 py-2">触发条件</div>
                                <div className="px-4 py-2">审批动作</div>
                            </div>
                            {activePolicy?.rules?.length ? (
                                activePolicy.rules.map((rule, index) => (
                                    <div
                                        key={rule.id}
                                        className={`grid grid-cols-[1.1fr_1.2fr_1.3fr] text-xs text-slate-600 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                            }`}
                                    >
                                        <div className="px-4 py-3 font-semibold text-slate-700">{rule.name}</div>
                                        <div className="px-4 py-3 text-slate-500">{rule.condition}</div>
                                        <div className="px-4 py-3 text-slate-500">{rule.action}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center text-xs text-slate-400">
                                    暂无规则配置
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-700">最近审批</p>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                {recentApprovals.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-700">{item.name}</p>
                                            <p className="text-slate-400">{item.owner}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-500">{item.status}</p>
                                            <p className="text-slate-400">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-700">风险提示</p>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                {[
                                    '高敏字段变更审批量上升',
                                    '版本发布审批 SLA 临近',
                                    '质量复核策略待更新'
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {modalOpen && draftPolicy && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {modalMode === 'create' ? '新建审批策略' : '编辑审批策略'}
                                    </h3>
                                    <p className="text-xs text-slate-500">配置策略信息、触发条件与审批规则。</p>
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
                                        <label className="text-xs font-semibold text-slate-600">策略名称</label>
                                        <input
                                            value={draftPolicy.name}
                                            onChange={(event) =>
                                                setDraftPolicy({ ...draftPolicy, name: event.target.value })
                                            }
                                            placeholder="例如：语义版本发布审批"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">策略编码</label>
                                        <input
                                            value={draftPolicy.code}
                                            onChange={(event) =>
                                                setDraftPolicy({ ...draftPolicy, code: event.target.value })
                                            }
                                            placeholder="semantic_publish"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-slate-600">策略描述</label>
                                        <textarea
                                            value={draftPolicy.description}
                                            onChange={(event) =>
                                                setDraftPolicy({ ...draftPolicy, description: event.target.value })
                                            }
                                            placeholder="描述策略适用的语义治理场景"
                                            className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">状态</label>
                                        <select
                                            value={draftPolicy.status}
                                            onChange={(event) =>
                                                setDraftPolicy({
                                                    ...draftPolicy,
                                                    status: event.target.value as PolicyStatus
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="启用">启用</option>
                                            <option value="停用">停用</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">策略等级</label>
                                        <select
                                            value={draftPolicy.level}
                                            onChange={(event) =>
                                                setDraftPolicy({
                                                    ...draftPolicy,
                                                    level: event.target.value as ApprovalPolicy['level']
                                                })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="高">高</option>
                                            <option value="中">中</option>
                                            <option value="低">低</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">责任团队</label>
                                        <input
                                            value={draftPolicy.owner}
                                            onChange={(event) =>
                                                setDraftPolicy({ ...draftPolicy, owner: event.target.value })
                                            }
                                            placeholder="语义治理中心"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">审批 SLA</label>
                                        <input
                                            value={draftPolicy.sla}
                                            onChange={(event) =>
                                                setDraftPolicy({ ...draftPolicy, sla: event.target.value })
                                            }
                                            placeholder="1 天"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-700">适用范围</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {scopeOptions.map((scope) => {
                                            const active = draftPolicy.scope.includes(scope);
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
                                            const active = draftPolicy.triggers.includes(trigger);
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
                                    <p className="text-sm font-semibold text-slate-700">审批节点</p>
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
                                                        默认角色：{template.role}
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
                                                                placeholder="节点 SLA"
                                                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-700">审批规则</p>
                                    <div className="mt-3 space-y-3">
                                        {ruleCatalog.map((rule) => {
                                            const active = draftRuleIds.includes(rule.id);
                                            return (
                                                <button
                                                    key={rule.id}
                                                    type="button"
                                                    onClick={() => toggleDraftRule(rule.id)}
                                                    className={`w-full rounded-xl border p-4 text-left transition ${active
                                                            ? 'border-emerald-200 bg-emerald-50'
                                                            : 'border-slate-200 hover:border-emerald-200'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-800">{rule.name}</div>
                                                            <p className="mt-1 text-xs text-slate-500">{rule.condition}</p>
                                                        </div>
                                                        <span
                                                            className={`text-xs px-2 py-0.5 rounded-full ${active
                                                                    ? 'bg-emerald-100 text-emerald-600'
                                                                    : 'bg-slate-100 text-slate-500'
                                                                }`}
                                                        >
                                                            {active ? '已启用' : '未启用'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-xs text-slate-500">动作：{rule.action}</p>
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
                                    onClick={handleSavePolicy}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    {modalMode === 'create' ? '创建策略' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalPolicyView;
