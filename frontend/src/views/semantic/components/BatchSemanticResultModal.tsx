import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Briefcase, ChevronDown, ChevronRight } from 'lucide-react';

interface BatchSemanticResult {
    success: number;
    partialSuccess: number;
    failed: number;
    details: Array<{
        table: string;
        status: 'success' | 'partial' | 'failed';
        failedFields?: number;
        failedFieldNames?: string[];  // P1 Enhancement: detailed field list
        reason?: string;
    }>;
}

interface BatchSemanticResultModalProps {
    open: boolean;
    result: BatchSemanticResult;
    onViewWorkbench: () => void;
    onBackToList: () => void;
    onViewTableDetail?: (tableId: string, mode: 'BROWSE' | 'SEMANTIC') => void;  // P1 Enhancement
}

export const BatchSemanticResultModal: React.FC<BatchSemanticResultModalProps> = ({
    open,
    result,
    onViewWorkbench,
    onBackToList,
    onViewTableDetail
}) => {
    const [expandedTables, setExpandedTables] = useState<string[]>([]);

    if (!open) return null;

    const hasIssues = result.partialSuccess > 0 || result.failed > 0;
    const issueDetails = result.details.filter(d => d.status !== 'success');

    const toggleExpand = (table: string) => {
        setExpandedTables(prev =>
            prev.includes(table)
                ? prev.filter(t => t !== table)
                : [...prev, table]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">批量生成完成</h2>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 结果概览 */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* 成功 */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-emerald-600">{result.success}</div>
                            <div className="text-sm text-emerald-700 mt-1">成功</div>
                        </div>

                        {/* 部分成功 */}
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-amber-600">{result.partialSuccess}</div>
                            <div className="text-sm text-amber-700 mt-1">部分成功</div>
                        </div>

                        {/* 失败 */}
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-red-600">{result.failed}</div>
                            <div className="text-sm text-red-700 mt-1">失败</div>
                        </div>
                    </div>

                    {/* 失败/警告明细 - Enhanced with expandable details */}
                    {hasIssues && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start gap-2 mb-3">
                                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                <div className="text-sm font-medium text-amber-900">
                                    以下表部分字段生成失败或存在问题（点击展开查看详情）
                                </div>
                            </div>
                            <div className="space-y-2">
                                {issueDetails.map((detail, idx) => {
                                    const isExpanded = expandedTables.includes(detail.table);

                                    return (
                                        <div
                                            key={idx}
                                            className="bg-white border border-amber-100 rounded-lg overflow-hidden"
                                        >
                                            {/* Header - Clickable to expand */}
                                            <div
                                                onClick={() => toggleExpand(detail.table)}
                                                className="p-3 cursor-pointer hover:bg-amber-50/50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        {detail.status === 'partial' ? (
                                                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                                        ) : (
                                                            <XCircle size={14} className="text-red-500 shrink-0" />
                                                        )}
                                                        <span className="font-mono font-medium text-slate-700">
                                                            {detail.table}
                                                        </span>
                                                        {detail.failedFields && (
                                                            <span className="text-xs text-slate-500">
                                                                ({detail.failedFields} 个字段失败)
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronDown size={16} className="text-slate-400" />
                                                    ) : (
                                                        <ChevronRight size={16} className="text-slate-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="px-3 pb-3 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {/* Failed Fields List */}
                                                    {detail.failedFieldNames && detail.failedFieldNames.length > 0 && (
                                                        <div className="bg-slate-50 rounded-lg p-3">
                                                            <div className="text-xs font-medium text-slate-600 mb-2">
                                                                失败字段列表：
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {detail.failedFieldNames.map((field, fieldIdx) => (
                                                                    <span
                                                                        key={fieldIdx}
                                                                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700"
                                                                    >
                                                                        {field}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Failure Reason */}
                                                    {detail.reason && (
                                                        <div className="text-xs text-slate-600">
                                                            <span className="font-medium">失败原因：</span>
                                                            {detail.reason}
                                                        </div>
                                                    )}

                                                    {/* Action Button - Navigate to table */}
                                                    {onViewTableDetail && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onViewTableDetail(detail.table, 'SEMANTIC');
                                                            }}
                                                            className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                                                        >
                                                            <ArrowRight size={12} />
                                                            进入语义理解模式处理
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 下一步引导 */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="text-sm font-medium text-blue-900 mb-3">你可以：</div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={onViewWorkbench}
                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-between group"
                            >
                                <span>查看字段语义理解工作台</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={onBackToList}
                                className="w-full px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                返回逻辑视图列表
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
