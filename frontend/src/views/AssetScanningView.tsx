import { useState, useEffect } from 'react';
import {
    Plus, Play, Pause, RefreshCw, Clock, Database, Calendar,
    CheckCircle, XCircle, AlertCircle, Activity, List,
    Settings, ChevronDown, MoreHorizontal, X,
    Eye, Trash2, Zap, Layers, User, Target
} from 'lucide-react';
import {
    scanService,
    type ScanTask,
    type ScheduledScan,
    type ScheduledScanExecutionHistory,
    type TableScan,
    type TableInfo,
    type FieldInfo,
    ScanTaskType,
    ScanStrategy,
} from '../services/scanService';
import { dataSourceService, type DataSource, type DataSourceStatisticsVo } from '../services/dataSourceService';

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
    // 编辑中的定时任务（用于弹窗表单）
    const [editingScheduledTask, setEditingScheduledTask] = useState<ScheduledScan | null>(null);

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
        scanStrategy: [] as ('insert' | 'update' | 'delete')[],
        selectedTables: [] as string[],
        cronExpression: '0 0 2 * * ?',
        status: 'open' as 'open' | 'close',
    });

    // 表选择相关
    const [availableTables, setAvailableTables] = useState<TableInfo[]>([]);
    const [tablesLoading, setTablesLoading] = useState(false);
    const [tableSearchKeyword, setTableSearchKeyword] = useState('');

    // 字段信息相关
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [selectedTableForFields, setSelectedTableForFields] = useState<TableScan | null>(null);
    const [tableFields, setTableFields] = useState<FieldInfo[]>([]);
    const [fieldsLoading, setFieldsLoading] = useState(false);

    // 数据源统计信息
    const [dataSourceStatistics, setDataSourceStatistics] = useState<DataSourceStatisticsVo | null>(null);
    const [statisticsLoading, setStatisticsLoading] = useState(false);

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

    // 加载数据源统计信息
    const loadDataSourceStatistics = async (dataSourceId: string) => {
        if (!dataSourceId) {
            setDataSourceStatistics(null);
            return;
        }

        setStatisticsLoading(true);
        try {
            const stats = await dataSourceService.getDataSourceStatistics(dataSourceId);
            setDataSourceStatistics(stats);
        } catch (error) {
            console.error('Failed to load data source statistics:', error);
            setDataSourceStatistics(null);
        } finally {
            setStatisticsLoading(false);
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

        // 表即时扫描需要选择表
        if (newTask.type === ScanTaskType.TableInstant && newTask.selectedTables.length === 0) {
            alert('请至少选择一个表');
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
                scanStrategy: newTask.scanStrategy.length > 0 ? newTask.scanStrategy : undefined,
                tables: newTask.selectedTables.length > 0 ? newTask.selectedTables : undefined,
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
            scanStrategy: [] as ('insert' | 'update' | 'delete')[],
            selectedTables: [],
            cronExpression: '0 0 2 * * ?',
            status: 'open',
        });
        setAvailableTables([]);
        setTableSearchKeyword('');
    };

    // 加载数据源下的表列表
    const loadTablesForDataSource = async (dataSourceId: string, dataSourceType?: string) => {
        if (!dataSourceId) {
            setAvailableTables([]);
            return;
        }

        setTablesLoading(true);
        try {
            const result = await scanService.getTablesByDataSourceId({
                dataSourceId,
                limit: 100,
            });
            // 为每个表设置数据源类型（从参数获取，如果没有则使用 newTask 中的值）
            const dbType = dataSourceType || newTask.dataSourceType;
            const tablesWithDbType = result.tables.map(table => ({
                ...table,
                dbType: dbType || table.dbType,
            }));
            setAvailableTables(tablesWithDbType);
        } catch (error) {
            console.error('Failed to load tables:', error);
            setAvailableTables([]);
        } finally {
            setTablesLoading(false);
        }
    };

    // 查看表字段信息
    const handleViewTableFields = async (table: TableScan) => {
        setSelectedTableForFields(table);
        setShowFieldModal(true);
        setFieldsLoading(true);

        try {
            const result = await scanService.getFieldsByTableId({
                tableId: table.tableId,
                limit: 500,
            });
            setTableFields(result.fields);
        } catch (error) {
            console.error('Failed to load table fields:', error);
            setTableFields([]);
        } finally {
            setFieldsLoading(false);
        }
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

    const handleViewScheduledDetail = async (task: ScanTask) => {
        if (!task.scheduleId) return;

        try {
            // 优先使用任务列表中的 scanStrategy（用户之前保存的）
            // 只有在缺少必要信息时才从后端 API 获取
            let cronExpression = task.scanStrategy && task.scanStrategy.length > 0 ? undefined : '0 0 2 * * ?';
            let nextRunTime: string | undefined = undefined;
            let createTime: string | undefined = undefined;

            try {
                // 尝试从后端获取 cron 表达式和执行时间信息
                const statusResult: any = await scanService.getScheduledScanStatus(task.scheduleId, '2');
                cronExpression = statusResult.cronExpression;
                nextRunTime = statusResult.nextRunTime;
                createTime = statusResult.createTime;
            } catch (apiError) {
                // 如果 API 调用失败，使用默认值
                console.warn('Failed to fetch scheduled task status from API, using task list data:', apiError);
            }

            // 使用任务列表中的数据作为主要来源，特别是 scanStrategy
            const mergedTask: ScheduledScan = {
                scheduleId: task.scheduleId,
                name: task.name,
                dataSourceType: task.dataSourceType,
                // 优先使用任务列表中的 scanStrategy（用户之前保存的）
                scanStrategy: task.scanStrategy || [],
                cronExpression: cronExpression || '0 0 2 * * ?',
                status: task.taskStatus === 'enable' ? 'open' : 'close',
                createTime: createTime || task.startTime,
                nextRunTime: nextRunTime,
            };

            setSelectedScheduledTask(mergedTask);
            // 初始化编辑状态为当前值的副本
            setEditingScheduledTask({ ...mergedTask });
            setShowScheduledDetailModal(true);
        } catch (error) {
            console.error('Failed to load scheduled task details:', error);
            // 即使出错也使用任务列表中的数据打开弹窗
            const fallbackTask: ScheduledScan = {
                scheduleId: task.scheduleId,
                name: task.name,
                dataSourceType: task.dataSourceType,
                scanStrategy: task.scanStrategy || [],
                cronExpression: '0 0 2 * * ?',
                status: task.taskStatus === 'enable' ? 'open' : 'close',
                createTime: task.startTime,
                nextRunTime: undefined,
            };
            setSelectedScheduledTask(fallbackTask);
            setEditingScheduledTask({ ...fallbackTask });
            setShowScheduledDetailModal(true);
        }
    };

    const handleViewExecutionHistory = async (task: ScanTask) => {
        setSelectedTask(task);
        setShowExecutionHistoryModal(true);

        if (!task.scheduleId) return;

        try {
            // 使用正确的接口：getScheduledScanTaskList 对应后端的 /scan/schedule/task/{scheduleId}
            const result = await scanService.getScheduledScanTaskList(task.scheduleId);
            setExecutionHistory(result.executions);
        } catch (error) {
            console.error('Failed to load execution history:', error);
        }
    };

    const handleExecuteTask = async (task: ScanTask) => {
        if (!task.scheduleId) return;

        try {
            await scanService.executeScheduledScan(task.scheduleId);
            alert('任务已提交执行');
            loadScheduledTasks();
        } catch (error) {
            console.error('Failed to execute task:', error);
            alert('立即执行失败：' + (error as Error).message);
        }
    };

    const handleDeleteTask = async (task: ScanTask) => {
        if (!task.scheduleId) return;

        if (!confirm(`确定要删除定时任务"${task.name}"吗？此操作不可恢复。`)) {
            return;
        }

        try {
            await scanService.deleteScheduledScan(task.scheduleId);
            alert('删除成功');
            loadScheduledTasks();
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('删除失败：' + (error as Error).message);
        }
    };

    const handleRescan = async (task: ScanTask) => {
        if (!task.id) return;

        try {
            // 立即更新前端状态为"扫描中"（乐观更新）
            setInstantTasks(prevTasks =>
                prevTasks.map(t =>
                    t.id === task.id ? { ...t, status: 'running' as const } : t
                )
            );

            await scanService.retryScan(task.id);
            // 重新加载任务列表以获取后端真实状态
            loadInstantTasks();
        } catch (error) {
            console.error('Failed to rescan task:', error);
            // 失败时恢复原状态
            loadInstantTasks();
        }
    };

    const handleSaveScheduledTask = async () => {
        if (!editingScheduledTask) return;

        try {
            await scanService.updateScheduledScan({
                scheduleId: editingScheduledTask.scheduleId,
                cronExpression: editingScheduledTask.cronExpression,
                scanStrategy: editingScheduledTask.scanStrategy,
                status: editingScheduledTask.status,
            });

            // 更新成功后重新加载后端数据
            await loadScheduledTasks();

            // 更新成功后关闭弹窗
            alert('保存成功');
            setShowScheduledDetailModal(false);
        } catch (error) {
            console.error('Failed to update scheduled task:', error);
            alert('保存失败：' + (error as Error).message);
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
                                                    <button
                                                        onClick={() => handleRescan(task)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                        title="重新扫描"
                                                    >
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
                                                        {task.scanStrategy && task.scanStrategy.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Target size={14} />
                                                                {task.scanStrategy.map(s => s === 'insert' ? '插入' : s === 'update' ? '更新' : '删除').join('、')}
                                                            </span>
                                                        )}
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
                                                        title="编辑配置"
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
                                                    <button
                                                        onClick={() => handleExecuteTask(task)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                        title="立即执行"
                                                    >
                                                        <Zap size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(task)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="删除"
                                                    >
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
                                        const dsType = ds?.type || 'MySQL';
                                        setNewTask({
                                            ...newTask,
                                            dataSourceId: e.target.value,
                                            dataSourceType: dsType,
                                            selectedTables: [], // 重置已选择的表
                                        });
                                        // 如果是表即时扫描，加载表列表
                                        if (newTask.type === ScanTaskType.TableInstant) {
                                            loadTablesForDataSource(e.target.value, dsType);
                                        }
                                        // 加载数据源统计信息
                                        loadDataSourceStatistics(e.target.value);
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                                >
                                    <option value="">选择数据源...</option>
                                    {dataSources.map(ds => (
                                        <option key={ds.id} value={ds.id}>{ds.name} ({ds.type})</option>
                                    ))}
                                </select>

                                {/* 数据源统计信息 */}
                                {newTask.dataSourceId && dataSourceStatistics && (
                                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database size={16} className="text-blue-600" />
                                            <h4 className="text-sm font-medium text-blue-800">数据源统计信息</h4>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 text-xs">
                                            <div className="bg-white p-2 rounded border border-blue-100">
                                                <div className="text-slate-500 mb-1">表总数</div>
                                                <div className="text-lg font-bold text-slate-700">{dataSourceStatistics.table_count || 0}</div>
                                            </div>
                                            <div className="bg-white p-2 rounded border border-blue-100">
                                                <div className="text-slate-500 mb-1">字段总数</div>
                                                <div className="text-lg font-bold text-slate-700">{dataSourceStatistics.field_count || 0}</div>
                                            </div>
                                            <div className="bg-white p-2 rounded border border-blue-100">
                                                <div className="text-slate-500 mb-1">已扫描表</div>
                                                <div className="text-lg font-bold text-emerald-600">{dataSourceStatistics.scanned_table_count || 0}</div>
                                            </div>
                                        </div>
                                        {(dataSourceStatistics.scanning_table_count > 0 || dataSourceStatistics.unscanned_table_count > 0) && (
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                {dataSourceStatistics.scanning_table_count > 0 && (
                                                    <div className="flex items-center gap-1 text-blue-600">
                                                        <RefreshCw size={12} className="animate-spin" />
                                                        <span>扫描中: {dataSourceStatistics.scanning_table_count} 表</span>
                                                    </div>
                                                )}
                                                {dataSourceStatistics.unscanned_table_count > 0 && (
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <Clock size={12} />
                                                        <span>未扫描: {dataSourceStatistics.unscanned_table_count} 表</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {newTask.dataSourceId && statisticsLoading && (
                                    <div className="mt-3 flex items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <RefreshCw size={16} className="text-slate-400 animate-spin mr-2" />
                                        <span className="text-sm text-slate-500">加载统计信息中...</span>
                                    </div>
                                )}
                            </div>

                            {/* 表即时扫描时显示表选择器 */}
                            {newTask.type === ScanTaskType.TableInstant && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        选择表 <span className="text-red-500">*</span>
                                    </label>
                                    {!newTask.dataSourceId ? (
                                        <div className="text-sm text-slate-400 p-3 bg-slate-50 rounded border border-slate-200">
                                            请先选择数据源
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            {/* 搜索框 */}
                                            <div className="p-3 border-b border-slate-200 bg-slate-50">
                                                <input
                                                    type="text"
                                                    placeholder="搜索表名..."
                                                    value={tableSearchKeyword}
                                                    onChange={e => setTableSearchKeyword(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                                />
                                            </div>

                                            {/* 表列表 */}
                                            <div className="max-h-48 overflow-y-auto">
                                                {tablesLoading ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <RefreshCw size={24} className="text-slate-400 animate-spin" />
                                                    </div>
                                                ) : availableTables.length === 0 ? (
                                                    <div className="text-center py-8 text-sm text-slate-400">
                                                        该数据源下暂无已扫描的表
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100">
                                                        {availableTables
                                                            .filter(table =>
                                                                !tableSearchKeyword ||
                                                                table.tableName.toLowerCase().includes(tableSearchKeyword.toLowerCase())
                                                            )
                                                            .map(table => (
                                                                <label
                                                                    key={table.id}
                                                                    className={`flex items-center p-3 hover:bg-slate-50 cursor-pointer ${
                                                                        newTask.selectedTables.includes(table.id)
                                                                            ? 'bg-emerald-50'
                                                                            : ''
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={newTask.selectedTables.includes(table.id)}
                                                                        onChange={e => {
                                                                            if (e.target.checked) {
                                                                                setNewTask({
                                                                                    ...newTask,
                                                                                    selectedTables: [...newTask.selectedTables, table.id],
                                                                                });
                                                                            } else {
                                                                                setNewTask({
                                                                                    ...newTask,
                                                                                    selectedTables: newTask.selectedTables.filter(
                                                                                        id => id !== table.id
                                                                                    ),
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                                                                    />
                                                                    <div className="ml-3 flex-1">
                                                                        <div className="text-sm font-medium text-slate-700">
                                                                            {table.tableName}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 text-right max-w-[200px] truncate" title={table.tableComment}>
                                                                        {table.tableComment || '-'}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 已选择数量 */}
                                            {newTask.selectedTables.length > 0 && (
                                                <div className="p-3 border-t border-slate-200 bg-emerald-50 text-sm text-emerald-700">
                                                    已选择 {newTask.selectedTables.length} 个表
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 只在数据源即时扫描(type=0)和定时扫描(type=2)时显示扫描策略选项 */}
                            {(newTask.type === ScanTaskType.DataSourceInstant || newTask.type === ScanTaskType.DataSourceScheduled) && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        扫描策略 <span className="text-slate-400 font-normal">(可选，可选择一项或多项)</span>
                                    </label>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'insert' as const, label: '插入', desc: '扫描新增的数据' },
                                            { id: 'update' as const, label: '更新', desc: '扫描修改的数据' },
                                            { id: 'delete' as const, label: '删除', desc: '扫描删除的数据' },
                                        ].map(strategy => (
                                            <label
                                                key={strategy.id}
                                                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                    newTask.scanStrategy.includes(strategy.id)
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={newTask.scanStrategy.includes(strategy.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setNewTask({
                                                                ...newTask,
                                                                scanStrategy: [...newTask.scanStrategy, strategy.id]
                                                            });
                                                        } else {
                                                            setNewTask({
                                                                ...newTask,
                                                                scanStrategy: newTask.scanStrategy.filter(s => s !== strategy.id)
                                                            });
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <div className="ml-3">
                                                    <div className="font-medium text-sm text-slate-700">{strategy.label}</div>
                                                    <div className="text-xs text-slate-500">{strategy.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {newTask.scanStrategy.length > 0 && (
                                        <div className="mt-2 text-xs text-slate-500">
                                            已选择: {newTask.scanStrategy.map(s =>
                                                s === 'insert' ? '插入' : s === 'update' ? '更新' : '删除'
                                            ).join('、')}
                                        </div>
                                    )}
                                </div>
                            )}

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
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableScans.map(table => {
                                                const statusConfig = getStatusConfig(table.status);
                                                return (
                                                    <tr key={table.tableId} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
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
                                                        <td className="px-4 py-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewTableFields(table);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                            >
                                                                查看字段
                                                            </button>
                                                        </td>
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

            {/* Scheduled Task Detail Modal - Editable */}
            {showScheduledDetailModal && editingScheduledTask && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">编辑定时任务配置</h3>
                                <p className="text-xs text-slate-500 mt-1">{selectedScheduledTask?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowScheduledDetailModal(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">任务名称</label>
                                <input
                                    type="text"
                                    value={editingScheduledTask.name}
                                    disabled
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">任务名称不可修改</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cron 表达式</label>
                                <input
                                    type="text"
                                    value={editingScheduledTask.cronExpression}
                                    onChange={e => setEditingScheduledTask({ ...editingScheduledTask, cronExpression: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-1">例如：0 0 2 * * ? 表示每天凌晨2点执行</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    扫描策略 <span className="text-slate-400 font-normal">(可选，可选择一项或多项)</span>
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'insert' as const, label: '插入', desc: '扫描新增的数据' },
                                        { id: 'update' as const, label: '更新', desc: '扫描修改的数据' },
                                        { id: 'delete' as const, label: '删除', desc: '扫描删除的数据' },
                                    ].map(strategy => (
                                        <label
                                            key={strategy.id}
                                            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                (editingScheduledTask.scanStrategy || []).includes(strategy.id)
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={(editingScheduledTask.scanStrategy || []).includes(strategy.id)}
                                                onChange={(e) => {
                                                    const currentStrategies = editingScheduledTask.scanStrategy || [];
                                                    if (e.target.checked) {
                                                        setEditingScheduledTask({
                                                            ...editingScheduledTask,
                                                            scanStrategy: [...currentStrategies, strategy.id]
                                                        });
                                                    } else {
                                                        setEditingScheduledTask({
                                                            ...editingScheduledTask,
                                                            scanStrategy: currentStrategies.filter(s => s !== strategy.id)
                                                        });
                                                    }
                                                }}
                                                className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <div className="ml-3">
                                                <div className="font-medium text-sm text-slate-700">{strategy.label}</div>
                                                <div className="text-xs text-slate-500">{strategy.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {(editingScheduledTask.scanStrategy || []).length > 0 && (
                                    <div className="mt-2 text-xs text-slate-500">
                                        已选择: {(editingScheduledTask.scanStrategy || []).map(s =>
                                            s === 'insert' ? '插入' : s === 'update' ? '更新' : '删除'
                                        ).join('、')}
                                    </div>
                                )}
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
                                            onClick={() => setEditingScheduledTask({ ...editingScheduledTask, status: status.id })}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${editingScheduledTask.status === status.id
                                                ? 'bg-white text-emerald-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setShowScheduledDetailModal(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveScheduledTask}
                                className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-sm shadow-emerald-200"
                            >
                                保存更改
                            </button>
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
                                                            {exec.duration !== undefined && exec.duration !== null && exec.duration > 0 && (
                                                                <span>耗时 {exec.duration} 秒</span>
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

            {/* Field Detail Modal */}
            {showFieldModal && selectedTableForFields && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">字段信息</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {selectedTableForFields.tableName}
                                    {selectedTableForFields.tableComment && ` - ${selectedTableForFields.tableComment}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowFieldModal(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* 表信息摘要 */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">数据库类型</div>
                                    <div className="text-sm font-medium text-slate-700">{selectedTableForFields.dbType}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">状态</div>
                                    <div className="text-sm font-medium text-slate-700">
                                        {selectedTableForFields.status === 'success' && '成功'}
                                        {selectedTableForFields.status === 'running' && '扫描中'}
                                        {selectedTableForFields.status === 'fail' && '失败'}
                                        {selectedTableForFields.status === 'wait' && '等待中'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">行数</div>
                                    <div className="text-sm font-medium text-slate-700">
                                        {selectedTableForFields.rowCount || '-'}
                                    </div>
                                </div>
                            </div>

                            {/* 字段列表 */}
                            <h4 className="font-semibold text-slate-800 mb-3">字段列表</h4>
                            {fieldsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw size={24} className="text-slate-400 animate-spin" />
                                </div>
                            ) : tableFields.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">暂无字段信息</div>
                            ) : (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">字段名</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">字段类型</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">主键</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">可空</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">默认值</th>
                                                <th className="px-4 py-2 text-left font-medium text-slate-600">注释</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableFields.map(field => (
                                                <tr key={field.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="px-4 py-2 font-medium text-slate-700">{field.fieldName}</td>
                                                    <td className="px-4 py-2 text-slate-600">{field.fieldType}</td>
                                                    <td className="px-4 py-2 text-slate-600">
                                                        {field.isPrimary ? (
                                                            <span className="text-emerald-600 font-medium">是</span>
                                                        ) : (
                                                            <span className="text-slate-400">否</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-600">
                                                        {field.isNullable ? (
                                                            <span className="text-blue-600">可空</span>
                                                        ) : (
                                                            <span className="text-red-600">非空</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-600">{field.defaultValue || '-'}</td>
                                                    <td className="px-4 py-2 text-slate-600">{field.fieldComment || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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