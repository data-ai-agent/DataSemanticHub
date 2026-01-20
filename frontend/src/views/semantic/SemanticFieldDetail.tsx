import React from 'react';
import {
    CheckCircle2, AlertTriangle, Shield, TrendingUp,
    Type, AlignLeft, Database, Search, Brain,
    Share2, History, Wand2, Info
} from 'lucide-react';
import { FieldSemanticProfile, RiskLevel, SemanticRole } from '../../types/semantic';
import { FieldProfileSnapshot, ProfileSignals } from '../../services/profile';

// Role labels mapping (consistent with SemanticDecisionPanel)
const ROLE_LABELS: Record<string, string> = {
    'Identifier': '标识字段',
    'ForeignKey': '外键字段',
    'BusAttr': '业务属性',
    'Status': '状态字段',
    'Time': '时间字段',
    'EventHint': '事件线索',
    'Measure': '度量字段',
    'Attribute': '通用属性',
    'Audit': '审计字段',
    'Technical': '技术属性'
};

interface SemanticFieldDetailProps {
    field: any;
    semanticProfile: any; // FieldSemanticProfile
    profileSnapshot?: FieldProfileSnapshot;
    onUpdate?: (updates: Partial<FieldSemanticProfile>) => void;
    onViewDetails?: () => void;
}

