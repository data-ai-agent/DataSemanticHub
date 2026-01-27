import { Filter } from 'lucide-react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

const AuditLogsView = () => (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <PageHeader
            title="审计日志"
            description="治理链路全量审计与回溯。"
            actions={(
                <button className="px-4 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                    <Filter size={14} /> 高级筛选
                </button>
            )}
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="grid grid-cols-4 text-xs text-slate-400 border-b border-slate-100 pb-2">
                <span>动作</span>
                <span>对象</span>
                <span>操作者</span>
                <span>时间</span>
            </div>
            <div className="mt-3 space-y-2 text-sm">
                {agentFactoryMock.auditLogs.map(log => (
                    <div key={`${log.action}-${log.time}`} className="grid grid-cols-4 items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-800 font-medium">{log.action}</span>
                        <span className="text-slate-500">{log.target}</span>
                        <span className="text-slate-500">{log.operator}</span>
                        <span className="text-slate-500">{log.time}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-800">日志详情</h3>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Diff：修改了版本 v2.3.1 的 Output Schema 字段（新增 evidence 说明）。
            </div>
            <div className="mt-3 text-xs text-slate-500">关联 Trace：tr_90a1 · 关联评测报告：#2024-102</div>
        </div>
    </div>
);

export default AuditLogsView;
