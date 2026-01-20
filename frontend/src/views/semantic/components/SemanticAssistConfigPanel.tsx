import React from 'react';
import {
    SemanticAssist,
    SemanticAssistRuntimeConfig,
    SEMANTIC_MIN_SIGNALS
} from '../../../types/semanticAssist';
import { X, Info } from 'lucide-react';

interface SemanticAssistConfigPanelProps {
    assist: SemanticAssist;
    onApply: (runtimeConfig: SemanticAssistRuntimeConfig) => void;
    onClose: () => void;
    /** 是否以弹窗形式展示 */
    asModal?: boolean;
}

/**
 * 语义理解辅助检测 - 设置面板
 * 
 * 用于详情页和批量弹窗的共用设置组件
 * 
 * 约束：
 * - 不允许编辑 template
 * - 不允许编辑 maxRows / ttl
 * - 只允许：sampleRatio, forceRecompute
 */
export const SemanticAssistConfigPanel: React.FC<SemanticAssistConfigPanelProps> = ({
    assist,
    onApply,
    onClose,
    asModal = false,
}) => {
    const [sampleRatio, setSampleRatio] = React.useState<0.5 | 1 | 5>(
        assist.runtimeConfig.sampleRatio
    );
    const [forceRecompute, setForceRecompute] = React.useState(
        assist.runtimeConfig.forceRecompute ?? false
    );

    const handleApply = () => {
        onApply({
            sampleRatio,
            forceRecompute,
        });
    };

    const content = (
        <div className="space-y-5">
            {/* 模板信息（只读） */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-slate-700">检测模板</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                        {assist.template}
                    </span>
                    <span className="text-xs text-slate-400">（不可编辑）</span>
                </div>
                <div className="text-xs text-slate-500">
                    用于提升语义建议准确性，仅作为辅助信号，不影响语义裁决
                </div>
            </div>

            {/* 采样比例 */}
            <div>
                <div className="text-sm font-medium text-slate-700 mb-3">数据采样比例</div>
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

            {/* 强制重新计算 */}
            <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 transition-colors">
                <input
                    type="checkbox"
                    checked={forceRecompute}
                    onChange={(e) => setForceRecompute(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700">
                        强制重新计算
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        若已存在未过期的检测结果（{assist.systemConfig.ttlHours}h 有效期），将直接复用
                    </div>
                </div>
            </label>

            {/* 系统配置（只读展示） */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                    <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-700 space-y-1">
                        <div>最大采样行数：{assist.systemConfig.maxRows.toLocaleString()} 行</div>
                        <div>缓存有效期：{assist.systemConfig.ttlHours} 小时</div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (asModal) {
        return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-800">运行参数配置</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-5">
                        {content}
                    </div>
                    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            应用
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return content;
};

export default SemanticAssistConfigPanel;
