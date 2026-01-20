import { ShieldCheck, CheckCircle, X, AlertCircle } from 'lucide-react';
import React from 'react';

interface RuleItem {
    code: string;
    name: string;
    status: 'pass' | 'fail' | 'pending';
    value?: string;
}

interface DimensionPanelProps {
    title: string;
    score: number;
    icon: React.ReactNode;
    rules: RuleItem[];
    gateResult?: 'PASS' | 'REJECT' | 'REVIEW';
    gateMessage?: string;
    colorClass: string; // e.g., 'blue', 'orange'
}

export const DimensionPanel: React.FC<DimensionPanelProps> = ({
    title,
    score,
    icon,
    rules,
    gateResult,
    gateMessage,
    colorClass
}) => {
    // Dynamic color classes based on the prop
    const bgLight = `bg-${colorClass}-50`;
    const textDark = `text-${colorClass}-700`;
    const borderLight = `border-${colorClass}-100`;

    // For tailwind compilation (whitelist these or use style object if dynamic classes fail)
    // Here using explicit map for safety as Tailwind might purge dynamic classes
    const colors: Record<string, { bg: string, text: string, border: string }> = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    };

    const theme = colors[colorClass] || colors.blue;

    return (
        <div className={`p-4 rounded-xl border ${theme.border} ${theme.bg} h-full flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className={`font-bold ${theme.text}`}>{title}</h3>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold text-slate-800">{score.toFixed(2)}</span>
                    <span className="text-xs text-slate-500">维度置信度</span>
                </div>
            </div>

            {/* Rules List */}
            <div className="space-y-3 flex-1">
                {rules.map((rule) => (
                    <div key={rule.code} className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between shadow-sm">
                        <div>
                            <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                {rule.code}
                                {rule.value && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 ml-1">{rule.value}</span>}
                            </div>
                            <div className="text-sm font-medium text-slate-700">{rule.name}</div>
                        </div>
                        {rule.status === 'pass' && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
                        {rule.status === 'fail' && <X size={16} className="text-red-500 shrink-0" />}
                        {rule.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin shrink-0" />}
                    </div>
                ))}
            </div>

            {/* Gate Result Message */}
            {gateResult && gateResult !== 'PASS' && (
                <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${gateResult === 'REJECT' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{gateMessage || '存在风险，需人工复核'}</span>
                </div>
            )}
        </div>
    );
};
