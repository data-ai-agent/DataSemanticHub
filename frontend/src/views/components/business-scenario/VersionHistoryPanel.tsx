import React, { useState } from 'react';
import { History, Clock, RotateCcw, Eye, X, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import { ModelVersion } from '../../../types/scene-model';

interface VersionHistoryPanelProps {
    versions: ModelVersion[];
    currentVersionId?: string;
    onPreview: (version: ModelVersion) => void;
    onRollback: (version: ModelVersion) => void;
    onClose: () => void;
}

// Helper to format relative time
const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
};

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
    versions,
    currentVersionId,
    onPreview,
    onRollback,
    onClose
}) => {
    const [confirmingRollback, setConfirmingRollback] = useState<string | null>(null);

    const handleRollbackClick = (version: ModelVersion) => {
        setConfirmingRollback(version.version_id);
    };

    const confirmRollback = (version: ModelVersion) => {
        onRollback(version);
        setConfirmingRollback(null);
    };

    const cancelRollback = () => {
        setConfirmingRollback(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-indigo-600" />
                        <h2 className="text-sm font-bold text-slate-800">版本历史</h2>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            {versions.length} 个版本
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                {/* Version List */}
                <div className="flex-1 overflow-y-auto p-3">
                    {versions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <History size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">暂无发布的版本</p>
                            <p className="text-xs mt-1">点击"发布模型"创建第一个版本</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((version, index) => {
                                const isLatest = index === 0;
                                const isCurrent = version.version_id === currentVersionId;
                                const isConfirming = confirmingRollback === version.version_id;

                                return (
                                    <div
                                        key={version.version_id}
                                        className={`p-3 rounded-lg border transition-all ${isCurrent
                                                ? 'bg-indigo-50 border-indigo-200'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-2">
                                                {/* Timeline dot */}
                                                <div className="mt-1">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${isLatest ? 'bg-green-500' : 'bg-slate-300'
                                                        }`} />
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-800">
                                                            {version.version}
                                                        </span>
                                                        {isLatest && (
                                                            <span className="text-[9px] px-1 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                                                                最新
                                                            </span>
                                                        )}
                                                        {isCurrent && (
                                                            <span className="text-[9px] px-1 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                                                                当前
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                                                        <Clock size={10} />
                                                        <span>{formatRelativeTime(version.created_at)}</span>
                                                        <span className="text-slate-300">·</span>
                                                        <span>{new Date(version.created_at).toLocaleString('zh-CN')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onPreview(version)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                                    title="预览此版本"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {!isCurrent && (
                                                    <button
                                                        onClick={() => handleRollbackClick(version)}
                                                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                                                        title="回滚到此版本"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rollback Confirmation */}
                                        {isConfirming && (
                                            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-amber-800 font-medium">
                                                            确认回滚到 {version.version}？
                                                        </p>
                                                        <p className="text-[10px] text-amber-700 mt-0.5">
                                                            当前未保存的修改将被覆盖
                                                        </p>
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => confirmRollback(version)}
                                                                className="px-2 py-1 text-[10px] bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center gap-1"
                                                            >
                                                                <Check size={10} /> 确认回滚
                                                            </button>
                                                            <button
                                                                onClick={cancelRollback}
                                                                className="px-2 py-1 text-[10px] bg-white text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
                                                            >
                                                                取消
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ChevronRight size={10} />
                        版本在发布时自动创建，回滚后可重新发布生成新版本
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VersionHistoryPanel;
