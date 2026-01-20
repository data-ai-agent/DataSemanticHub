import React, { useState } from 'react';
import {
    Upload, X, Check, Database, Layers, AlertCircle,
    ChevronRight, Sparkles, FileText, Tag
} from 'lucide-react';
import { SemanticVersion } from '../../../types/semanticVersion';
import { semanticVersionService } from '../../../services/semantic/semanticVersionService';

interface PublishVersionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    businessObjects: any[];  // 要发布的 BO 列表
    onPublished: (version: SemanticVersion) => void;
}

const PublishVersionDialog: React.FC<PublishVersionDialogProps> = ({
    isOpen,
    onClose,
    businessObjects,
    onPublished
}) => {
    const [step, setStep] = useState<'preview' | 'confirm' | 'success'>('preview');
    const [changeSummary, setChangeSummary] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [publishedVersion, setPublishedVersion] = useState<SemanticVersion | null>(null);

    // 统计信息
    const stats = {
        boCount: businessObjects.length,
        fieldCount: businessObjects.reduce((sum, bo) => sum + (bo.fields?.length || 0), 0),
        publishedCount: businessObjects.filter(bo => bo.status === 'published').length,
        draftCount: businessObjects.filter(bo => bo.status === 'draft').length
    };

    const handleCreateDraft = async () => {
        setPublishing(true);
        setError(null);

        try {
            // 创建草稿
            const draft = await semanticVersionService.createDraft(businessObjects);

            // 发布草稿
            const published = await semanticVersionService.publishVersion(
                draft.version_id,
                changeSummary || '发布新版本'
            );

            setPublishedVersion(published);
            setStep('success');
            onPublished(published);
        } catch (err: any) {
            setError(err.message || '发布失败');
        }

        setPublishing(false);
    };

    const handleClose = () => {
        setStep('preview');
        setChangeSummary('');
        setError(null);
        setPublishedVersion(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Upload size={18} className="text-indigo-600" />
                        <h2 className="text-sm font-bold text-slate-800">
                            {step === 'success' ? '发布成功' : '发布语义版本'}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={16} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {step === 'preview' && (
                        <>
                            {/* Preview Stats */}
                            <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                                <h3 className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1">
                                    <Sparkles size={12} />
                                    即将发布的内容
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-xs text-indigo-700">
                                        <Database size={14} className="text-indigo-500" />
                                        <span>{stats.boCount} 个业务对象</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-indigo-700">
                                        <Layers size={14} className="text-indigo-500" />
                                        <span>{stats.fieldCount} 个字段</span>
                                    </div>
                                </div>
                            </div>

                            {/* BO List Preview */}
                            <div className="mb-4">
                                <h3 className="text-xs font-semibold text-slate-700 mb-2">业务对象列表</h3>
                                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                                    {businessObjects.length === 0 ? (
                                        <div className="p-4 text-center text-slate-400 text-xs">
                                            暂无业务对象
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {businessObjects.slice(0, 10).map((bo, idx) => (
                                                <div key={bo.id || idx} className="px-3 py-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Database size={12} className="text-slate-400" />
                                                        <span className="text-xs text-slate-700">{bo.label || bo.name}</span>
                                                        <span className="text-[10px] text-slate-400">{bo.normalizedName || bo.normalized_name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">
                                                        {bo.fields?.length || 0} 字段
                                                    </span>
                                                </div>
                                            ))}
                                            {businessObjects.length > 10 && (
                                                <div className="px-3 py-2 text-center text-[10px] text-slate-400">
                                                    还有 {businessObjects.length - 10} 个...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Change Summary */}
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                                    变更说明 <span className="text-slate-400 font-normal">(可选)</span>
                                </label>
                                <textarea
                                    value={changeSummary}
                                    onChange={(e) => setChangeSummary(e.target.value)}
                                    placeholder="描述本次发布的主要变更..."
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Warning */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-amber-800">
                                    <p className="font-medium">发布后此版本将成为活跃版本</p>
                                    <p className="text-amber-700 mt-0.5">问数/AI 将使用新版本进行查询</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle size={12} className="text-red-600" />
                                    <span className="text-xs text-red-700">{error}</span>
                                </div>
                            )}
                        </>
                    )}

                    {step === 'success' && publishedVersion && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">发布成功！</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                语义版本 <strong>v{publishedVersion.version}</strong> 已发布并激活
                            </p>
                            <div className="inline-flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Database size={12} />
                                    {publishedVersion.stats?.bo_count || 0} 对象
                                </span>
                                <span className="flex items-center gap-1">
                                    <Layers size={12} />
                                    {publishedVersion.stats?.field_count || 0} 字段
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                    {step === 'preview' && (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreateDraft}
                                disabled={publishing || businessObjects.length === 0}
                                className={`px-4 py-1.5 text-xs text-white rounded-lg flex items-center gap-1 ${publishing || businessObjects.length === 0
                                        ? 'bg-slate-300 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                            >
                                {publishing ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        发布中...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={12} />
                                        发布版本
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === 'success' && (
                        <button
                            onClick={handleClose}
                            className="px-4 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1"
                        >
                            <Check size={12} />
                            完成
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublishVersionDialog;
