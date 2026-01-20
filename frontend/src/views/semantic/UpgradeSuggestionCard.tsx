import React, { useState } from 'react';
import { Lightbulb, Eye, Check, X, Clock, ChevronDown } from 'lucide-react';
import { UpgradePreviewModal } from './UpgradePreviewModal';

interface UpgradeSuggestion {
    type: 'object_type_upgrade' | 'field_mapping' | 'relationship';
    title: string;
    reason: string;
    beforeState: any;
    afterState: any;
    confidence: number;
}

interface UpgradeSuggestionCardProps {
    suggestion: UpgradeSuggestion;
    onAccept: () => void;
    onReject: (reason: string) => void;
    onLater: () => void;
}

export const UpgradeSuggestionCard: React.FC<UpgradeSuggestionCardProps> = ({
    suggestion,
    onAccept,
    onReject,
    onLater
}) => {
    const [showPreview, setShowPreview] = useState(false);
    const [showRejectReasons, setShowRejectReasons] = useState(false);

    const rejectReasons = [
        'AI 识别错误',
        '暂不需要此升级',
        '表用途已明确',
        '其他原因'
    ];

    const handleReject = (reason: string) => {
        onReject(reason);
        setShowRejectReasons(false);
    };

    return (
        <>
            <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-4 shadow-sm">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Lightbulb size={20} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800">💡 {suggestion.title}</h3>
                        <p className="text-sm text-slate-600 mt-1 italic">
                            AI 依据：{suggestion.reason}
                        </p>
                    </div>
                    <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">
                        准确度 {(suggestion.confidence * 100).toFixed(0)}%
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Eye size={14} />
                        👓 预览变更
                    </button>

                    <button
                        onClick={onAccept}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Check size={14} />
                        ✅ 接受建议
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowRejectReasons(!showRejectReasons)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <X size={14} />
                            ❌ 拒绝
                        </button>

                        {/* Reject Reasons Dropdown */}
                        {showRejectReasons && (
                            <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 py-2 min-w-[200px] z-10">
                                <div className="px-3 py-1 text-xs text-slate-500 font-medium border-b border-slate-100 mb-1">
                                    选择拒绝理由
                                </div>
                                {rejectReasons.map((reason, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleReject(reason)}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onLater}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        <Clock size={14} />
                        🕒 稍后
                    </button>
                </div>
            </div>

            {/* Preview Modal */}
            <UpgradePreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                suggestion={suggestion}
                onAccept={onAccept}
            />
        </>
    );
};

// Helper function to generate upgrade suggestions based on profile
export function generateUpgradeSuggestion(profile: any): UpgradeSuggestion | null {
    // Example: Suggest upgrading from Entity to Event if conditions met
    if (profile.objectType === 'entity') {
        const hasTimeFields = profile.fields?.some((f: any) =>
            f.role === 'Time' || f.fieldName?.includes('time') || f.fieldName?.includes('created')
        );

        if (hasTimeFields && profile.aiScore < 0.8) {
            return {
                type: 'object_type_upgrade',
                title: '将此表升级为逻辑「行为对象」',
                reason: '检测到此表包含时间序列和不可变数据特征',
                beforeState: {
                    objectType: '主体 (Entity)',
                    businessDomain: profile.businessDomain || '用户域'
                },
                afterState: {
                    objectType: '行为 (Event)',
                    businessDomain: profile.businessDomain || '交易域',
                    partitionStrategy: '按时间分区'
                },
                confidence: 0.75
            };
        }
    }

    // Example: Suggest field mapping optimization
    if (profile.fieldScore && profile.fieldScore < 0.6) {
        return {
            type: 'field_mapping',
            title: '优化字段语义映射',
            reason: '部分字段的语义角色识别置信度较低',
            beforeState: {
                fieldScore: profile.fieldScore.toFixed(2),
                identifiedFields: `${Math.round(profile.fieldScore * 10)}/10`
            },
            afterState: {
                fieldScore: (profile.fieldScore + 0.2).toFixed(2),
                identifiedFields: '10/10',
                improvement: '补充字段注释和命名优化'
            },
            confidence: 0.68
        };
    }

    return null;
}
