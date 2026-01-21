import { useState } from 'react';
import { Plus, Database, Edit, Trash2, Zap, X, CheckCircle, RefreshCw, Server, User, Building2, Tag, ChevronDown, Shield, Scan, Key, Settings, ShieldCheck, MoreHorizontal, FileText, List, Activity } from 'lucide-react';


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
    // New Governance Fields
    system?: string; // Information System Name e.g. "CRM"
    env?: 'prod' | 'test' | 'dev';
    owner?: string; // Owner Name
    schemaName?: string; // Database Schema (e.g. for Oracle/PG)
    // P1: Governance Fields
    scanPolicy?: {
        frequency: 'daily' | 'weekly' | 'manual';
        scopeRegex?: string; // Table whitelist regex
        alertReceivers?: string[]; // User IDs
    };
    auth?: {
        type: 'password' | 'secret';
        secretId?: string;
    };
}

const MOCK_SYSTEMS = ['营销中心(CRM)', '供应链系统(ERP)', '人口基础库', '政务服务平台', '数据仓库'];
const MOCK_OWNERS = ['张三 (Data Owner)', '李四 (System Owner)', '王五 (DevOps)'];

const DataSourceManagementView = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDS, setEditingDS] = useState<DataSource | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'scan'>('basic');
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [newDS, setNewDS] = useState<Partial<DataSource> & { password?: string }>({
        name: '',
        type: 'MySQL',
        host: '',
        port: 3306,
        dbName: '',
        username: '',
        password: '',
        system: '',
        env: 'prod',
        owner: '',
        schemaName: '',
        scanPolicy: { frequency: 'daily', scopeRegex: '.*', alertReceivers: [] },
        auth: { type: 'password', secretId: '' }
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
            desc: '医院端数据同步前置库',
            system: '政务服务平台',
            env: 'prod',
            owner: '张三 (Data Owner)',
            scanPolicy: { frequency: 'daily', scopeRegex: 'host_.*', alertReceivers: ['张三'] },
            auth: { type: 'password' }
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
            desc: '全市全员人口基础信息库',
            system: '人口基础库',
            env: 'prod',
            owner: '李四 (System Owner)',
            schemaName: 'CENSUS_CORE',
            scanPolicy: { frequency: 'weekly', scopeRegex: '.*', alertReceivers: ['李四'] },
            auth: { type: 'secret', secretId: 'SEC_ORCL_001' }
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
            desc: '政务数据共享交换平台',
            system: '数据仓库',
            env: 'test',
            owner: '王五 (DevOps)',
            schemaName: 'public',
            scanPolicy: { frequency: 'manual', scopeRegex: '', alertReceivers: [] },
            auth: { type: 'password' }
        }
    ]);

    const typeConfigs: Record<string, { color: string; bgColor: string; defaultPort: number }> = {
        MySQL: { color: 'text-blue-700', bgColor: 'bg-blue-100', defaultPort: 3306 },
        Oracle: { color: 'text-orange-700', bgColor: 'bg-orange-100', defaultPort: 1521 },
        PostgreSQL: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', defaultPort: 5432 },
        'SQL Server': { color: 'text-purple-700', bgColor: 'bg-purple-100', defaultPort: 1433 },
        Redis: { color: 'text-red-700', bgColor: 'bg-red-100', defaultPort: 6379 },
        MongoDB: { color: 'text-green-700', bgColor: 'bg-green-100', defaultPort: 27017 },
        ClickHouse: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', defaultPort: 8123 },
        StarRocks: { color: 'text-blue-700', bgColor: 'bg-blue-100', defaultPort: 9030 },
        Hive: { color: 'text-amber-700', bgColor: 'bg-amber-100', defaultPort: 10000 },
        Elasticsearch: { color: 'text-pink-700', bgColor: 'bg-pink-100', defaultPort: 9200 },
        Kafka: { color: 'text-slate-700', bgColor: 'bg-slate-100', defaultPort: 9092 }
    };

    const handleCreate = () => {
        if (!newDS.name || !newDS.host) return;
        const newDataSource: DataSource = {
            id: `DS_${Date.now()}`,
            name: newDS.name!,
            type: newDS.type!,
            host: newDS.host!,
            port: newDS.port || 3306,
            dbName: newDS.dbName!,
            status: 'disconnected',
            lastScan: 'Never',
            tableCount: 0,
            desc: '新建数据源',
            username: newDS.username,
            system: newDS.system,
            env: newDS.env as any,
            owner: newDS.owner,
            schemaName: newDS.schemaName,
            scanPolicy: newDS.scanPolicy,
            auth: newDS.auth
        };
        setDataSources([...dataSources, newDataSource]);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setNewDS({
            name: '', type: 'MySQL', host: '', port: 3306, dbName: '', username: '', password: '', system: '', env: 'prod', owner: '', schemaName: '',
            scanPolicy: { frequency: 'daily', scopeRegex: '.*', alertReceivers: [] },
            auth: { type: 'password', secretId: '' }
        });
        setEditingDS(null);
        setActiveTab('basic');
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
            port: ds.port,
            dbName: ds.dbName,
            username: ds.username || '',
            password: '',
            system: ds.system || '',
            env: ds.env || 'prod',
            owner: ds.owner || '',
            schemaName: ds.schemaName || ''
        });
        setIsModalOpen(true);
    };

    const handleUpdate = () => {
        if (!editingDS || !newDS.name || !newDS.host) return;
        setDataSources(prev => prev.map(ds =>
            ds.id === editingDS.id
                ? {
                    ...ds,
                    name: newDS.name!,
                    type: newDS.type!,
                    host: newDS.host!,
                    port: newDS.port || 3306,
                    dbName: newDS.dbName!,
                    username: newDS.username,
                    system: newDS.system,
                    env: newDS.env as any,
                    owner: newDS.owner,
                    schemaName: newDS.schemaName
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
            port: typeConfigs[type]?.defaultPort || 3306
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

    const getEnvConfig = (env?: string) => {
        switch (env) {
            case 'prod': return { label: '生产', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
            case 'test': return { label: '测试', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };
            case 'dev': return { label: '开发', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' };
            default: return { label: '未知', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' };
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
                    const envConfig = getEnvConfig(ds.env || 'prod');

                    return (
                        <div
                            key={ds.id}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                        >
                            {/* Card Top: System & Env Tags */}
                            <div className="flex items-center gap-2 mb-3">
                                {ds.system && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        <Building2 size={10} />
                                        {ds.system}
                                    </span>
                                )}
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${envConfig.bg} ${envConfig.color} border ${envConfig.border}`}>
                                    <Tag size={10} />
                                    {envConfig.label}
                                </span>
                            </div>

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
                                    <span className="font-mono text-slate-700 truncate max-w-[150px]">
                                        {ds.dbName}
                                        {ds.schemaName && <span className="text-slate-400 text-xs ml-1">({ds.schemaName})</span>}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>表数量:</span>
                                    <span className="font-bold text-slate-700">{ds.tableCount}</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs text-slate-500 mb-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Owner</span>
                                    <div className="flex items-center gap-1.5">
                                        {ds.owner ? (
                                            <>
                                                <div className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] text-indigo-600 font-medium border border-indigo-200">
                                                    {ds.owner.charAt(0)}
                                                </div>
                                                <span className="text-slate-700 font-medium">{ds.owner.split(' ')[0]}</span>
                                            </>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">最近扫描</span>
                                    <span className="text-slate-600">{ds.lastScan}</span>
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
                                        title="删除"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    {/* More Actions Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdownId(activeDropdownId === ds.id ? null : ds.id);
                                            }}
                                            onBlur={() => setTimeout(() => setActiveDropdownId(null), 200)}
                                            className={`p-1.5 rounded transition-colors ${activeDropdownId === ds.id ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        {activeDropdownId === ds.id && (
                                            <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-10 overflow-hidden animate-fade-in origin-bottom-right">
                                                <div className="py-1">
                                                    <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
                                                        <List size={14} /> 资产清单
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
                                                        <FileText size={14} /> 扫描日志
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
                                                        <Activity size={14} /> 质量报告
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">
                                    {editingDS ? '编辑数据源' : '新建数据源连接'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">配置连接信息、扫描策略及安全凭据</p>
                            </div>
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs Header */}
                        <div className="px-6 border-b border-slate-100 flex gap-6">
                            {[
                                { id: 'basic', label: '基础连接', icon: Settings },
                                { id: 'scan', label: '扫描策略', icon: Scan }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            {/* Tab 1: Basic Connection */}
                            {activeTab === 'basic' && (
                                <div className="space-y-4">
                                    {/* Business Context Group */}
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4 mb-2">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/60">
                                            <Building2 size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">业务归属 (Governance)</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    关联系统 <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={newDS.system}
                                                        onChange={e => setNewDS({ ...newDS, system: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none"
                                                    >
                                                        <option value="">选择信息系统...</option>
                                                        {MOCK_SYSTEMS.map(sys => <option key={sys} value={sys}>{sys}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">负责人</label>
                                                <div className="relative">
                                                    <select
                                                        value={newDS.owner}
                                                        onChange={e => setNewDS({ ...newDS, owner: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none"
                                                    >
                                                        <option value="">选择负责人...</option>
                                                        {MOCK_OWNERS.map(owner => <option key={owner} value={owner}>{owner}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">环境</label>
                                                <div className="flex bg-slate-100 p-1 rounded-md">
                                                    {['prod', 'test', 'dev'].map(env => (
                                                        <button
                                                            key={env}
                                                            onClick={() => setNewDS({ ...newDS, env: env as any })}
                                                            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${newDS.env === env
                                                                ? 'bg-white text-blue-600 shadow-sm'
                                                                : 'text-slate-500 hover:text-slate-700'
                                                                }`}
                                                        >
                                                            {env === 'prod' ? '生产环境 (PROD)' : env === 'test' ? '测试环境 (TEST)' : '开发环境 (DEV)'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection Details */}
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

                                    <div className="relative group">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">数据库类型</label>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    const dropdown = document.getElementById('db-type-dropdown');
                                                    if (dropdown) dropdown.classList.toggle('hidden');
                                                    e.stopPropagation();
                                                }}
                                                onBlur={() => {
                                                    setTimeout(() => {
                                                        const dropdown = document.getElementById('db-type-dropdown');
                                                        if (dropdown) dropdown.classList.add('hidden');
                                                    }, 200);
                                                }}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {newDS.type && typeConfigs[newDS.type] && (
                                                        <div className={`w-5 h-5 rounded ${typeConfigs[newDS.type].bgColor} flex items-center justify-center font-bold ${typeConfigs[newDS.type].color} text-[10px]`}>
                                                            {newDS.type.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-slate-700">{newDS.type}</span>
                                                </div>
                                                <ChevronDown size={16} className="text-slate-400" />
                                            </button>

                                            <div id="db-type-dropdown" className="hidden absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                {Object.keys(typeConfigs).map(type => (
                                                    <div
                                                        key={type}
                                                        onMouseDown={() => handleTypeChange(type)}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-slate-50 ${newDS.type === type ? 'bg-blue-50' : ''}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded ${typeConfigs[type].bgColor} flex items-center justify-center font-bold ${typeConfigs[type].color} text-[10px]`}>
                                                            {type.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className={`text-sm ${newDS.type === type ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
                                                            {type}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
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
                                                type="number"
                                                placeholder="3306"
                                                value={newDS.port}
                                                onChange={e => setNewDS({ ...newDS, port: parseInt(e.target.value) || 0 })}
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

                                    {['PostgreSQL', 'Oracle', 'SQL Server'].includes(newDS.type || '') && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Schema模式 <span className="text-slate-400 font-normal">(选填)</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="public / dbo / USERNAME"
                                                value={newDS.schemaName}
                                                onChange={e => setNewDS({ ...newDS, schemaName: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
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
                                            <div className="relative">
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
                                </div>
                            )}

                            {/* Tab 2: Scan Policy */}
                            {activeTab === 'scan' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 border border-blue-100">
                                        <RefreshCw className="text-blue-600 mt-0.5" size={18} />
                                        <div>
                                            <h4 className="text-sm font-bold text-blue-800">关于扫描策略</h4>
                                            <p className="text-xs text-blue-600 mt-1">
                                                定期扫描元数据可以保持资产目录的即时性。建议配置表白名单以减少不必要的系统负载。
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">扫描频率</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'daily', label: '每天 (Daily)' },
                                                { id: 'weekly', label: '每周 (Weekly)' },
                                                { id: 'manual', label: '手动触发 (Manual)' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setNewDS({ ...newDS, scanPolicy: { ...newDS.scanPolicy!, frequency: opt.id as any } })}
                                                    className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all ${newDS.scanPolicy?.frequency === opt.id
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            扫描范围 (白名单正则)
                                        </label>
                                        <span className="text-xs text-slate-500 block mb-2">
                                            输入正则表达式以匹配 Schema 或 表名。例如: <code>^hr_.*</code> 或 <code>.*_prod$</code>
                                        </span>
                                        <input
                                            type="text"
                                            placeholder=".*"
                                            value={newDS.scanPolicy?.scopeRegex}
                                            onChange={e => setNewDS({ ...newDS, scanPolicy: { ...newDS.scanPolicy!, scopeRegex: e.target.value } })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            失败告警接收人
                                        </label>
                                        <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-slate-50">
                                            {MOCK_OWNERS.map(owner => (
                                                <label key={owner} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={newDS.scanPolicy?.alertReceivers?.includes(owner)}
                                                        onChange={e => {
                                                            const current = newDS.scanPolicy?.alertReceivers || [];
                                                            const updated = e.target.checked
                                                                ? [...current, owner]
                                                                : current.filter(o => o !== owner);
                                                            setNewDS({ ...newDS, scanPolicy: { ...newDS.scanPolicy!, alertReceivers: updated } });
                                                        }}
                                                        className="rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-slate-700">{owner}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Security - REMOVED as per user request */}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
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
