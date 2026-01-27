import { useState, useEffect, useRef } from 'react';
import {
    Layout, Database, GitMerge, CheckCircle, AlertCircle,
    Cpu, Plus, Link, Settings, Sparkles, X, ArrowLeft, ArrowRight, Sparkles, Search, Filter,
    Eye, Bot, Code, Info
} from 'lucide-react';

import { mockDataSources, mockBOTableMappings } from '../data/mockData';

// Helper: Simple Levenshtein Distance
const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

// Helper: Calculate Similarity (0-1)
const getSimilarity = (s1: string, s2: string): number => {
    const longer = s1.length > s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    return (longer.length - levenshtein(s1, s2)) / longer.length;
};

// Common variations mapper (Mock Knowledge Base)
const commonVariations: Record<string, string[]> = {
    'id': ['_id', 'id', 'uuid', 'guid'],
    'name': ['name', 'title', 'label', 'fullname'],
    'code': ['code', 'key', 'no', 'num'],
    'desc': ['description', 'desc', 'remark', 'content'],
    'user': ['user', 'account', 'creator', 'modifier'],
    'time': ['time', 'date', 'at', 'on']
};

// Mock Sample Data for physical columns (Data Profiling)
const mockColumnSamples: Record<string, string[]> = {
    'id': ['1001', '1002', '1003'],
    'p_name': ['张三', '李四', '王五'],
    'name': ['张三', '李四', '王五'],
    'id_card_num': ['110101199001011234', '320102198512255678', '440303199203031111'],
    'birth_ts': ['2024-01-15 08:30:00', '2024-02-20 14:22:00', '2024-03-10 06:45:00'],
    'weight_kg': ['3.25', '3.50', '2.98'],
    'hospital_id': ['H001', 'H002', 'H003'],
    'is_deleted': ['0', '0', '1'],
    'gender': ['M', 'F', 'M'],
    'phone': ['13812345678', '13987654321', '15011112222'],
    'email': ['zhang@test.com', 'li@test.com', 'wang@test.com'],
    'status': ['active', 'inactive', 'pending'],
    'amount': ['199.00', '299.50', '99.99'],
    'created_at': ['2024-01-01', '2024-02-15', '2024-03-20'],
};

// Generate AI explanation for mapping confidence
const getAIMappingExplanation = (boField: string, tblField: string, score: number): string => {
    if (score >= 0.95) {
        return `字段名 '${tblField}' 与 '${boField}' 完全匹配，置信度极高。`;
    } else if (score >= 0.8) {
        return `字段 '${tblField}' 与 '${boField}' 语义相似度高，采样数据类型一致。`;
    } else if (score >= 0.6) {
        return `基于语义分析，'${tblField}' 可能对应 '${boField}'，但建议人工确认。`;
    }
    return `AI 推荐映射，请验证数据采样值。`;
};

// Determine if mapping has transformation
const hasTransformation = (rule: string): boolean => {
    return Boolean(rule && rule !== 'Direct Map' && rule !== '直接映射');
};


interface BOMappingStudioViewProps {
    selectedBO: any;
    showRuleEditor: any;
    setShowRuleEditor: (val: any) => void;
    businessObjects: any[];
    setBusinessObjects: (val: any) => void;
    onBack?: () => void;
}

