import React from 'react';
import {
    ArrowLeft, X, FileText,
    Activity, Play, Database
} from 'lucide-react';
import { TableSemanticProfile } from '../../../types/semantic';
import { profileService, ProfileRunResponse } from '../../../services/profile';


interface GovernanceTopBarProps {
    profile: TableSemanticProfile;
    mode: 'BROWSE' | 'SEMANTIC';
    onModeChange: (mode: 'BROWSE' | 'SEMANTIC') => void;
    fields: any[];
    onBack?: () => void;
    onFinish?: () => void;
}

export const GovernanceTopBar: React.FC<GovernanceTopBarProps> = ({
    profile,
    mode,
    onModeChange,
    fields,
    onBack,
    onFinish
}) => {
    // Calc Stats

    // Calc Stats
    const totalFields = fields.length;
    const confirmedFields = profile.fields?.filter(f => f.semanticStatus === 'DECIDED').length || 0;
    const progress = totalFields > 0 ? (confirmedFields / totalFields) * 100 : 0;
    const blockers = (profile.fields?.filter(f => f.riskLevel === 'HIGH').length || 0) +
        (fields.length - confirmedFields); // Simple blocker logic: High Risk + Pending



    return (
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
            {/* Left: Context Info */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    title="返回列表"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mode === 'SEMANTIC' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {mode === 'SEMANTIC' ? <Activity size={20} /> : <Database size={20} />}
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {profile.tableName}
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${profile.objectType === 'event' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            profile.objectType === 'entity' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                            {(() => {
                                const map: Record<string, string> = {
                                    'entity': '主体',
                                    'event': '事件',
                                    'state': '状态',
                                    'rule': '规则',
                                    'attribute': '属性'
                                };
                                return map[profile.objectType || ''] || '表';
                            })()}
                        </span>
                    </h1>
                    <div className="flex items-center gap-4 text-xs mt-1">
                        <span className="text-slate-500">
                            已治理: <strong className="text-slate-700">{confirmedFields}/{totalFields}</strong>
                        </span>
                        {blockers > 0 && (
                            <span className="text-amber-600 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {blockers} 待处理
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle: Semantic Mode Helper (Only in Semantic Mode) */}
            {mode === 'SEMANTIC' && null}

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {mode === 'BROWSE' ? (
                    <button
                        onClick={() => onModeChange('SEMANTIC')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        <Play size={16} fill="currentColor" />
                        开始语义理解
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => onModeChange('BROWSE')}
                            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <X size={16} />
                            退出模式
                        </button>
                        <button
                            onClick={onFinish}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <FileText size={16} />
                            完成并预览
                        </button>
                    </>
                )}
            </div>

            {/* 模板说明抽屉 - Removed */}
        </div>
    );
};
