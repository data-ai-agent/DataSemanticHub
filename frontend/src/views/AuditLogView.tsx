import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Clock,
    Download,
    Filter,
    Search,
    ShieldCheck,
    FileText,
    X,
    ChevronRight
} from 'lucide-react';

type RiskLevel = '高' | '中' | '低';
type TaskStatus = '待审批' | '已通过' | '已驳回';
type LogResult = '成功' | '失败' | '告警';

type AuditTask = {
    id: string;
    entityType: string;
    entityName: string;
    changeType: string;
    risk: RiskLevel;
    requester: string;
    createdAt: string;
    status: TaskStatus;
    diff: {
        scope: string;
        policy: string;
        members: string;
    };
};

type AuditLog = {
    id: string;
    time: string;
    actor: string;
    action: string;
    entity: string;
    risk: RiskLevel;
    result: LogResult;
    detail: string;
};

const taskData: AuditTask[] = [
    {
        id: 'TASK-20240628-001',
        entityType: '角色',
        entityName: '语义治理负责人',
        changeType: '权限提升',
        risk: '高',
        requester: '韩梅',
        createdAt: '2024-06-28 10:12',
        status: '待审批',
        diff: {
            scope: '组织范围扩展至 3 个部门',
            policy: '新增发布/管理权限（语义版本）',
            members: '新增 2 位成员'
        }
    },
    {
        id: 'TASK-20240627-009',
        entityType: '模板',
        entityName: '数据服务运营模板',
        changeType: '发布申请',
        risk: '中',
        requester: '刘维',
        createdAt: '2024-06-27 18:32',
        status: '待审批',
        diff: {
            scope: '数据域扩展至 4 个',
            policy: '新增问数管理权限',
            members: '无成员变更'
        }
    },
    {
        id: 'TASK-20240627-003',
        entityType: '角色',
        entityName: '安全审计',
        changeType: '成员变更',
        risk: '低',
        requester: '系统',
        createdAt: '2024-06-27 09:05',
        status: '已通过',
        diff: {
            scope: '无范围变更',
            policy: '无权限变更',
            members: '移除 1 位临时成员'
        }
    }
];

const logData: AuditLog[] = [
    {
        id: 'LOG-20240628-001',
        time: '2024-06-28 10:24',
        actor: '王宁',
        action: '语义版本发布审批',
        entity: '版本 v1.4',
        risk: '中',
        result: '成功',
        detail: '审批通过并触发版本发布。'
    },
    {
        id: 'LOG-20240628-002',
        time: '2024-06-28 09:40',
        actor: '张倩',
        action: '高敏字段变更审批',
        entity: 'user_id 字段',
        risk: '高',
        result: '告警',
        detail: '检测到高敏字段变更，已触发双人复核。'
    },
    {
        id: 'LOG-20240627-009',
        time: '2024-06-27 18:32',
        actor: '陈颖',
        action: '质量异常复核',
        entity: '订单金额一致性',
        risk: '中',
        result: '失败',
        detail: '质量规则未通过，已回滚变更。'
    }
];

const riskBadge: Record<RiskLevel, string> = {
    高: 'bg-rose-100 text-rose-700',
    中: 'bg-amber-100 text-amber-700',
    低: 'bg-emerald-100 text-emerald-700'
};

const statusBadge: Record<TaskStatus, string> = {
    待审批: 'bg-amber-100 text-amber-700',
    已通过: 'bg-emerald-100 text-emerald-700',
    已驳回: 'bg-rose-100 text-rose-700'
};

const resultBadge: Record<LogResult, string> = {
    成功: 'bg-emerald-100 text-emerald-700',
    失败: 'bg-rose-100 text-rose-700',
    告警: 'bg-amber-100 text-amber-700'
};

