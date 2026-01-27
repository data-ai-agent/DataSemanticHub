import { useState, useEffect, useMemo } from 'react';
import { Plus, Database, Edit, Trash2, Zap, X, CheckCircle, RefreshCw, Server, Building2, Tag, ChevronDown, MoreHorizontal, FileText, List, Activity, Loader2, Eye, Clock, Layers, Table as TableIcon } from 'lucide-react';
import { dataSourceService, type DataSource, type Connector, type DataSourceStatisticsVo } from '../services/dataSourceService';
import { scanService, type TableInfo } from '../services/scanService';

const MOCK_SYSTEMS = ['营销中心(CRM)', '供应链系统(ERP)', '人口基础库', '政务服务平台', '数据仓库'];
const MOCK_OWNERS = ['张三 (Data Owner)', '李四 (System Owner)', '王五 (DevOps)'];

const DataSourceManagementView = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDS, setEditingDS] = useState<DataSource | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

    // 加载数据源列表
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(false);

    // 从后端获取的连接器列表
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [loadingConnectors, setLoadingConnectors] = useState(false);

    // 组件挂载时加载数据源和连接器列表
    useEffect(() => {
        loadDataSources();
        loadConnectors();
    }, []);

    const loadConnectors = async () => {
        console.log('开始加载连接器列表...');
        setLoadingConnectors(true);
        try {
            const result = await dataSourceService.getConnectors();
            console.log('连接器列表加载成功:', result);
            setConnectors(result);
        } catch (error) {
            console.error('Failed to load connectors:', error);
        } finally {
            setLoadingConnectors(false);
        }
    };

    const loadDataSources = async () => {
        console.log('开始加载数据源列表...');
        setLoading(true);
        try {
            const result = await dataSourceService.getDataSources();
            console.log('数据源列表加载成功:', result);
            setDataSources(result);
        } catch (error) {
            console.error('Failed to load data sources:', error);
        } finally {
            setLoading(false);
        }
    };

    // 将连接器列表转换为 typeConfigs 格式
    const typeConfigs: Record<string, { color: string; bgColor: string; defaultPort: number }> = useMemo(() => {
        const configs: Record<string, { color: string; bgColor: string; defaultPort: number }> = {};
        connectors.forEach(conn => {
            configs[conn.name] = {
                color: conn.color,
                bgColor: conn.bgColor,
                defaultPort: conn.defaultPort
            };
        });
        return configs;
    }, [connectors]);

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
        schemaName: ''
    });

    const handleCreate = async () => {
        if (!newDS.name || !newDS.host) return;

        try {
            const result = await dataSourceService.createDataSource({
                name: newDS.name!,
                type: newDS.type!,
                host: newDS.host!,
                port: newDS.port || 3306,
                dbName: newDS.dbName!,
                username: newDS.username,
                password: newDS.password,
                schemaName: newDS.schemaName,
                desc: newDS.desc || '新建数据源',
                // 治理字段 - 不发送后端
                system: newDS.system,
                env: newDS.env,
                owner: newDS.owner
            });
            setDataSources([...dataSources, result]);
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Failed to create data source:', error);
            alert('创建数据源失败：' + (error as Error).message);
        }
    };

    const resetForm = () => {
        console.log('resetForm 调用, 当前连接器列表:', connectors);
        console.log('连接器数量:', connectors.length);
        console.log('typeConfigs:', typeConfigs);

        const firstConnector = connectors[0];
        console.log('第一个连接器:', firstConnector);

        const defaultType = firstConnector?.name || '';
        const defaultPort = firstConnector?.defaultPort || 3306;

        console.log('使用默认值 - 类型:', defaultType, '端口:', defaultPort);

        setNewDS({
            name: '',
            type: defaultType,
            host: '',
            port: defaultPort,
            dbName: '',
            username: '',
            password: '',
            system: '',
            env: 'prod',
            owner: '',
            schemaName: ''
        });
        setEditingDS(null);
    };

    const handleTestConnection = async (dsId: string) => {
        setTestingId(dsId);
        const ds = dataSources.find(d => d.id === dsId);
        if (!ds) {
            setTestingId(null);
            return;
        }

        try {
            // 对于已存在的数据源，使用完整信息进行测试
            // 如果没有密码，某些数据源可能仍能测试连接（如仅测试主机可达性）
            const testRequest: TestConnectionRequest = {
                name: ds.name,
                type: ds.type,
                host: ds.host,
                port: ds.port,
                dbName: ds.dbName,
                username: ds.username,
                password: ds.password || '',  // 如果有密码则使用，否则使用空字符串
                schemaName: ds.schemaName
            };

            const result = await dataSourceService.testConnection(testRequest);

            if (result.success) {
                setDataSources(prev => prev.map(d =>
                    d.id === dsId ? { ...d, status: 'connected' as const } : d
                ));
            } else {
                setDataSources(prev => prev.map(d =>
                    d.id === dsId ? { ...d, status: 'error' as const } : d
                ));
                alert('连接测试失败：' + result.message);
            }
        } catch (error) {
            console.error('Failed to test connection:', error);
            setDataSources(prev => prev.map(d =>
                d.id === dsId ? { ...d, status: 'error' as const } : d
            ));
            alert('连接测试失败：' + (error as Error).message);
        } finally {
            setTestingId(null);
        }
    };

    const handleDelete = async (dsId: string) => {
        if (confirm('确定要删除此数据源吗？')) {
            try {
                await dataSourceService.deleteDataSource(dsId);
                setDataSources(prev => prev.filter(ds => ds.id !== dsId));
            } catch (error) {
                console.error('Failed to delete data source:', error);
                alert('删除数据源失败：' + (error as Error).message);
            }
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

    const handleUpdate = async () => {
        if (!editingDS || !newDS.name || !newDS.host) return;

        try {
            // 如果密码为空，不发送密码字段（避免覆盖原有密码）
            const updateData: any = {
                name: newDS.name!,
                type: newDS.type!,
                host: newDS.host!,
                port: newDS.port || 3306,
                dbName: newDS.dbName!,
                username: newDS.username,
                schemaName: newDS.schemaName,
                desc: newDS.desc,
                // 治理字段 - 不发送后端
                system: newDS.system,
                env: newDS.env,
                owner: newDS.owner,
            };

            // 只有在密码有值时才发送
            if (newDS.password) {
                updateData.password = newDS.password;
            }

            const result = await dataSourceService.updateDataSource(editingDS.id, updateData);
            setDataSources(prev => prev.map(ds =>
                ds.id === editingDS.id ? result : ds
            ));
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Failed to update data source:', error);
            alert('更新数据源失败：' + (error as Error).message);
        }
    };

    const handleTypeChange = (type: string) => {
        console.log('选择数据源类型:', type);
        console.log('当前 typeConfigs:', typeConfigs);
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

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    // Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailDS, setDetailDS] = useState<DataSource | null>(null);
    const [detailStatistics, setDetailStatistics] = useState<DataSourceStatisticsVo | null>(null);
    const [detailStatisticsLoading, setDetailStatisticsLoading] = useState(false);
    const [detailTables, setDetailTables] = useState<TableInfo[]>([]);
    const [detailTablesLoading, setDetailTablesLoading] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'tables'>('overview');

    const handleViewDetail = async (ds: DataSource) => {
        setDetailDS(ds);
        setShowDetailModal(true);
        setDetailStatisticsLoading(true);
        setDetailTablesLoading(true);
        setActiveDetailTab('overview');

        // Load statistics
        try {
            const stats = await dataSourceService.getDataSourceStatistics(ds.id);
            setDetailStatistics(stats);
        } catch (error) {
            console.error('Failed to load data source statistics:', error);
            setDetailStatistics(null);
        } finally {
            setDetailStatisticsLoading(false);
        }

        // Load tables
        try {
            const result = await scanService.getTablesByDataSourceId({
                dataSourceId: ds.id,
                limit: 100,
            });
            setDetailTables(result.tables);
        } catch (error) {
            console.error('Failed to load tables:', error);
            setDetailTables([]);
        } finally {
            setDetailTablesLoading(false);
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
                    onClick={handleOpenModal}
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

            {/* Data Source List */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
                    加载中...
                </div>
            ) : dataSources.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Database size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无数据源</h3>
                    <p className="text-slate-500">点击右上角"新建连接"按钮添加您的第一个数据源</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dataSources.map((ds) => {
                        const typeConfig = typeConfigs[ds.type] || Object.values(typeConfigs)[0];
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
                                        {ds.owner ? (
                                            <span className="text-slate-700 font-medium">{ds.owner.split(' ')[0]}</span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
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
                                                        <button
                                                            onClick={() => handleViewDetail(ds)}
                                                            className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                                                        >
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
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">
                                    {editingDS ? '编辑数据源' : '新建数据源连接'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">配置数据源连接信息</p>
                            </div>
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            {/* Connection Form */}
                            <div className="space-y-4">
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
                                    {loadingConnectors ? (
                                        <div className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-sm text-slate-500 flex items-center gap-2">
                                            <RefreshCw size={16} className="animate-spin" />
                                            加载中...
                                        </div>
                                    ) : (
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
                                    )}
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
                                                placeholder="•••••••"
                                                value={newDS.password}
                                                onChange={e => setNewDS({ ...newDS, password: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
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

            {/* Detail Modal */}
            {showDetailModal && detailDS && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${typeConfigs[detailDS.type]?.bgColor || 'bg-slate-100'} flex items-center justify-center font-bold ${typeConfigs[detailDS.type]?.color || 'text-slate-600'} text-sm`}>
                                    {detailDS.type.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{detailDS.name}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{detailDS.type} · {detailDS.host}:{detailDS.port}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 px-6 pt-4 bg-slate-50 border-b border-slate-100">
                            <button
                                onClick={() => setActiveDetailTab('overview')}
                                className={`px-4 py-2 text-sm font-medium rounded-t transition-all flex items-center gap-2 ${
                                    activeDetailTab === 'overview'
                                        ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600 border-b-0 -mb-px'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Database size={16} />
                                概览信息
                            </button>
                            <button
                                onClick={() => setActiveDetailTab('tables')}
                                className={`px-4 py-2 text-sm font-medium rounded-t transition-all flex items-center gap-2 ${
                                    activeDetailTab === 'tables'
                                        ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600 border-b-0 -mb-px'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <TableIcon size={16} />
                                表清单
                                {detailTables.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                                        {detailTables.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            {/* Overview Tab */}
                            {activeDetailTab === 'overview' && (
                                <div className="p-6 overflow-y-auto custom-scrollbar h-full">
                                    {/* Basic Info */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                            <Server size={16} className="text-blue-500" />
                                            基本信息
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">数据库类型</div>
                                                <div className="text-sm font-medium text-slate-700">{detailDS.type}</div>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">主机地址</div>
                                                <div className="text-sm font-mono text-slate-700">{detailDS.host}:{detailDS.port}</div>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <div className="text-xs text-slate-500 mb-1">数据库名</div>
                                                <div className="text-sm font-medium text-slate-700 truncate" title={detailDS.dbName}>
                                                    {detailDS.dbName}
                                                    {detailDS.schemaName && <span className="text-slate-400 text-xs ml-1">({detailDS.schemaName})</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Governance Info */}
                                    {(detailDS.system || detailDS.env || detailDS.owner) && (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <Building2 size={16} className="text-purple-500" />
                                                治理信息
                                            </h4>
                                            <div className="grid grid-cols-3 gap-4">
                                                {detailDS.system && (
                                                    <div className="bg-slate-50 p-3 rounded-lg">
                                                        <div className="text-xs text-slate-500 mb-1">所属系统</div>
                                                        <div className="text-sm font-medium text-slate-700">{detailDS.system}</div>
                                                    </div>
                                                )}
                                                {detailDS.env && (
                                                    <div className="bg-slate-50 p-3 rounded-lg">
                                                        <div className="text-xs text-slate-500 mb-1">环境类型</div>
                                                        <div className="text-sm font-medium text-slate-700">{getEnvConfig(detailDS.env).label}</div>
                                                    </div>
                                                )}
                                                {detailDS.owner && (
                                                    <div className="bg-slate-50 p-3 rounded-lg">
                                                        <div className="text-xs text-slate-500 mb-1">数据负责人</div>
                                                        <div className="text-sm font-medium text-slate-700">{detailDS.owner}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Statistics */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                            <Activity size={16} className="text-emerald-500" />
                                            统计信息
                                        </h4>
                                        {detailStatisticsLoading ? (
                                            <div className="flex items-center justify-center p-8 bg-slate-50 rounded-lg">
                                                <RefreshCw size={24} className="text-slate-400 animate-spin mr-2" />
                                                <span className="text-sm text-slate-500">加载统计信息中...</span>
                                            </div>
                                        ) : detailStatistics ? (
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs text-blue-600">表总数</span>
                                                        <Server size={16} className="text-blue-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-blue-700">{detailStatistics.table_count || 0}</div>
                                                </div>
                                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs text-purple-600">字段总数</span>
                                                        <Layers size={16} className="text-purple-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-purple-700">{detailStatistics.field_count || 0}</div>
                                                </div>
                                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs text-emerald-600">已扫描表</span>
                                                        <CheckCircle size={16} className="text-emerald-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-emerald-700">{detailStatistics.scanned_table_count || 0}</div>
                                                </div>
                                                {(detailStatistics.scanning_table_count > 0 || detailStatistics.unscanned_table_count > 0) && (
                                                    <>
                                                        {detailStatistics.scanning_table_count > 0 && (
                                                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-xs text-orange-600">扫描中</span>
                                                                    <RefreshCw size={16} className="text-orange-500 animate-spin" />
                                                                </div>
                                                                <div className="text-2xl font-bold text-orange-700">{detailStatistics.scanning_table_count}</div>
                                                            </div>
                                                        )}
                                                        {detailStatistics.unscanned_table_count > 0 && (
                                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-xs text-slate-600">未扫描</span>
                                                                    <Clock size={16} className="text-slate-500" />
                                                                </div>
                                                                <div className="text-2xl font-bold text-slate-700">{detailStatistics.unscanned_table_count}</div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                                                <Activity size={32} className="text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">暂无统计信息</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {detailDS.desc && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <FileText size={16} className="text-slate-500" />
                                                描述信息
                                            </h4>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <p className="text-sm text-slate-600">{detailDS.desc}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tables Tab */}
                            {activeDetailTab === 'tables' && (
                                <div className="p-6 overflow-y-auto custom-scrollbar h-full">
                                    {detailTablesLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <RefreshCw size={32} className="text-slate-400 animate-spin" />
                                        </div>
                                    ) : detailTables.length === 0 ? (
                                        <div className="text-center py-12">
                                            <TableIcon size={48} className="text-slate-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-slate-600 mb-2">暂无表数据</h3>
                                            <p className="text-sm text-slate-400">该数据源下还没有已扫描的表</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-semibold text-slate-700">
                                                    表列表 ({detailTables.length})
                                                </h4>
                                            </div>
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-medium text-slate-600">表名</th>
                                                            <th className="px-4 py-3 text-left font-medium text-slate-600">数据库类型</th>
                                                            <th className="px-4 py-3 text-left font-medium text-slate-600">注释</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailTables.map((table, index) => (
                                                            <tr key={table.id} className={`border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                                                <td className="px-4 py-3 font-medium text-slate-700">{table.tableName}</td>
                                                                <td className="px-4 py-3 text-slate-600">{table.dbType}</td>
                                                                <td className="px-4 py-3 text-slate-500 truncate max-w-xs" title={table.tableComment}>
                                                                    {table.tableComment || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                            <div className="text-xs text-slate-500">
                                {detailDS.lastScan && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        最近扫描: {detailDS.lastScan}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleTestConnection(detailDS.id)}
                                    className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200"
                                >
                                    测试连接
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        handleEdit(detailDS);
                                    }}
                                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                                >
                                    编辑配置
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataSourceManagementView;
