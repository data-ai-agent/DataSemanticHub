import { Shield, Wrench } from 'lucide-react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

const ToolRegistryView = () => {
    const { tools } = agentFactoryMock;

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="工具与技能"
                description="注册表、权限与契约统一管理。"
                actions={(
                    <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2">
                        <Wrench size={14} /> 注册工具
                    </button>
                )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="grid grid-cols-6 text-xs text-slate-400 border-b border-slate-100 pb-2">
                        <span>工具名</span>
                        <span>类型</span>
                        <span>版本</span>
                        <span>状态</span>
                        <span>权限级别</span>
                        <span>超时/成本</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                        {tools.registry.map(tool => (
                            <div key={tool.name} className="grid grid-cols-6 items-center border-b border-slate-100 pb-2">
                                <span className="text-slate-800 font-medium">{tool.name}</span>
                                <span className="text-slate-500">{tool.type}</span>
                                <span className="text-slate-500">{tool.version}</span>
                                <span className={tool.status === '可用' ? 'text-emerald-600' : 'text-amber-600'}>{tool.status}</span>
                                <span className="text-slate-500">{tool.permission}</span>
                                <span className="text-slate-500">{tool.timeout} · {tool.cost}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">工具详情</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">I/O Schema</div>
                            <div className="text-slate-700 mt-1">必填字段：query / context / limit</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">权限</div>
                            <div className="text-slate-700 mt-1">角色：运营 / 管理员</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">安全约束</div>
                            <div className="text-slate-700 mt-1">SQL 工具禁止 DDL/DML</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 flex items-center gap-2 text-xs text-slate-500">
                            <Shield size={14} className="text-emerald-500" /> 健康状态：可用性 99.2%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolRegistryView;
