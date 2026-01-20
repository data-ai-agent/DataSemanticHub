import { useMemo, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle,
    Layers,
    Lock,
    ShieldAlert,
    Target
} from 'lucide-react';
import governanceOverviewMock from '../data/governanceOverviewMock';

interface DashboardViewProps {
    setActiveModule: (module: string) => void;
}

type TimeRange = '7d' | '30d' | '90d';

const stepLabels: Record<string, string> = {
    LOGICAL_VIEW: '逻辑视图',
    FIELD_SEMANTIC: '字段语义理解',
    QUALITY: '数据质量',
    SECURITY: '数据安全',
    VERSION: '语义版本'
};

const statusMeta: Record<string, { label: string; text: string; bar: string }> = {
    DONE: { label: '已完成', text: 'text-emerald-600', bar: 'bg-emerald-500' },
    IN_PROGRESS: { label: '进行中', text: 'text-blue-600', bar: 'bg-blue-500' },
    NOT_STARTED: { label: '未开始', text: 'text-slate-400', bar: 'bg-slate-200' }
};

const riskMeta: Record<string, { label: string; badge: string; Icon: typeof AlertTriangle; statusText: string }> = {
    HIGH: { label: '高风险', badge: 'bg-rose-100 text-rose-700', Icon: AlertTriangle, statusText: '治理阻塞中' },
    MEDIUM: { label: '中风险', badge: 'bg-amber-100 text-amber-700', Icon: ShieldAlert, statusText: '治理关注中' },
    LOW: { label: '低风险', badge: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle, statusText: '治理运行中' }
};

