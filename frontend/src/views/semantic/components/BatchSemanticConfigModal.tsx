import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Info } from 'lucide-react';

export interface BatchSemanticConfig {
    enableAuxDetection: boolean;
    sampleRatio: 0.5 | 1 | 5;
    forceRecalculate: boolean;
}

interface BatchSemanticConfigModalProps {
    open: boolean;
    selectedTables: string[];
    onClose: () => void;
    onStart: (config: BatchSemanticConfig) => void;
}

export const BatchSemanticConfigModal: React.FC<BatchSemanticConfigModalProps> = ({
    open,
    selectedTables,
    onClose,
    onStart
}) => {
    const [enableAuxDetection, setEnableAuxDetection] = useState(true);
    const [sampleRatio, setSampleRatio] = useState<0.5 | 1 | 5>(1);
    const [forceRecalculate, setForceRecalculate] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    if (!open) return null;

    // 统计逻辑视图/域信息
    const domains = Array.from(new Set(selectedTables.map(t => {
        // 简单模拟，实际应从表数据中获取
        if (t.includes('order')) return '订单域';
        if (t.includes('user') || t.includes('customer')) return '用户域';
        return '其他';
    })));

    const handleStart = () => {
        onStart({
            enableAuxDetection,
            sampleRatio,
            forceRecalculate
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">批量语义理解</h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span>已选表：<span className="font-medium text-blue-600">{selectedTables.length}</span></span>
                            <span className="w-px h-3 bg-slate-300" />
                            <span>逻辑视图：<span className="font-medium text-slate-700">{domains.join(' / ')}</span></span>
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
                    {/* 模块一：语义理解辅助检测 */}
                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                        <h3 className="text-base font-bold text-slate-800 mb-1">语义理解辅助检测</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            用于提升语义建议准确性，仅作为辅助信号，不影响语义裁决
                        </p>

                        {/* 辅助检测开关 */}
                        <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors mb-4">
                            <input
                                type="checkbox"
                                checked={enableAuxDetection}
                                onChange={(e) => setEnableAuxDetection(e.target.checked)}
                                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-slate-700">
                                    启用语义理解辅助检测 <span className="text-blue-600">(推荐)</span>
                                </div>
                                {!enableAuxDetection && (
                                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        关闭后仍可生成语义建议，但置信度可能降低
                                    </div>
                                )}
                            </div>
                        </label>

                        {enableAuxDetection && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* 检测模板 */}
                                <div className="bg-white border border-slate-200 rounded-lg p-3">
                                    <div className="text-xs text-slate-500 mb-1">检测模板</div>
                                    <div className="text-sm font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">
                                        SEMANTIC_MIN
                                    </div>
                                </div>

                                {/* 采样比例 */}
                                <div>
                                    <div className="text-sm font-medium text-slate-700 mb-2">数据采样比例</div>
                                    <div className="flex gap-3">
                                        {[0.5, 1, 5].map((ratio) => (
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
                                                    value={ratio}
                                                    checked={sampleRatio === ratio}
                                                    onChange={() => setSampleRatio(ratio as 0.5 | 1 | 5)}
                                                    className="sr-only"
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
                            </div>
                        )}
                    </div>

                    {/* 模块二：执行说明 */}
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
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
                    >
                        <CheckCircle size={16} />
                        开始生成
                    </button>
                </div>
            </div>
        </div>
    );
};
