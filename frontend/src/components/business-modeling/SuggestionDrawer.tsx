import { useState } from 'react';
import { X, CheckCircle, XCircle, Edit, ExternalLink, AlertTriangle, Shield, ArrowRight } from 'lucide-react';
import { BusinessObject, ObjectSuggestion, Decision } from '../../types/semantic';

interface SuggestionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    suggestion?: BusinessObject; // Using BusinessObject with status='candidate' as the suggestion carrier
    onDecision: (decision: Decision) => void;
}

const SuggestionDrawer = ({ isOpen, onClose, suggestion, onDecision }: SuggestionDrawerProps) => {
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [editForm, setEditForm] = useState<{ name: string; code: string; domain: string }>({
        name: suggestion?.name || '',
        code: suggestion?.code || '',
        domain: suggestion?.domain || ''
    });

    if (!isOpen || !suggestion) return null;

    const handleAccept = () => {
        onDecision({
            decisionId: crypto.randomUUID(),
            targetType: 'BUSINESS_OBJECT',
            targetId: suggestion.id,
            action: 'ACCEPT',
            decidedBy: 'currentUser', // TODO: Get from context
            decidedAt: new Date().toISOString()
        });
        onClose();
    };

    const handleReject = () => {
        onDecision({
            decisionId: crypto.randomUUID(),
            targetType: 'BUSINESS_OBJECT',
            targetId: suggestion.id,
            action: 'REJECT',
            decidedBy: 'currentUser',
            decidedAt: new Date().toISOString()
        });
        onClose();
    };

    const handleSaveAndAccept = () => {
        onDecision({
            decisionId: crypto.randomUUID(),
            targetType: 'BUSINESS_OBJECT',
            targetId: suggestion.id,
            action: 'ACCEPT_WITH_EDIT',
            payload: editForm,
            decidedBy: 'currentUser',
            decidedAt: new Date().toISOString()
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-bold uppercase">
                                AI Suggestion
                            </span>
                            {suggestion.confidence && (
                                <span className={`text-xs font-medium ${suggestion.confidence > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {suggestion.confidence}% 置信度
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {mode === 'view' ? suggestion.name : '修改并接受建议'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* 1. Basic Info */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-4 bg-purple-500 rounded-full" />
                            基础信息建议
                        </h3>
                        {mode === 'view' ? (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-y-4 text-sm">
                                <div>
                                    <span className="text-slate-500 block mb-1">对象名称</span>
                                    <span className="font-medium text-slate-800">{suggestion.name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-1">对象编码</span>
                                    <span className="font-mono text-slate-700">{suggestion.code}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-1">业务域</span>
                                    <span className="font-medium text-slate-800">{suggestion.domain}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-1">对象类型</span>
                                    <span className="font-medium text-slate-800">{suggestion.type || 'CORE_ENTITY'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-500 block mb-1">描述</span>
                                    <span className="text-slate-700">{suggestion.description || '无描述'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">对象名称</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">对象编码</label>
                                        <input
                                            type="text"
                                            value={editForm.code}
                                            onChange={e => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">业务域</label>
                                        <input
                                            type="text"
                                            value={editForm.domain}
                                            onChange={e => setEditForm(prev => ({ ...prev, domain: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 2. Evidence */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500 rounded-full" />
                            识别依据
                        </h3>
                        <div className="flex flex-col gap-2">
                            {suggestion.evidence?.sourceTables.map(table => (
                                <div key={table} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm">
                                    <div className="flex items-center gap-2">
                                        <Database size={14} className="text-blue-500" />
                                        <span className="text-slate-700">来源表：<span className="font-mono font-medium">{table}</span></span>
                                    </div>
                                    <a href="#" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                        查看表详情 <ExternalLink size={12} />
                                    </a>
                                </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                                {suggestion.evidence?.keyFields.map(field => (
                                    <span key={field} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                        关键字段: {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 3. Field Mapping Preview */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                            属性映射建议 ({suggestion.fields.length})
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">业务属性</th>
                                        <th className="px-4 py-3">语义角色</th>
                                        <th className="px-4 py-3">来源字段</th>
                                        <th className="px-4 py-3">风险提示</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {suggestion.fields.map((field, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{field.name}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200">
                                                    {field.role || 'Attribute'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{field.code || '-'}</td>
                                            <td className="px-4 py-3">
                                                {/* Mock Risk Hint */}
                                                {field.name.includes('ID') ? (
                                                    <div className="flex items-center gap-1 text-amber-600 text-xs">
                                                        <Shield size={12} /> IsPII
                                                    </div>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    {mode === 'view' ? (
                        <>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <XCircle size={16} />
                                拒绝建议
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setMode('edit')}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                                >
                                    <Edit size={16} />
                                    修改后接受
                                </button>
                                <button
                                    onClick={handleAccept}
                                    className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-sm font-medium shadow-sm shadow-purple-200 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={16} />
                                    接受并生成
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setMode('view')}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                取消修改
                            </button>
                            <button
                                onClick={handleSaveAndAccept}
                                className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-sm font-medium shadow-sm shadow-purple-200 transition-all flex items-center gap-2"
                            >
                                <CheckCircle size={16} />
                                确认修改并接受
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper for icon
function Database({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
    )
}

export default SuggestionDrawer;
