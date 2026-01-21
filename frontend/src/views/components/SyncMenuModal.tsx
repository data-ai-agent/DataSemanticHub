import React, { useState, useMemo } from 'react';
import { X, Check, ArrowRight, AlertTriangle, Plus, Trash2, RefreshCw } from 'lucide-react';

interface SyncMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSync: (changes: MenuDiff[]) => void;
}

export type DiffType = 'add' | 'remove' | 'update';

export interface MenuDiff {
    id: string;
    type: DiffType;
    name: string;
    path: string;
    changes?: { field: string; oldValue: any; newValue: any }[];
}

// Mock Diff Data
const MOCK_DIFFS: MenuDiff[] = [
    {
        id: 'menu_new_feature',
        type: 'add',
        name: 'AI 实验室',
        path: '/platform/ai-lab',
    },
    {
        id: 'menu_deprecated_page',
        type: 'remove',
        name: '旧版报表',
        path: '/report/legacy',
    },
    {
        id: 'menu_user_mgmt',
        type: 'update',
        name: '用户管理',
        path: '/platform/users',
        changes: [
            { field: 'icon', oldValue: 'User', newValue: 'UserCog' },
            { field: 'order', oldValue: 3, newValue: 2 }
        ]
    }
];

const SyncMenuModal: React.FC<SyncMenuModalProps> = ({ isOpen, onClose, onSync }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(MOCK_DIFFS.map(d => d.id)));
    const [isSyncing, setIsSyncing] = useState(false);

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleSync = () => {
        setIsSyncing(true);
        // Simulate API call
        setTimeout(() => {
            setIsSyncing(false);
            onSync(MOCK_DIFFS.filter(d => selectedIds.has(d.id)));
            onClose();
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">同步菜单配置</h3>
                        <p className="text-sm text-slate-500">检测到代码配置与数据库存在差异，请确认同步。</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                    <div className="space-y-4">
                        {MOCK_DIFFS.map((diff) => {
                            const isSelected = selectedIds.has(diff.id);
                            return (
                                <div
                                    key={diff.id}
                                    className={`relative flex items-start gap-4 rounded-xl border p-4 transition-all cursor-pointer ${isSelected
                                            ? 'border-indigo-200 bg-indigo-50/50'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    onClick={() => toggleSelect(diff.id)}
                                >
                                    <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded border ${isSelected
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-300 bg-white'
                                        }`}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {diff.type === 'add' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">新增</span>}
                                            {diff.type === 'remove' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">删除</span>}
                                            {diff.type === 'update' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">变更</span>}
                                            <span className="font-semibold text-slate-800">{diff.name}</span>
                                            <span className="text-xs font-mono text-slate-400 ml-auto">{diff.path}</span>
                                        </div>

                                        {diff.type === 'update' && diff.changes && (
                                            <div className="mt-2 space-y-1 text-xs bg-white/50 p-2 rounded border border-indigo-100">
                                                {diff.changes.map((change, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-slate-600">
                                                        <span className="font-mono text-slate-500">{change.field}:</span>
                                                        <span className="line-through text-slate-400">{String(change.oldValue)}</span>
                                                        <ArrowRight size={10} className="text-slate-300" />
                                                        <span className="text-indigo-600 font-medium">{String(change.newValue)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {diff.type === 'add' && (
                                            <div className="text-xs text-emerald-600 mt-1">将在系统中创建新菜单</div>
                                        )}
                                        {diff.type === 'remove' && (
                                            <div className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                                                <AlertTriangle size={10} />
                                                将删除该菜单及其子菜单配置
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
                    <div className="text-xs text-slate-500">
                        已选 {selectedIds.size} 项变更
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-white transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing || selectedIds.size === 0}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm shadow-indigo-100"
                        >
                            {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            确认同步
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyncMenuModal;
