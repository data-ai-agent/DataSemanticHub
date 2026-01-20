import React, { useState, useEffect, useRef } from 'react';
import { Brain, CheckCircle2, Loader2, Zap, Shield, Database, Sparkles, Terminal, X, ChevronRight } from 'lucide-react';

interface AnalysisStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'running' | 'done';
    result?: string;
    icon: React.ReactNode;
}

interface AnalysisProgressPanelProps {
    tableName: string;
    onComplete: (results: any) => void;
    onCancel: () => void;
    mockAnalysisResult: any;
}

export const AnalysisProgressPanel: React.FC<AnalysisProgressPanelProps> = ({
    tableName,
    onComplete,
    onCancel,
    mockAnalysisResult
}) => {
    const [steps, setSteps] = useState<AnalysisStep[]>([
        {
            id: 'scan',
            title: '元数据扫描',
            description: '解析物理表结构与特征',
            status: 'pending',
            icon: <Database size={18} />
        },
        {
            id: 'pattern',
            title: '特征识别',
            description: '分析字段分布与命名模式',
            status: 'pending',
            icon: <Zap size={18} />
        },
        {
            id: 'semantic',
            title: '语义推理',
            description: 'AI 模型推断业务含义',
            status: 'pending',
            icon: <Brain size={18} />
        },
        {
            id: 'security',
            title: '安全合规',
            description: '敏感数据与隐私检测',
            status: 'pending',
            icon: <Shield size={18} />
        },
        {
            id: 'generate',
            title: '画像生成',
            description: '综合评分与治理建议',
            status: 'pending',
            icon: <Sparkles size={18} />
        }
    ]);

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // Streaming text for each step
    const stepDetails: Record<string, string[]> = {
        scan: [
            `> 启动表元数据扫描: ${tableName}`,
            `> 连接到 schema registry... 成功`,
            `> 检测字段定义... 发现 ${mockAnalysisResult?.fields?.length || 12} 个字段`,
            `> 识别主键... [id] 已检测`,
            `> 分析物理类型... 完成`
        ],
        pattern: [
            '> 启动模式识别引擎...',
            '> 分析列命名约定...',
            '> 检测生命周期字段 (create_time, update_time)... 发现',
            `> 计算命名一致性得分... ${Math.floor(85 + Math.random() * 10)}%`
        ],
        semantic: [
            '> 初始化 AI 上下文...',
            '> 加载领域知识图谱（业务/金融）...',
            `> 推断对象类型... ${mockAnalysisResult?.objectType === 'entity' ? '实体 (Entity)' : '事件 (Event)'}`,
            `> 映射到业务域... ${mockAnalysisResult?.businessDomain || '交易域'}`,
            `> 分析数据粒度... ${mockAnalysisResult?.dataGrain || '明细级'}`
        ],
        security: [
            '> 运行 PII 检测算法...',
            '> 扫描手机号、邮箱、身份证号...',
            `> 检测到潜在敏感字段: ${Math.floor(Math.random() * 3)}`,
            `> 评估安全等级... ${mockAnalysisResult?.securityLevel || 'L2'}`
        ],
        generate: [
            '> 聚合分析结果...',
            `> 置信度得分 = ${(mockAnalysisResult?.finalScore || 0.86).toFixed(4)}`,
            '> 生成语义画像 JSON...',
            '> 完成治理建议...',
            '> 处理已成功完成。'
        ]
    };

    useEffect(() => {
        if (currentStepIndex >= steps.length) {
            setIsComplete(true);
            const checkResult = () => {
                if (mockAnalysisResult) {
                    setTimeout(() => {
                        onComplete(mockAnalysisResult);
                    }, 800);
                } else {
                    setTimeout(checkResult, 200);
                }
            };
            checkResult();
            return;
        }

        // Start current step
        setSteps(prev => prev.map((s, i) => ({
            ...s,
            status: i === currentStepIndex ? 'running' : i < currentStepIndex ? 'done' : 'pending'
        })));

        const currentStepId = steps[currentStepIndex].id;
        const details = stepDetails[currentStepId] || [];

        // Stream text for current step
        let textIndex = 0;
        const textInterval = setInterval(() => {
            if (textIndex < details.length) {
                const log = details[textIndex];
                setLogs(prev => [...prev, log]);
                textIndex++;
            } else {
                clearInterval(textInterval);
                // Mark step as done
                setSteps(prev => prev.map((s, i) => ({
                    ...s,
                    status: i === currentStepIndex ? 'done' : s.status,
                })));
                setTimeout(() => {
                    setCurrentStepIndex(prev => prev + 1);
                }, 400);
            }
        }, 500); // Slightly slower for readability

        return () => clearInterval(textInterval);
    }, [currentStepIndex, mockAnalysisResult]);

    const progressPercent = Math.min((currentStepIndex / steps.length) * 100, 100);

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden w-[700px] flex flex-col font-sans relative">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-800 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 rounded-lg blur opacity-40 animate-pulse"></div>
                        <div className="bg-slate-800 w-10 h-10 rounded-lg flex items-center justify-center relative text-purple-400 border border-slate-700">
                            <Brain size={20} className={!isComplete ? "animate-pulse" : ""} />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white tracking-tight">AI 语义引擎</h3>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Target:</span>
                            <span className="text-purple-300 font-mono bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">{tableName}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-2 hover:bg-slate-800 rounded-full"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Main Content Split */}
            <div className="flex flex-1 min-h-[400px] relative z-10">
                {/* Left: Progress Steps */}
                <div className="w-[45%] bg-slate-900/50 p-6 border-r border-slate-800">
                    <div className="space-y-6">
                        {steps.map((step, index) => {
                            const isActive = step.status === 'running';
                            const isDone = step.status === 'done';

                            return (
                                <div key={step.id} className={`flex gap-4 relative ${isActive || isDone ? 'opacity-100' : 'opacity-40'}`}>
                                    {/* Timeline Line */}
                                    {index < steps.length - 1 && (
                                        <div className={`absolute left-[15px] top-[32px] w-[2px] h-[calc(100%+24px)] ${isDone ? 'bg-emerald-500/20' : 'bg-slate-800'
                                            }`} />
                                    )}

                                    {/* Icon Box */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 relative z-10 ${isActive
                                        ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                        : isDone
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-500'
                                        }`}>
                                        {isActive ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : isDone ? (
                                            <CheckCircle2 size={16} />
                                        ) : (
                                            step.icon
                                        )}
                                    </div>

                                    {/* Text */}
                                    <div className="pt-1">
                                        <div className={`text-sm font-medium leading-none mb-1.5 transition-colors ${isActive ? 'text-white' : isDone ? 'text-slate-200' : 'text-slate-500'
                                            }`}>
                                            {step.title}
                                        </div>
                                        <div className="text-xs text-slate-500 leading-relaxed">
                                            {step.description}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Terminal */}
                <div className="w-[55%] bg-black/80 flex flex-col font-mono text-xs">
                    <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Terminal size={12} />
                            <span>stdout</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                        </div>
                    </div>
                    <div
                        ref={logContainerRef}
                        className="flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                    >
                        {logs.map((log, idx) => (
                            <div key={idx} className="break-all text-slate-300 flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-slate-600 shrink-0 select-none">$</span>
                                <span className={log.includes('COMPLETED') ? 'text-emerald-400 font-bold' : log.includes('ERROR') ? 'text-red-400' : ''}>
                                    {log}
                                </span>
                            </div>
                        ))}
                        {isComplete ? (
                            <div className="text-emerald-500 mt-4 font-bold flex items-center gap-2 animate-pulse">
                                <span className="w-2 h-4 bg-emerald-500 block"></span>
                                ANALYSIS FINISHED 分析完成
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 mt-2">
                                <span className="w-2 h-4 bg-purple-500 animate-pulse"></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Progress */}
            <div className="bg-slate-900 border-t border-slate-800 p-4 relative">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-2">
                        {isComplete ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={12} /> 准备就绪
                            </span>
                        ) : (
                            <span className="text-purple-400 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" />
                                处理中...
                            </span>
                        )}
                    </span>
                    <span className="font-mono">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
