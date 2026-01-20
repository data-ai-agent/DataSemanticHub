import React, { useState } from 'react';
import {
    SemanticAssist,
    SemanticAssistBatchRunConfig,
    DEFAULT_SEMANTIC_ASSIST
} from '../../../types/semanticAssist';
import { X, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface SemanticAssistBatchModalProps {
    open: boolean;
    selectedTables: string[];
    defaultAssist?: SemanticAssist;
    onClose: () => void;
    onStart: (config: SemanticAssistBatchRunConfig) => void;
    /** 显示逻辑视图信息 */
    viewInfo?: string;
}

/**
 * 语义理解辅助检测 - 批量语义理解弹窗
 * 
 * 用于批量 Run 的参数配置
 * 
 * 关键规则：
 * - 批量配置 ≠ 详情页配置
 * - 必须作为 run snapshot 保存
 */
export const SemanticAssistBatchModal: React.FC<SemanticAssistBatchModalProps> = ({
    open,
    selectedTables,
    defaultAssist = DEFAULT_SEMANTIC_ASSIST,
    onClose,
    onStart,
    viewInfo = '多个数据源',
}) => {
    const [enabled, setEnabled] = useState(defaultAssist.enabled);
    const [sampleRatio, setSampleRatio] = useState<0.5 | 1 | 5>(
        defaultAssist.runtimeConfig.sampleRatio
    );

    if (!open) return null;

    const handleStart = () => {
        const config: SemanticAssistBatchRunConfig = {
            runType: 'SEMANTIC_SUGGESTION_BATCH',
            scope: 'BATCH',
            targets: selectedTables,
            semanticAssist: {
                enabled,
                template: 'SEMANTIC_MIN',
                runtimeConfig: {
                    sampleRatio,
                    forceRecompute: false,
                },
                systemConfig: defaultAssist.systemConfig,
            },
        };
        onStart(config);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">批量语义理解</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span>
                                已选表：
                                <span className="font-medium text-blue-600">{selectedTables.length}</span>
                            </span>
                            <span className="w-px h-3 bg-slate-300" />
                            <span>
                                逻辑视图：
                                <span className="font-medium text-slate-700">{viewInfo}</span>
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 语义理解辅助检测模块 */}
                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                        <h4 className="text-base font-bold text-slate-800 mb-1">语义理解辅助检测</h4>
                        <p className="text-xs text-slate-500 mb-4">
                            用于提升语义建议准确性，仅作为辅助信号，不影响语义裁决
                        </p>

                        {/* 辅助检测开关 */}
                        <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors mb-4">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-slate-700">
                                    启用语义理解辅助检测 <span className="text-blue-600">(推荐)</span>
                                </div>
                                {!enabled && (
                                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <AlertTriangle size={12} />
                                        关闭后仍可生成语义建议，但置信度可能降低
                                    </div>
                                )}
                            </div>
                        </label>

                        {enabled && (
                            <>
                                {/* 检测模板（只读） */}
                                <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4">
                                    <div className="text-xs text-slate-500 mb-1">检测模板</div>
                                    <div className="text-sm font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">
                                        SEMANTIC_MIN
                                    </div>
                                </div>

                                {/* 采样比例 */}
                                <div>
                                    <div className="text-sm font-medium text-slate-700 mb-2">数据采样比例</div>
                                    <div className="flex gap-3">
                                        {([0.5, 1, 5] as const).map((ratio) => (
                                            <label
                                                key={ratio}
                                                className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-all ${sampleRatio === ratio
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="sampleRatio"
                                                    className="sr-only"
                                                    checked={sampleRatio === ratio}
                                                    onChange={() => setSampleRatio(ratio)}
                                                />
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-slate-800">{ratio}%</div>
                                                    {ratio === 1 && (
                                                        <div className="text-xs text-blue-600 mt-0.5">推荐</div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 执行说明 */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                            <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-sm font-medium text-blue-900 mb-2">执行说明</div>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• 本次操作仅生成语义建议，不自动生效</li>
                                    <li>• 语义裁决仍需人工确认</li>
                                    <li>• 执行过程中不会影响现有语义版本</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleStart}
                        disabled={selectedTables.length === 0}
                        className={`px-6 py-2 text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 ${selectedTables.length > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <CheckCircle size={16} />
                        开始理解
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SemanticAssistBatchModal;
