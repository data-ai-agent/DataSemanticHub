import { useState, useRef, useMemo, useEffect } from 'react';
import { Sparkles, Activity, CheckCircle, ChevronDown, ChevronRight, Bot, AlertTriangle, ArrowLeft, RefreshCw, Table, Share2, Layers, Shield, Database, Search, Settings, Filter, Plus, FileText, Key, Hash, CheckCircle2, XCircle, Info, PanelLeftOpen, PanelLeftClose, Server, Clock, Edit3, X, Box, ListPlus, Cpu, Star, Tag, ShieldCheck, AlertCircle, Wand2, ArrowRight } from 'lucide-react';
import { TableSemanticProfile, GovernanceStatus, ReviewStats, RunSummary, TableSemanticStage, FieldSemanticStatus } from '../types/semantic';
import { ReadOnlyBadge } from '../components/common/ReadOnlyBadge';
import { useVersionContext } from '../contexts/VersionContext';
import { analyzeSingleTable, resolveGovernanceStatus, normalizeFields, buildReviewStats, checkGatekeeper, analyzeField, calculateTableRuleScore, calculateFusionScore } from './semantic/logic';
import { SemanticAnalysisCard } from './semantic/SemanticAnalysisCard';
import { SemanticConclusionCard } from './semantic/SemanticConclusionCard';
import { DeepAnalysisTabs } from './semantic/DeepAnalysisTabs';
import { GateFailureAlertCard } from './semantic/components/GateFailureAlertCard';
import { SemanticHeader, PageMode } from './semantic/components/SemanticHeader';
import { GovernanceFieldList } from './semantic/components/GovernanceFieldList';
import { SemanticDecisionPanel } from './semantic/components/SemanticDecisionPanel';
import { GovernanceTopBar } from './semantic/components/GovernanceTopBar';
import { SemanticContextPanel } from './semantic/components/SemanticContextPanel';
import { typeConfig, getGovernanceDisplay, GovernanceDisplay, runStatusLabelMap, runStatusToneMap, semanticStageLabelMap, semanticStageToneMap } from './semantic/utils';
import { UpgradeSuggestionCard, generateUpgradeSuggestion } from './semantic/UpgradeSuggestionCard';
import { OverviewTab } from './semantic/tabs/OverviewTab';
import { EvidenceTab } from './semantic/tabs/EvidenceTab';
import { LogsTab } from './semantic/tabs/LogsTab';
import { RelationshipGraphTab } from './semantic/tabs/RelationshipGraphTab';
import { BatchOperationBar } from './semantic/components/BatchOperationBar';
import { AnalysisProgressPanel } from './semantic/AnalysisProgressPanel';
import { StreamingProgressPanel } from './semantic/StreamingProgressPanel';
import { mockBOTableMappings } from '../data/mockData';
import { useSemanticProfile, emptyProfile } from './semantic/hooks/useSemanticProfile';
import { useBatchOperations } from './semantic/hooks/useBatchOperations';
import { BatchSemanticConfigModal, BatchSemanticConfig } from './semantic/components/BatchSemanticConfigModal';
import { BatchSemanticRunningModal } from './semantic/components/BatchSemanticRunningModal';
import { BatchSemanticResultModal } from './semantic/components/BatchSemanticResultModal';
import { SemanticAssistBatchModal } from './semantic/components/SemanticAssistBatchModal';
import { SemanticAssistBatchRunConfig, DEFAULT_SEMANTIC_ASSIST, SemanticAssist } from '../types/semanticAssist';
import { SemanticAssistBar } from './semantic/components/SemanticAssistBar';
import { TemplateExplanationDrawer } from './semantic/components/TemplateExplanationDrawer';
import { SemanticAssistConfigPanel } from './semantic/components/SemanticAssistConfigPanel';

// New Components for v2.4 Presentation
import { SemanticSummary } from './semantic/components/SemanticSummary';
import { ObjectView } from './semantic/components/ObjectView/ObjectView';
import { RelationView } from './semantic/components/RelationView/RelationView';
import { ViewSwitcher } from './semantic/components/ViewSwitcher';


