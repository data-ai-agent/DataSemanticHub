// ==========================================
// AssetList Component
// ==========================================

import React from 'react';
import { Star, Eye, ExternalLink, CheckCircle } from 'lucide-react';
import { Asset } from './types';

interface AssetListProps {
    assets: Asset[];
    isBatchMode?: boolean;
    selectedAssetIds: Set<string>;
    favorites: string[];
    onSelect: (asset: Asset) => void;
    onToggleFavorite: (assetId: string) => void;
    onViewDetail: (asset: Asset) => void;
    getCategoryIcon: (categoryType: string) => React.ReactNode;
    getCategoryColor: (categoryType: string) => string;
}

export const AssetList: React.FC<AssetListProps> = ({
    assets,
    isBatchMode = false,
    selectedAssetIds,
    favorites,
    onSelect,
    onToggleFavorite,
    onViewDetail,
    getCategoryIcon,
    getCategoryColor
}) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b-2 border-slate-200 sticky top-0 z-10">
                        <tr>
                            {isBatchMode && (
                                <th className="text-center py-4 px-3 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50 w-12">
                                    <CheckCircle size={18} className={`mx-auto ${selectedAssetIds.size === assets.length ? 'text-blue-600 fill-current' : 'text-slate-400'
                                        }`} />
                                </th>
                            )}
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">资产名称</th>
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">类型</th>
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">负责人</th>
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">分类</th>
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">数据量</th>
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">更新频率</th>
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">访问级别</th>
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">数据质量</th>
                            <th className="text-left py-4 px-5 font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/50">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => {
                            const isSelected = selectedAssetIds.has(asset.id);
                            const isFavorite = favorites.includes(asset.id);

                            return (
                                <tr
                                    key={asset.id}
                                    className={`border-b transition-colors ${isBatchMode && isSelected
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'border-slate-100 hover:bg-blue-50/50'
                                        }`}
                                >
                                    {isBatchMode && (
                                        <td className="py-4 px-3 text-center">
                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer mx-auto ${isSelected
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-white border-slate-300 hover:border-blue-400'
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelect(asset);
                                                }}
                                            >
                                                {isSelected && (
                                                    <CheckCircle size={14} className="text-white" />
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-lg shadow-sm ${getCategoryColor(asset.categoryType)}`}>
                                                {getCategoryIcon(asset.categoryType)}
                                            </div>
                                            <div
                                                className="cursor-pointer hover:text-blue-600 transition-colors flex-1 min-w-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDetail(asset);
                                                }}
                                            >
                                                <div className="font-semibold text-slate-800 truncate">{asset.name}</div>
                                                <div className="text-xs text-slate-500 font-mono truncate mt-0.5">{asset.code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(asset.categoryType)}`}>
                                            {asset.categoryType === 'business_object' ? '业务对象' :
                                                asset.categoryType === 'logical_view' ? '逻辑视图' : '接口'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5 text-sm text-slate-700">{asset.owner}</td>
                                    <td className="py-4 px-5 text-sm text-slate-700">{asset.category}</td>
                                    <td className="py-4 px-5 text-sm text-slate-700 font-medium">{asset.dataVolume}</td>
                                    <td className="py-4 px-5">
                                        <span className={`text-sm font-medium ${asset.updateFreq === '实时' ? 'text-emerald-600' :
                                                asset.updateFreq === '准实时' ? 'text-orange-600' : 'text-slate-600'
                                            }`}>
                                            {asset.updateFreq}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${asset.accessLevel === '公开' ? 'bg-green-100 text-green-700' :
                                                asset.accessLevel === '内部' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {asset.accessLevel}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-1.5">
                                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm font-bold text-slate-700">{asset.quality}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleFavorite(asset.id);
                                                }}
                                                className={`p-2.5 rounded-lg transition-all hover:scale-110 shadow-sm hover:shadow-md ${isFavorite
                                                        ? 'text-yellow-500 bg-yellow-50'
                                                        : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'
                                                    }`}
                                                title={isFavorite ? '取消收藏' : '收藏'}
                                            >
                                                <Star size={18} className={isFavorite ? 'fill-current' : ''} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDetail(asset);
                                                }}
                                                className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all hover:scale-110 shadow-sm hover:shadow-md"
                                                title="查看详情"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: 申请使用功能
                                                }}
                                                className="p-2.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all hover:scale-110 shadow-sm hover:shadow-md"
                                                title="申请使用"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
