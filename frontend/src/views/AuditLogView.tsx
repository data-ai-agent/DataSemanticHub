import { useMemo, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Download,
    Filter,
    Hash,
    Search,
    ShieldCheck,
    User,
    FileText,
    XCircle
} from 'lucide-react';

type AuditStatus = '成功' | '失败' | '告警';
type RiskLevel = '高' | '中' | '低';

type AuditLog = {
    id: string;
    action: string;
    module: string;
    resource: string;
    actor: string;
    role: string;
    ip: string;
    status: AuditStatus;
    risk: RiskLevel;
    time: string;
    durationMs: number;
    traceId: string;
    message: string;
};

const modules = ['语义资产', '语义版本', '数据安全', '数据质量', '数据服务', '问数', '找数', '业务场景'];
const quickRanges = [
    { id: 'all', label: '不限' },
    { id: 'today', label: '今天', days: 0 },
    { id: '7d', label: '近 7 天', days: 6 },
    { id: '30d', label: '近 30 天', days: 29 }
];

const initialLogs: AuditLog[] = [
    {
        id: 'log_001',
        action: '语义版本发布审批',
        module: '语义版本',
        resource: '版本 v1.4',
        actor: '王宁',
        role: '语义治理负责人',
        ip: '10.23.18.12',
        status: '成功',
        risk: '中',
        time: '2024-06-28 10:24',
        durationMs: 842,
        traceId: 'TRC-20240628-001',
        message: '审批通过并触发版本发布。'
    },
    {
        id: 'log_002',
        action: '高敏字段变更审批',
        module: '数据安全',
        resource: 'user_id 字段',
        actor: '张倩',
        role: '安全审计',
        ip: '10.23.20.44',
        status: '告警',
        risk: '高',
        time: '2024-06-28 09:40',
        durationMs: 1250,
        traceId: 'TRC-20240628-002',
        message: '检测到高敏字段变更，已触发双人复核。'
    },
    {
        id: 'log_003',
        action: '语义裁决结果同步',
        module: '语义资产',
        resource: '业务对象：客户',
        actor: '李晨',
        role: '语义治理专员',
        ip: '10.23.19.88',
        status: '成功',
        risk: '低',
        time: '2024-06-28 09:12',
        durationMs: 416,
        traceId: 'TRC-20240628-003',
        message: '裁决结果已同步到资源知识网络。'
    },
    {
        id: 'log_004',
        action: '质量异常复核',
        module: '数据质量',
        resource: '订单金额一致性',
        actor: '陈颖',
        role: '数据质量管理员',
        ip: '10.23.21.09',
        status: '失败',
        risk: '中',
        time: '2024-06-27 18:32',
        durationMs: 1630,
        traceId: 'TRC-20240627-009',
        message: '质量规则未通过，已回滚变更。'
    },
    {
        id: 'log_005',
        action: '数据服务发布',
        module: '数据服务',
        resource: '客户画像 API',
        actor: '赵敏',
        role: '数据服务运营',
        ip: '10.23.17.21',
        status: '成功',
        risk: '低',
        time: '2024-06-27 16:05',
        durationMs: 520,
        traceId: 'TRC-20240627-011',
        message: '服务发布完成，自动通知订阅方。'
    },
    {
        id: 'log_006',
        action: '问数权限申请',
        module: '问数',
        resource: '指标：活跃用户数',
        actor: '周琪',
        role: '业务分析师',
        ip: '10.23.15.36',
        status: '告警',
        risk: '中',
        time: '2024-06-27 14:50',
        durationMs: 910,
        traceId: 'TRC-20240627-013',
        message: '权限申请涉及核心指标，已升级审批。'
    }
];

const statusBadge: Record<AuditStatus, string> = {
    成功: 'bg-emerald-50 text-emerald-600',
    失败: 'bg-rose-50 text-rose-600',
    告警: 'bg-amber-50 text-amber-600'
};

const riskBadge: Record<RiskLevel, string> = {
    高: 'bg-rose-50 text-rose-600',
    中: 'bg-amber-50 text-amber-600',
    低: 'bg-emerald-50 text-emerald-600'
};

