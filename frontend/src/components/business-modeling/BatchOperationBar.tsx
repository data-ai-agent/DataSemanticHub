import { CheckCircle, XCircle, ArrowRight, UserPlus, FolderInput } from 'lucide-react';
import { BusinessObject } from '../../types/semantic';

interface BatchOperationBarProps {
    selectedObjects: BusinessObject[];
    onClearSelection: () => void;
    onBatchAccept?: (ids: string[]) => void;
    onBatchReject?: (ids: string[]) => void;
}

const BatchOperationBar = ({ selectedObjects, onClearSelection, onBatchAccept, onBatchReject }: BatchOperationBarProps) => {
    if (selectedObjects.length === 0) return null;

    const count = selectedObjects.length;
    // Check if all selected objects have the same status to enable relevant actions
    const allCandidate = selectedObjects.every(o => o.status === 'candidate');

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white rounded-xl shadow-xl px-6 py-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                <span className="font-semibold">{count} 项已选择</span>
                <button
                    onClick={onClearSelection}
                    className="text-xs text-slate-400 hover:text-white hover:underline transition-colors"
                >
                    取消选择
                </button>
            </div>

            <div className="flex items-center gap-3">
                {allCandidate && (
                    <>
                        <button
                            onClick={() => onBatchAccept?.(selectedObjects.map(o => o.id))}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                        >
                            <CheckCircle size={16} />
                            批量接受
                        </button>
                        <button
                            onClick={() => onBatchReject?.(selectedObjects.map(o => o.id))}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <XCircle size={16} />
                            批量拒绝
                        </button>
                    </>
                )}

                <div className="h-6 w-px bg-slate-700 mx-2" />

                <button className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors">
                    <UserPlus size={16} />
                    分配负责人
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors">
                    <FolderInput size={16} />
                    移动业务域
                </button>
            </div>
        </div>
    );
};

export default BatchOperationBar;
