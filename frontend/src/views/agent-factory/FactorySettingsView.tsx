import { KeyRound, Settings, Shield, Users } from 'lucide-react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

const FactorySettingsView = () => (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <PageHeader
            title="工厂设置"
            description="模型、密钥、配额与权限管理。"
            actions={(
                <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2">
                    <Settings size={14} /> 保存设置
                </button>
            )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800">模型供应商</h3>
                <div className="mt-4 space-y-3 text-sm">
                    {agentFactoryMock.settings.models.map(provider => (
                        <div key={provider.provider} className="rounded-lg border border-slate-200 p-3">
                            <div className="text-slate-800 font-medium">{provider.provider}</div>
                            <div className="text-xs text-slate-500 mt-1">可用模型：{provider.models.join(', ')}</div>
                            <div className="text-xs text-emerald-600 mt-1">{provider.status}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">Secrets Vault</h3>
                    <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-600 flex items-center gap-2">
                        <KeyRound size={14} /> 数据源 / 文档库 / 外部 API 凭据
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">配额与预算</h3>
                    <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                        token 预算：按租户 / 部门 / 角色拆分
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">RBAC</h3>
                    <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-600 flex items-center gap-2">
                        <Users size={14} /> 模板编辑 / 发布 / 观测权限矩阵
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">全局 Guardrails</h3>
                    <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-600 flex items-center gap-2">
                        <Shield size={14} /> 注入防护 · 敏感字段策略 · SQL 安全
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default FactorySettingsView;
