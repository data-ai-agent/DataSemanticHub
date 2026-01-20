import React, { useState, useEffect, useMemo } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, FileText, Activity, Cpu, Link,
    RefreshCw, ChevronRight, Shield, CheckCircle, FileCheck, CheckSquare, AlertTriangle, MessageCircle, ArrowRight, Sparkles, Box, Edit, XCircle, ZoomIn, ZoomOut, Eye, Share2, Network, GitBranch, Table, Globe, ChevronDown, Check, Users, Clock
} from 'lucide-react';

const convertToCamelCase = (fieldName: string) => {
    const parts = fieldName.split('_');
    if (parts.length === 1) return fieldName;
    return parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
};

const convertPhysicalTypeToBusinessType = (physicalType: string) => {
    const typeMap: Record<string, string> = {
        'varchar': 'String',
        'char': 'String',
        'text': 'String',
        'int': 'Integer',
        'bigint': 'Long',
        'decimal': 'Decimal',
        'double': 'Decimal',
        'float': 'Decimal',
        'date': 'Date',
        'datetime': 'DateTime',
        'timestamp': 'DateTime',
        'boolean': 'Boolean'
    };
    const lower = physicalType.toLowerCase();
    return typeMap[lower] || 'String';
};

const GenerateBusinessObjectWizard = ({
    isOpen,
    onClose,
    identificationResult,
    dataSource,
    businessObjects,
    setBusinessObjects,
    setActiveModule
}: any) => {
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState<{ step: string; status: 'pending' | 'processing' | 'done' }[]>([]);
    const [generatedBOId, setGeneratedBOId] = useState<string | null>(null);

    // 步骤1：基本信息
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [nameError, setNameError] = useState('');
    const [codeError, setCodeError] = useState('');

    // 步骤2：字段映射
    const [fieldMappings, setFieldMappings] = useState<any[]>([]);

    // 步骤3：生成选项
    const [options, setOptions] = useState({
        publishImmediately: false,
        createMapping: true,
        sendNotification: false,
        domain: ''
    });

    // 初始化数据
    useEffect(() => {
        if (isOpen && identificationResult) {
            // 步骤1：基本信息初始化
            const businessName = identificationResult.objectSuggestion?.name || identificationResult.tableComment || identificationResult.tableName;
            setName(businessName.replace(/（业务视图）/, ''));
            const tableName = identificationResult.tableName.replace(/^t_/, '');
            setCode(`biz_${tableName}`);
            setDescription(identificationResult.tableComment || `从表 ${identificationResult.tableName} 生成的业务对象`);

            // 步骤2：字段映射初始化
            const mappings = identificationResult.fieldSuggestions
                .filter((f: any) => {
                    // 跳过时间戳字段（create_time, update_time等）
                    const fieldLower = f.field.toLowerCase();
                    if (f.semanticRole === '时间戳') {
                        if (fieldLower.includes('create') || fieldLower.includes('update')) {
                            return false;
                        }
                    }
                    return true;
                })
                .map((f: any) => ({
                    field: f.field,
                    semanticRole: f.semanticRole,
                    aiExplanation: f.aiExplanation,
                    confidence: f.confidence,
                    selected: true,
                    businessName: convertToCamelCase(f.field),
                    businessType: convertPhysicalTypeToBusinessType('varchar'), // 简化处理
                    businessDesc: f.aiExplanation || ''
                }));
            setFieldMappings(mappings);
        }
    }, [isOpen, identificationResult]);

    // 验证步骤1
    const validateStep1 = () => {
        let valid = true;
        if (!name.trim()) {
            setNameError('业务对象名称不能为空');
            valid = false;
        } else if (businessObjects?.some((bo: any) => bo.name === name && bo.id !== generatedBOId)) {
            setNameError('业务对象名称已存在');
            valid = false;
        } else {
            setNameError('');
        }

        if (!code.trim()) {
            setCodeError('业务对象编码不能为空');
            valid = false;
        } else if (!/^[a-z][a-z0-9_]*$/.test(code)) {
            setCodeError('编码只能包含小写字母、数字和下划线，且必须以字母开头');
            valid = false;
        } else if (businessObjects?.some((bo: any) => bo.code === code && bo.id !== generatedBOId)) {
            setCodeError('业务对象编码已存在');
            valid = false;
        } else {
            setCodeError('');
        }

        return valid;
    };

    // 下一步
    const handleNext = () => {
        if (step === 1) {
            if (!validateStep1()) return;
            setStep(2);
        } else if (step === 2) {
            if (fieldMappings.filter((f: any) => f.selected).length === 0) {
                alert('至少需要选择一个字段');
                return;
            }
            setStep(3);
        }
    };

    // 上一步
    const handlePrev = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    // 确认生成
    const handleConfirm = async () => {
        if (!validateStep1()) return;

        setIsGenerating(true);
        setGenerationProgress([
            { step: '创建业务对象定义', status: 'processing' },
            { step: '创建业务属性', status: 'pending' },
            { step: '建立字段映射关系', status: 'pending' },
            { step: '创建数据血缘', status: 'pending' },
            { step: '记录操作日志', status: 'pending' }
        ]);

        // 模拟生成过程
        const selectedFields = fieldMappings.filter((f: any) => f.selected);

        // 步骤1：创建业务对象定义
        await new Promise(resolve => setTimeout(resolve, 500));
        setGenerationProgress(prev => prev.map((p, i) => i === 0 ? { ...p, status: 'done' } : i === 1 ? { ...p, status: 'processing' } : p));

        // 步骤2：创建业务属性
        await new Promise(resolve => setTimeout(resolve, 600));
        setGenerationProgress(prev => prev.map((p, i) => i === 1 ? { ...p, status: 'done' } : i === 2 ? { ...p, status: 'processing' } : p));

        // 步骤3：建立字段映射关系
        await new Promise(resolve => setTimeout(resolve, 500));
        setGenerationProgress(prev => prev.map((p, i) => i === 2 ? { ...p, status: 'done' } : i === 3 ? { ...p, status: 'processing' } : p));

        // 步骤4：创建数据血缘
        await new Promise(resolve => setTimeout(resolve, 400));
        setGenerationProgress(prev => prev.map((p, i) => i === 3 ? { ...p, status: 'done' } : i === 4 ? { ...p, status: 'processing' } : p));

        // 步骤5：记录操作日志
        await new Promise(resolve => setTimeout(resolve, 300));
        setGenerationProgress(prev => prev.map((p, i) => i === 4 ? { ...p, status: 'done' } : p));

        // 创建业务对象
        const newBO = {
            id: `BO_${Date.now()}`,
            name: name,
            code: code,
            domain: options.domain || 'AI生成',
            owner: '待认领',
            status: options.publishImmediately ? 'published' : 'draft',
            version: 'v1.0',
            description: description,
            sourceTables: [identificationResult.tableName],
            fields: selectedFields.map((f: any, i: number) => ({
                id: `f_${i}`,
                name: f.businessName,
                code: f.field,
                type: f.businessType,
                length: '-',
                required: f.semanticRole === '标识',
                desc: f.businessDesc
            }))
        };

        setBusinessObjects?.([...(businessObjects || []), newBO]);
        setGeneratedBOId(newBO.id);

        await new Promise(resolve => setTimeout(resolve, 300));
        setIsGenerating(false);
    };

    // 查看详情（跳转到业务对象建模页）
    const handleViewDetail = () => {
        setActiveModule?.('td_modeling');
        // 通过事件或全局状态传递生成的BO ID，让建模页自动选中
        setTimeout(() => {
            const event = new CustomEvent('selectBusinessObject', { detail: { id: generatedBOId } });
            window.dispatchEvent(event);
        }, 100);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* 头部 */}
                <div className="p-6 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Box className="text-purple-500" size={24} />
                            从识别结果生成业务对象
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <XCircle size={24} />
                        </button>
                    </div>
                    {/* 步骤指示器 */}
                    <div className="flex items-center gap-2 mt-4">
                        {[1, 2, 3].map((s) => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center gap-2 ${step >= s ? 'text-purple-600' : 'text-slate-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > s ? 'bg-purple-600 border-purple-600 text-white' :
                                        step === s ? 'border-purple-600 bg-purple-50 text-purple-600' :
                                            'border-slate-300 bg-white text-slate-400'
                                        }`}>
                                        {step > s ? <Check size={18} /> : s}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {s === 1 ? '基本信息' : s === 2 ? '字段映射' : '生成选项'}
                                    </span>
                                </div>
                                {s < 3 && <ChevronRight size={16} className="text-slate-300" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isGenerating ? (
                        // 生成中状态
                        <div className="space-y-4">
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
                                <h4 className="text-lg font-bold text-slate-800 mb-2">正在生成业务对象...</h4>
                                <p className="text-sm text-slate-500">预计剩余时间: {Math.max(0, (generationProgress.filter(p => p.status !== 'done').length - 1) * 0.5).toFixed(1)}秒</p>
                            </div>
                            <div className="space-y-2">
                                {generationProgress.map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                        {p.status === 'done' && <CheckCircle className="text-emerald-500" size={20} />}
                                        {p.status === 'processing' && <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>}
                                        {p.status === 'pending' && <div className="w-5 h-5 border-2 border-slate-300 rounded-full"></div>}
                                        <span className={`text-sm ${p.status === 'done' ? 'text-slate-600' : p.status === 'processing' ? 'text-purple-600 font-medium' : 'text-slate-400'}`}>
                                            {p.step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : generatedBOId ? (
                        // 生成成功状态
                        <div className="text-center py-8">
                            <CheckCircle className="text-emerald-500 mx-auto mb-4" size={64} />
                            <h4 className="text-xl font-bold text-slate-800 mb-2">业务对象生成成功！</h4>
                            <div className="bg-slate-50 rounded-lg p-4 mt-4 text-left max-w-md mx-auto space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">业务对象:</span>
                                    <span className="text-sm font-medium text-slate-800">{name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">业务属性:</span>
                                    <span className="text-sm font-medium text-slate-800">{fieldMappings.filter((f: any) => f.selected).length} 个</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">字段映射:</span>
                                    <span className="text-sm font-medium text-slate-800">{fieldMappings.filter((f: any) => f.selected).length} 条</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">数据血缘:</span>
                                    <span className="text-sm font-medium text-emerald-600">已建立</span>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-center mt-6">
                                <button
                                    onClick={handleViewDetail}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                                >
                                    查看详情
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
                                >
                                    关闭
                                </button>
                            </div>
                        </div>
                    ) : (
                        // 步骤内容
                        <>
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-slate-800 mb-4">步骤1：基本信息确认</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">业务对象名称 *</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                                                className={`w-full px-3 py-2 border rounded-lg ${nameError ? 'border-red-300' : 'border-slate-300'}`}
                                                placeholder="请输入业务对象名称"
                                            />
                                            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">业务对象编码 *</label>
                                            <input
                                                type="text"
                                                value={code}
                                                onChange={(e) => { setCode(e.target.value.toLowerCase()); setCodeError(''); }}
                                                className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${codeError ? 'border-red-300' : 'border-slate-300'}`}
                                                placeholder="biz_xxx"
                                            />
                                            {codeError && <p className="text-xs text-red-500 mt-1">{codeError}</p>}
                                            <p className="text-xs text-slate-500 mt-1">编码只能包含小写字母、数字和下划线，且必须以字母开头</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">业务描述</label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                placeholder="请输入业务描述"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">来源表</label>
                                            <input
                                                type="text"
                                                value={identificationResult?.tableName || ''}
                                                disabled
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-slate-800 mb-4">步骤2：字段映射预览</h4>
                                    <div className="text-sm text-slate-600 mb-3">
                                        已选择: <span className="font-medium text-purple-600">{fieldMappings.filter((f: any) => f.selected).length}</span> 个字段
                                    </div>
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left w-12">
                                                        <input
                                                            type="checkbox"
                                                            checked={fieldMappings.every((f: any) => f.selected)}
                                                            onChange={(e) => setFieldMappings(fieldMappings.map((f: any) => ({ ...f, selected: e.target.checked })))}
                                                            className="w-4 h-4"
                                                        />
                                                    </th>
                                                    <th className="px-3 py-2 text-left">物理字段</th>
                                                    <th className="px-3 py-2 text-left">语义角色</th>
                                                    <th className="px-3 py-2 text-left">业务属性名</th>
                                                    <th className="px-3 py-2 text-left">业务类型</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fieldMappings.map((mapping: any, idx: number) => (
                                                    <tr key={idx} className={`border-t border-slate-100 ${!mapping.selected ? 'opacity-50' : ''}`}>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={mapping.selected}
                                                                onChange={(e) => {
                                                                    const newMappings = [...fieldMappings];
                                                                    newMappings[idx].selected = e.target.checked;
                                                                    setFieldMappings(newMappings);
                                                                }}
                                                                className="w-4 h-4"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-slate-700">{mapping.field}</td>
                                                        <td className="px-3 py-2">
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                                                {mapping.semanticRole}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={mapping.businessName}
                                                                onChange={(e) => {
                                                                    const newMappings = [...fieldMappings];
                                                                    newMappings[idx].businessName = e.target.value;
                                                                    setFieldMappings(newMappings);
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <select
                                                                value={mapping.businessType}
                                                                onChange={(e) => {
                                                                    const newMappings = [...fieldMappings];
                                                                    newMappings[idx].businessType = e.target.value;
                                                                    setFieldMappings(newMappings);
                                                                }}
                                                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                                            >
                                                                <option value="String">String</option>
                                                                <option value="Integer">Integer</option>
                                                                <option value="Long">Long</option>
                                                                <option value="Decimal">Decimal</option>
                                                                <option value="Date">Date</option>
                                                                <option value="DateTime">DateTime</option>
                                                                <option value="Boolean">Boolean</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-slate-800 mb-4">步骤3：生成选项</h4>
                                    <div className="space-y-4">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.publishImmediately}
                                                onChange={(e) => setOptions({ ...options, publishImmediately: e.target.checked })}
                                                className="mt-1 w-4 h-4"
                                            />
                                            <div>
                                                <div className="font-medium text-slate-700">立即发布业务对象</div>
                                                <div className="text-xs text-slate-500 mt-1">生成后状态为"已发布"，否则为"草稿"</div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.createMapping}
                                                onChange={(e) => setOptions({ ...options, createMapping: e.target.checked })}
                                                className="mt-1 w-4 h-4"
                                            />
                                            <div>
                                                <div className="font-medium text-slate-700">创建物理表到业务对象的映射关系</div>
                                                <div className="text-xs text-slate-500 mt-1">在映射工作台中自动创建映射记录</div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={options.sendNotification}
                                                onChange={(e) => setOptions({ ...options, sendNotification: e.target.checked })}
                                                className="mt-1 w-4 h-4"
                                            />
                                            <div>
                                                <div className="font-medium text-slate-700">发送通知给相关人员</div>
                                                <div className="text-xs text-slate-500 mt-1">通知业务负责人新业务对象已创建</div>
                                            </div>
                                        </label>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">生成位置（业务域）</label>
                                            <input
                                                type="text"
                                                value={options.domain}
                                                onChange={(e) => setOptions({ ...options, domain: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                placeholder="可选，留空则在默认域"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 底部按钮 */}
                {!isGenerating && !generatedBOId && (
                    <div className="p-6 border-t border-slate-200 flex justify-between flex-shrink-0">
                        <button
                            onClick={step === 1 ? onClose : handlePrev}
                            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                        >
                            {step === 1 ? '取消' : '← 上一步'}
                        </button>
                        <button
                            onClick={step === 3 ? handleConfirm : handleNext}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                        >
                            {step === 3 ? '确认生成' : '下一步 →'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


// 子组件0: 识别任务概览页
const IdentificationOverviewTab = ({ results, onNavigateToComparison, onNavigateToBatch, onNavigateToConflict, onBatchGenerate }: any) => {
    const stats = {
        total: results.length,
        accepted: results.filter((r: any) => r.objectSuggestion?.status === 'accepted').length,
        pending: results.filter((r: any) => r.needsConfirmation).length,
        conflicts: results.filter((r: any) => r.hasConflict).length,
        avgConfidence: results.length > 0
            ? Math.round(results.reduce((sum: number, r: any) => sum + (r.objectSuggestion?.confidence || 0), 0) / results.length * 100)
            : 0
    };

    return (
        <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
            {/* 统计卡片 */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex-shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">总表数：</span>
                        <span className="text-lg font-bold text-slate-800">{stats.total}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-600">已接受：</span>
                        <span className="text-lg font-bold text-emerald-700">{stats.accepted}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-yellow-600">待确认：</span>
                        <span className="text-lg font-bold text-yellow-700">{stats.pending}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-orange-600">冲突项：</span>
                        <span className="text-lg font-bold text-orange-700">{stats.conflicts}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600">平均置信度：</span>
                        <span className="text-lg font-bold text-blue-700">{stats.avgConfidence}%</span>
                    </div>
                </div>
            </div>

            {/* 快速操作区 */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 whitespace-nowrap">快速操作：</span>
                    <button
                        onClick={onNavigateToComparison}
                        className="px-4 py-2 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm font-medium text-emerald-700"
                    >
                        <FileCheck size={16} />
                        <span>识别结果对比</span>
                    </button>
                    <button
                        onClick={onNavigateToBatch}
                        className="px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm font-medium text-blue-700"
                    >
                        <CheckSquare size={16} />
                        <span>批量确认</span>
                    </button>
                    <button
                        onClick={onNavigateToConflict}
                        className="px-4 py-2 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-2 text-sm font-medium text-orange-700"
                    >
                        <AlertTriangle size={16} />
                        <span>冲突解释</span>
                    </button>
                </div>
            </div>

            {/* 识别结果列表预览 */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">识别结果预览</h3>
                </div>
                <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">表名</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">对象建议</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">置信度</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">状态</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {results.map((result: any) => (
                                <tr key={result.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">{result.tableName}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-sm">{result.objectSuggestion?.name}</div>
                                        <div className="text-xs text-slate-500">{result.tableComment}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full"
                                                    style={{ width: `${(result.objectSuggestion?.confidence || 0) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-slate-600 whitespace-nowrap">
                                                {Math.round((result.objectSuggestion?.confidence || 0) * 100)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {result.hasConflict && (
                                                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">冲突</span>
                                            )}
                                            {result.needsConfirmation && (
                                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">待确认</span>
                                            )}
                                            {result.objectSuggestion?.status === 'accepted' && (
                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">已接受</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {result.needsConfirmation && (
                                            <button
                                                onClick={() => onBatchGenerate && onBatchGenerate([result])}
                                                className="text-emerald-600 text-sm hover:underline whitespace-nowrap mr-3 font-medium"
                                            >
                                                确认
                                            </button>
                                        )}
                                        <button
                                            onClick={onNavigateToComparison}
                                            className="text-blue-600 text-sm hover:underline whitespace-nowrap"
                                        >
                                            查看详情
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// 子组件1: 识别结果对比页
const IdentificationComparisonTab = ({ results, setResults, dataSources, onNavigateToBatch, onNavigateToConflict, onGenerateBusinessObject }: any) => {
    const [selectedTableId, setSelectedTableId] = useState<string | null>(results[0]?.id || null);
    const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
    const [highlightedField, setHighlightedField] = useState<string | null>(null);
    const [filter, setFilter] = useState({ needsConfirm: false, hasConflict: false, sortBy: 'confidence' });
    const [showWhyExplanation, setShowWhyExplanation] = useState<Record<string, boolean>>({});
    const [showCandidateSuggestions, setShowCandidateSuggestions] = useState<Record<string, boolean>>({});
    const [candidateSuggestions, setCandidateSuggestions] = useState<Record<string, any[]>>({});
    const [isLoadingCandidates, setIsLoadingCandidates] = useState<Record<string, boolean>>({});

    // 应用筛选和排序
    const filteredAndSortedResults = useMemo(() => {
        let filtered = [...results];

        if (filter.needsConfirm) {
            filtered = filtered.filter((r: any) => r.needsConfirmation);
        }
        if (filter.hasConflict) {
            filtered = filtered.filter((r: any) => r.hasConflict);
        }

        // 按置信度排序
        if (filter.sortBy === 'confidence') {
            filtered.sort((a: any, b: any) =>
                (b.objectSuggestion?.confidence || 0) - (a.objectSuggestion?.confidence || 0)
            );
        }

        return filtered;
    }, [results, filter]);

    const selectedResult = filteredAndSortedResults.find((r: any) => r.id === selectedTableId) || filteredAndSortedResults[0];
    const dataSource = dataSources?.find((ds: any) => ds.id === selectedResult?.sourceId);

    const handleAction = (resultId: string, action: 'accept' | 'reject' | 'edit', type: 'object' | 'field', fieldName?: string, basis?: 'rule' | 'ai') => {
        const now = new Date().toLocaleString('zh-CN');
        const currentUser = '当前用户'; // 实际应该从用户上下文获取

        setResults((prev: any[]) => prev.map((r: any) => {
            if (r.id !== resultId) return r;
            if (type === 'object') {
                const auditTrail = {
                    recordBy: currentUser,
                    recordTime: now,
                    action: action,
                    basis: basis || (r.objectSuggestion?.source?.includes('规则') ? 'rule' : 'ai'),
                    source: r.objectSuggestion?.source || 'AI + 规则'
                };
                return {
                    ...r,
                    objectSuggestion: {
                        ...r.objectSuggestion,
                        status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'pending',
                        auditTrail: action !== 'edit' ? auditTrail : r.objectSuggestion?.auditTrail
                    },
                    needsConfirmation: action === 'accept' ? false : r.needsConfirmation
                };
            } else {
                return {
                    ...r,
                    fieldSuggestions: r.fieldSuggestions.map((f: any) => {
                        if (f.field === fieldName) {
                            const auditTrail = {
                                recordBy: currentUser,
                                recordTime: now,
                                action: action,
                                basis: basis || (f.conflict ? 'manual' : 'ai'),
                                fieldConfidence: f.confidence
                            };
                            return {
                                ...f,
                                status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : f.status,
                                auditTrail: action !== 'edit' ? auditTrail : f.auditTrail
                            };
                        }
                        return f;
                    })
                };
            }
        }));
    };

    return (
        <div className="h-full flex flex-col p-6 gap-4">
            {/* 顶部控制栏 */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-600">
                        <span className="font-medium">任务：</span>
                        <span>Bottom-up 识别任务</span>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={filter.needsConfirm}
                            onChange={(e) => setFilter({ ...filter, needsConfirm: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300"
                        />
                        <label className="text-sm text-slate-600">仅显示需确认</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={filter.hasConflict}
                            onChange={(e) => setFilter({ ...filter, hasConflict: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300"
                        />
                        <label className="text-sm text-slate-600">仅显示冲突</label>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">排序：</label>
                        <select
                            value={filter.sortBy}
                            onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
                            className="border border-slate-300 rounded px-2 py-1 text-sm"
                        >
                            <option value="confidence">按置信度</option>
                            <option value="name">按表名</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onNavigateToBatch}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <CheckSquare size={16} /> 批量确认
                    </button>
                    <button
                        onClick={() => onNavigateToConflict()}
                        className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 flex items-center gap-2"
                    >
                        <AlertTriangle size={16} /> 查看冲突
                    </button>
                </div>
            </div>

            {/* 主内容区 - 左右对照 */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* 左侧：数据来源结构 */}
                <div className="w-80 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-3 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-700">数据来源结构</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredAndSortedResults.map((result: any) => (
                            <div
                                key={result.id}
                                onClick={() => {
                                    setSelectedTableId(result.id);
                                    setHighlightedField(null);
                                }}
                                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${selectedTableId === result.id
                                    ? 'bg-emerald-50 border-2 border-emerald-300'
                                    : 'bg-slate-50 border border-slate-200 hover:border-emerald-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-medium text-sm text-slate-800">{result.tableName}</div>
                                    {result.hasConflict && <AlertTriangle size={14} className="text-orange-500" />}
                                </div>
                                <div className="text-xs text-slate-500">{result.tableComment}</div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {result.fieldSuggestions.map((f: any, idx: number) => (
                                        <div
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setHighlightedField(f.field);
                                                setExpandedFields(new Set([f.field]));
                                            }}
                                            className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-all ${highlightedField === f.field && selectedTableId === result.id
                                                ? 'ring-2 ring-emerald-400 ring-offset-1 bg-emerald-200 text-emerald-800'
                                                : f.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                    f.conflict ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}
                                        >
                                            {f.field}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右侧：语义建议区 */}
                <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
                    {selectedResult ? (
                        <>
                            {/* 表级对象建议卡片 */}
                            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-slate-800">{selectedResult.objectSuggestion.name}</h3>
                                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                                                来源：{selectedResult.objectSuggestion.source}
                                            </span>
                                            {selectedResult.objectSuggestion.risk !== 'low' && (
                                                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                                    风险
                                                </span>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                                <span>置信度</span>
                                                <span className="font-medium">{Math.round(selectedResult.objectSuggestion.confidence * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${selectedResult.objectSuggestion.confidence * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        {selectedResult.objectSuggestion?.auditTrail && (
                                            <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-100/50 p-2 rounded">
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} /> {selectedResult.objectSuggestion.auditTrail.recordBy}
                                                </span>
                                                <span className="text-slate-300">|</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} /> {selectedResult.objectSuggestion.auditTrail.recordTime}
                                                </span>
                                                <span className="text-slate-300">|</span>
                                                <span>依据：{selectedResult.objectSuggestion.auditTrail.basis === 'rule' ? '规则' : selectedResult.objectSuggestion.auditTrail.basis === 'ai' ? 'AI' : '手动'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 右侧动作栏 */}
                                    <div className="flex flex-col items-end gap-3 ml-6 min-w-[160px]">
                                        {/* 生成业务对象按钮 (Primary) */}
                                        {onGenerateBusinessObject && (
                                            <button
                                                onClick={() => onGenerateBusinessObject(selectedResult)}
                                                className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md"
                                            >
                                                <Box size={16} /> 生成业务对象
                                            </button>
                                        )}

                                        {/* 快捷操作 (Secondary) */}
                                        <div className="flex items-center justify-end gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                                            <button
                                                onClick={() => handleAction(selectedResult.id, 'accept', 'object')}
                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors tooltip relative group"
                                                title="接受"
                                            >
                                                <CheckCircle size={18} />
                                                <span className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-10">接受建议</span>
                                            </button>
                                            <div className="w-px h-4 bg-slate-200"></div>
                                            <button
                                                onClick={() => handleAction(selectedResult.id, 'edit', 'object')}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors relative group"
                                                title="编辑"
                                            >
                                                <Edit size={18} />
                                                <span className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-10">编辑详情</span>
                                            </button>
                                            <div className="w-px h-4 bg-slate-200"></div>
                                            <button
                                                onClick={() => handleAction(selectedResult.id, 'reject', 'object')}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors relative group"
                                                title="拒绝"
                                            >
                                                <XCircle size={18} />
                                                <span className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-10">拒绝建议</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 字段级语义分类列表 */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">字段语义分类</h4>
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">字段</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">语义角色</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">AI 解释</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">置信度</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedResult.fieldSuggestions.map((field: any, idx: number) => {
                                            const isHighlighted = highlightedField === field.field;
                                            return (
                                                <tr
                                                    key={idx}
                                                    className={`hover:bg-slate-50 transition-colors ${isHighlighted ? 'bg-emerald-50 ring-2 ring-emerald-300' : ''
                                                        }`}
                                                >
                                                    <td className={`px-4 py-2 font-mono text-sm ${isHighlighted ? 'font-bold text-emerald-800' : ''}`}>
                                                        {field.field}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-slate-700">{field.semanticRole}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-slate-600">{field.aiExplanation}</span>
                                                            <button
                                                                onClick={() => {
                                                                    setShowWhyExplanation((prev: any) => ({
                                                                        ...prev,
                                                                        [`${selectedResult.id}_${field.field}`]: !prev[`${selectedResult.id}_${field.field}`]
                                                                    }));
                                                                }}
                                                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                                                title="为什么这么判断"
                                                            >
                                                                <MessageCircle size={12} />
                                                                为什么
                                                            </button>
                                                        </div>
                                                        {showWhyExplanation[`${selectedResult.id}_${field.field}`] && (
                                                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-slate-700">
                                                                <div className="font-medium mb-1">AI 推理依据：</div>
                                                                <div className="leading-relaxed">
                                                                    字段名 "{field.field}" 在表 "{selectedResult.tableName}" 中，根据命名模式和业务上下文分析：
                                                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                                                        <li>命名模式：{field.field.includes('time') ? '包含 "time"，表示时间相关字段' : '字段命名符合常见语义模式'}</li>
                                                                        <li>业务语义：结合表名 "{selectedResult.tableComment}"，判断为 {field.semanticRole}</li>
                                                                        <li>数据特征：置信度 {Math.round(field.confidence * 100)}%，基于字段类型和业务上下文综合判断</li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-20 bg-slate-200 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-blue-500 h-1.5 rounded-full"
                                                                    style={{ width: `${field.confidence * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-slate-500">{Math.round(field.confidence * 100)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex gap-1">
                                                                {field.status !== 'accepted' && (
                                                                    <button
                                                                        onClick={() => handleAction(selectedResult.id, 'accept', 'field', field.field)}
                                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                                        title="接受"
                                                                    >
                                                                        <CheckCircle size={16} />
                                                                    </button>
                                                                )}
                                                                {field.conflict && (
                                                                    <button
                                                                        onClick={() => {
                                                                            onNavigateToConflict(`${selectedResult.id}_${field.field}`);
                                                                        }}
                                                                        className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                                                        title="查看冲突"
                                                                    >
                                                                        <AlertTriangle size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {field.auditTrail && (
                                                                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                                                                    <div>确认：{field.auditTrail.recordBy} | {field.auditTrail.recordTime}</div>
                                                                    <div>依据：{field.auditTrail.basis === 'rule' ? '规则' : field.auditTrail.basis === 'ai' ? 'AI' : '手动'}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* 状态/行为升级建议 */}
                                {selectedResult.upgradeSuggestions && selectedResult.upgradeSuggestions.length > 0 && (
                                    <div className="mt-6 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertTriangle size={16} className="text-orange-500" />
                                            <h4 className="text-sm font-bold text-slate-700">升级建议</h4>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedResult.upgradeSuggestions.map((upgrade: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                                                    <div>
                                                        <span className="text-sm text-slate-700">「{upgrade.source}」</span>
                                                        <ArrowRight size={14} className="inline mx-2 text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-800">{upgrade.target}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500">置信度: {Math.round(upgrade.confidence * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 候选建议（辅助功能） */}
                                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className="text-purple-500" />
                                            <h4 className="text-sm font-bold text-slate-700">AI 候选建议</h4>
                                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">辅助功能</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (showCandidateSuggestions[selectedResult.id]) {
                                                    setShowCandidateSuggestions({ ...showCandidateSuggestions, [selectedResult.id]: false });
                                                } else {
                                                    setIsLoadingCandidates({ ...isLoadingCandidates, [selectedResult.id]: true });
                                                    // 模拟AI分析过程
                                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                                    // 生成候选建议
                                                    const suggestions = [
                                                        {
                                                            id: `CAND_${selectedResult.id}_1`,
                                                            suggestedName: `${selectedResult.objectSuggestion.name}记录`,
                                                            confidence: (selectedResult.objectSuggestion.confidence + 0.05),
                                                            reason: `基于当前识别结果"${selectedResult.objectSuggestion.name}"的进一步优化建议`,
                                                            alternativeNames: [
                                                                `${selectedResult.objectSuggestion.name}明细`,
                                                                `${selectedResult.objectSuggestion.name}信息`,
                                                                `${selectedResult.objectSuggestion.name}数据`
                                                            ]
                                                        }
                                                    ];
                                                    setCandidateSuggestions({ ...candidateSuggestions, [selectedResult.id]: suggestions });
                                                    setIsLoadingCandidates({ ...isLoadingCandidates, [selectedResult.id]: false });
                                                    setShowCandidateSuggestions({ ...showCandidateSuggestions, [selectedResult.id]: true });
                                                }
                                            }}
                                            className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                                        >
                                            {isLoadingCandidates[selectedResult.id] ? (
                                                <>
                                                    <RefreshCw size={12} className="animate-spin" /> 分析中...
                                                </>
                                            ) : showCandidateSuggestions[selectedResult.id] ? (
                                                '收起建议'
                                            ) : (
                                                <>
                                                    <Cpu size={12} /> 查看候选建议
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    {showCandidateSuggestions[selectedResult.id] && candidateSuggestions[selectedResult.id] && (
                                        <div className="space-y-3 mt-3">
                                            {candidateSuggestions[selectedResult.id].map((candidate: any) => (
                                                <div key={candidate.id} className="bg-white rounded-lg border border-purple-200 p-3">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <h5 className="text-sm font-bold text-slate-800 mb-1">{candidate.suggestedName}</h5>
                                                            <p className="text-xs text-slate-600 mb-2">{candidate.reason}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-slate-500">置信度:</span>
                                                                <div className="w-20 bg-slate-200 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-purple-500 h-1.5 rounded-full"
                                                                        style={{ width: `${candidate.confidence * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs text-purple-600 font-medium">
                                                                    {Math.round(candidate.confidence * 100)}%
                                                                </span>
                                                            </div>
                                                            {candidate.alternativeNames && candidate.alternativeNames.length > 0 && (
                                                                <div className="mt-2">
                                                                    <div className="text-xs text-slate-500 mb-1">备选名称:</div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {candidate.alternativeNames.map((name: string, idx: number) => (
                                                                            <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                                                {name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                                                        <button
                                                            onClick={() => {
                                                                if (onGenerateBusinessObject) {
                                                                    // 使用候选建议生成业务对象
                                                                    const enhancedResult = {
                                                                        ...selectedResult,
                                                                        objectSuggestion: {
                                                                            ...selectedResult.objectSuggestion,
                                                                            name: candidate.suggestedName
                                                                        }
                                                                    };
                                                                    onGenerateBusinessObject(enhancedResult);
                                                                }
                                                            }}
                                                            className="flex-1 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 flex items-center justify-center gap-1"
                                                        >
                                                            <Box size={12} /> 采用此建议生成
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setCandidateSuggestions({
                                                                    ...candidateSuggestions,
                                                                    [selectedResult.id]: candidateSuggestions[selectedResult.id].filter((c: any) => c.id !== candidate.id)
                                                                });
                                                            }}
                                                            className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-50"
                                                        >
                                                            忽略
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 mt-2">
                                        💡 提示：候选建议是AI生成的辅助推荐，您可以采纳或忽略
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            请选择左侧表查看识别结果
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// 子组件2: 批量确认页
const BatchConfirmationTab = ({ results, setResults, selectedItems, setSelectedItems, filter, setFilter, onGenerateBusinessObject, onBatchGenerate }: any) => {
    const filteredResults = results.filter((r: any) => {
        if (filter.needsConfirm && !r.needsConfirmation) return false;
        if (filter.hasConflict && !r.hasConflict) return false;
        return true;
    });

    const handleBatchAccept = () => {
        if (onBatchGenerate) {
            const selectedResults = results.filter((r: any) => selectedItems.has(r.id));
            onBatchGenerate(selectedResults);
            setSelectedItems(new Set());
        } else {
            // Fallback: only update local status
            const now = new Date().toLocaleString('zh-CN');
            const currentUser = '当前用户';

            setResults((prev: any[]) => prev.map((r: any) => {
                if (selectedItems.has(r.id)) {
                    return {
                        ...r,
                        objectSuggestion: {
                            ...r.objectSuggestion,
                            status: 'accepted',
                            auditTrail: {
                                recordBy: currentUser,
                                recordTime: now,
                                action: 'accept',
                                basis: r.objectSuggestion?.source?.includes('规则') ? 'rule' : 'ai',
                                source: r.objectSuggestion?.source || 'AI + 规则'
                            }
                        },
                        needsConfirmation: false
                    };
                }
                return r;
            }));
            setSelectedItems(new Set());
        }
    };

    return (
        <div className="h-full flex flex-col p-6 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-slate-700">批量操作</div>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div className="text-sm text-slate-600">已选 {selectedItems.size} 项</div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBatchAccept}
                            disabled={selectedItems.size === 0}
                            className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${selectedItems.size > 0
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <CheckCircle size={14} /> 批量接受
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={filter.needsConfirm}
                            onChange={(e) => setFilter({ ...filter, needsConfirm: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300"
                        />
                        <label className="text-sm text-slate-600">仅显示需确认</label>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left w-12">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300"
                                        checked={filteredResults.length > 0 && selectedItems.size === filteredResults.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedItems(new Set(filteredResults.map((r: any) => r.id)));
                                            } else {
                                                setSelectedItems(new Set());
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">表名</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">建议对象</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">置信度</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">状态</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredResults.map((result: any) => (
                                <tr key={result.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300"
                                            checked={selectedItems.has(result.id)}
                                            onChange={(e) => {
                                                const newSet = new Set(selectedItems);
                                                if (e.target.checked) {
                                                    newSet.add(result.id);
                                                } else {
                                                    newSet.delete(result.id);
                                                }
                                                setSelectedItems(newSet);
                                            }}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-mono text-sm">{result.tableName}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-sm">{result.objectSuggestion?.name}</div>
                                        <div className="text-xs text-slate-500">{result.tableComment}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full"
                                                    style={{ width: `${(result.objectSuggestion?.confidence || 0) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-slate-600">{Math.round((result.objectSuggestion?.confidence || 0) * 100)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {result.needsConfirmation ? (
                                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">需确认</span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">已处理</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// 子组件3: 冲突解释页
const ConflictExplanationTab = ({ results, setResults, conflictFilterId }: any) => {
    // 过滤出有冲突的项目
    const conflictItems = results.filter((r: any) =>
        r.hasConflict || r.fieldSuggestions?.some((f: any) => f.conflict)
    );

    const [expandedItem, setExpandedItem] = useState<string | null>(conflictFilterId?.split('_')[0] || conflictItems[0]?.id || null);

    return (
        <div className="h-full flex flex-col p-6 gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 flex-shrink-0">
                <AlertTriangle className="text-orange-500 mt-0.5" size={20} />
                <div>
                    <h4 className="text-sm font-bold text-orange-800 mb-1">发现 {conflictItems.length} 个潜在冲突</h4>
                    <p className="text-sm text-orange-700 leading-relaxed">
                        系统检测到部分识别结果与现有规则或历史数据存在不一致。建议人工审核以下项目，以确保数据质量。
                    </p>
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* 左侧：冲突列表 */}
                <div className="w-80 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-3 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-700">冲突列表</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {conflictItems.map((item: any) => (
                            <div
                                key={item.id}
                                onClick={() => setExpandedItem(item.id)}
                                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${expandedItem === item.id
                                    ? 'bg-orange-50 border-2 border-orange-300'
                                    : 'bg-white border border-slate-200 hover:border-orange-200'
                                    }`}
                            >
                                <div className="font-medium text-sm text-slate-800 mb-1">{item.tableName}</div>
                                <div className="text-xs text-slate-500 mb-2">{item.tableComment}</div>
                                <div className="flex gap-2">
                                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                        {item.hasConflict ? '对象级冲突' : '字段级冲突'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右侧：冲突详情与解决 */}
                <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
                    {expandedItem ? (
                        <div className="flex-1 overflow-y-auto p-6">
                            {(() => {
                                const item = conflictItems.find((i: any) => i.id === expandedItem);
                                if (!item) return null;

                                return (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                            <h3 className="text-lg font-bold text-slate-800">{item.tableName}</h3>
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{item.tableComment}</span>
                                        </div>

                                        {/* 对象级冲突 */}
                                        {item.hasConflict && (
                                            <div className="bg-white border border-orange-200 rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-orange-50 px-4 py-2 border-b border-orange-200 flex items-center gap-2">
                                                    <AlertTriangle size={16} className="text-orange-500" />
                                                    <span className="font-bold text-orange-800 text-sm">对象类型冲突</span>
                                                </div>
                                                <div className="p-4 grid grid-cols-2 gap-8">
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI 建议</div>
                                                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                                            <div className="font-medium text-slate-800">{item.objectSuggestion.name}</div>
                                                            <div className="text-xs text-slate-500 mt-1">置信度: {Math.round(item.objectSuggestion.confidence * 100)}%</div>
                                                            <div className="text-xs text-slate-500 mt-1">依据: 命名模式匹配</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">规则/历史记录</div>
                                                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                                            <div className="font-medium text-slate-800">交易流水表</div>
                                                            <div className="text-xs text-slate-500 mt-1">来源: 历史映射记录</div>
                                                            <div className="text-xs text-slate-500 mt-1">时间: 2023-10-01</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                                                    <button className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50">
                                                        保留原状
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setResults(results.map((r: any) => r.id === item.id ? { ...r, hasConflict: false, needsConfirmation: false } : r));
                                                        }}
                                                        className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                                                    >
                                                        采纳 AI 建议
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 字段级冲突 */}
                                        {item.fieldSuggestions.filter((f: any) => f.conflict).map((field: any, idx: number) => (
                                            <div key={idx} className="bg-white border border-orange-200 rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-orange-50 px-4 py-2 border-b border-orange-200 flex items-center gap-2">
                                                    <AlertTriangle size={16} className="text-orange-500" />
                                                    <span className="font-bold text-orange-800 text-sm">字段语义冲突: {field.field}</span>
                                                </div>
                                                <div className="p-4 grid grid-cols-2 gap-8">
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI 建议</div>
                                                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                                            <div className="font-medium text-slate-800">{field.semanticRole}</div>
                                                            <div className="text-xs text-slate-500 mt-1">置信度: {Math.round(field.confidence * 100)}%</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">现有定义</div>
                                                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                                            <div className="font-medium text-slate-800">普通文本</div>
                                                            <div className="text-xs text-slate-500 mt-1">来源: 默认映射</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                                                    <button className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50">
                                                        维持现有
                                                    </button>
                                                    <button className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700">
                                                        更新为 AI 建议
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {!item.hasConflict && !item.fieldSuggestions.some((f: any) => f.conflict) && (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                                                <p>该表没有检测到冲突</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            请选择左侧项目查看冲突详情
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const CandidateConfirmationView = ({
    candidateResults,
    setCandidateResults,
    businessObjects,
    setBusinessObjects,
    setActiveModule
}: any) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'batch' | 'conflict'>('overview');
    const [conflictFilterId, setConflictFilterId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState({ needsConfirm: false, hasConflict: false, sortBy: 'confidence' });

    // 生成业务对象向导状态
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardResult, setWizardResult] = useState<any>(null);

    // 批量生成成功弹窗状态
    const [batchSuccessInfo, setBatchSuccessInfo] = useState<{ count: number } | null>(null);

    // 默认 Mock 数据 (作为 Fallback)
    const [defaultResults, setDefaultResults] = useState<any[]>([
        {
            id: 'T1',
            tableName: 't_user_info',
            tableComment: '用户信息表',
            sourceId: 'DS1',
            needsConfirmation: true,
            hasConflict: false,
            objectSuggestion: {
                name: '个人客户（业务视图）',
                confidence: 0.92,
                source: 'AI 推理',
                risk: 'low',
                status: 'pending'
            },
            fieldSuggestions: [
                { field: 'user_id', semanticRole: '唯一标识', aiExplanation: '主键ID，命名符合规范', confidence: 0.98, status: 'pending' },
                { field: 'user_name', semanticRole: '客户名称', aiExplanation: '包含name，且上下文匹配', confidence: 0.95, status: 'pending' },
                { field: 'phone_no', semanticRole: '手机号码', aiExplanation: '符合手机号格式特征', confidence: 0.90, status: 'pending' },
                { field: 'create_time', semanticRole: '创建时间', aiExplanation: '标准时间字段', confidence: 0.99, status: 'accepted' }
            ],
            upgradeSuggestions: []
        },
        {
            id: 'T2',
            tableName: 't_trade_order',
            tableComment: '交易流水表',
            sourceId: 'DS1',
            needsConfirmation: true,
            hasConflict: true,
            objectSuggestion: {
                name: '交易流水（业务视图）',
                confidence: 0.85,
                source: 'AI 推理',
                risk: 'medium',
                status: 'pending'
            },
            fieldSuggestions: [
                { field: 'order_id', semanticRole: '唯一标识', aiExplanation: '订单ID', confidence: 0.98, status: 'pending' },
                { field: 'amount', semanticRole: '交易金额', aiExplanation: '数值类型，名为amount', confidence: 0.96, status: 'pending' },
                { field: 'status', semanticRole: '交易状态', aiExplanation: '状态枚举', confidence: 0.88, status: 'pending', conflict: true } // 字段冲突示例
            ],
            upgradeSuggestions: [
                { source: '普通交易', target: '金融交易', confidence: 0.75 }
            ]
        },
        {
            id: 'T3',
            tableName: 't_prod_dict',
            tableComment: '产品字典',
            sourceId: 'DS1',
            needsConfirmation: false,
            hasConflict: false,
            objectSuggestion: {
                name: '产品字典',
                confidence: 0.99,
                source: '规则匹配',
                risk: 'low',
                status: 'accepted',
                auditTrail: {
                    recordBy: '系统自动',
                    recordTime: '2023-11-15 10:00:00',
                    basis: 'rule'
                }
            },
            fieldSuggestions: [
                { field: 'dict_code', semanticRole: '字典代码', confidence: 0.99, status: 'accepted' },
                { field: 'dict_name', semanticRole: '字典名称', confidence: 0.99, status: 'accepted' }
            ],
            upgradeSuggestions: []
        }
    ]);

    // 优先使用传入的 candidateResults
    const results = (candidateResults && candidateResults.length > 0) ? candidateResults : defaultResults;
    const setResults = setCandidateResults || setDefaultResults;

    const dataSources = [
        { id: 'DS1', name: '核心业务库', type: 'MySQL' }
    ];

    // 处理生成业务对象
    const handleGenerateBusinessObject = (result: any) => {
        setWizardResult(result);
        setIsWizardOpen(true);
    };

    // 批量生成业务对象
    const handleBatchGenerate = (items: any[]) => {
        const now = new Date().toLocaleString('zh-CN');
        const currentUser = '当前用户';

        const newBOs = items.map((item, idx) => {
            const businessName = (item.objectSuggestion?.name || item.tableName).replace(/（业务视图）/, '');
            const tableName = item.tableName.replace(/^t_/, '');

            return {
                // Mapping from candidate result to Business Object
                name: item.objectSuggestion?.name || item.tableName,
                code: item.tableName, // Simplified code generation
                domain: item.objectSuggestion?.businessDomain || '其他',
                owner: currentUser,
                status: 'Draft',
                version: 'v1.0',
                description: item.tableComment || `从表 ${item.tableName} 生成的业务对象`,
                sourceTables: [item.tableName],
                fields: (item.fieldSuggestions || []).map((f: any, i: number) => ({
                    id: `f_${i}`,
                    name: convertToCamelCase(f.field),
                    code: f.field,
                    type: 'String', // 简化处理，实际应根据映射转换
                    length: '-',
                    required: f.semanticRole === '标识',
                    desc: f.aiExplanation || f.semanticRole
                }))
            };
        });

        if (setBusinessObjects) {
            setBusinessObjects((prev: any[]) => [...(prev || []), ...newBOs]);
        }

        // 更新结果状态
        setResults((prev: any[]) => prev.map((r: any) => {
            if (items.some(i => i.id === r.id)) {
                return {
                    ...r,
                    objectSuggestion: {
                        ...r.objectSuggestion,
                        status: 'accepted',
                        auditTrail: {
                            recordBy: currentUser,
                            recordTime: now,
                            action: 'accept',
                            basis: 'batch',
                            source: '批量处理'
                        }
                    },
                    needsConfirmation: false
                };
            }
            return r;
        }));

        // alert(`已成功批量生成 ${newBOs.length} 个业务对象`);
        // if (setActiveModule) setActiveModule('td_modeling');
        setBatchSuccessInfo({ count: newBOs.length });
    };

    const handleBatchSuccessClose = (action: 'stay' | 'navigate') => {
        setBatchSuccessInfo(null);
        if (action === 'navigate' && setActiveModule) {
            setActiveModule('td_modeling');
        }
    };

    return (
        <div className="flex bg-slate-50 h-[calc(100vh-64px)] overflow-hidden">
            {/* 顶部导航与内容区 */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* 顶部 Tab 切换 */}
                <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview'
                                ? 'bg-purple-50 text-purple-700'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            总览
                        </button>
                        <button
                            onClick={() => setActiveTab('comparison')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'comparison'
                                ? 'bg-purple-50 text-purple-700'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            识别结果对比
                        </button>
                        <button
                            onClick={() => setActiveTab('batch')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'batch'
                                ? 'bg-purple-50 text-purple-700'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            批量确认
                        </button>
                        <button
                            onClick={() => setActiveTab('conflict')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'conflict'
                                ? 'bg-purple-50 text-purple-700'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            冲突解释
                            {results.filter((r: any) => r.hasConflict).length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                                    {results.filter((r: any) => r.hasConflict).length}
                                </span>
                            )}
                        </button>
                    </div>
                    {/* 右侧操作按钮 */}
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-600">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* 主内容区域 */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'overview' && (
                        <IdentificationOverviewTab
                            results={results}
                            onNavigateToComparison={() => setActiveTab('comparison')}
                            onNavigateToBatch={() => setActiveTab('batch')}
                            onNavigateToConflict={() => setActiveTab('conflict')}
                            onBatchGenerate={handleBatchGenerate}
                        />
                    )}
                    {activeTab === 'comparison' && (
                        <IdentificationComparisonTab
                            results={results}
                            setResults={setResults}
                            dataSources={dataSources}
                            onNavigateToBatch={() => setActiveTab('batch')}
                            onNavigateToConflict={(conflictId: string) => {
                                setConflictFilterId(conflictId);
                                setActiveTab('conflict');
                            }}
                            onGenerateBusinessObject={handleGenerateBusinessObject}
                        />
                    )}
                    {activeTab === 'batch' && (
                        <BatchConfirmationTab
                            results={results}
                            setResults={setResults}
                            selectedItems={selectedItems}
                            setSelectedItems={setSelectedItems}
                            filter={filter}
                            setFilter={setFilter}
                            onGenerateBusinessObject={handleGenerateBusinessObject}
                            onBatchGenerate={handleBatchGenerate}
                        />
                    )}
                    {activeTab === 'conflict' && (
                        <ConflictExplanationTab
                            results={results}
                            setResults={setResults}
                            conflictFilterId={conflictFilterId}
                        />
                    )}
                </div>
            </div>

            {/* 生成业务对象向导 */}
            <GenerateBusinessObjectWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                identificationResult={wizardResult}
                dataSource={dataSources[0]} // 简化处理
                businessObjects={businessObjects}
                setBusinessObjects={setBusinessObjects}
                setActiveModule={setActiveModule}
            />

            {/* 批量生成成功弹窗 */}
            {batchSuccessInfo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => handleBatchSuccessClose('stay')}>
                    <div className="bg-white rounded-xl shadow-2xl w-96 p-6 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">批量生成成功</h3>
                            <p className="text-slate-600 mb-6">
                                已成功创建 <span className="font-bold text-emerald-600 text-lg">{batchSuccessInfo.count}</span> 个业务对象
                            </p>
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={() => handleBatchSuccessClose('navigate')}
                                    className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    前往业务对象列表 <ArrowRight size={16} />
                                </button>
                                <button
                                    onClick={() => handleBatchSuccessClose('stay')}
                                    className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                                >
                                    留在当前页
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CandidateConfirmationView;




