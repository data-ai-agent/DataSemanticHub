import { Activity, AlertTriangle, CheckCircle, Cpu, Layers, Play, Rocket, Upload } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

interface AgentFactoryOverviewViewProps {
    setActiveModule?: (module: string) => void;
}

const statusTone: Record<string, string> = {
    发布: 'bg-emerald-50 text-emerald-700',
    回滚: 'bg-amber-50 text-amber-700',
    失败: 'bg-rose-50 text-rose-700'
};

const AgentFactoryOverviewView = ({ setActiveModule }: AgentFactoryOverviewViewProps) => {
    const { overview } = agentFactoryMock;
    const quickLinks = [
        { label: '模板库', desc: '浏览模板与能力标签', icon: Layers, action: 'agent_templates', tone: 'bg-blue-50 text-blue-700' },
        { label: '设计器', desc: '编辑 Prompt/流程/Schema', icon: Rocket, action: 'agent_designer', tone: 'bg-violet-50 text-violet-700' },
        { label: '调试与Trace', desc: '运行与故障定位', icon: Play, action: 'agent_debug', tone: 'bg-amber-50 text-amber-700' },
        { label: '用例评测', desc: '回归与门禁验证', icon: CheckCircle, action: 'agent_test', tone: 'bg-emerald-50 text-emerald-700' },
        { label: '发布灰度', desc: '版本上线与回滚', icon: Upload, action: 'agent_release', tone: 'bg-orange-50 text-orange-700' },
        { label: '运行实例', desc: '业务实例与工作台', icon: Cpu, action: 'agent_instances', tone: 'bg-slate-100 text-slate-600' }
    ];
    const kpiCards = [
        { ...overview.kpis[0], icon: Layers, color: 'blue' as const },
        { ...overview.kpis[1], icon: Rocket, color: 'purple' as const },
        { ...overview.kpis[2], icon: Cpu, color: 'emerald' as const },
        { ...overview.kpis[3], icon: Activity, color: 'orange' as const },
        { ...overview.kpis[4], icon: CheckCircle, color: 'emerald' as const },
        { ...overview.kpis[5], icon: AlertTriangle, color: 'orange' as const }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="智能体工厂"
                description="围绕模板治理、调试、评测与发布的全链路概览。"
                actions={(
                    <>
                        <button
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:border-slate-300"
                            onClick={() => setActiveModule?.('agent_templates')}
                        >
                            创建模板
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
                            onClick={() => setActiveModule?.('agent_designer')}
                        >
                            创建智能体
                        </button>
                    </>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800">治理状态</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {overview.governanceStatus.map(item => (
                        <div key={item.label} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-slate-800">{item.label}</div>
                                <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-semibold text-slate-900">{item.value}</div>
                                <button
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                    onClick={() => setActiveModule?.('agent_release')}
                                >
                                    查看详情
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">最近活动</h3>
                        <button
                            className="text-xs text-slate-500 hover:text-slate-700"
                            onClick={() => setActiveModule?.('agent_release')}
                        >
                            查看发布
                        </button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {overview.recentActivities.map(item => (
                            <div key={`${item.template}-${item.time}`} className="flex items-center justify-between text-sm">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusTone[item.type]}`}>{item.type}</span>
                                        <span className="font-medium text-slate-800">{item.template}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">版本 {item.version}</p>
                                </div>
                                <span className="text-xs text-slate-400">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">使用量 Top</h3>
                        <button
                            className="text-xs text-slate-500 hover:text-slate-700"
                            onClick={() => setActiveModule?.('agent_observability')}
                        >
                            查看观测
                        </button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {overview.topUsage.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">{index + 1}</span>
                                    <div>
                                        <div className="font-medium text-slate-800">{item.name}</div>
                                        <div className="text-xs text-slate-500">成功率 {item.successRate}</div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500">{item.calls}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">失败率 Top</h3>
                        <button
                            className="text-xs text-slate-500 hover:text-slate-700"
                            onClick={() => setActiveModule?.('agent_debug')}
                        >
                            打开调试
                        </button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {overview.topFailures.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xs">{index + 1}</span>
                                    <div>
                                        <div className="font-medium text-slate-800">{item.name}</div>
                                        <div className="text-xs text-slate-500">P95 {item.p95}</div>
                                    </div>
                                </div>
                                <span className="text-xs text-rose-600">{item.failRate}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800">关键链路入口</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {quickLinks.map(link => (
                        <button
                            key={link.label}
                            className="rounded-lg border border-slate-200 p-3 text-left hover:border-slate-300 transition-colors"
                            onClick={() => setActiveModule?.(link.action)}
                        >
                            <div className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full ${link.tone}`}>
                                <link.icon size={12} /> {link.label}
                            </div>
                            <div className="text-sm font-medium text-slate-800 mt-2">{link.label}</div>
                            <div className="text-xs text-slate-500 mt-1">{link.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgentFactoryOverviewView;
