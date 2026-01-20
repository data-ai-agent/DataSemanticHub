import { useState } from 'react';
import { X, AlertTriangle, GitMerge, Copy, ArrowRight, Check } from 'lucide-react';
import { BusinessObject, Decision } from '../../types/semantic';

interface ConflictDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    conflictObject?: BusinessObject;
    allObjects: BusinessObject[]; // To find the conflicting counterpart
    onResolve: (decision: Decision) => void;
}

const ConflictDrawer = ({ isOpen, onClose, conflictObject, allObjects, onResolve }: ConflictDrawerProps) => {
    const [resolutionMethod, setResolutionMethod] = useState<'MERGE' | 'KEEP_ONE' | null>(null);
    const [targetId, setTargetId] = useState<string>('');

    if (!isOpen || !conflictObject) return null;

    // Find potential conflicting objects (simple logic: same name or code)
    const conflictingCounterparts = allObjects.filter(obj =>
        obj.id !== conflictObject.id &&
        (obj.name === conflictObject.name || obj.code === conflictObject.code)
    );

    const handleResolve = () => {
        if (!resolutionMethod) return;

        onResolve({
            decisionId: crypto.randomUUID(),
            targetType: 'BUSINESS_OBJECT',
            targetId: conflictObject.id,
            action: resolutionMethod,
            payload: { targetId },
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
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-amber-50 z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-amber-700 font-bold text-xs uppercase">
                            <AlertTriangle size={14} />
                            Conflict Detected
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">
                            解决对象冲突
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                        此对象与系统中已有的对象存在冲突（名称或编码重复），请选择一种方式解决。
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">当前待确认对象</div>
                            <div className="font-bold text-lg text-slate-800 mb-1">{conflictObject.name}</div>
                            <div className="font-mono text-sm text-slate-500 mb-3">{conflictObject.code}</div>
                            <div className="text-sm text-slate-600 mb-1">包含字段: {conflictObject.fields.length} 个</div>
                            <div className="text-sm text-slate-600">来源: {conflictObject.source || 'AI'}</div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {conflictingCounterparts.length > 0 ? conflictingCounterparts.map(obj => (
                                <div key={obj.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50 relative">
                                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                                        EXISTING
                                    </div>
                                    <div className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">冲突对象</div>
                                    <div className="font-bold text-lg text-slate-800 mb-1">{obj.name}</div>
                                    <div className="font-mono text-sm text-slate-500 mb-3">{obj.code}</div>
                                    <div className="text-sm text-slate-600 mb-1">包含字段: {obj.fields?.length || 0} 个</div>
                                    <div className="text-sm text-slate-600">状态: {obj.status}</div>
                                </div>
                            )) : (
                                <div className="border border-dashed border-slate-300 rounded-lg p-8 flex items-center justify-center text-slate-400 text-sm">
                                    未找到具体的对应冲突对象 (可能为全局唯一性冲突)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resolution Options */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4">选择解决方案</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => setResolutionMethod('MERGE')}
                                className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${resolutionMethod === 'MERGE'
                                        ? 'border-purple-600 bg-purple-50'
                                        : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${resolutionMethod === 'MERGE' ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <GitMerge size={20} />
                                </div>
                                <div>
                                    <div className={`font-bold ${resolutionMethod === 'MERGE' ? 'text-purple-900' : 'text-slate-800'}`}>合并对象 (Merge)</div>
                                    <p className="text-sm text-slate-500 mt-1">将当前对象的字段合并到已有对象中，补充缺失属性。</p>
                                </div>
                                {resolutionMethod === 'MERGE' && <Check className="ml-auto text-purple-600" />}
                            </button>

                            <button
                                onClick={() => setResolutionMethod('KEEP_ONE')}
                                className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${resolutionMethod === 'KEEP_ONE'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${resolutionMethod === 'KEEP_ONE' ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <Copy size={20} />
                                </div>
                                <div>
                                    <div className={`font-bold ${resolutionMethod === 'KEEP_ONE' ? 'text-blue-900' : 'text-slate-800'}`}>保留其一 (Keep One)</div>
                                    <p className="text-sm text-slate-500 mt-1">放弃其中一个对象，或将此对象重命名为独立的新对象。</p>
                                </div>
                                {resolutionMethod === 'KEEP_ONE' && <Check className="ml-auto text-blue-600" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleResolve}
                        disabled={!resolutionMethod}
                        className="px-6 py-2 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                    >
                        确认解决
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConflictDrawer;
