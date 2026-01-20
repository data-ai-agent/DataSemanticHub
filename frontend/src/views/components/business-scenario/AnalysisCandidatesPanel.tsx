import React, { useState } from 'react';
import { RecognitionRun, CandidateItem } from '../../../types/scene-model';
import {
    AlertTriangle, CheckCircle2, Circle, AlertCircle,
    ChevronDown, ChevronRight, Box, Users, Activity,
    FileText, GitBranch, ArrowRight
} from 'lucide-react';

interface AnalysisCandidatesPanelProps {
    data: RecognitionRun;
    loading?: boolean;
    onAccept?: (id: string, type: string) => void;
    onReject?: (id: string, type: string) => void;
    onEdit?: (id: string, type: string) => void;
}

const AnalysisCandidatesPanel: React.FC<AnalysisCandidatesPanelProps> = ({
    data,
    loading,
    onAccept,
    onReject,
    onEdit
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'bo': true,
        'roles': true,
        'actions': true,
        'artifacts': false,
        'states': false
    });

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper to render confidence score
    const renderConfidence = (score: number) => {
        const color = score >= 0.9 ? 'text-green-600' : score >= 0.7 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-bold ${color}`}>{(score * 100).toFixed(0)}%</span>;
    };

    // Helper to render a candidate card
    const CandidateCard = ({ item, icon: Icon }: { item: CandidateItem, icon: any }) => {
        const isPending = item.status === 'pending';
        const isAccepted = item.status === 'accepted';
        const isRejected = item.status === 'rejected';

        return (
            <div className={`
                border rounded-lg p-3 mb-2 transition-all group
                ${isAccepted ? 'bg-green-50 border-green-200' :
                    isRejected ? 'bg-slate-50 border-slate-200 opacity-60' :
                        'bg-white border-slate-200 hover:shadow-md'}
            `}>
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2 flex-1">
                        <div className={`mt-0.5 p-1.5 rounded ${isAccepted ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-500'}`}>
                            {isAccepted ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div className={`font-medium text-sm flex items-center gap-2 ${isRejected ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {item.label}
                                    {/* Status Badge */}
                                    {!isPending && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase border ${isAccepted ? 'bg-green-100 text-green-700 border-green-200' :
                                            isRejected ? 'bg-slate-100 text-slate-500 border-slate-200' : ''
                                            }`}>
                                            {item.status}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs">
                                    {renderConfidence(item.confidence)}
                                </div>
                            </div>

                            {item.normalized_name && (
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                    {item.normalized_name}
                                </div>
                            )}

                            {/* Render Mappings (simplified) */}
                            {item.mapping && Object.keys(item.mapping).length > 0 && !isRejected && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {Object.entries(item.mapping).map(([k, v]) => (
                                        <span key={k} className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded text-slate-500 border border-slate-100">
                                            {k}: {Array.isArray(v) ? v.join(', ') : v}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Actions Toolbar */}
                            {isPending && (
                                <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onAccept?.(item.id, item.type)}
                                        className="flex-1 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs rounded border border-green-200 flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <CheckCircle2 size={12} /> 采纳
                                    </button>
                                    <button
                                        onClick={() => onReject?.(item.id, item.type)}
                                        className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <AlertCircle size={12} /> 忽略
                                    </button>
                                    <button
                                        onClick={() => onEdit?.(item.id, item.type)}
                                        className="px-2 py-1 text-slate-400 hover:text-blue-600 text-xs transition-colors"
                                        title="编辑"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* 1. Header Metrics */}
            <div className="px-5 py-4 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={18} className="text-indigo-600" />
                        AI 识别结果
                    </h3>
                    <div className="text-xs text-slate-400">
                        Version: {data.model_version}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1">置信度 (Confidence)</div>
                        <div className="text-lg font-bold text-slate-800">{renderConfidence(data.confidence_overall)}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1">模板覆盖率 (Coverage)</div>
                        <div className="text-lg font-bold text-slate-800">{(data.coverage_score * 100).toFixed(0)}%</div>
                    </div>
                </div>
            </div>

            {/* 2. Gap Analysis Alerts */}
            <div className="px-5 py-3 space-y-2">
                {data.gap_analysis.required_but_missing.map((gap, idx) => (
                    <div key={`gap-req-${idx}`} className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                        <span><span className="font-bold">缺失必填项:</span> {gap.message}</span>
                    </div>
                ))}
                {data.gap_analysis.suggested_but_missing.map((gap, idx) => (
                    <div key={`gap-sug-${idx}`} className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-800">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-orange-600" />
                        <span><span className="font-bold">优化建议:</span> {gap.message}</span>
                    </div>
                ))}
            </div>

            {/* 3. Candidates List (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">

                {/* Business Objects */}
                <CollapsibleSection
                    title="业务对象"
                    count={1 + data.candidates.business_objects.related_objects.length}
                    icon={Box}
                    expanded={expandedSections['bo']}
                    onToggle={() => toggleSection('bo')}
                >
                    <div className="pl-4 border-l-2 border-slate-100 ml-2 space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase mb-1">主对象 (Primary)</div>
                        <CandidateCard item={data.candidates.business_objects.primary_object} icon={Box} />

                        {data.candidates.business_objects.related_objects.length > 0 && (
                            <>
                                <div className="text-xs font-semibold text-slate-400 uppercase mt-3 mb-1">关联对象 (Related)</div>
                                {data.candidates.business_objects.related_objects.map(obj => (
                                    <CandidateCard key={obj.id} item={obj} icon={Box} />
                                ))}
                            </>
                        )}
                    </div>
                </CollapsibleSection>

                {/* Roles */}
                <CollapsibleSection
                    title="参与角色"
                    count={data.candidates.roles.length}
                    icon={Users}
                    expanded={expandedSections['roles']}
                    onToggle={() => toggleSection('roles')}
                >
                    <div className="pl-4 border-l-2 border-slate-100 ml-2">
                        {data.candidates.roles.map(role => (
                            <CandidateCard key={role.id} item={role} icon={Users} />
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Actions */}
                <CollapsibleSection
                    title="业务动作"
                    count={data.candidates.actions.length}
                    icon={Activity}
                    expanded={expandedSections['actions']}
                    onToggle={() => toggleSection('actions')}
                >
                    <div className="pl-4 border-l-2 border-slate-100 ml-2">
                        {data.candidates.actions.map(action => (
                            <CandidateCard key={action.id} item={action} icon={Activity} />
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Artifacts */}
                <CollapsibleSection
                    title="材料与凭证"
                    count={data.candidates.artifacts.materials.length}
                    icon={FileText}
                    expanded={expandedSections['artifacts']}
                    onToggle={() => toggleSection('artifacts')}
                >
                    <div className="pl-4 border-l-2 border-slate-100 ml-2">
                        {data.candidates.artifacts.materials.map(mat => (
                            <CandidateCard key={mat.id} item={mat} icon={FileText} />
                        ))}
                    </div>
                </CollapsibleSection>

                {/* State Machine Preview */}
                <CollapsibleSection
                    title="状态机流转"
                    count={data.candidates.state_machine.states.length}
                    icon={GitBranch}
                    expanded={expandedSections['states']}
                    onToggle={() => toggleSection('states')}
                >
                    <div className="pl-4 border-l-2 border-slate-100 ml-2 bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex flex-wrap gap-2 items-center text-sm">
                            {data.candidates.state_machine.states.map((state, idx) => (
                                <React.Fragment key={state.code}>
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100 font-medium">
                                        {state.name}
                                    </span>
                                    {idx < data.candidates.state_machine.states.length - 1 && (
                                        <ArrowRight size={12} className="text-slate-300" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </CollapsibleSection>

            </div>
        </div>
    );
};

// Helper for Sections
const CollapsibleSection = ({ title, count, icon: Icon, expanded, onToggle, children }: any) => (
    <div>
        <button
            onClick={onToggle}
            className="flex items-center justify-between w-full p-2 hover:bg-slate-100 rounded-lg transition-colors group"
        >
            <div className="flex items-center gap-2 font-semibold text-slate-700">
                <Icon size={16} className="text-slate-500 group-hover:text-slate-700" />
                {title}
                <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {count}
                </span>
            </div>
            {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </button>
        {expanded && <div className="mt-2 text-sm text-slate-600 animate-in slide-in-from-top-1 duration-200">
            {children}
        </div>}
    </div>
);

export default AnalysisCandidatesPanel;
