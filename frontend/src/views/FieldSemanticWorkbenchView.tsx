import { useState, useMemo } from 'react';
import {
    Layout, Search, Filter, AlertTriangle, CheckCircle, Clock,
    ArrowRight, MoreHorizontal, Wand2, Shield, Share2,
    ChevronDown, RefreshCw, Layers, Database, X
} from 'lucide-react';
import { FieldSemanticStatus, GovernanceStatus, TableSemanticStage } from '../types/semantic';
import { semanticStageLabelMap, semanticStageToneMap } from './semantic/utils';

interface FieldSemanticWorkbenchProps {
    scanResults: any[];
    onNavigateToField: (tableId: string, fieldName: string) => void;
}

interface FieldTodoItem {
    id: string;
    fieldName: string;
    tableName: string;
    logicalViewName?: string;
    semanticStatus: FieldSemanticStatus;
    semanticStage: TableSemanticStage; // Inherited from table
    suggestedRole?: string;
    term?: string;      // New for Advanced Filter
    tags?: string[];    // New for Advanced Filter
    confidence?: number;
    riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
    sourceType?: string;
}

export const FieldSemanticWorkbenchView = ({ scanResults, onNavigateToField }: FieldSemanticWorkbenchProps) => {
    // Local State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRisk, setFilterRisk] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterLogicalView, setFilterLogicalView] = useState<string[]>([]);
    const [filterRole, setFilterRole] = useState<string[]>([]); // Advanced
    const [filterTag, setFilterTag] = useState<string[]>([]);   // Advanced
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Drawer State
    const [selectedField, setSelectedField] = useState<FieldTodoItem | null>(null);
    const [drawerRole, setDrawerRole] = useState('');
    const [drawerTags, setDrawerTags] = useState<string[]>([]);

    const handleOpenDrawer = (field: FieldTodoItem) => {
        setSelectedField(field);
        setDrawerRole(field.suggestedRole || '');
        setDrawerTags(field.tags || []);
    };

    const handleCloseDrawer = () => {
        setSelectedField(null);
    };

    const handleDecision = (type: 'ACCEPT' | 'REJECT') => {
        // Mock API call / State update
        console.log(`Decision for ${selectedField?.fieldName}: ${type}`, { role: drawerRole, tags: drawerTags });
        handleCloseDrawer();
    };

    // 1. Flatten Fields Data
    const allFields: FieldTodoItem[] = useMemo(() => {
        if (!scanResults || !Array.isArray(scanResults)) return [];

        const fields: FieldTodoItem[] = [];
        scanResults.forEach(table => {
            // Mock logic to determine semantic stage if missing
            const stage = table.semanticStage || 'NOT_STARTED';
            const logViewName = table.semanticAnalysis?.businessName; // Extract Logical View Name

            if (Array.isArray(table.fields)) {
                table.fields.forEach((field: any) => {
                    // Derive mock status/risk if not present
                    const status = field.semanticStatus || 'UNANALYZED';
                    const risk = field.riskLevel || (Math.random() > 0.8 ? 'HIGH' : 'LOW');
                    const confidence = field.confidence ||
                        (typeof field.suggestion === 'object' && field.suggestion?.confidence ? field.suggestion.confidence * 100 : undefined) ||
                        (Math.random() * 100);

                    // Mock Tags & Term if missing - just for demo
                    const mockTags = Math.random() > 0.7 ? ['PII', 'Core'] : [];
                    const mockTerm = field.term || (Math.random() > 0.9 ? 'Customer_ID' : undefined);

                    fields.push({
                        id: `${table.table}-${field.name}`,
                        fieldName: field.name,
                        tableName: table.table,
                        logicalViewName: logViewName,
                        semanticStatus: status,
                        semanticStage: stage,
                        suggestedRole: (typeof field.suggestion === 'object' && field.suggestion !== null) ? field.suggestion.term : field.suggestion,
                        term: mockTerm,
                        tags: mockTags,
                        confidence: confidence,
                        riskLevel: risk,
                        sourceType: table.sourceType
                    });
                });
            }
        });
        return fields;
    }, [scanResults]);

    // Derived Unique Logical Views for Filter
    const uniqueLogicalViews = useMemo(() => {
        const views = new Set<string>();
        allFields.forEach(f => {
            if (f.logicalViewName) views.add(f.logicalViewName);
        });
        return Array.from(views);
    }, [allFields]);

    // Derived Unique Roles and Tags
    const { uniqueRoles, uniqueTags } = useMemo(() => {
        const roles = new Set<string>();
        const tags = new Set<string>();
        allFields.forEach(f => {
            if (f.suggestedRole) roles.add(f.suggestedRole);
            if (f.tags) f.tags.forEach(t => tags.add(t));
        });
        return { uniqueRoles: Array.from(roles), uniqueTags: Array.from(tags) };
    }, [allFields]);

    // 2. Filter Logic Helpers
    const toggleFilter = (type: 'RISK' | 'STATUS' | 'LOGICAL_VIEW' | 'ROLE' | 'TAG', value: string) => {
        if (type === 'RISK') {
            setFilterRisk(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
        } else if (type === 'STATUS') {
            setFilterStatus(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
        } else if (type === 'LOGICAL_VIEW') {
            setFilterLogicalView(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
        } else if (type === 'ROLE') {
            setFilterRole(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
        } else if (type === 'TAG') {
            setFilterTag(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRisk([]);
        setFilterStatus([]);
        setFilterLogicalView([]);
        setFilterRole([]);
        setFilterTag([]);
    };

    // 3. Filter Logic
    const filteredFields = useMemo(() => {
        return allFields.filter(field => {
            const matchesSearch = field.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                field.tableName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRisk = filterRisk.length === 0 || (field.riskLevel && filterRisk.includes(field.riskLevel));
            const matchesStatus = filterStatus.length === 0 || filterStatus.includes(field.semanticStatus);
            const matchesLogicalView = filterLogicalView.length === 0 || (field.logicalViewName && filterLogicalView.includes(field.logicalViewName));

            // Advanced Filters
            const matchesRole = filterRole.length === 0 || (field.suggestedRole && filterRole.includes(field.suggestedRole));
            const matchesTag = filterTag.length === 0 || (field.tags && field.tags.some(t => filterTag.includes(t)));

            return matchesSearch && matchesRisk && matchesStatus && matchesLogicalView && matchesRole && matchesTag;
        });
    }, [allFields, searchTerm, filterRisk, filterStatus, filterLogicalView, filterRole, filterTag]);

    // 3. Stats
    const stats = useMemo(() => {
        return {
            pending: allFields.filter(f => f.semanticStatus !== 'DECIDED').length,
            highRisk: allFields.filter(f => f.riskLevel === 'HIGH' && f.semanticStatus !== 'DECIDED').length,
            todayDecided: 12, // Mock
            blocked: allFields.filter(f => f.semanticStatus === 'BLOCKED').length
        };
    }, [allFields]);

    const handleBatchRun = () => {
        setIsBatchRunning(true);
        setTimeout(() => setIsBatchRunning(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 px-6 py-5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">字段语义理解（工作台）</h1>
                        <p className="text-sm text-slate-500 mt-1">集中治理跨表字段，批量生成语义建议与风险排查</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleBatchRun}
                            disabled={isBatchRunning}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isBatchRunning ? 'bg-blue-100 text-blue-400 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                }`}
                        >
                            {isBatchRunning ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                            {isBatchRunning ? '正在生成...' : '批量生成【语义建议】'}
                        </button>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-500" />
                            批量接受高置信度
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <StatCard
                        label="待确认字段"
                        value={stats.pending}
                        icon={Clock}
                        color="text-orange-500"
                        bg="bg-orange-50"
                        onClick={() => { setFilterStatus(['UNANALYZED']); setFilterRisk([]); }}
                        active={filterStatus.includes('UNANALYZED') && filterStatus.length === 1 && filterRisk.length === 0}
                    />
                    <StatCard
                        label="高风险字段"
                        value={stats.highRisk}
                        icon={Shield}
                        color="text-red-500"
                        bg="bg-red-50"
                        onClick={() => { setFilterRisk(['HIGH']); setFilterStatus([]); }}
                        active={filterRisk.includes('HIGH') && filterRisk.length === 1 && filterStatus.length === 0}
                    />
                    <StatCard
                        label="今日已确认"
                        value={stats.todayDecided}
                        icon={CheckCircle}
                        color="text-emerald-500"
                        bg="bg-emerald-50"
                        onClick={clearFilters}
                    />
                    <StatCard
                        label="阻塞字段"
                        value={stats.blocked}
                        icon={AlertTriangle}
                        color="text-slate-500"
                        bg="bg-slate-100"
                        onClick={() => { setFilterStatus(['BLOCKED']); setFilterRisk([]); }}
                        active={filterStatus.includes('BLOCKED') && filterStatus.length === 1 && filterRisk.length === 0}
                    />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 flex items-center gap-4 border-b border-slate-200 bg-white/50 sticky top-0 z-10 backdrop-blur-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="搜索字段名、表名..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                {/* Enhanced Filter Toggles */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 mr-1">逻辑视图:</span>
                    <div className="relative group">
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50">
                            {filterLogicalView.length > 0 ? `已选 ${filterLogicalView.length} 项` : '全部视图'}
                            <ChevronDown size={12} />
                        </button>
                        {/* Dropdown for Logical Views */}
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20 p-2 max-h-60 overflow-y-auto">
                            {uniqueLogicalViews.length > 0 ? uniqueLogicalViews.map(view => (
                                <label key={view} className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filterLogicalView.includes(view)}
                                        onChange={() => toggleFilter('LOGICAL_VIEW', view)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                    />
                                    {view}
                                </label>
                            )) : <div className="px-2 py-1 text-xs text-slate-400">无逻辑视图数据</div>}
                        </div>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 mr-1">状态:</span>
                    {['UNANALYZED', 'SUGGESTED', 'PARTIALLY_DECIDED', 'BLOCKED', 'DECIDED'].map(status => (
                        <button
                            key={status}
                            onClick={() => toggleFilter('STATUS', status)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filterStatus.includes(status)
                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {status === 'UNANALYZED' ? '待确认' :
                                status === 'SUGGESTED' ? 'AI建议' :
                                    status === 'PARTIALLY_DECIDED' ? '部分确认' :
                                        status === 'BLOCKED' ? '已阻塞' : '已确认'}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 mr-1">风险:</span>
                    {['HIGH', 'MEDIUM', 'LOW'].map(risk => (
                        <button
                            key={risk}
                            onClick={() => toggleFilter('RISK', risk)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filterRisk.includes(risk)
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {risk === 'HIGH' ? '高' : risk === 'MEDIUM' ? '中' : '低'}
                        </button>
                    ))}
                </div>

                {/* Advanced Filters Toggle */}
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${showAdvancedFilters
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Filter size={12} />
                    高级筛选
                </button>

                {(filterRisk.length > 0 || filterStatus.length > 0 || filterLogicalView.length > 0 || filterRole.length > 0 || filterTag.length > 0 || searchTerm) && (
                    <button
                        onClick={clearFilters}
                        className="ml-auto px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <RefreshCw size={12} />
                        清除筛选
                    </button>
                )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center gap-6 animate-in slide-in-from-top-1">
                    {/* Role Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">建议角色:</span>
                        <div className="relative group">
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm">
                                {filterRole.length > 0 ? `已选 ${filterRole.length}` : '全部角色'}
                                <ChevronDown size={12} />
                            </button>
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20 p-2 max-h-60 overflow-y-auto">
                                {uniqueRoles.length > 0 ? uniqueRoles.map(role => (
                                    <label key={role} className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filterRole.includes(role)}
                                            onChange={() => toggleFilter('ROLE', role)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                        />
                                        {role}
                                    </label>
                                )) : <div className="px-2 py-1 text-xs text-slate-400">无建议角色</div>}
                            </div>
                        </div>
                    </div>

                    {/* Tag Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">标签:</span>
                        <div className="relative group">
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm">
                                {filterTag.length > 0 ? `已选 ${filterTag.length}` : '全部标签'}
                                <ChevronDown size={12} />
                            </button>
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20 p-2 max-h-60 overflow-y-auto">
                                {uniqueTags.length > 0 ? uniqueTags.map(tag => (
                                    <label key={tag} className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filterTag.includes(tag)}
                                            onChange={() => toggleFilter('TAG', tag)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                        />
                                        {tag}
                                    </label>
                                )) : <div className="px-2 py-1 text-xs text-slate-400">无标签数据</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-medium text-slate-600">字段名称</th>
                                <th className="px-4 py-3 font-medium text-slate-600">所属表</th>
                                <th className="px-4 py-3 font-medium text-slate-600">逻辑视图</th>
                                <th className="px-4 py-3 font-medium text-slate-600 w-32">语义状态</th>
                                <th className="px-4 py-3 font-medium text-slate-600 w-40">建议角色</th>
                                <th className="px-4 py-3 font-medium text-slate-600 w-24">置信度</th>
                                <th className="px-4 py-3 font-medium text-slate-600 w-24">风险等级</th>
                                <th className="px-4 py-3 font-medium text-slate-600 text-right w-40">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredFields.map(field => (
                                <tr key={field.id} className="hover:bg-slate-50 group transition-colors cursor-pointer" onClick={() => handleOpenDrawer(field)}>
                                    <td className="px-4 py-3 font-medium text-slate-900">{field.fieldName}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Database size={14} className="text-slate-400" />
                                            {field.tableName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {field.logicalViewName ? (
                                            <span className="inline-flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                                <Layers size={12} />
                                                {field.logicalViewName}
                                            </span>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <SemanticStatusBadge status={field.semanticStatus} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {field.suggestedRole ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {field.suggestedRole}
                                            </span>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {field.confidence ? (
                                            <div className="flex items-center gap-1">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${field.confidence > 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${field.confidence}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500">{Math.round(field.confidence)}%</span>
                                            </div>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <RiskBadge level={field.riskLevel} />
                                    </td>
                                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenDrawer(field)}
                                                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                裁决
                                            </button>
                                            <button
                                                onClick={() => onNavigateToField(field.tableName, field.fieldName)}
                                                className="px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto"
                                            >
                                                <Share2 size={14} />
                                                定位
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredFields.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            <Layers size={48} className="mx-auto mb-4 opacity-20" />
                            <p>暂无符合条件的字段</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Decision Drawer */}
            {
                selectedField && (
                    <div className="absolute inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right-10 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-semibold text-slate-900">快速裁决</h3>
                            <button onClick={handleCloseDrawer} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Field Info */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">字段名称</div>
                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                        {selectedField.fieldName}
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-600 font-normal">
                                            {selectedField.sourceType}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">所属表</div>
                                    <div className="text-sm text-slate-700 flex items-center gap-1">
                                        <Database size={12} />
                                        {selectedField.tableName}
                                    </div>
                                </div>
                                {selectedField.logicalViewName && (
                                    <div>
                                        <div className="text-xs text-slate-500 mb-1">逻辑视图</div>
                                        <div className="text-sm text-slate-700">{selectedField.logicalViewName}</div>
                                    </div>
                                )}
                            </div>

                            {/* AI Suggestion */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-slate-900">AI 语义建议</h4>
                                    <div className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        置信度 {Math.round(selectedField.confidence || 0)}%
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">建议角色 Role</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={drawerRole}
                                                onChange={(e) => setDrawerRole(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Editable
                                            />
                                            {selectedField.suggestedRole && selectedField.suggestedRole !== drawerRole && (
                                                <button
                                                    onClick={() => setDrawerRole(selectedField.suggestedRole || '')}
                                                    className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                                                >
                                                    重置为建议
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">标签 Tags</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {drawerTags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs flex items-center gap-1">
                                                    {tag}
                                                    <button onClick={() => setDrawerTags(drawerTags.filter(t => t !== tag))} className="hover:text-blue-900"><X size={10} /></button>
                                                </span>
                                            ))}
                                            <button className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200 border border-slate-200 border-dashed">
                                                + 添加
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Risk */}
                            {selectedField.riskLevel === 'HIGH' && (
                                <div className="bg-red-50 p-3 rounded-lg flex items-start gap-3 border border-red-100">
                                    <Shield className="text-red-500 mt-0.5" size={16} />
                                    <div>
                                        <div className="text-sm font-medium text-red-800">高风险检测</div>
                                        <p className="text-xs text-red-600 mt-1">检测到敏感词汇匹配，建议人工复核业务含义。</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-slate-200 bg-white space-y-3">
                            <button
                                onClick={() => handleDecision('ACCEPT')}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16} />
                                接受并应用
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                                    存为草稿
                                </button>
                                <button
                                    onClick={() => handleDecision('REJECT')}
                                    className="py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                                >
                                    拒绝建议
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Helper Components
const StatCard = ({ label, value, icon: Icon, color, bg, onClick, active }: any) => (
    <div
        onClick={onClick}
        className={`bg-white border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
            }`}
    >
        <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
            <Icon size={24} className={color} />
        </div>
        <div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 font-medium">{label}</div>
        </div>
    </div>
);

const SemanticStatusBadge = ({ status }: { status: FieldSemanticStatus }) => {
    switch (status) {
        case 'DECIDED': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">已确认</span>;
        case 'PARTIALLY_DECIDED': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">部分确认</span>;
        case 'SUGGESTED': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">AI建议</span>;
        case 'BLOCKED': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">已阻塞</span>;
        default: return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">待分析</span>;
    }
}

const RiskBadge = ({ level }: { level?: string }) => {
    if (level === 'HIGH') return (
        <span className="flex items-center gap-1 text-red-600">
            <AlertTriangle size={14} />
            <span className="text-xs font-medium">高风险</span>
        </span>
    );
    if (level === 'MEDIUM') return <span className="text-xs font-medium text-orange-500">中风险</span>;
    return <span className="text-xs text-slate-400">低风险</span>;
}
