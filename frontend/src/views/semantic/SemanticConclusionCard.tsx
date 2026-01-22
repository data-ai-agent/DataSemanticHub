import React, { useState } from 'react';
import { Activity, Bot, ChevronDown, AlertTriangle, CheckCircle, Clock, Edit3 } from 'lucide-react';
import { TableSemanticProfile, BUSINESS_DOMAINS, ObjectType } from '../../types/semantic';
import { TermAutocomplete } from '../../components/TermAutocomplete';
import { getAllTerms, depositNewTerm } from '../../data/mockData';
import { ConfidenceBoostingPanel } from './ConfidenceBoostingPanel';
import { generateBoostingTasks } from '../../services/mockAiService';
import { CommentGenerationModal } from './CommentGenerationModal';
import { JsonFieldModal } from './JsonFieldModal';

interface SemanticConclusionCardProps {
    profile: TableSemanticProfile;
    fields: any[];
    isEditing: boolean;
    onEdit: () => void;
    onSaveEdit: () => void;
    onProfileChange: (updates: Partial<TableSemanticProfile>) => void;
    onAccept: () => void;
    onReject: () => void;
    onConfirmEffective?: () => void;
    onViewLogs?: () => void;
    onEvidenceAction?: (payload: {
        action: 'accept' | 'override' | 'pending';
        field?: string;
        source?: 'AI' | '规则' | 'Gate' | '融合';
        reason?: string;
    }) => void;
    existingBO?: any;
    onFocusField?: (fieldName: string) => void;
}

// Object type labels in Chinese
const OBJECT_TYPE_LABELS: Record<ObjectType, { label: string; desc: string }> = {
    entity: { label: '主体', desc: '核心业务实体' },
    event: { label: '过程', desc: '业务过程记录' },
    state: { label: '状态', desc: '状态快照' },
    rule: { label: '规则', desc: '业务配置' },
    attribute: { label: '清单', desc: '业务清单' },
};
const OBJECT_TYPE_OPTIONS: ObjectType[] = ['entity', 'event', 'state', 'attribute'];