const AuditLogView = () => {
    const [logs] = useState<AuditLog[]>(initialLogs);
    const [activeLogId, setActiveLogId] = useState(initialLogs[0]?.id ?? '');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | AuditStatus>('all');
    const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
    const [moduleFilter, setModuleFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeRange, setActiveRange] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');

    const parseLogTime = (value: string) => {
        const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}:00`;
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const openTrace = (traceId: string) => {
        const url = `/trace?traceId=${encodeURIComponent(traceId)}`;
        window.open(url, '_blank', 'noopener');
    };

    const applyQuickRange = (rangeId: 'all' | 'today' | '7d' | '30d') => {
        setActiveRange(rangeId);
        if (rangeId === 'all') {
            setStartDate('');
            setEndDate('');
            return;
        }
        const today = new Date();
        const start = new Date(today);
        const range = quickRanges.find((item) => item.id === rangeId);
        if (range?.days !== undefined) {
            start.setDate(today.getDate() - range.days);
        }
        const format = (date: Date) => date.toISOString().slice(0, 10);
        setStartDate(format(start));
        setEndDate(format(today));
    };

    const filteredLogs = useMemo(() => {
        const startTime = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const endTime = endDate ? new Date(`${endDate}T23:59:59`) : null;

        return logs.filter((log) => {
            const matchesSearch = `${log.action}${log.module}${log.resource}${log.actor}${log.traceId}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
            const matchesRisk = riskFilter === 'all' || log.risk === riskFilter;
            const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
            const logTime = parseLogTime(log.time);
            const matchesStart = !startTime || (logTime ? logTime >= startTime : true);
            const matchesEnd = !endTime || (logTime ? logTime <= endTime : true);
            return matchesSearch && matchesStatus && matchesRisk && matchesModule && matchesStart && matchesEnd;
        });
    }, [logs, searchTerm, statusFilter, riskFilter, moduleFilter, startDate, endDate]);

    const activeLog = logs.find((log) => log.id === activeLogId) ?? logs[0];

    const stats = useMemo(() => {
        const total = logs.length;
        const alertCount = logs.filter((log) => log.status === '告警').length;
        const failCount = logs.filter((log) => log.status === '失败').length;
        const avgDuration = logs.length
            ? Math.round(logs.reduce((sum, log) => sum + log.durationMs, 0) / logs.length)
            : 0;
        return { total, alertCount, failCount, avgDuration };
    }, [logs]);

    const recentAlerts = logs.filter((log) => log.status !== '成功').slice(0, 4);

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck size={22} className="text-indigo-600" />
                        审计日志
                    </h2>
                    <p className="text-slate-500 mt-1">记录语义治理操作轨迹，支撑可追溯与合规审计。</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300">
                        <Filter size={14} className="inline mr-1" /> 策略筛选
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                        <Download size={16} /> 导出日志
                    </button>
                </div>
            </div>

            <div className="grid gap-4 px-1 md:grid-cols-4">
                {[
                    { label: '日志总量', value: `${stats.total}`, icon: Activity, note: '近 24 小时' },
                    { label: '告警事件', value: `${stats.alertCount}`, icon: AlertTriangle, note: '需优先复核' },
                    { label: '失败操作', value: `${stats.failCount}`, icon: XCircle, note: '可能存在风险' },
                    { label: '平均耗时', value: `${stats.avgDuration} ms`, icon: Clock, note: '近 24 小时' }
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
                                placeholder="搜索动作、对象、人员或 Trace ID"
                                className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Filter size={14} />
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | AuditStatus)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部状态</option>
                                <option value="成功">成功</option>
                                <option value="告警">告警</option>
                                <option value="失败">失败</option>
                            </select>
                            <select
                                value={riskFilter}
                                onChange={(event) => setRiskFilter(event.target.value as 'all' | RiskLevel)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部风险</option>
                                <option value="高">高</option>
                                <option value="中">中</option>
                                <option value="低">低</option>
                            </select>
                            <select
                                value={moduleFilter}
                                onChange={(event) => setModuleFilter(event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                            >
                                <option value="all">全部模块</option>
                                {modules.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Clock size={14} /> 时间范围
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            {quickRanges.map((range) => (
                                <button
                                    key={range.id}
                                    type="button"
                                    onClick={() => applyQuickRange(range.id as 'all' | 'today' | '7d' | '30d')}
                                    className={`rounded-full border px-3 py-1 transition ${
                                        activeRange === range.id
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                            : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-slate-700'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(event) => {
                                    setStartDate(event.target.value);
                                    setActiveRange('custom');
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600"
                            />
                            <span className="text-slate-400">至</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(event) => {
                                    setEndDate(event.target.value);
                                    setActiveRange('custom');
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {filteredLogs.map((log) => {
                            const isActive = log.id === activeLogId;
                            return (
                                <button
                                    key={log.id}
                                    onClick={() => setActiveLogId(log.id)}
                                    className={`w-full text-left rounded-xl border p-4 transition ${
                                        isActive
                                            ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-800">{log.action}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[log.status]}`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {log.module} · {log.resource}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${riskBadge[log.risk]}`}>
                                            风险 {log.risk}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <User size={14} /> {log.actor}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} /> {log.time}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openTrace(log.traceId);
                                            }}
                                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                                        >
                                            <Hash size={14} /> {log.traceId}
                                        </button>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">{activeLog?.action ?? '—'}</h3>
                            <p className="mt-1 text-sm text-slate-500">{activeLog?.message ?? '暂无详情'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[activeLog?.status ?? '成功']}`}>
                                {activeLog?.status ?? '成功'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${riskBadge[activeLog?.risk ?? '低']}`}>
                                风险 {activeLog?.risk ?? '低'}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: '模块', value: activeLog?.module ?? '-', icon: FileText },
                            { label: '耗时', value: `${activeLog?.durationMs ?? 0} ms`, icon: Clock },
                            { label: '负责人', value: activeLog?.actor ?? '-', icon: User }
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

                    <div className="grid gap-3 md:grid-cols-2">
                        {[
                            { label: '资源对象', value: activeLog?.resource ?? '-' },
                            { label: '操作者角色', value: activeLog?.role ?? '-' },
                            { label: '来源 IP', value: activeLog?.ip ?? '-' },
                            { label: 'Trace ID', value: activeLog?.traceId ?? '-' }
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-slate-200 p-3">
                                <p className="text-xs text-slate-500">{item.label}</p>
                                {item.label === 'Trace ID' && item.value !== '-' ? (
                                    <button
                                        type="button"
                                        onClick={() => openTrace(item.value)}
                                        className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                        {item.value}
                                    </button>
                                ) : (
                                    <p className="mt-2 text-sm font-semibold text-slate-800">{item.value}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700">事件上下文</p>
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-600">
                            {activeLog?.message ?? '暂无上下文信息'}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-700">最新告警</p>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                {recentAlerts.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-700">{log.action}</p>
                                            <p className="text-slate-400">{log.module}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[log.status]}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-700">合规提醒</p>
                            <div className="mt-3 space-y-2 text-xs text-slate-600">
                                {[
                                    '高敏字段变更需双人复核',
                                    '版本发布需保留审批证据',
                                    '权限申请记录需归档 180 天'
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
        </div>
    );
};

export default AuditLogView;
