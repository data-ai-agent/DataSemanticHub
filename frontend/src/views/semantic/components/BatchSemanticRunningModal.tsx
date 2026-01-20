import React from 'react';
import { X, Loader2, Database, CheckCircle } from 'lucide-react';
import { BatchSemanticConfig } from './BatchSemanticConfigModal';

interface BatchSemanticRunningModalProps {
    open: boolean;
    totalTables: number;
    completedTables: number;
    currentTable: string;
    config: BatchSemanticConfig;
    onBackground: () => void;
}

export const BatchSemanticRunningModal: React.FC<BatchSemanticRunningModalProps> = ({
    open,
    totalTables,
    completedTables,
    currentTable,
    config,
    onBackground
}) => {
    if (!open) return null;

    const progressPercent = (completedTables / totalTables) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">正在批量生成语义建议</h2>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    {/* 进度区 */}
                    <div>
                        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                            <span>进度</span>
                            <span className="font-mono font-medium text-blue-600">
                                {completedTables} / {totalTables} 张表
                            </span>
                        </div>
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="text-right text-xs text-slate-500 mt-1">
                            {Math.round(progressPercent)}%
                        </div>
                    </div>

                    {/* 当前执行信息 */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="text-xs text-slate-500 mb-2">当前处理</div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Database size={20} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-mono font-medium text-slate-800">{currentTable}</div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    语义理解辅助检测：
                                    {config.enableAuxDetection ? (
                                        <span className="text-emerald-600 font-medium">
                                            开启（{config.sampleRatio}% 采样）
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">关闭</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 运行状态提示 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Loader2 size={14} className="animate-spin text-blue-600" />
                            <span>正在计算字段画像</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Loader2 size={14} className="animate-spin text-purple-600" />
                            <span>正在生成语义建议</span>
                        </div>
                    </div>

                    {/* 已完成提示 */}
                    {completedTables > 0 && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <CheckCircle size={14} />
                            <span>已完成 {completedTables} 张表的语义建议生成</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-center">
                    <button
                        onClick={onBackground}
                        className="px-6 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-all"
                    >
                        在后台运行
                    </button>
                </div>
            </div>
        </div>
    );
};
