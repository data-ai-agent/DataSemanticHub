import React, { useState, useEffect } from 'react';
import { Check, X, Tag, BookOpen, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { FieldSemanticProfile, SemanticRole } from '../../../types/semantic';

interface Evidence {
    qualitySignals?: {
        nullRatio?: number;
        distinctCount?: number;
        top3Concentration?: number;
    };
    nameMatch?: {
        similarity: number;
        matchedPattern?: string;
    };
    sampleAnalysis?: string;
}

interface DecisionAudit {
    decidedBy?: string;
    decidedAt?: string;
}

interface SemanticDecisionPanelProps {
    fieldName: string;
    fieldProfile: FieldSemanticProfile;
    evidence?: Evidence;
    decisionAudit?: DecisionAudit;
    domain?: string;
    onDecision: (decision: {
        role: SemanticRole;
        term?: string;
        tags?: string[];
        domain?: string;
        action: 'ACCEPT_AI' | 'ACCEPT_RULE' | 'MODIFY' | 'REJECT';
        comment?: string;
    }) => void;
    className?: string;
}

// User-friendly role mapping with icons and descriptions  
const ROLE_CONFIG: Record<SemanticRole, { label: string; icon: string; desc: string; example: string }> = {
    'Identifier': { label: '标识字段', icon: '🔑', desc: '唯一标识记录', example: 'user_id, order_no' },
    'ForeignKey': { label: '外键字段', icon: '🔗', desc: '关联其他表', example: 'customer_id, product_id' },
    'BusAttr': { label: '业务属性', icon: '💼', desc: '核心业务信息', example: 'name, title, amount' },
    'Status': { label: '状态字段', icon: '📊', desc: '记录状态、阶段', example: 'status, state' },
    'Time': { label: '时间字段', icon: '⏱️', desc: '时间点、时间戳', example: 'created_at, update_time' },
    'EventHint': { label: '事件线索', icon: '🕐', desc: '时间、操作人等', example: 'created_at, updated_by' },
    'Measure': { label: '度量字段', icon: '📈', desc: '数值指标、度量', example: 'amount, count, price' },
    'Attribute': { label: '通用属性', icon: '📋', desc: '一般属性字段', example: 'description, remark' },
    'Audit': { label: '审计字段', icon: '📝', desc: '操作者、审计信息', example: 'created_by, updated_by' },
    'Technical': { label: '技术属性', icon: '⚙️', desc: '系统技术字段', example: 'version, hash' }
};

const ROLES: SemanticRole[] = [
    'Identifier', 'ForeignKey', 'BusAttr', 'Status', 'Time', 'EventHint', 'Measure', 'Attribute', 'Audit', 'Technical'
];

export const SemanticDecisionPanel: React.FC<SemanticDecisionPanelProps> = ({
    fieldName,
    fieldProfile,
    evidence,
    decisionAudit,
    domain: initialDomain,
    onDecision,
    className
}) => {
    const [role, setRole] = useState<SemanticRole>(fieldProfile.role || 'Attribute');
    const [term, setTerm] = useState(fieldProfile.aiSuggestion || ''); // Mock: assuming suggestion is term-like
    const [tags, setTags] = useState<string[]>(fieldProfile.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [domain, setDomain] = useState(initialDomain || '未分类');
    const [comment, setComment] = useState('');

    // Generate AI suggested comment based on role
    const generateAIComment = (role: SemanticRole) => {
        const desc = ROLE_CONFIG[role]?.desc || '记录业务信息';
        return `该字段用于${desc}。`;
    };

    // Reset state when field changes - auto-fill with AI suggestions
    useEffect(() => {
        const newRole = fieldProfile.role || 'Attribute';
        setRole(newRole);
        setTerm(fieldProfile.aiSuggestion || '');
        setTags(fieldProfile.tags || []);
        setDomain(initialDomain || '未分类');
        // Auto-fill comment with AI suggestion
        setComment(generateAIComment(newRole));
    }, [fieldName, fieldProfile, initialDomain]);

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleAcceptAI = () => {
        onDecision({
            role,
            term,
            tags,
            domain,
            action: 'ACCEPT_AI',
            comment
        });
    };

    const handleModify = () => {
        onDecision({
            role,
            term,
            tags,
            domain,
            action: 'MODIFY',
            comment
        });
    };

    const handleReject = () => {
        onDecision({
            role,
            action: 'REJECT',
            comment: comment || '已拒绝'
        });
    };

    const isAiSuggestion = fieldProfile.semanticStatus === 'SUGGESTED';
    const isRuleMatched = fieldProfile.semanticStatus === 'RULE_MATCHED';
    const isDecided = fieldProfile.semanticStatus === 'DECIDED';

    return (
        <div className={`flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm h-full overflow-hidden ${className}`}>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-600" />
                    语义判定
                </h3>
                {isDecided ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <Check size={12} /> 已确认
                    </span>
                ) : (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border ${(fieldProfile.roleConfidence || 0) > 80 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        (fieldProfile.roleConfidence || 0) > 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        AI置信度 {fieldProfile.roleConfidence || 0}分
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
                {/* AI / Rule Suggestion Alert */}
                {(isAiSuggestion || isRuleMatched) && !isDecided && (
                    <div className={`border rounded-lg p-3 flex items-start gap-3 ${(fieldProfile.roleConfidence || 0) < 60 ? 'bg-amber-50 border-amber-100' : 'bg-purple-50 border-purple-100'
                        }`}>
                        {(fieldProfile.roleConfidence || 0) < 60 ? (
                            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                            <Sparkles size={16} className="text-purple-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                            <div className={`text-sm font-medium ${(fieldProfile.roleConfidence || 0) < 60 ? 'text-amber-900' : 'text-purple-900'
                                }`}>
                                {isAiSuggestion ? 'AI 语义建议' : '规则匹配结果'}
                                {(fieldProfile.roleConfidence || 0) < 60 && ' (置信度较低)'}
                            </div>
                            <div className={`text-xs mt-1 ${(fieldProfile.roleConfidence || 0) < 60 ? 'text-amber-700' : 'text-purple-700'
                                }`}>
                                建议将此字段标记为 <span className="font-bold">{fieldProfile.role}</span>
                                {fieldProfile.aiSuggestion && `，并关联术语 "${fieldProfile.aiSuggestion}"`}。
                                {(fieldProfile.roleConfidence || 0) < 60 && (
                                    <div className="mt-1 font-medium">请结合左侧质量信号仔细核对。</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Evidence Section */}
                {evidence && (isAiSuggestion || isRuleMatched) && (
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                        <div className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            推理证据
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                            {evidence.qualitySignals && (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">质量信号:</span>
                                    <span>空值率 {((evidence.qualitySignals.nullRatio || 0) * 100).toFixed(1)}%</span>
                                    <span>唯一值 {evidence.qualitySignals.distinctCount || 0}</span>
                                    {evidence.qualitySignals.top3Concentration !== undefined && (
                                        <span>Top3集中度 {(evidence.qualitySignals.top3Concentration * 100).toFixed(1)}%</span>
                                    )}
                                </div>
                            )}
                            {evidence.nameMatch && (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">名称匹配:</span>
                                    <span>相似度 {(evidence.nameMatch.similarity * 100).toFixed(0)}%</span>
                                    {evidence.nameMatch.matchedPattern && (
                                        <span className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">{evidence.nameMatch.matchedPattern}</span>
                                    )}
                                </div>
                            )}
                            {evidence.sampleAnalysis && (
                                <div className="text-slate-500">{evidence.sampleAnalysis}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                    {/* Role Selection - Enhanced with user-friendly labels */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            字段角色 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as SemanticRole)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        >
                            {ROLES.map(r => {
                                const config = ROLE_CONFIG[r];
                                return (
                                    <option key={r} value={r}>
                                        {config.icon} {config.label}
                                    </option>
                                );
                            })}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                            示例: {ROLE_CONFIG[role].example}
                        </p>
                    </div>

                    {/* Term Binding */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            <BookOpen size={14} /> 标准术语
                            {fieldProfile.aiSuggestion && <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded">AI</span>}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                placeholder="搜索标准术语..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow pl-9"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            关联标准术语以统一口径
                        </p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            <Tag size={14} /> 业务标签
                            <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded">AI</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-100 min-h-[38px]">
                            {tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                placeholder={tags.length === 0 ? "输入标签按回车..." : ""}
                                className="bg-transparent border-none outline-none text-xs min-w-[100px] flex-1"
                            />
                        </div>
                    </div>

                    {/* Domain */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            业务域
                            <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded">AI</span>
                        </label>
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="数据所属业务域"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            可根据字段特点调整
                        </p>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            备注说明
                            <span className="text-[9px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded">AI</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow h-16 resize-none"
                            placeholder="记录决策依据或特殊说明（可选）"
                        />
                    </div>
                </div>
            </div>


            {/* Audit Mini */}
            {isDecided && decisionAudit && (decisionAudit.decidedBy || decisionAudit.decidedAt) && (
                <div className="px-5 py-3 border-t border-slate-100 bg-blue-50/30">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="font-medium text-slate-500">审计信息:</span>
                        {decisionAudit.decidedBy && (
                            <span>决策人: <span className="font-medium text-slate-700">{decisionAudit.decidedBy}</span></span>
                        )}
                        {decisionAudit.decidedAt && (
                            <span>决策时间: <span className="font-medium text-slate-700">{decisionAudit.decidedAt}</span></span>
                        )}
                    </div>
                </div>
            )}

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex flex-col gap-2">
                    {isDecided ? (
                        <button
                            onClick={handleModify}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all active:scale-[0.98]"
                        >
                            更新判定
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleAcceptAI}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Check size={16} /> 确认并采纳
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleModify}
                                    className="py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    修改并接受
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                                >
                                    拒绝
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Simple internal component for search icon
const SearchIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);
