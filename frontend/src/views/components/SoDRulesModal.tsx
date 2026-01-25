import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

type SoDRule = {
    id: string;
    name: string;
    conflictingActions: string[];
    riskLevel: '高' | '中' | '低';
    description: string;
};

const rules: SoDRule[] = [
    {
        id: 'sod_001',
        name: '审批与执行分离',
        conflictingActions: ['审批发布', '直接发布'],
        riskLevel: '高',
        description: '避免同一角色同时具备审批与执行权限。'
    },
    {
        id: 'sod_002',
        name: '安全策略双人复核',
        conflictingActions: ['策略变更', '策略发布'],
        riskLevel: '中',
        description: '数据安全策略变更需双人复核。'
    },
    {
        id: 'sod_003',
        name: '日志导出与删除分离',
        conflictingActions: ['日志导出', '日志清理'],
        riskLevel: '低',
        description: '避免导出与清理权限集中。'
    }
];

const riskStyles: Record<SoDRule['riskLevel'], string> = {
    高: 'bg-rose-100 text-rose-700',
    中: 'bg-amber-100 text-amber-700',
    低: 'bg-emerald-100 text-emerald-700'
};

interface SoDRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SoDRulesModal: React.FC<SoDRulesModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" size={18} />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">SoD 规则配置</h3>
                            <p className="text-xs text-slate-500">用于识别互斥权限组合，降低合规风险。</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-3">
                    {rules.map((rule) => (
                        <div key={rule.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">{rule.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">{rule.description}</div>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${riskStyles[rule.riskLevel]}`}>
                                    {rule.riskLevel}风险
                                </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {rule.conflictingActions.map((action) => (
                                    <span
                                        key={action}
                                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                                    >
                                        {action}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SoDRulesModal;
