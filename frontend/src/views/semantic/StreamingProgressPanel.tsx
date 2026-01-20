import React from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface BatchResult {
    tableId: string;
    tableName: string;
    businessName: string;
    scorePercent: number;
    needsReview?: boolean;
    status: 'success' | 'error' | 'pending';
}

interface StreamingProgressPanelProps {
    currentAnalyzing: string | null;
    completedResults: BatchResult[];
    progress: { current: number; total: number };
    onResultClick?: (tableId: string) => void;
}

export const StreamingProgressPanel: React.FC<StreamingProgressPanelProps> = ({
    currentAnalyzing,
    completedResults,
    progress,
    onResultClick
}) => {
    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    const pending = progress.total - progress.current;

    return (
        <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 mb-2">🧠 批量语义理解</h3>
                {currentAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Loader2 size={14} className="animate-spin" />
                        <span>正在分析: <span className="font-mono font-medium">{currentAnalyzing}</span></span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>{progress.current}/{progress.total}</span>
                    <span>{percentage}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-emerald-600">✅ 已完成 {progress.current}</span>
                    {currentAnalyzing && <span className="text-purple-600">⏳ 进行中 1</span>}
                    {pending > 0 && <span className="text-slate-400">⏸ 待处理 {pending}</span>}
                </div>
            </div>

            {/* Real-time Results */}
            {completedResults.length > 0 && (
                <div className="mt-4">
                    <div className="text-sm font-medium text-slate-600 mb-2">实时结果预览</div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {completedResults.map((result, idx) => (
                            <div
                                key={idx}
                                onClick={() => onResultClick?.(result.tableId)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${result.needsReview
                                        ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
                                        : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {result.needsReview ? (
                                        <AlertTriangle size={16} className="text-orange-600 shrink-0" />
                                    ) : (
                                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-mono text-sm text-slate-700 truncate">{result.tableName}</div>
                                        <div className="text-xs text-slate-500 truncate">→ {result.businessName}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${result.scorePercent >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                            result.scorePercent >= 70 ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'
                                        }`}>
                                        {result.scorePercent >= 90 ? '🅰️' : result.scorePercent >= 70 ? '🅱️' : '🆑'} {result.scorePercent}%
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${result.needsReview
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {result.needsReview ? '需审核' : '自动通过'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
