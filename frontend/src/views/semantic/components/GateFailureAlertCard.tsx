import React, { useState } from 'react';
import { AlertTriangle, X, Copy } from 'lucide-react';
import { SemanticGateResult } from '../../../types/semantic';

interface GateFailureAlertCardProps {
    gateResult: SemanticGateResult;
    onNavigateToEvidence?: () => void;
}

/**
 * P0-2: Gate Failure Alert Card
 * Displays actionable governance recommendations with SQL templates
 * at the top of the Overview tab
 */
export const GateFailureAlertCard: React.FC<GateFailureAlertCardProps> = ({
    gateResult,
    onNavigateToEvidence
}) => {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    if (!gateResult.actionItems || gateResult.actionItems.length === 0) {
        return null;
    }

    const handleCopySQL = (sql: string, idx: number) => {
        navigator.clipboard.writeText(sql);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const highPriorityCount = gateResult.actionItems.filter(a => a.priority === 'high').length;

    return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                <div className="flex-1">
                    <h4 className="font-bold text-red-800 mb-3 text-sm flex items-center justify-between">
                        <span>需要关注的治理缺陷 ({highPriorityCount} 高优先级)</span>
                        {onNavigateToEvidence && (
                            <button
                                onClick={onNavigateToEvidence}
                                className="text-xs font-normal text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                查看完整证据 →
                            </button>
                        )}
                    </h4>

                    <div className="space-y-2">
                        {gateResult.actionItems.map((action, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <X size={14} className="text-red-600" />
                                        <span className="font-medium text-slate-800 text-sm">{action.title}</span>
                                        {action.priority === 'high' && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                                                高优先级
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs text-slate-600 mb-2">
                                    {action.description}
                                </div>

                                {action.sqlTemplate && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                                推荐 SQL 模板
                                            </span>
                                            <button
                                                onClick={() => handleCopySQL(action.sqlTemplate!, idx)}
                                                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                                            >
                                                <Copy size={10} />
                                                {copiedIdx === idx ? '已复制!' : '复制 SQL'}
                                            </button>
                                        </div>
                                        <pre className="bg-slate-900 text-slate-100 p-3 rounded text-[10px] overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                                            {action.sqlTemplate}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
