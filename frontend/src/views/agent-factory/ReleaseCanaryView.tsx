import React, { useState } from 'react';
import {
    Rocket, AlertOctagon, GitCommit, CheckCircle, Clock,
    ArrowRight, Activity, Users, Shield
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// --- Types ---

type ReleaseStage = 'PRE_CHECK' | 'QUALITY_GATE' | 'CANARY' | 'PROMOTION';

// --- Mock Data ---

const METRICS_DATA = [
    { time: '10:00', stable: 98, canary: 97 },
    { time: '10:05', stable: 98.5, canary: 96 },
    { time: '10:10', stable: 99, canary: 98 },
    { time: '10:15', stable: 98.2, canary: 98.5 },
    { time: '10:20', stable: 99.1, canary: 99 },
    { time: '10:25', stable: 98.8, canary: 99.2 },
];

// --- Components ---

const ReleaseCanaryView: React.FC = () => {
    const [currentStage, setCurrentStage] = useState<ReleaseStage>('CANARY');
    const [canaryPercentage, setCanaryPercentage] = useState(10);
    const [isRollingBack, setIsRollingBack] = useState(false);

    const stages: { id: ReleaseStage; label: string }[] = [
        { id: 'PRE_CHECK', label: '预检查 (Pre-check)' },
        { id: 'QUALITY_GATE', label: '质量门禁 (Gate)' },
        { id: 'CANARY', label: '灰度发布 (Canary)' },
        { id: 'PROMOTION', label: '全量上线 (Promote)' }
    ];

    const handleRollback = () => {
        if (confirm('确认立即回滚至上一个稳定版本 (v2.0.5)？这将切断当前灰度版本的流量。')) {
            setIsRollingBack(true);
            setTimeout(() => {
                setIsRollingBack(false);
                setCanaryPercentage(0);
                setCurrentStage('PRE_CHECK');
                alert('回滚成功！');
            }, 2000);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-y-auto">

            {/* Header / Version Info */}
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <h1 className="text-2xl font-bold text-slate-900">发布控制台</h1>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-200 uppercase">
                                Deploying
                            </span>
                        </div>
                        <div className="flex items-center space-x-8 text-sm">
                            <div className="flex items-center">
                                <span className="text-slate-500 mr-2">目标版本 (Candidate):</span>
                                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">v2.1.0-rc.3</span>
                            </div>
                            <div className="flex items-center">
                                <ArrowRight className="w-4 h-4 text-slate-300 mr-4" />
                                <span className="text-slate-500 mr-2">当前稳定版 (Stable):</span>
                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">v2.0.5</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRollback}
                        className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2 rounded-md font-medium text-sm hover:bg-rose-100 flex items-center shadow-sm"
                    >
                        <AlertOctagon className="w-4 h-4 mr-2" />
                        紧急回滚 (Emergency Rollback)
                    </button>
                </div>

                {/* Pipeline Steps */}
                <div className="mt-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
                    <div className="flex justify-between relative z-10">
                        {stages.map((stage, idx) => {
                            const isCompleted = stages.findIndex(s => s.id === currentStage) > idx;
                            const isCurrent = currentStage === stage.id;

                            return (
                                <div key={stage.id} className="flex flex-col items-center">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors
                                        ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                                            isCurrent ? 'bg-white border-indigo-600 text-indigo-600 shadow-lg scale-110' :
                                                'bg-white border-slate-200 text-slate-300'}
                                    `}>
                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                    </div>
                                    <span className={`mt-2 text-xs font-bold ${isCurrent ? 'text-indigo-700' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-8 max-w-5xl mx-auto w-full space-y-6">

                {/* Current Stage Control Panel */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-indigo-600" />
                            当前阶段：灰度发布 (Canary Release)
                        </h3>
                        <div className="flex items-center text-xs text-slate-500">
                            <Clock className="w-3 h-3 mr-1" />
                            已持续: 25分钟
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-sm font-medium text-slate-700">流量权重 (Traffic Weight)</label>
                                <span className="text-2xl font-bold text-indigo-600">{canaryPercentage}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={canaryPercentage}
                                onChange={(e) => setCanaryPercentage(parseInt(e.target.value))}
                                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                <span>0% (Off)</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100% (Full)</span>
                            </div>
                        </div>

                        <div className="flex items-center p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 mb-6">
                            <Shield className="w-5 h-5 mr-3 text-amber-600" />
                            <div>
                                <span className="font-bold block">自动熔断保护已开启</span>
                                <span className="text-xs opacity-80">如果错误率超过 1% 或 P95 延迟超过 2000ms，将自动回滚流量至 0%。</span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-50">
                                暂停放量
                            </button>
                            <button
                                onClick={() => {
                                    setCanaryPercentage(100);
                                    setTimeout(() => setCurrentStage('PROMOTION'), 1000);
                                }}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-md font-medium text-sm hover:bg-emerald-700 shadow-sm flex items-center"
                            >
                                <Rocket className="w-4 h-4 mr-2" />
                                完成发布 (Promote to 100%)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Metrics Dashboard */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h4 className="text-sm font-bold text-slate-700 mb-4">成功率对比 (Success Rate)</h4>
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={METRICS_DATA}>
                                    <defs>
                                        <linearGradient id="colorCanary" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" hide />
                                    <YAxis domain={[90, 100]} hide />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="stable" stroke="#94a3b8" strokeDasharray="5 5" fill="transparent" name="Stable" />
                                    <Area type="monotone" dataKey="canary" stroke="#6366f1" strokeWidth={2} fill="url(#colorCanary)" name="Canary" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center space-x-6 mt-2 text-xs">
                            <div className="flex items-center"><div className="w-3 h-1 bg-slate-400 mr-2" /> Stable: 98.8%</div>
                            <div className="flex items-center"><div className="w-3 h-1 bg-indigo-500 mr-2" /> Canary: 99.2%</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center">
                                <Users className="w-5 h-5 text-slate-400 mr-3" />
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">涉及用户</div>
                                    <div className="text-lg font-bold text-slate-800">1,240 / 12,400</div>
                                </div>
                            </div>
                            <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded">10% Traffic</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center">
                                <GitCommit className="w-5 h-5 text-slate-400 mr-3" />
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Schema 兼容性</div>
                                    <div className="text-lg font-bold text-emerald-600">Passed</div>
                                </div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReleaseCanaryView;
