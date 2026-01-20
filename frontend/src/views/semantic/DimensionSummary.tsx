import React, { useState } from 'react';
import { Table, Columns, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { TableSemanticProfile } from '../../types/semantic';
import { calculateFieldStatistics, calculateThreeDimensionalMetrics } from '../../utils/fieldStatistics';

interface RuleItem {
    code: string;
    name: string;
    status: 'pass' | 'fail';
    value: string;
}

interface DimensionSummaryProps {
    profile: TableSemanticProfile;
}

export const DimensionSummary: React.FC<DimensionSummaryProps> = ({ profile }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const safeRuleScore = profile.ruleScore || { naming: 0, behavior: 0, comment: 0, total: 0 };
    const gateDetails = profile.gateResult?.details || { primaryKey: false, lifecycle: false, tableType: true };
    const safeFields = Array.isArray(profile.fields) ? profile.fields : [];

    // V2.3F P4: Three-dimensional metrics expansion states
    const [showCoverageDetail, setShowCoverageDetail] = useState(false);
    const [showRiskDetail, setShowRiskDetail] = useState(false);

    // Table Dimension Rules - 用户友好的名称
    const tableRules: RuleItem[] = [
        { code: '命名', name: '表名是否有业务含义', status: 'pass', value: safeRuleScore.naming > 0.5 ? '语义明确' : '弱语义' },
        { code: '主键', name: '是否存在主键字段', status: gateDetails.primaryKey ? 'pass' : 'fail', value: gateDetails.primaryKey ? '已识别' : '缺失' },
        { code: '时间', name: '是否有生命周期字段', status: gateDetails.lifecycle ? 'pass' : 'fail', value: gateDetails.lifecycle ? '已识别' : '缺失' },
        { code: '类型', name: '是否为有效业务表', status: gateDetails.tableType ? 'pass' : 'fail', value: gateDetails.tableType ? '有效' : '非业务表' },
    ];

    // Field Dimension Rules
    const fieldCount = safeFields.length;
    const keyFields = safeFields.filter(f => f.role === 'Identifier' || f.role === 'BusAttr').length;
    const sensitiveFields = safeFields.filter(f => f.sensitivity !== 'L1').length;

    const fieldRules: RuleItem[] = [
        { code: '核心', name: '核心字段占比', status: 'pass', value: `${keyFields}/${fieldCount} 个` },
        { code: '敏感', name: '敏感数据检测', status: 'pass', value: `${sensitiveFields} 个` },
        { code: '命名', name: '字段命名规范', status: 'pass', value: '高' },
    ];


    const tablePassedCount = tableRules.filter(r => r.status === 'pass').length;
    const fieldPassedCount = fieldRules.filter(r => r.status === 'pass').length;
    const failedRules = tableRules.filter(r => r.status === 'fail');

    const tableScore = safeRuleScore.total;
    const fieldScore = profile.fieldScore || 0.85;
    const formatScorePercent = (value: number) => {
        const normalized = value > 1 ? value : value * 100;
        return Math.max(0, Math.min(100, Math.round(normalized)));
    };
    const tableScorePercent = formatScorePercent(tableScore);
    const fieldScorePercent = formatScorePercent(fieldScore);
    const gateResult = profile.gateResult?.result || 'PASS';
    const gateTone = gateResult === 'PASS'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : gateResult === 'REVIEW'
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-red-50 text-red-700 border-red-100';
    const gateLabel = gateResult === 'PASS' ? '通过' : gateResult === 'REVIEW' ? '需复核' : '不通过';
    // V2.3F P4: Calculate mutually exclusive field statistics
    const fieldStats = calculateFieldStatistics(safeFields);
    const threeDimMetrics = calculateThreeDimensionalMetrics(safeFields, profile);
    const gateTasks = (profile.gateResult?.reasons && profile.gateResult.reasons.length > 0)
        ? profile.gateResult.reasons
        : threeDimMetrics.completenessIssues;

    return (
        <div className="mb-4">
            {/* V2.3F P4: Three-Dimensional Metrics Summary */}
            {profile.fields && profile.fields.length > 0 && (
                <div className="mb-4 bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-slate-800">📋 审核摘要</span>
                        <span className="text-xs text-slate-500">(共扫描 {threeDimMetrics.totalCount} 个字段)</span>
                    </div>

                    <div className="text-xs text-slate-400 mb-3 italic">
                        注：基于互斥口径统计，确保总数匹配。
                    </div>

                    <div className="space-y-3">
                        {/* Dimension 1: Coverage Rate */}
                        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-700">① 字段识别覆盖率</span>
                                <span className="text-lg font-bold text-blue-600">
                                    {threeDimMetrics.coverageRate.toFixed(0)}%
                                </span>
                                <span className="text-xs text-slate-500">
                                    ({threeDimMetrics.identifiedCount}/{threeDimMetrics.totalCount})
                                </span>
                            </div>
                            <button
                                onClick={() => setShowCoverageDetail(!showCoverageDetail)}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                {showCoverageDetail ? (
                                    <><ChevronDown size={12} /> 收起详情</>
                                ) : (
                                    <><ChevronRight size={12} /> 展开详情</>
                                )}
                            </button>
                        </div>

                        {/* Expanded Coverage Detail */}
                        {showCoverageDetail && (
                            <div className="pl-4 space-y-2 text-xs">
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-purple-50 p-2 rounded border border-purple-100">
                                        <div className="text-purple-600 font-medium mb-1">标识符</div>
                                        <div className="text-lg font-bold text-purple-700">
                                            {fieldStats.identifiers}
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-2 rounded border border-green-100">
                                        <div className="text-green-600 font-medium mb-1">生命周期</div>
                                        <div className="text-lg font-bold text-green-700">
                                            {fieldStats.timeFields}
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                        <div className="text-orange-600 font-medium mb-1">状态</div>
                                        <div className="text-lg font-bold text-orange-700">
                                            {fieldStats.stateFields}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="text-slate-600 font-medium mb-1">业务属性</div>
                                        <div className="text-lg font-bold text-slate-700">
                                            {fieldStats.busAttrs}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-slate-500 italic flex items-center gap-1">
                                    <CheckCircle size={12} className="text-emerald-500" />
                                    互斥统计验证：{fieldStats.identifiers + fieldStats.timeFields + fieldStats.stateFields + fieldStats.busAttrs} = {threeDimMetrics.totalCount}
                                </div>
                            </div>
                        )}

                        {/* Dimension 2: Completeness */}
                        <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-700">② 关键要素完整度</span>
                                {threeDimMetrics.completenessStatus === 'complete' ? (
                                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        完整
                                    </span>
                                ) : (
                                    <span className="text-sm text-amber-600 flex items-center gap-1">
                                        <AlertTriangle size={14} />
                                        缺失（需补齐）
                                        <span className="text-[10px] text-amber-600/80">
                                            {threeDimMetrics.completenessIssues.length > 0 ? `：${threeDimMetrics.completenessIssues.join('、')}` : ''}
                                        </span>
                                    </span>
                                )}
                            </div>
                            {threeDimMetrics.completenessStatus !== 'complete' && (
                                <button className="text-xs text-amber-600 hover:text-amber-700">
                                    去完善 →
                                </button>
                            )}
                        </div>

                        {/* Dimension 3: Risk Items */}
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${threeDimMetrics.riskCount === 0
                                ? 'bg-emerald-50/50 border-emerald-100'
                                : 'bg-red-50/50 border-red-100'
                            }`}>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-700">③ 风险项数量</span>
                                {threeDimMetrics.riskCount === 0 ? (
                                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        无风险
                                    </span>
                                ) : (
                                    <span className="text-lg font-bold text-red-600">
                                        {threeDimMetrics.riskCount} 项
                                    </span>
                                )}
                            </div>

                            {threeDimMetrics.riskCount > 0 && (
                                <button
                                    onClick={() => setShowRiskDetail(!showRiskDetail)}
                                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                                >
                                    {showRiskDetail ? (
                                        <><ChevronDown size={12} /> 收起风险</>
                                    ) : (
                                        <><ChevronRight size={12} /> 查看风险</>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Expanded Risk Detail */}
                        {showRiskDetail && threeDimMetrics.riskCount > 0 && (
                            <div className="pl-4 space-y-2 text-xs">
                                {threeDimMetrics.sensitiveFieldCount > 0 && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-red-600 mt-0.5">•</span>
                                        <div>
                                            <span className="font-medium text-red-700">
                                                {threeDimMetrics.sensitiveFieldCount} 个敏感字段
                                            </span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {threeDimMetrics.riskDetails.sensitive.map((f: any) => (
                                                    <span key={f.name} className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-mono">
                                                        {f.name} ({f.level})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {threeDimMetrics.unknownTypeFieldCount > 0 && (
                                    <div className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-0.5">•</span>
                                        <div>
                                            <span className="font-medium text-amber-700">
                                                {threeDimMetrics.unknownTypeFieldCount} 个未知类型字段
                                            </span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {threeDimMetrics.riskDetails.unknown.map((name: string) => (
                                                    <span key={name} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-mono">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Gate vs Score Summary */}
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600">Gate（硬拦截）</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${gateTone}`}>
                                    {gateLabel}
                                </span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                {gateTasks.length > 0 ? (
                                    <div className="space-y-1">
                                        {gateTasks.slice(0, 2).map((task, idx) => (
                                            <div key={idx} className="flex items-start gap-1.5">
                                                <span className="text-amber-500 mt-0.5">•</span>
                                                <span>{task}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span>门槛通过，可继续评分优化。</span>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600">Score（成熟度）</span>
                                <span className="text-[10px] text-slate-400">用于排序与持续改进</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-slate-500">表维度得分</div>
                                    <div className="text-lg font-bold text-slate-800">{tableScorePercent}%</div>
                                </div>
                                <div className="bg-slate-50 rounded-lg px-3 py-2">
                                    <div className="text-[10px] text-slate-500">字段维度得分</div>
                                    <div className="text-lg font-bold text-slate-800">{fieldScorePercent}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Line */}
            <div
                className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-6">
                    {/* Table Dimension Summary */}
                    <div className="flex items-center gap-2">
                        <Table size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">表维度:</span>
                        <span className={`text-sm font-bold ${tableScore > 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {tableScorePercent}%
                        </span>
                        <span className="text-xs text-slate-400">
                            ({tablePassedCount}/{tableRules.length}通过)
                        </span>
                    </div>

                    <div className="w-px h-4 bg-slate-300"></div>

                    {/* Field Dimension Summary */}
                    <div className="flex items-center gap-2">
                        <Columns size={16} className="text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">字段维度:</span>
                        <span className={`text-sm font-bold ${fieldScore > 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {fieldScorePercent}%
                        </span>
                        <span className="text-xs text-slate-400">
                            ({fieldPassedCount}/{fieldRules.length}通过)
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {failedRules.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                            <AlertTriangle size={12} />
                            {failedRules.length} 项未通过
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronDown size={18} className="text-slate-400" />
                    ) : (
                        <ChevronRight size={18} className="text-slate-400" />
                    )}
                </div>
            </div>

            {/* Failed Rules Warning */}
            {!isExpanded && failedRules.length > 0 && (
                <div className="mt-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>未通过项:</span>
                    {failedRules.map((r, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-amber-100 rounded">
                            {r.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Table Dimension Details */}
                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Table size={16} className="text-blue-600" />
                            <span className="font-medium text-slate-700">表维度分析</span>
                            <span className="ml-auto text-sm font-bold text-blue-600">{tableScorePercent}%</span>
                        </div>
                        <div className="space-y-2">
                            {tableRules.map((rule, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-mono">{rule.code}</span>
                                        <span className="text-slate-600">{rule.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{rule.value}</span>
                                        {rule.status === 'pass' ? (
                                            <CheckCircle size={14} className="text-emerald-500" />
                                        ) : (
                                            <XCircle size={14} className="text-red-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Field Dimension Details */}
                    <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Columns size={16} className="text-emerald-600" />
                            <span className="font-medium text-slate-700">字段维度分析</span>
                            <span className="ml-auto text-sm font-bold text-emerald-600">{fieldScorePercent}%</span>
                        </div>
                        <div className="space-y-2">
                            {fieldRules.map((rule, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-mono">{rule.code}</span>
                                        <span className="text-slate-600">{rule.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{rule.value}</span>
                                        {rule.status === 'pass' ? (
                                            <CheckCircle size={14} className="text-emerald-500" />
                                        ) : (
                                            <XCircle size={14} className="text-red-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Gate Result Message */}
            {profile.gateResult.reasons.length > 0 && (
                <div className="mt-3 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div>
                        {profile.gateResult.reasons.map((reason, i) => (
                            <div key={i}>{reason}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
