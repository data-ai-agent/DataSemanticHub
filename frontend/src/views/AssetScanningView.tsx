import { useState } from 'react';
import { Scan, Database, Table, Search, RefreshCw, Sparkles, X, ChevronRight, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ScanAsset {
    id: string;
    name: string;
    comment: string;
    rows: string;
    updateTime: string;
    status: 'new' | 'changed' | 'synced';
    sourceId: string;
    sourceName: string;
    sourceType: string;
    columns: { name: string; type: string; comment: string; nullable: boolean; isPK: boolean }[];
}

interface AssetScanningViewProps {
    onNavigate?: (module: string) => void;
    onAddScanResults?: (results: any[]) => void;
}

const AssetScanningView = ({ onNavigate, onAddScanResults }: AssetScanningViewProps) => {
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [viewingTable, setViewingTable] = useState<ScanAsset | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'changed' | 'synced'>('all');
    const [selectedSource, setSelectedSource] = useState<string>('all');

    // 模拟数据源
    const dataSources = [
        { id: 'DS_001', name: '卫健委_前置库_01', type: 'MySQL' },
        { id: 'DS_002', name: '市人口库_主库', type: 'Oracle' },
        { id: 'DS_003', name: '政务数据中心', type: 'PostgreSQL' }
    ];

    // 模拟扫描资产数据
    const [scanAssets, setScanAssets] = useState<ScanAsset[]>([
        {
            id: 'TBL_001',
            name: 't_pop_base_info',
            comment: '人口基础信息表',
            rows: '1.2M',
            updateTime: '2024-05-20 10:00',
            status: 'synced',
            sourceId: 'DS_001',
            sourceName: '卫健委_前置库_01',
            sourceType: 'MySQL',
            columns: [
                { name: 'id', type: 'bigint', comment: '主键ID', nullable: false, isPK: true },
                { name: 'name', type: 'varchar(50)', comment: '姓名', nullable: false, isPK: false },
                { name: 'id_card', type: 'varchar(18)', comment: '身份证号', nullable: false, isPK: false },
                { name: 'dob', type: 'datetime', comment: '出生日期', nullable: true, isPK: false },
                { name: 'gender', type: 'tinyint', comment: '性别(1男2女)', nullable: true, isPK: false },
                { name: 'phone', type: 'varchar(20)', comment: '联系电话', nullable: true, isPK: false },
                { name: 'address', type: 'varchar(200)', comment: '联系地址', nullable: true, isPK: false },
                { name: 'create_time', type: 'datetime', comment: '创建时间', nullable: false, isPK: false },
                { name: 'update_time', type: 'datetime', comment: '更新时间', nullable: true, isPK: false }
            ]
        },
        {
            id: 'TBL_002',
            name: 't_med_birth_cert',
            comment: '出生医学证明记录',
            rows: '450K',
            updateTime: '2024-05-19 15:30',
            status: 'new',
            sourceId: 'DS_001',
            sourceName: '卫健委_前置库_01',
            sourceType: 'MySQL',
            columns: [
                { name: 'cert_id', type: 'varchar(32)', comment: '证明编号', nullable: false, isPK: true },
                { name: 'baby_name', type: 'varchar(50)', comment: '新生儿姓名', nullable: false, isPK: false },
                { name: 'baby_gender', type: 'tinyint', comment: '新生儿性别', nullable: false, isPK: false },
                { name: 'birth_date', type: 'datetime', comment: '出生日期', nullable: false, isPK: false },
                { name: 'birth_weight', type: 'decimal(5,2)', comment: '出生体重(kg)', nullable: true, isPK: false },
                { name: 'mother_name', type: 'varchar(50)', comment: '母亲姓名', nullable: false, isPK: false },
                { name: 'mother_id_card', type: 'varchar(18)', comment: '母亲身份证', nullable: false, isPK: false },
                { name: 'hospital_code', type: 'varchar(20)', comment: '医院编码', nullable: false, isPK: false },
                { name: 'issue_date', type: 'datetime', comment: '签发日期', nullable: false, isPK: false }
            ]
        },
        {
            id: 'TBL_003',
            name: 't_vac_record',
            comment: '疫苗接种记录',
            rows: '3.5M',
            updateTime: '2024-05-21 08:15',
            status: 'changed',
            sourceId: 'DS_001',
            sourceName: '卫健委_前置库_01',
            sourceType: 'MySQL',
            columns: [
                { name: 'record_id', type: 'bigint', comment: '记录ID', nullable: false, isPK: true },
                { name: 'child_id', type: 'varchar(32)', comment: '儿童ID', nullable: false, isPK: false },
                { name: 'vaccine_code', type: 'varchar(20)', comment: '疫苗编码', nullable: false, isPK: false },
                { name: 'vaccine_name', type: 'varchar(100)', comment: '疫苗名称', nullable: false, isPK: false },
                { name: 'inject_date', type: 'datetime', comment: '接种日期', nullable: false, isPK: false },
                { name: 'dose_no', type: 'int', comment: '剂次', nullable: false, isPK: false },
                { name: 'inject_org', type: 'varchar(100)', comment: '接种机构', nullable: true, isPK: false }
            ]
        },
        {
            id: 'TBL_004',
            name: 't_identity_verify',
            comment: '身份验证日志',
            rows: '8.7M',
            updateTime: '2024-05-21 10:30',
            status: 'synced',
            sourceId: 'DS_002',
            sourceName: '市人口库_主库',
            sourceType: 'Oracle',
            columns: [
                { name: 'log_id', type: 'number(20)', comment: '日志ID', nullable: false, isPK: true },
                { name: 'id_card', type: 'varchar2(18)', comment: '身份证号', nullable: false, isPK: false },
                { name: 'verify_time', type: 'timestamp', comment: '验证时间', nullable: false, isPK: false },
                { name: 'verify_result', type: 'number(1)', comment: '验证结果', nullable: false, isPK: false },
                { name: 'source_system', type: 'varchar2(50)', comment: '来源系统', nullable: true, isPK: false }
            ]
        },
        {
            id: 'TBL_005',
            name: 't_hosp_info',
            comment: '医院机构信息',
            rows: '2.3K',
            updateTime: '2024-05-18 14:20',
            status: 'synced',
            sourceId: 'DS_001',
            sourceName: '卫健委_前置库_01',
            sourceType: 'MySQL',
            columns: [
                { name: 'hosp_code', type: 'varchar(20)', comment: '医院编码', nullable: false, isPK: true },
                { name: 'hosp_name', type: 'varchar(100)', comment: '医院名称', nullable: false, isPK: false },
                { name: 'hosp_level', type: 'varchar(10)', comment: '医院等级', nullable: true, isPK: false },
                { name: 'address', type: 'varchar(200)', comment: '医院地址', nullable: true, isPK: false },
                { name: 'contact', type: 'varchar(50)', comment: '联系方式', nullable: true, isPK: false }
            ]
        }
    ]);

    const statusConfigs = {
        new: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'New', icon: AlertCircle },
        changed: { color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Changed', icon: RefreshCw },
        synced: { color: 'text-slate-500', bgColor: 'bg-slate-100', label: 'Synced', icon: CheckCircle }
    };

    const filteredAssets = scanAssets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.comment.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
        const matchesSource = selectedSource === 'all' || asset.sourceId === selectedSource;
        return matchesSearch && matchesStatus && matchesSource;
    });

    const handleSelectAll = () => {
        if (selectedTables.length === filteredAssets.length) {
            setSelectedTables([]);
        } else {
            setSelectedTables(filteredAssets.map(a => a.name));
        }
    };

    const handleToggleSelect = (tableName: string) => {
        setSelectedTables(prev =>
            prev.includes(tableName)
                ? prev.filter(n => n !== tableName)
                : [...prev, tableName]
        );
    };

    const handleScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            // 模拟扫描发现新表
            const newAsset: ScanAsset = {
                id: `TBL_${Date.now()}`,
                name: 't_newborn_archive_2024',
                comment: '2024年新生儿归档表',
                rows: '125K',
                updateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
                status: 'new',
                sourceId: 'DS_001',
                sourceName: '卫健委_前置库_01',
                sourceType: 'MySQL',
                columns: [
                    { name: 'archive_id', type: 'bigint', comment: '归档ID', nullable: false, isPK: true },
                    { name: 'newborn_id', type: 'varchar(32)', comment: '新生儿ID', nullable: false, isPK: false },
                    { name: 'archive_date', type: 'datetime', comment: '归档日期', nullable: false, isPK: false }
                ]
            };
            setScanAssets(prev => [...prev, newAsset]);
            setIsScanning(false);
        }, 2000);
    };

    const handleGenerateCandidates = () => {
        if (selectedTables.length === 0) {
            alert('请先选择至少一个物理表进行分析。');
            return;
        }

        // 添加选中的表到扫描结果
        const selectedAssets = scanAssets.filter(a => selectedTables.includes(a.name));
        if (onAddScanResults) {
            const results = selectedAssets.map(asset => ({
                table: asset.name,
                comment: asset.comment,
                sourceType: asset.sourceType,
                confidence: Math.floor(Math.random() * 20) + 80,
                status: 'scanned',
                aiSuggestion: `建议: ${asset.comment.replace('表', '')}`,
                fields: asset.columns.map(col => ({
                    name: col.name,
                    type: col.type,
                    comment: col.comment,
                    suggestion: col.comment
                }))
            }));
            onAddScanResults(results);
        }

        if (onNavigate) {
            onNavigate('bu_candidates');
        }
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
                    <p className="text-slate-500 mt-1">扫描数据源，发现物理资产，为语义分析提供原始数据</p>
                </div>
                <div className="flex gap-3">
                    {selectedTables.length > 0 && (
                        <button
                            onClick={handleGenerateCandidates}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm shadow-purple-200 transition-colors animate-pulse"
                        >
                            <Sparkles size={16} />
                            为 {selectedTables.length} 个表生成候选
                        </button>
                    )}
                    <button
                        onClick={handleScan}
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

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">发现表总数</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{scanAssets.length}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <Table size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">新发现</p>
                            <h3 className="text-2xl font-bold text-blue-600 mt-1">
                                {scanAssets.filter(a => a.status === 'new').length}
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">有变更</p>
                            <h3 className="text-2xl font-bold text-orange-600 mt-1">
                                {scanAssets.filter(a => a.status === 'changed').length}
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                            <RefreshCw size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-medium">已选中</p>
                            <h3 className="text-2xl font-bold text-purple-600 mt-1">{selectedTables.length}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
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
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        {(['all', 'new', 'changed', 'synced'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === status
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {status === 'all' ? '全部' : statusConfigs[status].label}
                                <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                    {status === 'all'
                                        ? scanAssets.length
                                        : scanAssets.filter(a => a.status === status).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">扫描结果</h3>
                    <span className="text-xs text-slate-500">
                        显示 {filteredAssets.length} 个表
                    </span>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedTables.length === filteredAssets.length && filteredAssets.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-slate-300"
                                />
                            </th>
                            <th className="px-6 py-3 text-slate-600 font-medium">物理表名</th>
                            <th className="px-6 py-3 text-slate-600 font-medium">中文注释</th>
                            <th className="px-6 py-3 text-slate-600 font-medium">数据源</th>
                            <th className="px-6 py-3 text-slate-600 font-medium">数据量</th>
                            <th className="px-6 py-3 text-slate-600 font-medium">状态</th>
                            <th className="px-6 py-3 text-slate-600 font-medium">更新时间</th>
                            <th className="px-6 py-3 text-right text-slate-600 font-medium">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAssets.map(asset => {
                            const statusConfig = statusConfigs[asset.status];
                            const StatusIcon = statusConfig.icon;
                            const isSelected = selectedTables.includes(asset.name);

                            return (
                                <tr
                                    key={asset.id}
                                    className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleSelect(asset.name)}
                                            className="rounded border-slate-300"
                                        />
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
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                                            <StatusIcon size={12} />
                                            {statusConfig.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Clock size={12} />
                                            {asset.updateTime}
                                        </div>
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

                {filteredAssets.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <Database size={48} className="mx-auto mb-4 opacity-20" />
                        <p>没有匹配的表</p>
                        <p className="text-xs mt-1">尝试调整筛选条件或执行新的扫描</p>
                    </div>
                )}
            </div>

            {/* Table Details Slide-out */}
            {viewingTable && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
                    <div className="w-[550px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                            <div>
                                <h3 className="text-xl font-bold mb-1 font-mono">{viewingTable.name}</h3>
                                <p className="text-emerald-100 text-sm">{viewingTable.comment}</p>
                                <div className="flex items-center gap-3 mt-3 text-xs">
                                    <span className="bg-white/20 px-2 py-0.5 rounded">{viewingTable.sourceType}</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded">行数: {viewingTable.rows}</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded">{viewingTable.columns.length} 字段</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingTable(null)}
                                className="text-white/80 hover:text-white hover:bg-white/20 rounded p-1 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Table size={16} />
                                    字段结构 ({viewingTable.columns.length})
                                </h4>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                            <tr>
                                                <th className="px-3 py-2">字段名</th>
                                                <th className="px-3 py-2">类型</th>
                                                <th className="px-3 py-2">注释</th>
                                                <th className="px-3 py-2 text-center">约束</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {viewingTable.columns.map((col, i) => (
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
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700">数据源信息</h4>
                                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">数据源:</span>
                                        <span className="text-slate-700 font-medium">{viewingTable.sourceName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">数据库类型:</span>
                                        <span className="text-slate-700 font-medium">{viewingTable.sourceType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">最后更新:</span>
                                        <span className="text-slate-700">{viewingTable.updateTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <button
                                onClick={() => setViewingTable(null)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                关闭
                            </button>
                            <button
                                onClick={() => {
                                    if (!selectedTables.includes(viewingTable.name)) {
                                        setSelectedTables([...selectedTables, viewingTable.name]);
                                    }
                                    setViewingTable(null);
                                }}
                                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 shadow-sm shadow-purple-200 transition-colors"
                            >
                                <Sparkles size={14} />
                                选中并生成候选
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetScanningView;
