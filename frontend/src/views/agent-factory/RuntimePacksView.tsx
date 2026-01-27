import { Layers, PlayCircle, Shield } from 'lucide-react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

const RuntimePacksView = () => (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <PageHeader
            title="运行包与策略"
            description="将提示词、工具链与模型策略产品化。"
            actions={(
                <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2">
                    <Layers size={14} /> 新建运行包
                </button>
            )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-5 text-xs text-slate-400 border-b border-slate-100 pb-2">
                    <span>运行包</span>
                    <span>能力类型</span>
                    <span>业务域</span>
                    <span>版本</span>
                    <span>状态</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                    {agentFactoryMock.runtimePacks.map(pack => (
                        <div key={pack.id} className="grid grid-cols-5 items-center border-b border-slate-100 pb-2">
                            <span className="text-slate-800 font-medium">{pack.name}</span>
                            <span className="text-slate-500">{pack.type}</span>
                            <span className="text-slate-500">{pack.domain}</span>
                            <span className="text-slate-500">{pack.version}</span>
                            <span className={pack.status === 'Stable' ? 'text-emerald-600' : 'text-amber-600'}>{pack.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">运行包策略</h3>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="rounded-lg border border-slate-200 p-3">Prompt 资产引用：parse / generate / explain</div>
                        <div className="rounded-lg border border-slate-200 p-3">Tool Policy：检索优先 + 降级策略</div>
                        <div className="rounded-lg border border-slate-200 p-3">Model Policy：分阶段模型路由</div>
                        <div className="rounded-lg border border-slate-200 p-3">Guardrails：输出校验 + 安全策略</div>
                    </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500 flex items-center gap-2">
                    <PlayCircle size={14} /> Policy Simulator：输入问题 → 展示工具链选择
                </div>
                <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                    <Shield size={14} /> 从 pack 维度触发发布
                </button>
            </div>
        </div>
    </div>
);

export default RuntimePacksView;
