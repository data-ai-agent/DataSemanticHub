
import React, { useState } from 'react';
import {
    Puzzle, Wrench, Globe, Server, CloudLightning,
    Settings, ArrowRight, Zap, Database, Boxes,
    LayoutGrid
} from 'lucide-react';
import IntegrationToolsView from './IntegrationToolsView';
import IntegrationMCPView from './IntegrationMCPView';
import IntegrationOperatorsView from './IntegrationOperatorsView';
import IntegrationAPIServiceView from './IntegrationAPIServiceView';

// --- Main Page Component ---

const IntegrationCenterView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'TOOLS' | 'MCP' | 'OPERATORS' | 'API'>('TOOLS');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header Area */}
            <div className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                            <Puzzle className="w-6 h-6 mr-3 text-indigo-600" />
                            集成中心 (Integration Center)
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
                            统一管理智能体所需的外部能力与连接器。
                            支持标准 Tool 注册、MCP 协议连接、底层算子编排以及对外的 OpenAPI 服务网关。
                            构建从底层数据到上层应用的完整能力供应链。
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700 font-medium hover:bg-slate-50 flex items-center shadow-sm">
                            <Settings className="w-4 h-4 mr-2" /> 全局配置
                        </button>
                        <button className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 shadow-sm flex items-center">
                            <Zap className="w-4 h-4 mr-2" /> 快速接入
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex mt-8 space-x-8 border-b border-slate-100">
                    {[
                        { id: 'TOOLS', label: '工具与技能 (Tools)', icon: Wrench, desc: 'Function Calling Utils' },
                        { id: 'MCP', label: 'MCP 连接器', icon: Server, desc: 'Model Context Protocol' },
                        { id: 'OPERATORS', label: '算子注册表 (Operators)', icon: Boxes, desc: 'Low-level Atomic Ops' },
                        { id: 'API', label: 'API 服务 (Gateway)', icon: CloudLightning, desc: 'External Access' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`group pb-3 flex flex-col relative min-w-[140px] ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            <div className="flex items-center font-bold text-sm mb-1">
                                <tab.icon className={`w-4 h-4 mr-2 transition-colors ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                {tab.label}
                            </div>
                            <div className="text-[10px] opacity-80 pl-6 text-left font-medium">{tab.desc}</div>

                            {/* Active Indicator Line */}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_-1px_6px_rgba(79,70,229,0.3)] animate-in fade-in zoom-in duration-300" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'TOOLS' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    {activeTab === 'TOOLS' && <IntegrationToolsView />}
                </div>
                <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'MCP' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    {activeTab === 'MCP' && <IntegrationMCPView />}
                </div>
                <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'OPERATORS' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    {activeTab === 'OPERATORS' && <IntegrationOperatorsView />}
                </div>
                <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'API' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    {activeTab === 'API' && <IntegrationAPIServiceView />}
                </div>
            </div>
        </div>
    );
};

export default IntegrationCenterView;
