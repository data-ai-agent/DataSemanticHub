import { useState } from 'react';
import { Scan, Database, Table, Search, RefreshCw, X, ChevronRight, CheckCircle, AlertCircle, Clock, XCircle, Settings, History, Grid, List as ListIcon, Star, Users, Tag } from 'lucide-react';

// 扩展的数据模型
interface ScanAsset {
    id: string;
    name: string;
    comment: string;
    rows: string;
    updateTime: string;
    status: 'new' | 'changed' | 'synced' | 'removed' | 'error';
    reviewState: 'unreviewed' | 'reviewed' | 'ignored';
    sourceId: string;
    sourceName: string;
    sourceType: string;
    healthScore?: number;
    owner?: string;
    semanticTags?: string[];
    columns: { name: string; type: string; comment: string; nullable: boolean; isPK: boolean }[];
}

interface AssetScanningViewProps {
    onNavigate?: (module: string) => void;
}

// Scan History Modal Component
const ScanHistoryModal = ({ onClose }: { onClose: () => void }) => {
    const [selectedRun, setSelectedRun] = useState<string | null>(null);

    const scanRuns = [
        {
            id: 'RUN_001',
            startTime: '2024-05-21 10:00:00',
            endTime: '2024-05-21 10:05:32',
            duration: '5分32秒',
            scope: '全量',
            dataSourceCount: 3,
            results: { new: 2, changed: 1, removed: 0, error: 0 },
            status: 'success' as const,
            totalTables: 156
        },
        {
            id: 'RUN_002',
            startTime: '2024-05-20 10:00:00',
            endTime: '2024-05-20 10:04:15',
            duration: '4分15秒',
            scope: '增量',
            dataSourceCount: 2,
            results: { new: 1, changed: 3, removed: 1, error: 0 },
            status: 'success' as const,
            totalTables: 154
        },
        {
            id: 'RUN_003',
            startTime: '2024-05-19 10:00:00',
            endTime: '2024-05-19 10:03:45',
            duration: '3分45秒',
            scope: '全量',
            dataSourceCount: 3,
            results: { new: 0, changed: 2, removed: 0, error: 1 },
            status: 'partial_failure' as const,
            totalTables: 153
        }
    ];

    const statusConfig = {
        success: { label: '成功', color: 'text-green-700', bgColor: 'bg-green-100' },
        partial_failure: { label: '部分失败', color: 'text-orange-700', bgColor: 'bg-orange-100' },
        failure: { label: '失败', color: 'text-red-700', bgColor: 'bg-red-100' }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="w-[900px] max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">扫描历史</h3>
                        <p className="text-sm text-slate-500 mt-1">查看历史扫描任务和结果</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Run List */}
                    <div className="w-1/2 border-r border-slate-200 overflow-y-auto">
                        <div className="p-4 space-y-3">
                            {scanRuns.map(run => {
                                const config = statusConfig[run.status];
                                return (
                                    <div
                                        key={run.id}
                                        onClick={() => setSelectedRun(run.id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedRun === run.id
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {run.startTime}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    耗时: {run.duration} | {run.scope} | {run.dataSourceCount} 个数据源
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${config.bgColor} ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </div>

                                        <div className="flex gap-2 text-xs">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">新增 {run.results.new}</span>
                                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">变更 {run.results.changed}</span>
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded">缺失 {run.results.removed}</span>
                                            {run.results.error > 0 && (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded">失败 {run.results.error}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Run Detail */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedRun ? (
                            <div className="space-y-4">
                                {(() => {
                                    const run = scanRuns.find(r => r.id === selectedRun)!;
                                    return (
                                        <>
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-3">运行概览</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-50 rounded-lg p-3">
                                                        <p className="text-xs text-slate-500">发现表总数</p>
                                                        <p className="text-lg font-bold text-slate-800 mt-1">{run.totalTables}</p>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-lg p-3">
                                                        <p className="text-xs text-slate-500">扫描耗时</p>
                                                        <p className="text-lg font-bold text-slate-800 mt-1">{run.duration}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-3">扫描配置</h4>
                                                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">扫描范围</span>
                                                        <span className="font-medium text-slate-800">{run.scope}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">数据源数量</span>
                                                        <span className="font-medium text-slate-800">{run.dataSourceCount}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">开始时间</span>
                                                        <span className="font-medium text-slate-800">{run.startTime}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {run.results.error > 0 && (
                                                <div>
                                                    <h4 className="font-bold text-slate-800 mb-3">失败资产</h4>
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <p className="text-sm text-red-700">
                                                            共 {run.results.error} 个表扫描失败，请查看日志排查
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                                    查看详情
                                                </button>
                                                <button className="flex-1 px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                                                    重新运行
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <History size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>选择一个扫描任务查看详情</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};

// Auto-Scan Config Modal Component
const AutoScanConfigModal = ({ onClose }: { onClose: () => void }) => {
    const [scheduleEnabled, setScheduleEnabled] = useState(true);
    const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'custom'>('daily');
    const [scheduleTime, setScheduleTime] = useState('02:00');
    const [selectedDataSources, setSelectedDataSources] = useState<string[]>(['DS_001', 'DS_002']);

    const dataSources = [
        { id: 'DS_001', name: '卫健委_前置库_01', type: 'MySQL' },
        { id: 'DS_002', name: '市人口库_主库', type: 'Oracle' },
        { id: 'DS_003', name: '政务数据中心', type: 'PostgreSQL' }
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="w-[600px] bg-white rounded-xl shadow-2xl">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">自动扫描配置</h3>
                        <p className="text-sm text-slate-500 mt-1">设置定时和自动化扫描规则</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Schedule Enable */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800">启用定时扫描</h4>
                            <p className="text-sm text-slate-500 mt-1">按计划自动扫描数据源</p>
                        </div>
                        <button
                            onClick={() => setScheduleEnabled(!scheduleEnabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${scheduleEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${scheduleEnabled ? 'transform translate-x-6' : ''
                                    }`}
                            />
                        </button>
                    </div>

                    {scheduleEnabled && (
                        <>
                            {/* Schedule Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    扫描频率
                                </label>
                                <div className="flex gap-2">
                                    {(['daily', 'weekly', 'custom'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setScheduleType(type)}
                                            className={`flex-1 px-4 py-2 text-sm rounded-lg border-2 transition-colors ${scheduleType === type
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {type === 'daily' ? '每日' : type === 'weekly' ? '每周' : '自定义'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule Time */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    扫描时间
                                </label>
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    建议选择业务低峰期（如凌晨）执行扫描
                                </p>
                            </div>

                            {/* Data Sources */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    扫描范围
                                </label>
                                <div className="space-y-2">
                                    {dataSources.map(ds => (
                                        <label
                                            key={ds.id}
                                            className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDataSources.includes(ds.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedDataSources([...selectedDataSources, ds.id]);
                                                    } else {
                                                        setSelectedDataSources(selectedDataSources.filter(id => id !== ds.id));
                                                    }
                                                }}
                                                className="rounded border-slate-300"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-700">{ds.name}</p>
                                                <p className="text-xs text-slate-500">{ds.type}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Notification */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                                    <div className="text-sm text-blue-700">
                                        <p className="font-medium mb-1">通知设置</p>
                                        <p>扫描完成后将通过系统消息通知管理员</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                        保存配置
                    </button>
                </div>
            </div>
        </div>
    );
};

// Detail Drawer Component
const DetailDrawer = ({ asset, onClose }: { asset: ScanAsset; onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'quality' | 'diff' | 'log' | 'collaborate' | 'source'>('overview');

    const tabs = [
        { key: 'overview' as const, label: '概览' },
        { key: 'schema' as const, label: '字段结构' },
        { key: 'quality' as const, label: '数据质量' },
        { key: 'diff' as const, label: '变更 Diff' },
        { key: 'log' as const, label: '扫描日志' },
        { key: 'collaborate' as const, label: '协作讨论' },
        { key: 'source' as const, label: '数据源信息' }
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
            <div className="w-[720px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                    <div>
                        <h3 className="text-xl font-bold mb-1 font-mono">{asset.name}</h3>
                        <p className="text-emerald-100 text-sm">{asset.comment}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs">
                            <span className="bg-white/20 px-2 py-0.5 rounded">{asset.sourceType}</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded">行数: {asset.rows}</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded">{asset.columns.length} 字段</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded p-1 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 px-6 flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' && <OverviewTab asset={asset} />}
                    {activeTab === 'schema' && <SchemaTab asset={asset} />}
                    {activeTab === 'quality' && <QualityTab asset={asset} />}
                    {activeTab === 'diff' && <DiffTab asset={asset} />}
                    {activeTab === 'log' && <LogTab asset={asset} />}
                    {activeTab === 'collaborate' && <CollaborateTab asset={asset} />}
                    {activeTab === 'source' && <SourceTab asset={asset} />}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        关闭
                    </button>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                            忽略
                        </button>
                        <button className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                            标记已确认
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Tab Components
const OverviewTab = ({ asset }: { asset: ScanAsset }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">首次发现时间</p>
                <p className="text-sm font-medium text-slate-700">2024-05-15 10:00</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">上次扫描时间</p>
                <p className="text-sm font-medium text-slate-700">{asset.updateTime}</p>
            </div>
        </div>

        {asset.healthScore && (
            <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">健康分析</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">健康分</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${asset.healthScore >= 80 ? 'bg-green-500' :
                                asset.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                            <span className="text-lg font-bold text-slate-800">{asset.healthScore}</span>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        {asset.healthScore >= 80 ? '✓ 表结构完整，文档齐全' : '⚠ 建议完善字段注释'}
                    </div>
                </div>
            </div>
        )}

        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">AI 语义推断</h4>
            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                    <span className="text-sm text-slate-600">推荐业务名称</span>
                    <span className="text-sm font-medium text-purple-700">{asset.comment}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-slate-600">推荐分类</span>
                    <span className="text-sm font-medium text-purple-700">事实表</span>
                </div>
                {asset.semanticTags && (
                    <div className="flex gap-2 mt-2">
                        {asset.semanticTags.map(tag => (
                            <span key={tag} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {asset.status === 'changed' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-orange-800 mb-2">⚠ 潜在影响分析</h4>
                <p className="text-sm text-orange-700">关联 3 个下游报表，2 个 API 服务</p>
            </div>
        )}
    </div>
);

const SchemaTab = ({ asset }: { asset: ScanAsset }) => (
    <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Table size={16} />
            字段结构 ({asset.columns.length})
        </h4>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                        <th className="px-3 py-2">字段名</th>
                        <th className="px-3 py-2">类型</th>
                        <th className="px-3 py-2">注释</th>
                        <th className="px-3 py-2 text-center">约束</th>
                        <th className="px-3 py-2 text-center">敏感度</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {asset.columns.map((col, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1.5 font-mono text-slate-700">
                                    {col.isPK && (
                                        <span className="text-amber-500" title="Primary Key">🔑</span>
                                    )}
                                    {col.name}
                                </div>
                            </td>
                            <td className="px-3 py-2.5">
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                    {col.type}
                                </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">{col.comment}</td>
                            <td className="px-3 py-2.5 text-center">
                                {!col.nullable && (
                                    <span className="text-red-500 text-xs" title="NOT NULL">NN</span>
                                )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                {col.name.includes('id_card') || col.name.includes('phone') ? (
                                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">L3</span>
                                ) : (
                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">L1</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const QualityTab = ({ asset }: { asset: ScanAsset }) => (
    <div className="space-y-6">
        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">数据样本预览</h4>
            <div className="bg-slate-50 rounded-lg p-4 text-xs font-mono">
                <p className="text-slate-500 mb-2">前 5 行数据（脱敏展示）</p>
                <div className="space-y-1 text-slate-600">
                    <p>1 | 张** | 3301********1234 | ...</p>
                    <p>2 | 李** | 3301********5678 | ...</p>
                    <p>3 | 王** | 3301********9012 | ...</p>
                </div>
            </div>
        </div>

        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">质量指标</h4>
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">空值率</span>
                    <span className="text-sm font-medium text-green-600">2.3%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">唯一值数</span>
                    <span className="text-sm font-medium text-slate-700">1,234,567</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">最后更新</span>
                    <span className="text-sm font-medium text-slate-700">{asset.updateTime}</span>
                </div>
            </div>
        </div>
    </div>
);

const DiffTab = ({ asset }: { asset: ScanAsset }) => (
    <div className="space-y-4">
        {asset.status === 'changed' ? (
            <>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-orange-800 mb-2">变更摘要</h4>
                    <p className="text-sm text-orange-700">字段 +2 / -1 / 类型变更 1 / 注释变更 3</p>
                </div>

                <div className="space-y-2">
                    <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">新增</span>
                            <span className="text-sm font-mono text-slate-700">email</span>
                        </div>
                        <p className="text-xs text-slate-600 ml-14">varchar(100) - 电子邮箱</p>
                    </div>

                    <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">删除</span>
                            <span className="text-sm font-mono text-slate-700">old_field</span>
                        </div>
                        <p className="text-xs text-red-600 ml-14">影响等级: 高</p>
                    </div>
                </div>
            </>
        ) : (
            <div className="text-center py-12 text-slate-400">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p>无变更</p>
            </div>
        )}
    </div>
);

const LogTab = ({ asset }: { asset: ScanAsset }) => (
    <div className="space-y-4">
        {asset.status === 'error' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-red-800 mb-2">❌ 扫描错误</h4>
                <p className="text-sm text-red-700 mb-2">错误码: ERR_CONNECTION_REFUSED</p>
                <p className="text-sm text-red-600">建议: 检查数据源连接配置和网络权限</p>
            </div>
        ) : (
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm text-slate-700">连接数据源成功</span>
                    <span className="text-xs text-slate-500 ml-auto">2024-05-21 10:00:01</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm text-slate-700">拉取元数据完成</span>
                    <span className="text-xs text-slate-500 ml-auto">2024-05-21 10:00:03</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm text-slate-700">统计行数完成</span>
                    <span className="text-xs text-slate-500 ml-auto">2024-05-21 10:00:05</span>
                </div>
            </div>
        )}
    </div>
);

const CollaborateTab = ({ asset }: { asset: ScanAsset }) => (
    <div className="space-y-6">
        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">评论与讨论</h4>
            <div className="space-y-3">
                <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                            张
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-slate-700">张三</span>
                                <span className="text-xs text-slate-400">2小时前</span>
                            </div>
                            <p className="text-sm text-slate-600">这个表的数据质量看起来不错，建议尽快确认</p>
                        </div>
                    </div>
                </div>

                <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center text-slate-400 text-sm">
                    暂无更多评论
                </div>
            </div>
        </div>

        <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3">操作记录</h4>
            <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <Clock size={12} />
                    <span>李四 确认了该资产</span>
                    <span className="text-slate-400 ml-auto">3天前</span>
                </div>
            </div>
        </div>
    </div>
);

const SourceTab = ({ asset }: { asset: ScanAsset }) => (
    <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
                <span className="text-sm text-slate-500">数据源名称</span>
                <span className="text-sm font-medium text-slate-700">{asset.sourceName}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-sm text-slate-500">数据库类型</span>
                <span className="text-sm font-medium text-slate-700">{asset.sourceType}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-sm text-slate-500">物理表名</span>
                <span className="text-sm font-medium text-slate-700 font-mono">{asset.name}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-sm text-slate-500">最后扫描时间</span>
                <span className="text-sm text-slate-700">{asset.updateTime}</span>
            </div>
        </div>

        <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                查看数据源配置
            </button>
            <button className="flex-1 px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                重新扫描
            </button>
        </div>
    </div>
);

const AssetScanningView = ({ onNavigate }: AssetScanningViewProps) => {
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [viewingTable, setViewingTable] = useState<ScanAsset | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | ScanAsset['status']>('all');
    const [filterReviewState, setFilterReviewState] = useState<'all' | ScanAsset['reviewState']>('all');
    const [selectedSource, setSelectedSource] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
    const [activeTab, setActiveTab] = useState<'all' | 'new' | 'changed' | 'removed' | 'error' | 'watchlist'>('all');
    const [showScanHistory, setShowScanHistory] = useState(false);
    const [showAutoScanConfig, setShowAutoScanConfig] = useState(false);

    const dataSources = [
        { id: 'DS_001', name: '卫健委_前置库_01', type: 'MySQL' },
        { id: 'DS_002', name: '市人口库_主库', type: 'Oracle' },
        { id: 'DS_003', name: '政务数据中心', type: 'PostgreSQL' }
    ];

    const [scanAssets] = useState<ScanAsset[]>([
        {
            id: 'TBL_001',
            name: 't_pop_base_info',
            comment: '人口基础信息表',
            rows: '1.2M',
            updateTime: '2024-05-20 10:00',
            status: 'synced',
            reviewState: 'reviewed',
            sourceId: 'DS_001',
            sourceName: '卫健委_前置库_01',
            sourceType: 'MySQL',
            healthScore: 85,
            owner: '张三',
            semanticTags: ['用户', '人口'],
            columns: [
                { name: 'id', type: 'bigint', comment: '主键ID', nullable: false, isPK: true },
                { name: 'name', type: 'varchar(50)', comment: '姓名', nullable: false, isPK: false },
                { name: 'id_card', type: 'varchar(18)', comment: '身份证号', nullable: false, isPK: false }
            ]
        },
        {
            id: 'TBL_002',
            name: 't_med_birth_cert',
            comment: '出生医学证明记录',
            rows: '450K',
            updateTime: '2024-05-19 15:30',
            status: 'new',
            reviewState: 'unreviewed',
            sourceId: 'DS_001',
            sourceName: '卫健委_前置库_01',
            sourceType: 'MySQL',
            healthScore: 72,
            semanticTags: ['医疗', '证明'],
            columns: []
        },
        {
            id: 'TBL_003',
            name: 't_vac_record',
            comment: '疫苗接种记录',
            rows: '3.5M',
            updateTime: '2024-05-21 08:15',
            status: 'changed',
            reviewState: 'unreviewed',
            sourceId: 'DS_001',
            sourceName: '卫健委_前置库_01',
            sourceType: 'MySQL',
            healthScore: 90,
            owner: '李四',
            semanticTags: ['医疗', '疫苗'],
            columns: []
        },
        {
            id: 'TBL_004',
            name: 't_old_archive',
            comment: '旧归档表',
            rows: '0',
            updateTime: '2024-05-10 10:00',
            status: 'removed',
            reviewState: 'ignored',
            sourceId: 'DS_002',
            sourceName: '市人口库_主库',
            sourceType: 'Oracle',
            columns: []
        },
        {
            id: 'TBL_005',
            name: 't_failed_connection',
            comment: '连接失败表',
            rows: 'N/A',
            updateTime: '2024-05-21 12:00',
            status: 'error',
            reviewState: 'unreviewed',
            sourceId: 'DS_003',
            sourceName: '政务数据中心',
            sourceType: 'PostgreSQL',
            columns: []
        }
    ]);

    const statusConfigs = {
        new: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'New', icon: AlertCircle },
        changed: { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Changed', icon: RefreshCw },
        synced: { color: 'text-slate-500', bgColor: 'bg-slate-100', label: 'Synced', icon: CheckCircle },
        removed: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Removed', icon: XCircle },
        error: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Error', icon: AlertCircle }
    };

    const reviewStateConfigs = {
        unreviewed: { color: 'text-slate-600', bgColor: 'bg-slate-100', label: '未确认' },
        reviewed: { color: 'text-green-700', bgColor: 'bg-green-100', label: '已确认' },
        ignored: { color: 'text-slate-400', bgColor: 'bg-slate-50', label: '已忽略' }
    };

    const filteredAssets = scanAssets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.comment.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
        const matchesSource = selectedSource === 'all' || asset.sourceId === selectedSource;
        const matchesReviewState = filterReviewState === 'all' || asset.reviewState === filterReviewState;
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'watchlist' ? false : asset.status === activeTab);
        return matchesSearch && matchesStatus && matchesSource && matchesReviewState && matchesTab;
    });

    const getHealthColor = (score?: number) => {
        if (!score) return 'bg-slate-200';
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Scan className="text-emerald-500" size={24} />
                        资产扫描中心
                    </h2>
                    <p className="text-slate-500 mt-1">扫描数据源，发现物理资产，为后续语义分析提供原始数据</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowScanHistory(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <History size={16} />
                        扫描历史
                    </button>
                    <button
                        onClick={() => setShowAutoScanConfig(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Settings size={16} />
                        自动扫描配置
                    </button>
                    <button
                        onClick={() => setIsScanning(true)}
                        disabled={isScanning}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-colors ${isScanning
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                            }`}
                    >
                        {isScanning ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                扫描中...
                            </>
                        ) : (
                            <>
                                <Scan size={16} />
                                开始扫描
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {[
                    { label: '发现表总数', value: scanAssets.length, icon: Table, color: 'blue' },
                    { label: '新增', value: scanAssets.filter(a => a.status === 'new').length, icon: AlertCircle, color: 'blue' },
                    { label: '变更', value: scanAssets.filter(a => a.status === 'changed').length, icon: RefreshCw, color: 'orange' },
                    { label: '缺失', value: scanAssets.filter(a => a.status === 'removed').length, icon: XCircle, color: 'red' },
                    { label: '失败', value: scanAssets.filter(a => a.status === 'error').length, icon: AlertCircle, color: 'red' },
                    { label: '已选中', value: selectedTables.length, icon: CheckCircle, color: 'purple' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">{kpi.label}</p>
                                <h3 className={`text-2xl font-bold text-${kpi.color}-600 mt-1`}>{kpi.value}</h3>
                            </div>
                            <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                                <kpi.icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & View Options */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="搜索表名或注释..."
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                            />
                        </div>
                        <select
                            value={selectedSource}
                            onChange={e => setSelectedSource(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                        >
                            <option value="all">所有数据源</option>
                            {dataSources.map(ds => (
                                <option key={ds.id} value={ds.id}>{ds.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterReviewState}
                            onChange={e => setFilterReviewState(e.target.value as any)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                        >
                            <option value="all">所有处理状态</option>
                            <option value="unreviewed">未确认</option>
                            <option value="reviewed">已确认</option>
                            <option value="ignored">已忽略</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                                    }`}
                            >
                                <ListIcon size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('tree')}
                                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'tree' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                                    }`}
                            >
                                <Grid size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                    {([
                        { key: 'all', label: '全部', count: scanAssets.length },
                        { key: 'new', label: '新增', count: scanAssets.filter(a => a.status === 'new').length },
                        { key: 'changed', label: '变更', count: scanAssets.filter(a => a.status === 'changed').length },
                        { key: 'removed', label: '缺失', count: scanAssets.filter(a => a.status === 'removed').length },
                        { key: 'error', label: '失败', count: scanAssets.filter(a => a.status === 'error').length },
                        { key: 'watchlist', label: '关注', count: 0 }
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === tab.key
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {tab.key === 'watchlist' && <Star size={14} />}
                            {tab.label}
                            <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Section */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">扫描结果</h3>
                    <span className="text-xs text-slate-500">显示 {filteredAssets.length} 个表</span>
                </div>

                {/* List View - Table */}
                {viewMode === 'list' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 w-10">
                                        <input type="checkbox" className="rounded border-slate-300" />
                                    </th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">物理表名</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">中文注释</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">数据源</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">行数</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">语义画像</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">健康分</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">责任人</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">状态</th>
                                    <th className="px-6 py-3 text-slate-600 font-medium">处理进度</th>
                                    <th className="px-6 py-3 text-right text-slate-600 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAssets.map(asset => {
                                    const statusConfig = statusConfigs[asset.status];
                                    const reviewConfig = reviewStateConfigs[asset.reviewState];
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="rounded border-slate-300" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Database size={14} className="text-slate-400" />
                                                    <span className="font-mono font-medium text-slate-700">{asset.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{asset.comment}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                    {asset.sourceName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-mono">{asset.rows}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    {asset.semanticTags?.map(tag => (
                                                        <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {asset.healthScore && (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${getHealthColor(asset.healthScore)}`} />
                                                        <span className="font-medium">{asset.healthScore}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-600">{asset.owner || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                    <StatusIcon size={12} />
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${reviewConfig.bgColor} ${reviewConfig.color}`}>
                                                    {reviewConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setViewingTable(asset)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 ml-auto"
                                                >
                                                    详情
                                                    <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tree/Card View */}
                {viewMode === 'tree' && (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAssets.map(asset => {
                                const statusConfig = statusConfigs[asset.status];
                                const reviewConfig = reviewStateConfigs[asset.reviewState];
                                const StatusIcon = statusConfig.icon;

                                return (
                                    <div
                                        key={asset.id}
                                        className="border border-slate-200 rounded-lg p-4 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
                                        onClick={() => setViewingTable(asset)}
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Database size={16} className="text-slate-400" />
                                                    <h4 className="font-mono font-medium text-slate-800 text-sm truncate">
                                                        {asset.name}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-slate-600 line-clamp-2">{asset.comment}</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 mt-1"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>

                                        {/* Meta Info */}
                                        <div className="space-y-2 mb-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">数据源</span>
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                    {asset.sourceType}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">行数</span>
                                                <span className="font-mono font-medium text-slate-700">{asset.rows}</span>
                                            </div>
                                            {asset.healthScore && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">健康分</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-2 h-2 rounded-full ${getHealthColor(asset.healthScore)}`} />
                                                        <span className="font-medium text-slate-700">{asset.healthScore}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {asset.owner && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">责任人</span>
                                                    <span className="text-slate-700">{asset.owner}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Semantic Tags */}
                                        {asset.semanticTags && asset.semanticTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {asset.semanticTags.map(tag => (
                                                    <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Status Badges */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                <StatusIcon size={12} />
                                                {statusConfig.label}
                                            </span>
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${reviewConfig.bgColor} ${reviewConfig.color}`}>
                                                {reviewConfig.label}
                                            </span>
                                        </div>

                                        {/* Hover Action */}
                                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="w-full text-center text-xs text-emerald-600 font-medium py-1">
                                                查看详情 →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {filteredAssets.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <Database size={48} className="mx-auto mb-4 opacity-20" />
                        <p>没有匹配的表</p>
                        <p className="text-xs mt-1">尝试调整筛选条件或执行新的扫描</p>
                    </div>
                )}
            </div>

            {/* Batch Actions Bar - shown when items selected */}
            {selectedTables.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex items-center gap-4 animate-slide-up">
                    <span className="text-sm font-medium text-slate-700">已选 {selectedTables.length} 个表</span>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                            标记已确认
                        </button>
                        <button className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1">
                            <Users size={14} />
                            分配责任人
                        </button>
                        <button className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1">
                            <Tag size={14} />
                            打标
                        </button>
                        <button className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                            导出
                        </button>
                    </div>
                </div>
            )}


            {/* Scan History Modal */}
            {showScanHistory && (
                <ScanHistoryModal onClose={() => setShowScanHistory(false)} />
            )}

            {/* Auto-Scan Config Modal */}
            {showAutoScanConfig && (
                <AutoScanConfigModal onClose={() => setShowAutoScanConfig(false)} />
            )}

            {/* Detail Drawer - Complete Implementation */}
            {viewingTable && (
                <DetailDrawer
                    asset={viewingTable}
                    onClose={() => setViewingTable(null)}
                />
            )}
        </div>
    );
};

export default AssetScanningView;
