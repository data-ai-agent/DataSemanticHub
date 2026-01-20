import React from 'react';
import { ArrowLeft, Sparkles, RefreshCw, Layout, Wand2 } from 'lucide-react';
import { GovernanceStatus } from '../../../types/semantic';
import { getGovernanceDisplay, typeConfig } from '../utils';
import { ReadOnlyBadge } from '../../../components/common/ReadOnlyBadge';

export type PageMode = 'BROWSE' | 'SEMANTIC';

interface SemanticHeaderProps {
    table: {
        table: string;
        sourceType: string;
        comment?: string;
    };
    governanceStatus: GovernanceStatus;
    rolledBack?: boolean;
    isAnalyzing: boolean;
    analysisStep: 'idle' | 'analyzing' | 'done';

    // New Props for V2.4
    pageMode: PageMode;
    onModeChange: (mode: PageMode) => void;
    semanticProgress?: {
        confirmed: number;
        total: number;
    };

    onBack: () => void;
    onAnalyze: () => void;
    readOnly?: boolean;
    versionLabel?: string;

    // P1 Optimization: BROWSE -> SEMANTIC switch
    onSwitchToSemantic?: () => void;
    showSwitchButton?: boolean;
}

export const SemanticHeader: React.FC<SemanticHeaderProps> = ({
    table,
    governanceStatus,
    rolledBack,
    isAnalyzing,
    analysisStep,
    pageMode,
    onModeChange,
    semanticProgress,
    onBack,
    onAnalyze,
    readOnly,
    versionLabel,
    onSwitchToSemantic,
    showSwitchButton = false
}) => {
    // Determine status display
    const effectiveStatus = (governanceStatus || (analysisStep === 'done' ? 'S1' : 'S0')) as GovernanceStatus;
    const display = getGovernanceDisplay(effectiveStatus, rolledBack);

    const isIdle = analysisStep === 'idle';

    return (
        <div className="p-4 border-b border-slate-100 bg-white shadow-sm z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <button
                        onClick={onBack}
                        className="mt-1 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors h-fit"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">{table.table}</h2>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig[table.sourceType]?.bgColor || 'bg-slate-100'} ${typeConfig[table.sourceType]?.color || 'text-slate-600'}`}>
                                {table.sourceType}
                            </span>
                            {/* Analysis Status Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${display.tone}`}>
                                {effectiveStatus === 'S1' && !rolledBack && <Sparkles size={10} />}
                                {display.label}
                            </span>
                            {readOnly && (
                                <ReadOnlyBadge versionId={versionLabel} className="text-slate-500" />
                            )}
                        </div>
                        <p className="text-slate-500 text-sm mt-1">{table.comment || '暂无物理表注释'}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-2">
                        <button
                            onClick={onBack}
                            className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                        >
                            返回列表
                        </button>

                        {/* P1 Optimization: Switch to SEMANTIC mode button (only in BROWSE mode) */}
                        {showSwitchButton && onSwitchToSemantic && (
                            <button
                                onClick={onSwitchToSemantic}
                                disabled={readOnly}
                                className={`px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${readOnly
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : analysisStep === 'done'
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                            : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-sm'
                                    }`}
                            >
                                <Sparkles size={14} />
                                {analysisStep === 'done' ? '继续语义理解' : '开始语义理解'}
                            </button>
                        )}

                        {/* Original analyze button (shown in SEMANTIC mode or when switch button not shown) */}
                        {!showSwitchButton && (
                            <button
                                onClick={onAnalyze}
                                disabled={isAnalyzing || readOnly}
                                className={`px-4 py-1.5 rounded-lg text-sm shadow-sm flex items-center gap-2 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isAnalyzing ? 'bg-slate-400 cursor-not-allowed' :
                                        readOnly ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                                            analysisStep === 'done' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600'
                                    }`}
                            >
                                {isAnalyzing ? (
                                    <><RefreshCw size={14} className="animate-spin" /> 语义理解中...</>
                                ) : analysisStep === 'done' ? (
                                    <><RefreshCw size={14} /> 重新理解</>
                                ) : (
                                    <><Sparkles size={14} /> 开始语义理解</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* V2.4 Mode Switcher & Progress */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                    <button
                        onClick={() => onModeChange('BROWSE')}
                        disabled={readOnly}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${pageMode === 'BROWSE'
                            ? 'bg-white text-slate-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Layout size={14} /> 浏览模式
                    </button>
                    <button
                        onClick={() => onModeChange('SEMANTIC')}
                        disabled={readOnly}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${pageMode === 'SEMANTIC'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Wand2 size={14} /> 语义治理模式
                    </button>
                </div>

                {/* Progress Indicators (Only in Semantic Mode) */}
                {pageMode === 'SEMANTIC' && semanticProgress && (
                    <div className="flex items-center gap-4 animate-fade-in">
                        <div className="flex flex-col items-end">
                            <div className="text-xs text-slate-500 mb-1">
                                语义确认进度 <span className="font-bold text-blue-600 ml-1">{Math.round((semanticProgress.confirmed / semanticProgress.total) * 100)}%</span>
                            </div>
                            <div className="w-32 bg-slate-200 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(semanticProgress.confirmed / semanticProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
