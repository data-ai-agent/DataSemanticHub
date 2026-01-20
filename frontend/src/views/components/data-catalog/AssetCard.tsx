// ==========================================
// AssetCard Component
// ==========================================

import React from 'react';
import { Star, Eye, ExternalLink } from 'lucide-react';
import { Asset } from './types';

interface AssetCardProps {
    asset: Asset;
    isSelected?: boolean;
    isBatchMode?: boolean;
    isFavorite?: boolean;
    onSelect: () => void;
    onToggleFavorite: () => void;
    onViewDetail: () => void;
    getCategoryIcon: (categoryType: string) => React.ReactNode;
    getCategoryColor: (categoryType: string) => string;
}

export const AssetCard: React.FC<AssetCardProps> = ({
    asset,
    isSelected = false,
    isBatchMode = false,
    isFavorite = false,
    onSelect,
    onToggleFavorite,
    onViewDetail,
    getCategoryIcon,
    getCategoryColor
}) => {
    return (
        <div
            className={`bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all cursor-pointer group relative flex flex-col ${isBatchMode && isSelected
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
            onClick={isBatchMode ? onSelect : onViewDetail}
        >
            {/* Batch Mode Checkbox */}
            {isBatchMode && (
                <div className="absolute top-3 right-3 z-10">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                        }`}>
                        {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Card Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${getCategoryColor(asset.categoryType)}`}>
                        {getCategoryIcon(asset.categoryType)}
                    </div>

                    {/* Title & Code */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {asset.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{asset.code}</p>
                    </div>

                    {/* Quality Score Badge */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${asset.quality >= 90 ? 'bg-emerald-50 text-emerald-600' :
                            asset.quality >= 70 ? 'bg-blue-50 text-blue-600' :
                                'bg-orange-50 text-orange-600'
                        }`}>
                        <Star size={10} className="fill-current" />
                        <span>{asset.quality}</span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                    {asset.description}
                </p>
            </div>

            {/* Card Body - Metadata */}
            <div className="px-5 pb-4 flex-1">
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">负责人</span>
                        <span className="font-medium text-slate-600">{asset.owner}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">分类</span>
                        <span className="font-medium text-slate-600">{asset.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">数据量</span>
                        <span className="font-medium text-slate-600">{asset.dataVolume}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">更新频率</span>
                        <span className={`font-medium ${asset.updateFreq === '实时' ? 'text-emerald-600' :
                                asset.updateFreq === '准实时' ? 'text-orange-600' : 'text-slate-600'
                            }`}>
                            {asset.updateFreq}
                        </span>
                    </div>
                </div>
            </div>

            {/* Card Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                {/* Tags */}
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                    {asset.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium truncate">
                            {tag}
                        </span>
                    ))}
                    {asset.tags.length > 3 && (
                        <span className="text-slate-400 text-[10px]">+{asset.tags.length - 3}</span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-0.5 ml-2 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                        className={`p-1.5 rounded-lg transition-colors ${isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-slate-300 hover:text-yellow-500 hover:bg-yellow-50'
                            }`}
                        title={isFavorite ? '取消收藏' : '收藏'}
                    >
                        <Star size={14} className={isFavorite ? 'fill-current' : ''} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
                        className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看详情"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="申请使用"
                    >
                        <ExternalLink size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
