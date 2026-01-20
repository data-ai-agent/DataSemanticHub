import React, { useState, useEffect } from 'react';
import {
    History, Clock, CheckCircle, AlertTriangle, Archive,
    ChevronRight, Tag, Database, Layers, RotateCcw,
    Eye, Sparkles, X, Check, GitCompare
} from 'lucide-react';
import { SemanticVersion } from '../../../types/semanticVersion';
import { semanticVersionService } from '../../../services/semantic/semanticVersionService';

interface SemanticVersionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onVersionChange?: () => void;  // 版本变更后的回调
}

// 格式化相对时间
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

const SemanticVersionPanel: React.FC<SemanticVersionPanelProps> = ({
    isOpen,
    onClose,
    onVersionChange
}) => {
    const [versions, setVersions] = useState<SemanticVersion[]>([]);
    const [activeVersion, setActiveVersion] = useState<SemanticVersion | null>(null);
    const [draftVersion, setDraftVersion] = useState<SemanticVersion | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVersion, setSelectedVersion] = useState<SemanticVersion | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'activate' | 'deprecate' | 'rollback'; version: SemanticVersion } | null>(null);

    // 加载版本数据
    useEffect(() => {
        if (isOpen) {
            loadVersions();
        }
    }, [isOpen]);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const [history, active, draft] = await Promise.all([
                semanticVersionService.getVersionHistory(),
                semanticVersionService.getActiveVersion(),
                semanticVersionService.getDraftVersion()
            ]);
            setVersions(history);
            setActiveVersion(active);
            setDraftVersion(draft);
        } catch (error) {
            console.error('Failed to load versions:', error);
        }
        setLoading(false);
    };

    const handleSetActive = async (version: SemanticVersion) => {
        try {
            await semanticVersionService.setActiveVersion(version.version_id);
            await loadVersions();
            onVersionChange?.();
        } catch (error) {
            console.error('Failed to set active version:', error);
        }
        setConfirmAction(null);
    };

    const handleDeprecate = async (version: SemanticVersion) => {
        try {
            await semanticVersionService.deprecateVersion(version.version_id);
            await loadVersions();
        } catch (error) {
            console.error('Failed to deprecate version:', error);
        }
        setConfirmAction(null);
    };

    const handleRollback = async (version: SemanticVersion) => {
        try {
            await semanticVersionService.rollbackToVersion(version.version_id);
            await loadVersions();
            onVersionChange?.();
        } catch (error) {
            console.error('Failed to rollback:', error);
        }
        setConfirmAction(null);
    };

    const getStatusBadge = (version: SemanticVersion) => {
        if (version.is_active) {
            return (
                <span className="px-1.5 py-0.5 text-[9px] font-medium bg-green-100 text-green-700 rounded">
                    Active
                </span>
            );
        }
        switch (version.status) {
            case 'draft':
                return (
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-amber-100 text-amber-700 rounded">
                        草稿
                    </span>
                );
            case 'deprecated':
                return (
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-100 text-slate-500 rounded">
                        已废弃
                    </span>
                );
            default:
                return (
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-blue-100 text-blue-700 rounded">
                        已发布
                    </span>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-indigo-600" />
                        <h2 className="text-sm font-bold text-slate-800">语义版本管理</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                {/* Active Version Summary */}
                {activeVersion && (
                    <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="text-xs font-medium text-green-800">当前活跃版本</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-green-700">{activeVersion.version}</span>
                                <span className="text-[10px] text-green-600">
                                    发布于 {formatRelativeTime(activeVersion.published_at || activeVersion.created_at)}
                                </span>
                            </div>
                        </div>
                        {activeVersion.stats && (
                            <div className="flex gap-4 mt-2 text-[10px] text-green-700">
                                <span className="flex items-center gap-1">
                                    <Database size={10} />
                                    {activeVersion.stats.bo_count} 业务对象
                                </span>
                                <span className="flex items-center gap-1">
                                    <Layers size={10} />
                                    {activeVersion.stats.field_count} 字段
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Draft Version Notice */}
                {draftVersion && (
                    <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-600" />
                            <span className="text-xs text-amber-800">
                                草稿版本 <strong>{draftVersion.version}</strong> 待发布
                            </span>
                        </div>
                        <span className="text-[10px] text-amber-600">
                            {draftVersion.stats?.bo_count || 0} 对象
                        </span>
                    </div>
                )}

                {/* Version List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-400">
                            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                            <p className="text-xs">加载中...</p>
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <History size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">暂无发布的版本</p>
                            <p className="text-xs mt-1">在业务对象建模中发布第一个版本</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((version, index) => (
                                <div
                                    key={version.version_id}
                                    className={`p-3 rounded-lg border transition-all ${version.is_active
                                            ? 'bg-green-50 border-green-200'
                                            : version.status === 'deprecated'
                                                ? 'bg-slate-50 border-slate-200 opacity-60'
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {/* Version Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2">
                                            {/* Timeline Indicator */}
                                            <div className="mt-1 relative">
                                                <div className={`w-2.5 h-2.5 rounded-full ${version.is_active ? 'bg-green-500' :
                                                        version.status === 'deprecated' ? 'bg-slate-300' : 'bg-blue-500'
                                                    }`} />
                                                {index < versions.length - 1 && (
                                                    <div className="absolute top-3 left-1 w-0.5 h-8 bg-slate-200" />
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800">
                                                        v{version.version}
                                                    </span>
                                                    {getStatusBadge(version)}
                                                </div>

                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                                    <Clock size={10} />
                                                    <span>{formatRelativeTime(version.published_at || version.created_at)}</span>
                                                    {version.stats && (
                                                        <>
                                                            <span className="text-slate-300">·</span>
                                                            <span>{version.stats.bo_count} 对象</span>
                                                            <span>{version.stats.field_count} 字段</span>
                                                        </>
                                                    )}
                                                </div>

                                                {version.change_summary && (
                                                    <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">
                                                        {version.change_summary}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setSelectedVersion(version)}
                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                                title="查看详情"
                                            >
                                                <Eye size={14} />
                                            </button>

                                            {!version.is_active && version.status === 'published' && (
                                                <>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'activate', version })}
                                                        className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                                                        title="设为活跃版本"
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'rollback', version })}
                                                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                                                        title="回滚到此版本"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'deprecate', version })}
                                                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                        title="废弃此版本"
                                                    >
                                                        <Archive size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Confirm Action */}
                                    {confirmAction?.version.version_id === version.version_id && (
                                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-amber-800 font-medium">
                                                        {confirmAction.type === 'activate' && '确认将此版本设为活跃版本？'}
                                                        {confirmAction.type === 'deprecate' && '确认废弃此版本？'}
                                                        {confirmAction.type === 'rollback' && '确认回滚到此版本？将创建新草稿。'}
                                                    </p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => {
                                                                if (confirmAction.type === 'activate') handleSetActive(version);
                                                                else if (confirmAction.type === 'deprecate') handleDeprecate(version);
                                                                else handleRollback(version);
                                                            }}
                                                            className="px-2 py-1 text-[10px] bg-amber-600 text-white rounded hover:bg-amber-700 flex items-center gap-1"
                                                        >
                                                            <Check size={10} /> 确认
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmAction(null)}
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
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ChevronRight size={10} />
                        语义版本在业务对象建模中发布，问数/AI 只消费 Active 版本
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SemanticVersionPanel;