const BOMappingStudioView = ({ selectedBO, showRuleEditor, setShowRuleEditor, businessObjects, setBusinessObjects, onBack }: BOMappingStudioViewProps) => {
    const [activeBOId, setActiveBOId] = useState(selectedBO?.id || 'BO_NEWBORN');
    const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Visualization Refs & State
    const [connections, setConnections] = useState<any[]>([]);
    const boListRef = useRef<HTMLDivElement>(null);
    const tableListRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [centerWidth, setCenterWidth] = useState(0);

    // Rule Editor State (Local)
    const [localRuleConfig, setLocalRuleConfig] = useState<any>(null);
    const [sampleValue, setSampleValue] = useState<string>('sample_data');
    const [previewValue, setPreviewValue] = useState<string>('sample_data');

    // Efficiency State
    const [boSearchTerm, setBoSearchTerm] = useState('');
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [showUnmappedOnly, setShowUnmappedOnly] = useState(false);
    // Mock Sample Data Generator
    const getSampleData = (type: string) => {
        if (type.includes('int')) return '10086';
        if (type.includes('date')) return '2023-10-01 12:00:00';
        if (type.includes('phone')) return '13812345678';
        if (type.includes('email')) return 'example@test.com';
        return 'Sample Text';
    };

    // Update preview when config changes
    useEffect(() => {
        if (!showRuleEditor) return;

        let transformed = sampleValue;
        const rule = localRuleConfig?.rule || 'Direct Map';

        if (rule === 'Masking') {
            transformed = sampleValue.replace(/^(\d{3})\d+(\d{4})$/, '$1****$2');
            if (sampleValue.includes('@')) { // Email mask
                const [name, domain] = sampleValue.split('@');
                transformed = `${name.substring(0, 2)}***@${domain}`;
            }
        } else if (rule === 'Uppercase') {
            transformed = sampleValue.toUpperCase();
        } else if (rule === 'Date Format') {
            transformed = sampleValue.split(' ')[0]; // Simple logic
        } else if (rule === 'Direct Map') {
            transformed = sampleValue;
        }

        setPreviewValue(transformed);
    }, [localRuleConfig, sampleValue, showRuleEditor]);

    // Initialize Editor
    useEffect(() => {
        if (showRuleEditor) {
            const currentRule = currentMapping?.mappings?.find((m: any) =>
                m.boField === showRuleEditor.boField && m.tblField === showRuleEditor.tblField
            );
            setLocalRuleConfig(currentRule || { rule: 'Direct Map' });

            // Guess data type to generate relevant sample
            const col = selectedTable?.columns?.find((c: any) => c.name === showRuleEditor.tblField);
            if (col) {
                setSampleValue(getSampleData(col.type?.toLowerCase() || 'string'));
            }
        }
    }, [showRuleEditor]);

    // Save Rule
    const handleSaveRule = () => {
        if (!currentMapping || !showRuleEditor) return;

        const newMappings = currentMapping.mappings.map((m: any) => {
            if (m.boField === showRuleEditor.boField && m.tblField === showRuleEditor.tblField) {
                return { ...m, ...localRuleConfig };
            }
            return m;
        });

        setCurrentMapping({ ...currentMapping, mappings: newMappings });
        setShowRuleEditor(null);
    };



    // Mapping State (Mutable)
    const [currentMapping, setCurrentMapping] = useState<any>(null);

    // 数据源树状态
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(mockDataSources[0]?.id || null);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    // Sync activeBOId with selectedBO prop
    useEffect(() => {
        if (selectedBO?.id) {
            setActiveBOId(selectedBO.id);
        }
    }, [selectedBO]);

    // Initialize Mapping State when activeBOId changes
    useEffect(() => {
        let mapping = mockBOTableMappings[activeBOId] || null;

        // Auto-generate if missing
        if (!mapping) {
            const bo = businessObjects.find(b => b.id === activeBOId);
            if (bo && bo.sourceTables && bo.sourceTables.length > 0) {
                const sourceTableName = bo.sourceTables[0];
                mapping = {
                    tableId: sourceTableName,
                    tableName: sourceTableName,
                    source: 'Auto-Generated',
                    mappings: bo.fields ? bo.fields.map((f: any) => ({
                        boField: f.name,
                        tblField: f.code || f.name,
                        rule: 'Direct Map'
                    })) : [],
                    fields: bo.fields ? bo.fields.map((f: any) => ({
                        name: f.code || f.name,
                        type: f.type || 'varchar'
                    })) : []
                };
            }
        }

        if (mapping) {
            // Clone deep to avoid mutating mock data directly if we were using it elsewhere
            setCurrentMapping(JSON.parse(JSON.stringify(mapping)));
        } else {
            setCurrentMapping(null);
        }
    }, [activeBOId, businessObjects]);

    // Auto-scroll to active item
    useEffect(() => {
        if (activeBOId && sidebarRef.current) {
            const activeElement = sidebarRef.current.querySelector(`[data-id="${activeBOId}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeBOId]);

    // Get active BO from businessObjects
    const activeBO = businessObjects.find(bo => bo.id === activeBOId) || businessObjects[0];

    // Get associated table mapping
    // FIXED: Support dynamic mapping from BO sourceTables
    let tableMapping = mockBOTableMappings[activeBOId] || null;
    if (!tableMapping && activeBO && activeBO.sourceTables && activeBO.sourceTables.length > 0) {
        const sourceTableName = activeBO.sourceTables[0];
        // Try to auto-generate mapping for display
        tableMapping = {
            tableId: sourceTableName,
            tableName: sourceTableName,
            source: 'Auto-Generated',
            mappings: activeBO.fields ? activeBO.fields.map((f: any) => ({
                boField: f.name,
                tblField: f.code || f.name,
                rule: 'Direct Map'
            })) : [],
            fields: activeBO.fields ? activeBO.fields.map((f: any) => ({
                name: f.code || f.name,
                type: f.type || 'varchar'
            })) : []
        };
    }

    // Calculate mapping stats
    const totalFields = activeBO?.fields?.length || 0;
    const mappedCount = tableMapping?.mappings?.length || 0;
    const mappingPercentage = totalFields > 0 ? Math.round((mappedCount / totalFields) * 100) : 0;

    // 获取选中的数据源和表
    const selectedDataSource = mockDataSources.find(ds => ds.id === selectedDataSourceId);
    let selectedTable = selectedDataSource?.tables?.find((t: any) => t.id === selectedTableId);

    // Fallback: If table not found in DS tree (e.g. mock data mismatch), try to construct it from mapping
    if (!selectedTable && tableMapping && (tableMapping.tableId === selectedTableId || !selectedTableId)) {
        selectedTable = {
            id: tableMapping.tableId,
            name: tableMapping.tableName,
            columns: tableMapping.fields.map(f => ({ ...f, comment: '' })), // Map fields to columns for display
            comment: 'Mapped Table',
            rows: 'N/A',
            updateTime: '-'
        };
    }

    // Effect: Calculate connections on update/scroll
    const calculateConnections = () => {
        if (!currentMapping || !boListRef.current || !tableListRef.current || !svgRef.current) return;

        const svgRect = svgRef.current.getBoundingClientRect();
        const newConnections: any[] = [];

        currentMapping.mappings.forEach((m: any) => {
            const boEl = boListRef.current?.querySelector(`[data-field="${m.boField}"]`);
            const tblEl = tableListRef.current?.querySelector(`[data-col="${m.tblField}"]`);

            if (boEl && tblEl) {
                const boRect = boEl.getBoundingClientRect();
                const tblRect = tblEl.getBoundingClientRect();

                // Calculate coordinates relative to SVG
                const x1 = 0;
                const y1 = boRect.top - svgRect.top + boRect.height / 2;
                const x2 = svgRect.width;
                const y2 = tblRect.top - svgRect.top + tblRect.height / 2;

                // Control points for bezier curve
                const c1x = x2 * 0.4;
                const c1y = y1;
                const c2x = x2 * 0.6;
                const c2y = y2;

                newConnections.push({
                    id: `${m.boField}-${m.tblField}`,
                    path: `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`,
                    rule: m.rule,
                    xMid: (x1 + x2) / 2,
                    yMid: (y1 + y2) / 2,
                    boField: m.boField,
                    tblField: m.tblField
                });
            }
        });
        setConnections(newConnections);
        setCenterWidth(svgRect.width);
    };

    // Recalculate when dependencies change
    useEffect(() => {
        // Debounce slightly or run immediately
        requestAnimationFrame(calculateConnections);
    }, [activeBOId, selectedTableId, currentMapping, activeBO, selectedTable]);

    // Listen to scroll events
    useEffect(() => {
        const boList = boListRef.current;
        const tableList = tableListRef.current;

        if (boList) boList.addEventListener('scroll', calculateConnections);
        if (tableList) tableList.addEventListener('scroll', calculateConnections);
        // Also window resize
        window.addEventListener('resize', calculateConnections);

        return () => {
            if (boList) boList.removeEventListener('scroll', calculateConnections);
            if (tableList) tableList.removeEventListener('scroll', calculateConnections);
            window.removeEventListener('resize', calculateConnections);
        };
    }, []);

    // Drag & Drop Handlers
    const handleDragStart = (e: React.DragEvent, colName: string) => {
        e.dataTransfer.setData('text/plain', colName);
        e.dataTransfer.effectAllowed = 'link';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
    };

    const handleDrop = (e: React.DragEvent, boField: string) => {
        e.preventDefault();
        const tblField = e.dataTransfer.getData('text/plain');
        if (!tblField || !currentMapping) return;

        // Update Mapping State
        const existingIndex = currentMapping.mappings.findIndex((m: any) => m.boField === boField);
        const newMapping = { boField, tblField, rule: 'Direct Map' };

        let newMappings = [...currentMapping.mappings];
        if (existingIndex >= 0) {
            newMappings[existingIndex] = newMapping; // Replace existing
        } else {
            newMappings.push(newMapping); // Add new
        }

        setCurrentMapping({ ...currentMapping, mappings: newMappings });
    };



    // Smart Auto-Map Logic
    const handleSmartMap = () => {
        if (!currentMapping || !activeBO || !selectedTable) return;

        const newMappings = [...currentMapping.mappings];
        const unmappedFields = activeBO.fields.filter((f: any) =>
            !newMappings.find((m: any) => m.boField === f.name)
        );

        let matchCount = 0;

        unmappedFields.forEach((boField: any) => {
            let bestMatch: any = null;
            let bestScore = 0;

            // 1. Exact Match (Case Insensitive)
            const exactMatch = selectedTable.columns.find((c: any) =>
                c.name.toLowerCase() === boField.name.toLowerCase() ||
                c.name.toLowerCase() === (boField.code || '').toLowerCase()
            );

            if (exactMatch) {
                bestMatch = exactMatch;
                bestScore = 1.0;
            } else {
                // 2. Fuzzy Match & Semantic Variations
                selectedTable.columns.forEach((col: any) => {
                    let score = getSimilarity(boField.name.toLowerCase(), col.name.toLowerCase());

                    // Boost if matches semantic variations
                    for (const key in commonVariations) {
                        if (boField.name.toLowerCase().includes(key)) {
                            if (commonVariations[key].some(v => col.name.toLowerCase().includes(v))) {
                                score += 0.3; // Boost score
                            }
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = col;
                    }
                });
            }

            // Threshold for acceptance
            if (bestMatch && bestScore > 0.6) {
                newMappings.push({
                    boField: boField.name,
                    tblField: bestMatch.name,
                    rule: bestScore < 1.0 ? 'Smart Map' : 'Direct Map', // Tag as smart map
                    score: bestScore
                });
                matchCount++;
            }
        });

        if (matchCount > 0) {
            setCurrentMapping({ ...currentMapping, mappings: newMappings });
            // Ideally show a toast here
            console.log(`Auto-mapped ${matchCount} fields`);
        }
    };
    useEffect(() => {
        if (!activeBOId) return;

        // 1. Try static mapping first
        const mapping = mockBOTableMappings[activeBOId];
        let targetTableId: string | null = null;
        let targetTableName: string | null = null;

        if (mapping) {
            targetTableId = mapping.tableId;
            targetTableName = mapping.tableName;
        } else if (activeBO && activeBO.sourceTables && activeBO.sourceTables.length > 0) {
            // 2. Try dynamic generation from BO sourceTables
            targetTableName = activeBO.sourceTables[0];
            // We might not have the ID, so we'll rely on name matching
        }

        if (targetTableId || targetTableName) {
            // Try to find the table in data sources
            let found = false;
            for (const ds of mockDataSources) {
                const table = ds.tables?.find((t: any) =>
                    (targetTableId && t.id === targetTableId) ||
                    (targetTableName && t.name === targetTableName)
                );

                if (table) {
                    setSelectedDataSourceId(ds.id);
                    setSelectedTableId(table.id);
                    found = true;
                    break;
                }
            }

            // If not found in DS tree (but we have a name), relies on fallback logic in render
            if (!found) {
                // If we have a table name/id but couldn't find it in DS, 
                // we set the ID so the fallback logic can construct a display object
                setSelectedTableId(targetTableId || targetTableName || null);
            }
        } else {
            // No mapping, clear selection
            setSelectedTableId(null);
        }
    }, [activeBOId, activeBO]);

    // Handle One-Click Generate
    const handleGenerateClick = () => {
        if (!activeBO || !selectedTable) return;
        setShowGenerateConfirm(true);
    };

    const confirmGenerateFields = () => {
        if (!activeBO || !selectedTable) return;

        // Generate fields from physical columns
        const newFields = selectedTable.columns.map((col: any) => ({
            id: col.name,
            name: col.comment || col.name,
            code: col.name,
            type: col.type,
            required: false,
            bg: col.name.includes('id') || col.name.includes('key'), // Simple heuristic
            isPrimary: col.name === 'id' || col.name.endsWith('_id')
        }));

        // Update Business Object
        const updatedBO = { ...activeBO, fields: newFields };

        // Update state
        if (setBusinessObjects) {
            setBusinessObjects(businessObjects.map(bo => bo.id === activeBO.id ? updatedBO : bo));
        }

        // Mock creating mapping (since we can't write to mock file, we simulate update visually or assume fields match)
        // In a real app, we would also create the mapping record here.
        setShowGenerateConfirm(false);
    };


    return (
        <div className="h-full flex animate-fade-in gap-3">


            {/* 中间: BO选择器 */}
            <div className="w-56 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-700">业务对象</h3>
                    <p className="text-[10px] text-slate-400 mt-1">选择要映射的对象</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2" ref={sidebarRef}>
                    {businessObjects.map(bo => {
                        const boMapping = mockBOTableMappings[bo.id];
                        const boMappedCount = boMapping?.mappings?.length || 0;
                        const boTotalFields = bo.fields?.length || 0;
                        const hasMapping = boMappedCount > 0;

                        return (
                            <div
                                key={bo.id}
                                data-id={bo.id}
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
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                                title="返回"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <GitMerge className="text-purple-600" size={20} />
                                语义映射工作台
                            </h2>
                            <p className="text-xs text-slate-500">
                                {activeBO?.name} → {selectedTable?.name || tableMapping?.tableName || '选择物理表'}
                            </p>
                        </div>
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
                            <div className="text-xs text-blue-100 font-mono mt-1">{activeBO?.code}</div>
                        </div>
                        {/* Search & Filter Toolbar */}
                        <div className="p-2 border-b border-slate-100 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-1.5 text-slate-400" size={12} />
                                <input
                                    type="text"
                                    placeholder="搜索字段..."
                                    value={boSearchTerm}
                                    onChange={(e) => setBoSearchTerm(e.target.value)}
                                    className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <button
                                onClick={() => setShowUnmappedOnly(!showUnmappedOnly)}
                                title={showUnmappedOnly ? "显示所有字段" : "仅显示未映射字段"}
                                className={`p-1 rounded-md border transition-colors ${showUnmappedOnly ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                            >
                                <Filter size={12} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2" ref={boListRef}>
                            {activeBO?.fields?.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-xs mt-4">
                                    <AlertCircle size={20} className="mx-auto mb-2 opacity-30" />
                                    暂无业务字段
                                </div>
                            )}
                            {activeBO?.fields?.filter((field: any) => {
                                const matchesSearch = field.name.toLowerCase().includes(boSearchTerm.toLowerCase());
                                const mapping = currentMapping?.mappings?.find((m: any) => m.boField === field.name);
                                const matchesFilter = !showUnmappedOnly || !mapping;
                                return matchesSearch && matchesFilter;
                            }).map((field: any, idx: number) => {
                                const mapping = currentMapping?.mappings?.find((m: any) => m.boField === field.name);
                                return (
                                    <div
                                        key={idx}
                                        data-field={field.name}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, field.name)}
                                        className={`flex items-center justify-between p-3 mb-2 rounded-lg border transition-all text-xs relative group ${mapping ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-slate-700">{field.name}</span>
                                                {field.required && <span className="text-red-500">*</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">{field.type}</div>
                                        </div>
                                        {/* Connector Dot */}
                                        <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white ${mapping ? 'bg-emerald-500' : 'bg-slate-300 group-hover:bg-blue-400'} cursor-pointer transition-colors shadow-sm`} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 中间: 映射可视化画布 */}
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        {/* Toolbar */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                            <button
                                onClick={handleSmartMap}
                                className="px-3 py-1.5 bg-white/90 backdrop-blur border border-indigo-200 text-indigo-600 rounded-full shadow-sm hover:bg-indigo-50 hover:shadow-md transition-all flex items-center gap-1.5 text-xs font-medium"
                            >
                                <Sparkles size={12} />
                                智能匹配
                            </button>
                        </div>

                        {/* SVG Canvas Layer */}
                        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.5 }} />
                                    <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.5 }} />
                                </linearGradient>
                                <linearGradient id="gradAI" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.7 }} />
                                    <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.7 }} />
                                </linearGradient>
                            </defs>
                            {connections.map(conn => {
                                const mapping = currentMapping?.mappings?.find((m: any) =>
                                    m.boField === conn.boField && m.tblField === conn.tblField
                                );
                                const isAIGenerated = mapping?.rule === 'Smart Map' || mapping?.score !== undefined;
                                const isTransformed = hasTransformation(mapping?.rule || '');
                                const confidence = mapping?.score ? Math.round(mapping.score * 100) : null;

                                return (
                                    <g key={conn.id}>
                                        <path
                                            d={conn.path}
                                            stroke={isAIGenerated ? 'url(#gradAI)' : 'url(#grad1)'}
                                            strokeWidth={isTransformed ? 3 : 2}
                                            strokeDasharray={isAIGenerated ? '8,4' : 'none'}
                                            fill="none"
                                            className="transition-all duration-300"
                                        />
                                        {/* Action Button on Line */}
                                        <foreignObject x={conn.xMid - 12} y={conn.yMid - 12} width="24" height="24" className="overflow-visible pointer-events-auto">
                                            <button
                                                onClick={() => setShowRuleEditor({ boField: conn.boField, tblField: conn.tblField })}
                                                className={`w-6 h-6 rounded-full bg-white border text-slate-400 hover:text-purple-600 hover:border-purple-300 hover:shadow-md flex items-center justify-center transition-all ${isTransformed ? 'border-amber-400 text-amber-500' : 'border-slate-200'
                                                    }`}
                                                title={isTransformed ? '包含转换逻辑' : '直接映射'}
                                            >
                                                {isTransformed ? <Code size={12} /> : <Settings size={12} />}
                                            </button>
                                        </foreignObject>
                                        {/* AI Confidence Badge */}
                                        {isAIGenerated && confidence && (
                                            <foreignObject x={conn.xMid + 16} y={conn.yMid - 10} width="60" height="20" className="overflow-visible pointer-events-auto">
                                                <div
                                                    className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 border border-purple-200 rounded-full text-[10px] text-purple-700 font-medium cursor-help"
                                                    title={getAIMappingExplanation(conn.boField, conn.tblField, mapping?.score || 0)}
                                                >
                                                    <Bot size={10} />
                                                    {confidence}%
                                                </div>
                                            </foreignObject>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Empty/Action States (Rendered below SVG) */}
                        <div className="absolute inset-0 flex items-center justify-center z-0">
                            {(!tableMapping || tableMapping.mappings.length === 0) && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                        <GitMerge size={32} />
                                    </div>
                                    <p className="text-slate-500 font-medium text-sm">暂无映射关系</p>

                                    {activeBO?.fields?.length === 0 && selectedTable ? (
                                        <div className="mt-4 flex flex-col gap-2">
                                            <button
                                                onClick={handleGenerateClick}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto text-xs font-bold"
                                            >
                                                <Sparkles size={14} className="text-yellow-300" />
                                                一键生成业务字段
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="mt-3 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 mx-auto text-xs">
                                            <Plus size={14} /> 添加映射 (拖拽连线)
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
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
                        {/* Search Toolbar */}
                        <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-2 top-1.5 text-slate-400" size={12} />
                                <input
                                    type="text"
                                    placeholder="搜索物理字段..."
                                    value={tableSearchTerm}
                                    onChange={(e) => setTableSearchTerm(e.target.value)}
                                    className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2" ref={tableListRef}>
                            {selectedTable?.columns?.filter((col: any) => col.name.toLowerCase().includes(tableSearchTerm.toLowerCase())).map((col: any, idx: number) => {
                                const mapping = currentMapping?.mappings?.find((m: any) => m.tblField === col.name);
                                const sampleData = mockColumnSamples[col.name] || mockColumnSamples[col.name.toLowerCase()] || ['—', '—', '—'];

                                return (
                                    <div
                                        key={idx}
                                        data-col={col.name}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, col.name)}
                                        className={`flex items-center justify-between p-3 mb-2 rounded-lg border transition-all text-xs relative group cursor-grab active:cursor-grabbing ${mapping ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
                                    >
                                        {/* Connector Dot */}
                                        <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white ${mapping ? 'bg-emerald-500' : 'bg-slate-300 group-hover:bg-emerald-400'} cursor-pointer transition-colors shadow-sm`} />

                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-slate-700 flex items-center gap-1">
                                                {col.name}
                                                {/* Data Preview Icon with Tooltip */}
                                                <div className="relative ml-1">
                                                    <Eye size={12} className="text-slate-300 group-hover:text-emerald-500 cursor-help transition-colors" />
                                                    {/* Sample Data Tooltip */}
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                                                        <div className="bg-slate-800 text-white text-[10px] px-2.5 py-2 rounded-lg shadow-xl min-w-[120px] whitespace-nowrap">
                                                            <div className="text-slate-400 text-[9px] font-medium mb-1.5 flex items-center gap-1">
                                                                <Database size={10} />
                                                                采样数据 Top 3
                                                            </div>
                                                            <div className="space-y-1">
                                                                {sampleData.slice(0, 3).map((val: string, i: number) => (
                                                                    <div key={i} className="font-mono text-emerald-300 truncate max-w-[150px]">
                                                                        "{val}"
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {/* Arrow */}
                                                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-400">{col.comment} · {col.type}</div>
                                        </div>
                                        {mapping && <CheckCircle size={14} className="text-emerald-500" />}
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



            {/* Quick Rule Editor Modal */}
            {showRuleEditor && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Settings size={18} className="text-purple-600" />
                                映射规则配置
                            </h3>
                            <button onClick={() => setShowRuleEditor(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Context Info */}
                            <div className="flex items-center gap-4 text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex-1 text-center border-r border-slate-200 pr-4">
                                    <div className="text-slate-400 text-xs mb-1">源字段 (物理表)</div>
                                    <div className="font-mono font-medium text-slate-700">{showRuleEditor.tblField}</div>
                                </div>
                                <div className="text-purple-400"><ArrowRight size={16} /></div>
                                <div className="flex-1 text-center pl-4">
                                    <div className="text-slate-400 text-xs mb-1">目标字段 (业务对象)</div>
                                    <div className="font-medium text-slate-700">{showRuleEditor.boField}</div>
                                </div>
                            </div>

                            {/* Rule Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">转换规则</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Direct Map', 'Masking', 'Uppercase', 'Date Format', 'Lookup'].map(rule => (
                                        <button
                                            key={rule}
                                            onClick={() => setLocalRuleConfig({ ...localRuleConfig, rule })}
                                            className={`px-3 py-2 text-xs rounded-lg border text-left transition-all ${localRuleConfig?.rule === rule
                                                ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold ring-1 ring-purple-200'
                                                : 'bg-white border-slate-200 hover:border-purple-300'}`}
                                        >
                                            {rule}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono">
                                <div className="flex justify-between items-center mb-2 text-slate-400 border-b border-slate-700 pb-2">
                                    <span>规则预览</span>
                                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">Live Preview</span>
                                </div>
                                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                                    <div>
                                        <div className="text-[10px] text-slate-500 mb-1">Input Sample</div>
                                        <div className="text-slate-300 truncate">{sampleValue}</div>
                                    </div>
                                    <div className="text-purple-500"><ArrowRight size={14} /></div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 mb-1">Output Result</div>
                                        <div className="text-green-400 font-bold truncate">{previewValue}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button
                                onClick={() => setShowRuleEditor(null)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
                            >取消</button>
                            <button
                                onClick={handleSaveRule}
                                className="px-6 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm font-medium"
                            >
                                保存规则
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {
                showGenerateConfirm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
                        <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-scale-in">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Sparkles size={18} className="text-purple-600" />
                                    确认生成字段
                                </h3>
                                <button
                                    onClick={() => setShowGenerateConfirm(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                        <AlertCircle size={20} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            确定要从物理表 <span className="font-bold text-slate-800">{selectedTable?.name}</span> 生成业务字段吗？
                                        </p>
                                        <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded border border-red-100">
                                            注意：这将覆盖当前业务对象 "{activeBO?.name}" 的所有现有字段（如有）。
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowGenerateConfirm(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={confirmGenerateFields}
                                    className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors font-medium"
                                >
                                    确定生成
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default BOMappingStudioView;
