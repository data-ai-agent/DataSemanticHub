import { Database, Link2 } from 'lucide-react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

const KnowledgeConnectorsView = () => {
    const { knowledge } = agentFactoryMock;

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="知识源与连接"
                description="接入语义资产、文档库与指标库。"
                actions={(
                    <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2">
                        <Link2 size={14} /> 新建连接
                    </button>
                )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="grid grid-cols-4 text-xs text-slate-400 border-b border-slate-100 pb-2">
                        <span>连接器</span>
                        <span>类型</span>
                        <span>范围</span>
                        <span>状态</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                        {knowledge.connectors.map(connector => (
                            <div key={connector.name} className="grid grid-cols-4 items-center border-b border-slate-100 pb-2">
                                <span className="text-slate-800 font-medium">{connector.name}</span>
                                <span className="text-slate-500">{connector.type}</span>
                                <span className="text-slate-500">{connector.scope}</span>
                                <span className={connector.status === '已连接' ? 'text-emerald-600' : 'text-amber-600'}>{connector.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">连接详情</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">授权凭据</div>
                            <div className="text-slate-700 mt-1">Secrets Vault · 已配置</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">访问范围</div>
                            <div className="text-slate-700 mt-1">租户：集团 · 部门：供应链</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">索引策略</div>
                            <div className="text-slate-700 mt-1">增量更新 · 每日 02:00</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 flex items-center gap-2 text-xs text-slate-500">
                            <Database size={14} className="text-slate-400" /> 语义资产选择器已集成
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeConnectorsView;