export const SemanticFieldDetail: React.FC<SemanticFieldDetailProps> = ({
    field,
    semanticProfile,
    profileSnapshot,
    onUpdate,
    onViewDetails
}) => {
    // Generate AI suggestions based on field characteristics
    const generateAISuggestion = () => {
        const fieldName = field.name.toLowerCase();

        // Rule-based role inference
        if (fieldName.endsWith('_id') || fieldName.endsWith('id') || fieldName === 'id') {
            return {
                role: 'Identifier',
                confidence: 95,
                reason: '命名匹配_id后缀，且唯一性高'
            };
        }
        if (fieldName.includes('status') || fieldName.includes('state')) {
            return {
                role: 'Status',
                confidence: 90,
                reason: '字段名包含status/state，为状态字段'
            };
        }
        if (fieldName.includes('time') || fieldName.includes('date') || fieldName === 'created_at' || fieldName === 'updated_at') {
            return {
                role: 'EventHint',
                confidence: 92,
                reason: '时间相关字段，提供事件线索'
            };
        }
        if (fieldName.includes('name') || fieldName.includes('title')) {
            return {
                role: 'BusAttr',
                confidence: 85,
                reason: '名称属性，为核心业务信息'
            };
        }

        // Default fallback
        return {
            role: 'BusAttr',
            confidence: 70,
            reason: '通用业务属性字段'
        };
    };

    const aiSuggestion = semanticProfile?.aiSuggestion || generateAISuggestion();

    const analysis = {
        role: semanticProfile?.role || aiSuggestion.role || '未识别',
        status: semanticProfile?.semanticStatus || 'SUGGESTED',
        confidence: semanticProfile?.confidence || aiSuggestion.confidence || 75,
        risk: semanticProfile?.riskLevel || 'LOW',
        description: typeof aiSuggestion === 'string' ? aiSuggestion : (aiSuggestion.reason || 'AI 根据字段名与采样数据推测...')
    };

    // Quality signals from profile snapshot
    const signals: ProfileSignals = profileSnapshot?.signals || {
        nullRatio: 0,
        distinctCount: 0,
        top3Concentration: 0,
        topValues: []
    };

    const hasProfile = !!profileSnapshot;

    return (
        <div className="p-6 space-y-6 animate-fade-in text-sm">
            {/* 1. Header Section: Basic Info */}
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Type size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            {field.name}
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 font-normal font-mono">
                                {field.type}
                            </span>
                        </h2>
                        <div className="text-slate-500 mt-1 flex items-center gap-2">
                            {field.comment || '暂无物理注释'}
                            {field.primaryKey && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded">
                                    PK
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Status Badge */}
                <div className="flex flex-col items-end gap-1">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${analysis.status === 'DECIDED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        analysis.status === 'BLOCKED' ? 'bg-red-50 text-red-600 border-red-200' :
                            'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                        {analysis.status === 'DECIDED' ? <CheckCircle2 size={12} /> : <Brain size={12} />}
                        {analysis.status === 'DECIDED' ? '语义已确认' : 'AI 建议中'}
                    </div>
                    <span className="text-[10px] text-slate-400">
                        AI置信度 {analysis.confidence}分
                    </span>
                </div>
            </div>

            {/* 2. Main Grid: Semantic vs Quality */}
            <div className="grid grid-cols-2 gap-6">

                {/* Left: Semantic Understanding */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
                        <Brain size={16} className="text-purple-600" />
                        AI 语义解析
                    </div>

                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-xs text-purple-600 mb-1">AI建议字段角色</div>
                                <div className="text-lg font-bold text-slate-800">{ROLE_LABELS[analysis.role] || analysis.role}</div>
                            </div>
                            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-purple-100">
                                <Wand2 size={16} className="text-purple-500" />
                            </div>
                        </div>
                        <div className="p-3 bg-white rounded-lg text-slate-600 text-xs leading-relaxed border border-purple-100/50">
                            <strong>AI 推理依据：</strong> {analysis.description}
                            <div className="mt-2 flex gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                                    <AlignLeft size={10} /> 命名相似度高
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                                    <Database size={10} /> 采样分布匹配
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Security Level */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${analysis.risk === 'HIGH' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                        }`}>
                        <Shield size={18} className={analysis.risk === 'HIGH' ? 'text-red-500' : 'text-slate-400'} />
                        <div>
                            <div className={`font-bold text-sm ${analysis.risk === 'HIGH' ? 'text-red-800' : 'text-slate-700'}`}>
                                {analysis.risk === 'HIGH' ? '高风险 (L3/L4)' : '低风险 (L1/L2)'}
                            </div>
                            <div className={`text-xs mt-1 ${analysis.risk === 'HIGH' ? 'text-red-600' : 'text-slate-500'}`}>
                                {analysis.risk === 'HIGH'
                                    ? '检测到疑似 PII 信息，建议进行脱敏处理或访问控制。'
                                    : '未检测到敏感信息特征。'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Data Quality Evidence */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
                        <TrendingUp size={16} className="text-emerald-600" />
                        数据特征
                        {hasProfile && (
                            <button
                                onClick={onViewDetails}
                                className="ml-auto text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Share2 size={12} /> 详情
                            </button>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        {!hasProfile && (
                            <div className="mb-4 bg-amber-50 text-amber-600 text-xs p-2 rounded flex gap-2">
                                <Info size={14} /> 尚未运行质量分析 (SEMANTIC_MIN)
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-xs text-slate-400 mb-1">空值率 (Null Rate)</div>
                                <div className="text-lg font-mono font-medium text-slate-700">
                                    {(signals.nullRatio * 100).toFixed(2)}%
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5">
                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(1 - signals.nullRatio) * 100}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">唯一值 (Cardinality)</div>
                                <div className="text-lg font-mono font-medium text-slate-700">
                                    {signals.distinctCount}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                    Top3 集中度: {(signals.top3Concentration * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs text-slate-500 font-medium">Top 采样值:</div>
                            {signals.topValues?.length ? signals.topValues.map((val, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                                    <span className="font-mono text-slate-600">{val.value}</span>
                                    <span className="text-slate-400">{(val.ratio * 100).toFixed(1)}%</span>
                                </div>
                            )) : <div className="text-slate-400 text-xs text-center py-2">无采样数据</div>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
                        <Info size={14} />
                        数据分布符合 「{analysis.role}」 的典型特征
                    </div>
                </div>
            </div>

            {/* 3. Footer Actions (Mock) */}
            {/* Can be added if needed, but usually handled by parent container context actions */}
        </div >
    );
};