interface DataSemanticUnderstandingViewProps {
    scanResults: any[];
    setScanResults: (fn: (prev: any[]) => any[]) => void;
    candidateResults?: any[];
    setCandidateResults?: (fn: (prev: any[]) => any[]) => void;
    businessObjects?: any[];
    setBusinessObjects?: (fn: (prev: any[]) => any[]) => void;
    setActiveModule?: (module: string) => void;
    initialState?: {
        tableId?: string;
        mode?: PageMode;
        focusField?: string;
    } | null;
    readOnly?: boolean;
    versionId?: string;
}

const DataSemanticUnderstandingView = ({
    scanResults,
    setScanResults,
    candidateResults,
    setCandidateResults,
    businessObjects,
    setBusinessObjects,
    setActiveModule,
    initialState,
    readOnly,
    versionId
}: DataSemanticUnderstandingViewProps) => {
    const versionContext = useVersionContext();
    const isReadOnly = readOnly ?? versionContext.readOnly;
    const effectiveVersionId = versionId ?? versionContext.versionId;
    // State
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [pageMode, setPageMode] = useState<PageMode>('BROWSE'); // New V2.4 State
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(null); // null means all
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [expandedTypes, setExpandedTypes] = useState<string[]>(['MySQL', 'Oracle', 'PostgreSQL']);

    // v2.4 Detail View State
    const [subView, setSubView] = useState<'object' | 'relation'>('object');


    const {
        semanticProfile,
        setSemanticProfile,
        updateFieldDecision,
        resetProfile
    } = useSemanticProfile(selectedTableId, scanResults, setScanResults);

    // Initial State Effect
    useEffect(() => {
        if (initialState?.tableId) {
            setSelectedTableId(initialState.tableId);
            setViewMode('detail');
            if (initialState.mode) setPageMode(initialState.mode);
        }
    }, [initialState]);

    // Batch Operations Hook
    const {
        batchConfig,
        batchSemanticStep,
        batchSemanticProgress,
        batchResult,
        showBatchSemanticModal,
        setShowBatchSemanticModal,
        handleBatchSemanticStart,
        handleBatchBackground,
        handleBatchViewWorkbench,
        handleBatchBackToList,
        currentAnalyzing // Destructure currentAnalyzing
    } = useBatchOperations(scanResults, setScanResults);


    // --- Local State for UI ---
    const [filterStatus, setFilterStatus] = useState<GovernanceStatus | 'ALL'>('ALL');
    const [showRunModal, setShowRunModal] = useState(false);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBatchReview, setShowBatchReview] = useState(false);
    const [batchResults, setBatchResults] = useState<any[]>([]); // Results to review
    const [expandedReviewItems, setExpandedReviewItems] = useState<string[]>([]);

    // --- New States for Modal/Assist ---
    const [showAssistConfig, setShowAssistConfig] = useState(false);
    const [assistSettings, setAssistSettings] = useState({
        template: 'SEMANTIC_MIN',
        sampleRatio: 0.1,
        maxRows: 1000,
        ttl: '24'
    });
    const [isAssistEnabled, setIsAssistEnabled] = useState(true);
    const [showTemplateInfo, setShowTemplateInfo] = useState(false);


    // Derived Data
    const dataSources = useMemo(() => {
        // Mock Data extraction from scanResults
        const specificDS = [
            { id: 'ds_1', name: 'ERP Source', type: 'MySQL', tables: 45, analyzed: 12 },
            { id: 'ds_2', name: 'CRM Replica', type: 'PostgreSQL', tables: 32, analyzed: 28 },
            { id: 'ds_3', name: 'Legacy Data', type: 'Oracle', tables: 15, analyzed: 0 },
        ];
        return specificDS;
    }, []);

    const filteredResults = useMemo(() => {
        return scanResults.filter(item => {
            if (selectedDataSourceId && item.dataSourceId !== selectedDataSourceId) return false; // Assume property exists or ignored for now
            if (filterStatus !== 'ALL' && item.governanceStatus !== filterStatus) return false;
            if (searchTerm && !item.table.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [scanResults, selectedDataSourceId, filterStatus, searchTerm]);


    // Handlers
    const handleTableClick = (tableId: string) => {
        setSelectedTableId(tableId);
        setViewMode('detail');
        // Reset subview when entering detail
        setSubView('object');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedTableId(null);
        resetProfile();
    };

    const handleRunStart = () => {
        // Logic to start run
        // For demo, just show progress
        setShowRunModal(false);
        // Trigger batch hook if needed, or simple progress
    };

    // --- V2.4 Calc Stats for Summary ---
    const semanticStats = useMemo(() => {
        if (!semanticProfile) return null;
        const total = semanticProfile.fields.length;
        const semantic = semanticProfile.fields.filter(f => f.semanticStatus === 'DECIDED' || f.role !== 'Attribute').length; // Rough approx
        // Assuming 1 object per profile for now, unless split
        const objectCount = 1;
        const relationCount = semanticProfile.relationships?.length || 0;

        return {
            totalFields: total,
            semanticFields: semantic,
            objectCount,
            relationCount
        };
    }, [semanticProfile]);


    // ... (Keep existing Modals related state: showRelModal, editingRel, viewMappingBO, etc.)
    const [showRelModal, setShowRelModal] = useState(false);
    const [editingRel, setEditingRel] = useState<{ index: number | null, targetTable: string, type: string, key: string, description: string }>({ index: null, targetTable: '', type: '', key: '', description: '' });
    const [viewMappingBO, setViewMappingBO] = useState<string | null>(null);
    const [showDirectGenModal, setShowDirectGenModal] = useState(false);
    const [pendingGenData, setPendingGenData] = useState<{ table: any, profile: TableSemanticProfile } | null>(null);

    // ... (Keep existing Helper functions like executeDirectGenerate, executeAddToCandidates etc if defined in logic or external)
    const getDirectGenEligibility = (table: any, profile: any) => ({ canGenerate: true, checklist: [] as any[] }); // Stub
    const executeDirectGenerate = (table: any, profile: any) => { }; // Stub
    const executeAddToCandidates = (table: any, profile: any) => { }; // Stub
    const recordUpgradeHistory = (tableId: string, tableName: string, before: any, after: any) => { }; // Stub
    const rollbackUpgrade = (entry: any) => { }; // Stub 
    const upgradeHistory: any[] = []; // Stub


    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header - Common */}
            <SemanticHeader
                viewMode={viewMode}
                title={viewMode === 'list' ? '数据语义理解' : '逻辑视图详情'}
                stats={null}
                onBack={viewMode === 'detail' ? handleBackToList : undefined}
                pageMode={pageMode}
                onModeChange={setPageMode}
                semanticProfile={semanticProfile}
                setSemanticProfile={setSemanticProfile as any}
                className="bg-white border-b border-slate-200 sticky top-0 z-30 flex-shrink-0"
            />

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'list' ? (
                    /* LIST VIEW */
                    <div className="h-full flex flex-row">
                        {/* Left Panel: Data Source & Filters */}
                        <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white h-full overflow-y-auto">
                            <div className="p-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">数据源</h3>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setSelectedDataSourceId(null)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedDataSourceId === null ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Database size={16} />
                                            <span>全部数据源</span>
                                        </div>
                                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded textxs">{scanResults.length}</span>
                                    </button>
                                    {dataSources.map(ds => (
                                        <button
                                            key={ds.id}
                                            onClick={() => setSelectedDataSourceId(ds.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedDataSourceId === ds.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {ds.type === 'MySQL' && <Database size={16} className="text-blue-500" />}
                                                {ds.type === 'PostgreSQL' && <Database size={16} className="text-indigo-500" />}
                                                {ds.type === 'Oracle' && <Database size={16} className="text-red-500" />}
                                                <span>{ds.name}</span>
                                            </div>
                                            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded textxs">{ds.tables}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">治理状态</h3>
                                    <div className="space-y-1">
                                        {(['ALL', 'S0', 'S1', 'S2', 'S3'] as const).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(status)}
                                                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors gap-2 ${filterStatus === status ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {status === 'ALL' && <Layers size={16} />}
                                                {status === 'S0' && <div className="w-2 h-2 rounded-full bg-slate-300" />}
                                                {status === 'S1' && <div className="w-2 h-2 rounded-full bg-blue-300" />}
                                                {status === 'S2' && <div className="w-2 h-2 rounded-full bg-purple-300" />}
                                                {status === 'S3' && <div className="w-2 h-2 rounded-full bg-emerald-300" />}
                                                <span>
                                                    {status === 'ALL' ? '全部状态' :
                                                        status === 'S0' ? 'S0 未治理' :
                                                            status === 'S1' ? 'S1 已识别' :
                                                                status === 'S2' ? 'S2 已定义' : 'S3 已发布'
                                                    }
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Table List */}
                        <div className="flex-1 flex flex-col h-full bg-slate-50">
                            {/* Toolbar */}
                            <div className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="搜索表名或描述..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
                                        />
                                    </div>
                                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                    <div className="text-sm text-slate-500">
                                        共 {filteredResults.length} 张表
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <BatchOperationBar
                                        selectedCount={selectedTables.length}
                                        onBatchRun={() => setShowRunModal(true)}
                                        onAssistConfig={() => setShowAssistConfig(true)}
                                    />
                                </div>
                            </div>

                            {/* Table List */}
                            <div className="flex-1 overflow-y-auto px-6 pb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredResults.map((result) => (
                                        <div
                                            key={result.table}
                                            onClick={() => handleTableClick(result.table)}
                                            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md group relative ${selectedTables.includes(result.table) ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${result.governanceStatus === 'S3' ? 'bg-emerald-100 text-emerald-600' :
                                                        result.governanceStatus === 'S2' ? 'bg-purple-100 text-purple-600' :
                                                            result.governanceStatus === 'S1' ? 'bg-blue-100 text-blue-600' :
                                                                'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        <Table size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{result.table}</h4>
                                                        <div className="text-xs text-slate-500 mt-0.5 max-w-[180px] truncate" title={result.comment || '无描述'}>
                                                            {result.comment || '无描述'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTables.includes(result.table)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTables(prev =>
                                                            prev.includes(result.table) ? prev.filter(t => t !== result.table) : [...prev, result.table]
                                                        );
                                                    }}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                                />
                                            </div>

                                            {/* AI Info Stub */}
                                            {result.semanticAnalysis?.aiScore > 0 && (
                                                <div className="mb-3 px-3 py-2 bg-indigo-50/50 rounded-lg flex items-center gap-2 border border-indigo-100">
                                                    <Sparkles size={12} className="text-indigo-500" />
                                                    <span className="text-xs text-indigo-700 font-medium">
                                                        AI 建议: {result.semanticAnalysis.businessName || '未命名对象'}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-indigo-200 text-indigo-600 ml-auto">
                                                        {Math.round(result.semanticAnalysis.aiScore * 100)}%
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-3 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} />
                                                    <span>{result.lastScanned || '10分钟前'}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span>{result.fields?.length || 0} 字段</span>
                                                    <div className={`px-2 py-0.5 rounded-full ${result.governanceStatus === 'S3' ? 'bg-emerald-50 text-emerald-600' :
                                                        result.governanceStatus === 'S0' ? 'bg-slate-50 text-slate-500' :
                                                            'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {result.governanceStatus || 'S0'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* DETAIL VIEW - V2.4 NEW STRUCTURE */
                    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
                        {semanticProfile ? (
                            <div className="flex-1 overflow-y-auto">
                                <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                                    {/* 1. Header is handled by SemanticHeader, but we need the specific V2.4 'Schema' context info if not in header */}
                                    {/* The requirements ask for Header to have Schema info. SemanticHeader usually has it. */}

                                    {/* 2. Semantic Summary */}
                                    {semanticStats && <SemanticSummary stats={semanticStats} />}

                                    {/* 3. View Switcher */}
                                    <ViewSwitcher
                                        currentView={subView}
                                        onSwitch={setSubView}
                                        objectCount={semanticStats?.objectCount || 0}
                                    />

                                    {/* 4. Main View Area */}
                                    <div className="animate-fade-in-up">
                                        {subView === 'object' ? (
                                            <ObjectView profiles={[semanticProfile]} />
                                        ) : (
                                            <RelationView profile={semanticProfile} />
                                        )}
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full items-center justify-center text-slate-500">
                                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
                                    <div className="text-sm font-semibold text-slate-700">未找到当前表数据</div>
                                    <div className="text-xs text-slate-400 mt-2">可能是状态变更导致列表过滤。</div>
                                    <button
                                        onClick={handleBackToList}
                                        className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        返回列表
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Batch Semantic Generation Modals */}
            {showBatchSemanticModal && batchSemanticStep === 'config' && (
                <BatchSemanticConfigModal
                    open={true}
                    selectedTables={selectedTables}
                    onClose={() => setShowBatchSemanticModal(false)}
                    onStart={handleBatchSemanticStart}
                />
            )}

            {showBatchSemanticModal && batchSemanticStep === 'running' && batchConfig && (
                <BatchSemanticRunningModal
                    open={true}
                    totalTables={batchSemanticProgress.total}
                    completedTables={batchSemanticProgress.completed}
                    currentTable={currentAnalyzing || ''}
                    config={batchConfig}
                    onBackground={handleBatchBackground}
                />
            )}

            {showBatchSemanticModal && batchSemanticStep === 'result' && batchResult && (
                <BatchSemanticResultModal
                    open={true}
                    result={batchResult}
                    onViewWorkbench={handleBatchViewWorkbench}
                    onBackToList={handleBatchBackToList}
                    onViewTableDetail={handleTableClick} /* Use handleTableClick for detail view */
                />
            )}

            {/* 批量语义理解弹窗 - 使用统一组件 */}
            <SemanticAssistBatchModal
                open={showRunModal}
                selectedTables={selectedTables}
                defaultAssist={DEFAULT_SEMANTIC_ASSIST}
                onClose={() => setShowRunModal(false)}
                onStart={(config) => {
                    // 处理批量运行配置
                    handleRunStart();
                }}
                viewInfo={selectedDataSourceId ? (dataSources.find((d: any) => d.id === selectedDataSourceId) as any)?.name || '多个数据源' : '多个数据源'}
            />

            {/* 模板说明抽屉 */}
            <TemplateExplanationDrawer
                open={showTemplateInfo}
                onClose={() => setShowTemplateInfo(false)}
            />

            {/* 语义理解配置面板 */}
            {showAssistConfig && (
                <SemanticAssistConfigPanel
                    assist={{
                        ...DEFAULT_SEMANTIC_ASSIST,
                        enabled: isAssistEnabled,
                        template: assistSettings.template as any,
                        runtimeConfig: {
                            ...DEFAULT_SEMANTIC_ASSIST.runtimeConfig,
                            sampleRatio: (assistSettings.sampleRatio * 100) as any
                        },
                        systemConfig: {
                            maxRows: assistSettings.maxRows,
                            ttlHours: parseInt(assistSettings.ttl)
                        },
                        scope: 'TABLE'
                    }}
                    onClose={() => setShowAssistConfig(false)}
                    onApply={(newConfig) => {
                        setAssistSettings(prev => ({
                            ...prev,
                            sampleRatio: newConfig.sampleRatio ? newConfig.sampleRatio / 100 : prev.sampleRatio
                        }));
                        // property enabled does not exist on newConfig (SemanticAssistRuntimeConfig)
                        setShowAssistConfig(false);
                    }}
                    asModal={true}
                />
            )}
        </div>
    );
};

export default DataSemanticUnderstandingView;
