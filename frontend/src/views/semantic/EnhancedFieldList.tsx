import React from 'react';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';

interface EnhancedFieldRowProps {
    field: any;
    index: number;
}

// Quality issue detection logic
interface QualityIssue {
    hasIssue: boolean;
    message?: string;
    severity?: 'warning' | 'error';
}

function detectQualityIssue(field: any, roleLabel: string): QualityIssue {
    // Mock quality metrics (in real app, these would come from field analysis)
    const nullRate = ((field.fieldName || field.name || "").includes('name') ? 39 :
        ((field.fieldName || field.name || "").includes('created') ? 0 :
            Math.random() * 10;

    const uniqueness = ((field.fieldName || field.name || "").includes('id') ? 100 :
        ((field.fieldName || field.name || "").includes('name') ? 78 :
            Math.random() * 100;

    // Rule 1: Identifiers/PKs must have zero nulls and 100% uniqueness
    if (roleLabel === '标识符' || field.key === 'PK') {
        if (nullRate > 0) {
            return {
                hasIssue: true,
                message: `空值${nullRate.toFixed(0)}%`,
                severity: 'error'
            };
        }
        if (uniqueness < 100) {
            return {
                hasIssue: true,
                message: `唯一度${uniqueness.toFixed(0)}%`,
                severity: 'error'
            };
        }
    }

    // Rule 2: Time fields should have low null rate
    if (roleLabel === '时间') {
        if (nullRate > 30) {
            return {
                hasIssue: true,
                message: `空值${nullRate.toFixed(0)}%`,
                severity: 'warning'
            };
        }
    }

    // Rule 3: Foreign keys should have good referential integrity
    if (field.key === 'FK') {
        if (nullRate > 20) {
            return {
                hasIssue: true,
                message: `完整性${(100 - nullRate).toFixed(0)}%`,
                severity: 'warning'
            };
        }
    }

    // No issue detected
    return { hasIssue: false };
}

export const EnhancedFieldRow: React.FC<EnhancedFieldRowProps> = ({ field, index }) => {
    // Determine field role and security level
    const isSensitive = ((field.fieldName || field.name || "").includes('phone') || ((field.fieldName || field.name || "").includes('mobile') ||
        ((field.fieldName || field.name || "").includes('id_card') || ((field.fieldName || field.name || "").includes('name') ||
        ((field.fieldName || field.name || "").includes('email') || ((field.fieldName || field.name || "").includes('address');
    const securityLevel = isSensitive ? (Math.random() > 0.5 ? 'L3' : 'L2') : 'L1';

    const roleInfo = ((field.fieldName || field.name || "").includes('id') ? { label: '标识符', color: 'purple' } :
        ((field.fieldName || field.name || "").includes('time') || ((field.fieldName || field.name || "").includes('date') || ((field.fieldName || field.name || "").includes('created') ? { label: '时间', color: 'blue' } :
            ((field.fieldName || field.name || "").includes('status') || ((field.fieldName || field.name || "").includes('state') ? { label: '状态', color: 'amber' } :
                { label: '业务属性', color: 'slate' };

    // Detect quality issues based on role
    const qualityCheck = detectQualityIssue(field, roleInfo.label);

    return (
        <tr className="hover:bg-white transition-colors">
            <td className="px-2 py-1.5 font-mono text-sm text-blue-600">{field.name}</td>
            <td className="px-2 py-1.5 text-xs text-slate-500">{field.type}</td>
            <td className="px-2 py-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium
                    bg-${roleInfo.color}-100 text-${roleInfo.color}-700`}>
                    {roleInfo.label}
                </span>
            </td>
            <td className="px-2 py-1.5">
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium ${securityLevel === 'L3' ? 'bg-red-50 text-red-600 border border-red-200' :
                    securityLevel === 'L2' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                        'bg-slate-100 text-slate-500'
                    }`}>
                    {(securityLevel === 'L2' || securityLevel === 'L3') && <Lock size={10} />}
                    {securityLevel}
                </span>
            </td>

            {/* Quality Warning Column - Exception Driven */}
            <td className="px-2 py-1.5">
                {qualityCheck.hasIssue ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${qualityCheck.severity === 'error'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`} title={`质量问题：${qualityCheck.message}`}>
                        <AlertTriangle size={10} />
                        {qualityCheck.message}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-emerald-600" title="无质量问题">
                        <CheckCircle size={12} />
                    </span>
                )}
            </td>

            <td className="px-2 py-1.5 text-xs text-slate-400 truncate max-w-[150px]">
                {field.comment || '-'}
            </td>
        </tr>
    );
};

interface EnhancedFieldListProps {
    fields: any[];
    maxShow?: number;
}

export const EnhancedFieldList: React.FC<EnhancedFieldListProps> = ({ fields, maxShow = 10 }) => {
    return (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="text-xs font-medium text-slate-600 mb-2 flex items-center justify-between">
                <span>📋 字段详情 ({fields.length}个)</span>
                <span className="text-[10px] text-slate-400">含安全&质量评估</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0">
                        <tr>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">字段名</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">类型</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">语义</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">安全</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">质量</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">说明</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {fields.slice(0, maxShow).map((field, idx) => (
                            <EnhancedFieldRow key={idx} field={field} index={idx} />
                        ))}
                    </tbody>
                </table>
                {fields.length > maxShow && (
                    <div className="text-center text-xs text-slate-400 py-2 bg-slate-50">
                        还有 {fields.length - maxShow} 个字段未显示...
                    </div>
                )}
            </div>
        </div>
    );
};
