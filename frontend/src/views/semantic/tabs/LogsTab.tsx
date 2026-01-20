import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { AuditLogEntry, UpgradeHistoryEntry } from '../../../types/semantic';

interface LogsTabProps {
    auditLogs: AuditLogEntry[];
    upgradeHistory: UpgradeHistoryEntry[];
    onRollback: (id: string) => void;
}

const actionLabelMap: Record<string, string> = {
    accept: '接受建议',
    override: '改判',
    pending: '待定',
    confirm: '确认生效'
};

export const LogsTab: React.FC<LogsTabProps> = ({ auditLogs, upgradeHistory, onRollback }) => {
    return (
        <div id="result-logs" className="space-y-4">
            {auditLogs.length > 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-3">
                        <CheckCircle size={14} className="text-slate-500" /> 证据裁决日志
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {auditLogs.map(entry => (
                            <div key={entry.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-md px-2 py-1.5">
                                <div className="text-slate-600">
                                    <span className="font-mono text-slate-700">{entry.field || '-'}</span>
                                    <span className="text-slate-400"> · {actionLabelMap[entry.action] || entry.action}</span>
                                    {entry.source && (
                                        <span className="text-slate-400"> · {entry.source}</span>
                                    )}
                                    <span className="text-slate-400"> · {entry.timestamp}</span>
                                </div>
                                <span className="text-slate-400 truncate max-w-[240px]">{entry.reason || ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-sm text-slate-400">暂无证据裁决日志</div>
            )}

            {upgradeHistory.length > 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-3">
                        <Clock size={14} className="text-slate-500" /> 升级操作记录
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {upgradeHistory.map(entry => (
                            <div key={entry.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-md px-2 py-1.5">
                                <div className="text-slate-600">
                                    <span className="font-mono text-slate-700">{entry.tableName}</span>
                                    <span className="text-slate-400"> · {entry.timestamp}</span>
                                    {entry.rolledBack && (
                                        <span className="ml-2 text-orange-600">已撤销</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => onRollback(entry.id)}
                                    disabled={entry.rolledBack}
                                    className={`px-2 py-1 rounded ${entry.rolledBack
                                        ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                                        : 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                                        }`}
                                >
                                    撤销
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-sm text-slate-400">暂无升级操作记录</div>
            )}
        </div>
    );
};
