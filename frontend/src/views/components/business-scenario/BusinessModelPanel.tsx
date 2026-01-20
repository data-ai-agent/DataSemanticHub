import React, { useState } from 'react';
import {
    Database, Table, Activity, GitMerge, List, Settings,
    Save, ChevronRight, Layout, Key, Shield, AlertCircle, History
} from 'lucide-react';
import { AnalysisResultVNext } from '../../../types/analysisVNext';
import { BusinessModel, CandidateItem, ModelVersion } from '../../../types/scene-model';
import { validationService, ValidationResult } from '../../../services/validation/validationService';
import VersionHistoryPanel from './VersionHistoryPanel';

interface BusinessModelPanelProps {
    data: AnalysisResultVNext | BusinessModel['working_copy'];
    versions?: ModelVersion[];
    onSave: () => void;
    onPublish?: () => void;
    onRollback?: (versionId: string) => void;
}

// Internal normalized view structure
interface ViewData {
    primaryObject: { id: string; label: string; normalized_name: string; type: string; mapping: any };
    allObjects: { id: string; label: string; normalized_name: string; type: string; mapping: any }[];
    fieldSuggestions: { object: string; fields: any[] }[];
    relations: { from_object: string; relation: string; to_object: string }[];
    stateMachine: {
        primary_object: string;
        states: { state_code: string; state_name: string; is_terminal?: boolean }[];
        transitions: { from_state: string; to_state: string; trigger_action: string; guard_conditions: string[] }[];
    };
    constraints: {
        time_limits: any[];
        eligibility_rules: any[];
    };
    isV2: boolean;
}

const normalizeData = (data: AnalysisResultVNext | BusinessModel['working_copy']): ViewData => {
    // Check if it's V2 (Working Copy)
    if ('working_copy' in data || 'primary_business_object' in data) {
        const v2 = data as BusinessModel['working_copy'];
        return {
            primaryObject: {
                ...v2.primary_business_object,
                id: v2.primary_business_object.id || 'primary',
                normalized_name: v2.primary_business_object.normalized_name || v2.primary_business_object.label,
                mapping: v2.primary_business_object.mapping || {}
            },
            allObjects: [v2.primary_business_object, ...v2.business_objects].map(o => ({
                ...o,
                id: o.id,
                label: o.label,
                normalized_name: o.normalized_name || o.label,
                type: o.type,
                mapping: o.mapping || {}
            })),
            fieldSuggestions: v2.field_suggestions || [],
            relations: (v2.relations || []).map(r => ({ from_object: r.from, relation: r.rel, to_object: r.to })),
            stateMachine: {
                primary_object: v2.state_machine.primary_object,
                states: v2.state_machine.states.map(s => ({ state_code: s.code, state_name: s.name, is_terminal: s.is_terminal })),
                transitions: v2.state_machine.transitions.map(t => ({
                    from_state: t.from,
                    to_state: t.to,
                    trigger_action: t.trigger_action,
                    guard_conditions: t.guards || []
                }))
            },
            constraints: {
                time_limits: [], // TODO: Add time limits to working copy
                eligibility_rules: v2.rules.map(r => ({
                    label: r.label,
                    normalized_name: r.normalized_name,
                    mapping: r.mapping || {}
                }))
            },
            isV2: true
        };
    }

    // It is V1 (AnalysisResultVNext)
    const v1 = data as AnalysisResultVNext;
    const { elements } = v1;
    return {
        primaryObject: { ...elements.business_objects.primary_object, id: elements.business_objects.primary_object.item_id },
        allObjects: [
            elements.business_objects.primary_object,
            ...elements.business_objects.related_objects
        ].map(o => ({
            ...o,
            id: o.item_id,
            label: o.label,
            normalized_name: o.normalized_name,
            type: o.type,
            mapping: o.mapping
        })),
        fieldSuggestions: elements.business_objects.object_fields_suggested,
        relations: elements.business_objects.object_relations,
        stateMachine: elements.state_machine,
        constraints: elements.constraints,
        isV2: false
    };
}

