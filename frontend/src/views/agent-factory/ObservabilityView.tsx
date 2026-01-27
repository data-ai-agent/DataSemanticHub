import { Activity, AlertTriangle, Clock, LineChart } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

const ObservabilityView = () => {
    const { observability } = agentFactoryMock;
    const kpiCards = [
        { ...observability.kpis[0], icon: LineChart, color: 'blue' as const },
        { ...observability.kpis[1], icon: Activity, color: 'emerald' as const },
        { ...observability.kpis[2], icon: Clock, color: 'orange' as const },
        { ...observability.kpis[3], icon: AlertTriangle, color: 'purple' as const }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="运行观测"
                description="按模板/版本/实例汇总运行表现。"
                actions={(
                    <div className="flex flex-wrap gap-2">
                        {['近7天', '环境：Prod', '能力类型：问数', '模板：供应链问数助手'].map(filter => (
                            <span key={filter} className="px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600">
                                {filter}
                            </span>
                        ))}
                    </div>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpiCards.map(card => (
                    <StatCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        trend={card.trend}
                        icon={card.icon}
                        color={card.color}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">错误码 Top</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        {observability.errorCodes.map(code => (
                            <div key={code.code} className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div>
                                    <div className="text-slate-800 font-medium">{code.code}</div>
                                    <div className="text-xs text-slate-500 mt-1">{code.template}</div>
                                </div>
                                <div className="text-slate-600">{code.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">阶段耗时分布</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                        {['parse 220ms', 'ground 640ms', 'plan 410ms', 'generate 1.8s', 'execute 2.4s'].map(item => (
                            <div key={item} className="flex items-center justify-between">
                                <span>{item.split(' ')[0]}</span>
                                <span>{item.split(' ')[1]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">工具使用情况</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        {['SemanticSearch · 48k', 'MetricResolver · 32k', 'SQLRunner · 18k'].map(tool => (
                            <div key={tool} className="rounded-lg border border-slate-200 p-3 text-slate-600">
                                {tool}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800">Trace 搜索结果</h3>
                <div className="mt-4 grid grid-cols-5 text-xs text-slate-400 border-b border-slate-100 pb-2">
                    <span>TraceId</span>
                    <span>RequestId</span>
                    <span>模板版本</span>
                    <span>状态</span>
                    <span>耗时</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                    {observability.traces.map(trace => (
                        <div key={trace.traceId} className="grid grid-cols-5 items-center border-b border-slate-100 pb-2">
                            <span className="text-slate-700">{trace.traceId}</span>
                            <span className="text-slate-500">{trace.requestId}</span>
                            <span className="text-slate-500">{trace.template}</span>
                            <span className={trace.status === '成功' ? 'text-emerald-600' : 'text-rose-600'}>{trace.status}</span>
                            <span className="text-slate-500">{trace.latency}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ObservabilityView;
