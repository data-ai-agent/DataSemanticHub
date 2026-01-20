import React, { useState } from 'react';
import {
    Activity, Box, Type, Briefcase, FileText, Scale,
    Check, AlertTriangle, ArrowRight, Clock, Shield,
    ChevronDown, ChevronRight, User, Settings, Info,
    Trash2, Plus, Edit2, X, Save, HelpCircle
} from 'lucide-react';
import { AnalysisResultVNext, BusinessObjectItem, RoleItem, ActionItem, ArtifactMaterialItem, ArtifactCheckItem, StateMachineDefinition, ConstraintCollection } from '../../../types/analysisVNext';
import { HintTooltip, TERMINOLOGY_HINTS } from '../../../components/ui/Tooltip';
import StateMachineVisualizer from '../../../components/ui/StateMachineVisualizer';

interface AnalysisResultPanelVNextProps {
    data: AnalysisResultVNext;
    loading: boolean;
    onGenerate: () => void;
    generating: boolean;
    onUpdate?: (data: AnalysisResultVNext) => void;
    readOnly?: boolean;
}

const AnalysisResultPanelVNext: React.FC<AnalysisResultPanelVNextProps> = ({ data, loading, onGenerate, generating, onUpdate, readOnly = false }) => {
    // const { header, elements } = data; // Moved destructing down after checks

    // Collapsed states for sections
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
        bo: false,
        roles: false,
        actions: false,
        artifacts: false,
        states: false,
        constraints: false
    });

    const toggleSection = (section: string) => {
        setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-500">
                <p>正在进行 Top-down 深度语义分析...</p>
                <p className="text-xs mt-2">识别对象、角色、行为、材料、状态机与业务约束</p>
            </div>
        );
    }

    if (!data) return null;

    const { header, elements } = data;

    // Helper to update elements safely
    const updateElements = (newElements: typeof elements) => {
        if (onUpdate) {
            onUpdate({
                ...data,
                elements: newElements
            });
        }
    };

    // Handlers for Interactive Editing
    const handleDeleteRole = (index: number) => {
        const newRoles = [...elements.roles.roles];
        newRoles.splice(index, 1);
        updateElements({
            ...elements,
            roles: { ...elements.roles, roles: newRoles }
        });
    };

    const handleAddRole = () => {
        const newRole: RoleItem = {
            type: "ROLE",
            item_id: `role_${Date.now()}`,
            label: "新角色",
            normalized_name: "new_role",
            source_span: "USER_ADDED",
            confidence: 1.0,
            status: "suggested",
            mapping: {
                actor_type: "person",
                responsibility: ["待补充职责"]
            }
        };
        updateElements({
            ...elements,
            roles: { ...elements.roles, roles: [...elements.roles.roles, newRole] }
        });
    };

    const handleUpdateRole = (index: number, val: string) => {
        const newRoles = [...elements.roles.roles];
        newRoles[index] = { ...newRoles[index], label: val, status: 'edited' };
        updateElements({
            ...elements,
            roles: { ...elements.roles, roles: newRoles }
        });
    };

    const handleDeleteAction = (index: number) => {
        const newActions = [...elements.actions.actions];
        newActions.splice(index, 1);
        updateElements({
            ...elements,
            actions: { ...elements.actions, actions: newActions }
        });
    };

    const handleAddAction = () => {
        const newAction: ActionItem = {
            type: "ACTION",
            item_id: `action_${Date.now()}`,
            label: "新行为",
            normalized_name: "new_action",
            source_span: "USER_ADDED",
            confidence: 1.0,
            status: "suggested",
            mapping: {
                action_category: "Process",
                actor_role: elements.roles.roles[0]?.label || "Actor",
                target_object: elements.business_objects.primary_object.label
            }
        };
        updateElements({
            ...elements,
            actions: { ...elements.actions, actions: [...elements.actions.actions, newAction] }
        });
    };

    const handleUpdateAction = (index: number, val: string) => {
        const newActions = [...elements.actions.actions];
        newActions[index] = { ...newActions[index], label: val, status: 'edited' };
        updateElements({
            ...elements,
            actions: { ...elements.actions, actions: newActions }
        });
    };

    const handleDeleteRelatedObject = (index: number) => {
        const newObjects = [...elements.business_objects.related_objects];
        newObjects.splice(index, 1);
        updateElements({
            ...elements,
            business_objects: { ...elements.business_objects, related_objects: newObjects }
        });
    };

    const handleAddRelatedObject = () => {
        const newObj: BusinessObjectItem = {
            type: "BO",
            item_id: `bo_${Date.now()}`,
            label: "新关联对象",
            normalized_name: "new_object",
            source_span: "USER_ADDED",
            confidence: 1.0,
            status: "suggested",
            mapping: {
                object_id: `bo_${Date.now()}`,
                object_category: 'general'
            }
        };
        updateElements({
            ...elements,
            business_objects: {
                ...elements.business_objects,
                related_objects: [...elements.business_objects.related_objects, newObj]
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 1. Header: Overview & Scores */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xs text-slate-500 font-mono mb-1">{header.scenario_id}</div>
                        <h3 className="font-bold text-slate-800">{header.scenario_name}</h3>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                            <div className="text-2xl font-bold text-indigo-600">{Math.round(header.confidence_overall * 100)}%</div>
                            <HintTooltip {...TERMINOLOGY_HINTS.confidence} />
                        </div>
                        <div className="text-xs text-slate-500">AI 置信度</div>
                    </div>
                </div>

                <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200 flex items-center gap-1">
                        覆盖度 {header.coverage_score}%
                        <HintTooltip {...TERMINOLOGY_HINTS.coverage} />
                    </span>
                    {header.risk_flags.map((flag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium border border-orange-200 flex items-center gap-1">
                            <AlertTriangle size={10} /> {flag}
                        </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200">
                        Top-down vNext
                    </span>
                </div>
            </div>

            {/* 2. Cards: 6 Categories */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                <Section
                    title={
                        <span className="flex items-center gap-2">
                            核心数据实体 (BO)
                            <HintTooltip {...TERMINOLOGY_HINTS.business_object} />
                        </span>
                    }
                    icon={Box}
                    color="indigo"
                    isCollapsed={collapsed.bo}
                    onToggle={() => toggleSection('bo')}
                    count={1 + elements.business_objects.related_objects.length}
                >

                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded uppercase">Core</div>
                            <span className="font-bold text-indigo-900">{elements.business_objects.primary_object.label}</span>
                            <span className="text-xs text-indigo-400 font-mono">({elements.business_objects.primary_object.normalized_name})</span>
                        </div>
                        <div className="text-xs text-slate-600 pl-2 border-l-2 border-indigo-200">
                            锚点对象 · 承载状态机 · {elements.business_objects.object_fields_suggested[0]?.fields.length || 0} 个建议字段
                        </div>
                    </div>

                    <div className="space-y-2 pl-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase">关联对象</div>
                        <div className="flex flex-wrap gap-2 items-center">
                            {elements.business_objects.related_objects.map((bo, i) => (
                                <div key={i} className="group relative px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 font-medium hover:border-indigo-300 hover:shadow-sm transition-all pr-6">
                                    {bo.label}
                                    {!readOnly && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteRelatedObject(i); }}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!readOnly && (
                                <button onClick={(e) => { e.stopPropagation(); handleAddRelatedObject(); }} className="px-2 py-1 bg-indigo-50 border border-indigo-100 border-dashed rounded text-xs text-indigo-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center gap-1">
                                    <Plus size={10} /> 添加
                                </button>
                            )}
                        </div>
                    </div>
                </Section>

                {/* B. Roles */}
                <Section
                    title={
                        <span className="flex items-center gap-2">
                            参与角色
                            <HintTooltip {...TERMINOLOGY_HINTS.roles} />
                        </span>
                    }
                    icon={User}
                    color="blue"
                    isCollapsed={collapsed.roles}
                    onToggle={() => toggleSection('roles')}
                    count={elements.roles.roles.length}
                >
                    <div className="grid grid-cols-1 gap-2">
                        {elements.roles.roles.map((role, i) => (
                            <EditableListItem
                                key={i}
                                label={role.label}
                                subText={`${role.mapping.org_unit || role.mapping.actor_type} · ${role.mapping.responsibility.join(', ')}`}
                                onUpdate={(val) => handleUpdateRole(i, val)}
                                onDelete={() => handleDeleteRole(i)}
                                readOnly={readOnly}
                            />
                        ))}
                        {!readOnly && (
                            <button onClick={(e) => { e.stopPropagation(); handleAddRole(); }} className="w-full py-1.5 border border-dashed border-slate-300 rounded text-xs text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                                <Plus size={12} /> 添加角色
                            </button>
                        )}
                    </div>
                </Section>

                {/* C. Actions */}
                <Section
                    title={
                        <span className="flex items-center gap-2">
                            关键操作步骤
                            <HintTooltip {...TERMINOLOGY_HINTS.actions} />
                        </span>
                    }
                    icon={Activity}
                    color="green"
                    isCollapsed={collapsed.actions}
                    onToggle={() => toggleSection('actions')}
                    count={elements.actions.actions.length}
                >
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-4 py-2">
                        {elements.actions.actions.map((act, i) => (
                            <div key={i} className="relative pl-4 group">
                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-green-400"></div>
                                <EditableListItem
                                    label={act.label}
                                    onUpdate={(val) => handleUpdateAction(i, val)}
                                    onDelete={() => handleDeleteAction(i)}
                                    readOnly={readOnly}
                                    simpleView
                                >
                                    <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                                        <span className="bg-slate-100 px-1 rounded">{act.mapping.action_category}</span>
                                        <span>{act.mapping.actor_role}</span>
                                        <ArrowRight size={10} className="mt-0.5 text-slate-400" />
                                        <span>{act.mapping.target_object}</span>
                                    </div>
                                </EditableListItem>
                            </div>
                        ))}
                        {!readOnly && (
                            <div className="relative pl-4">
                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-200 group-hover:border-green-400"></div>
                                <button onClick={(e) => { e.stopPropagation(); handleAddAction(); }} className="text-xs text-slate-400 hover:text-green-600 flex items-center gap-1 transition-colors">
                                    <Plus size={12} /> 添加行为
                                </button>
                            </div>
                        )}
                    </div>
                </Section>

                {/* D. Artifacts */}
                <Section
                    title={
                        <span className="flex items-center gap-2">
                            材料与数据
                            <HintTooltip {...TERMINOLOGY_HINTS.artifacts} />
                        </span>
                    }
                    icon={FileText}
                    color="amber"
                    isCollapsed={collapsed.artifacts}
                    onToggle={() => toggleSection('artifacts')}
                    count={elements.artifacts.materials.length + elements.artifacts.data_checks.length}
                >

                    {/* Materials */}
                    {elements.artifacts.materials.length > 0 && (
                        <div className="mb-3">
                            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">上传材料</div>
                            {elements.artifacts.materials.map((mat, i) => (
                                <div key={i} className="flex items-start gap-2 mb-2 p-2 bg-amber-50/30 border border-amber-100 rounded">
                                    <FileText size={14} className="text-amber-500 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-800">{mat.label}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1">
                                            {mat.mapping.format.map(f => <span key={f} className="bg-white px-1 border rounded">{f}</span>)}
                                            {mat.mapping.required === true && <span className="text-red-500">*必传</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Data Checks */}
                    {elements.artifacts.data_checks.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">数据核验 (接口/共享)</div>
                            {elements.artifacts.data_checks.map((chk, i) => (
                                <div key={i} className="flex items-start gap-2 mb-2 p-2 bg-white border border-slate-200 rounded">
                                    <Shield size={14} className="text-indigo-500 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-800">{chk.label}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            来源: {chk.mapping.data_source_org} · {chk.mapping.access_mode}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* E. State Machine - Now with Visualizer */}
                <Section
                    title={
                        <span className="flex items-center gap-2">
                            流程状态流转
                            <HintTooltip {...TERMINOLOGY_HINTS.state_machine} />
                        </span>
                    }
                    icon={Clock}
                    color="purple"
                    isCollapsed={collapsed.states}
                    onToggle={() => toggleSection('states')}
                    count={elements.state_machine.states.length}
                >
                    <StateMachineVisualizer
                        states={elements.state_machine.states}
                        transitions={elements.state_machine.transitions}
                        primaryObject={elements.business_objects.primary_object.label}
                    />
                </Section>

                {/* F. Constraints */}
                <Section
                    title={
                        <span className="flex items-center gap-2">
                            时限与约束
                            <HintTooltip {...TERMINOLOGY_HINTS.constraints} />
                        </span>
                    }
                    icon={Scale}
                    color="rose"
                    isCollapsed={collapsed.constraints}
                    onToggle={() => toggleSection('constraints')}
                    count={elements.constraints.time_limits.length + elements.constraints.eligibility_rules.length}
                >
                    <div className="space-y-2">
                        {elements.constraints.time_limits.map((tl, i) => (
                            <div key={i} className="flex justify-between text-xs p-1.5 bg-rose-50 text-rose-800 rounded">
                                <span>🛑 {tl.label}</span>
                                <span className="font-mono font-bold">{tl.mapping.duration} {tl.mapping.unit}</span>
                            </div>
                        ))}
                        {elements.constraints.eligibility_rules.map((rule, i) => (
                            <div key={i} className="flex flex-col text-xs p-1.5 bg-slate-50 text-slate-700 rounded border border-slate-100">
                                <span className="font-medium">⚖️ {rule.label}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{rule.mapping.rule_expression}</span>
                            </div>
                        ))}
                    </div>
                </Section>

            </div>

            {/* 3. Footer: Generate */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-slate-500">将生成: Schema, 状态机, 规则包</span>
                    <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                        <Settings size={12} /> 配置
                    </button>
                </div>
                <button
                    onClick={onGenerate}
                    disabled={generating}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-wait"
                >
                    {generating ? <span className="animate-spin">⏳</span> : <Briefcase size={16} />}
                    生成业务对象建议 (vNext)
                </button>
            </div>
        </div>
    );
};

// Helper Component for Collapsible Sections
const Section: React.FC<{
    title: React.ReactNode;
    icon: React.ElementType;
    color: string;
    isCollapsed: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    count?: number;
}> = ({ title, icon: Icon, color, isCollapsed, onToggle, children, count }) => {
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
            <button
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b ${isCollapsed ? 'border-transparent' : 'border-slate-100'}`}
            >
                <div className="flex items-center gap-2">
                    <div className={`p-1 rounded bg-${color}-100 text-${color}-600`}>
                        <Icon size={14} />
                    </div>
                    <span className="font-bold text-sm text-slate-700">{title}</span>
                    {count !== undefined && (
                        <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{count}</span>
                    )}
                </div>
                {isCollapsed ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {!isCollapsed && (
                <div className="p-3 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

// Helper Component for Inline Editing
const EditableListItem: React.FC<{
    label: string;
    subText?: string;
    onUpdate: (val: string) => void;
    onDelete: () => void;
    readOnly?: boolean;
    simpleView?: boolean;
    children?: React.ReactNode;
}> = ({ label, subText, onUpdate, onDelete, readOnly, simpleView, children }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(label);

    const handleSave = () => {
        if (editValue.trim() && editValue !== label) {
            onUpdate(editValue);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className={`flex items-center gap-2 ${simpleView ? '' : 'p-2 bg-white border border-indigo-200 rounded shadow-sm'}`} onClick={e => e.stopPropagation()}>
                <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                />
                <button onMouseDown={handleSave} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
            </div>
        );
    }

    return (
        <div className={`group flex justify-between items-start ${simpleView ? '' : 'p-2 bg-white border border-slate-100 rounded hover:border-blue-200 transition-colors'}`}>
            <div className="flex-1" onClick={(e) => {
                if (!readOnly) {
                    e.stopPropagation();
                    setIsEditing(true);
                }
            }}>
                <div className={`font-medium text-sm text-slate-800 ${!readOnly && 'cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1.5'}`}>
                    {label}
                    {!readOnly && <Edit2 size={10} className="opacity-0 group-hover:opacity-30" />}
                </div>
                {subText && <div className="text-xs text-slate-500">{subText}</div>}
                {children}
            </div>
            {!readOnly && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`确定要删除 "${label}" 吗？`)) {
                            onDelete();
                        }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};

export default AnalysisResultPanelVNext;
