import React, { useState, useRef } from 'react';
import {
    Upload, FileText, X, Check, Brain,
    Loader2, ArrowRight, FileType, AlertCircle
} from 'lucide-react';
import { llmService } from '../../../services/llm';

interface PolicyImportWizardProps {
    onClose: () => void;
    onImport: (scenarios: any[]) => void;
}

const PolicyImportWizard: React.FC<PolicyImportWizardProps> = ({ onClose, onImport }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Analyzing, 3: Preview
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [extractedScenarios, setExtractedScenarios] = useState<any[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    // Upload Mock
    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const startAnalysis = async () => {
        if (!file) return;

        setStep(2);
        setProgress(0);
        setParseError(null);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 90));
            }, 200);

            const result = await llmService.parsePolicy(file);

            clearInterval(progressInterval);
            setProgress(100);

            // Convert to component-compatible format
            const scenarios = result.scenarios.map((scenario: any) => ({
                id: scenario.id,
                title: scenario.title,
                description: scenario.description,
                status: 'extracted' as const,
                confidence: scenario.confidence,
                lastModified: new Date().toISOString().split('T')[0],
                objectCount: (scenario.elements.subjects?.length || 0) +
                    (scenario.elements.objects?.length || 0),
                elements: scenario.elements
            }));

            setExtractedScenarios(scenarios);
            setTimeout(() => setStep(3), 500);

        } catch (error) {
            console.error('Policy parse error:', error);
            setParseError(error instanceof Error ? error.message : '文件解析失败');
            setProgress(0);
            // Revert to step 1 on error
            setTimeout(() => setStep(1), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Brain className="text-indigo-600" size={20} />
                            政策文件智能导入
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">上传政策文档，LLM 将自动识别并提取业务场景</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-8 overflow-hidden">

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div
                            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer group relative"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFileDrop}
                        >
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileSelect} accept=".pdf,.doc,.docx" />

                            {!file ? (
                                <>
                                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Upload className="text-indigo-500" size={32} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-700 mb-2">点击或拖拽文件到这里</h4>
                                    <p className="text-slate-500 mb-8">支持 PDF, Word, 图片 (OCR)</p>
                                    <div className="flex gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><FileType size={14} /> PDF</span>
                                        <span className="flex items-center gap-1"><FileText size={14} /> DOCX</span>
                                        <span className="flex items-center gap-1"><FileText size={14} /> JPG/PNG</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                                        <FileText className="text-green-600" size={28} />
                                    </div>
                                    <h4 className="text-lg font-medium text-slate-800">{file.name}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        className="mt-4 text-sm text-red-500 hover:text-red-600 underline"
                                    >
                                        移除文件
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Analyzing */}
                    {step === 2 && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-full max-w-md space-y-8">
                                <div className="text-center">
                                    <div className="inline-block relative">
                                        <Brain size={64} className="text-indigo-200" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 size={32} className="text-indigo-600 animate-spin" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mt-6">AI 正在阅读文档...</h3>
                                    <p className="text-slate-500 mt-2">正在进行版面分析、场景切分和要素提取</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-slate-500">
                                        <span>分析进度</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                    {progress > 20 && <div className="flex items-center gap-2 text-sm text-slate-700 animate-in fade-in slide-in-from-left"><Check size={14} className="text-green-500" /> 文档格式解析完成</div>}
                                    {progress > 45 && <div className="flex items-center gap-2 text-sm text-slate-700 animate-in fade-in slide-in-from-left"><Check size={14} className="text-green-500" /> 识别到 2 个主要章节</div>}
                                    {progress > 70 && <div className="flex items-center gap-2 text-sm text-slate-700 animate-in fade-in slide-in-from-left"><Check size={14} className="text-green-500" /> 提取了 5 个核心业务要素</div>}
                                    {progress > 90 && <div className="flex items-center gap-2 text-sm text-slate-700 animate-in fade-in slide-in-from-left"><Check size={14} className="text-green-500" /> 正在构建业务场景模型...</div>}
                                    {parseError && (
                                        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-2 rounded animate-in fade-in">
                                            <AlertCircle size={14} className="text-red-600" />
                                            {parseError}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Result Preview */}
                    {step === 3 && (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-slate-800">识别结果预览 (2)</h4>
                                <div className="flex gap-2">
                                    <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center gap-1">
                                        <Check size={12} /> 高置信度
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {extractedScenarios.map((scenario) => (
                                    <div key={scenario.id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all bg-white group cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-bold text-indigo-700 text-lg">{scenario.title}</h5>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">相似度: {(scenario.confidence * 100).toFixed(0)}%</span>
                                                <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-3 leading-relaxed border border-slate-100">
                                            {scenario.description}
                                        </div>
                                        <div className="flex gap-4 text-xs">
                                            <div className="flex gap-1 items-center bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                <span className="font-bold">{scenario.elements.subjects.length}</span> 主体
                                            </div>
                                            <div className="flex gap-1 items-center bg-green-50 text-green-700 px-2 py-1 rounded">
                                                <span className="font-bold">{scenario.elements.actions.length}</span> 行为
                                            </div>
                                            <div className="flex gap-1 items-center bg-orange-50 text-orange-700 px-2 py-1 rounded">
                                                <span className="font-bold">{scenario.elements.objects.length}</span> 客体
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-none px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all"
                    >
                        取消
                    </button>

                    {step === 1 && (
                        <button
                            disabled={!file}
                            onClick={startAnalysis}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200 flex items-center gap-2 transition-all font-medium"
                        >
                            <Brain size={18} />
                            开始智能分析
                        </button>
                    )}

                    {step === 3 && (
                        <button
                            onClick={() => onImport(extractedScenarios)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-200 flex items-center gap-2 transition-all font-medium"
                        >
                            确认导入 (2)
                            <ArrowRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PolicyImportWizard;
