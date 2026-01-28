import React from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';

interface TemplateExplanationDrawerProps {
    open: boolean;
    onClose: () => void;
    runSnapshot?: {
        template?: string;
        sampleRatio?: number;
        forceRecompute?: boolean;
    };
}

export const TemplateExplanationDrawer: React.FC<TemplateExplanationDrawerProps> = ({
    open,
    onClose,
    runSnapshot
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] animate-fade-in"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-[520px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-bold text-slate-800">语义理解辅助模板</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                SEMANTIC_MIN
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                                默认模板 · v2.4
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

                    {/* 1. Info Card */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            SEMANTIC_MIN 是语义理解阶段的默认辅助模板，用于为语义建议提供数据分布与一致性信号。
                        </p>
                        <div className="space-y-2">
                            {[
                                '仅作为语义理解辅助信号',
                                '不产生质量通过/失败结论',
                                '不影响语义裁决与语义版本生效'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. 字段一致性信号 */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-500 rounded-full" />
                            字段一致性信号
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 w-1/3">信号名称</th>
                                        <th className="px-4 py-3 w-1/3">含义</th>
                                        <th className="px-4 py-3 w-1/3">语义用途</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        { name: '空值比例', desc: '字段中空值占比', purpose: '判断字段是否稳定' },
                                        { name: '去重比例', desc: '不同值占比', purpose: '判断是否可能为 ID' },
                                        { name: '类型可解析率', desc: '可被目标类型解析的比例', purpose: '判断时间 / 数值字段' }
                                    ].map((row, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.desc}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.purpose}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="bg-slate-50 px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
                                以上信号优先复用已有质量检测结果，不会重复执行质量规则
                            </div>
                        </div>
                    </section>

                    {/* 3. 字段分布信号 */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-indigo-500 rounded-full" />
                            字段分布信号
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 w-1/3">信号名称</th>
                                        <th className="px-4 py-3 w-1/3">含义</th>
                                        <th className="px-4 py-3 w-1/3">语义用途</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        { name: '常见值分布', desc: '字段最常见的 Top 值', purpose: '判断状态 / 枚举字段' },
                                        { name: '值集中度', desc: '常见值占比', purpose: '判断状态是否稳定' }
                                    ].map((row, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.desc}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.purpose}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2 text-xs text-slate-500 px-1">
                            该类信号通常不包含在质量检测中，仅用于语义理解
                        </div>
                    </section>

                    {/* 3. 范围与异常提示 */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-emerald-500 rounded-full" />
                            范围与异常提示
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 w-1/2">信号名称</th>
                                        <th className="px-4 py-3 w-1/2">含义</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        { name: '数值 / 时间范围', desc: '判断字段是否符合时间或数值语义' },
                                        { name: '异常时间提示', desc: '未来时间 / 极端时间值' }
                                    ].map((row, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 4. 风险提示机制 */}
                    <section className="bg-amber-50/50 rounded-xl p-5 border border-amber-100/50">
                        <div className="flex gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-2">风险提示如何使用？</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                                    模板中部分信号会生成风险提示（Risk Flags），用于提醒语义建议可能存在不稳定或歧义。
                                </p>
                                <ul className="space-y-1 mb-4">
                                    {[
                                        '风险提示仅用于解释与提醒',
                                        '不等同于数据质量问题',
                                        '不会阻止语义理解流程'
                                    ].map((item, i) => (
                                        <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex flex-wrap gap-2 opacity-70">
                                    {['HIGH_NULL', 'LOW_UNIQUENESS', 'ENUM_NOT_STABLE'].map(tag => (
                                        <span key={tag} className="text-[10px] font-mono bg-white border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 5. 模板使用说明 */}
                    <div className="bg-slate-100 rounded-lg p-4 text-xs text-slate-500">
                        <div className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Info size={14} />
                            当前模板内容为平台内置默认能力：
                        </div>
                        <ul className="space-y-1 ml-6 list-disc">
                            <li>不支持编辑或删除信号</li>
                            <li>不支持调整阈值或规则</li>
                            <li>不影响数据质量模块中的任何规则配置</li>
                        </ul>
                    </div>

                    {runSnapshot && (
                        <div className="bg-blue-50 rounded-lg p-4 text-xs text-slate-600 border border-blue-100">
                            <div className="font-semibold text-slate-700 mb-2">本次批量任务中：</div>
                            <ul className="space-y-1 ml-6 list-disc">
                                <li>使用模板：{runSnapshot.template || 'SEMANTIC_MIN'}</li>
                                {typeof runSnapshot.sampleRatio === 'number' && (
                                    <li>采样比例：{runSnapshot.sampleRatio}%</li>
                                )}
                                <li>不强制重算</li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                    >
                        我知道了
                    </button>
                </div>
            </div>
        </div>
    );
};
