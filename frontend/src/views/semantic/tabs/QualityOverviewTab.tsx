import React from 'react';
import { Activity } from 'lucide-react';

export const QualityOverviewTab: React.FC = () => {
    return (
        <div className="p-6 bg-white rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-slate-700">数据质量总览</span>
                <span className="px-3 py-1 text-sm font-bold bg-emerald-100 text-emerald-700 rounded-lg">B+</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">完整性</span>
                        <span className="font-bold text-emerald-600">82%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">唯一性</span>
                        <span className="font-bold text-blue-600">95%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">一致性</span>
                        <span className="font-bold text-purple-600">78%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">时效性</span>
                        <span className="font-bold text-amber-600">88%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
