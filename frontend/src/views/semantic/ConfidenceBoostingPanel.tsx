import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Sparkles, Link2, Search, X } from 'lucide-react';

interface BoostingTask {
    factor: string;
    status: 'LOW' | 'MEDIUM' | 'OK';
    statusText: string;
    action: string;
    actionType: 'BATCH_GENERATE' | 'SPECIFY_PK' | 'IDENTIFY_JSON' | 'NONE';
    scoreImpact: number; // 预计提升分数
    description?: string;
}

interface ConfidenceBoostingPanelProps {
    currentScore: number;
    tasks: BoostingTask[];
    onActionClick?: (actionType: string) => void;
}

export const ConfidenceBoostingPanel: React.FC<ConfidenceBoostingPanelProps> = ({
    currentScore,
    tasks,
    onActionClick
}) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'LOW':
                return <AlertCircle size={14} className="text-red-500" />;
            case 'MEDIUM':
                return <AlertTriangle size={14} className="text-orange-500" />;
            case 'OK':
                return <CheckCircle size={14} className="text-emerald-500" />;
            default:
                return null;
        }
    };

    const getActionButton = (task: BoostingTask) => {
        if (task.actionType === 'NONE') {
            return <span className="text-xs text-slate-400">{task.action}</span>;
        }

        const buttonConfig = {
            BATCH_GENERATE: { icon: Sparkles, color: 'purple' },
            SPECIFY_PK: { icon: Link2, color: 'blue' },
            IDENTIFY_JSON: { icon: Search, color: 'indigo' }
        };

        const config = buttonConfig[task.actionType];
        const Icon = config.icon;

        return (
            <button
                onClick={() => onActionClick?.(task.actionType)}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md 
                    bg-${config.color}-50 text-${config.color}-600 
                    hover:bg-${config.color}-100 transition-colors`}
            >
                <Icon size={12} />
                {task.action}
            </button>
        );
    };

    const totalPotentialGain = tasks
        .filter(t => t.status !== 'OK')
        .reduce((sum, t) => sum + t.scoreImpact, 0);

    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-purple-200 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        🤖 AI 置信度提升建议
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        完成以下动作可显著提升AI判断准确率
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500">当前置信度</div>
                    <div className={`text-2xl font-bold ${currentScore >= 0.8 ? 'text-emerald-600' :
                            currentScore >= 0.6 ? 'text-blue-600' :
                                'text-orange-600'
                        }`}>
                        {(currentScore * 100).toFixed(0)}%
                    </div>
                    {totalPotentialGain > 0 && (
                        <div className="text-xs text-emerald-600 font-medium mt-0.5">
                            ↑ 最多可提升 {(totalPotentialGain * 100).toFixed(0)}%
                        </div>
                    )}
                </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">影响因子</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">状态</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">建议动作</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-600">预计提升</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tasks.map((task, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2.5 font-medium text-slate-700">
                                    {task.factor}
                                    {task.description && (
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            {task.description}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                        {getStatusIcon(task.status)}
                                        <span className={`${task.status === 'LOW' ? 'text-red-600' :
                                                task.status === 'MEDIUM' ? 'text-orange-600' :
                                                    'text-emerald-600'
                                            }`}>
                                            {task.statusText}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5">
                                    {getActionButton(task)}
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                    {task.scoreImpact > 0 ? (
                                        <span className="text-emerald-600 font-bold">
                                            ↑ 约 {(task.scoreImpact * 100).toFixed(0)}%
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Tip */}
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-white/50 rounded-lg p-2">
                <span className="text-purple-500">💡</span>
                <span>
                    点击建议动作按钮可快速执行修复，完成后系统将自动重新计算置信度
                </span>
            </div>
        </div>
    );
};