const formatPercent = (value?: number | null) => {
    if (value === null || value === undefined) {
        return '--';
    }
    return `${Math.round(value * 100)}%`;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('zh-CN');

const DashboardView = ({ setActiveModule }: DashboardViewProps) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const data = governanceOverviewMock.ranges[timeRange];

    const blockerTotal = data.blockers.semantic.count
        + data.blockers.quality.count
        + data.blockers.security.count;

    const risk = riskMeta[data.kpis.risk.level] ?? riskMeta.LOW;

    const bottleneckStep = useMemo(() => {
        if (!data.pipeline.length) {
            return null;
        }
        return data.pipeline.reduce((prev, curr) => (curr.blockers > prev.blockers ? curr : prev));
    }, [data.pipeline]);

    const handleNavigate = (module?: string) => {
        if (module) {
            setActiveModule(module);
        }
    };

    const kpiCards = [
        {
            title: '字段语义覆盖率',
            value: formatPercent(data.kpis.fieldSemantic.coverageRate),
            subText: `已确认字段 ${data.kpis.fieldSemantic.covered} / ${data.kpis.fieldSemantic.total}`,
            progress: data.kpis.fieldSemantic.coverageRate,
            icon: Target,
            iconStyle: 'bg-blue-50 text-blue-600',
            module: 'bu_semantic'
        },
        {
            title: '质量 Gate 通过率',
            value: formatPercent(data.kpis.qualityGate.passRate),
            subText: `阻塞表 ${data.kpis.qualityGate.blockerTables}`,
            progress: data.kpis.qualityGate.passRate,
            icon: BarChart3,
            iconStyle: 'bg-amber-50 text-amber-600',
            module: 'governance'
        },
        {
            title: '安全分级完成率',
            value: formatPercent(data.kpis.security.completionRate),
            subText: `高敏字段 ${data.kpis.security.highUndone} 未处理`,
            progress: data.kpis.security.completionRate,
            icon: Lock,
            iconStyle: 'bg-emerald-50 text-emerald-600',
            module: 'governance'
        },
        {
            title: '当前治理风险',
            value: risk.label,
            subText: `阻塞项 ${blockerTotal}`,
            progress: null,
            icon: Activity,
            iconStyle: risk.badge,
            module: 'governance'
        }
    ];

    const tableDistribution = [
        { label: '主体表', value: data.distribution.tableSemantic.subject },
        { label: '事件表', value: data.distribution.tableSemantic.event },
        { label: '维度表', value: data.distribution.tableSemantic.dimension },
        { label: '未判定', value: data.distribution.tableSemantic.unknown }
    ];
    const maxTableValue = Math.max(...tableDistribution.map(item => item.value), 1);

    const fieldRoleDistribution = [
        { label: '业务属性', value: data.distribution.fieldRole.businessAttr },
        { label: '状态字段', value: data.distribution.fieldRole.status },
        { label: '关联字段', value: data.distribution.fieldRole.relation },
        { label: '审计字段', value: data.distribution.fieldRole.audit }
    ];

    return (
        <div className="space-y-4 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{governanceOverviewMock.title}</h2>
                    <p className="text-slate-500 mt-1">当前语义版本下的治理状态总览</p>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto md:ml-auto">
                    <div className="flex items-center gap-1 rounded-full bg-white border border-slate-200 p-1 text-xs text-slate-500">
                        {(['7d', '30d', '90d'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-2 py-0.5 rounded-full transition-colors ${timeRange === range
                                    ? 'bg-slate-900 text-white'
                                    : 'hover:bg-slate-100'
                                    }`}
                            >
                                {range === '7d' ? '近7天' : range === '30d' ? '近30天' : '近90天'}
                            </button>
                        ))}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${risk.badge}`}>
                        <risk.Icon size={12} /> {risk.statusText}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpiCards.map(card => {
                    const Icon = card.icon;
                    return (
                        <button
                            key={card.title}
                            onClick={() => handleNavigate(card.module)}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500">{card.title}</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconStyle}`}>
                                    <Icon size={18} />
                                </div>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{card.subText}</div>
                            {card.progress !== null && card.progress !== undefined && (
                                <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-slate-800"
                                        style={{ width: `${Math.min(card.progress * 100, 100)}%` }}
                                    />
                                </div>
                            )}
                            {card.title === '当前治理风险' && (
                                <div className="mt-1.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${risk.badge}`}>
                                        {risk.label}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Layers size={16} className="text-blue-500" />
                        治理主线进度
                    </h3>
                    <div className="text-xs text-slate-500">
                        当前瓶颈：{bottleneckStep && bottleneckStep.blockers > 0 ? stepLabels[bottleneckStep.step] : '无阻塞'}
                    </div>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
                    {data.pipeline.map(step => {
                        const meta = statusMeta[step.status] ?? statusMeta.NOT_STARTED;
                        const isBottleneck = bottleneckStep && bottleneckStep.step === step.step && step.blockers > 0;
                        return (
                            <button
                                key={step.step}
                                onClick={() => handleNavigate(step.cta?.module)}
                                className={`rounded-lg border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${isBottleneck ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-white'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-700">{stepLabels[step.step] || step.step}</span>
                                    <span className={`text-[10px] font-medium ${meta.text}`}>{meta.label}</span>
                                </div>
                                <div className="mt-1.5 text-lg font-semibold text-slate-800">{step.done}/{step.total}</div>
                                <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                                    <span>阻塞 {step.blockers}</span>
                                    <span>{step.cta?.text}</span>
                                </div>
                                <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${meta.bar}`}
                                        style={{ width: `${step.total ? Math.round((step.done / step.total) * 100) : 0}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Target size={16} className="text-blue-500" />
                            语义阻塞
                        </h3>
                        <span className="text-[10px] text-slate-500">关键字段未确认</span>
                    </div>
                    <div className="mt-2 space-y-2">
                        {data.blockers.semantic.topItems.length ? data.blockers.semantic.topItems.map(item => (
                            <div key={item.label} className="text-xs text-slate-600 bg-slate-100 rounded px-2 py-1">
                                {item.label}
                            </div>
                        )) : (
                            <div className="text-xs text-slate-400">暂无阻塞</div>
                        )}
                    </div>
                    <button
                        onClick={() => handleNavigate(data.blockers.semantic.cta?.module)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        {data.blockers.semantic.cta?.text} <ArrowRight size={12} />
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={16} className="text-amber-500" />
                            质量阻塞
                        </h3>
                        <span className="text-[10px] text-slate-500">Gate 未通过表</span>
                    </div>
                    <div className="mt-2 space-y-2">
                        {data.blockers.quality.topItems.length ? data.blockers.quality.topItems.map(item => (
                            <div key={item.label} className="text-xs text-slate-600 bg-slate-100 rounded px-2 py-1">
                                {item.label}
                            </div>
                        )) : (
                            <div className="text-xs text-slate-400">暂无阻塞</div>
                        )}
                    </div>
                    <button
                        onClick={() => handleNavigate(data.blockers.quality.cta?.module)}
                        className="mt-2 text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                        {data.blockers.quality.cta?.text} <ArrowRight size={12} />
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-emerald-600" />
                            安全风险
                        </h3>
                        <span className="text-[10px] text-slate-500">高敏字段未分级</span>
                    </div>
                    <div className="mt-2 space-y-2">
                        {data.blockers.security.topItems.length ? data.blockers.security.topItems.map(item => (
                            <div key={item.label} className="text-xs text-slate-600 bg-slate-100 rounded px-2 py-1">
                                {item.label}
                            </div>
                        )) : (
                            <div className="text-xs text-slate-400">暂无阻塞</div>
                        )}
                    </div>
                    <button
                        onClick={() => handleNavigate(data.blockers.security.cta?.module)}
                        className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                        {data.blockers.security.cta?.text} <ArrowRight size={12} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Layers size={16} className="text-slate-600" />
                        表语义分布
                    </h3>
                    <div className="mt-2 space-y-2">
                        {tableDistribution.map(item => (
                            <div key={item.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-600">
                                    <span>{item.label}</span>
                                    <span className="font-medium text-slate-700">{item.value}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full bg-slate-700"
                                        style={{ width: `${Math.round((item.value / maxTableValue) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Target size={16} className="text-slate-600" />
                        字段语义角色分布
                    </h3>
                    <div className="mt-2 space-y-2">
                        {fieldRoleDistribution.map(item => (
                            <div key={item.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-600">
                                    <span>{item.label}</span>
                                    <span className="font-medium text-slate-700">{formatPercent(item.value)}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full bg-slate-700"
                                        style={{ width: `${Math.round(item.value * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Activity size={16} className="text-slate-600" />
                            快捷治理入口
                        </h3>
                        <span className="text-[10px] text-slate-500">下一步行动</span>
                    </div>
                    <div className="mt-2 space-y-2">
                        {data.quickActions.map(action => (
                            <button
                                key={action.text}
                                onClick={() => handleNavigate(action.module)}
                                className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                            >
                                <span>{action.text}</span>
                                <span className="flex items-center gap-2">
                                    {action.count !== undefined && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                                            {action.count}
                                        </span>
                                    )}
                                    <ArrowRight size={12} className="text-slate-400" />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-sm p-4 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-300" />
                            当前生效语义版本
                        </h3>
                        <span className="text-xs text-slate-300">{formatDate(data.activeVersion.publishedAt)}</span>
                    </div>
                    <div className="mt-2 text-3xl font-bold">{data.activeVersion.versionName}</div>
                    <div className="mt-1.5 text-xs text-slate-300 space-y-1">
                        <div>字段语义覆盖：{formatPercent(data.versionStats.fieldSemanticCoverage)}</div>
                        <div>质量规则覆盖：{formatPercent(data.versionStats.qualityRuleCoverage)}</div>
                        <div>安全策略覆盖：{formatPercent(data.versionStats.securityPolicyCoverage)}</div>
                    </div>
                    <button
                        onClick={() => handleNavigate('td_modeling')}
                        className="mt-2.5 inline-flex items-center gap-2 text-xs text-white/90 hover:text-white"
                    >
                        查看版本详情 <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
