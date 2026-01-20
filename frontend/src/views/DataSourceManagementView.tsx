import { useState } from 'react';
import { Plus, Database, Edit, Trash2, Zap, X, CheckCircle, RefreshCw, Server } from 'lucide-react';

interface DataSource {
    id: string;
    name: string;
    type: string;
    host: string;
    port: number;
    dbName: string;
    status: 'connected' | 'scanning' | 'disconnected' | 'error';
    lastScan: string;
    tableCount: number;
    desc: string;
    username?: string;
}

const DataSourceManagementView = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDS, setEditingDS] = useState<DataSource | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [newDS, setNewDS] = useState({
        name: '',
        type: 'MySQL',
        host: '',
        port: '3306',
        dbName: '',
        username: '',
        password: ''
    });

    // 模拟数据源
    const [dataSources, setDataSources] = useState<DataSource[]>([
        {
            id: 'DS_001',
            name: '卫健委_前置库_01',
            type: 'MySQL',
            host: '192.168.10.55',
            port: 3306,
            dbName: 'hosp_pre_db',
            status: 'connected',
            lastScan: '2024-05-20 14:00',
            tableCount: 142,
            desc: '医院端数据同步前置库'
        },
        {
            id: 'DS_002',
            name: '市人口库_主库',
            type: 'Oracle',
            host: '10.2.5.101',
            port: 1521,
            dbName: 'orcl_pop_master',
            status: 'connected',
            lastScan: '2024-05-19 09:30',
            tableCount: 89,
            desc: '全市全员人口基础信息库'
        },
        {
            id: 'DS_003',
            name: '政务数据中心',
            type: 'PostgreSQL',
            host: '10.2.6.50',
            port: 5432,
            dbName: 'gov_data_center',
            status: 'disconnected',
            lastScan: 'Never',
            tableCount: 0,
            desc: '政务数据共享交换平台'
        }
    ]);

    const typeConfigs: Record<string, { color: string; bgColor: string; defaultPort: string }> = {
        MySQL: { color: 'text-blue-700', bgColor: 'bg-blue-100', defaultPort: '3306' },
        Oracle: { color: 'text-orange-700', bgColor: 'bg-orange-100', defaultPort: '1521' },
        PostgreSQL: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', defaultPort: '5432' },
        'SQL Server': { color: 'text-purple-700', bgColor: 'bg-purple-100', defaultPort: '1433' }
    };

    const handleCreate = () => {
        if (!newDS.name || !newDS.host) return;
        const newDataSource: DataSource = {
            id: `DS_${Date.now()}`,
            name: newDS.name,
            type: newDS.type,
            host: newDS.host,
            port: parseInt(newDS.port) || 3306,
            dbName: newDS.dbName,
            status: 'disconnected',
            lastScan: 'Never',
            tableCount: 0,
            desc: '新建数据源',
            username: newDS.username
        };
        setDataSources([...dataSources, newDataSource]);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setNewDS({ name: '', type: 'MySQL', host: '', port: '3306', dbName: '', username: '', password: '' });
        setEditingDS(null);
    };

    const handleTestConnection = (dsId: string) => {
        setTestingId(dsId);
        setTimeout(() => {
            setDataSources(prev => prev.map(ds =>
                ds.id === dsId ? { ...ds, status: 'connected' as const } : ds
            ));
            setTestingId(null);
        }, 1500);
    };

    const handleDelete = (dsId: string) => {
        if (confirm('确定要删除此数据源吗？')) {
            setDataSources(prev => prev.filter(ds => ds.id !== dsId));
        }
    };

    const handleEdit = (ds: DataSource) => {
        setEditingDS(ds);
        setNewDS({
            name: ds.name,
            type: ds.type,
            host: ds.host,
            port: ds.port.toString(),
            dbName: ds.dbName,
            username: ds.username || '',
            password: ''
        });
        setIsModalOpen(true);
    };

    const handleUpdate = () => {
        if (!editingDS || !newDS.name || !newDS.host) return;
        setDataSources(prev => prev.map(ds =>
            ds.id === editingDS.id
                ? {
                    ...ds,
                    name: newDS.name,
                    type: newDS.type,
                    host: newDS.host,
                    port: parseInt(newDS.port) || 3306,
                    dbName: newDS.dbName,
                    username: newDS.username
                }
                : ds
        ));
        setIsModalOpen(false);
        resetForm();
    };

    const handleTypeChange = (type: string) => {
        setNewDS({
            ...newDS,
            type,
            port: typeConfigs[type]?.defaultPort || '3306'
        });
    };

    const getStatusConfig = (status: DataSource['status']) => {
        switch (status) {
            case 'connected':
                return { color: 'text-emerald-600', bgColor: 'bg-emerald-500', label: '已连接' };
            case 'scanning':
                return { color: 'text-orange-600', bgColor: 'bg-orange-500', label: '扫描中' };
            case 'disconnected':
                return { color: 'text-slate-500', bgColor: 'bg-slate-400', label: '未连接' };
            case 'error':
                return { color: 'text-red-600', bgColor: 'bg-red-500', label: '连接失败' };
            default:
                return { color: 'text-slate-500', bgColor: 'bg-slate-400', label: '未知' };
        }
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Database className="text-blue-500" size={24} />
                        数据源管理
                    </h2>
                    <p className="text-slate-500 mt-1">连接和管理各种数据库系统，为资产扫描提供数据基础</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors"
                >
                    <Plus size={16} />
                    新建连接
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">数据源总数</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{dataSources.length}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <Database size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">已连接</p>
                            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                                {dataSources.filter(ds => ds.status === 'connected').length}
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">总表数量</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                {dataSources.reduce((sum, ds) => sum + ds.tableCount, 0)}
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                            <Server size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">数据库类型</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                {new Set(dataSources.map(ds => ds.type)).size}
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                            <Database size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Source Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataSources.map((ds) => {
                    const typeConfig = typeConfigs[ds.type] || typeConfigs.MySQL;
                    const statusConfig = getStatusConfig(ds.status);
                    const isTesting = testingId === ds.id;

                    return (
                        <div
                            key={ds.id}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 rounded-lg ${typeConfig.bgColor} flex items-center justify-center font-bold ${typeConfig.color} text-sm`}>
                                    {ds.type.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 truncate">{ds.name}</div>
                                    <div className={`text-xs flex items-center gap-1.5 ${statusConfig.color}`}>
                                        <span className={`w-2 h-2 rounded-full ${statusConfig.bgColor} ${ds.status === 'scanning' ? 'animate-pulse' : ''}`}></span>
                                        {statusConfig.label}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-500 mb-4">
                                <div className="flex justify-between">
                                    <span>Host:</span>
                                    <span className="font-mono text-slate-700">{ds.host}:{ds.port}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>数据库:</span>
                                    <span className="font-mono text-slate-700 truncate max-w-[150px]">{ds.dbName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>表数量:</span>
                                    <span className="font-bold text-slate-700">{ds.tableCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>最近扫描:</span>
                                    <span className="text-xs text-slate-600">{ds.lastScan}</span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 mb-4 line-clamp-2">{ds.desc}</p>

                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <button
                                    onClick={() => handleTestConnection(ds.id)}
                                    disabled={isTesting}
                                    className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${isTesting
                                            ? 'text-slate-400 bg-slate-50'
                                            : 'text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    {isTesting ? (
                                        <>
                                            <RefreshCw size={12} className="animate-spin" />
                                            测试中...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={12} />
                                            测试连接
                                        </>
                                    )}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(ds)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ds.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Add New Card */}
                <div
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center min-h-[280px] cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors group"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
                        <Plus size={24} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600">添加新数据源</span>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingDS ? '编辑数据源' : '新建数据源连接'}
                            </h3>
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    连接名称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="例如：生产数据库_主库"
                                    value={newDS.name}
                                    onChange={e => setNewDS({ ...newDS, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">数据库类型</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.keys(typeConfigs).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleTypeChange(type)}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${newDS.type === type
                                                    ? `${typeConfigs[type].bgColor} ${typeConfigs[type].color} border-current`
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        主机地址 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="192.168.1.100"
                                        value={newDS.host}
                                        onChange={e => setNewDS({ ...newDS, host: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">端口</label>
                                    <input
                                        type="text"
                                        placeholder="3306"
                                        value={newDS.port}
                                        onChange={e => setNewDS({ ...newDS, port: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">数据库名</label>
                                <input
                                    type="text"
                                    placeholder="database_name"
                                    value={newDS.dbName}
                                    onChange={e => setNewDS({ ...newDS, dbName: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
                                    <input
                                        type="text"
                                        placeholder="username"
                                        value={newDS.username}
                                        onChange={e => setNewDS({ ...newDS, username: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={newDS.password}
                                        onChange={e => setNewDS({ ...newDS, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={editingDS ? handleUpdate : handleCreate}
                                disabled={!newDS.name || !newDS.host}
                                className={`px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm ${!newDS.name || !newDS.host
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                    }`}
                            >
                                {editingDS ? '更新' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataSourceManagementView;