export const SemanticConclusionCard: React.FC<SemanticConclusionCardProps> = ({
    profile,
    fields,
    isEditing,
    onEdit,
    onSaveEdit,
    onProfileChange,
    onAccept,
    onReject,
    onConfirmEffective,
    onViewLogs,
    onEvidenceAction,
    existingBO,
    onFocusField
}) => {
    const [showSecurityDetail, setShowSecurityDetail] = useState(false);
    const [showAllEvidence, setShowAllEvidence] = useState(false);
    const [collapsedRuleGroups, setCollapsedRuleGroups] = useState<Record<string, boolean>>({});
    const groupedRuleEvidence = (profile.ruleEvidence || []).reduce((acc: Record<string, string[]>, item) => {
        let group = '其他';
        const lower = item.toLowerCase();
        if (lower.includes('命名')) group = '命名规范';
        else if (lower.includes('行为')) group = '行为密度';
        else if (lower.includes('注释')) group = '注释覆盖';
        else if (lower.includes('主键')) group = '主键校验';
        else if (lower.includes('生命周期') || lower.includes('时间')) group = '生命周期';
        acc[group] = acc[group] ? [...acc[group], item] : [item];
        return acc;
    }, {});
    const safeFields = Array.isArray(fields)
        ? fields.map((field: any) => ({
            ...field,
            name: field.name || field.fieldName || field.col || field.field || '',
            comment: field.comment || field.businessDefinition || field.description || ''
        }))
        : [];
    const aiEvidenceItems = Array.isArray(profile.aiEvidenceItems) ? profile.aiEvidenceItems : [];
    const ruleEvidenceItems = Array.isArray(profile.ruleEvidence) ? profile.ruleEvidence : [];
    const aiEvidence = Array.isArray(profile.aiEvidence) ? profile.aiEvidence : [];
    const gateReasons = Array.isArray(profile.gateResult?.reasons) ? profile.gateResult?.reasons : [];
    const aiEvidenceFieldSet = new Set(aiEvidenceItems.map(item => item.field.toLowerCase()));
    const getEvidenceSource = (name: string) => (aiEvidenceFieldSet.has(name.toLowerCase()) ? 'AI' : '规则');
    const opposePattern = /(未|缺失|冲突|复核|失败|风险|不一致|排除|拦截|低)/;
    const supportEvidence = [
        ...aiEvidenceItems.map(item => ({
            source: 'AI' as const,
            field: item.field,
            text: item.reason,
            weight: item.weight || profile.aiScore || 0.5
        })),
        ...ruleEvidenceItems.filter(item => !opposePattern.test(item)).map(item => ({
            source: '规则' as const,
            text: item,
            weight: profile.ruleScore?.total || 0.5
        }))
    ];
    const opposeEvidence = [
        ...ruleEvidenceItems.filter(item => opposePattern.test(item)).map(item => ({
            source: '规则' as const,
            text: item,
            weight: profile.ruleScore?.total || 0.5
        })),
        ...gateReasons.map(item => ({
            source: 'Gate' as const,
            text: item,
            weight: 0.7
        }))
    ];
    const hasConflict = supportEvidence.length > 0 && opposeEvidence.length > 0;
    const objectTypeTags = [
        ...(profile.objectType === 'rule' ? ['规则'] : []),
        ...(profile.objectType === 'attribute' ? ['属性'] : []),
        ...(profile.tags || [])
    ];
    const formattedConfirmAt = profile.confirmedAt
        ? profile.confirmedAt.replace('T', ' ').split('.')[0]
        : '-';

    // V2.3: Modal states for action buttons
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showJsonModal, setShowJsonModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeTabOverride, setActiveTabOverride] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [highlightRole, setHighlightRole] = useState<string | null>(null);

    // Action handler for Confidence Boosting Panel buttons
    const handleActionClick = (actionType: string) => {
        console.log('🎯 Action clicked:', actionType);

        switch (actionType) {
            case 'BATCH_GENERATE':
                // Open comment generation modal
                setShowCommentModal(true);
                break;

            case 'SPECIFY_PK':
                // Switch to field list tab and highlight primary key selector
                setActiveTabOverride('fields');
                setHighlightRole('标识符');
                // Clear highlighting after 3 seconds
                setTimeout(() => {
                    setHighlightRole(null);
                    setActiveTabOverride(null);
                }, 3000);
                break;

            case 'IDENTIFY_JSON':
                // Open JSON field identification modal
                setShowJsonModal(true);
                break;

            default:
                console.warn('Unknown action type:', actionType);
        }
    };

    // Generate mock comment suggestions
    const generateCommentSuggestions = () => {
        const fieldsWithoutComments = fields.filter(f => !f.comment || f.comment.trim() === '');
        return fieldsWithoutComments.map(f => ({
            fieldName: f.name,
            fieldType: f.type,
            currentComment: f.comment || '',
            suggestedComment: `${f.name.includes('id') ? '唯一标识' :
                f.name.includes('name') ? '名称' :
                    f.name.includes('time') || f.name.includes('date') ? '时间' :
                        f.name.includes('status') ? '状态' :
                            f.name.includes('type') ? '类型' :
                                '业务字段'}`
        }));
    };

    // Generate mock JSON field suggestions
    const generateJsonFieldSuggestions = () => {
        const jsonFields = fields.filter(f =>
            f.type.toLowerCase().includes('json') ||
            f.type.toLowerCase().includes('text') && f.name.includes('ext')
        );
        return jsonFields.map(f => ({
            fieldName: f.name,
            fieldType: f.type,
            sampleData: JSON.stringify({ status: 1, config: { theme: 'dark' } }, null, 2),
            jsonStructure: { status: 1, config: { theme: 'dark' } }
        }));
    };

    // Handle comment modal confirmation
    const handleCommentConfirm = (updates: { fieldName: string; comment: string }[]) => {
        console.log('✅ Applying comments:', updates);
        // TODO: Update field comments in the parent component
        setShowCommentModal(false);
        // Show success toast (optional)
    };

    // Handle JSON field identification
    const handleJsonIdentify = (fieldNames: string[]) => {
        console.log('🔍 Identified as JSON:', fieldNames);
        // TODO: Update field types
        setShowJsonModal(false);
    };

    // Handle JSON field extension marking
    const handleJsonMarkExtension = (fieldNames: string[]) => {
        console.log('🏷️ Marked as extension:', fieldNames);
        // TODO: Update field tags
        setShowJsonModal(false);
    };

    // V2.3F P2: Handle business name change from TermAutocomplete
    const handleBusinessNameChange = (value: string, isStandard: boolean) => {
        onProfileChange?.({ businessName: value });

        // Deposit new term if not standard
        if (!isStandard && value.trim()) {
            depositNewTerm(value, 'table');
        }
    };

    // V2.3F P3: Security analysis helper functions
    const calculateHighestSecurityLevel = (fieldsList: any[]): 'L1' | 'L2' | 'L3' | 'L4' => {
        if (!fieldsList || fieldsList.length === 0) return 'L1';

        const levels = fieldsList.map(f => f.sensitivity || 'L1');
        if (levels.includes('L4')) return 'L4';
        if (levels.includes('L3')) return 'L3';
        if (levels.includes('L2')) return 'L2';
        return 'L1';
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'L4': return 'text-red-600';
            case 'L3': return 'text-red-600';
            case 'L2': return 'text-orange-600';
            default: return 'text-slate-600';
        }
    };

    const getLevelText = (level: string) => {
        switch (level) {
            case 'L4': return '机密';
            case 'L3': return '敏感';
            case 'L2': return '内部';
            default: return '公开';
        }
    };

    // Calculate actual security level from fields
    const actualSecurityLevel = calculateHighestSecurityLevel(fields);

    // Categorize fields by security level
    const securityBreakdown = {
        L4: fields.filter(f => (f.sensitivity || 'L1') === 'L4'),
        L3: fields.filter(f => (f.sensitivity || 'L1') === 'L3'),
        L2: fields.filter(f => (f.sensitivity || 'L1') === 'L2'),
        L1: fields.filter(f => (f.sensitivity || 'L1') === 'L1')
    };

    const sensitiveFieldCount = securityBreakdown.L4.length + securityBreakdown.L3.length + securityBreakdown.L2.length;
    const topSensitiveFields = [...securityBreakdown.L4, ...securityBreakdown.L3]
        .slice(0, 3)
        .map(f => f.name);

    // Gate Result Logic for Display
    const isGateFailed = profile.gateResult.result !== 'PASS';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50/30 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity size={120} />
                </div>

                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        🎯 综合语义结论
                        <span className={`text-sm px-3 py-1 rounded-full border font-medium flex items-center gap-1 ${profile.finalScore > 0.9
                            ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-300'
                            : profile.finalScore > 0.6
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-orange-100 text-orange-700 border-orange-200'
                            }`}>
                            {profile.finalScore > 0.9 ? '✨' : profile.finalScore > 0.6 ? '🤖' : '⚠️'}
                            {profile.finalScore > 0.9 ? 'AI 确信' : profile.finalScore > 0.6 ? 'AI 推荐' : '需复核'}
                            : {profile.finalScore.toFixed(2)}
                        </span>
                    </h3>

                    {/* Business Identity Section */}
                    <div className="bg-blue-50/50 rounded-lg p-4 mb-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-bold text-blue-700">🏷️ 业务身份</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Business Name */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">业务名称</label>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <TermAutocomplete
                                            value={profile.businessName || ''}
                                            onChange={handleBusinessNameChange}
                                            standardTerms={getAllTerms('table')}
                                            aiSuggestion={profile.aiScore > 0 ? profile.businessName : undefined}
                                            placeholder="请输入业务名称..."
                                        />
                                    ) : (
                                        <span className={`flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm ${!profile.businessName ? 'text-slate-400 italic' : ''}`}>
                                            {profile.businessName || (profile.aiScore === 0 ? '识别失败，请手动输入' : '等待AI识别...')}
                                        </span>
                                    )}
                                    <Bot size={14} className="text-purple-400" />
                                </div>
                            </div>

                            {/* Business Domain */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">归属业务域</label>
                                {isEditing ? (
                                    <select
                                        value={profile.businessDomain || '其他'}
                                        onChange={(e) => onProfileChange?.({ businessDomain: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                    >
                                        {BUSINESS_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                ) : (
                                    <span className="block px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm">{profile.businessDomain || '其他'}</span>
                                )}
                            </div>

                            {/* Data Layer */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">数据分层</label>
                                {isEditing ? (
                                    <select
                                        value={profile.dataLayer || 'DWD'}
                                        onChange={(e) => onProfileChange?.({ dataLayer: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                    >
                                        <option value="ODS">ODS (贴源层)</option>
                                        <option value="DWD">DWD (明细层)</option>
                                        <option value="DWS">DWS (汇总层)</option>
                                        <option value="ADS">ADS (应用层)</option>
                                        <option value="DIM">DIM (维度层)</option>
                                    </select>
                                ) : (
                                    <span className="block px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm">
                                        {profile.dataLayer === 'ODS' ? 'ODS (贴源层)' :
                                            profile.dataLayer === 'DWD' ? 'DWD (明细层)' :
                                                profile.dataLayer === 'DWS' ? 'DWS (汇总层)' :
                                                    profile.dataLayer === 'ADS' ? 'ADS (应用层)' :
                                                        profile.dataLayer === 'DIM' ? 'DIM (维度层)' : 'DWD (明细层)'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Object Type Radio */}
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-slate-500 mb-2">对象类型</label>
                            <div className="flex flex-wrap gap-2">
                                {OBJECT_TYPE_OPTIONS.map(type => (
                                    <label
                                        key={type}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${profile.objectType === type
                                            ? 'bg-purple-100 border-purple-300 border-2 text-purple-700 font-medium'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-200'
                                            } ${!isEditing ? 'pointer-events-none' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="objectType"
                                            value={type}
                                            checked={profile.objectType === type}
                                            onChange={() => onProfileChange?.({ objectType: type })}
                                            className="sr-only"
                                            disabled={!isEditing}
                                        />
                                        <span>{OBJECT_TYPE_LABELS[type].label}</span>
                                    </label>
                                ))}
                            </div>
                            {profile.objectType === 'rule' && (
                                <p className="mt-2 text-xs text-amber-600">
                                    当前为“规则”类型，已作为标签展示，不再占用对象类型位。
                                </p>
                            )}
                            {objectTypeTags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {objectTypeTags.map((tag, idx) => (
                                        <span key={`${tag}-${idx}`} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {profile.objectTypeReason && (
                                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                    <Bot size={12} className="text-purple-400" />
                                    AI判断: {profile.objectTypeReason}
                                </p>
                            )}
                        </div>

                        {/* Data Grain */}
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1">数据粒度 (一行数据代表什么)</label>
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profile.dataGrain || ''}
                                        onChange={(e) => onProfileChange?.({ dataGrain: e.target.value })}
                                        placeholder="如: 单笔订单、单个用户"
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                    />
                                ) : (
                                    <span className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm">{profile.dataGrain || '未定义'}</span>
                                )}
                                <Bot size={14} className="text-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* V2.3: Confidence Boosting Panel (when score < 0.7) */}
                    {profile.aiScore < 0.7 && (
                        <div className="mb-4">
                            <ConfidenceBoostingPanel
                                currentScore={profile.aiScore}
                                tasks={generateBoostingTasks(fields, profile.aiScore, profile)}
                                onActionClick={handleActionClick}
                            />
                        </div>
                    )}

                    {/* Three-Column Evidence Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Card 1: Lifecycle */}
                        <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🕒</span>
                                <span className="text-sm font-bold text-amber-700">生命周期</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {profile.retentionPeriod || '永久保留'}
                                    </div>
                                    <div className="text-xs text-slate-500">数据保留期限</div>
                                </div>
                                <div className="pt-2 border-t border-amber-100">
                                    <div className="text-sm text-slate-600">
                                        {profile.updateStrategy || '增量追加'}
                                    </div>
                                    <div className="text-xs text-slate-400">更新策略</div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Quality Portrait */}
                        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🩺</span>
                                <span className="text-sm font-bold text-blue-700">质量画像</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {Math.round((profile.gateResult.details.primaryKey ? 90 : 60) + Math.random() * 10)}% 填充率
                                    </div>
                                    <div className="text-xs text-slate-500">核心字段完整度</div>
                                </div>
                                <div className="pt-2 border-t border-blue-100">
                                    <div className="text-sm text-emerald-600 font-medium">
                                        {profile.gateResult.details.primaryKey ? '✓ 主键唯一性通过' : '⚠ 主键缺失'}
                                    </div>
                                    <div className="text-xs text-slate-400">数据质量检测</div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Security & Compliance */}
                        <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🛡️</span>
                                <span className="text-sm font-bold text-red-700">安全合规</span>
                                <button
                                    onClick={() => setShowSecurityDetail(!showSecurityDetail)}
                                    className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <ChevronDown size={16} className={`transition-transform ${showSecurityDetail ? '' : '-rotate-90'}`} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <div className={`text-lg font-bold ${getLevelColor(actualSecurityLevel)}`}>
                                        {actualSecurityLevel} {getLevelText(actualSecurityLevel)}
                                    </div>
                                    <div className="text-xs text-slate-500">最高安全等级 (强一致性)</div>
                                </div>

                                <div className="pt-2 border-t border-red-100">
                                    <div className="text-sm text-slate-600">
                                        {sensitiveFieldCount} 个敏感字段
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {topSensitiveFields.length > 0
                                            ? `包含 PII: ${topSensitiveFields.join(', ')}`
                                            : '包含 PII 数据'}
                                    </div>
                                </div>

                                {showSecurityDetail && (
                                    <div className="pt-3 border-t border-red-100 space-y-3">
                                        <div className="text-xs font-medium text-slate-600 mb-2">
                                            📋 PII 字段来源透视
                                        </div>

                                        {securityBreakdown.L4.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-red-600 mb-1.5 flex items-center gap-1">
                                                    <span>🔴</span>
                                                    <span>L4 机密 ({securityBreakdown.L4.length}个)</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {securityBreakdown.L4.map(f => (
                                                        <span key={f.name} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-mono flex items-center gap-1">
                                                            {f.name}
                                                            <span className="text-[9px] text-red-500">{getEvidenceSource(f.name)}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {securityBreakdown.L3.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-orange-600 mb-1.5 flex items-center gap-1">
                                                    <span>🟠</span>
                                                    <span>L3 敏感 ({securityBreakdown.L3.length}个)</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {securityBreakdown.L3.map(f => (
                                                        <span key={f.name} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-mono flex items-center gap-1">
                                                            {f.name}
                                                            <span className="text-[9px] text-orange-500">{getEvidenceSource(f.name)}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {securityBreakdown.L2.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-amber-600 mb-1.5 flex items-center gap-1">
                                                    <span>🟡</span>
                                                    <span>L2 内部 ({securityBreakdown.L2.length}个)</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {securityBreakdown.L2.map(f => (
                                                        <span key={f.name} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-mono flex items-center gap-1">
                                                            {f.name}
                                                            <span className="text-[9px] text-amber-600">{getEvidenceSource(f.name)}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">业务描述</label>
                        {isEditing ? (
                            <textarea
                                value={profile.description}
                                onChange={(e) => onProfileChange?.({ description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none resize-none h-16 text-sm"
                            />
                        ) : (
                            <p className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-600">{profile.description}</p>
                        )}
                    </div>

                    {/* Evidence */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">理解依据</label>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">证据链（点击字段可定位）</span>
                            <button
                                onClick={() => setShowAllEvidence(prev => !prev)}
                                className="text-[10px] text-slate-500 hover:text-purple-600"
                            >
                                {showAllEvidence ? '收起' : '展开全部'}
                            </button>
                        </div>
                        {hasConflict && (
                            <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                                <div className="text-xs font-semibold text-slate-700 mb-2">冲突解释与反证</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                                        <div className="text-[10px] font-semibold text-emerald-700 mb-2">支持建议的证据</div>
                                        <div className="space-y-2">
                                            {supportEvidence.slice(0, showAllEvidence ? undefined : 3).map((item, idx) => (
                                                <div key={`support-${idx}`} className="rounded-md border border-emerald-100 bg-white p-2">
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                        <span>{item.source}</span>
                                                        <span>{Math.round((item.weight || 0) * 100)}%</span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-700">
                                                        {item.text}{(item as any).field ? `（${(item as any).field}）` : ''}
                                                    </div>
                                                    {onEvidenceAction && (
                                                        <div className="mt-2 flex items-center gap-2 text-[10px]">
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'accept', field: (item as any).field, source: item.source, reason: item.text })}
                                                                className="text-emerald-600 hover:underline"
                                                            >
                                                                接受建议
                                                            </button>
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'override', field: (item as any).field, source: item.source, reason: item.text })}
                                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Edit3 size={11} /> 改判
                                                            </button>
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'pending', field: (item as any).field, source: item.source, reason: item.text })}
                                                                className="text-amber-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Clock size={11} /> 待定
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {supportEvidence.length === 0 && (
                                                <div className="text-xs text-slate-400">暂无支持证据</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
                                        <div className="text-[10px] font-semibold text-amber-700 mb-2">反对建议的证据</div>
                                        <div className="space-y-2">
                                            {opposeEvidence.slice(0, showAllEvidence ? undefined : 3).map((item, idx) => (
                                                <div key={`oppose-${idx}`} className="rounded-md border border-amber-100 bg-white p-2">
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                        <span>{item.source}</span>
                                                        <span>{Math.round((item.weight || 0) * 100)}%</span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-700">{item.text}</div>
                                                    {onEvidenceAction && (
                                                        <div className="mt-2 flex items-center gap-2 text-[10px]">
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'accept', source: item.source, reason: item.text })}
                                                                className="text-emerald-600 hover:underline"
                                                            >
                                                                接受建议
                                                            </button>
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'override', source: item.source, reason: item.text })}
                                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Edit3 size={11} /> 改判
                                                            </button>
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'pending', source: item.source, reason: item.text })}
                                                                className="text-amber-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Clock size={11} /> 待定
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {opposeEvidence.length === 0 && (
                                                <div className="text-xs text-slate-400">暂无反证</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="text-[10px] font-semibold text-slate-600 mb-2">融合说明（Rule / AI / Final）</div>
                                    <div className="space-y-2 text-[10px] text-slate-500">
                                        <div className="flex items-center justify-between">
                                            <span>Rule Score</span>
                                            <span>{Math.round((profile.ruleScore?.total || 0) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${Math.round((profile.ruleScore?.total || 0) * 100)}%` }} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>AI Score</span>
                                            <span>{Math.round((profile.aiScore || 0) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${Math.round((profile.aiScore || 0) * 100)}%` }} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Final Score</span>
                                            <span>{Math.round((profile.finalScore || 0) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.round((profile.finalScore || 0) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-semibold text-slate-700">AI 证据</div>
                                    <div className="text-[10px] text-slate-400">权重可视化</div>
                                </div>
                                <div className="space-y-2">
                                    {aiEvidenceItems.slice(0, showAllEvidence ? undefined : 3).map((item, index) => {
                                        const canFocus = safeFields.some(f => f.name.toLowerCase() === item.field.toLowerCase());
                                        return (
                                            <div key={`${item.field}-${index}`} className="rounded-md border border-slate-100 bg-slate-50/40 p-2">
                                                <button
                                                    onClick={() => canFocus && onFocusField?.(item.field)}
                                                    className={`w-full text-xs flex flex-col gap-1 text-left ${canFocus ? 'text-slate-600 hover:text-purple-600' : 'text-slate-400 cursor-default'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="truncate">{item.reason} ({item.field})</span>
                                                        <span className="text-[10px] text-slate-400">{Math.round(item.weight * 100)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${canFocus ? 'bg-purple-500' : 'bg-slate-300'}`} style={{ width: `${Math.round(item.weight * 100)}%` }} />
                                                    </div>
                                                </button>
                                                {onEvidenceAction && (
                                                    <div className="mt-2 flex items-center gap-2 text-[10px]">
                                                        <button
                                                            onClick={() => onEvidenceAction({ action: 'accept', field: item.field, source: 'AI', reason: item.reason })}
                                                            className="text-emerald-600 hover:underline"
                                                        >
                                                            接受建议
                                                        </button>
                                                        <button
                                                            onClick={() => onEvidenceAction({ action: 'override', field: item.field, source: 'AI', reason: item.reason })}
                                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <Edit3 size={11} /> 改判
                                                        </button>
                                                        <button
                                                            onClick={() => onEvidenceAction({ action: 'pending', field: item.field, source: 'AI', reason: item.reason })}
                                                            className="text-amber-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <Clock size={11} /> 待定
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {aiEvidenceItems.length === 0 && (
                                        <div className="text-xs text-slate-400">暂无 AI 证据</div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-semibold text-slate-700">规则证据</div>
                                    <div className="text-[10px] text-slate-400">按规则分组</div>
                                </div>
                                {Object.keys(groupedRuleEvidence).length === 0 && (
                                    <span className="text-xs text-slate-400">暂无规则证据</span>
                                )}
                                <div className="space-y-2">
                                    {Object.entries(groupedRuleEvidence).slice(0, showAllEvidence ? undefined : 2).map(([group, items]) => {
                                        const isCollapsed = collapsedRuleGroups[group];
                                        return (
                                            <div key={group} className="border border-slate-100 rounded-md p-2">
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => setCollapsedRuleGroups(prev => ({ ...prev, [group]: !prev[group] }))}
                                                        className="text-[10px] font-semibold text-slate-500"
                                                    >
                                                        {group} ({items.length})
                                                    </button>
                                                    {onEvidenceAction && (
                                                        <div className="flex items-center gap-2 text-[10px]">
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'accept', source: '规则', reason: group })}
                                                                className="text-emerald-600 hover:underline"
                                                            >
                                                                接受建议
                                                            </button>
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'override', source: '规则', reason: group })}
                                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Edit3 size={11} /> 改判
                                                            </button>
                                                            <button
                                                                onClick={() => onEvidenceAction({ action: 'pending', source: '规则', reason: group })}
                                                                className="text-amber-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Clock size={11} /> 待定
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {!isCollapsed && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {items.map((e, i) => (
                                                            <span key={`${group}-${i}`} className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                                                {e}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {aiEvidence.slice(0, 2).map((e, i) => (
                                <span key={`ai-${i}`} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs shadow-sm">
                                    {e}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Confirmation Info */}
                    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-700">确认生效</div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${profile.confirmedAt ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {profile.confirmedAt ? '已确认' : '待确认'}
                            </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                            <div>
                                <div className="text-[10px] text-slate-400">确认人</div>
                                <div className="font-medium text-slate-700">{profile.confirmedBy || '-'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400">确认时间</div>
                                <div className="font-medium text-slate-700">{formattedConfirmAt}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400">生效范围</div>
                                <div className="font-medium text-slate-700">{profile.confirmScope || '当前表'}</div>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                            <span>确认生效将写入语义注册表，可追溯版本</span>
                            {onViewLogs && (
                                <button onClick={onViewLogs} className="text-blue-600 hover:underline">
                                    回滚入口
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100">
                        {isGateFailed ? (
                            <button
                                onClick={onReject}
                                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all"
                            >
                                标记为不纳入治理范围（原因/责任人/可恢复）
                            </button>
                        ) : (
                            <>
                                {!isEditing ? (
                                    <button onClick={onEdit} className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all">
                                        修正结果
                                    </button>
                                ) : (
                                    <button onClick={onSaveEdit} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all">
                                        保存修正
                                    </button>
                                )}
                                {onConfirmEffective && (
                                    profile.confirmedAt ? (
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-sm border border-emerald-100">
                                            <CheckCircle size={14} />
                                            <span>已确认生效</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={onConfirmEffective}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm"
                                        >
                                            <CheckCircle size={18} />
                                            确认生效
                                        </button>
                                    )
                                )}
                                {existingBO ? (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm border border-amber-100">
                                        <AlertTriangle size={14} />
                                        <span>已生成业务对象: <span className="font-bold">{existingBO.name}</span></span>
                                    </div>
                                ) : (
                                    <button className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:-translate-y-0.5" onClick={onAccept}>
                                        <CheckCircle size={18} />
                                        加入候选业务对象
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            {/* V2.3: Modals */}
            {showCommentModal && (
                <CommentGenerationModal
                    fields={generateCommentSuggestions()}
                    onConfirm={handleCommentConfirm}
                    onCancel={() => setShowCommentModal(false)}
                />
            )}

            {showJsonModal && (
                <JsonFieldModal
                    fields={generateJsonFieldSuggestions()}
                    onIdentifyAsJson={handleJsonIdentify}
                    onMarkAsExtension={handleJsonMarkExtension}
                    onCancel={() => setShowJsonModal(false)}
                />
            )}
        </div>
    );
};
