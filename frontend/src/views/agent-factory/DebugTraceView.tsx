import { Play, Save, Slash, StopCircle } from 'lucide-react';
import { useState } from 'react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

interface DebugTraceViewProps {
    setActiveModule?: (module: string) => void;
}

const stageStyle: Record<string, string> = {
    pass: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    fail: 'bg-rose-50 text-rose-700'
};

const DebugTraceView = ({ setActiveModule }: DebugTraceViewProps) => {
    const { debugTrace } = agentFactoryMock;
    const [outputTab, setOutputTab] = useState<'text' | 'json'>('text');

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="调试与 Trace"
                description="针对单次运行的输入、输出、Trace 全链路分析。"
                actions={(
                    <div className="flex items-center gap-2">
                        <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
                            <option>版本：Draft</option>
                            <option>版本：v2.3.1</option>
                        </select>
                        <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
                            <option>环境：Dev</option>
                            <option>环境：Staging</option>
                        </select>
                        <button className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2">
                            <Play size={14} /> 运行
                        </button>
                        <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                            <StopCircle size={14} /> 取消
                        </button>
                        <button
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2"
                            onClick={() => setActiveModule?.('agent_test')}
                        >
                            <Save size={14} /> 保存为用例
                        </button>
                    </div>
                )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">输入面板</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">变量表单</div>
                            <div className="mt-2 space-y-2 text-xs text-slate-600">
                                {['时间范围：近30天', '业务对象：库存/采购', '分析目标：库存周转率'].map(item => (
                                    <div key={item} className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1">
                                        <span>{item}</span>
                                        <span className="text-slate-400">必填</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">输入方式</div>
                            <div className="mt-2 flex gap-2 text-xs">
                                <button className="px-2 py-1 rounded-md border border-slate-200 text-slate-600">JSON</button>
                                <button className="px-2 py-1 rounded-md border border-slate-200 text-slate-600">文件上传</button>
                                <button className="px-2 py-1 rounded-md border border-slate-200 text-slate-600">加载用例</button>
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 font-mono">
                            {`{"metric":"库存周转率","period":"30d","scope":"华东"}`}
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                            校验提示：字段 scope 缺失时将使用默认范围
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">输出面板</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="flex gap-2 text-xs">
                            <button
                                className={`px-2 py-1 rounded-md border ${outputTab === 'text' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                                onClick={() => setOutputTab('text')}
                            >
                                Text
                            </button>
                            <button
                                className={`px-2 py-1 rounded-md border ${outputTab === 'json' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                                onClick={() => setOutputTab('json')}
                            >
                                JSON
                            </button>
                        </div>
                        {outputTab === 'text' ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600">
                                输出预览：库存周转率下降主要由供应商交付延迟引起，建议调整补货频率并优先处理高风险供应商。
                            </div>
                        ) : (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 font-mono">
                                {`{"insight":"库存周转率下降","drivers":["交付延迟","需求波动"],"confidence":0.82}`}
                            </div>
                        )}
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">Schema 校验</div>
                            <div className="text-slate-700 mt-1">通过（0 个失败字段）</div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs">复制输出</button>
                            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs">导出 JSON</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">Trace 面板</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <div>
                            <div className="text-xs text-slate-400">阶段时间线</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {debugTrace.traceStages.map(stage => (
                                    <span key={stage.name} className={`px-2 py-1 rounded-full text-xs ${stageStyle[stage.status]}`}>
                                        {stage.name} {stage.cost}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">工具调用</div>
                            <div className="mt-2 space-y-2">
                                {debugTrace.toolCalls.map(call => (
                                    <div key={call.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-xs">
                                        <span className="text-slate-700">{call.name}</span>
                                        <span className="text-slate-500">{call.duration}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
                            Token：12.4k · 成本：￥0.021 · 耗时：3.8s
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                            Admin：Prompt 渲染结果 / 模型响应原文 / 重试记录（仅管理员可见）
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 text-sm">
                    <div className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 flex items-center gap-2">
                        <Slash size={14} /> errorCode: TOOL_TIMEOUT
                    </div>
                    <div className="text-slate-500">stage: execute · requestId: rq_10092</div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm">重试</button>
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm">缩小范围</button>
                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm">仅返回结构</button>
                    <button
                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
                        onClick={() => setActiveModule?.('agent_designer')}
                    >
                        切换版本
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DebugTraceView;
