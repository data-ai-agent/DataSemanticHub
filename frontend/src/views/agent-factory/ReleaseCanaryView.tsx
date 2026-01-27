import { ArrowRight, PauseCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

const stepStyles: Record<string, string> = {
    done: 'bg-emerald-50 text-emerald-700',
    in_progress: 'bg-amber-50 text-amber-700',
    pending: 'bg-slate-100 text-slate-500'
};

const ReleaseCanaryView = () => {
    const { releaseCanary } = agentFactoryMock;

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="发布与灰度"
                description="控制版本上线节奏与风险监控。"
                actions={(
                    <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm">发起发布</button>
                )}
            />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-xs text-slate-400">发布版本</div>
                        <div className="text-slate-800 font-medium mt-1">v2.3.1 Draft</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-xs text-slate-400">目标环境</div>
                        <div className="text-slate-800 font-medium mt-1">Prod</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-xs text-slate-400">发布策略</div>
                        <div className="text-slate-800 font-medium mt-1">灰度 1% → 5% → 20%</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                        <div className="text-xs text-slate-400">门禁绑定</div>
                        <div className="text-slate-800 font-medium mt-1">评测报告 #2024-102</div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={14} className="text-emerald-500" /> 线上指标门禁已启用：成功率、超时率、成本
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800">发布步骤</h3>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    {releaseCanary.steps.map(step => (
                        <div key={step.name} className="flex items-center gap-2">
                            <span className={`px-3 py-1.5 rounded-full text-xs ${stepStyles[step.status]}`}>{step.name}</span>
                            <ArrowRight size={14} className="text-slate-300" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800">灰度监控指标</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {releaseCanary.metrics.map(metric => (
                        <div key={metric.label} className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">{metric.label}</div>
                            <div className="text-slate-800 font-semibold mt-1">{metric.value}</div>
                            <div className="text-xs text-emerald-600 mt-1">{metric.delta}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">回滚面板</h3>
                    <p className="text-xs text-slate-500 mt-1">一键回滚至稳定版本或指定版本。</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                        <PauseCircle size={14} /> 暂停放量
                    </button>
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                        <RefreshCw size={14} /> 回滚到 Stable
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReleaseCanaryView;
