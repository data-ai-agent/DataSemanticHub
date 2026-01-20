import React from 'react';
import { SceneTemplate } from '../../../types/scene-model';
import { SCENE_TEMPLATES } from '../../../data/mockTemplates';
import { Check, Info, Shield, Building, Layout, Settings, Lock, AlertCircle, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { BusinessModel } from '../../../types/scene-model';

interface SceneTemplateConfigPanelProps {
    selectedTemplateId?: string;
    onTemplateChange: (templateId: string) => void;
    onApplyTemplate?: () => void; // P1: Apply template confirmation
    readOnly?: boolean;
    workingCopy?: BusinessModel['working_copy']; // For requirement status calculation
}

const SceneTemplateConfigPanel: React.FC<SceneTemplateConfigPanelProps> = ({
    selectedTemplateId,
    onTemplateChange,
    readOnly = false,
    workingCopy
}) => {
    const selectedTemplate = SCENE_TEMPLATES.find(t => t.template_id === selectedTemplateId);
    const [expandedModule, setExpandedModule] = React.useState<string | null>(null);

    // Requirement Status Calculator
    const getRequirementStatus = (requirement: string): 'fulfilled' | 'partial' | 'missing' => {
        if (!workingCopy) return 'missing';

        switch (requirement) {
            case 'primary_business_object':
                return workingCopy.primary_business_object?.label ? 'fulfilled' : 'missing';
            case 'state_machine':
                return (workingCopy.state_machine?.states?.length || 0) > 0 ? 'fulfilled' : 'missing';
            case 'roles':
                return (workingCopy.roles?.length || 0) > 0 ? 'fulfilled' : 'missing';
            case 'materials':
                return (workingCopy.artifacts?.materials?.length || 0) > 0 ? 'fulfilled' : 'missing';
            case 'actions':
                return (workingCopy.actions?.length || 0) > 0 ? 'fulfilled' : 'missing';
            case 'rules':
                return (workingCopy.rules?.length || 0) > 0 ? 'fulfilled' : 'missing';
            default:
                return 'missing';
        }
    };

    const getStatusIcon = (status: 'fulfilled' | 'partial' | 'missing') => {
        switch (status) {
            case 'fulfilled':
                return <CheckCircle2 size={14} className="text-emerald-500" />;
            case 'partial':
                return <AlertTriangle size={14} className="text-amber-500" />;
            case 'missing':
                return <AlertCircle size={14} className="text-red-500" />;
        }
    };

    const getStatusLabel = (status: 'fulfilled' | 'partial' | 'missing') => {
        switch (status) {
            case 'fulfilled':
                return '已满足';
            case 'partial':
                return '部分识别';
            case 'missing':
                return '尚未识别';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'government_one_service': return <Shield size={18} className="text-blue-600" />;
            case 'enterprise_hr': return <Building size={18} className="text-indigo-600" />;
            case 'enterprise_supply_chain': return <Layout size={18} className="text-purple-600" />;
            default: return <Settings size={18} className="text-slate-600" />;
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Settings size={16} />
                    场景模板配置
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    AI 将基于模板进行针对性提取
                </span>
            </div>

            {/* Template Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                {SCENE_TEMPLATES.map(template => {
                    const descriptions: Record<string, string> = {
                        'gov_one_service_v1': '跨部门、多事项整合的政务服务场景',
                        'enterprise_hr_v1': '员工全生命周期管理场景',
                        'generic_v1': '尚未分类或自定义业务场景'
                    };

                    return (
                        <div
                            key={template.template_id}
                            className={`
                                relative p-2.5 rounded-lg border cursor-pointer transition-all
                                ${selectedTemplateId === template.template_id
                                    ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-200'
                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                }
                                ${readOnly ? 'cursor-default pointer-events-none opacity-80' : ''}
                            `}
                            onClick={() => !readOnly && onTemplateChange(template.template_id)}
                        >
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-start gap-2">
                                    <div className={`mt-0.5 p-1 rounded ${selectedTemplateId === template.template_id ? 'bg-blue-100' : 'bg-slate-50'}`}>
                                        {getIcon(template.scene_type)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-xs font-bold mb-0.5 ${selectedTemplateId === template.template_id ? 'text-blue-800' : 'text-slate-700'}`}>
                                            {template.template_name}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 leading-snug mb-1.5">
                                            {descriptions[template.template_id] || '业务场景模板'}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {template.required_items.slice(0, 2).map(item => (
                                                <span key={item} className="text-[9px] px-1 py-0.5 bg-white/60 rounded text-slate-500 border border-slate-100/50">
                                                    {item.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                            {template.required_items.length > 2 && (
                                                <span className="text-[9px] text-slate-400 self-center">+{template.required_items.length - 2}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {selectedTemplateId === template.template_id && (
                                    <div className="absolute top-1.5 right-1.5">
                                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Template Selection Hint */}
            {!readOnly && selectedTemplateId && (
                <div className="flex items-start gap-1.5 p-2 bg-blue-50 border border-blue-100 rounded text-[10px] mb-2">
                    <Info size={10} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-700">
                        模板选定后，点击"智能识别要素"将基于此模板进行分析。分析开始后模板将锁定无法更改。
                    </span>
                </div>
            )}
            {readOnly && selectedTemplateId && (
                <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded text-[10px] mb-2">
                    <Lock size={10} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-700">
                        模板已锁定。如需更换模板，请创建新场景。
                    </span>
                </div>
            )}

            {/* Section 2: Base Capabilities (Locked) */}
            {selectedTemplate && (
                <div className="mb-3 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-2">
                        <h4 className="text-xs font-bold text-slate-700">通用能力（所有场景必备）</h4>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">已锁定</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {[
                            { key: 'business_object', label: '核心业务对象 (BO)' },
                            { key: 'state_machine', label: '状态机 (State Machine)' },
                            { key: 'actions', label: '业务行为 (Actions)' },
                            { key: 'roles', label: '角色与责任 (Roles)' },
                            { key: 'artifacts', label: '材料与数据 (Artifacts)' },
                            { key: 'rules', label: '业务规则 (Rules)' }
                        ].map(cap => (
                            <div key={cap.key} className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                <Check size={10} className="text-slate-400 flex-shrink-0" />
                                <span>{cap.label}</span>
                                <Settings size={8} className="text-slate-300 ml-auto" />
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 italic">
                        这些是业务语义建模的基础能力，所有场景默认启用
                    </p>
                </div>
            )}

            {/* Section 4: Template Requirements Preview */}
            {selectedTemplate && selectedTemplate.required_items.length > 0 && (
                <div className="mb-3 p-3 bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-2">
                        <h4 className="text-xs font-bold text-slate-700">必须完成的建模项</h4>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white text-blue-600 rounded border border-blue-200">
                            {selectedTemplate.required_items.filter(item => getRequirementStatus(item) === 'fulfilled').length} / {selectedTemplate.required_items.length}
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        {selectedTemplate.required_items.map(item => {
                            const status = getRequirementStatus(item);
                            return (
                                <div
                                    key={item}
                                    className="flex items-center gap-1.5 text-[10px] bg-white px-2 py-1.5 rounded border border-slate-200"
                                >
                                    {getStatusIcon(status)}
                                    <span className="flex-1 font-medium text-slate-700">
                                        {item.replace(/_/g, ' ')}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700' :
                                        status === 'partial' ? 'bg-amber-50 text-amber-700' :
                                            'bg-red-50 text-red-700'
                                        }`}>
                                        {getStatusLabel(status)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {selectedTemplate.required_items.some(item => getRequirementStatus(item) !== 'fulfilled') && (
                        <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 flex items-start gap-1.5">
                            <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />
                            <span>模型需要包含上述红色标注项才能通过发布校验</span>
                        </div>
                    )}
                </div>
            )}


            {/* Section 3: Enhancement Capability Modules (Expandable) */}
            {selectedTemplate && (
                <div className="space-y-2">
                    {/* Government Enhancement Module */}
                    {selectedTemplate.capability_modules.government?.enabled && (
                        <div className="border border-blue-200 rounded-lg bg-white overflow-hidden">
                            <button
                                onClick={() => setExpandedModule(expandedModule === 'government' ? null : 'government')}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Shield size={14} className="text-blue-600" />
                                    <span className="text-xs font-bold text-slate-700">政务增强能力</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">
                                        Government Extension
                                    </span>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition-transform ${expandedModule === 'government' ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {expandedModule === 'government' && (
                                <div className="px-3 py-2 bg-blue-50/30 border-t border-blue-100 space-y-1.5">
                                    {[
                                        { key: 'multi_department_verification', label: '多部门核验', desc: '公安/民政/卫健/住建等跨部门数据核验' },
                                        { key: 'statutory_time_limit', label: '法定承诺时限', desc: '工作日/自然日计算及超时处理' },
                                        { key: 'reason_code', label: '原因码与解释', desc: '不通过原因及政策法规依据' },
                                        { key: 'audit_and_supervision', label: '监管与审计', desc: '操作留痕及统计指标' }
                                    ].map(item => (
                                        <div key={item.key} className="flex items-start gap-1.5 text-[10px] bg-white px-2 py-1.5 rounded border border-blue-100">
                                            <Check size={10} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-700">{item.label}</div>
                                                <div className="text-slate-500 text-[9px] mt-0.5">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* HR Enhancement Module */}
                    {selectedTemplate.capability_modules.enterprise?.hr?.enabled && (
                        <div className="border border-indigo-200 rounded-lg bg-white overflow-hidden">
                            <button
                                onClick={() => setExpandedModule(expandedModule === 'hr' ? null : 'hr')}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-indigo-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Building size={14} className="text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-700">HR 业务增强</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100">
                                        HR Module
                                    </span>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition-transform ${expandedModule === 'hr' ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {expandedModule === 'hr' && (
                                <div className="px-3 py-2 bg-indigo-50/30 border-t border-indigo-100 space-y-1.5">
                                    {[
                                        { key: 'org_structure', label: '组织与岗位体系', desc: '部门层级及岗位关系管理' },
                                        { key: 'position_control', label: '编制与岗位约束', desc: '编制总数及岗位配置限制' },
                                        { key: 'access_provisioning', label: '账号与权限开通', desc: '入职自动开通系统账号' }
                                    ].map(item => (
                                        <div key={item.key} className="flex items-start gap-1.5 text-[10px] bg-white px-2 py-1.5 rounded border border-indigo-100">
                                            <Check size={10} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-700">{item.label}</div>
                                                <div className="text-slate-500 text-[9px] mt-0.5">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Supply Chain Enhancement Module */}
                    {selectedTemplate.capability_modules.enterprise?.supply_chain?.enabled && (
                        <div className="border border-purple-200 rounded-lg bg-white overflow-hidden">
                            <button
                                onClick={() => setExpandedModule(expandedModule === 'supply_chain' ? null : 'supply_chain')}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-purple-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Layout size={14} className="text-purple-600" />
                                    <span className="text-xs font-bold text-slate-700">供应链业务增强</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-100">
                                        Supply Chain Module
                                    </span>
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition-transform ${expandedModule === 'supply_chain' ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {expandedModule === 'supply_chain' && (
                                <div className="px-3 py-2 bg-purple-50/30 border-t border-purple-100 space-y-1.5">
                                    {[
                                        { key: 'supplier_management', label: '供应商管理', desc: '供应商资质及准入审核' },
                                        { key: 'inventory_binding', label: '库存与物料绑定', desc: '订单物料与库存关联' },
                                        { key: 'logistics_tracking', label: '履约与物流跟踪', desc: '订单履约状态实时更新' },
                                        { key: 'settlement', label: '财务结算', desc: '采购订单自动结算' }
                                    ].map(item => (
                                        <div key={item.key} className="flex items-start gap-1.5 text-[10px] bg-white px-2 py-1.5 rounded border border-purple-100">
                                            <Check size={10} className="text-purple-500 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-700">{item.label}</div>
                                                <div className="text-slate-500 text-[9px] mt-0.5">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SceneTemplateConfigPanel;
