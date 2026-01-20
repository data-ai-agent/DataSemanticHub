import React, { useState } from 'react';
import { TrendingUp, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { TableSemanticProfile } from '../../types/semantic';

interface ScoringDimension {
    name: string;
    weight: number;
    score: number;
    status: 'pass' | 'warning' | 'info';
    diagnosis: string;
    suggestion: string;
    optional?: boolean;
}

interface ScoringScenario {
    name: string;
    focus: string;
    dimensions: ScoringDimension[];
}

interface ScoringBreakdownPanelProps {
    profile: TableSemanticProfile;
    fields: any[];
}

export const ScoringBreakdownPanel: React.FC<ScoringBreakdownPanelProps> = ({ profile, fields }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const gateDetails = profile.gateResult?.details || { primaryKey: false, lifecycle: false, tableType: true };
    const safeFields = Array.isArray(fields) ? fields : [];

    // Detect scenario based on table characteristics
    const detectScenario = (): 'DWS' | 'DWD' | 'DIM' | 'ODS' | 'SNAP' => {
        const tableName = profile.tableName.toLowerCase();

        if (tableName.startsWith('ods_') || tableName.includes('_ods')) {
            return 'ODS';
        }

        if (tableName.includes('snapshot') || tableName.includes('_snap') || tableName.includes('snap_')) {
            return 'SNAP';
        }

        // DWS: 汇总宽表 (summary/aggregate tables)
        if (tableName.includes('_sum') || tableName.includes('_agg') || tableName.includes('dws_')) {
            return 'DWS';
        }

        // DIM: 维度表 (dimension tables)
        if (tableName.includes('_dim') || tableName.includes('dim_') || profile.objectType === 'attribute') {
            return 'DIM';
        }

        // DWD: 明细表 (detail tables) - default
        return 'DWD';
    };

    // Calculate dimension scores
    const calculateDimensions = (scenarioType: 'DWS' | 'DWD' | 'DIM' | 'ODS' | 'SNAP'): ScoringDimension[] => {
        // Comment coverage
        const fieldsWithComment = safeFields.filter(f => f.comment && f.comment.trim() !== '').length;
        const commentCoverage = safeFields.length > 0 ? (fieldsWithComment / safeFields.length) * 100 : 0;

        // Primary key detection
        const hasPrimaryKey = safeFields.some(f => f.key === 'PK' || f.role === 'Identifier');

        // Naming convention check (simple heuristic)
        const wellNamedFields = safeFields.filter(f => {
            const name = (f.name || f.fieldName || '').toLowerCase();
            return name.length > 2 && !name.includes('col') && !name.includes('field');
        }).length;
        const namingScore = safeFields.length > 0 ? (wellNamedFields / safeFields.length) * 100 : 0;

        if (scenarioType === 'DWS') {
            const commentDim: ScoringDimension = {
                name: '业务注释',
                weight: 50,
                score: Math.round(commentCoverage / 100 * 50),
                status: commentCoverage >= 60 ? 'pass' : 'warning',
                diagnosis: commentCoverage >= 60 ? '注释覆盖率良好' : '注释覆盖率不足',
                suggestion: commentCoverage >= 60 ? '继续保持良好的注释习惯' : '建议：补充关键指标字段注释'
            };

            const pkDim: ScoringDimension = {
                name: '物理主键',
                weight: 20,
                score: hasPrimaryKey ? 20 : 0,
                status: 'info',
                diagnosis: hasPrimaryKey ? '已检测到主键' : '未检测到物理主键',
                suggestion: '(注：汇总表不强制，但建议指定逻辑主键)',
                optional: true
            };

            const namingDim: ScoringDimension = {
                name: '字段命名',
                weight: 30,
                score: Math.round(namingScore / 100 * 30),
                status: namingScore >= 70 ? 'pass' : 'warning',
                diagnosis: namingScore >= 70 ? '命名规范良好' : '部分字段命名不规范',
                suggestion: namingScore >= 70 ? '命名清晰易懂' : '建议：使用有业务含义的字段名'
            };

            return [commentDim, pkDim, namingDim];
        }

        else if (scenarioType === 'DWD' || scenarioType === 'ODS') {
            const pkDim: ScoringDimension = {
                name: scenarioType === 'ODS' ? '源系统主键' : '主键完整性',
                weight: 40,
                score: hasPrimaryKey ? 40 : 0,
                status: hasPrimaryKey ? 'pass' : 'warning',
                diagnosis: hasPrimaryKey ? '主键定义完整' : '缺少主键定义',
                suggestion: hasPrimaryKey ? '主键设置正确' : '建议：明确指定业务主键字段'
            };

            const commentDim: ScoringDimension = {
                name: scenarioType === 'ODS' ? '字段注释' : '业务注释',
                weight: 30,
                score: Math.round(commentCoverage / 100 * 30),
                status: commentCoverage >= 50 ? 'pass' : 'warning',
                diagnosis: commentCoverage >= 50 ? '注释覆盖率达标' : '注释覆盖率偏低',
                suggestion: commentCoverage >= 50 ? '保持注释习惯' : '建议：补充核心字段注释'
            };

            const lifecycleDim: ScoringDimension = {
                name: scenarioType === 'ODS' ? '同步时间字段' : '生命周期字段',
                weight: 30,
                score: gateDetails.lifecycle ? 30 : 0,
                status: gateDetails.lifecycle ? 'pass' : 'warning',
                diagnosis: gateDetails.lifecycle ? '时间字段完备' : '缺少时间字段',
                suggestion: gateDetails.lifecycle ? '时间字段设置合理' : '建议：添加 created_time/updated_time'
            };

            return [pkDim, commentDim, lifecycleDim];
        }

        else if (scenarioType === 'SNAP') {
            const snapshotField = safeFields.some(f => {
                const name = (f.name || f.fieldName || '').toLowerCase();
                return name.includes('snapshot') || name.startsWith('dt_') || name.endsWith('_dt');
            });
            const snapshotDim: ScoringDimension = {
                name: '快照日期字段',
                weight: 40,
                score: snapshotField ? 40 : 0,
                status: snapshotField ? 'pass' : 'warning',
                diagnosis: snapshotField ? '快照日期字段已识别' : '缺少快照日期字段',
                suggestion: snapshotField ? '快照字段设置合理' : '建议：补充 dt/snapshot_date 字段'
            };
            const namingDim: ScoringDimension = {
                name: '字段命名',
                weight: 30,
                score: Math.round(namingScore / 100 * 30),
                status: namingScore >= 70 ? 'pass' : 'warning',
                diagnosis: namingScore >= 70 ? '命名规范良好' : '部分字段命名不规范',
                suggestion: namingScore >= 70 ? '命名清晰易懂' : '建议：使用有业务含义的字段名'
            };
            const commentDim: ScoringDimension = {
                name: '字段注释',
                weight: 30,
                score: Math.round(commentCoverage / 100 * 30),
                status: commentCoverage >= 60 ? 'pass' : 'warning',
                diagnosis: commentCoverage >= 60 ? '注释覆盖率良好' : '注释覆盖率不足',
                suggestion: commentCoverage >= 60 ? '保持注释习惯' : '建议：补充快照关键字段注释'
            };
            return [snapshotDim, namingDim, commentDim];
        }

        else { // DIM
            const pkDim: ScoringDimension = {
                name: '维度主键',
                weight: 40,
                score: hasPrimaryKey ? 40 : 0,
                status: hasPrimaryKey ? 'pass' : 'warning',
                diagnosis: hasPrimaryKey ? '维度主键明确' : '缺少维度主键',
                suggestion: hasPrimaryKey ? '主键定义清晰' : '建议：设置维度表唯一标识'
            };

            const namingDim: ScoringDimension = {
                name: '属性规范性',
                weight: 35,
                score: Math.round(namingScore / 100 * 35),
                status: namingScore >= 80 ? 'pass' : 'warning',
                diagnosis: namingScore >= 80 ? '属性命名规范' : '属性命名需优化',
                suggestion: namingScore >= 80 ? '属性定义清晰' : '建议：统一属性命名风格'
            };

            const commentDim: ScoringDimension = {
                name: '枚举说明',
                weight: 25,
                score: Math.round(commentCoverage / 100 * 25),
                status: commentCoverage >= 70 ? 'pass' : 'info',
                diagnosis: commentCoverage >= 70 ? '枚举值说明完整' : '建议补充枚举说明',
                suggestion: '维度表应详细说明各属性的取值范围'
            };

            return [pkDim, namingDim, commentDim];
        }
    };

    const autoScenario = detectScenario();
    const [selectedScenario, setSelectedScenario] = useState<'DWS' | 'DWD' | 'DIM' | 'ODS' | 'SNAP'>(autoScenario);
    const scenarioType = selectedScenario || autoScenario;
    const dimensions = calculateDimensions(scenarioType);
    const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
    const maxScore = dimensions.reduce((sum, d) => sum + d.weight, 0);
    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const baselineDimensions = calculateDimensions(autoScenario);
    const baselineScore = baselineDimensions.reduce((sum, d) => sum + d.score, 0);
    const baselineMax = baselineDimensions.reduce((sum, d) => sum + d.weight, 0);
    const baselineScorePercentage = baselineMax > 0 ? Math.round((baselineScore / baselineMax) * 100) : 0;
    const scoreDelta = scorePercentage - baselineScorePercentage;

    const scenarioNames = {
        'DWS': 'DWS 汇总宽表标准',
        'DWD': 'DWD 明细表标准',
        'DIM': 'DIM 维度表标准',
        'ODS': 'ODS 贴源层标准',
        'SNAP': '快照表标准'
    };

    const scenarioFocus = {
        'DWS': '重点考核语义清晰度',
        'DWD': '重点考核主键完整性',
        'DIM': '重点考核属性规范性',
        'ODS': '重点考核同步与字段完整性',
        'SNAP': '重点考核快照日期与字段稳定性'
    };
    const dimensionPercent = (dim: ScoringDimension) => dim.weight > 0 ? Math.round((dim.score / dim.weight) * 100) : 0;
    const baselineDimensionMap = new Map(baselineDimensions.map(dim => [dim.name, dimensionPercent(dim)]));
    const activeDimensionMap = new Map(dimensions.map(dim => [dim.name, dimensionPercent(dim)]));
    const diffItems = Array.from(new Set([...baselineDimensionMap.keys(), ...activeDimensionMap.keys()]))
        .map(name => {
            const baseValue = baselineDimensionMap.get(name) ?? 0;
            const nextValue = activeDimensionMap.get(name) ?? 0;
            return {
                name,
                delta: nextValue - baseValue,
                current: nextValue
            };
        })
        .filter(item => item.delta !== 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 3);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pass':
                return <CheckCircle size={14} className="text-emerald-500" />;
            case 'warning':
                return <AlertTriangle size={14} className="text-amber-500" />;
            default:
                return <Info size={14} className="text-blue-500" />;
        }
    };

    return (
        <div className="mb-4">
            {/* Summary Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100 cursor-pointer hover:shadow-md transition-all"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingUp size={20} className="text-indigo-600" />
                        <div>
                            <div className="font-bold text-slate-800">📊 评分透视</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                当前策略：{scenarioNames[scenarioType]} ({scenarioFocus[scenarioType]})
                                {scenarioType !== autoScenario && (
                                    <span className="ml-2 text-[10px] text-slate-400">系统推荐：{scenarioNames[autoScenario]}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600">{scorePercentage}%</div>
                            <div className="text-xs text-slate-500">综合评分（0-100）</div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            {isExpanded ? '收起 ▲' : '展开 ▼'}
                        </button>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span>策略模板</span>
                    <select
                        value={scenarioType}
                        onChange={(e) => setSelectedScenario(e.target.value as 'DWS' | 'DWD' | 'DIM' | 'ODS' | 'SNAP')}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 border border-slate-200 rounded bg-white text-slate-600"
                    >
                        {Object.keys(scenarioNames).map(key => (
                            <option key={key} value={key}>{scenarioNames[key as keyof typeof scenarioNames]}</option>
                        ))}
                    </select>
                </div>
                {scenarioType !== autoScenario && (
                    <div className="mt-3 bg-white/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                            <span>
                                切换前：{scenarioNames[autoScenario]} {baselineScorePercentage}%
                                {' → '}
                                切换后：{scenarioNames[scenarioType]} {scorePercentage}%
                            </span>
                            <span className={`font-semibold ${scoreDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}%
                            </span>
                        </div>
                        {diffItems.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                                影响因子：
                                {diffItems.map(item => (
                                    <span key={item.name} className="px-1.5 py-0.5 bg-slate-100 rounded">
                                        {item.name} {item.delta >= 0 ? `+${item.delta}` : item.delta}%
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detailed Breakdown */}
            {isExpanded && (
                <div className="mt-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-600">考核维度</th>
                                <th className="px-4 py-3 text-center font-medium text-slate-600 w-24">得分</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-600">诊断结果与修复建议</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {dimensions.map((dim, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(dim.status)}
                                            <span className="font-medium text-slate-700">{dim.name}</span>
                                            {dim.optional && (
                                                <span className="text-xs text-slate-400 italic">(可选)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className={`font-bold ${dim.status === 'pass' ? 'text-emerald-600' :
                                                    dim.status === 'warning' ? 'text-amber-600' :
                                                        'text-blue-600'
                                                }`}>
                                                {dimensionPercent(dim)}%
                                            </span>
                                            <span className="text-[10px] text-slate-400">权重 {dim.weight}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className={`font-medium ${dim.status === 'pass' ? 'text-emerald-700' :
                                                    dim.status === 'warning' ? 'text-amber-700' :
                                                        'text-blue-700'
                                                }`}>
                                                {dim.status === 'pass' && '✓ '}
                                                {dim.status === 'warning' && '⚠️ '}
                                                {dim.status === 'info' && 'ℹ️ '}
                                                {dim.diagnosis}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 italic">
                                                {dim.suggestion}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
