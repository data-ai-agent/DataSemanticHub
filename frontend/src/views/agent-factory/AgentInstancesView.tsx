import React, { useState } from 'react';
import {
    PlayCircle, PauseCircle, MoreHorizontal, Search, Filter,
    Plus, ExternalLink, Activity, Clock, Cpu, ChevronRight, X,
    Terminal, MonitorPlay
} from 'lucide-react';

// --- Types ---

interface AgentInstance {
    id: string;
    name: string;
    templateName: string;
    templateVersion: string;
    status: 'RUNNING' | 'STOPPED' | 'ERROR';
    environment: 'PROD' | 'STAGING' | 'DEV';
    creator: string;
    lastActive: string;
    stats: {
        calls24h: number;
        avgLatency: number;
    };
}

// --- Mock Data ---

const MOCK_INSTANCES: AgentInstance[] = [
    {
        id: 'inst_01', name: '供应链-华北库存监控', templateName: '供应链库存分析', templateVersion: 'v2.0.5',
        status: 'RUNNING', environment: 'PROD', creator: 'Alice', lastActive: '2分钟前',
        stats: { calls24h: 1250, avgLatency: 450 }
    },
    {
        id: 'inst_02', name: '财务-月度报表自动生成', templateName: '月度财务报表生成', templateVersion: 'v1.5.2',
        status: 'STOPPED', environment: 'PROD', creator: 'Bob', lastActive: '2天前',
        stats: { calls24h: 0, avgLatency: 0 }
    },
    {
        id: 'inst_03', name: '研发-Jira 智能助理 (Test)', templateName: '通用助手 (Assistant)', templateVersion: 'v0.1.0',
        status: 'RUNNING', environment: 'DEV', creator: 'Charlie', lastActive: '刚刚',
        stats: { calls24h: 45, avgLatency: 800 }
    },
    {
        id: 'inst_04', name: '销售-客户洞察 (Beta)', templateName: '语义图谱构建器', templateVersion: 'v3.0.0-beta',
        status: 'ERROR', environment: 'STAGING', creator: 'Alice', lastActive: '5小时前',
        stats: { calls24h: 120, avgLatency: 2100 }
    }
];

// --- Components ---

const StatusBadge = ({ status }: { status: AgentInstance['status'] }) => {
    switch (status) {
        case 'RUNNING':
            return <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"><PlayCircle className="w-3 h-3 mr-1" /> 运行中</span>;
        case 'STOPPED':
            return <span className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"><PauseCircle className="w-3 h-3 mr-1" /> 已停止</span>;
        case 'ERROR':
            return <span className="flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100"><Activity className="w-3 h-3 mr-1" /> 异常</span>;
    }
};

interface AgentInstancesViewProps {
    setActiveModule?: (module: string) => void;
}

const AgentInstancesView: React.FC<AgentInstancesViewProps> = ({ setActiveModule }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInstance, setSelectedInstance] = useState<AgentInstance | null>(null);

    const handleOpenWorkbench = (instance: AgentInstance) => {
        // Navigate to workbench
        if (setActiveModule) {
            setActiveModule('agent_workbench');
        }
    };

    const filteredInstances = MOCK_INSTANCES.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">

            {/* Detail Drawer (Simplified) */}
            {selectedInstance && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={() => setSelectedInstance(null)} />
                    <div className="w-[400px] bg-white shadow-2xl relative animate-in slide-in-from-right duration-200 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{selectedInstance.name}</h2>
                                <div className="flex items-center space-x-2 mt-2">
                                    <StatusBadge status={selectedInstance.status} />
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-mono">
                                        {selectedInstance.id}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInstance(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">源模板</label>
                                <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{selectedInstance.templateName}</div>
                                        <div className="text-xs text-slate-500">{selectedInstance.templateVersion}</div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border border-slate-200 rounded-lg text-center">
                                    <div className="text-xs text-slate-500 mb-1">今日调用</div>
                                    <div className="text-xl font-bold text-slate-800">{selectedInstance.stats.calls24h}</div>
                                </div>
                                <div className="p-3 border border-slate-200 rounded-lg text-center">
                                    <div className="text-xs text-slate-500 mb-1">平均延迟</div>
                                    <div className="text-xl font-bold text-slate-800">{selectedInstance.stats.avgLatency}ms</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">配置概览</label>
                                <div className="text-sm space-y-2">
                                    <div className="flex justify-between border-b border-slate-50 py-2">
                                        <span className="text-slate-600">环境</span>
                                        <span className="font-mono text-slate-800">{selectedInstance.environment}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 py-2">
                                        <span className="text-slate-600">创建人</span>
                                        <span className="text-slate-800">{selectedInstance.creator}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 py-2">
                                        <span className="text-slate-600">知识库连接</span>
                                        <span className="text-slate-800">2 个</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex space-x-3">
                            <button
                                onClick={() => handleOpenWorkbench(selectedInstance)}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center justify-center"
                            >
                                <MonitorPlay className="w-4 h-4 mr-2" />
                                进入工作台
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 bg-white">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">运行实例</h1>
                        <p className="text-sm text-slate-500 mt-1">管理与监控所有已部署的智能体实例。</p>
                    </div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        创建新实例
                    </button>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="搜索实例名称..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                            {['全部', '运行中', '异常'].map(tab => (
                                <button key={tab} className="px-3 py-1.5 text-xs font-medium text-slate-600 rounded-md hover:bg-white hover:shadow-sm transition-all">
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table List */}
            <div className="flex-1 overflow-auto p-8">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">实例名称 / ID</th>
                                <th className="px-6 py-4">源模板</th>
                                <th className="px-6 py-4">状态</th>
                                <th className="px-6 py-4">环境</th>
                                <th className="px-6 py-4">最后活跃</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInstances.map(instance => (
                                <tr key={instance.id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{instance.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">{instance.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span className="text-slate-700">{instance.templateName}</span>
                                            <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200">{instance.templateVersion}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={instance.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{instance.environment}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        <div className="flex items-center">
                                            <Clock className="w-3 h-3 mr-1.5" />
                                            {instance.lastActive}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenWorkbench(instance)}
                                                className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded border border-indigo-200 font-medium flex items-center"
                                            >
                                                <Terminal className="w-3 h-3 mr-1.5" /> 工作台
                                            </button>
                                            <button
                                                onClick={() => setSelectedInstance(instance)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredInstances.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <Cpu className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p>暂无匹配的实例</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AgentInstancesView;
