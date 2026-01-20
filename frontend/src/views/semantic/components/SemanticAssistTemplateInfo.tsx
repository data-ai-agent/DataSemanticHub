import React from 'react';
import { SemanticAssistTemplate, SEMANTIC_MIN_SIGNALS } from '../../../types/semanticAssist';
import { X, Info, FileText, AlertCircle } from 'lucide-react';

interface SemanticAssistTemplateInfoProps {
    template: SemanticAssistTemplate;
    open: boolean;
    onClose: () => void;
}

/**
 * 语义理解辅助检测 - 模板说明抽屉
 * 
 * 内容规范（只读）：
 * - 模板定位说明
 * - 包含的信号维度（不是规则）
 * - 风险提示机制说明
 * 
 * 禁止行为：
 * - ❌ 不允许任何配置项
 * - ❌ 不出现"规则 / 校验 / 通过失败"
 */
export const SemanticAssistTemplateInfo: React.FC<SemanticAssistTemplateInfoProps> = ({
    template,
    open,
    onClose,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-[480px] bg-white shadow-2xl h-full overflow-hidden flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">模板说明</h3>
                            <div className="text-sm font-mono text-slate-500">{template}</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 模板定位 */}
                    <section>
                        <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Info size={14} className="text-blue-600" />
                            模板定位
                        </h4>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <p className="text-sm text-blue-800 leading-relaxed">
                                <strong>SEMANTIC_MIN</strong> 是语义理解阶段的轻量级辅助模板，
                                通过数据采样分析为语义建议提供<strong>证据与风险提示</strong>，
                                帮助提高字段角色识别和术语映射的准确性。
                            </p>
                        </div>
                    </section>

                    {/* 信号维度 */}
                    <section>
                        <h4 className="text-sm font-semibold text-slate-800 mb-3">包含的信号维度</h4>
                        <div className="space-y-2">
                            {SEMANTIC_MIN_SIGNALS.map((signal, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                                >
                                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-700">{signal.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{signal.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 风险提示机制 */}
                    <section>
                        <h4 className="text-sm font-semibold text-slate-800 mb-3">风险提示机制</h4>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-2">
                            <p className="text-sm text-amber-800">
                                当检测到以下情况时，会在语义建议中标注风险提示：
                            </p>
                            <ul className="text-sm text-amber-700 space-y-1 pl-4">
                                <li>• 字段唯一性与角色建议不匹配</li>
                                <li>• 空值率过高影响数据可用性</li>
                                <li>• 疑似敏感信息需关注合规</li>
                            </ul>
                        </div>
                    </section>

                    {/* 重要说明 */}
                    <section>
                        <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <AlertCircle size={14} className="text-slate-500" />
                            重要说明
                        </h4>
                        <div className="bg-slate-100 rounded-lg p-4">
                            <ul className="text-sm text-slate-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span>
                                    <span>模板内容<strong className="text-slate-700">不可编辑</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span>
                                    <span><strong className="text-slate-700">不配置阈值</strong>，仅提供辅助信号</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span>
                                    <span><strong className="text-slate-700">不影响质量模块</strong>，独立于数据治理流程</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span>
                                    <span><strong className="text-slate-700">不产生通过/失败</strong>结论</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span>
                                    <span><strong className="text-slate-700">不影响语义裁决</strong>与版本生效</span>
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SemanticAssistTemplateInfo;
