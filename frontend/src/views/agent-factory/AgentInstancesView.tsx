import { ExternalLink, Plus, Search } from 'lucide-react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

interface AgentInstancesViewProps {
    setActiveModule?: (module: string) => void;
}

const AgentInstancesView = ({ setActiveModule }: AgentInstancesViewProps) => (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <PageHeader
            title="运行实例"
            description="面向业务的实例管理与运行追踪。"
            actions={(
                <>
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                        <Plus size={14} /> 创建实例
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2"
                        onClick={() => setActiveModule?.('agent_workbench')}
                    >
                        <ExternalLink size={14} /> 进入实例工作台
                    </button>
                </>
            )}
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                        placeholder="搜索实例名/模板版本/业务域"
                    />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <select className="px-3 py-2 rounded-lg border border-slate-200 bg-white">
                        <option>状态：全部</option>
                        <option>运行中</option>
                        <option>停用</option>
                    </select>
                    <select className="px-3 py-2 rounded-lg border border-slate-200 bg-white">
                        <option>环境：全部</option>
                        <option>Prod</option>
                        <option>Staging</option>
                    </select>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {['供应链', '运营', '法务', '政务'].map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-full bg-slate-100">{tag}</span>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="grid grid-cols-8 text-xs text-slate-400 pb-2 border-b border-slate-100">
                    <span>实例名</span>
                    <span>模板版本</span>
                    <span>能力类型</span>
                    <span>业务域</span>
                    <span>环境</span>
                    <span>状态</span>
                    <span>更新时间</span>
                    <span>操作</span>
                </div>
                {agentFactoryMock.instances.map(instance => (
                    <div key={instance.id} className="grid grid-cols-8 items-center border-b border-slate-100 pb-2">
                        <div className="text-slate-800 font-medium">{instance.name}</div>
                        <div className="text-slate-500">{instance.version}</div>
                        <div className="text-slate-500">{instance.type}</div>
                        <div className="text-slate-500">{instance.domain}</div>
                        <div className="text-slate-500">{instance.env}</div>
                        <div className={instance.status === '运行中' ? 'text-emerald-600' : 'text-slate-400'}>
                            {instance.status}
                        </div>
                        <div className="text-slate-500">{instance.updated}</div>
                        <div className="flex gap-2 text-xs">
                            <button
                                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-600"
                                onClick={() => setActiveModule?.('agent_workbench')}
                            >
                                打开
                            </button>
                            <button className="px-2 py-1 rounded-lg border border-slate-200 text-slate-600">
                                停用
                            </button>
                            <button
                                className="px-2 py-1 rounded-lg border border-slate-200 text-slate-600"
                                onClick={() => setActiveModule?.('agent_debug')}
                            >
                                Trace
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-semibold text-slate-800">实例详情</h3>
                <button className="text-xs text-slate-500 hover:text-slate-700">查看完整配置</button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {[
                    { label: '引用模板版本', value: '供应链问数助手 v2.3.1' },
                    { label: '语义版本', value: 'v2.1.0' },
                    { label: '知识源范围', value: '指标库 + 业务知识网络' }
                ].map(item => (
                    <div key={item.label} className="rounded-lg border border-slate-200 p-3">
                        <div className="text-xs text-slate-400">{item.label}</div>
                        <div className="text-slate-700 mt-1">{item.value}</div>
                    </div>
                ))}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs text-slate-400">工具集合</div>
                    <div className="text-slate-700 mt-1">SemanticSearch / SQLRunner / MetricResolver</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs text-slate-400">权限范围</div>
                    <div className="text-slate-700 mt-1">租户：集团 · 部门：供应链</div>
                </div>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
                最近运行记录：tr_90a1 / tr_90a2 / tr_90a3
            </div>
        </div>
    </div>
);

export default AgentInstancesView;
