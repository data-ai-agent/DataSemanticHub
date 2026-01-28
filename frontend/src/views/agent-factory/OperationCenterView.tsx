import { useState } from 'react';
import { Cpu, TrendingUp } from 'lucide-react';
import AgentInstancesView from './AgentInstancesView';
import ObservabilityView from './ObservabilityView';

interface OperationCenterViewProps {
    setActiveModule?: (module: string) => void;
    initialTab?: 'instances' | 'observability';
}

const OperationCenterView = ({ setActiveModule, initialTab = 'instances' }: OperationCenterViewProps) => {
    const [activeTab, setActiveTab] = useState<'instances' | 'observability'>(initialTab);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Cpu size={24} className="text-violet-600" />
                        运行中心
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">管理智能体运行实例，监控全链路运行状态与核心指标。</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 flex gap-4 shrink-0">
                <button
                    onClick={() => setActiveTab('instances')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'instances'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                >
                    <Cpu size={18} />
                    运行实例
                </button>
                <button
                    onClick={() => setActiveTab('observability')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'observability'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                >
                    <TrendingUp size={18} />
                    运行观测
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 pb-6 overflow-auto min-h-0">
                {activeTab === 'instances' ? (
                    <AgentInstancesView setActiveModule={setActiveModule} />
                ) : (
                    <ObservabilityView />
                )}
            </div>
        </div>
    );
};

export default OperationCenterView;
