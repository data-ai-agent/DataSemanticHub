import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, AlertTriangle, Shield, Clock, Database, ChevronDown, Filter } from 'lucide-react';
import { FieldSemanticProfile, RiskLevel, FieldSemanticStatus } from '../../../types/semantic';

// Role labels for consistent Chinese display
const ROLE_LABELS: Record<string, string> = {
    'Identifier': '标识字段',
    'ForeignKey': '外键字段',
    'BusAttr': '业务属性',
    'Status': '状态字段',
    'Time': '时间字段',
    'EventHint': '事件线索',
    'Measure': '度量字段',
    'Attribute': '通用属性',
    'Audit': '审计字段',
    'Technical': '技术属性'
};

interface GovernanceFieldListProps {
    fields: any[]; // Using any for raw fields compatible with existing views
    semanticProfile: any; // Using any to be compatible with loose typing in parent
    selectedField: string | null;
    onSelectField: (fieldName: string) => void;
    className?: string;
    onSelectionChange?: (selectedFields: string[]) => void;
}

export const GovernanceFieldList: React.FC<GovernanceFieldListProps> = ({
    fields,
    semanticProfile,
    selectedField,
    onSelectField,
    className,
    onSelectionChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'decided'>('all');
    const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium'>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Update parent when selection changes
    React.useEffect(() => {
        onSelectionChange?.(Array.from(selectedIds));
    }, [selectedIds, onSelectionChange]);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredFields.length && filteredFields.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredFields.map(f => f.name)));
        }
    };

    const toggleSelect = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedIds);
        if (newSet.has(name)) {
            newSet.delete(name);
        } else {
            newSet.add(name);
        }
        setSelectedIds(newSet);
    };

    // Helper to get field semantic info
    const getFieldInfo = (fieldName: string) => {
        // Try to find in profile fields
        const profileField = semanticProfile?.fields?.find((f: any) => f.fieldName === fieldName || f.name === fieldName);
        return profileField || {};
    };

    const getStatusIcon = (status?: FieldSemanticStatus) => {
        switch (status) {
            case 'DECIDED':
                return <CheckCircle2 size={14} className="text-emerald-500" />;
            case 'SUGGESTED':
                return <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">AI</div>;
            case 'RULE_MATCHED':
                return <div className="w-3.5 h-3.5 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600">R</div>;
            default:
                return null; // No indicator for unprocessed fields
        }
    };

    const getRiskIcon = (level?: RiskLevel) => {
        switch (level) {
            case 'HIGH':
                return <AlertTriangle size={14} className="text-red-500" />;
            case 'MEDIUM':
                return <AlertTriangle size={14} className="text-amber-500" />;
            default:
                return null;
        }
    };

    const filteredFields = useMemo(() => {
        return fields.filter(field => {
            const info = getFieldInfo(field.name);
            const status = info.semanticStatus;
            const risk = info.riskLevel;

            // Search
            const matchesSearch = !searchTerm ||
                ((field.fieldName || field.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (field.comment || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Status Filter
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'decided' && status === 'DECIDED') ||
                (filterStatus === 'pending' && status !== 'DECIDED');

            // Risk Filter
            const matchesRisk = filterRisk === 'all' ||
                (filterRisk === 'high' && risk === 'HIGH') ||
                (filterRisk === 'medium' && risk === 'MEDIUM');

            return matchesSearch && matchesStatus && matchesRisk;
        });
    }, [fields, semanticProfile, searchTerm, filterStatus, filterRisk]);

    const stats = useMemo(() => {
        const total = fields.length;
        const decided = fields.filter(f => getFieldInfo(f.name).semanticStatus === 'DECIDED').length;
        return { total, decided, progress: total > 0 ? Math.round((decided / total) * 100) : 0 };
    }, [fields, semanticProfile]);

    return (
        <div className={`flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full ${className}`}>
            {/* Header - Enhanced with user guidance */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-purple-50/30">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Database size={16} className="text-blue-600" />
                            字段列表
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-blue-500"></span>
                            点击字段行查看详情并进行语义判定
                        </p>
                    </div>
                    <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-white rounded-md border border-slate-200">
                        {stats.decided}/{stats.total}
                    </span>
                </div>
                {/* Progress Bar - Enhanced gradient */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                    <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${stats.progress}%` }}
                    />
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                        type="text"
                        placeholder="搜索字段名/描述..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mt-2">
                    <div className="relative flex-1">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="w-full appearance-none pl-2 pr-6 py-1 text-[10px] border border-slate-200 rounded bg-white text-slate-600 focus:outline-none"
                        >
                            <option value="all">全部状态</option>
                            <option value="pending">待确认</option>
                            <option value="decided">已确认</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                        <select
                            value={filterRisk}
                            onChange={(e) => setFilterRisk(e.target.value as any)}
                            className="w-full appearance-none pl-2 pr-6 py-1 text-[10px] border border-slate-200 rounded bg-white text-slate-600 focus:outline-none"
                        >
                            <option value="all">全部风险</option>
                            <option value="high">高风险</option>
                            <option value="medium">中风险</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* List - Enhanced with better visual feedback */}
            <div className="flex-1 overflow-y-auto">
                {filteredFields.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {filteredFields.map((field, idx) => {
                            const info = getFieldInfo(field.name);
                            const isSelected = selectedField === field.name;
                            const isDecided = info.semanticStatus === 'DECIDED';

                            return (
                                <div
                                    key={field.name}
                                    onClick={() => onSelectField(field.name)}
                                    style={{
                                        borderLeftWidth: '4px',
                                        borderLeftStyle: 'solid',
                                        borderLeftColor: isSelected ? '#2563eb' : isDecided ? '#34d399' : 'transparent'
                                    }}
                                    className={`px-4 py-3 cursor-pointer group transition-all duration-200 ${isSelected
                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50/30 shadow-sm'
                                        : isDecided
                                            ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                                            : 'bg-white hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className={`text-xs font-mono font-medium truncate mb-0.5 ${isSelected ? 'text-blue-700' : 'text-slate-700'
                                                }`}>
                                                {field.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate">
                                                {field.comment || '-'}
                                            </div>
                                        </div>
                                        {/* Status icons on the right */}
                                        <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                                            {getRiskIcon(info.riskLevel)}
                                            {getStatusIcon(info.semanticStatus)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 text-slate-500 truncate max-w-[80px]">
                                            {field.type}
                                        </span>
                                        {info.role && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-50 text-indigo-600 truncate max-w-[80px]">
                                                {ROLE_LABELS[info.role] || info.role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <Search size={24} className="mb-2 opacity-20" />
                        <span className="text-xs">无匹配字段</span>
                    </div>
                )}
            </div>
        </div>
    );
};
