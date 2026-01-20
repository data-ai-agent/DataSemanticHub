// ==========================================
// AssetDetail Component
// ==========================================

import React, { useState } from 'react';
import {
    Eye, X, ArrowRight, Hash, Search, Key, Info, CheckCircle2, XCircle,
    Lock, FileJson, Star, Gauge, CheckCircle, Clock, BarChart3, Shield,
    Zap, Target, AlertCircle, FileCheck, AlertTriangle
} from 'lucide-react';
import { Asset, DetailTab } from './types';

interface AssetDetailProps {
    asset: Asset;
    isOpen: boolean;
    onClose: () => void;
    mode: 'drawer' | 'modal';
    detailTab: DetailTab;
    setDetailTab: (tab: DetailTab) => void;
    getCategoryIcon: (categoryType: string) => React.ReactNode;
    getCategoryColor: (categoryType: string) => string;
    generateSampleData: (asset: Asset, count: number) => any[];
}

export const AssetDetail: React.FC<AssetDetailProps> = ({
    asset,
    isOpen,
    onClose,
    mode,
    detailTab,
    setDetailTab,
    getCategoryIcon,
    getCategoryColor,
    generateSampleData
}) => {
    const [fieldSearchTerm, setFieldSearchTerm] = useState('');

    if (!isOpen) return null;

    const isDrawer = mode === 'drawer';
    const containerClassName = isDrawer
        ? "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end"
        : "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4";

    const contentClassName = isDrawer
        ? "w-[1200px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out"
        : "bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col";

    return (
        <div className={containerClassName} onClick={onClose}>
            <div className={contentClassName} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={`border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-white flex-shrink-0 ${!isDrawer ? 'bg-slate-50' : ''
                    }`}>
                    {isDrawer ? (
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <Eye size={16} />
                            资产详情
                        </h4>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getCategoryColor(asset.categoryType)}`}>
                                {getCategoryIcon(asset.categoryType)}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{asset.name}</h3>
                                <p className="text-sm text-slate-500">{asset.type}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded p-1 transition-colors"
                    >
                        <X size={isDrawer ? 16 : 20} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className={`border-b border-slate-200 bg-white px-${isDrawer ? '4' : '6'} flex-shrink-0`}>
                    <div className="flex gap-1">
                        {(['basic', 'fields', 'sample', 'quality'] as DetailTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setDetailTab(tab)}
                                className={`px-${isDrawer ? '3' : '4'} py-${isDrawer ? '2' : '3'} text-sm font-medium border-b-2 transition-colors ${detailTab === tab
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab === 'basic' && '基本信息'}
                                {tab === 'fields' && '字段信息'}
                                {tab === 'sample' && '样例数据'}
                                {tab === 'quality' && '数据质量'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar ${isDrawer ? 'p-4' : 'p-6'}`}>
                    {/* Basic Info Tab */}
                    {detailTab === 'basic' && (
                        <div className={`space-y-${isDrawer ? '4' : '6'}`}>
                            {isDrawer && (
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${getCategoryColor(asset.categoryType)}`}>
                                        {getCategoryIcon(asset.categoryType)}
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-slate-800">{asset.name}</h5>
                                        <p className="text-sm text-slate-600 mt-1">{asset.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-slate-500">{asset.owner}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`grid grid-cols-1 gap-${isDrawer ? '3' : '4'} text-sm`}>
                                <div className="bg-slate-50 p-3 rounded">
                                    <div className="text-xs text-slate-500 mb-1">资产编码</div>
                                    <div className="font-mono text-slate-700">{asset.code}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded">
                                    <div className="text-xs text-slate-500 mb-1">{isDrawer ? '' : '负责人'}{!isDrawer && <br />}数据分类</div>
                                    <div className="font-medium text-slate-700">{asset.category}</div>
                                </div>
                                {!isDrawer && (
                                    <>
                                        <div className="bg-slate-50 p-3 rounded">
                                            <div className="text-xs text-slate-500 mb-1">负责人</div>
                                            <div className="font-medium text-slate-700">{asset.owner}</div>
                                        </div>
                                    </>
                                )}
                                <div className="bg-slate-50 p-3 rounded">
                                    <div className="text-xs text-slate-500 mb-1">数据量</div>
                                    <div className="font-medium text-slate-700">{asset.dataVolume}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded">
                                    <div className="text-xs text-slate-500 mb-1">更新频率</div>
                                    <div className={`font-medium ${asset.updateFreq === '实时' ? 'text-emerald-600' :
                                            asset.updateFreq === '准实时' ? 'text-orange-600' : 'text-slate-600'
                                        }`}>{asset.updateFreq}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded">
                                    <div className="text-xs text-slate-500 mb-1">访问级别</div>
                                    <div className={`font-medium ${asset.accessLevel === '公开' ? 'text-green-600' :
                                            asset.accessLevel === '内部' ? 'text-blue-600' :
                                                'text-orange-600'
                                        }`}>{asset.accessLevel}</div>
                                </div>
                                {asset.format && (
                                    <div className="bg-slate-50 p-3 rounded">
                                        <div className="text-xs text-slate-500 mb-1">数据格式</div>
                                        <div className="font-medium text-slate-700">{asset.format}</div>
                                    </div>
                                )}
                            </div>

                            {!isDrawer && (
                                <div>
                                    <h4 className="font-bold text-sm text-slate-700 mb-2">资产描述</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{asset.description}</p>
                                </div>
                            )}

                            {asset.tags && asset.tags.length > 0 && (
                                <div>
                                    <div className={`text-sm font-bold text-slate-700 mb-2`}>
                                        {isDrawer ? '资产标签' : <h4>资产标签</h4>}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {asset.tags.map((tag: string) => (
                                            <span key={tag} className={`bg-slate-100 text-slate-600 ${isDrawer ? 'text-xs' : 'text-sm'} px-2 py-1 rounded`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {asset.applications && asset.applications.length > 0 && (
                                <div>
                                    <div className={`text-sm font-bold text-slate-700 mb-2`}>
                                        {isDrawer ? '应用场景' : <h4>应用场景</h4>}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {asset.applications.map((app: string) => (
                                            <span key={app} className={`bg-blue-100 text-blue-700 ${isDrawer ? 'text-xs' : 'text-sm'} px-2 py-1 rounded`}>
                                                {app}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {asset.lineage && asset.lineage.length > 0 && (
                                <div>
                                    <div className={`text-sm font-bold text-slate-700 mb-2`}>
                                        {isDrawer ? '数据血缘' : <h4>数据血缘</h4>}
                                    </div>
                                    <div className={`space-y-${isDrawer ? '1' : '2'}`}>
                                        {asset.lineage.map((item: string, index: number) => (
                                            <div key={index} className={`flex items-center gap-2 ${isDrawer ? 'text-xs' : 'text-sm'} p-2 bg-slate-50 rounded`}>
                                                <ArrowRight size={isDrawer ? 12 : 14} className="text-slate-400" />
                                                <span className="text-slate-600">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fields Tab */}
                    {detailTab === 'fields' && asset.fields && asset.fields.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Hash size={18} className="text-blue-600" />
                                    <span className="text-base font-bold text-slate-700">字段信息</span>
                                    <span className="text-sm text-slate-500">({asset.fields.length})</span>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        value={fieldSearchTerm}
                                        onChange={(e) => setFieldSearchTerm(e.target.value)}
                                        placeholder="搜索字段名、编码..."
                                        className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 w-56"
                                    />
                                </div>
                            </div>

                            {/* Fields Table */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b-2 border-slate-200">
                                            <tr>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">字段名称</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">字段编码</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">数据类型</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">业务类型</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">长度</th>
                                                <th className="text-center py-3 px-4 font-semibold text-slate-700">必填</th>
                                                <th className="text-center py-3 px-4 font-semibold text-slate-700">主键</th>
                                                <th className="text-center py-3 px-4 font-semibold text-slate-700">索引</th>
                                                <th className="text-center py-3 px-4 font-semibold text-slate-700">敏感</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">描述</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {asset.fields
                                                .filter((field: any) => {
                                                    if (!fieldSearchTerm) return true;
                                                    const search = fieldSearchTerm.toLowerCase();
                                                    return (field.name || '').toLowerCase().includes(search) ||
                                                        (field.code || '').toLowerCase().includes(search);
                                                })
                                                .map((field: any, index: number) => (
                                                    <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-slate-800">{field.name || '-'}</span>
                                                                {field.primaryKey && (
                                                                    <Key size={14} className="text-amber-500" title="主键" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                                {field.code || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-slate-700 font-mono text-xs">{field.type || '-'}</span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-slate-600">{field.businessType || field.type || '-'}</span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-slate-600">{field.length || '-'}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {field.nullable === false ? (
                                                                <CheckCircle2 size={16} className="text-emerald-600 mx-auto" title="必填" />
                                                            ) : (
                                                                <XCircle size={16} className="text-slate-300 mx-auto" title="可选" />
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {field.primaryKey ? (
                                                                <Key size={16} className="text-amber-600 mx-auto" title="主键" />
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {field.indexed ? (
                                                                <Hash size={16} className="text-blue-600 mx-auto" title="已索引" />
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            {field.sensitive ? (
                                                                <Lock size={16} className="text-orange-600 mx-auto" title="敏感字段" />
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 max-w-xs">
                                                            <div className="flex items-start gap-1">
                                                                {field.description && (
                                                                    <>
                                                                        <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                                        <span className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                                                                            {field.description}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {!field.description && (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Field Statistics */}
                            <div className="grid grid-cols-4 gap-3 pt-2">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="text-xs text-blue-600 mb-1">总字段数</div>
                                    <div className="text-lg font-bold text-blue-700">{asset.fields.length}</div>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <div className="text-xs text-orange-600 mb-1">敏感字段</div>
                                    <div className="text-lg font-bold text-orange-700">
                                        {asset.fields.filter((f: any) => f.sensitive).length}
                                    </div>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    <div className="text-xs text-amber-600 mb-1">主键字段</div>
                                    <div className="text-lg font-bold text-amber-700">
                                        {asset.fields.filter((f: any) => f.primaryKey).length}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                    <div className="text-xs text-emerald-600 mb-1">必填字段</div>
                                    <div className="text-lg font-bold text-emerald-700">
                                        {asset.fields.filter((f: any) => f.nullable === false).length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sample Data Tab */}
                    {detailTab === 'sample' && (
                        <div className={`space-y-${isDrawer ? '3' : '4'}`}>
                            <div className={`text-sm font-bold text-slate-700 flex items-center gap-2`}>
                                <FileJson size={16} />
                                样例数据（显示10条）
                            </div>
                            {asset.fields && asset.fields.length > 0 ? (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    {asset.fields.map((field: any, idx: number) => (
                                                        <th
                                                            key={idx}
                                                            className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap"
                                                        >
                                                            {field.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {generateSampleData(asset, 10).map((record: any, rowIdx: number) => (
                                                    <tr
                                                        key={rowIdx}
                                                        className="hover:bg-slate-50 transition-colors"
                                                    >
                                                        {asset.fields!.map((field: any, colIdx: number) => (
                                                            <td
                                                                key={colIdx}
                                                                className="px-4 py-2 text-slate-600 whitespace-nowrap"
                                                            >
                                                                {String(record[field.name] ?? '-')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    暂无字段信息
                                </div>
                            )}
                            <button className={`w-full ${isDrawer ? 'px-3 py-2' : 'px-4 py-2'} text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2`}>
                                <FileJson size={14} />
                                下载完整样例
                            </button>
                        </div>
                    )}

                    {/* Quality Tab */}
                    {detailTab === 'quality' && (
                        <div className={`space-y-${isDrawer ? '4' : '6'}`}>
                            {/* Quality Score */}
                            <div className={`bg-gradient-to-r from-blue-50 to-purple-50 ${isDrawer ? 'p-5' : 'p-6'} rounded-lg border border-blue-200`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Star className="text-yellow-500" size={isDrawer ? 20 : 22} />
                                        <div className={`${isDrawer ? 'text-base' : 'text-lg'} font-bold text-slate-700`}>数据质量综合评分</div>
                                    </div>
                                    <div className={`${isDrawer ? 'text-3xl' : 'text-4xl'} font-bold text-blue-600`}>{asset.quality}/100</div>
                                </div>
                                <div className={`w-full bg-slate-200 rounded-full ${isDrawer ? 'h-4' : 'h-5'}`}>
                                    <div
                                        className={`${isDrawer ? 'h-4' : 'h-5'} rounded-full transition-all ${asset.quality >= 90 ? 'bg-emerald-500' :
                                                asset.quality >= 70 ? 'bg-blue-500' : 'bg-orange-500'
                                            }`}
                                        style={{ width: `${asset.quality}%` }}
                                    ></div>
                                </div>
                                <div className={`mt-2 ${isDrawer ? 'text-xs' : 'text-sm'} text-slate-500`}>
                                    最后评估时间：{new Date().toLocaleDateString('zh-CN')}
                                </div>
                            </div>

                            {/* Quality Dimensions */}
                            <div>
                                <div className={`flex items-center gap-2 ${isDrawer ? 'mb-3' : 'mb-4'}`}>
                                    <Target size={isDrawer ? 18 : 20} className="text-blue-600" />
                                    <div className={`${isDrawer ? 'text-base' : 'text-lg'} font-bold text-slate-700`}>质量维度指标（六性）</div>
                                </div>
                                <div className={`grid grid-cols-2 gap-${isDrawer ? '3' : '4'}`}>
                                    {[
                                        { name: '完整性', icon: Gauge, color: 'blue', value: 95, desc: '缺失值: 2.5% | 空值率: 2.5%' },
                                        { name: '准确性', icon: CheckCircle, color: 'emerald', value: 98, desc: '格式错误: 1.2% | 逻辑错误: 0.8%' },
                                        { name: '及时性', icon: Clock, color: 'purple', value: 92, desc: '延迟更新: 6% | 超时率: 2%' },
                                        { name: '一致性', icon: BarChart3, color: 'orange', value: 96, desc: '格式不一致: 2.5% | 标准不一致: 1.5%' },
                                        { name: '有效性', icon: Shield, color: 'indigo', value: 94, desc: '无效值: 4% | 异常值: 2%' },
                                        { name: '唯一性', icon: Zap, color: 'cyan', value: 99, desc: '重复记录: 0.8% | 主键冲突: 0.2%' }
                                    ].map((dim, idx) => {
                                        const IconComponent = dim.icon;
                                        return (
                                            <div key={idx} className={`bg-gradient-to-br from-${dim.color}-50 to-${dim.color}-100 ${isDrawer ? 'p-4' : 'p-5'} rounded-lg border border-${dim.color}-200`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <IconComponent size={isDrawer ? 18 : 20} className={`text-${dim.color}-600`} />
                                                        <span className={`text-sm font-semibold text-slate-700`}>{dim.name}</span>
                                                    </div>
                                                    <span className={`${isDrawer ? 'text-xl' : 'text-2xl'} font-bold text-${dim.color}-700`}>{dim.value}%</span>
                                                </div>
                                                <div className={`w-full bg-${dim.color}-200 rounded-full ${isDrawer ? 'h-2' : 'h-2.5'}`}>
                                                    <div className={`bg-${dim.color}-600 ${isDrawer ? 'h-2' : 'h-2.5'} rounded-full`} style={{ width: `${dim.value}%` }}></div>
                                                </div>
                                                <div className={`text-xs text-slate-600 ${isDrawer ? 'mt-1' : 'mt-2'}`}>{dim.desc}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quality Assessment */}
                            <div className={`bg-slate-50 ${isDrawer ? 'p-4' : 'p-5'} rounded-lg border border-slate-200`}>
                                <div className={`flex items-center gap-2 ${isDrawer ? 'mb-3' : 'mb-3'}`}>
                                    <AlertCircle size={isDrawer ? 18 : 20} className="text-blue-600" />
                                    <div className={`${isDrawer ? 'text-base' : 'text-lg'} font-bold text-slate-700`}>质量评估</div>
                                </div>
                                <div className={`${isDrawer ? 'p-3' : 'p-4'} rounded-lg ${asset.quality >= 90 ? 'bg-emerald-50 border border-emerald-200' :
                                        asset.quality >= 70 ? 'bg-blue-50 border border-blue-200' :
                                            'bg-orange-50 border border-orange-200'
                                    }`}>
                                    <div className={`${isDrawer ? 'text-sm' : 'text-base'} font-medium ${asset.quality >= 90 ? 'text-emerald-700' :
                                            asset.quality >= 70 ? 'text-blue-700' :
                                                'text-orange-700'
                                        }`}>
                                        {asset.quality >= 90 ?
                                            '✓ 数据质量优秀，可用于生产环境，建议持续监控' :
                                            asset.quality >= 70 ?
                                                '⚠ 数据质量良好，建议持续监控和改进' :
                                                '✗ 数据质量需要改进，建议进行数据清洗和治理'}
                                    </div>
                                </div>
                            </div>

                            {/* Quality Rules */}
                            <div className={`bg-slate-50 ${isDrawer ? 'p-4' : 'p-5'} rounded-lg border border-slate-200`}>
                                <div className={`flex items-center gap-2 ${isDrawer ? 'mb-3' : 'mb-3'}`}>
                                    <FileCheck size={isDrawer ? 18 : 20} className="text-blue-600" />
                                    <div className={`${isDrawer ? 'text-base' : 'text-lg'} font-bold text-slate-700`}>质量规则</div>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { icon: CheckCircle2, color: 'emerald', text: '主键字段不能为空' },
                                        { icon: CheckCircle2, color: 'emerald', text: '身份证号格式验证（18位）' },
                                        { icon: CheckCircle2, color: 'emerald', text: '日期字段格式验证（YYYY-MM-DD）' },
                                        { icon: AlertTriangle, color: 'orange', text: '数据更新延迟不能超过1小时' }
                                    ].map((rule, idx) => {
                                        const IconComponent = rule.icon;
                                        return (
                                            <div key={idx} className={`flex items-center gap-2 ${isDrawer ? 'text-sm' : 'text-sm'} bg-white ${isDrawer ? 'p-2' : 'p-3'} rounded border border-slate-200`}>
                                                <IconComponent size={isDrawer ? 16 : 18} className={`text-${rule.color}-500`} />
                                                <span className="text-slate-700">{rule.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer (only for modal) */}
                {!isDrawer && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                        >
                            关闭
                        </button>
                        <button className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors">
                            申请使用
                        </button>
                        <button className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                            下载样例
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
