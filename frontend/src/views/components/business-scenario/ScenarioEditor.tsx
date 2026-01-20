import React, { useState } from 'react';
import {
    ArrowLeft, Save, Brain, Sparkles, Check,
    AlertCircle, Activity, Box, ToggleLeft, Type,
    Upload, Loader2, Trash2, Database
} from 'lucide-react';
import { llmService } from '../../../services/llm';
import { useToast } from '../../../components/ui/Toast';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { SCENARIO_TEMPLATES } from '../../../data/scenarioTemplates';
import AnalysisResultPanelVNext from './AnalysisResultPanelVNext';
import BusinessModelPanel from './BusinessModelPanel';
import SceneTemplateConfigPanel from './SceneTemplateConfigPanel';
import AnalysisCandidatesPanel from './AnalysisCandidatesPanel';
import SmartEditor from '../../../components/editor/SmartEditor';
import DescriptionQualityIndicator from '../../../components/ui/DescriptionQualityIndicator';
import { useCandidateManager } from './hooks/useCandidateManager';
import { scenarioStorage } from '../../../services/storage/scenarioStorage';
import { mockAnalysisResultVNext } from '../../../data/mockAnalysisVNext';
import { AnalysisResultVNext } from '../../../types/analysisVNext';
import { RecognitionRun } from '../../../types/scene-model';

interface ScenarioEditorProps {
    scenario?: any;
    onBack: () => void;
    onSave: (data: any) => void;
    onDelete?: (id: string) => void;
    initialTab?: 'analysis' | 'modeling';
    autoAnalyze?: boolean;
}

