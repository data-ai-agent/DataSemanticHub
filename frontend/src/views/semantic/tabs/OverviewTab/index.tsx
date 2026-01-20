import React, { useState } from 'react';
import { CheckCircle, Activity } from 'lucide-react';
import { TableSemanticProfile } from '../../../../types/semantic';
import { GateFailureAlertCard } from '../../components/GateFailureAlertCard';

interface OverviewTabProps {
    profile: TableSemanticProfile;
    onNavigateToEvidence: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ profile, onNavigateToEvidence }) => {
    const [showAllKeyEvidence, setShowAllKeyEvidence] = useState(false);

    // Compute evidence list
    const ruleEvidence = profile.ruleEvidence || [];
    const aiEvidenceItems = profile.aiEvidenceItems || [];
    const evidenceList = [
        ...ruleEvidence.map((text: string) => ({ type: '规则', text })),
        ...aiEvidenceItems.map((item: any) => ({ type: 'AI', text: `${item.field}：${item.reason}` }))
    ];
    const evidenceTop = evidenceList.slice(0, 5);

    return (
        <div className="space-y-4">
            {/* Key Evidence Card */}
            <div id="result-key-evidence" className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500" /> 关键证据
                    </div>
                    {evidenceList.length > 5 && (
                        <button
                            onClick={() => setShowAllKeyEvidence(prev => !prev)}
                            className="text-xs text-slate-500 hover:text-slate-700"
                        >
                            {showAllKeyEvidence ? '收起' : `展开更多（${evidenceList.length}）`}
                        </button>
                    )}
                </div>
                <div className="mt-2 space-y-2 text-sm">
                    {(showAllKeyEvidence ? evidenceList : evidenceTop).length > 0 ? (showAllKeyEvidence ? evidenceList : evidenceTop).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${item.type === '规则' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                {item.type}
                            </span>
                            <span className="text-slate-600">{item.text}</span>
                        </div>
                    )) : (
                        <div className="text-xs text-slate-400">暂无关键证据</div>
                    )}
                </div>
            </div>

            {/* Gate Failure Alert */}
            {profile.gateResult && profile.gateResult.result !== 'PASS' && (
                <div id="result-gate-detail">
                    <GateFailureAlertCard
                        gateResult={profile.gateResult}
                        onNavigateToEvidence={onNavigateToEvidence}
                    />
                </div>
            )}

            {/* Score Breakdown */}
            <div id="result-score-breakdown" className="rounded-lg border border-slate-100 bg-white p-4">
                <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Activity size={14} className="text-blue-600" /> 评分拆解
                </div>
                {profile.scoreBreakdown ? (
                    <div className="mt-3 space-y-3">
                        {[
                            { label: '规则贡献', value: profile.scoreBreakdown.rule, color: 'bg-purple-500' },
                            { label: '字段贡献', value: profile.scoreBreakdown.field, color: 'bg-emerald-500' },
                            { label: 'AI 贡献', value: profile.scoreBreakdown.ai, color: 'bg-blue-500' }
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                    <span>{item.label}</span>
                                    <span>{Math.round(item.value * 100)}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: `${Math.round(item.value * 100)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-slate-400 mt-2">暂无评分拆解</div>
                )}
            </div>
        </div>
    );
};
