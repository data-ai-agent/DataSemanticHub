import React from 'react';
import {
    ArrowLeft, X, FileText,
    Play
} from 'lucide-react';
import { TableSemanticProfile, TableSemanticStage } from '../../../types/semantic';
import { semanticStageLabelMap, semanticStageToneMap } from '../utils';


interface GovernanceTopBarProps {
    profile: TableSemanticProfile;
    mode: 'BROWSE' | 'SEMANTIC';
    onModeChange: (mode: 'BROWSE' | 'SEMANTIC') => void;
    fields: any[];
    onBack?: () => void;
    onFinish?: () => void;
    tableMeta?: {
        tableName?: string;
        sourceType?: string;
        sourceName?: string;
    };
}

export const GovernanceTopBar: React.FC<GovernanceTopBarProps> = ({
    profile,
    mode,
    onModeChange,
    fields,
    onBack,
    onFinish,
    tableMeta
}) => {
    // Calc Stats

    // Calc Stats
    const totalFields = fields.length;
    const confirmedFields = profile.fields?.filter(f => f.semanticStatus === 'DECIDED').length || 0;
    const progress = totalFields > 0 ? (confirmedFields / totalFields) * 100 : 0;
    const blockers = (profile.fields?.filter(f => f.riskLevel === 'HIGH').length || 0) +
        (fields.length - confirmedFields);

    const displayTableName = tableMeta?.tableName || profile.tableName || '未命名表';
    const dataSourceTag = tableMeta?.sourceType || '数据源';
    const objectTypeLabelMap: Record<string, string> = {
        entity: '主体',
        event: '过程',
        state: '状态',
        attribute: '清单',
        rule: '清单'
    };
    const objectTypeLabel = objectTypeLabelMap[profile.objectType || ''] || '主体';

    const fallbackStage: TableSemanticStage = profile.governanceStatus === 'S3'
        ? 'READY_FOR_OBJECT'
        : profile.governanceStatus === 'S2'
            ? 'MODELING_IN_PROGRESS'
            : profile.governanceStatus === 'S1'
                ? 'FIELD_PENDING'
                : 'NOT_STARTED';
    const stage = profile.semanticStage || fallbackStage;
    const stageLabel = semanticStageLabelMap[stage];
    const stageTone = semanticStageToneMap[stage];

    const primaryLabel = stage === 'NOT_STARTED' ? '开始语义理解' : '继续语义理解';

    return (
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
            <div className="flex items-start gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    title="返回列表"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-lg font-bold text-slate-800">{displayTableName}</div>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {dataSourceTag}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                            {objectTypeLabel}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span>已确认 {confirmedFields}/{totalFields}</span>
                        {blockers > 0 && (
                            <span className="text-amber-600 font-medium">
                                {blockers} 待处理
                            </span>
                        )}
                        {tableMeta?.sourceName && (
                            <span className="text-slate-400">来源：{tableMeta.sourceName}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${stageTone}`}>
                    {stageLabel}
                </span>
                {mode === 'BROWSE' ? (
                    <button
                        onClick={() => onModeChange('SEMANTIC')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow active:scale-95"
                    >
                        <Play size={16} fill="currentColor" />
                        {primaryLabel}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => onModeChange('BROWSE')}
                            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <X size={16} />
                            退出语义理解
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
        </div>
    );
};
