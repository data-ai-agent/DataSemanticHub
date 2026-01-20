import React from 'react';

interface AnalysisLoadingSkeletonProps {
    text?: string;
}

export const AnalysisLoadingSkeleton: React.FC<AnalysisLoadingSkeletonProps> = ({
    text = "正在分析业务场景，提取核心要素..."
}) => {
    return (
        <div className="bg-white rounded-xl border border-indigo-100 p-6 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-indigo-100 animate-pulse"></div>
                <div className="h-5 bg-indigo-50 rounded w-48 animate-pulse"></div>
            </div>

            <div className="space-y-6">
                {/* 提取进度示意 */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>{text}</span>
                        <span className="animate-pulse">Analyzing...</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full w-2/3 animate-[loading_1.5s_ease-in-out_infinite]"></div>
                    </div>
                </div>

                {/* 要素骨架 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-4 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
                            <div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div>
                            <div className="flex flex-wrap gap-2">
                                <div className="h-6 bg-white rounded w-16 animate-pulse"></div>
                                <div className="h-6 bg-white rounded w-24 animate-pulse"></div>
                                <div className="h-6 bg-white rounded w-12 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
