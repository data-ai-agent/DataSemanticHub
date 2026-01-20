import React from 'react';
import {
    SemanticAssist,
    SemanticAssistRuntimeConfig,
    DEFAULT_SEMANTIC_ASSIST
} from '../../../types/semanticAssist';
import {
    ToggleRight,
    ToggleLeft,
    Settings,
    RefreshCw,
    Info,
    AlertTriangle,
    CheckCircle,
    Loader2
} from 'lucide-react';

interface SemanticAssistBarProps {
    assist: SemanticAssist;
    onToggle: (enabled: boolean) => void;
    onOpenConfig: () => void;
    onOpenTemplateInfo: () => void;
    onRefresh: () => void;
}

/**
 * 语义理解辅助检测 - 详情页顶部状态条
 * 
 * 功能：
 * - toggle 仅影响当前表
 * - refresh 触发 profile run（不阻塞语义理解）
 * - 点击模板 → 打开 TemplateInfo（只读）
 */
export const SemanticAssistBar: React.FC<SemanticAssistBarProps> = ({
    assist,
    onToggle,
    onOpenConfig,
    onOpenTemplateInfo,
    onRefresh,
}) => {
    const isRunning = assist.status === 'RUNNING';
    const isSuccess = assist.status === 'SUCCESS';
    const isError = assist.status === 'ERROR';

    return (
        <div className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors ${assist.enabled
            ? 'bg-blue-50/50 border-blue-200'
            : 'bg-slate-50 border-slate-200'
            }`}>
            {/* 标题 + 开关 */}
            <div className="flex items-center gap-3 group relative">
                <span className="text-sm font-medium text-slate-700">语义理解辅助检测</span>

                {/* 开关 */}
                <button
                    onClick={() => onToggle(!assist.enabled)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${assist.enabled
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                    title="仅影响当前表的语义理解过程，不影响数据质量检测与语义裁决结果"
                >
                    {assist.enabled ? (
                        <>
                            <ToggleRight size={14} />
                            已启用
                        </>
                    ) : (
                        <>
                            <ToggleLeft size={14} />
                            未启用
                        </>
                    )}
                </button>

                {/* Hover 提示 */}
                <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                    <div className="font-medium mb-1">作用范围说明</div>
                    <div className="text-slate-300 leading-relaxed">
                        仅影响当前表的语义理解过程，<br />
                        不影响数据质量检测与语义裁决结果
                    </div>
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
            </div>

            {assist.enabled && (
                <>
                    {/* 分隔线 */}
                    <div className="w-px h-4 bg-slate-300" />

                    {/* 模板信息 - 紫色样式 */}
                    <button
                        onClick={onOpenTemplateInfo}
                        className="flex items-center gap-1.5 text-xs transition-colors group/template"
                    >
                        <span className="text-slate-400">模板:</span>
                        <span className="font-mono font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-200 transition-colors">
                            {assist.template}
                        </span>
                    </button>

                    {/* 采样比例 */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="text-slate-400">采样:</span>
                        <span className="font-medium">{assist.runtimeConfig.sampleRatio}%</span>
                    </div>

                    {/* 状态指示 */}
                    {isRunning && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600">
                            <Loader2 size={12} className="animate-spin" />
                            <span>检测中...</span>
                        </div>
                    )}
                    {isSuccess && assist.sourceInfo && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <CheckCircle size={12} />
                            <span>
                                {assist.sourceInfo.fromQuality ? '已复用质量结果' : '检测完成'}
                            </span>
                        </div>
                    )}
                    {isError && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <AlertTriangle size={12} />
                            <span>检测异常（不影响语义理解）</span>
                        </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 ml-auto">
                        <button
                            onClick={onOpenConfig}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="设置"
                        >
                            <Settings size={14} />
                        </button>
                        <button
                            onClick={onRefresh}
                            disabled={isRunning}
                            className={`p-1.5 rounded transition-colors ${isRunning
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                }`}
                            title="重新检测"
                        >
                            <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </>
            )}

            {!assist.enabled && (
                <div className="text-xs text-slate-400 ml-auto">
                    关闭后仍可生成语义建议，但置信度可能降低
                </div>
            )}
        </div>
    );
};

export default SemanticAssistBar;
