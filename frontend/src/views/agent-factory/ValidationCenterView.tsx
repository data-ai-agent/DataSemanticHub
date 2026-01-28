import { useState } from 'react';
import { CheckSquare, Play, Search, Zap } from 'lucide-react';
import DebugTraceView from './DebugTraceView';
import TestEvaluationView from './TestEvaluationView';

interface ValidationCenterViewProps {
    setActiveModule?: (module: string) => void;
    initialTab?: 'debug' | 'test';
}

const ValidationCenterView = ({ setActiveModule, initialTab = 'debug' }: ValidationCenterViewProps) => {
    const [activeTab, setActiveTab] = useState<'debug' | 'test'>(initialTab);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CheckSquare size={24} className="text-violet-600" />
                        验证中心
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">集成调试、Trace、回归测试与质量门禁的统一验证平台。</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 flex gap-4 shrink-0">
                <button
                    onClick={() => setActiveTab('debug')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'debug'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                >
                    <Search size={18} />
                    调试与 Trace
                </button>
                <button
                    onClick={() => setActiveTab('test')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'test'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                >
                    <Zap size={18} />
                    用例与评测
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 pb-6 overflow-auto min-h-0">
                {activeTab === 'debug' ? (
                    <DebugTraceView setActiveModule={setActiveModule} />
                ) : (
                    <TestEvaluationView />
                )}
            </div>
        </div>
    );
};

export default ValidationCenterView;