const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
    scenario,
    onBack,
    onSave,
    onDelete,
    initialTab = 'analysis',
    autoAnalyze = false
}) => {
    // 状态
    const [title, setTitle] = useState(scenario?.title || '');
    const [description, setDescription] = useState(scenario?.description || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResultVNext | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [generatingObjects, setGeneratingObjects] = useState(false);

    // Sprint 1: Template State
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(scenario?.template_id);


    const [activeTab, setActiveTab] = useState<'analysis' | 'modeling'>(initialTab);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Auto-analyze effect
    React.useEffect(() => {
        if (autoAnalyze && description && !analysisResult && !isAnalyzing) {
            handleAnalyze();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoAnalyze]); // Run only when autoAnalyze flag is present/changes

    // Hooks
    const toast = useToast();
    // 辅助函数: 转换编辑器配置（高亮 + 补全）
    const getEditorConfig = (result: AnalysisResultVNext | null) => {
        if (!result) return { highlight: null, completion: [] };
        const { elements } = result;

        // 高亮配置
        const highlight = {
            subjects: elements.roles.roles.map(r => r.label),
            actions: elements.actions.actions.map(a => a.label),
            objects: [
                elements.business_objects.primary_object.label,
                ...elements.business_objects.related_objects.map(o => o.label)
            ],
            states: elements.state_machine.states.map(s => s.state_name)
        };

        // 补全建议配置
        const completion = [
            ...elements.actions.actions.map(a => ({ label: a.label, category: '动作' })),
            ...elements.business_objects.related_objects.map(o => ({ label: o.label, category: '对象' })),
            { label: elements.business_objects.primary_object.label, category: '对象' },
            ...elements.state_machine.states.map(s => ({ label: s.state_name, category: '状态' })),
            ...elements.roles.roles.map(r => ({ label: r.label, category: '角色' })),
        ];

        return { highlight, completion };
    };

    // 处理器
    const handleSave = () => {
        onSave({
            title,
            description,
            analysisResult,
            template_id: selectedTemplateId, // I added this in Sprint 1
            // Phase 2: Save V2 Data (Modified candidates + Working Copy)
            recognitionRun: recognitionRun && candidates ? { ...recognitionRun, candidates } : recognitionRun || undefined,
            workingCopy
        });
        toast.success('场景已保存');
    };

    const handleDelete = () => {
        if (scenario?.id && onDelete) {
            onDelete(scenario.id);
            toast.success('场景已删除');
        }
    };

    // State for V2
    const [recognitionRun, setRecognitionRun] = useState<RecognitionRun | null>(scenario?.recognitionRun || null);

    // Sprint 2: Interaction Manager
    const {
        candidates,
        workingCopy,
        acceptCandidate,
        rejectCandidate,
        editCandidate
    } = useCandidateManager(recognitionRun);

    const handleAnalyze = async () => {
        if (!selectedTemplateId) {
            toast.warning('请先选择一个业务场景模板');
            return;
        }

        if (!description.trim()) {
            toast.warning('请输入场景描述');
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            // Phase 2: Use V2 Service
            const result = await llmService.analyzeScenarioV2(description, selectedTemplateId);
            setRecognitionRun(result);

            // Temporary: Clear old result to switch UI mode
            setAnalysisResult(null);

            toast.success('基于模板 AI 分析完成 (Candidates Generated)');
        } catch (error) {
            console.error('Analysis error:', error);
            const errorMsg = error instanceof Error ? error.message : '分析失败，请稍后重试';
            setAnalysisError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Publish Handler (Sprint 3)
    const handlePublish = async () => {
        if (!workingCopy) return;

        try {
            // 1. Double check validation (optional, as UI disables it)
            // 2. Publish
            if (scenario?.id) {
                await scenarioStorage.publishVersion(scenario.id, workingCopy);
                toast.success('模型发布成功！');

                // Refresh if needed, or simple update local state
                // Ideally reload context, but for now we trust storage update
            }
        } catch (error) {
            console.error('Publish failed:', error);
            toast.error('发布失败');
        }
    };

    const handleAnalysisUpdate = (updatedData: AnalysisResultVNext) => {
        setAnalysisResult(updatedData);
        // Optional: Trigger a toast or auto-save if needed
    };

    const handleGenerateObjects = async () => {
        if (!analysisResult) return;
        setGeneratingObjects(true);
        // In vNext, the analysis result already contains the proposed objects schema.
        // We just simulate a transition delay or "Thinking" phase here.
        setTimeout(() => {
            setGeneratingObjects(false);
            setActiveTab('modeling');
            toast.success('业务模型构建完成');
        }, 1000);
    };

    const applyTemplate = (templateId: string) => {
        const template = SCENARIO_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setTitle(template.title);
            setDescription(template.description);
            toast.info('已应用模板');
        }
    };

    // 键盘快捷键
    useKeyboardShortcuts({
        'ctrl+s': handleSave,
        'meta+s': handleSave,
        'ctrl+enter': () => {
            if (description && !isAnalyzing) handleAnalyze();
        },
        'meta+enter': () => {
            if (description && !isAnalyzing) handleAnalyze();
        },
    });

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex-none px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="输入场景名称..."
                        className="text-lg font-bold text-slate-800 placeholder:text-slate-400 border-none focus:outline-none w-96"
                    />
                </div>
                <div className="flex items-center gap-3">
                    {scenario?.id && onDelete && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            title="删除场景"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                    <div className="h-6 w-px bg-slate-200"></div>
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !description}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${isAnalyzing ? 'bg-indigo-50 text-indigo-400 cursor-wait' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                            }`}
                    >
                        {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        <span>{isAnalyzing ? '分析中...' : '智能识别要素'}</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                        title="快捷键: Ctrl/Cmd + S"
                    >
                        <Save size={18} />
                        保存场景
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Editor - shrinks when analysis panel is open */}
                <div className={`overflow-y-auto p-4 bg-slate-50/30 transition-all duration-300 ${analysisResult || recognitionRun ? 'w-2/5 min-w-[400px]' : 'flex-1'
                    }`}>
                    <div>
                        <div className="mb-2 flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-700 block uppercase tracking-wide">
                                业务场景描述
                            </label>
                            {/* Quick start removed as it is replaced by template selection */}
                        </div>

                        {/* Template Config Panel (Sprint 1) */}
                        <SceneTemplateConfigPanel
                            selectedTemplateId={selectedTemplateId}
                            onTemplateChange={setSelectedTemplateId}
                            readOnly={!!analysisResult || !!recognitionRun}
                            workingCopy={workingCopy || undefined}
                        />

                        <div className={`${analysisResult || recognitionRun ? 'min-h-[200px]' : 'min-h-[350px]'}`}>
                            <SmartEditor
                                content={description}
                                onChange={setDescription}
                                analysisResult={getEditorConfig(analysisResult).highlight}
                                completionItems={getEditorConfig(analysisResult).completion}
                                placeholder="请用自然语言描述业务流程。例如：申请人携带材料到窗口提交申请，工作人员审核后..."
                            />
                        </div>

                        {/* Description Quality Indicator */}
                        {!analysisResult && !recognitionRun && (
                            <DescriptionQualityIndicator
                                description={description}
                                className="mt-3"
                            />
                        )}

                        {analysisError && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle size={12} className="text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] text-red-800 font-medium">分析失败</p>
                                    <p className="text-[9px] text-red-600 mt-0.5">{analysisError}</p>
                                </div>
                            </div>
                        )}

                        <p className="text-[9px] text-slate-400 mt-2 flex items-center gap-1">
                            <Brain size={9} />
                            提示：描述得越详细，识别越准确。包含主体、行为、涉及的材料和状态变化。
                        </p>
                    </div>
                </div>


                {/* Right: Analysis Panel - takes 60% when visible */}
                <div className={`w-3/5 border-l border-slate-200 bg-white flex flex-col transition-all duration-300 ${analysisResult || recognitionRun ? 'block' : 'hidden'
                    }`}>
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Activity size={14} />
                            识别结果
                        </button>
                        <button
                            onClick={() => setActiveTab('modeling')}
                            disabled={!analysisResult && !workingCopy}
                            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === 'modeling' ? 'border-blue-600 text-blue-600' :
                                (!analysisResult && !workingCopy) ? 'border-transparent text-slate-300 cursor-not-allowed' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Database size={14} />
                            业务建模 (Modeling)
                        </button>
                    </div>

                    {/* Tab Content Area */}
                    <div className="flex-1 overflow-hidden">
                        {/* Analysis Tab (VNext Legacy) */}
                        {activeTab === 'analysis' && analysisResult && (
                            <AnalysisResultPanelVNext
                                data={analysisResult}
                                loading={isAnalyzing}
                                onGenerate={handleGenerateObjects}
                                generating={generatingObjects}
                                onUpdate={handleAnalysisUpdate}
                            />
                        )}

                        {/* Analysis Tab (Phase 2 Candidates) */}
                        {activeTab === 'analysis' && recognitionRun && candidates && (
                            <AnalysisCandidatesPanel
                                data={{ ...recognitionRun, candidates }}
                                loading={isAnalyzing}
                                onAccept={acceptCandidate}
                                onReject={rejectCandidate}
                                onEdit={editCandidate}
                            />
                        )}

                        {/* Modeling Tab */}
                        {activeTab === 'modeling' && (analysisResult || workingCopy) && (
                            <BusinessModelPanel
                                data={(workingCopy || analysisResult) as any}
                                versions={scenario?.versions || []}
                                onSave={() => {
                                    onSave({ title, description, analysisResult, workingCopy });
                                    toast.success('业务模型已确认并保存');
                                }}
                                onPublish={handlePublish}
                                onRollback={async (versionId) => {
                                    if (scenario?.id) {
                                        try {
                                            await scenarioStorage.rollbackToVersion(scenario.id, versionId);
                                            toast.success('已回滚到指定版本，页面即将刷新');
                                            // Reload to refresh all data including workingCopy from stored state
                                            setTimeout(() => window.location.reload(), 500);
                                        } catch (error) {
                                            toast.error('回滚失败');
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">确认删除场景</h3>
                                <p className="text-sm text-slate-600 mb-4">
                                    您确定要删除场景「{title || '未命名场景'}」吗？此操作无法撤销。
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDelete();
                                            setShowDeleteConfirm(false);
                                        }}
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
        </div>
    );
};

export default ScenarioEditor;
