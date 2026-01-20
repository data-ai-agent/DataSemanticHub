import { RefreshCw, Users, CheckCircle, AlertTriangle, FileText, Activity } from 'lucide-react';
import { BusinessObject } from '../../types/semantic';

interface CandidateSummaryBarProps {
    objects: BusinessObject[];
    onRefresh: () => void;
}

const CandidateSummaryBar = ({ objects, onRefresh }: CandidateSummaryBarProps) => {
    // Calculate statistics
    const stats = {
        total: objects.length,
        accepted: objects.filter(o => o.status === 'pending' || o.status === 'published').length,
        toConfirm: objects.filter(o => o.status === 'candidate').length,
        conflicts: objects.filter(o => o.conflictFlag).length,
        avgConfidence: objects.length > 0
            ? Math.round(objects.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / objects.length)
            : 0
    };

    return (
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">总对象数</span>
                    <span className="font-bold text-slate-800 text-lg">{stats.total}</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />

                <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span className="text-slate-500">已接受</span>
                    <span className="font-bold text-slate-800">{stats.accepted}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-500" />
                    <span className="text-slate-500">待确认</span>
                    <span className="font-bold text-slate-800">{stats.toConfirm}</span>
                </div>

                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <span className="text-slate-500">冲突项</span>
                    <span className="font-bold text-amber-600">{stats.conflicts}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-purple-500" />
                    <span className="text-slate-500">平均置信度</span>
                    <span className="font-bold text-slate-800">{stats.avgConfidence}%</span>
                </div>
            </div>

            <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
            >
                <RefreshCw size={14} />
                刷新识别建议
            </button>
        </div>
    );
};

export default CandidateSummaryBar;
