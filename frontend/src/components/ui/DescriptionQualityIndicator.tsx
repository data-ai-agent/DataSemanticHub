import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Info, Lightbulb, Zap } from 'lucide-react';

interface DescriptionQualityIndicatorProps {
    description: string;
    className?: string;
}

interface QualityCheck {
    key: string;
    label: string;
    passed: boolean;
    suggestion?: string;
}

const DescriptionQualityIndicator: React.FC<DescriptionQualityIndicatorProps> = ({
    description,
    className = ''
}) => {
    const analysis = useMemo(() => {
        const text = description || '';
        const charCount = text.length;

        // Quality checks
        const checks: QualityCheck[] = [
            {
                key: 'length',
                label: '描述长度',
                passed: charCount >= 50,
                suggestion: charCount < 50 ? '建议至少 50 字，当前描述较简略' : undefined
            },
            {
                key: 'role',
                label: '参与角色',
                passed: /[申请人|用户|客户|管理员|审核|审批|工作人员|部门|系统]/.test(text),
                suggestion: '建议补充：谁来操作？如"申请人"、"审批人"'
            },
            {
                key: 'action',
                label: '操作步骤',
                passed: /[提交|申请|审核|审批|通知|确认|处理|分配|发送|录入]/.test(text),
                suggestion: '建议补充：做什么操作？如"提交申请"、"审核材料"'
            },
            {
                key: 'material',
                label: '材料数据',
                passed: /[材料|证明|文件|信息|数据|身份证|营业执照|核验]/.test(text),
                suggestion: '建议补充：需要哪些材料或数据？'
            },
            {
                key: 'state',
                label: '状态变化',
                passed: /[通过|拒绝|完成|结束|成功|失败|待|已|中|不通过]/.test(text),
                suggestion: '建议补充：有哪些状态？如"审核通过"、"待补正"'
            }
        ];

        const passedCount = checks.filter(c => c.passed).length;
        const score = Math.round((passedCount / checks.length) * 100);

        // Determine quality level
        let level: 'excellent' | 'good' | 'fair' | 'poor';
        if (score >= 80) level = 'excellent';
        else if (score >= 60) level = 'good';
        else if (score >= 40) level = 'fair';
        else level = 'poor';

        return { checks, passedCount, score, level, charCount };
    }, [description]);

    if (!description || description.length < 10) {
        return null;
    }

    const levelConfig = {
        excellent: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, label: '描述完善' },
        good: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, label: '描述良好' },
        fair: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Lightbulb, label: '可以补充' },
        poor: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, label: '描述不足' }
    };

    const config = levelConfig[analysis.level];
    const Icon = config.icon;

    const failedChecks = analysis.checks.filter(c => !c.passed);

    return (
        <div className={`${config.bg} ${config.border} border rounded-lg p-3 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon size={16} className={config.color} />
                    <span className={`text-sm font-medium ${config.color}`}>
                        {config.label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                        {analysis.charCount} 字
                    </span>
                    <span className={`text-xs font-semibold ${config.color}`}>
                        {analysis.score}%
                    </span>
                </div>
            </div>

            {/* Quality indicators */}
            <div className="flex gap-1 mb-2">
                {analysis.checks.map(check => (
                    <div
                        key={check.key}
                        className={`flex-1 h-1.5 rounded-full ${check.passed ? 'bg-emerald-400' : 'bg-slate-200'}`}
                        title={check.label}
                    />
                ))}
            </div>

            {/* Suggestions for failed checks */}
            {failedChecks.length > 0 && analysis.level !== 'excellent' && (
                <div className="space-y-1 mt-2">
                    {failedChecks.slice(0, 2).map(check => (
                        <div key={check.key} className="flex items-start gap-1.5 text-[10px] text-slate-600">
                            <Zap size={10} className="mt-0.5 text-amber-500 flex-shrink-0" />
                            <span>{check.suggestion}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DescriptionQualityIndicator;
