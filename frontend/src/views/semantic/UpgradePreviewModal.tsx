import React, { useState } from 'react';
import { Lightbulb, Eye, Check, X, Clock, ChevronDown } from 'lucide-react';

interface UpgradeSuggestion {
    type: 'object_type_upgrade' | 'field_mapping' | 'relationship';
    title: string;
    reason: string;
    beforeState: any;
    afterState: any;
    confidence: number;
}

interface UpgradePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestion: UpgradeSuggestion;
    onAccept: () => void;
}

export const UpgradePreviewModal: React.FC<UpgradePreviewModalProps> = ({
    isOpen,
    onClose,
    suggestion,
    onAccept
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Eye size={20} className="text-blue-600" />
                        升级预览 - Before/After 对比
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">{suggestion.title}</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Before State */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <X size={16} className="text-red-600" />
                                </div>
                                <h3 className="font-bold text-red-700">升级前</h3>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                                {Object.entries(suggestion.beforeState).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                        <span className="text-slate-600">{formatKey(key)}:</span>
                                        <span className="font-medium text-slate-800">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* After State */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <Check size={16} className="text-green-600" />
                                </div>
                                <h3 className="font-bold text-green-700">升级后</h3>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                                {Object.entries(suggestion.afterState).map(([key, value]) => {
                                    const isNew = !suggestion.beforeState.hasOwnProperty(key);
                                    const isChanged = suggestion.beforeState[key] !== value;

                                    return (
                                        <div key={key} className={`flex justify-between text-sm ${isNew || isChanged ? 'bg-green-100 -mx-2 px-2 py-1 rounded' : ''}`}>
                                            <span className="text-slate-600">
                                                {isNew && '+ '}
                                                {formatKey(key)}:
                                            </span>
                                            <span className={`font-medium ${isNew || isChanged ? 'text-green-700' : 'text-slate-800'}`}>
                                                {String(value)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Benefits */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="text-xs font-medium text-blue-700 mb-2">✨ 预期收益</div>
                                <ul className="text-xs text-blue-600 space-y-1">
                                    <li>• 语义清晰度提升</li>
                                    <li>• 更好的数据治理实践</li>
                                    <li>• AI 识别准确度提高</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* AI Confidence */}
                    <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">AI 置信度</span>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${suggestion.confidence >= 0.8 ? 'bg-green-500' :
                                                suggestion.confidence >= 0.6 ? 'bg-amber-500' :
                                                    'bg-red-500'
                                            }`}
                                        style={{ width: `${suggestion.confidence * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                    {(suggestion.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => {
                            onAccept();
                            onClose();
                        }}
                        className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <Check size={16} />
                        接受升级
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper function to format keys
function formatKey(key: string): string {
    const keyMap: Record<string, string> = {
        objectType: '对象类型',
        businessDomain: '业务域',
        dataLayer: '数据层',
        tableType: '表类型',
        partitionStrategy: '分区策略'
    };
    return keyMap[key] || key;
}
