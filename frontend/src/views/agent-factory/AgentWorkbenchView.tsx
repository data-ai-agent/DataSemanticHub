import { ExternalLink, MessageCircle, Send } from 'lucide-react';
import PageHeader from './components/PageHeader';

interface AgentWorkbenchViewProps {
    setActiveModule?: (module: string) => void;
}

const AgentWorkbenchView = ({ setActiveModule }: AgentWorkbenchViewProps) => (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <PageHeader
            title="实例工作台"
            description="面向业务人员的对话与任务执行区。"
            actions={(
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    模板版本 v2.3.1 · 语义版本 v2.1.0 · 权限范围：供应链
                    <button
                        className="ml-2 px-2 py-1 rounded-md border border-slate-200 text-xs text-slate-600 flex items-center gap-1"
                        onClick={() => setActiveModule?.('agent_debug')}
                    >
                        <ExternalLink size={12} /> 打开 Trace
                    </button>
                </div>
            )}
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm text-slate-500">
                <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-xs">时间范围：近30天</span>
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-xs">对象范围：库存 · 采购 · 供应商</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <button className="px-2 py-1 rounded-md border border-slate-200 text-slate-600">保存为用例</button>
                    <button className="px-2 py-1 rounded-md border border-slate-200 text-slate-600">查看实例配置</button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">AI</div>
                    <div className="bg-white rounded-lg p-3 text-sm text-slate-700 shadow-sm">
                        你好，我可以帮助分析库存周转率、供应商交付表现等问题。
                    </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                    <div className="bg-slate-900 text-white rounded-lg p-3 text-sm shadow-sm">
                        近30天库存周转率下降的主要原因？
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">你</div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">AI</div>
                    <div className="bg-white rounded-lg p-3 text-sm text-slate-700 shadow-sm">
                        主要原因是供应商 A 的交付延迟与需求波动，建议查看采购计划执行率与缺货率。
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-500">
                            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">结构化输出：库存周转率 -12%</div>
                            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">证据：交付延迟 18%</div>
                            <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">Trace：tr_90a1</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <MessageCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                        placeholder="输入问题或任务"
                    />
                </div>
                <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2">
                    <Send size={14} /> 发送
                </button>
            </div>
        </div>
    </div>
);

export default AgentWorkbenchView;
