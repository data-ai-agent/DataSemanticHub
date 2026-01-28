import { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    X,
    Shield,
    Activity,
    Zap,
    Users,
    ArrowRight,
    Loader2,
    Ban,
    RotateCcw,
    PauseCircle,
    PlayCircle
} from 'lucide-react';

interface BulkActionWizardProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onComplete: () => void;
}

type BulkActionType = 'disable' | 'revert_stable' | 'pause_canary' | 'trigger_gate' | 'notify_owner';

const ACTIONS: { id: BulkActionType; label: string; icon: any; description: string; risk: 'high' | 'medium' | 'low' }[] = [
    {
        id: 'disable',
        label: '批量禁用',
        icon: Ban,
        description: '禁用选中的模板，所有关联的 Agent 实例将无法调用。',
        risk: 'high'
    },
    {
        id: 'revert_stable',
        label: '切回 Stable 版本',
        icon: RotateCcw,
        description: '将 Prod 指针强制回滚到 Stable 版本，清除灰度流量。',
        risk: 'high'
    },
    {
        id: 'pause_canary',
        label: '暂停灰度',
        icon: PauseCircle,
        description: '冻结当前的灰度流量比例，停止自动扩量。',
        risk: 'medium'
    },
    {
        id: 'trigger_gate',
        label: '触发门禁回归',
        icon: Shield,
        description: '立即运行 Release Gate 测试套件。',
        risk: 'low'
    },
    {
        id: 'notify_owner',
        label: '通知负责人',
        icon: Users,
        description: '发送系统通知给模板负责人。',
        risk: 'low'
    }
];

export default function BulkActionWizard({ isOpen, onClose, selectedCount, onComplete }: BulkActionWizardProps) {
    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [selectedAction, setSelectedAction] = useState<BulkActionType>('notify_owner');
    const [progress, setProgress] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setStep(0);
            setProgress(0);
            setIsSimulating(false);
        }
    }, [isOpen]);

    const handleExecute = () => {
        setStep(2);
        setIsSimulating(true);
        // Simulate progress
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 20;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setIsSimulating(false);
                setTimeout(() => {
                    onComplete();
                }, 800);
            }
            setProgress(p);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white z-[70] rounded-xl shadow-2xl border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">批量操作管理</h3>
                        <p className="text-xs text-slate-500 mt-0.5">已选择 {selectedCount} 个模板</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 min-h-[400px]">
                    {step === 0 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-slate-700">Step 1: 选择操作类型</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {ACTIONS.map(action => (
                                    <button
                                        key={action.id}
                                        className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-all ${selectedAction === action.id
                                                ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        onClick={() => setSelectedAction(action.id)}
                                    >
                                        <div className={`p-2 rounded-lg ${selectedAction === action.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            <action.icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold ${selectedAction === action.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                    {action.label}
                                                </span>
                                                {action.risk === 'high' && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-medium">高风险</span>
                                                )}
                                                {action.risk === 'medium' && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-medium">中风险</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 ${selectedAction === action.id ? 'border-indigo-600' : 'border-slate-300'
                                            }`}>
                                            {selectedAction === action.id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <h4 className="text-sm font-medium text-slate-700">Step 2: 影响评估 (Impact Preview)</h4>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="text-xs text-slate-500 mb-1">影响运行包</div>
                                    <div className="text-xl font-mono font-semibold text-slate-800">12 <span className="text-xs font-normal text-slate-400">个</span></div>
                                </div>
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="text-xs text-slate-500 mb-1">近日调用总量</div>
                                    <div className="text-xl font-mono font-semibold text-slate-800">45.2k</div>
                                </div>
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                    <div className="text-xs text-slate-500 mb-1">Prod 流量占比</div>
                                    <div className="text-xl font-mono font-semibold text-amber-600">8.5%</div>
                                </div>
                            </div>

                            {/* Risk Alert */}
                            {(ACTIONS.find(a => a.id === selectedAction)?.risk !== 'low') && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
                                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                                    <div className="text-sm text-amber-800">
                                        <div className="font-medium mb-1">潜在风险警告</div>
                                        <p>检测到 3 个模板正在进行灰度发布（Canary），强制执行可能导致部分用户体验回退。建议先通知负责人。</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Confirmation */}
                            <div className="text-sm text-slate-600">
                                即将对 <span className="font-semibold text-slate-900">{selectedCount}</span> 个模板执行
                                <span className="font-semibold text-indigo-600 mx-1">
                                    {ACTIONS.find(a => a.id === selectedAction)?.label}
                                </span>
                                操作。该操作将被记录在审计日志中。
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-6">
                            <h4 className="text-sm font-medium text-slate-700">Step 3: 执行中...</h4>

                            <div className="w-full max-w-md bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="text-center space-y-2">
                                <div className="text-2xl font-mono font-bold text-slate-800">{Math.min(100, Math.round(progress))}%</div>
                                <div className="text-sm text-slate-500 flex items-center justify-center gap-2">
                                    {progress < 100 ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} />
                                            正在处理模板配置...
                                        </>
                                    ) : (
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <CheckCircle size={14} /> 执行完成
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="w-full max-w-md mt-6 rounded-lg border border-slate-200 p-3 max-h-32 overflow-y-auto text-xs font-mono text-slate-600 bg-slate-50">
                                {progress > 10 && <div>[INFO] Batch job initialized: op_882910</div>}
                                {progress > 30 && <div>[INFO] Validating permissions for {selectedCount} items...</div>}
                                {progress > 60 && <div>[INFO] Analyzing impact scope... Done.</div>}
                                {progress > 80 && <div>[EXEC] Applying {selectedAction} to target templates...</div>}
                                {progress >= 100 && <div className="text-emerald-600">[SUCCESS] Operation completed successfully.</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    {step < 2 ? (
                        <>
                            <button
                                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-colors text-sm"
                                onClick={onClose}
                            >
                                取消
                            </button>
                            {step > 0 && (
                                <button
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-colors text-sm"
                                    onClick={() => setStep(prev => (prev - 1) as any)}
                                >
                                    上一步
                                </button>
                            )}
                            <button
                                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm flex items-center gap-2"
                                onClick={() => {
                                    if (step === 0) setStep(1);
                                    else handleExecute();
                                }}
                            >
                                {step === 0 ? '下一步' : '确认执行'}
                                {step === 0 && <ArrowRight size={14} />}
                            </button>
                        </>
                    ) : (
                        <button
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
                            onClick={onComplete}
                            disabled={isSimulating}
                        >
                            完成
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
