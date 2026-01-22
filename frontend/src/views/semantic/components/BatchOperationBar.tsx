import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { StreamingProgressPanel } from '../StreamingProgressPanel';

interface BatchOperationBarProps {
    selectedCount: number;

    // Optional legacy/progress props
    isAnalyzing?: boolean;
    runConfig?: {
        concurrency: number;
        sampleRows: number;
    };
    onOpenRunModal?: () => void;
    onBatchSemanticGen?: () => void;
    progressProps?: {
        currentAnalyzing: string | null;
        completedResults: any[];
        progress: { current: number; total: number };
        onResultClick: (tableId: string) => void;
    };

    // New Usage Props
    onBatchRun?: () => void;
    onAssistConfig?: () => void;
}

export const BatchOperationBar: React.FC<BatchOperationBarProps> = (props) => {
    const {
        selectedCount,
        isAnalyzing = false,
        runConfig = { concurrency: 3, sampleRows: 100 }, // Default safety
        onOpenRunModal,
        onBatchSemanticGen,
        progressProps,
        onBatchRun,
        onAssistConfig
    } = props;

    // Handle legacy progress view
    if (isAnalyzing && progressProps) {
        return (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                <StreamingProgressPanel
                    currentAnalyzing={progressProps.currentAnalyzing}
                    completedResults={progressProps.completedResults}
                    progress={progressProps.progress}
                    onResultClick={progressProps.onResultClick}
                />
            </div>
        );
    }

    const handleRun = onBatchRun || onOpenRunModal || (() => { });

    return (
        <div className="flex items-center gap-3">
            {/* Configuration Button */}
            {onAssistConfig && (
                <button
                    onClick={onAssistConfig}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="语义理解配置"
                >
                    <Settings size={18} />
                </button>
            )}

            {/* Run Button */}
            <div className="flex flex-col items-end gap-1">
                <button
                    onClick={handleRun}
                    disabled={selectedCount === 0}
                    className={`px-4 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-all ${selectedCount > 0
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600 shadow-md hover:shadow-lg'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    <Sparkles size={14} />
                    批量语义理解（{selectedCount}表）
                </button>
                {/* Only show estimation if we have a valid selection */}
                {selectedCount > 0 && (
                    <div className="text-[10px] text-slate-400">
                        预计耗时 {Math.max(1, Math.ceil(selectedCount / Math.max(runConfig.concurrency, 1)) * 2)}~{Math.max(2, Math.ceil(selectedCount / Math.max(runConfig.concurrency, 1)) * 2 + 1)} 分钟
                    </div>
                )}
            </div>
        </div>
    );
};