const AuditLogView = () => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
    const [taskSearch, setTaskSearch] = useState('');
    const [taskRiskFilter, setTaskRiskFilter] = useState<'all' | RiskLevel>('all');
    const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | TaskStatus>('all');
    const [logSearch, setLogSearch] = useState('');
    const [logRiskFilter, setLogRiskFilter] = useState<'all' | RiskLevel>('all');
    const [logResultFilter, setLogResultFilter] = useState<'all' | LogResult>('all');
    const [activeTask, setActiveTask] = useState<AuditTask | null>(null);
    const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

    const taskStats = useMemo(() => {
        const pending = taskData.filter((task) => task.status === '待审批').length;
        const highRisk = taskData.filter((task) => task.risk === '高').length;
        const rejected = taskData.filter((task) => task.status === '已驳回').length;
        return { pending, highRisk, rejected };
    }, []);

    const filteredTasks = useMemo(() => {
        return taskData.filter((task) => {
            const matchesSearch = `${task.entityName}${task.changeType}${task.requester}${task.id}`
                .toLowerCase()
                .includes(taskSearch.toLowerCase());
            const matchesRisk = taskRiskFilter === 'all' || task.risk === taskRiskFilter;
            const matchesStatus = taskStatusFilter === 'all' || task.status === taskStatusFilter;
            return matchesSearch && matchesRisk && matchesStatus;
        });
    }, [taskSearch, taskRiskFilter, taskStatusFilter]);

    const filteredLogs = useMemo(() => {
        return logData.filter((log) => {
            const matchesSearch = `${log.action}${log.actor}${log.entity}${log.id}`
                .toLowerCase()
                .includes(logSearch.toLowerCase());
            const matchesRisk = logRiskFilter === 'all' || log.risk === logRiskFilter;
            const matchesResult = logResultFilter === 'all' || log.result === logResultFilter;
            return matchesSearch && matchesRisk && matchesResult;
        });
    }, [logSearch, logRiskFilter, logResultFilter]);

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <div className="text-xs text-slate-400">平台管理 / 审计与审批</div>
                    <h2 className="text-2xl font-bold text-slate-800">审计与审批</h2>
                    <p className="text-slate-500 mt-1">集中处理高风险变更审批与权限审计追溯。</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 flex items-center gap-2">
                        <Download size={16} /> 导出审计
                    </button>
                </div>
            </div>

            <div className="grid gap-4 px-1 md:grid-cols-3">
                {[{
                    label: '待处理任务',
                    value: taskStats.pending,
                    icon: Clock
                }, {
                    label: '本周高危变更',
                    value: taskStats.highRisk,
                    icon: AlertTriangle
                }, {
                    label: '失败/驳回',
                    value: taskStats.rejected,
                    icon: ShieldCheck
                }].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">{item.label}</p>
                            <item.icon size={18} className="text-indigo-500" />
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-slate-800">{item.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 px-4">
                    <div className="flex items-center gap-6">
                        {[{ id: 'tasks', label: '待处理任务' }, { id: 'logs', label: '审计日志' }].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`border-b-2 py-3 text-sm font-semibold ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'tasks' && (
                    <div className="grid gap-4 p-4 lg:grid-cols-[260px_1fr]">
                        <aside className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 space-y-3 text-xs">
                            <div className="text-xs font-semibold text-slate-500">筛选条件</div>
                            <input
                                value={taskSearch}
                                onChange={(event) => setTaskSearch(event.target.value)}
                                placeholder="搜索任务/角色"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            />
                            <select
                                value={taskRiskFilter}
                                onChange={(event) => setTaskRiskFilter(event.target.value as typeof taskRiskFilter)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            >
                                <option value="all">全部风险</option>
                                <option value="高">高风险</option>
                                <option value="中">中风险</option>
                                <option value="低">低风险</option>
                            </select>
                            <select
                                value={taskStatusFilter}
                                onChange={(event) => setTaskStatusFilter(event.target.value as typeof taskStatusFilter)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            >
                                <option value="all">全部状态</option>
                                <option value="待审批">待审批</option>
                                <option value="已通过">已通过</option>
                                <option value="已驳回">已驳回</option>
                            </select>
                            <div className="text-[11px] text-slate-400">支持按风险与状态组合过滤。</div>
                        </aside>
                        <section className="space-y-3">
                            <div className="overflow-hidden rounded-lg border border-slate-100">
                                <table className="w-full text-xs text-slate-600">
                                    <thead className="bg-slate-50 text-slate-400">
                                        <tr>
                                            <th className="px-3 py-2 text-left">任务ID</th>
                                            <th className="px-3 py-2 text-left">变更对象</th>
                                            <th className="px-3 py-2 text-left">类型</th>
                                            <th className="px-3 py-2 text-left">风险</th>
                                            <th className="px-3 py-2 text-left">发起人</th>
                                            <th className="px-3 py-2 text-left">发起时间</th>
                                            <th className="px-3 py-2 text-left">状态</th>
                                            <th className="px-3 py-2 text-left">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredTasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 font-medium text-slate-700">{task.id}</td>
                                                <td className="px-3 py-2">{task.entityName}</td>
                                                <td className="px-3 py-2">{task.changeType}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadge[task.risk]}`}>
                                                        {task.risk}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">{task.requester}</td>
                                                <td className="px-3 py-2">{task.createdAt}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[task.status]}`}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        onClick={() => setActiveTask(task)}
                                                        className="text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        查看
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTasks.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                                    暂无符合条件的任务
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs">
                                <Search size={12} className="text-slate-400" />
                                <input
                                    value={logSearch}
                                    onChange={(event) => setLogSearch(event.target.value)}
                                    placeholder="搜索操作/对象/操作者"
                                    className="border-none outline-none text-xs"
                                />
                            </div>
                            <select
                                value={logRiskFilter}
                                onChange={(event) => setLogRiskFilter(event.target.value as typeof logRiskFilter)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            >
                                <option value="all">全部风险</option>
                                <option value="高">高风险</option>
                                <option value="中">中风险</option>
                                <option value="低">低风险</option>
                            </select>
                            <select
                                value={logResultFilter}
                                onChange={(event) => setLogResultFilter(event.target.value as typeof logResultFilter)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                            >
                                <option value="all">全部结果</option>
                                <option value="成功">成功</option>
                                <option value="失败">失败</option>
                                <option value="告警">告警</option>
                            </select>
                            <button className="flex items-center gap-1 text-xs text-slate-500">
                                <Filter size={12} /> 高级过滤
                            </button>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-slate-100">
                            <table className="w-full text-xs text-slate-600">
                                <thead className="bg-slate-50 text-slate-400">
                                    <tr>
                                        <th className="px-3 py-2 text-left">时间</th>
                                        <th className="px-3 py-2 text-left">操作者</th>
                                        <th className="px-3 py-2 text-left">对象</th>
                                        <th className="px-3 py-2 text-left">动作</th>
                                        <th className="px-3 py-2 text-left">风险</th>
                                        <th className="px-3 py-2 text-left">结果</th>
                                        <th className="px-3 py-2 text-left">详情</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2">{log.time}</td>
                                            <td className="px-3 py-2">{log.actor}</td>
                                            <td className="px-3 py-2">{log.entity}</td>
                                            <td className="px-3 py-2">{log.action}</td>
                                            <td className="px-3 py-2">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadge[log.risk]}`}>
                                                    {log.risk}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${resultBadge[log.result]}`}>
                                                    {log.result}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    onClick={() => setActiveLog(log)}
                                                    className="text-indigo-600 hover:text-indigo-700"
                                                >
                                                    查看
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                                暂无符合条件的日志
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {activeTask && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setActiveTask(null)}
                    />
                    <div className="absolute right-0 top-0 h-full w-[520px] max-w-[92vw] bg-white shadow-2xl flex flex-col">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs text-slate-400">任务详情</div>
                                    <h3 className="text-lg font-semibold text-slate-800">{activeTask.entityName}</h3>
                                    <div className="mt-1 text-xs text-slate-500">{activeTask.id} · {activeTask.changeType}</div>
                                </div>
                                <button
                                    onClick={() => setActiveTask(null)}
                                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadge[activeTask.risk]}`}>
                                    {activeTask.risk}风险
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[activeTask.status]}`}>
                                    {activeTask.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                                <div>发起人：{activeTask.requester}</div>
                                <div className="mt-2">发起时间：{activeTask.createdAt}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="text-xs text-slate-400">范围变更</div>
                                <div className="mt-2 text-sm text-slate-600">{activeTask.diff.scope}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="text-xs text-slate-400">权限策略变更</div>
                                <div className="mt-2 text-sm text-slate-600">{activeTask.diff.policy}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="text-xs text-slate-400">成员变更</div>
                                <div className="mt-2 text-sm text-slate-600">{activeTask.diff.members}</div>
                            </div>
                        </div>
                        <div className="border-t border-slate-200 px-5 py-4 flex justify-end gap-3">
                            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                                驳回
                            </button>
                            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                                通过
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <FileText className="text-indigo-500" size={18} />
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">审计详情</h3>
                                    <p className="text-xs text-slate-500">{activeLog.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveLog(null)}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-6 py-5 space-y-4 text-sm text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>操作人：{activeLog.actor}</span>
                                <span>{activeLog.time}</span>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">动作</div>
                                <div className="mt-1 font-semibold text-slate-700">{activeLog.action}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">对象</div>
                                <div className="mt-1 font-semibold text-slate-700">{activeLog.entity}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                                <div className="text-xs text-slate-400">详情</div>
                                <div className="mt-1 text-slate-600">{activeLog.detail}</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadge[activeLog.risk]}`}>
                                    {activeLog.risk}风险
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${resultBadge[activeLog.result]}`}>
                                    {activeLog.result}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
                            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                                关闭
                            </button>
                            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 flex items-center gap-2">
                                查看差异
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogView;
