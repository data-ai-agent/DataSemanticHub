import React from 'react';
import { Layers, CheckCircle2, Box, Share2 } from 'lucide-react';

interface SemanticSummaryProps {
    stats: {
        totalFields: number;
        semanticFields: number;
        objectCount: number;
        relationCount: number;
    };
}

export const SemanticSummary: React.FC<SemanticSummaryProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Layers size={20} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-800">{stats.totalFields}</div>
                    <div className="text-xs text-slate-500 font-medium">字段总数</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-800">{stats.semanticFields}</div>
                    <div className="text-xs text-slate-500 font-medium">已完成语义识别</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <Box size={20} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-800">{stats.objectCount}</div>
                    <div className="text-xs text-slate-500 font-medium">识别业务对象</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Share2 size={20} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-800">{stats.relationCount}</div>
                    <div className="text-xs text-slate-500 font-medium">对象关系</div>
                </div>
            </div>
        </div>
    );
};
