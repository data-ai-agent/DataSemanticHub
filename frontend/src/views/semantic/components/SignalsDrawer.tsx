import React from 'react';
import { X, Shield, BarChart2, Activity, AlertTriangle, FileText, Download } from 'lucide-react';
import { FieldSemanticProfile } from '../../../types/semantic';
import { FieldProfileSnapshot } from '../../../services/profile';

interface SignalsDrawerProps {
    open: boolean;
    onClose: () => void;
    fieldProfile: FieldSemanticProfile;
    profileSnapshot?: FieldProfileSnapshot;
}

export const SignalsDrawer: React.FC<SignalsDrawerProps> = ({
    open,
    onClose,
    fieldProfile,
    profileSnapshot
}) => {
    if (!open) return null;

    const signals = profileSnapshot?.signals;
    const risks = profileSnapshot?.riskFlags || [];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Drawer Content */}
            <div className="relative w-[500px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Shield size={18} className="text-purple-600" />
                            质量信号详情
                        </h2>
                        <div className="text-xs text-slate-500 mt-0.5">
                            字段: <span className="font-mono font-medium text-slate-700">{fieldProfile.fieldName}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* 1. Risk Summary */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={16} className="text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">风险检测</h3>
                        </div>
                        {risks.length > 0 ? (
                            <div className="grid gap-3">
                                {risks.map(risk => (
                                    <div key={risk} className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                                        <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                        <div>
                                            <div className="text-sm font-medium text-red-900">{risk}</div>
                                            <div className="text-xs text-red-700 mt-1 opacity-80">
                                                {risk === 'HIGH_NULL' && '空值比例过高，可能非关键字段或数据质量差。'}
                                                {risk === 'ENUM_NOT_STABLE' && '枚举值分布离散，不建议作为标准状态字段。'}
                                                {risk === 'DIRTY_TYPE' && '数据类型与实际值存在冲突（如字符串存储数字）。'}
                                                {risk === 'SENSITIVE_L3' && '检测到潜在的 L3 级敏感数据，请注意合规。'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center gap-3 text-emerald-700">
                                <Shield size={16} className="text-emerald-500" />
                                <span className="text-sm font-medium">未检测到明显质量风险</span>
                            </div>
                        )}
                    </section>

                    {/* 2. Statistical Profile */}
                    {signals ? (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart2 size={16} className="text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">统计特征</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <StatBox label="行数 (Rows)" value={signals.rowCount?.toLocaleString() || '-'} />
                                <StatBox label="空值率 (Null Ratio)" value={`${(signals.nullRatio * 100).toFixed(1)}%`} />
                                <StatBox label="唯一值 (Distinct)" value={signals.distinctCount} />
                                <StatBox label="Top3 集中度" value={`${(signals.top3Concentration * 100).toFixed(1)}%`} />
                                <StatBox label="有效解析率" value={`${(signals.typeParseRate ? (signals.typeParseRate * 100).toFixed(1) : 100)}%`} />
                            </div>
                        </section>
                    ) : (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            暂无统计数据，请运行 Profile。
                        </div>
                    )}

                    {/* 3. Top Values Distribution */}
                    {signals && signals.topValues && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={16} className="text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Top 值分布</h3>
                            </div>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left">值</th>
                                            <th className="px-4 py-2 text-right">频率</th>
                                            <th className="px-4 py-2 text-right">占比</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {signals.topValues.map((v, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 font-mono text-slate-700">{v.value}</td>
                                                <td className="px-4 py-2 text-right text-slate-500">{v.count}</td>
                                                <td className="px-4 py-2 text-right text-slate-500">
                                                    {Math.round(v.ratio * 100)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* 4. Metadata Evidence */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={16} className="text-slate-400" />
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">元数据证据</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-4 text-sm">
                                <span className="w-24 text-slate-500 shrink-0">物理类型</span>
                                <span className="font-mono text-slate-700">{fieldProfile.dataType}</span>
                            </div>
                            <div className="flex items-start gap-4 text-sm">
                                <span className="w-24 text-slate-500 shrink-0">业务定义</span>
                                <span className="text-slate-700">{fieldProfile.businessDefinition || '-'}</span>
                            </div>
                            <div className="flex items-start gap-4 text-sm">
                                <span className="w-24 text-slate-500 shrink-0">置信度</span>
                                {fieldProfile.roleConfidence ? (
                                    <span className={`font-medium ${fieldProfile.roleConfidence > 80 ? 'text-blue-600' :
                                        fieldProfile.roleConfidence > 60 ? 'text-amber-600' : 'text-red-600'
                                        }`}>
                                        {fieldProfile.roleConfidence}%
                                    </span>
                                ) : '-'}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                        Generated by SemanticProfiler v2.4
                    </span>
                    <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        <Download size={14} /> 导出分析报告
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper
const StatBox = ({ label, value }: { label: string; value: string | number }) => (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="text-lg font-bold text-slate-800">{value}</div>
    </div>
);
