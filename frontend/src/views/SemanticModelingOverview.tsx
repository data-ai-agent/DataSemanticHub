import { useState } from 'react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle,
    Copy,
    Database,
    FileText,
    Layers,
    Layout,
    Link,
    PieChart,
    ShieldAlert,
    Sparkles,
    Target,
    Zap
} from 'lucide-react';
import semanticModelingOverviewMock, { SemanticModelingOverviewData } from '../data/semanticModelingOverviewMock';

interface SemanticModelingOverviewProps {
    setActiveModule: (module: string) => void;
}

const SemanticModelingOverview = ({ setActiveModule }: SemanticModelingOverviewProps) => {
    const [timeRange, setTimeRange] = useState<'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS'>('LAST_30_DAYS');
    const [viewMode, setViewMode] = useState<'business' | 'tech'>('business');

    // Default to LAST_30_DAYS if the key doesn't exist, though it should based on mock
    const data: SemanticModelingOverviewData = semanticModelingOverviewMock[timeRange] || semanticModelingOverviewMock['LAST_30_DAYS'];
    const { kpis, views, stages, blockers, nextActions } = data;

    // Helper for percentage formatting
    const percent = (val: number) => `${Math.round(val * 100)}%`;

    // Determine Status Badge from pipeline
    const currentStage = stages.pipeline.find(s => s.status === 'IN_PROGRESS') || stages.pipeline[stages.pipeline.length - 1];
    const statusText = currentStage?.status === 'BLOCKED' ? '建模阻塞中' : '建模进行中';
    const statusColor = currentStage?.status === 'BLOCKED' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700';

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in p-2">
            {/* 1. Header Zone */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">语义建模概览</h1>
                    <p className="text-sm text-slate-500 mt-1">从业务与技术视角协同推进语义建模</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                        {[
                            { label: '近 7 天', value: 'LAST_7_DAYS' },
                            { label: '近 30 天', value: 'LAST_30_DAYS' },
                            { label: '近 90 天', value: 'LAST_90_DAYS' },
                        ].map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setTimeRange(t.value as any)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === t.value
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor} flex items-center gap-1.5`}>
                        <Activity size={14} />
                        {statusText}
                    </span>
                </div>
            </div>

            {/* 2. Top KPI Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Object Scale */}
                <button
                    onClick={() => setActiveModule('td_modeling')}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs font-medium text-slate-500">业务对象规模</div>
                            <div className="text-3xl font-bold text-slate-900 mt-2">{kpis.objectScale.total}</div>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Layers size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>已发布 {kpis.objectScale.published}</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>草稿 {kpis.objectScale.draft}</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>归档 {kpis.objectScale.archived}</span>
                    </div>
                    {/* Sparkline placeholder */}
                    <div className="mt-3 h-8 w-full opacity-50">
                        <svg viewBox="0 0 100 20" className="w-full h-full text-blue-500 fill-current opacity-20">
                            <path d="M0 20 L0 10 L25 15 L50 5 L75 12 L100 8 L100 20 Z" />
                        </svg>
                        <svg viewBox="0 0 100 20" className="w-full h-full text-blue-500 stroke-current -mt-8 fill-none" strokeWidth="2">
                            <path d="M0 10 L25 15 L50 5 L75 12 L100 8" vectorEffect="non-scaling-stroke" />
                        </svg>
                    </div>
                </button>

                {/* KPI 2: Candidate Review */}
                <button
                    onClick={() => setActiveModule('candidate_confirmation')}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all text-left group"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs font-medium text-slate-500">候选与审核</div>
                            <div className="text-3xl font-bold text-slate-900 mt-2">{kpis.candidateReview.total}</div>
                        </div>
                        <div className="relative w-12 h-12">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray={`${kpis.candidateReview.pendingRate * 100}, 100`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-purple-600">
                                {percent(kpis.candidateReview.pendingRate)}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 font-medium">待确认 {kpis.candidateReview.pending}</span>
                        <span>已确认 {kpis.candidateReview.confirmed}</span>
                        <span>已忽略 {kpis.candidateReview.ignored}</span>
                    </div>
                </button>

                {/* KPI 3: Modeling Conflict */}
                <button
                    onClick={() => setActiveModule('field_semantic')}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all text-left group"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs font-medium text-slate-500">建模冲突与风险</div>
                            <div className="text-3xl font-bold text-slate-900 mt-2">{kpis.modelingConflict.total}</div>
                        </div>
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                        {kpis.modelingConflict.severity.critical > 0 && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium">严重 {kpis.modelingConflict.severity.critical}</span>}
                        {kpis.modelingConflict.severity.warning > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">警告 {kpis.modelingConflict.severity.warning}</span>}
                        {kpis.modelingConflict.severity.info > 0 && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">提示 {kpis.modelingConflict.severity.info}</span>}
                    </div>
                </button>

                {/* KPI 4: Maturity */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl shadow-lg text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs font-medium text-slate-400">语义建模成熟度</div>
                            <div className="text-3xl font-bold mt-2">{kpis.modelingMaturity.score}</div>
                        </div>
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Sparkles size={20} />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
                        <Activity size={12} />
                        {kpis.modelingMaturity.trendLabel}
                    </div>
                    <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${kpis.modelingMaturity.score}%` }} />
                    </div>
                </div>
            </div>

            {/* 3. Core Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left: View Switch */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-bold text-slate-800">建模视角</h3>
                        <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                            <button
                                onClick={() => setViewMode('business')}
                                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'business' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                业务视角
                            </button>
                            <button
                                onClick={() => setViewMode('tech')}
                                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'tech' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                技术视角
                            </button>
                        </div>
                    </div>

                    {viewMode === 'business' ? (
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            {/* Business View Cards */}
                            <button onClick={() => setActiveModule('td_goals')} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group">
                                <div className="text-xs text-slate-500 flex items-center justify-between">
                                    业务目标覆盖
                                    <Target size={14} className="text-slate-400 group-hover:text-blue-500" />
                                </div>
                                <div className="text-2xl font-bold text-slate-800 mt-2">{percent(views.business.goalCoverage.rate)}</div>
                                <div className="mt-3 text-[10px] text-slate-500 space-y-1">
                                    <div className="flex justify-between"><span>目标 total</span> <span>{views.business.goalCoverage.totalGoals}</span></div>
                                    <div className="flex justify-between"><span>已落地 landed</span> <span className="font-medium text-emerald-600">{views.business.goalCoverage.landed}</span></div>
                                </div>
                            </button>
                            <button onClick={() => setActiveModule('business_kpi')} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group">
                                <div className="text-xs text-slate-500 flex items-center justify-between">
                                    KPI 口径覆盖
                                    <PieChart size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                </div>
                                <div className="text-2xl font-bold text-slate-800 mt-2">{views.business.kpiCoverage.covered} <span className="text-sm font-normal text-slate-400">/ {views.business.kpiCoverage.total}</span></div>
                                <div className="mt-3 text-[10px] text-slate-500">
                                    口径一致率 <span className="font-medium text-slate-800">{percent(views.business.kpiCoverage.consistencyRate)}</span>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            {/* Tech View Cards */}
                            <button onClick={() => setActiveModule('bu_connect')} className="border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left group">
                                <div className="text-xs text-slate-500 flex items-center justify-between">
                                    资产接入
                                    <Database size={14} className="text-slate-400 group-hover:text-emerald-500" />
                                </div>
                                <div className="text-2xl font-bold text-slate-800 mt-2">{views.tech.assetIngestion.connected} <span className="text-sm font-normal text-slate-400">/ {views.tech.assetIngestion.total}</span></div>
                                <div className="mt-3 text-[10px] text-slate-500 flex gap-2">
                                    <span className="text-emerald-600">接入 {views.tech.assetIngestion.connected}</span>
                                    <span className="text-amber-600">扫描 {views.tech.assetIngestion.scanning}</span>
                                </div>
                            </button>
                            <button onClick={() => setActiveModule('mapping')} className="border border-slate-200 rounded-xl p-4 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all text-left group">
                                <div className="text-xs text-slate-500 flex items-center justify-between">
                                    映射进度
                                    <Link size={14} className="text-slate-400 group-hover:text-cyan-500" />
                                </div>
                                <div className="text-2xl font-bold text-slate-800 mt-2">{views.tech.mappingProgress.mapped} <span className="text-sm font-normal text-slate-400">/ {views.tech.mappingProgress.total}</span></div>
                                <div className="mt-3 text-[10px] text-slate-500 truncate">
                                    缺口: {views.tech.mappingProgress.missingObjects.join(', ')}
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Object Heat & Pipeline */}
                <div className="flex flex-col gap-4 h-full">
                    {/* Object Heat */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-1">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" />
                            关键对象热度 (TOP 5)
                        </h3>
                        <div className="space-y-3">
                            {stages.objectHeatTopN.map((obj, i) => (
                                <div key={obj.objectId} className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold w-4 text-center ${i < 3 ? 'text-slate-800' : 'text-slate-400'}`}>{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-slate-700">{obj.name}</span>
                                            <span className="text-slate-400">{obj.heatScore}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-600" style={{ width: `${obj.heatScore}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pipeline */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Copy size={16} className="text-blue-500" />
                            建模阶段进展
                        </h3>
                        <div className="space-y-3">
                            {stages.pipeline.map(step => {
                                let icon = <div className="w-2 h-2 rounded-full bg-slate-300" />;
                                let statusClass = "text-slate-400";
                                if (step.status === 'DONE') {
                                    icon = <CheckCircle size={14} className="text-emerald-500" />;
                                    statusClass = "text-slate-800 font-medium";
                                } else if (step.status === 'IN_PROGRESS') {
                                    icon = <Activity size={14} className="text-blue-500 animate-pulse" />;
                                    statusClass = "text-blue-600 font-bold";
                                } else if (step.status === 'BLOCKED') {
                                    icon = <ShieldAlert size={14} className="text-rose-500" />;
                                    statusClass = "text-rose-600 font-medium";
                                }

                                return (
                                    <div key={step.key} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            {icon}
                                            {step.label}
                                        </div>
                                        <div className={statusClass}>
                                            {step.status === 'DONE' && '已完成'}
                                            {step.status === 'IN_PROGRESS' && (step.progress ? `进行中 ${percent(step.progress)}` : '进行中')}
                                            {step.status === 'BLOCKED' && `阻塞 ${step.blockerCount}`}
                                            {step.status === 'NOT_STARTED' && '未开始'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Action Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Blockers */}
                <div className="bg-rose-50/50 rounded-xl border border-rose-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
                            <ShieldAlert size={16} />
                            建模阻塞
                        </h3>
                        <div className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">{blockers.length} Pending</div>
                    </div>
                    <div className="space-y-2">
                        {blockers.map((b, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveModule(b.filterHint.route)}
                                className="w-full flex items-center justify-between bg-white/80 p-2.5 rounded-lg border border-rose-100 hover:border-rose-300 hover:shadow-sm transition-all text-left"
                            >
                                <div>
                                    <div className="text-xs font-semibold text-slate-700">{b.label}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{b.count} 项待处理</div>
                                </div>
                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {b.severity}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Risks - Can be combined or generic */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        潜在风险
                    </h3>
                    <div className="space-y-2">
                        <div className="flex gap-2 items-start p-2 rounded-lg bg-amber-50 border border-amber-100/50">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <p className="text-xs text-amber-800 leading-snug">
                                关键对象 <span className="font-semibold">Inventory</span> 字段完备度不足 60%，可能影响下游消费。
                            </p>
                        </div>
                        <div className="flex gap-2 items-start p-2 rounded-lg bg-amber-50 border border-amber-100/50">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <p className="text-xs text-amber-800 leading-snug">
                                命名冲突：检测到 3 个同义不同名对象，建议统一术语。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Next Action */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layout size={120} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Zap size={18} className="text-blue-500 fill-current" />
                            下一步行动
                        </h3>
                        <div className="space-y-3 relative z-10">
                            {nextActions.map((action, i) => (
                                <button
                                    key={action.key}
                                    onClick={() => setActiveModule(action.route)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${action.highlight
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 transform scale-105'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${action.highlight ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {action.priority}
                                        </span>
                                        <span className={`text-sm ${action.highlight ? 'font-bold' : 'font-medium'}`}>{action.label}</span>
                                    </div>
                                    <ArrowRight size={16} className={action.highlight ? 'text-white' : 'text-slate-300'} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default SemanticModelingOverview;