const BusinessModelPanel: React.FC<BusinessModelPanelProps> = ({ data, versions = [], onSave, onPublish, onRollback }) => {
    const viewData = normalizeData(data);
    const { allObjects, primaryObject, fieldSuggestions, relations, stateMachine, constraints, isV2 } = viewData;

    const [selectedObjectId, setSelectedObjectId] = useState<string>(primaryObject.id);
    const [activeView, setActiveView] = useState<'schema' | 'states' | 'rules'>('schema');
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [showVersionHistory, setShowVersionHistory] = useState(false);

    // Validate on load if V2
    React.useEffect(() => {
        if (isV2) {
            const result = validationService.validate(data as BusinessModel['working_copy']);
            setValidation(result);
        }
    }, [data, isV2]);

    const selectedObject = allObjects.find(o => o.id === selectedObjectId) || allObjects[0];
    const selectedFields = fieldSuggestions.find(f => f.object === selectedObject?.normalized_name)?.fields || [];

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Toolbar */}
            <div className="h-10 border-b border-slate-200 bg-white flex items-center justify-between px-3">
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button
                        onClick={() => setActiveView('schema')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1.5
                            ${activeView === 'schema' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Database size={12} /> 模型定义
                    </button>
                    <button
                        onClick={() => setActiveView('states')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1.5
                            ${activeView === 'states' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <GitMerge size={12} /> 状态机
                    </button>
                    <button
                        onClick={() => setActiveView('rules')}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1.5
                            ${activeView === 'rules' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <List size={12} /> 业务规则
                    </button>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Validation Status */}
                    {validation && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${validation.isValid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {validation.isValid ? <Shield size={11} /> : <AlertCircle size={11} />}
                            <span>完整度: {validation.score}%</span>
                        </div>
                    )}

                    {/* Version History Button */}
                    {versions.length > 0 && (
                        <button
                            onClick={() => setShowVersionHistory(true)}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 transition-colors shadow-sm"
                            title="查看版本历史"
                        >
                            <History size={12} /> {versions.length}
                        </button>
                    )}

                    <button
                        onClick={onSave}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1 transition-colors shadow-sm"
                    >
                        <Save size={12} /> 保存草稿
                    </button>

                    {onPublish && (
                        <button
                            onClick={onPublish}
                            disabled={!validation?.isValid}
                            className={`px-2.5 py-1 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors shadow-sm
                                ${validation?.isValid
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-slate-300 cursor-not-allowed'}`}
                            title={validation?.isValid ? "发布从模型" : "请先完善模型必填项"}
                        >
                            <Layout size={12} /> 发布模型
                        </button>
                    )}
                </div>
            </div>


            <div className="flex-1 flex overflow-hidden">
                {/* View Content */}
                {activeView === 'schema' && (
                    <>
                        {/* Sidebar: Object List */}
                        <div className="w-48 bg-white border-r border-slate-200 flex flex-col">
                            <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">业务对象列表</div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                                {allObjects.map(obj => (
                                    <button
                                        key={obj.id}
                                        onClick={() => setSelectedObjectId(obj.id)}
                                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5
                                            ${selectedObjectId === obj.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <Table size={12} className={obj.type === 'BO' && obj.mapping.object_id?.includes(primaryObject.normalized_name) ? "text-indigo-500" : "text-slate-400"} />
                                        <span className="truncate flex-1">{obj.label}</span>
                                        {obj.id === primaryObject.id && (
                                            <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1 rounded">主</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main: Field Table */}
                        <div className="flex-1 bg-white overflow-y-auto p-4">
                            <div className="mb-3 flex items-start justify-between">
                                <div className="flex-1">
                                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        {selectedObject?.label}
                                        <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {selectedObject?.normalized_name}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        类型: {selectedObject?.mapping?.object_category || 'Unknown'} · 来源: 语义分析推导
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100 flex items-center gap-1">
                                        <Shield size={10} /> {selectedFields.length} 个字段
                                    </span>
                                </div>
                            </div>


                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">字段名称 (Field)</th>
                                            <th className="px-3 py-2 font-medium w-28">类型 (Type)</th>
                                            <th className="px-3 py-2 font-medium w-16 text-center">必填</th>
                                            <th className="px-3 py-2 font-medium w-16 text-center">隐私</th>
                                            <th className="px-3 py-2 font-medium w-24">来源</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedFields.length > 0 ? (
                                            selectedFields.map((field: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 group">
                                                    <td className="px-3 py-2">
                                                        <div className="font-mono text-slate-700 font-medium text-xs">{field.field_name}</div>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-600">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{field.field_type}</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        {field.required ? (
                                                            <span className="text-red-500 font-bold">•</span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium
                                                            ${field.privacy_level === 'L1' ? 'bg-green-100 text-green-700' :
                                                                field.privacy_level === 'L2' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'}`}>
                                                            {field.privacy_level}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-500 text-[10px]">
                                                        {field.source || 'AI'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-6 text-center text-slate-400 text-xs">
                                                    暂无字段建议
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Relations Table (if selected is Primary) */}
                            {selectedObject?.id === primaryObject.id && (
                                <div className="mt-4">
                                    <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                        <GitMerge size={12} /> 对象关系 (Relations)
                                    </h3>
                                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                        <table className="w-full text-xs">
                                            <tbody className="divide-y divide-slate-100">
                                                {relations.map((rel, i) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="px-3 py-1.5 text-right w-1/3 font-mono text-indigo-600">{rel.from_object}</td>
                                                        <td className="px-3 py-1.5 text-center w-20">
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-[10px] text-slate-600 font-mono">{rel.relation}</span>
                                                        </td>
                                                        <td className="px-3 py-1.5 text-left w-1/3 font-mono text-slate-700">{rel.to_object}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeView === 'states' && (
                    <div className="p-4 flex-1 overflow-y-auto">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                                <Activity className="text-purple-600" size={14} />
                                状态机定义: {stateMachine.primary_object || selectedObject?.normalized_name}
                            </h2>

                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {stateMachine.states.map((state: any) => (
                                    <div key={state.state_code} className={`p-2.5 rounded-lg border ${state.is_terminal ? 'bg-slate-50 border-slate-200' : 'bg-white border-purple-200 shadow-sm'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-800">{state.state_name}</span>
                                            {state.is_terminal && <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded">终态</span>}
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-400">{state.state_code}</div>
                                    </div>
                                ))}
                            </div>

                            <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">流转规则 (Transitions)</h3>
                            <div className="space-y-2">
                                {stateMachine.transitions.map((trans: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div className="w-24 text-xs font-medium text-slate-700 text-right">{trans.from_state}</div>
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="text-[10px] text-purple-600 font-medium mb-0.5">{trans.trigger_action}</div>
                                            <div className="w-full h-px bg-slate-300 relative">
                                                <ChevronRight size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            {trans.guard_conditions.length > 0 && (
                                                <div className="mt-0.5 flex gap-1">
                                                    {trans.guard_conditions.map((g: string, gi: number) => (
                                                        <span key={gi} className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-100 max-w-[120px] truncate" title={g}>
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-24 text-xs font-medium text-slate-700">{trans.to_state}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'rules' && (
                    <div className="p-4 flex-1 overflow-y-auto">
                        <div className="max-w-3xl mx-auto space-y-4">

                            {/* Constraints */}
                            {constraints.time_limits.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                                        <AlertCircle className="text-rose-600" size={14} />
                                        业务约束 (Time Limits)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {constraints.time_limits.map((tl: any, i: number) => (
                                            <div key={i} className="p-2.5 bg-white border border-rose-100 rounded-lg shadow-sm flex justify-between items-center">
                                                <div>
                                                    <div className="text-xs font-medium text-slate-800">{tl.label}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">开始于: {tl.mapping.start_event}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-base font-bold text-rose-600 font-mono">
                                                        {tl.mapping.duration} <span className="text-xs font-normal text-rose-400">{tl.mapping.unit}</span>
                                                    </div>
                                                    <div className="text-[9px] text-rose-400">超时: {tl.mapping.breach_action}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Eligibility Rules */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                                    <Shield className="text-indigo-600" size={14} />
                                    准入规则 (Eligibility)
                                </h3>
                                <div className="space-y-2">
                                    {constraints.eligibility_rules.map((rule: any, i: number) => (
                                        <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            <div className="flex justify-between mb-1.5">
                                                <div className="text-xs font-medium text-slate-800">{rule.label}</div>
                                                <div className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{rule.normalized_name}</div>
                                            </div>
                                            <div className="p-1.5 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] text-slate-600">
                                                {rule.mapping?.rule_expression || JSON.stringify(rule.mapping)}
                                            </div>
                                            {rule.mapping?.inputs && (
                                                <div className="mt-1.5 flex gap-3 text-[10px] text-slate-500">
                                                    <div>Inputs: {rule.mapping.inputs.join(', ')}</div>
                                                    <div>Code: {rule.mapping.reason_code}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* Version History Modal */}
            {showVersionHistory && (
                <VersionHistoryPanel
                    versions={versions}
                    currentVersionId={versions[0]?.version_id}
                    onPreview={(version) => {
                        // For now, just log - could show a preview modal
                        console.log('Preview version:', version);
                    }}
                    onRollback={(version) => {
                        if (onRollback) {
                            onRollback(version.version_id);
                            setShowVersionHistory(false);
                        }
                    }}
                    onClose={() => setShowVersionHistory(false)}
                />
            )}
        </div>
    );
};

export default BusinessModelPanel;
