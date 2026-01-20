import React, { useState, useEffect } from 'react';
import {
    Layout, Plus, Search, FileText, ChevronRight,
    MoreHorizontal, Calendar, ArrowRight, Brain, Upload, Trash2, AlertCircle, Check,
    Shield, Building, Settings
} from 'lucide-react';
import ScenarioEditor from './components/business-scenario/ScenarioEditor';
import { ToastProvider } from '../components/ui/Toast';
import { scenarioStorage } from '../services/storage/scenarioStorage';
import { ScenarioData } from '../types/scenario';
import { SCENE_TEMPLATES } from '../data/mockTemplates';
import { llmService } from '../services/llm/llm-service';

const BusinessScenarioView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
    const [selectedScenario, setSelectedScenario] = useState<ScenarioData | undefined>(undefined);
    const [editorInitialTab, setEditorInitialTab] = useState<'analysis' | 'modeling'>('analysis');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

    // Batch Processing State
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });

    const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
    const [loading, setLoading] = useState(true);

    // 加载场景列表
    useEffect(() => {
        loadScenarios();
    }, []);

    const loadScenarios = async () => {
        try {
            setLoading(true);
            const data = await scenarioStorage.getAllScenarios();
            setScenarios(data);
        } catch (error) {
            console.error('Failed to load scenarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = async () => {
        try {
            // 创建新场景
            const newScenario = await scenarioStorage.createScenario({
                title: '未命名场景',
                description: '',
                status: 'draft',
            });
            setSelectedScenario(newScenario);
            setViewMode('editor');
        } catch (error) {
            console.error('Failed to create scenario:', error);
        }
    };

    const [editorAutoAnalyze, setEditorAutoAnalyze] = useState(false);

    const handleEdit = async (scenario: ScenarioData, tab: 'analysis' | 'modeling' = 'analysis', autoAnalyze: boolean = false) => {
        try {
            // 加载完整数据 (包括 analysisResult)
            setLoading(true);
            const fullScenario = await scenarioStorage.getScenario(scenario.id);
            if (fullScenario) {
                setSelectedScenario(fullScenario);
                setEditorInitialTab(tab);
                setEditorAutoAnalyze(autoAnalyze); // Set auto-analyze flag
                setViewMode('editor');
            } else {
                console.error('Scenario not found');
            }
        } catch (error) {
            console.error('Failed to load scenario details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: Partial<ScenarioData>) => {
        try {
            if (selectedScenario) {
                // 更新现有场景
                const updated = { ...selectedScenario, ...data };
                await scenarioStorage.saveScenario(updated as ScenarioData);
            }
            // 重新加载列表
            await loadScenarios();
            setViewMode('list');
        } catch (error) {
            console.error('Failed to save scenario:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await scenarioStorage.deleteScenario(id);
            await loadScenarios();
            setViewMode('list');
            setDeleteConfirmId(null);
        } catch (error) {
            console.error('Failed to delete scenario:', error);
        }
    };

    // Batch Operations
    const handleSelectAll = () => {
        if (selectedIds.length === scenarios.length && scenarios.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(scenarios.map(s => s.id));
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBatchDelete = async () => {
        try {
            await scenarioStorage.deleteScenarios(selectedIds);
            await loadScenarios();
            setSelectedIds([]);
            setShowBatchDeleteConfirm(false);
        } catch (error) {
            console.error('Failed to batch delete:', error);
        }
    };

    const handleBatchAnalyze = async () => {
        const targets = scenarios.filter(s => selectedIds.includes(s.id));
        if (targets.length === 0) return;

        setIsBatchProcessing(true);
        setBatchProgress({ current: 0, total: targets.length, success: 0, fail: 0 });

        // Update status UI first
        const processingIds = targets.map(s => s.id);
        setScenarios(prev => prev.map(s => processingIds.includes(s.id) ? { ...s, status: 'analyzing' } : s));

        for (const scenario of targets) {
            try {
                // Call LLM Service
                const analysis = await llmService.analyzeScenario(
                    scenario.description,
                    `Title: ${scenario.title}, Template: ${scenario.template_id || 'None'}`
                );

                // Save result
                await scenarioStorage.saveScenario({
                    ...scenario,
                    status: 'extracted',
                    analysisResult: analysis
                });

                setBatchProgress(prev => ({ ...prev, current: prev.current + 1, success: prev.success + 1 }));

            } catch (e) {
                console.error(`Failed to analyze ${scenario.title}`, e);
                setBatchProgress(prev => ({ ...prev, current: prev.current + 1, fail: prev.fail + 1 }));
            }
        }

        await loadScenarios();
        // Keep modal open for a moment to show result
        setTimeout(() => setIsBatchProcessing(false), 1500);
    };

    const handleBatchExport = () => {
        const targets = scenarios.filter(s => selectedIds.includes(s.id));
        const exportData = {
            exportDate: new Date().toISOString(),
            count: targets.length,
            scenarios: targets
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scenarios_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };



    if (viewMode === 'editor') {
        return (
            <ToastProvider>
                <ScenarioEditor
                    scenario={selectedScenario}
                    onBack={() => setViewMode('list')}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    initialTab={editorInitialTab}
                    autoAnalyze={editorAutoAnalyze}
                />
            </ToastProvider>
        );
    }

    return (
        <ToastProvider>
            <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
                {/* Compact Header */}
                <div className="flex-none bg-white border-b border-slate-200 z-20 shadow-sm">
                    <div className="px-6 py-4 flex items-center justify-between">
                        {/* Left: Title & Compact Stats */}
                        <div className="flex items-center gap-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">业务场景梳理</h2>
                                <p className="text-xs text-slate-400 mt-0.5 hidden md:block">
                                    智能提取业务对象，让模型天然贴合业务
                                </p>
                            </div>

                            {/* Vertical Divider */}
                            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                            {/* Stats */}
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">累计场景</p>
                                        <p className="text-lg font-bold text-slate-800 leading-none">{scenarios.length}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <Brain size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">已建模</p>
                                        <div className="flex items-end gap-1">
                                            <p className="text-lg font-bold text-slate-800 leading-none">
                                                {scenarios.filter(s => s.status === 'modeled').length}
                                            </p>
                                            <span className="text-xs text-emerald-600 font-medium mb-0.5">
                                                ({scenarios.length > 0 ? Math.round((scenarios.filter(s => s.status === 'modeled').length / scenarios.length) * 100) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSelectAll}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${selectedIds.length === scenarios.length && scenarios.length > 0 ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {selectedIds.length === scenarios.length && scenarios.length > 0 ? '取消全选' : '全选'}
                            </button>
                            <button
                                onClick={handleCreateNew}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
                            >
                                <Plus size={16} />
                                <span>新建场景</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* (Stats Cards Removed) */}

                    {/* Scenario List */}
                    <div className="space-y-4">
                        <div className="px-1 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-lg">全部场景</h3>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="搜索场景名称或描述..."
                                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {scenarios.map(scenario => (
                                <div key={scenario.id} className={`bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all group ${selectedIds.includes(scenario.id) ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                                        {/* Checkbox for Selection */}
                                        <div className="md:-ml-2 pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(scenario.id)}
                                                onChange={() => toggleSelection(scenario.id)}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </div>

                                        {/* Left: Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => handleEdit(scenario)}>
                                                    {scenario.title}
                                                </h4>

                                                {scenario.template_id && (() => {
                                                    const template = SCENE_TEMPLATES.find(t => t.template_id === scenario.template_id);
                                                    if (!template) return null;

                                                    const getTemplateIcon = (type: string) => {
                                                        switch (type) {
                                                            case 'government_one_service': return <Shield size={12} className="text-blue-600" />;
                                                            case 'enterprise_hr': return <Building size={12} className="text-indigo-600" />;
                                                            case 'enterprise_supply_chain': return <Layout size={12} className="text-purple-600" />;
                                                            default: return <Settings size={12} className="text-slate-600" />;
                                                        }
                                                    };

                                                    return (
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                                                            {getTemplateIcon(template.scene_type)}
                                                            {template.template_name}
                                                        </span>
                                                    );
                                                })()}

                                                {/* Status Badges */}
                                                {scenario.status === 'draft' && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">草稿</span>}
                                                {scenario.status === 'analyzing' && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1"><Brain size={12} className="animate-pulse" /> 分析中</span>}
                                                {scenario.status === 'extracted' && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">AI 已提取</span>}
                                                {scenario.status === 'modeled' && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                                        <Check size={12} />
                                                        已发布 {scenario.versions && scenario.versions.length > 0 ? `(${scenario.versions[0].version})` : ''}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 max-w-3xl mb-4" onClick={() => handleEdit(scenario)}>
                                                {scenario.description || '暂无描述，点击开始编辑（支持自然语言描述）...'}
                                            </p>

                                            <div className="flex items-center gap-6 text-xs text-slate-400">
                                                <div className="flex items-center gap-1.5" title="最后修改时间">
                                                    <Calendar size={14} />
                                                    <span>{scenario.metadata.lastModified}</span>
                                                </div>
                                                {/* Add more metadata here if needed */}
                                                {(scenario.analysisResult?.elements?.business_objects?.primary_object || scenario.proposedObjects?.length) && (
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <Layout size={14} />
                                                        <span>
                                                            包含核心对象: {scenario.analysisResult?.elements?.business_objects?.primary_object?.label || `${scenario.proposedObjects?.length || 0} 个对象`}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 mt-2 md:mt-0">
                                            {/* Primary Action Button - Always visible or based on status */}
                                            {scenario.status === 'modeled' || scenario.status === 'extracted' ? (
                                                <button
                                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm order-last"
                                                    onClick={() => handleEdit(scenario, 'modeling')}
                                                >
                                                    <Brain size={16} />
                                                    进入建模
                                                </button>
                                            ) : (
                                                <button
                                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm order-last"
                                                    onClick={() => handleEdit(scenario, 'analysis', true)}
                                                >
                                                    <Brain size={16} />
                                                    开始分析
                                                </button>
                                            )}

                                            {/* Secondary Actions */}
                                            <button
                                                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2"
                                                onClick={() => handleEdit(scenario, 'analysis')}
                                            >
                                                {scenario.status === 'draft' ? '编辑描述' : '查看分析'}
                                            </button>

                                            <div className="h-4 w-px bg-slate-200 mx-1"></div>

                                            <button
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="删除场景"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmId(scenario.id);
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Floating Batch Toolbar */}
                    {selectedIds.length > 0 && (
                        <div className="fixed bottom-6 left-[50%] -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-5 z-40">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs">
                                    {selectedIds.length}
                                </span>
                                <span>已选择</span>
                            </div>

                            <div className="h-4 w-px bg-slate-200"></div>

                            <div className="flex items-center gap-3">
                                <button
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors flex items-center gap-1.5"
                                    onClick={handleBatchAnalyze}
                                >
                                    <Brain size={14} /> 批量分析
                                </button>
                                <button
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors flex items-center gap-1.5"
                                    onClick={handleBatchExport}
                                >
                                    <Upload size={14} /> 导出
                                </button>
                                <button
                                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1.5"
                                    onClick={() => setShowBatchDeleteConfirm(true)}
                                >
                                    <Trash2 size={14} /> 批量删除
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* List View Delete Confirmation Dialog */}
                {deleteConfirmId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="text-red-600" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">确认删除场景</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        确定要删除该场景吗？此操作无法撤销。
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={() => handleDelete(deleteConfirmId)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            确认删除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Batch Delete Confirmation */}
                {showBatchDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="text-red-600" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">确认批量删除</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        确定要删除选中的 {selectedIds.length} 个场景吗？此操作无法撤销。
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setShowBatchDeleteConfirm(false)}
                                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={handleBatchDelete}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            确认删除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Batch Processing Modal */}
                {isBatchProcessing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
                            <div className="text-center">
                                <div className="mb-4 relative inline-flex">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full relative">
                                        <Brain size={32} className="animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">正在批量分析</h3>
                                <p className="text-xs text-slate-500 mb-6">AI 正在深入理解业务场景...</p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs text-slate-600 px-1">
                                        <span>进度 ({batchProgress.current}/{batchProgress.total})</span>
                                        <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                            style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex gap-4 text-xs justify-center pt-2">
                                        <span className="text-green-600">成功: {batchProgress.success}</span>
                                        <span className={`text-red-600 ${batchProgress.fail > 0 ? 'font-bold' : ''}`}>失败: {batchProgress.fail}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToastProvider >
    );
};

export default BusinessScenarioView;
