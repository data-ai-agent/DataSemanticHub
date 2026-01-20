import { useState } from 'react';
import { Database, Search, CheckCircle, Plus, RefreshCw, Cpu } from 'lucide-react';

interface TechDiscoveryViewProps {
    onAddBusinessObject: (bo: any) => void;
    scanResults: any[];
    setScanResults: (fn: (prev: any[]) => any[]) => void;
}

const TechDiscoveryView = ({ onAddBusinessObject, scanResults, setScanResults }: TechDiscoveryViewProps) => {
    // State
    const [dataSources, setDataSources] = useState<any[]>([
        { id: 'DS_001', name: 'CRM Core DB', type: 'MySQL', host: '192.168.1.10', port: '3306', status: 'connected', lastScan: '2024-05-19' },
        { id: 'DS_002', name: 'Legacy Billing', type: 'Oracle', host: '192.168.1.15', port: '1521', status: 'disconnected', lastScan: '-' }
    ]);

    // Candidate Generation State
    const [candidateModalOpen, setCandidateModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [candidateFormData, setCandidateFormData] = useState<any>({ name: '', code: '', description: '', fields: [] });

    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<'sources' | 'results'>('sources');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [newSource, setNewSource] = useState({ name: '', type: 'MySQL', host: '', port: '', user: '', password: '' });

    // Discovery Enhanced State
    const [resultSearch, setResultSearch] = useState('');
    const [resultRiskFilter, setResultRiskFilter] = useState('All');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedDetailAsset, setSelectedDetailAsset] = useState<any>(null);

    // Mock Scan Results
    const mockDiscoveredAssets = [
        {
            table: 't_user_profile',
            comment: 'User basic info',
            rowCount: 15420,
            risk: 'Low',
            confidence: 95,
            status: 'scanned',
            aiSuggestion: 'Business Object candidate: Customer Profile',
            fields: [
                { name: 'user_id', type: 'bigint', suggestion: 'id', distinct: 15420, nullRate: '0%' },
                { name: 'full_name', type: 'varchar(100)', suggestion: 'name', distinct: 15200, nullRate: '0.1%' },
                { name: 'mobile', type: 'varchar(20)', suggestion: 'phone', distinct: 14800, nullRate: '0%' },
                { name: 'status', type: 'tinyint', suggestion: 'status', distinct: 3, nullRate: '0%' },
                { name: 'created_at', type: 'datetime', suggestion: '-', distinct: 15000, nullRate: '0%' }
            ]
        },
        {
            table: 't_order_main',
            comment: 'Order master table',
            rowCount: 45000,
            risk: 'Medium',
            confidence: 88,
            status: 'scanned',
            aiSuggestion: 'Business Object candidate: Order',
            fields: [
                { name: 'order_no', type: 'varchar(32)', suggestion: 'code', distinct: 45000, nullRate: '0%' },
                { name: 'total_amt', type: 'decimal(18,2)', suggestion: 'amount', distinct: 4200, nullRate: '0%' },
                { name: 'user_id', type: 'bigint', suggestion: 'customer_id', distinct: 8500, nullRate: '0%' },
                { name: 'order_status', type: 'int', suggestion: 'status', distinct: 5, nullRate: '0%' }
            ]
        },
        {
            table: 't_order_item',
            comment: '',
            rowCount: 120000,
            risk: 'Low',
            confidence: 75,
            status: 'scanned',
            aiSuggestion: 'Business Object candidate: Order Item',
            fields: [
                { name: 'id', type: 'bigint', suggestion: 'id', distinct: 120000, nullRate: '0%' },
                { name: 'order_no', type: 'varchar(32)', suggestion: 'order_code', distinct: 45000, nullRate: '0%' }
            ]
        },
    ];

    // Handlers
    const handleMapToBO = (asset: any) => {
        setSelectedAsset(asset);
        setCandidateFormData({
            name: asset.aiSuggestion.split(': ')[1] || asset.table,
            code: `BO_${asset.table.toUpperCase().replace('T_', '')}`,
            description: `Generated from table ${asset.table}. ${asset.comment}`,
            fields: asset.fields ? asset.fields.map((f: any) => ({
                name: f.suggestion || f.name,
                type: 'String',
                required: false,
                description: `Mapped from ${f.name}`
            })) : []
        });
        setCandidateModalOpen(true);
    };

    const handleConfirmCandidate = () => {
        if (!onAddBusinessObject) return;

        const newBO = {
            id: `BO_${Date.now()}`,
            name: candidateFormData.name,
            code: candidateFormData.code,
            domain: 'Generated',
            owner: 'System',
            status: 'draft',
            description: candidateFormData.description,
            fields: candidateFormData.fields
        };

        onAddBusinessObject(newBO);
        setCandidateModalOpen(false);
        setScanResults((prev: any[]) => prev.map((item: any) => item.table === selectedAsset.table ? { ...item, status: 'mapped' } : item));
    };

    const handleViewDetail = (asset: any) => {
        setSelectedDetailAsset(asset);
        setIsDrawerOpen(true);
    };

    // Filter Logic
    const filteredResults = scanResults.filter(item => {
        const matchesSearch = item.table.toLowerCase().includes(resultSearch.toLowerCase()) ||
            (item.comment && item.comment.toLowerCase().includes(resultSearch.toLowerCase()));
        const matchesRisk = resultRiskFilter === 'All' || item.risk === resultRiskFilter;
        return matchesSearch && matchesRisk;
    });

    const handleAddSource = () => {
        if (!newSource.name) return;
        const source = {
            id: `DS_${Date.now()}`,
            name: newSource.name,
            type: newSource.type,
            host: newSource.host || 'localhost',
            port: newSource.port || '3306',
            status: 'connected',
            lastScan: 'Just now'
        };
        setDataSources([...dataSources, source]);
        setIsAddModalOpen(false);
    };

    const startScan = (id: string) => {
        setIsScanning(true);
        setActiveTab('results');
        setScanProgress(0);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setIsScanning(false);
                setScanResults(() => mockDiscoveredAssets);
                setDataSources(prev => prev.map((d: any) => d.id === id ? { ...d, lastScan: 'Just now' } : d));
            }
        }, 300);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">数据连接中心</h2>
                    <p className="text-slate-500 mt-1">管理数据源连接，自动化扫描元数据与资产发现</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('sources')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'sources' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        数据源管理
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'results' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        发现结果
                    </button>
                </div>
            </div>

            {activeTab === 'sources' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    <div
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all min-h-[200px]"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-blue-500">
                            <Plus size={24} />
                        </div>
                        <span className="font-semibold text-slate-600">添加数据源</span>
                    </div>

                    {dataSources.map((ds: any) => (
                        <div key={ds.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{ds.name}</h3>
                                        <p className="text-xs text-slate-500">{ds.type} • {ds.host}:{ds.port}</p>
                                    </div>
                                </div>
                                <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${ds.status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${ds.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {ds.status === 'connected' ? 'Connected' : 'Error'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">上次扫描</span>
                                    <span className="text-slate-700 font-mono">{ds.lastScan}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex gap-2">
                                    <button className="flex-1 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded hover:bg-slate-50">配置</button>
                                    <button onClick={() => startScan(ds.id)} className="flex-1 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center justify-center gap-1">
                                        <RefreshCw size={12} /> 扫描
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'results' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-fade-in-up">
                    {isScanning ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">正在扫描元数据...</h3>
                            <p className="text-slate-500 mb-6">正在分析表结构并生成业务含义建议</p>
                            <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{scanProgress}% completed</p>
                        </div>
                    ) : scanResults.length > 0 ? (
                        <div>
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-slate-800">扫描结果</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                placeholder="搜索表名或描述..."
                                                value={resultSearch}
                                                onChange={(e) => setResultSearch(e.target.value)}
                                                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                                            />
                                        </div>
                                        <select
                                            value={resultRiskFilter}
                                            onChange={(e) => setResultRiskFilter(e.target.value)}
                                            className="px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600"
                                        >
                                            <option value="All">所有风险等级</option>
                                            <option value="High">High Risk</option>
                                            <option value="Medium">Medium Risk</option>
                                            <option value="Low">Low Risk</option>
                                        </select>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500">{filteredResults.length} assets found</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Asset Name</th>
                                            <th className="px-6 py-3 text-left">Row Count</th>
                                            <th className="px-6 py-3 text-left">Risk Level</th>
                                            <th className="px-6 py-3 text-left w-48">AI Confidence</th>
                                            <th className="px-6 py-3 text-left">AI Suggestion</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredResults.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={() => handleViewDetail(item)}>
                                                <td className="px-6 py-3">
                                                    <div className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{item.table}</div>
                                                    <div className="text-xs text-slate-400">{item.comment || 'No comment'}</div>
                                                </td>
                                                <td className="px-6 py-3 font-mono text-slate-600">{item.rowCount ? item.rowCount.toLocaleString() : '-'}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.risk === 'High' ? 'bg-red-100 text-red-700' : item.risk === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                        {item.risk}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${item.confidence > 90 ? 'bg-emerald-500' : item.confidence > 70 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${item.confidence || 0}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-mono text-slate-500">{item.confidence}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                                                        <Cpu size={14} />
                                                        <span className="text-xs font-medium truncate max-w-[150px]" title={item.aiSuggestion}>{item.aiSuggestion ? item.aiSuggestion.split(': ')[1] : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {item.status === 'mapped' ? (
                                                        <span className="text-xs font-medium text-emerald-600 flex items-center justify-end gap-1">
                                                            <CheckCircle size={14} /> Mapped
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleMapToBO(item); }}
                                                            className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                                                        >
                                                            Map
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <Database size={48} className="mx-auto mb-4 opacity-20" />
                            <p>暂无扫描结果，请从数据源管理中启动扫描。</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Source Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-zoom-in p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-6">连接新数据源</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">数据库名称</label>
                                <input type="text" value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. Finance DB" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">类型</label>
                                    <select value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white">
                                        <option>MySQL</option>
                                        <option>PostgreSQL</option>
                                        <option>Oracle</option>
                                        <option>SQL Server</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">端口</label>
                                    <input type="text" value={newSource.port} onChange={e => setNewSource({ ...newSource, port: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="3306" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">主机地址</label>
                                <input type="text" value={newSource.host} onChange={e => setNewSource({ ...newSource, host: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="localhost" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">用户名</label>
                                    <input type="text" value={newSource.user} onChange={e => setNewSource({ ...newSource, user: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">密码</label>
                                    <input type="password" value={newSource.password} onChange={e => setNewSource({ ...newSource, password: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">取消</button>
                            <button onClick={handleAddSource} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">连接</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechDiscoveryView;
