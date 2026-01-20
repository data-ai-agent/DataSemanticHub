import { useState } from 'react';
import {
    Layout, Database, GitMerge, Search, CheckCircle, AlertCircle,
    ChevronRight, Cpu, Plus, Link, Settings
} from 'lucide-react';
import { mockDataSources, mockBOTableMappings } from '../data/mockData';

interface MappingStudioViewProps {
    selectedBO: any;
    showRuleEditor: any;
    setShowRuleEditor: (val: any) => void;
    businessObjects: any[];
}

const MappingStudioView = ({ selectedBO, showRuleEditor, setShowRuleEditor, businessObjects }: MappingStudioViewProps) => {
    const [activeBOId, setActiveBOId] = useState(selectedBO?.id || 'BO_NEWBORN');

    // 数据源树状态
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(mockDataSources[0]?.id || null);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [expandedTypes, setExpandedTypes] = useState<string[]>(['MySQL', 'Oracle', 'PostgreSQL']);
    const [searchTerm, setSearchTerm] = useState('');

    // Get active BO from businessObjects
    const activeBO = businessObjects.find(bo => bo.id === activeBOId) || businessObjects[0];

    // Get associated table mapping
    const tableMapping = mockBOTableMappings[activeBOId] || null;

    // Calculate mapping stats
    const totalFields = activeBO?.fields?.length || 0;
    const mappedCount = tableMapping?.mappings?.length || 0;
    const mappingPercentage = totalFields > 0 ? Math.round((mappedCount / totalFields) * 100) : 0;

    // 获取选中的数据源和表
    const selectedDataSource = mockDataSources.find(ds => ds.id === selectedDataSourceId);
    const selectedTable = selectedDataSource?.tables?.find((t: any) => t.id === selectedTableId);

    // 按数据库类型分组
    const groupedSources = mockDataSources.reduce((acc: Record<string, typeof mockDataSources>, ds) => {
        if (!acc[ds.type]) acc[ds.type] = [];
        acc[ds.type].push(ds);
        return acc;
    }, {} as Record<string, typeof mockDataSources>);

    // 数据库类型配置
    const typeConfig: Record<string, { color: string; shortName: string }> = {
        MySQL: { color: 'text-blue-600 bg-blue-50', shortName: 'My' },
        Oracle: { color: 'text-orange-600 bg-orange-50', shortName: 'Or' },
        PostgreSQL: { color: 'text-emerald-600 bg-emerald-50', shortName: 'Pg' }
    };

    const toggleType = (type: string) => {
        setExpandedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleSelectDataSource = (dsId: string) => {
        setSelectedDataSourceId(dsId);
        const ds = mockDataSources.find(d => d.id === dsId);
        if (ds && ds.tables && ds.tables.length > 0) {
            setSelectedTableId(ds.tables[0].id);
        } else {
            setSelectedTableId(null);
        }
    };

    // 过滤数据源
    const filteredGroupedSources = Object.entries(groupedSources).reduce((acc: Record<string, typeof mockDataSources>, [type, sources]) => {
        const filtered = sources.filter(ds =>
            ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ds.dbName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[type] = filtered;
        return acc;
    }, {} as Record<string, typeof mockDataSources>);

    return (
        <div className="h-full flex animate-fade-in gap-3">
            {/* 左侧: 数据源树 */}
            <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Database size={16} className="text-blue-500" />
                        数据源
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">选择数据源查看表列表</p>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索数据源..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors"
                        />
                    </div>
                </div>

                {/* Tree Content */}
                <div className="flex-1 overflow-y-auto p-2">
                    {Object.entries(filteredGroupedSources).map(([type, sources]) => (
                        <div key={type} className="mb-2">
                            {/* Type Header */}
                            <button
                                onClick={() => toggleType(type)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight
                                    size={14}
                                    className={`text-slate-400 transition-transform ${expandedTypes.includes(type) ? 'rotate-90' : ''}`}
                                />
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeConfig[type]?.color || 'bg-slate-100'}`}>
                                    {type}
                                </span>
                                <span className="text-xs text-slate-400 ml-auto">{sources.length}</span>
                            </button>

                            {/* Data Sources */}
                            {expandedTypes.includes(type) && (
                                <div className="ml-4 space-y-1 mt-1">
                                    {sources.map(ds => (
                                        <div key={ds.id}>
                                            <button
                                                onClick={() => handleSelectDataSource(ds.id)}
                                                className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left transition-all ${selectedDataSourceId === ds.id
                                                    ? 'bg-blue-50 border border-blue-200'
                                                    : 'hover:bg-slate-50 border border-transparent'
                                                    }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${ds.status === 'connected' ? 'bg-emerald-500' :
                                                    ds.status === 'scanning' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'
                                                    }`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-medium truncate ${selectedDataSourceId === ds.id ? 'text-blue-800' : 'text-slate-700'}`}>
                                                        {ds.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 truncate">{ds.dbName}</div>
                                                </div>
                                                <span className="text-[10px] text-slate-400">{ds.tables?.length || 0}</span>
                                            </button>

                                            {/* Tables under selected data source */}
                                            {selectedDataSourceId === ds.id && ds.tables && ds.tables.length > 0 && (
                                                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-blue-100 pl-2">
                                                    {ds.tables.map((table: any) => (
                                                        <button
                                                            key={table.id}
                                                            onClick={() => setSelectedTableId(table.id)}
                                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${selectedTableId === table.id
                                                                ? 'bg-purple-50 text-purple-700 font-medium'
                                                                : 'text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <Database size={10} className={selectedTableId === table.id ? 'text-purple-500' : 'text-slate-400'} />
                                                            <span className="truncate font-mono">{table.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Selected Info */}
                {selectedDataSource && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">当前选中</div>
                        <div className="text-xs font-medium text-slate-700 truncate">{selectedDataSource.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeConfig[selectedDataSource.type]?.color}`}>
                                {selectedDataSource.type}
                            </span>
                            <span className="text-[10px] text-slate-400">{selectedDataSource.tables?.length || 0} 张表</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 中间: BO选择器 */}
            <div className="w-56 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-700">业务对象</h3>
                    <p className="text-[10px] text-slate-400 mt-1">选择要映射的对象</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {businessObjects.map(bo => {
                        const boMapping = mockBOTableMappings[bo.id];
                        const boMappedCount = boMapping?.mappings?.length || 0;
                        const boTotalFields = bo.fields?.length || 0;
                        const hasMapping = boMappedCount > 0;

                        return (
                            <div
                                key={bo.id}
                                onClick={() => setActiveBOId(bo.id)}
                                className={`p-2 rounded-lg mb-2 cursor-pointer transition-all ${activeBOId === bo.id
                                    ? 'bg-purple-50 border-2 border-purple-500 shadow-sm'
                                    : 'bg-slate-50 border border-slate-200 hover:border-purple-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center ${hasMapping ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Layout size={12} />
                                        </div>
                                        <div className="text-xs font-medium text-slate-700 truncate max-w-[100px]">{bo.name}</div>
                                    </div>
                                    {hasMapping && <CheckCircle size={12} className="text-emerald-600" />}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${hasMapping ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: `${boTotalFields > 0 ? (boMappedCount / boTotalFields) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-[10px] text-slate-400">{boMappedCount}/{boTotalFields}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 右侧主内容区 */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* 顶部工具栏 */}
                <div className="bg-white border border-slate-200 rounded-t-xl p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <GitMerge className="text-purple-600" size={20} />
                            语义映射工作台
                        </h2>
                        <p className="text-xs text-slate-500">
                            {activeBO?.name} → {selectedTable?.name || tableMapping?.tableName || '选择物理表'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                            <span className="text-xs text-slate-500">映射进度</span>
                            <span className={`text-sm font-bold ${mappingPercentage === 100 ? 'text-emerald-600' : 'text-purple-600'}`}>
                                {mappingPercentage}%
                            </span>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            <Cpu size={14} /> AI 自动映射
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-sm transition-colors">
                            <CheckCircle size={14} /> 保存
                        </button>
                    </div>
                </div>

                {/* 映射画布 */}
                <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex gap-4 rounded-b-xl border-x border-b border-slate-200">
                    {/* 左侧: 业务对象字段 */}
                    <div className="w-[250px] bg-white rounded-xl border border-blue-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <div className="flex items-center gap-2">
                                <Layout size={16} />
                                <span className="font-bold text-sm">{activeBO?.name}</span>
                            </div>
                            <div className="text-xs text-blue-100 font-mono mt-1">{activeBO?.code}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {activeBO?.fields?.map((field: any, idx: number) => {
                                const mapping = tableMapping?.mappings?.find(m => m.boField === field.name);
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-2 mb-1 rounded-lg border transition-all text-xs ${mapping ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-slate-700">{field.name}</span>
                                                {field.required && <span className="text-red-500">*</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">{field.type}</div>
                                        </div>
                                        {mapping ? <CheckCircle size={12} className="text-emerald-600" /> : <AlertCircle size={12} className="text-red-400" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 中间: 映射关系 */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {tableMapping && tableMapping.mappings.length > 0 ? (
                            <div className="w-full space-y-2 max-h-full overflow-y-auto">
                                {tableMapping.mappings.map((m, idx) => (
                                    <div key={idx} className="flex items-center bg-white rounded-lg border border-slate-200 p-2 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex-1 text-right">
                                            <span className="text-xs font-medium text-blue-700">{m.boField}</span>
                                        </div>
                                        <div className="mx-3 flex items-center gap-1">
                                            <div className="w-6 h-0.5 bg-gradient-to-r from-blue-400 to-slate-300" />
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-300">
                                                <Link size={10} />
                                            </div>
                                            <div className="w-6 h-0.5 bg-gradient-to-r from-slate-300 to-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-xs font-mono text-emerald-700">{m.tblField}</span>
                                        </div>
                                        <button onClick={() => setShowRuleEditor(m)} className="ml-2 p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                                            <Settings size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <GitMerge size={32} />
                                </div>
                                <p className="text-slate-500 font-medium text-sm">暂无映射关系</p>
                                <button className="mt-3 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 mx-auto text-xs">
                                    <Plus size={14} /> 添加映射
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 右侧: 物理表字段 - 显示选中的表 */}
                    <div className="w-[250px] bg-white rounded-xl border border-emerald-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                            <div className="flex items-center gap-2">
                                <Database size={16} />
                                <span className="font-bold text-sm truncate">{selectedTable?.name || '选择物理表'}</span>
                            </div>
                            {selectedTable && (
                                <div className="text-xs text-emerald-100 mt-1">{selectedTable.comment} · {selectedTable.rows} 行</div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {selectedTable?.columns?.map((col: any, idx: number) => {
                                const mapping = tableMapping?.mappings?.find(m => m.tblField === col.name);
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-2 mb-1 rounded-lg border transition-all text-xs ${mapping ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-slate-700">{col.name}</div>
                                            <div className="text-[10px] text-slate-400">{col.comment} · {col.type}</div>
                                        </div>
                                        {mapping && <CheckCircle size={12} className="text-emerald-600" />}
                                    </div>
                                );
                            }) || (
                                    <div className="p-4 text-center text-slate-400 text-xs">
                                        <Database size={28} className="mx-auto mb-2 opacity-30" />
                                        请在左侧选择物理表
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MappingStudioView;
