// ==========================================
// AdvancedFilter Component
// ==========================================

import React from 'react';
import {
    X, Gauge, Database, Layers, Lock, Clock, Sparkles, Key, Activity,
    Sliders
} from 'lucide-react';
import { FilterOptions, SavedFilter } from './types';

interface AdvancedFilterProps {
    filterOptions: FilterOptions;
    setFilterOptions: (options: FilterOptions) => void;
    savedFilters: SavedFilter[];
    setSavedFilters: (filters: SavedFilter[]) => void;
    allOwners: string[];
    allCategories: string[];
    allAccessLevels: string[];
    allUpdateFreqs: string[];
    allTags: string[];
    allApplications: string[];
    onClose: () => void;
    onApplyFilterPreset: (preset: SavedFilter) => void;
    onDeleteFilterPreset: (id: string) => void;
    onSaveFilterPreset: () => void;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
    filterOptions,
    setFilterOptions,
    savedFilters,
    setSavedFilters,
    allOwners,
    allCategories,
    allAccessLevels,
    allUpdateFreqs,
    allTags,
    allApplications,
    onClose,
    onApplyFilterPreset,
    onDeleteFilterPreset,
    onSaveFilterPreset
}) => {
    // 计算已选择的筛选条件数量
    const activeFilterCount = filterOptions.owners.length +
        filterOptions.categories.length +
        filterOptions.accessLevels.length +
        filterOptions.updateFreqs.length +
        filterOptions.tags.length +
        filterOptions.applications.length +
        (filterOptions.hasSensitiveFields ? 1 : 0) +
        (filterOptions.hasPrimaryKey ? 1 : 0) +
        (filterOptions.qualityRange.min > 0 || filterOptions.qualityRange.max < 100 ? 1 : 0);

    // 获取已激活的筛选标签
    const getActiveFilters = () => {
        const activeFilters: Array<{ label: string, value: string, onRemove: () => void }> = [];

        if (filterOptions.qualityRange.min > 0 || filterOptions.qualityRange.max < 100) {
            activeFilters.push({
                label: '数据质量',
                value: `${filterOptions.qualityRange.min}-${filterOptions.qualityRange.max}`,
                onRemove: () => setFilterOptions({ ...filterOptions, qualityRange: { min: 0, max: 100 } })
            });
        }

        filterOptions.owners.forEach(owner => {
            activeFilters.push({
                label: '负责人',
                value: owner,
                onRemove: () => setFilterOptions({
                    ...filterOptions,
                    owners: filterOptions.owners.filter(o => o !== owner)
                })
            });
        });

        filterOptions.categories.forEach(cat => {
            activeFilters.push({
                label: '分类',
                value: cat,
                onRemove: () => setFilterOptions({
                    ...filterOptions,
                    categories: filterOptions.categories.filter(c => c !== cat)
                })
            });
        });

        filterOptions.accessLevels.forEach(level => {
            activeFilters.push({
                label: '访问级别',
                value: level,
                onRemove: () => setFilterOptions({
                    ...filterOptions,
                    accessLevels: filterOptions.accessLevels.filter(l => l !== level)
                })
            });
        });

        filterOptions.updateFreqs.forEach(freq => {
            activeFilters.push({
                label: '更新频率',
                value: freq,
                onRemove: () => setFilterOptions({
                    ...filterOptions,
                    updateFreqs: filterOptions.updateFreqs.filter(f => f !== freq)
                })
            });
        });

        filterOptions.tags.forEach(tag => {
            activeFilters.push({
                label: '标签',
                value: tag,
                onRemove: () => setFilterOptions({
                    ...filterOptions,
                    tags: filterOptions.tags.filter(t => t !== tag)
                })
            });
        });

        filterOptions.applications.forEach(app => {
            activeFilters.push({
                label: '应用场景',
                value: app,
                onRemove: () => setFilterOptions({
                    ...filterOptions,
                    applications: filterOptions.applications.filter(a => a !== app)
                })
            });
        });

        if (filterOptions.hasSensitiveFields) {
            activeFilters.push({
                label: '字段特性',
                value: '包含敏感字段',
                onRemove: () => setFilterOptions({ ...filterOptions, hasSensitiveFields: false })
            });
        }

        if (filterOptions.hasPrimaryKey) {
            activeFilters.push({
                label: '字段特性',
                value: '包含主键字段',
                onRemove: () => setFilterOptions({ ...filterOptions, hasPrimaryKey: false })
            });
        }

        return activeFilters;
    };

    const activeFilters = getActiveFilters();

    const clearAllFilters = () => {
        setFilterOptions({
            qualityRange: { min: 0, max: 100 },
            owners: [],
            categories: [],
            accessLevels: [],
            updateFreqs: [],
            tags: [],
            hasSensitiveFields: false,
            hasPrimaryKey: false,
            applications: []
        });
    };

    return (
        <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg p-6 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Sliders size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">高级筛选</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {activeFilterCount > 0 ? `已选择 ${activeFilterCount} 个筛选条件` : '选择筛选条件以精确查找数据资产'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* 保存的筛选条件 */}
                    {savedFilters.length > 0 && (
                        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-2">
                            <span className="text-xs text-slate-500">快捷筛选：</span>
                            {savedFilters.map(filter => (
                                <div key={filter.id} className="flex items-center gap-1 group">
                                    <button
                                        onClick={() => onApplyFilterPreset(filter)}
                                        className="px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                                    >
                                        {filter.name}
                                    </button>
                                    <button
                                        onClick={() => onDeleteFilterPreset(filter.id)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                        title="删除"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={onSaveFilterPreset}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
                        title="保存当前筛选条件"
                    >
                        <Sliders size={12} />
                        保存筛选
                    </button>
                    <button
                        onClick={clearAllFilters}
                        className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        清除所有筛选条件
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="关闭"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* 已选择的筛选条件标签 */}
            {activeFilters.length > 0 && (
                <div className="mb-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-500">已选条件：</span>
                        {activeFilters.map((filter, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200"
                            >
                                <span className="text-blue-500">{filter.label}:</span>
                                <span>{filter.value}</span>
                                <button
                                    onClick={filter.onRemove}
                                    className="hover:bg-blue-100 rounded p-0.5 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {/* 质量范围 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Gauge size={16} className="text-blue-600" />
                        数据质量
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filterOptions.qualityRange.min}
                            onChange={(e) => setFilterOptions({
                                ...filterOptions,
                                qualityRange: { ...filterOptions.qualityRange, min: parseInt(e.target.value) }
                            })}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={filterOptions.qualityRange.min}
                            onChange={(e) => setFilterOptions({
                                ...filterOptions,
                                qualityRange: { ...filterOptions.qualityRange, min: Math.min(parseInt(e.target.value) || 0, filterOptions.qualityRange.max) }
                            })}
                            className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 bg-white"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={filterOptions.qualityRange.max}
                            onChange={(e) => setFilterOptions({
                                ...filterOptions,
                                qualityRange: { ...filterOptions.qualityRange, max: Math.max(parseInt(e.target.value) || 100, filterOptions.qualityRange.min) }
                            })}
                            className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 bg-white"
                        />
                    </div>
                </div>

                {/* 负责人 */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-100">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Database size={16} className="text-emerald-600" />
                        负责人
                    </label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {allOwners.map(owner => (
                            <label
                                key={owner}
                                className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white/50 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={filterOptions.owners.includes(owner)}
                                    onChange={(e) => {
                                        const newOwners = e.target.checked
                                            ? [...filterOptions.owners, owner]
                                            : filterOptions.owners.filter(o => o !== owner);
                                        setFilterOptions({ ...filterOptions, owners: newOwners });
                                    }}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700">{owner}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 数据分类 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Layers size={16} className="text-purple-600" />
                        数据分类
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {allCategories.map(category => (
                            <button
                                key={category}
                                onClick={() => {
                                    const newCategories = filterOptions.categories.includes(category)
                                        ? filterOptions.categories.filter(c => c !== category)
                                        : [...filterOptions.categories, category];
                                    setFilterOptions({ ...filterOptions, categories: newCategories });
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterOptions.categories.includes(category)
                                        ? 'bg-purple-600 text-white shadow-md scale-105'
                                        : 'bg-white text-slate-600 border border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 访问级别 */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-100">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Lock size={16} className="text-orange-600" />
                        访问级别
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {allAccessLevels.map(level => {
                            const colorMap: Record<string, string> = {
                                '公开': 'bg-green-600',
                                '内部': 'bg-blue-600',
                                '受限': 'bg-orange-600'
                            };
                            return (
                                <button
                                    key={level}
                                    onClick={() => {
                                        const newLevels = filterOptions.accessLevels.includes(level)
                                            ? filterOptions.accessLevels.filter(l => l !== level)
                                            : [...filterOptions.accessLevels, level];
                                        setFilterOptions({ ...filterOptions, accessLevels: newLevels });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterOptions.accessLevels.includes(level)
                                            ? `${colorMap[level] || 'bg-slate-600'} text-white shadow-md scale-105`
                                            : 'bg-white text-slate-600 border border-orange-200 hover:bg-orange-50 hover:border-orange-300'
                                        }`}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 更新频率 */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-100">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Clock size={16} className="text-cyan-600" />
                        更新频率
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {allUpdateFreqs.map(freq => {
                            const freqColorMap: Record<string, string> = {
                                '实时': 'bg-emerald-600',
                                '准实时': 'bg-blue-600',
                                '日更新': 'bg-cyan-600',
                                '周更新': 'bg-indigo-600',
                                '月更新': 'bg-purple-600',
                                '按需更新': 'bg-slate-600'
                            };
                            return (
                                <button
                                    key={freq}
                                    onClick={() => {
                                        const newFreqs = filterOptions.updateFreqs.includes(freq)
                                            ? filterOptions.updateFreqs.filter(f => f !== freq)
                                            : [...filterOptions.updateFreqs, freq];
                                        setFilterOptions({ ...filterOptions, updateFreqs: newFreqs });
                                    }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterOptions.updateFreqs.includes(freq)
                                            ? `${freqColorMap[freq] || 'bg-slate-600'} text-white shadow-md scale-105`
                                            : 'bg-white text-slate-600 border border-cyan-200 hover:bg-cyan-50 hover:border-cyan-300'
                                        }`}
                                >
                                    {freq}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 标签 */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-lg border border-pink-100">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Sparkles size={16} className="text-pink-600" />
                        标签
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {allTags.slice(0, 12).map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    const newTags = filterOptions.tags.includes(tag)
                                        ? filterOptions.tags.filter(t => t !== tag)
                                        : [...filterOptions.tags, tag];
                                    setFilterOptions({ ...filterOptions, tags: newTags });
                                }}
                                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${filterOptions.tags.includes(tag)
                                        ? 'bg-pink-600 text-white shadow-md scale-105'
                                        : 'bg-white text-slate-600 border border-pink-200 hover:bg-pink-50 hover:border-pink-300'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 字段特性 */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-4 rounded-lg border border-indigo-100">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Key size={16} className="text-indigo-600" />
                        字段特性
                    </label>
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={filterOptions.hasSensitiveFields}
                                onChange={(e) => setFilterOptions({
                                    ...filterOptions,
                                    hasSensitiveFields: e.target.checked
                                })}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-1.5">
                                <Lock size={14} className="text-orange-500" />
                                <span className="text-sm text-slate-700 font-medium">包含敏感字段</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={filterOptions.hasPrimaryKey}
                                onChange={(e) => setFilterOptions({
                                    ...filterOptions,
                                    hasPrimaryKey: e.target.checked
                                })}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-1.5">
                                <Key size={14} className="text-amber-500" />
                                <span className="text-sm text-slate-700 font-medium">包含主键字段</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 应用场景 */}
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-lg border border-teal-100">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Activity size={16} className="text-teal-600" />
                        应用场景
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {allApplications.slice(0, 10).map(app => (
                            <button
                                key={app}
                                onClick={() => {
                                    const newApps = filterOptions.applications.includes(app)
                                        ? filterOptions.applications.filter(a => a !== app)
                                        : [...filterOptions.applications, app];
                                    setFilterOptions({ ...filterOptions, applications: newApps });
                                }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterOptions.applications.includes(app)
                                        ? 'bg-teal-600 text-white shadow-md scale-105'
                                        : 'bg-white text-slate-600 border border-teal-200 hover:bg-teal-50 hover:border-teal-300'
                                    }`}
                            >
                                {app}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
