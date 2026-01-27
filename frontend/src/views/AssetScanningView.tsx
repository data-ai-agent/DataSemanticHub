import { useState, useEffect } from 'react';
import {
    Plus, Play, Pause, RefreshCw, Clock, Database, Calendar,
    CheckCircle, XCircle, AlertCircle, Activity, List,
    Settings, ChevronDown, MoreHorizontal, X,
    Eye, Trash2, Zap, Layers, User
} from 'lucide-react';
import {
    scanService,
    type ScanTask,
    type ScheduledScan,
    type ScheduledScanExecutionHistory,
    type TableScan,
    ScanTaskType,
    ScanStrategy,
} from '../services/scanService';
import { dataSourceService, type DataSource } from '../services/dataSourceService';

const AssetScanningView = ({ onNavigate }: { onNavigate?: (moduleId: string) => void } = {}) => {
    // Tab 切换
    const [activeTab, setActiveTab] = useState<'instant' | 'scheduled' | 'history'>('instant');

    // 即时扫描任务
    const [instantTasks, setInstantTasks] = useState<ScanTask[]>([]);
    const [instantLoading, setInstantLoading] = useState(false);

    // 定时扫描任务
    const [scheduledTasks, setScheduledTasks] = useState<ScheduledScan[]>([]);
    const [scheduledLoading, setScheduledLoading] = useState(false);

    // 数据源列表
    const [dataSources, setDataSources] = useState<DataSource[]>([]);

    // 弹窗状态
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showScheduledDetailModal, setShowScheduledDetailModal] = useState(false);
    const [showExecutionHistoryModal, setShowExecutionHistoryModal] = useState(false);

    // 当前选中的任务
    const [selectedTask, setSelectedTask] = useState<ScanTask | null>(null);
    const [selectedScheduledTask, setSelectedScheduledTask] = useState<ScheduledScan | null>(null);

    // 表扫描信息
    const [tableScans, setTableScans] = useState<TableScan[]>([]);
    const [tableScansLoading, setTableScansLoading] = useState(false);

    // 执行历史
    const [executionHistory, setExecutionHistory] = useState<ScheduledScanExecutionHistory[]>([]);

    // 新建任务表单
    const [newTask, setNewTask] = useState({
        scanName: '',
        type: ScanTaskType.DataSourceInstant,
        dataSourceId: '',
        dataSourceType: 'MySQL',
        scanStrategy: ScanStrategy.Full,
        cronExpression: '0 0 2 * * ?',
        status: 'open' as 'open' | 'close',
    });

    // 加载数据源
    useEffect(() => {
        loadDataSources();
    }, []);

    // 加载即时扫描任务
    useEffect(() => {
        if (activeTab === 'instant') {
            loadInstantTasks();
        }
    }, [activeTab]);

    // 加载定时扫描任务
    useEffect(() => {
        if (activeTab === 'scheduled') {
            loadScheduledTasks();
        }
    }, [activeTab]);

    const loadDataSources = async () => {
        try {
            const result = await dataSourceService.getDataSources();
            setDataSources(result);
        } catch (error) {
            console.error('Failed to load data sources:', error);
        }
    };

    const loadInstantTasks = async () => {
        setInstantLoading(true);
        try {
            const tasks = await scanService.getScanTasks();
            // 过滤出即时扫描任务（没有 schedule_id 的）
            const instant = tasks.filter(t => !t.isScheduled);
            setInstantTasks(instant);
        } catch (error) {
            console.error('Failed to load instant scan tasks:', error);
        } finally {
            setInstantLoading(false);
        }
    };

    const loadScheduledTasks = async () => {
        setScheduledLoading(true);
        try {
            const tasks = await scanService.getScanTasks();
            // 过滤出定时扫描任务（有 schedule_id 的）
            const scheduled = tasks.filter(t => t.isScheduled);
            setScheduledTasks(scheduled);
        } catch (error) {
            console.error('Failed to load scheduled scan tasks:', error);
        } finally {
            setScheduledLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.scanName || !newTask.dataSourceId) {
            alert('请填写必填项');
            return;
        }

        try {
            const ds = dataSources.find(d => d.id === newTask.dataSourceId);
            if (!ds) return;

            await scanService.createScanTask({
                scanName: newTask.scanName,
                type: newTask.type,
                dataSourceId: newTask.dataSourceId,
                dataSourceType: newTask.dataSourceType,
                scanStrategy: newTask.scanStrategy ? [newTask.scanStrategy] : undefined,
                cronExpression: newTask.type === ScanTaskType.DataSourceScheduled ? newTask.cronExpression : undefined,
                status: newTask.status,
            });

            setShowCreateModal(false);
            resetNewTask();

            if (activeTab === 'instant') {
                loadInstantTasks();
            } else {
                loadScheduledTasks();
            }
        } catch (error) {
            console.error('Failed to create scan task:', error);
            alert('创建扫描任务失败：' + (error as Error).message);
        }
    };

    const resetNewTask = () => {
        setNewTask({
            scanName: '',
            type: ScanTaskType.DataSourceInstant,
            dataSourceId: '',
            dataSourceType: 'MySQL',
            scanStrategy: ScanStrategy.Full,
            cronExpression: '0 0 2 * * ?',
            status: 'open',
        });
    };

    const handleViewDetail = async (task: ScanTask) => {
        setSelectedTask(task);
        setShowDetailModal(true);
        setTableScansLoading(true);

        try {
            const result = await scanService.getTableScanInfo({ taskId: task.id });
            setTableScans(result.tables);
        } catch (error) {
            console.error('Failed to load table scan info:', error);
        } finally {
            setTableScansLoading(false);
        }
    };

    const handleViewScheduledDetail = (task: ScanTask) => {
        const scheduledTask: ScheduledScan = {
            scheduleId: task.scheduleId!,
            name: task.name,
            dataSourceType: task.dataSourceType,
            scanStrategy: 'full',
            cronExpression: '0 0 2 * * ?',
            status: task.taskStatus === 'enable' ? 'open' : 'close',
            createTime: task.startTime,
            nextRunTime: undefined,
        };
        setSelectedScheduledTask(scheduledTask);
        setShowScheduledDetailModal(true);
    };

    const handleViewExecutionHistory = async (task: ScanTask) => {
        setSelectedTask(task);
        setShowExecutionHistoryModal(true);

        if (!task.scheduleId) return;

        try {
            const result = await scanService.getScheduledScanExecutions(task.scheduleId);
            setExecutionHistory(result.executions);
        } catch (error) {
            console.error('Failed to load execution history:', error);
        }
    };

    // 辅助函数
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'success':
                return { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', label: '成功' };
            case 'running':
                return { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', label: '扫描中' };
            case 'fail':
                return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', label: '失败' };
            case 'wait':
                return { icon: Clock, color: 'text-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', label: '等待中' };
            default:
                return { icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', label: '未知' };
        }
    };

    const getTaskTypeLabel = (type: string) => {
        switch (type) {
            case 'source_instant': return '数据源即时扫描';
            case 'table_instant': return '表即时扫描';
            case 'source_scheduled': return '数据源定时扫描';
            default: return type;
        }
    };

    const getDataSourceIcon = (type: string) => {
        return <Database size={16} className="text-blue-600" />;
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="text-emerald-500" size={24} />
                        资产扫描
                    </h2>
                    <p className="text-slate-500 mt-1">管理数据源元数据扫描任务，定时获取最新资产信息</p>
                </div>
                <button
                    onClick={() => { resetNewTask(); setShowCreateModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-colors"
                >
                    <Plus size={16} />
                    新建扫描任务
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">总任务数</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{instantTasks.length + scheduledTasks.length}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <Activity size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">运行中</p>
                            <h3 className="text-2xl font-bold text-blue-600 mt-1">
                                {[...instantTasks, ...scheduledTasks].filter(t => t.status === 'running').length}
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <RefreshCw size={20} className="animate-spin" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">成功完成</p>
                            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                                {[...instantTasks, ...scheduledTasks].filter(t => t.status === 'success').length}
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
                            <p className="text-xs text-slate-500 uppercase font-medium">定时任务</p>
                            <h3 className="text-2xl font-bold text-purple-600 mt-1">{scheduledTasks.length}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                            <Clock size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                    onClick={() => setActiveTab('instant')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'instant'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                >
                    <Zap size={16} />
                    即时扫描
                </button>
                <button
                    onClick={() => setActiveTab('scheduled')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'scheduled'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                >
                    <Calendar size={16} />
                    定时扫描
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                {activeTab === 'instant' && (
                    <div className="p-6">
                        {instantLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw size={24} className="text-slate-400 animate-spin" />
                            </div>
                        ) : instantTasks.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-600 mb-2">暂无即时扫描任务</h3>
                                <p className="text-sm text-slate-400 mb-4">点击"新建扫描任务"开始创建</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {instantTasks.map(task => {
                                    const statusConfig = getStatusConfig(task.status);
                                    return (
                                        <div
                                            key={task.id}
                                            className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 rounded-lg bg-slate-100">
                                                    {getDataSourceIcon(task.dataSourceType)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold text-slate-800">{task.name}</h4>
                                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}>
                                                            <statusConfig.icon size={12} />
                                                            {statusConfig.label}
                                                        </span>
                                                        <span className="text-xs text-slate-400">{getTaskTypeLabel(task.type)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Database size={14} />
                                                            {task.dataSourceType}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User size={14} />
                                                            {task.createUser}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {task.startTime}
                                                        </span>
                                                        {task.processInfo && (
                                                            <span className="flex items-center gap-1">
                                                                <Layers size={14} />
                                                                {task.processInfo.tableCount} 表
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.resultInfo && task.status === 'fail' && (
                                                        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600">
                                                            失败信息: {task.resultInfo.errorStack}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewDetail(task)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="查看详情"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="重新扫描">
                                                        <RefreshCw size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'scheduled' && (
                    <div className="p-6">
                        {scheduledLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw size={24} className="text-slate-400 animate-spin" />
                            </div>
                        ) : scheduledTasks.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-600 mb-2">暂无定时扫描任务</h3>
                                <p className="text-sm text-slate-400 mb-4">点击"新建扫描任务"开始创建</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {scheduledTasks.map(task => {
                                    const statusConfig = getStatusConfig(task.status);
                                    const taskStatusEnabled = task.taskStatus === 'enable';
                                    return (
                                        <div
                                            key={task.id}
                                            className="p-4 border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/30 transition-all"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 rounded-lg bg-purple-100">
                                                    <Calendar size={20} className="text-purple-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold text-slate-800">{task.name}</h4>
                                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}>
                                                            <statusConfig.icon size={12} />
                                                            {statusConfig.label}
                                                        </span>
                                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${taskStatusEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                            {taskStatusEnabled ? <Play size={12} /> : <Pause size={12} />}
                                                            {taskStatusEnabled ? '已启用' : '已暂停'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-6 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Database size={14} />
                                                            {task.dataSourceType}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {task.startTime}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewScheduledDetail(task)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="查看配置"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewExecutionHistory(task)}
                                                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                        title="执行历史"
                                                    >
                                                        <List size={16} />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="立即执行">
                                                        <Zap size={16} />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="删除">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Scan Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">新建扫描任务</h3>
                                <p className="text-xs text-slate-500 mt-1">配置扫描类型、数据源及扫描策略</p>
                            </div>
                            <button
                                onClick={() => { setShowCreateModal(false); resetNewTask(); }}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    扫描任务名称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="例如：生产库每日扫描"
                                    value={newTask.scanName}
                                    onChange={e => setNewTask({ ...newTask, scanName: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    扫描类型 <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: ScanTaskType.DataSourceInstant, label: '数据源即时扫描', desc: '扫描整个数据源的所有表' },
                                        { id: ScanTaskType.TableInstant, label: '表即时扫描', desc: '扫描选定的表' },
                                        { id: ScanTaskType.DataSourceScheduled, label: '数据源定时扫描', desc: '按计划定时扫描数据源' },
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setNewTask({ ...newTask, type: type.id })}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${newTask.type === type.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="font-medium text-sm text-slate-700 mb-1">{type.label}</div>
                                            <div className="text-xs text-slate-500">{type.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    数据源 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newTask.dataSourceId}
                                    onChange={e => {
                                        const ds = dataSources.find(d => d.id === e.target.value);
                                        setNewTask({
                                            ...newTask,
                                            dataSourceId: e.target.value,
                                            dataSourceType: ds?.type || 'MySQL',
                                        });
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                                >
                                    <option value="">选择数据源...</option>
                                    {dataSources.map(ds => (
                                        <option key={ds.id} value={ds.id}>{ds.name} ({ds.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">扫描策略</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: ScanStrategy.Full, label: '全量扫描', desc: '扫描所有表和字段' },
                                        { id: ScanStrategy.Incremental, label: '增量扫描', desc: '仅扫描变更部分' },
                                    ].map(strategy => (
                                        <button
                                            key={strategy.id}
                                            onClick={() => setNewTask({ ...newTask, scanStrategy: strategy.id })}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${newTask.scanStrategy === strategy.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="font-medium text-sm text-slate-700 mb-1">{strategy.label}</div>
                                            <div className="text-xs text-slate-500">{strategy.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newTask.type === ScanTaskType.DataSourceScheduled && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Cron 表达式 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="0 0 2 * * ?"
                                            value={newTask.cronExpression}
                                            onChange={e => setNewTask({ ...newTask, cronExpression: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm pr-20"
                                        />
                                        <button className="absolute right-2 top-1.5 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600">
                                            生成
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">例如：每天凌晨2点执行</p>
                                </div>
                            )}

                            {newTask.type === ScanTaskType.DataSourceScheduled && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">任务状态</label>
                                    <div className="flex bg-slate-100 p-1 rounded-md">
                                        {[
                                            { id: 'open' as const, label: '启用' },
                                            { id: 'close' as const, label: '暂停' },
                                        ].map(status => (
                                            <button
                                                key={status.id}
                                                onClick={() => setNewTask({ ...newTask, status: status.id })}
                                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${newTask.status === status.id
                                                    ? 'bg-white text-emerald-600 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => { setShowCreateModal(false); resetNewTask(); }}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreateTask}
                                disabled={!newTask.scanName || !newTask.dataSourceId}
                                className={`px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm ${!newTask.scanName || !newTask.dataSourceId
                                    ? 'bg-emerald-400 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                    }`}
                            >
                                创建任务
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {showDetailModal && selectedTask && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">扫描任务详情</h3>
                                <p className="text-xs text-slate-500 mt-1">{selectedTask.name}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">数据源类型</div>
                                    <div className="text-sm font-medium text-slate-700">{selectedTask.dataSourceType}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">创建用户</div>
                                    <div className="text-sm font-medium text-slate-700">{selectedTask.createUser}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">开始时间</div>
                                    <div className="text-sm font-medium text-slate-700">{selectedTask.startTime}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">任务状态</div>
                                    <div className="text-sm font-medium text-slate-700">{getTaskTypeLabel(selectedTask.type)}</div>
                                </div>
                            </div>

                            {selectedTask.processInfo && (
                                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">扫描进度</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-xs text-blue-600">表总数</div>
                                            <div className="text-lg font-bold text-blue-800">{selectedTask.processInfo.tableCount}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-blue-600">成功</div>
                                            <div className="text-lg font-bold text-emerald-600">{selectedTask.processInfo.successCount}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-blue-600">失败</div>
                                            <div className="text-lg font-bold text-red-600">{selectedTask.processInfo.failCount}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <h4 className="font-semibold text-slate-800 mb-3">表扫描详情</h4>
                            {tableScansLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw size={24} className="text-slate-400 animate-spin" />
                                </div>
                            ) : tableScans.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">暂无表扫描信息</div>
                            ) : (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">表名</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">数据库类型</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">状态</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">行数</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">扫描时间</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableScans.map(table => {
                                                const statusConfig = getStatusConfig(table.status);
                                                return (
                                                    <tr key={table.tableId} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="px-4 py-2 font-medium text-slate-700">{table.tableName}</td>
                                                        <td className="px-4 py-2 text-slate-600">{table.dbType}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`flex items-center gap-1 ${statusConfig.color}`}>
                                                                <statusConfig.icon size={14} />
                                                                {statusConfig.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-slate-600">{table.rowCount || '-'}</td>
                                                        <td className="px-4 py-2 text-slate-600">{table.scanTime || '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scheduled Task Detail Modal */}
            {showScheduledDetailModal && selectedScheduledTask && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">定时任务配置</h3>
                                <p className="text-xs text-slate-500 mt-1">{selectedScheduledTask.name}</p>
                            </div>
                            <button
                                onClick={() => setShowScheduledDetailModal(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">任务名称</label>
                                <input
                                    type="text"
                                    value={selectedScheduledTask.name}
                                    disabled
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cron 表达式</label>
                                <input
                                    type="text"
                                    value={selectedScheduledTask.cronExpression}
                                    disabled
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">扫描策略</label>
                                <select
                                    value={selectedScheduledTask.scanStrategy}
                                    disabled
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 text-sm"
                                >
                                    <option value="full">全量扫描</option>
                                    <option value="incremental">增量扫描</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">任务状态</label>
                                <div className="flex bg-slate-100 p-1 rounded-md">
                                    {[
                                        { id: 'open' as const, label: '启用' },
                                        { id: 'close' as const, label: '暂停' },
                                    ].map(status => (
                                        <button
                                            key={status.id}
                                            disabled
                                            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${selectedScheduledTask.status === status.id
                                                ? 'bg-white text-emerald-600 shadow-sm'
                                                : 'text-slate-500'
                                                }`}
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Execution History Modal */}
            {showExecutionHistoryModal && selectedTask && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">执行历史</h3>
                                <p className="text-xs text-slate-500 mt-1">{selectedTask.name}</p>
                            </div>
                            <button
                                onClick={() => setShowExecutionHistoryModal(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {executionHistory.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">暂无执行历史</div>
                            ) : (
                                <div className="border border-slate-200">
                                    {executionHistory.map(exec => {
                                        const statusConfig = getStatusConfig(exec.status);
                                        return (
                                            <div key={exec.executionId} className="px-6 py-4 border-b border-slate-100 hover:bg-slate-50">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                                                        <statusConfig.icon size={20} className={statusConfig.color} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="font-medium text-slate-800">执行 #{exec.executionId.slice(0, 8)}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}>
                                                                {statusConfig.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-6 text-sm text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={14} />
                                                                {exec.executeTime}
                                                            </span>
                                                            <span>扫描 {exec.tableCount} 表</span>
                                                            <span>成功 {exec.successCount} 个</span>
                                                            {exec.failCount > 0 && (
                                                                <span className="text-red-600">失败 {exec.failCount} 个</span>
                                                            )}
                                                            {exec.duration && (
                                                                <span>耗时 {exec.duration}s</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetScanningView;