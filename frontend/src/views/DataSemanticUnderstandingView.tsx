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
import { QualityOverviewTab } from './semantic/tabs/QualityOverviewTab';
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
    const [showDirectory, setShowDirectory] = useState(true);


    /*
        setSemanticProfile(prev => {
            const newFields = prev.fields.map(f => {
                const fName = f.fieldName || f.name;
                if (fName === fieldName) {
                    return {
                        ...f,
                        role: decision.role,
                        aiSuggestion: decision.term || f.aiSuggestion,
                        tags: decision.tags,
                        semanticStatus: decision.action === 'REJECT' ? 'BLOCKED' : 'DECIDED',
                    };
                }
                return f;
            });
            // Recalculate confirmed progress
            const confirmedCount = newFields.filter(f => f.semanticStatus === 'DECIDED').length;
            // Update stage if all confirmed? logic can be added later
            return { ...prev, fields: newFields };
        });

        // Auto-select next field if needed (simple implementation)
        const currentIndex = prev.fields.findIndex(f => f.fieldName === fieldName);
        if (currentIndex !== -1 && currentIndex < prev.fields.length - 1) {
            // Optional: setFocusField(prev.fields[currentIndex + 1].name);
        }
    */
    const [searchTerm, setSearchTerm] = useState('');
    const [isListHeaderCollapsed, setIsListHeaderCollapsed] = useState(false);
    const [listFilters, setListFilters] = useState({
        review: false,
        gate: false,
        risk: false,
        stage: null as string | null // New: null means no filter, otherwise filter by specific stage
    });
    const [sortField, setSortField] = useState<'pendingReviewFields' | 'gateFailedItems' | 'riskItems' | 'updateTime' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    // Direct Generation State
    const [showDirectGenModal, setShowDirectGenModal] = useState(false);
    const [pendingGenData, setPendingGenData] = useState<any>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Batch Analysis State (refactored to hook)
    const [showRunModal, setShowRunModal] = useState(false);
    const [showTemplateInfo, setShowTemplateInfo] = useState(false);
    const [runConfig, setRunConfig] = useState({
        sampleRows: 10000,
        ruleVersion: 'v2.4',
        modelVersion: 'model-v1',
        concurrency: 3,
        queue: 'default'
    });

    // Semantic Assist State (Moved from GovernanceTopBar)
    const [isAssistEnabled, setIsAssistEnabled] = useState(true);
    const [showAssistConfig, setShowAssistConfig] = useState(false);
    const [assistSettings, setAssistSettings] = useState({
        template: 'SEMANTIC_MIN',
        sampleRatio: 0.01,
        maxRows: 200000,
        ttl: '24h'
    });

    const [expandedReviewItems, setExpandedReviewItems] = useState<string[]>([]);

    // Table Selection (Moved Up)


    // View State
    const [editMode, setEditMode] = useState(false);
    const setEditModeSafe = (value: boolean) => {
        if (isReadOnly) return;
        setEditMode(value);
    };

    const guardAction = (action: (...args: any[]) => void) => (...args: any[]) => {
        if (isReadOnly) return;
        action(...args);
    };

    const handleShowRunModal = () => {
        if (isReadOnly) return;
        setShowRunModal(true);
    };
    const [detailTab, setDetailTab] = useState<'fields' | 'graph' | 'dimensions' | 'quality'>('fields');
    const [fieldViewMode, setFieldViewMode] = useState<'structure' | 'semantic'>('structure');
    const [fieldSearchTerm, setFieldSearchTerm] = useState('');
    const [fieldProblemFilter, setFieldProblemFilter] = useState<'all' | 'review'>('all');
    const [fieldGroupFilter, setFieldGroupFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');
    const [selectedFieldNames, setSelectedFieldNames] = useState<string[]>([]);
    const [expandedFields, setExpandedFields] = useState<string[]>([]);
    const [focusField, setFocusField] = useState<string | null>(null);

    const [resultTab, setResultTab] = useState<'overview' | 'evidence' | 'fields' | 'logs' | 'structure' | 'graph' | 'quality'>('overview');
    const [showAllKeyEvidence, setShowAllKeyEvidence] = useState(false);
    const [fieldRoleOverrides, setFieldRoleOverrides] = useState<Record<string, { role: string; source: 'rule' | 'ai' }>>({});
    const [openConflictPopover, setOpenConflictPopover] = useState<string | null>(null);
    const [sensitivityOverrides, setSensitivityOverrides] = useState<Record<string, 'L1' | 'L2' | 'L3' | 'L4'>>({});
    const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);

    // Batch Semantic Generation States (additional to useBatchOperations)
    const [showBatchSemanticModal, setShowBatchSemanticModal] = useState(false);
    const [batchSemanticStep, setBatchSemanticStep] = useState<'config' | 'running' | 'result'>('config');
    const [batchConfig, setBatchConfig] = useState<BatchSemanticConfig | null>(null);
    const [batchSemanticProgress, setBatchSemanticProgress] = useState({ completed: 0, total: 0, current: '' });
    const [batchResult, setBatchResult] = useState<any>(null);

    // Mapping Details Modal State
    const [viewMappingBO, setViewMappingBO] = useState<string | null>(null);

    // V2.4: Analysis Simulation
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

    // Relationship editing state
    const [showRelModal, setShowRelModal] = useState(false);
    const [editingRel, setEditingRel] = useState<{ index: number | null; targetTable: string; type: string; key: string }>({
        index: null, targetTable: '', type: 'Many-to-One', key: ''
    });



    // Derived Data
    // Get unique data sources from scan results (assuming scanResults contains source info)
    // Or we use a mock list of sources if scanResults doesn't have full source metadata, 
    // but usually scanResults items should have 'sourceId', 'sourceName', 'sourceType'.
    // We will extract unique sources from the assets list.
    const assets = scanResults.filter(r => ['scanned', 'analyzed', 'pending_review', 'pending'].includes(r.status));

    const dataSourcesMap = assets.reduce((acc: any, asset: any) => {
        if (!asset.sourceId) return acc;
        if (!acc[asset.sourceId]) {
            acc[asset.sourceId] = {
                id: asset.sourceId,
                name: asset.sourceName || 'Unknown Source',
                type: asset.sourceType || 'MySQL'
            };
        }
        return acc;
    }, {});
    const dataSources = Object.values(dataSourcesMap);

    // Group Sources by Type for the Left Tree
    const typeGroups = dataSources.reduce((acc: Record<string, any[]>, ds: any) => {
        if (!acc[ds.type]) acc[ds.type] = [];
        acc[ds.type].push(ds);
        return acc;
    }, {} as Record<string, any[]>);

    const listAssets = useMemo(() => {
        return assets.map(asset => {
            const governanceStatus = resolveGovernanceStatus(asset);
            const reviewStats = governanceStatus === 'S0'
                ? null
                : (asset.reviewStats || buildReviewStats(asset.table || asset.name, asset.fields || [], asset.comment));
            const lastRun = asset.lastRun || asset.semanticAnalysis?.lastRun || null;

            // V2.4: Derive Semantic Stage
            let semanticStage: TableSemanticStage = 'NOT_STARTED';
            if (governanceStatus === 'S3') {
                semanticStage = 'READY_FOR_OBJECT';
            } else if (governanceStatus === 'S1' || governanceStatus === 'S2') {
                semanticStage = 'FIELD_PENDING';
            }

            return { ...asset, governanceStatus, reviewStats, lastRun, semanticStage };
        });
    }, [assets]);



    // Filtered Assets list for Right Panel
    const filteredAssets = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        const filtered = listAssets.filter(asset => {
            const matchesSource = selectedDataSourceId ? asset.sourceId === selectedDataSourceId : true;
            const tableName = asset.table || asset.name || '';
            const matchesSearch = keyword === '' ||
                tableName.toLowerCase().includes(keyword) ||
                (asset.comment || '').toLowerCase().includes(keyword) ||
                (asset.semanticAnalysis?.businessName || '').toLowerCase().includes(keyword);
            const stats = asset.reviewStats as ReviewStats | null;
            const matchesReview = !listFilters.review || (stats?.pendingReviewFields || 0) > 0;
            const matchesGate = !listFilters.gate || (stats?.gateFailedItems || 0) > 0;
            const matchesRisk = !listFilters.risk || (stats?.riskItems || 0) > 0;
            const matchesStage = !listFilters.stage || asset.semanticStage === listFilters.stage;
            return matchesSource && matchesSearch && matchesReview && matchesGate && matchesRisk && matchesStage;
        });

        if (!sortField) return filtered;
        const direction = sortOrder === 'asc' ? 1 : -1;
        return [...filtered].sort((a, b) => {
            const aStats = a.reviewStats as ReviewStats | null;
            const bStats = b.reviewStats as ReviewStats | null;
            if (sortField === 'updateTime') {
                const aTime = a.updateTime ? new Date(a.updateTime).getTime() : 0;
                const bTime = b.updateTime ? new Date(b.updateTime).getTime() : 0;
                return (aTime - bTime) * direction;
            }
            const aVal = aStats ? (aStats as any)[sortField] || 0 : 0;
            const bVal = bStats ? (bStats as any)[sortField] || 0 : 0;
            return (aVal - bVal) * direction;
        });
    }, [listAssets, selectedDataSourceId, searchTerm, listFilters, sortField, sortOrder]);

    const selectedTable = scanResults.find((item: any) => item.table === selectedTableId)
        || assets.find(a => a.table === selectedTableId);
    const selectedTableFields = useMemo(
        () => normalizeFields(Array.isArray(selectedTable?.fields) ? selectedTable.fields : []),
        [selectedTable]
    );

    // Batch Operations Hook
    const {
        selectedTables,
        setSelectedTables,
        batchAnalyzing,
        batchProgress,
        currentAnalyzing,
        completedResults,
        batchResults,
        showBatchReview,
        setShowBatchReview,
        toggleTableSelection,
        handleSelectAll,
        clearSelection,
        handleBatchAnalyze,
        setBatchResults
    } = useBatchOperations(scanResults, setScanResults);

    // Handle Initial State Navigation
    useEffect(() => {
        if (initialState) {
            console.log("Deep link navigation:", initialState);
            if (initialState.tableId) {
                // Find table scan result
                const targetTable = scanResults.find(t => t.table === initialState.tableId);
                if (targetTable) {
                    setSelectedTableId(initialState.tableId);
                    setDetailTab('fields');
                    setViewMode('detail');

                    if (initialState.mode) {
                        setPageMode(initialState.mode);
                    }

                    if (initialState.focusField) {
                        setFocusField(initialState.focusField);
                    }
                }
            }
        }
    }, [initialState, scanResults]);

    useEffect(() => {
        if (isReadOnly && pageMode !== 'BROWSE') {
            setPageMode('BROWSE');
        }
    }, [isReadOnly, pageMode]);



    // Core Semantic Profile Hook
    const {
        semanticProfile, setSemanticProfile,
        isAnalyzing, setIsAnalyzing,
        pendingAnalysisResult, setPendingAnalysisResult,
        auditLogs, setAuditLogs,
        upgradeHistory, setUpgradeHistory,
        fieldReviewStatus, setFieldReviewStatus,
        recordAuditLog,
        recordUpgradeHistory,
        rollbackUpgrade,
        handleAnalyze,
        handleConfirmEffective,
        handleIgnore,
        handleSave
    } = useSemanticProfile(selectedTable, selectedTableFields, setScanResults);
    const [governanceMode, setGovernanceMode] = useState<'BROWSE' | 'SEMANTIC'>('BROWSE');
    const hasFieldAnalysis = Array.isArray(semanticProfile.fields) && semanticProfile.fields.length > 0;

    const handleSemanticDecision = (fieldName: string, decision: any) => {
        if (isReadOnly) return;
        setSemanticProfile((prev: any) => {
            // Check if field exists in profile
            const existingFieldIndex = prev.fields.findIndex((f: any) =>
                f.fieldName === fieldName
            );

            let newFields;
            if (existingFieldIndex !== -1) {
                // Update existing field
                newFields = prev.fields.map((f: any) => {
                    const fName = f.fieldName;
                    if (fName === fieldName) {
                        return {
                            ...f,
                            role: decision.role,
                            aiSuggestion: decision.term || f.aiSuggestion,
                            tags: decision.tags,
                            semanticStatus: (decision.action === 'REJECT' ? 'BLOCKED' : 'DECIDED') as FieldSemanticStatus,
                        };
                    }
                    return f;
                });
            } else {
                // Add new field entry
                newFields = [
                    ...prev.fields,
                    {
                        fieldName: fieldName,
                        name: fieldName,
                        role: decision.role,
                        aiSuggestion: decision.term || '',
                        tags: decision.tags || [],
                        semanticStatus: (decision.action === 'REJECT' ? 'BLOCKED' : 'DECIDED') as FieldSemanticStatus,
                    }
                ];
            }

            return { ...prev, fields: newFields };
        });

        // Auto-select next field for efficient workflow
        if (decision.action === 'ACCEPT_AI' || decision.action === 'ACCEPT_RULE' || decision.action === 'MODIFY' || decision.action === 'REJECT') {
            const currentIndex = selectedTableFields.findIndex(f => (f.name || f.fieldName) === fieldName);
            if (currentIndex !== -1 && currentIndex < selectedTableFields.length - 1) {
                const nextField = selectedTableFields[currentIndex + 1];
                setFocusField(nextField.name || nextField.fieldName);
            }
        }
    };

    const rolledBackTableIds = useMemo(() => {
        return new Set(
            upgradeHistory.filter(entry => entry.rolledBack).map(entry => entry.tableId)
        );
    }, [upgradeHistory]);

    // Derived helpers dependent on semanticProfile
    const isIdle = semanticProfile.analysisStep === 'idle';

    const isSuggestionsReady = (status?: GovernanceStatus) => (status || 'S0') !== 'S0';

    const getDirectGenEligibility = (table: any, profile: TableSemanticProfile | any) => {
        const safeProfile = profile || {};
        const safeTableName = table?.table || safeProfile.tableName || '';
        const fields = normalizeFields(Array.isArray(table?.fields) ? table.fields : (safeProfile.fields || []));
        const gateDetails = safeProfile.gateResult?.details || {};
        const gateResult = safeProfile.gateResult?.result || 'PASS';
        const reviewStats = safeProfile.reviewStats || buildReviewStats(safeTableName, fields, table?.comment);
        const isTableConfirmed = (safeProfile.governanceStatus || semanticProfile.governanceStatus) === 'S3';
        const primaryKeyFields = fields.filter((field: any) =>
            field.primaryKey || field.key === 'PK' || field.fieldName === 'id' || field.fieldName?.endsWith('_id')
        );
        const primaryKeyConfirmed = primaryKeyFields.length > 0 && (
            isTableConfirmed || primaryKeyFields.every((field: any) => fieldReviewStatus[field.fieldName] === 'confirmed')
        );
        const lifecyclePassed = gateDetails.lifecycle === true;
        const sensitiveFields = fields.filter((field: any) => {
            const analysis = analyzeField(field);
            const sensitivity = sensitivityOverrides[field.fieldName] || analysis.sensitivity;
            return sensitivity === 'L3' || sensitivity === 'L4';
        });
        const sensitivePending = sensitiveFields.filter((field: any) =>
            !isTableConfirmed && fieldReviewStatus[field.fieldName] !== 'confirmed'
        );
        const sensitiveProcessed = sensitivePending.length === 0;
        const pendingReviewCount = reviewStats?.pendingReviewFields || 0;
        const impactAcceptable = pendingReviewCount === 0 && gateResult === 'PASS';

        const checklist = [
            {
                key: 'pk',
                label: '主键已确认',
                passed: primaryKeyConfirmed,
                detail: primaryKeyFields.length === 0 ? '未检测到主键字段' : (primaryKeyConfirmed ? '已确认' : '存在未确认主键')
            },
            {
                key: 'lifecycle',
                label: '生命周期 Gate 通过',
                passed: lifecyclePassed,
                detail: lifecyclePassed ? '通过' : '未通过'
            },
            {
                key: 'sensitive',
                label: '敏感冲突已处理',
                passed: sensitiveProcessed,
                detail: sensitiveProcessed ? '已处理' : `待处理 ${sensitivePending.length} 个敏感字段`
            },
            {
                key: 'impact',
                label: '影响范围可接受',
                passed: impactAcceptable,
                detail: impactAcceptable ? '待Review=0' : `待Review ${pendingReviewCount}`
            }
        ];
        const canGenerate = checklist.every(item => item.passed);
        return { checklist, canGenerate };
    };

    useEffect(() => {
        if (!selectedTableId || viewMode !== 'detail') return;
        const asset = scanResults.find((item: any) => item.table === selectedTableId);
        if (!asset?.semanticAnalysis) return;
        const governanceStatus = resolveGovernanceStatus(asset);
        setSemanticProfile(prev => ({
            ...prev,
            ...asset.semanticAnalysis,
            governanceStatus,
            analysisStep: governanceStatus === 'S0'
                ? (asset.semanticAnalysis.analysisStep || 'idle')
                : 'done',
            relationships: prev.relationships
        }));
    }, [scanResults, selectedTableId, viewMode]);

    // Helpers
    const toggleType = (type: string) => {
        setExpandedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleDataSourceSelect = (dsId: string | null) => {
        setSelectedDataSourceId(dsId);
        setViewMode('list');
        setSelectedTableId(null);
    };

    const handleTableClick = (tableId: string) => {
        setSelectedTableId(tableId);
        setFieldProblemFilter('all');
        setFieldGroupFilter('all');
        setFieldSearchTerm('');
        setSelectedFieldNames([]);
        setFieldReviewStatus({});
        setResultTab('overview');

        // Prepare semantic profile for detail view
        const asset = assets.find(a => a.table === tableId);
        if (asset?.semanticAnalysis) {
            const governanceStatus = resolveGovernanceStatus(asset);
            // If we have saved analysis, load it (adapting structure if necessary)
            // simplified for now: just reset to empty if structure mismatch or use saved
            setSemanticProfile({
                ...emptyProfile,
                ...asset.semanticAnalysis,
                tableName: asset.table || asset.semanticAnalysis?.tableName || tableId, // Ensure tableName is present
                analysisStep: governanceStatus === 'S0' ? (asset.semanticAnalysis.analysisStep || 'idle') : 'done',
                governanceStatus,
                reviewStats: asset.reviewStats
            });
            setFieldViewMode(isSuggestionsReady(governanceStatus) ? 'semantic' : 'structure');
            setEditModeSafe(false);
        } else {
            // New / Unanalyzed
            setSemanticProfile({
                ...emptyProfile,
                tableName: tableId,
                analysisStep: 'idle',
                relationships: asset.relationships || [],
                fields: asset.fields || [],
                governanceStatus: 'S0'
            });
            setFieldViewMode('structure');
            setEditModeSafe(true);
        }

        setViewMode('detail');
        setDetailTab('fields');
        setExpandedFields([]);
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedTableId(null);
        setPageMode('BROWSE'); // 重置为浏览模式，确保左侧树可见
    };

    const handleFocusField = (fieldName: string) => {
        const fields = selectedTableFields;
        if (fields.length === 0) return;
        const lowerTarget = fieldName.toLowerCase();
        const exactMatch = fields.find((f: any) => f.fieldName === fieldName);
        const lowerMatch = fields.find((f: any) => f.fieldName.toLowerCase() === lowerTarget);
        const containsMatch = fields.find((f: any) => f.fieldName.toLowerCase().includes(lowerTarget));
        const matched = exactMatch || lowerMatch || containsMatch;
        if (!matched) return;
        setResultTab('fields');
        setFocusField(null);
        setTimeout(() => setFocusField(matched.fieldName), 0);
    };

    const scrollToSection = (sectionId: string) => {
        const node = document.getElementById(sectionId);
        if (node) {
            node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleViewEvidence = () => {
        setResultTab('evidence');
        scrollToSection('result-key-evidence');
    };

    const handleViewLogs = () => {
        setResultTab('logs');
        scrollToSection('result-logs');
    };



    const handleEvidenceAction = (payload: {
        action: 'accept' | 'override' | 'pending';
        field?: string;
        source?: string;
        reason?: string;
    }) => {
        recordAuditLog({ ...payload, timestamp: new Date().toISOString() });
        if (payload.action === 'override') {
            setEditModeSafe(true);
        }
        if (payload.field) {
            handleFocusField(payload.field);
        } else {
            setResultTab('fields');
        }
    };



    const handleJumpToProblemFields = () => {
        setDetailTab('fields');
        setFieldProblemFilter('review');
        setFieldSearchTerm('');
        if (isSuggestionsReady(semanticProfile.governanceStatus as GovernanceStatus)) {
            setFieldViewMode('semantic');
        }
        scrollToSection('detail-fields-table');
    };

    const handleOpenGateDetail = () => {
        setResultTab('overview');
        scrollToSection('result-gate-detail');
    };





    // Conflict resolution: user chooses to adopt rule or AI suggestion
    const resolveConflict = (fieldName: string, choice: 'rule' | 'ai', ruleRole: string, aiRole: string) => {
        const chosenRole = choice === 'rule' ? ruleRole : aiRole;
        setFieldRoleOverrides(prev => ({
            ...prev,
            [fieldName]: { role: chosenRole, source: choice }
        }));
    };

    // Toggle table selection for batch analysis


    const handleRunStart = () => {
        if (selectedTables.length === 0) return;
        const runId = `RUN-${Date.now()}`;
        const startedAt = new Date().toISOString();
        const estimateMinutes = Math.max(1, Math.ceil(selectedTables.length / Math.max(runConfig.concurrency, 1)) * 2);
        const runSummary: RunSummary = {
            runId,
            status: 'running',
            startedAt,
            sampleRows: runConfig.sampleRows,
            ruleVersion: runConfig.ruleVersion,
            modelVersion: runConfig.modelVersion,
            queueInfo: `${Math.min(selectedTables.length, runConfig.concurrency)}/${runConfig.concurrency}`,
            estimateTime: `${estimateMinutes}~${estimateMinutes + 1} 分钟`
        };
        setShowRunModal(false);
        setScanResults((prev: any[]) => prev.map((item: any) =>
            selectedTables.includes(item.table)
                ? { ...item, lastRun: { ...runSummary } }
                : item
        ));
        handleBatchAnalyze(runId);
    };







    const executeAddToCandidates = (table: any, profile: any) => {
        if (isReadOnly) return;
        const newCandidate = {
            id: `CAND-${Date.now()}`,
            tableName: table.table,
            tableComment: table.comment,
            sourceId: table.sourceId || 'DS1',
            needsConfirmation: true,
            hasConflict: false,
            objectSuggestion: {
                name: profile.businessName,
                businessDomain: profile.businessDomain,
                confidence: profile.aiScore || 0.85,
                source: 'AI Semantic',
                status: 'pending',
                risk: 'low'
            },
            fieldSuggestions: (table.fields || []).map((f: any) => ({
                field: f.fieldName,
                semanticRole: f.comment || 'Attribute',
                confidence: 0.9,
                status: 'pending'
            }))
        };

        if (setCandidateResults) {
            setCandidateResults((prev: any[]) => [...(prev || []), newCandidate]);
        }

        // Update scan result
        setScanResults((prev: any[]) => prev.map((item: any) =>
            item.table === table.table
                ? { ...item, status: 'analyzed', governanceStatus: 'S1', semanticAnalysis: { ...profile } }
                : item
        ));

        setSemanticProfile(prev => ({ ...prev, governanceStatus: 'S1' }));
        setEditModeSafe(false);
        // Toast or specific feedback handled by UI
        if (setActiveModule) setActiveModule('candidate_confirmation');
    };

    // Batch Semantic Generation Handlers
    const handleBatchSemanticStart = (config: BatchSemanticConfig) => {
        setBatchConfig(config);
        setBatchSemanticStep('running');
        setBatchSemanticProgress({ completed: 0, total: selectedTables.length, current: selectedTables[0] || '' });

        // Simulate batch processing
        simulateBatchSemanticGeneration(config);
    };

    const simulateBatchSemanticGeneration = (config: BatchSemanticConfig) => {
        const tables = selectedTables;
        let completed = 0;

        const processNext = () => {
            if (completed >= tables.length) {
                // All done - show result
                const mockResult = {
                    success: Math.floor(tables.length * 0.8),
                    partialSuccess: Math.floor(tables.length * 0.15),
                    failed: Math.floor(tables.length * 0.05),
                    details: tables.map((table, idx) => ({
                        table,
                        status: idx < tables.length * 0.8 ? 'success' as const :
                            idx < tables.length * 0.95 ? 'partial' as const :
                                'failed' as const,
                        failedFields: idx >= tables.length * 0.8 ? Math.floor(Math.random() * 3) + 1 : undefined,
                        reason: idx >= tables.length * 0.95 ? '数据采样不足' : undefined
                    }))
                };
                setBatchResult(mockResult);
                setBatchSemanticStep('result');
                return;
            }

            setBatchSemanticProgress({ completed, total: tables.length, current: tables[completed] });
            completed++;
            setTimeout(processNext, 1500); // 模拟每张表1.5秒
        };

        processNext();
    };

    const handleBatchBackground = () => {
        setShowBatchSemanticModal(false);
        // 任务继续在后台运行
    };

    const handleBatchViewWorkbench = () => {
        setShowBatchSemanticModal(false);
        if (setActiveModule) {
            setActiveModule('sg_field_workbench');
        }
    };

    const handleBatchBackToList = () => {
        setShowBatchSemanticModal(false);
        setSelectedTables([]);
        setBatchSemanticStep('config');
    };

    // P1 Enhancement: Navigate to table detail from batch result
    const handleViewTableDetail = (tableId: string, mode: 'BROWSE' | 'SEMANTIC') => {
        setShowBatchSemanticModal(false);
        setSelectedTableId(tableId);
        setViewMode('detail');
        setPageMode(mode);
    };

    const handleTableSelect = (tableId: string) => {
        setSelectedTables(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId]
        );
    };

    const executeDirectGenerate = (table: any, profile: any) => {
        if (isReadOnly) return;
        const eligibility = getDirectGenEligibility(table, profile);
        if (!eligibility.canGenerate) {
            alert('生成前置条件未满足，请先完成 Gate/Review 处理。');
            return;
        }
        const newBO = {
            id: `BO-${Date.now()}`,
            name: profile.businessName,
            code: table.table,
            domain: 'Customer Domain', // Mock
            owner: profile.owner || 'System',
            status: 'Draft',
            description: profile.description || table.comment,
            fields: (table.fields || []).map((f: any) => ({
                id: f.fieldName,
                name: f.comment || f.fieldName,
                code: f.fieldName,
                type: f.type,
                isPrimary: f.fieldName.includes('id'), // Simple heuristic
                required: false
            }))
        };

        if (setBusinessObjects) {
            setBusinessObjects((prev: any[]) => [...(prev || []), newBO]);
        }

        // Update scan result
        setScanResults((prev: any[]) => prev.map((item: any) =>
            item.table === table.table
                ? { ...item, status: 'analyzed', governanceStatus: 'S3', semanticAnalysis: { ...profile } }
                : item
        ));

        setSemanticProfile(prev => ({ ...prev, governanceStatus: 'S3' }));
        setEditModeSafe(false);
        setShowDirectGenModal(false);
        if (setActiveModule) setActiveModule('td_modeling');
    };

    const handleJustSave = () => {
        if (!selectedTable) return;

        // Update scan result with current profile
        setScanResults((prev: any[]) => prev.map((item: any) =>
            item.table === selectedTable.table
                ? { ...item, governanceStatus: 'S1', semanticAnalysis: { ...semanticProfile, governanceStatus: 'S1' } } // Save current state
                : item
        ));

        // Optional: show feedback (using alert for simplicity as no toast system is visible)
        // In a real app, use toast.success('已保存');
        alert('语义结论已保存');
    };

    const handleSaveToMetadata = () => {
        if (isReadOnly) return;
        if (!selectedTable) return;

        // Check confidence - if high, offer direct generation
        // Mocking high confidence for demo if name is filled
        const isHighConfidence = semanticProfile.businessName && semanticProfile.businessName.length > 0;

        if (isHighConfidence) {
            setPendingGenData({
                table: selectedTable,
                profile: semanticProfile
            });
            setShowDirectGenModal(true);
        } else {
            executeAddToCandidates(selectedTable, semanticProfile);
        }
    };

    // Database logo icons (emoji)
    const typeLogoConfig: Record<string, string> = {
        MySQL: '🐬',           // Dolphin (MySQL mascot)
        Oracle: '🔴',          // Red circle (Oracle brand color)
        PostgreSQL: '🐘',      // Elephant (PostgreSQL mascot)
        SQLServer: '🪟',       // Window (Microsoft)
        MongoDB: '🍃',         // Leaf (MongoDB logo)
        Redis: '⚡',           // Lightning (speed)
        Elasticsearch: '🔍',   // Search magnifier
        ClickHouse: '⚡',      // Lightning (speed)
        TiDB: '🟠',           // Orange circle (TiDB brand color)
        OceanBase: '🌊',      // Ocean wave
        达梦: '🗄️',           // Database cabinet
        人大金仓: '🏛️',       // Classical building
        GaussDB: '🔷',        // Blue diamond
        Hive: '🐝'            // Bee (Hive)
    };

    // typeConfig moved to utils.ts

    return (
        <>
            {viewMode === 'list' && (
                <div className={`bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-4 ${isReadOnly ? 'mb-3' : 'mb-4'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-800">逻辑视图</h2>
                                <span className="text-xs text-slate-400">
                                    {filteredAssets.length} 张
                                </span>
                                {isReadOnly && (
                                    <ReadOnlyBadge
                                        versionId={effectiveVersionId}
                                        className="text-[11px] text-slate-500"
                                    />
                                )}
                            </div>
                            {!isListHeaderCollapsed && (
                                <p className="text-xs text-slate-500 mt-1">
                                    {selectedDataSourceId
                                        ? `当前筛选: ${(dataSources.find((d: any) => d.id === selectedDataSourceId) as any)?.name}`
                                        : '显示所有已扫描的逻辑视图'}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleShowRunModal}
                                disabled={isReadOnly || selectedTables.length === 0}
                                className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-all ${isReadOnly || selectedTables.length === 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600 shadow-sm'
                                    }`}
                            >
                                <Sparkles size={14} />
                                批量语义理解
                            </button>
                            <button
                                onClick={() => setIsListHeaderCollapsed(prev => !prev)}
                                className="px-2.5 py-2 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                {isListHeaderCollapsed ? '展开' : '收起'}
                            </button>
                        </div>
                    </div>
                    {!isListHeaderCollapsed && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-slate-400">快速筛选:</span>
                                {([
                                    { key: 'review', label: '待Review' },
                                    { key: 'gate', label: 'Gate 未通过' },
                                    { key: 'risk', label: '高风险' }
                                ] as const).map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setListFilters(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                        className={`px-2 py-1 rounded-full border transition-colors ${listFilters[item.key]
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}

                                <div className="h-4 w-px bg-slate-200 mx-1"></div>

                                <select
                                    value={listFilters.stage || ''}
                                    onChange={(e) => setListFilters(prev => ({ ...prev, stage: e.target.value || null }))}
                                    className={`px-2 py-1 rounded-full border text-xs transition-colors ${listFilters.stage
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <option value="">状态：全部</option>
                                    <option value="NOT_STARTED">未开始</option>
                                    <option value="FIELD_PENDING">语义待确认</option>
                                    <option value="MODELING_IN_PROGRESS">语义建模进行中</option>
                                    <option value="READY_FOR_OBJECT">可对象建模</option>
                                </select>

                                {(listFilters.review || listFilters.gate || listFilters.risk || listFilters.stage) && (
                                    <button
                                        onClick={() => setListFilters({ review: false, gate: false, risk: false, stage: null })}
                                        className="px-2 py-1 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    >
                                        清除筛选
                                    </button>
                                )}
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="搜索逻辑视图/业务名称..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="h-full flex animate-fade-in gap-4">
                {/* Left Panel - Source Tree */}
                {pageMode !== 'SEMANTIC' && (
                    <div className={`${isTreeCollapsed ? 'w-12' : 'w-64'} bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0 transition-all duration-300`}>
                        <div className={`p-4 border-b border-slate-100 bg-slate-50 flex items-center ${isTreeCollapsed ? 'justify-center p-2' : 'justify-between'}`}>
                            {!isTreeCollapsed && (
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                    <Database size={16} className="text-blue-600" /> 数据源视图
                                </h3>
                            )}
                            <button
                                onClick={() => setIsTreeCollapsed(!isTreeCollapsed)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                                title={isTreeCollapsed ? "展开视图" : "收起视图"}
                            >
                                {isTreeCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                            </button>
                        </div>

                        {!isTreeCollapsed ? (
                            <div className="flex-1 overflow-y-auto p-2 opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={() => handleDataSourceSelect(null)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-2 font-medium transition-colors ${selectedDataSourceId === null ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Layers size={14} />
                                    全部数据源
                                </button>

                                {Object.entries(typeGroups).map(([type, items]: [string, any]) => (
                                    <div key={type} className="mb-1">
                                        <button
                                            onClick={() => toggleType(type)}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors text-slate-700"
                                        >
                                            <ChevronRight
                                                size={14}
                                                className={`text-slate-400 transition-transform duration-200 ease-out ${expandedTypes.includes(type) ? 'rotate-90' : ''}`}
                                            />
                                            <span className="text-base">{typeLogoConfig[type] || '💾'}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeConfig[type]?.bgColor || 'bg-slate-100'} ${typeConfig[type]?.color || ''}`}>{type}</span>
                                            <span className="ml-auto text-xs text-slate-400">{items.length}</span>
                                        </button>
                                        <div
                                            className={`ml-5 space-y-0.5 mt-1 border-l border-slate-100 pl-1 overflow-hidden origin-top transition-all duration-300 ease-in-out ${expandedTypes.includes(type)
                                                ? 'max-h-96 opacity-100'
                                                : 'max-h-0 opacity-0 pointer-events-none'
                                                }`}
                                        >
                                            {items.map((ds: any) => (
                                                <button
                                                    key={ds.id}
                                                    onClick={() => handleDataSourceSelect(ds.id)}
                                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${selectedDataSourceId === ds.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    <Server size={12} className={selectedDataSourceId === ds.id ? 'text-blue-500' : 'text-slate-400'} />
                                                    <span className="truncate" title={ds.name}>{ds.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center py-4 gap-3 animate-fade-in overflow-y-auto custom-scrollbar">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-2 cursor-pointer hover:bg-blue-100 transition-colors" title="全部数据源" onClick={() => handleDataSourceSelect(null)}>
                                    <Layers size={16} />
                                </div>
                                <div className="w-6 h-px bg-slate-100 mb-1"></div>
                                {Object.entries(typeGroups).map(([type, items]: [string, any]) => (
                                    <div key={type} className="relative group cursor-pointer" title={`${type} (${items.length})`} onClick={() => {
                                        setIsTreeCollapsed(false);
                                        if (!expandedTypes.includes(type)) toggleType(type);
                                    }}>
                                        <div className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-50 rounded-lg transition-colors">
                                            {typeLogoConfig[type] || '💾'}
                                        </div>
                                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 border border-white text-[9px] font-bold text-slate-600 shadow-sm">
                                            {items.length}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Right Panel - List or Detail */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    {viewMode === 'list' && (
                        <div className="flex flex-col h-full">
                            {/* Data Grid */}
                            <div className="flex-1 overflow-auto">
                                {/* Batch Action Toolbar */}
                                <div className="flex items-center justify-between py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-20">
                                    <div className="flex items-center">
                                        {/* Checkbox container - same width as table column */}
                                        <div className="w-10 px-3 flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedTables.length > 0 && selectedTables.length === filteredAssets.length}
                                                disabled={isReadOnly}
                                                onChange={(e) => {
                                                    if (isReadOnly) return;
                                                    if (e.target.checked) {
                                                        const visibleIds = filteredAssets.map(a => a.table);
                                                        handleSelectAll(visibleIds);
                                                    } else {
                                                        clearSelection();
                                                    }
                                                }}
                                                className={`w-4 h-4 text-blue-600 rounded border-slate-300 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                            />
                                        </div>
                                        <span className="text-sm text-slate-600 px-6">全选</span>
                                        {selectedTables.length > 0 && (
                                            <span className="text-sm text-blue-600 font-medium">
                                                已选 {selectedTables.length} 张
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 pr-4">
                                        {!isReadOnly && (
                                            <BatchOperationBar
                                                selectedCount={selectedTables.length}
                                                isAnalyzing={batchAnalyzing}
                                                runConfig={runConfig}
                                                onOpenRunModal={handleShowRunModal}
                                                onBatchSemanticGen={() => {
                                                    setShowBatchSemanticModal(true);
                                                    setBatchSemanticStep('config');
                                                }}
                                                progressProps={{
                                                    currentAnalyzing,
                                                    completedResults,
                                                    progress: batchProgress,
                                                    onResultClick: (tableId) => {
                                                        setViewMode('detail');
                                                        setSelectedTableId(tableId);
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-slate-600 border-b-2 border-slate-200 sticky top-0 z-20 backdrop-blur-sm bg-white/95">
                                        <tr>
                                            <th className="px-3 py-4 w-12 align-middle"></th>
                                            <th className="px-4 py-4 font-semibold text-left min-w-[160px] align-middle">视图名称</th>
                                            <th className="px-4 py-4 font-semibold text-left min-w-[120px] align-middle">业务名称</th>
                                            <th className="px-4 py-4 font-semibold text-center w-28 align-middle">建模状态</th>
                                            <th className="px-4 py-4 font-semibold text-left min-w-[120px] align-middle">数据源</th>
                                            <th className="px-4 py-4 font-semibold text-right w-24 align-middle">行数</th>
                                            <th className="px-4 py-4 font-semibold text-center w-24 align-middle">
                                                <button
                                                    onClick={() => {
                                                        setSortField(prev => {
                                                            if (prev === 'pendingReviewFields') {
                                                                setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                                                                return prev;
                                                            }
                                                            setSortOrder('desc');
                                                            return 'pendingReviewFields';
                                                        });
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                                                >
                                                    待Review
                                                    <ChevronDown
                                                        size={12}
                                                        className={`transition-transform ${sortField === 'pendingReviewFields' && sortOrder === 'asc' ? 'rotate-180' : ''} ${sortField === 'pendingReviewFields' ? 'text-slate-700' : 'text-slate-400'}`}
                                                    />
                                                </button>
                                            </th>
                                            <th className="px-4 py-4 font-semibold text-center w-20 align-middle">
                                                <button
                                                    onClick={() => {
                                                        setSortField(prev => {
                                                            if (prev === 'gateFailedItems') {
                                                                setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                                                                return prev;
                                                            }
                                                            setSortOrder('desc');
                                                            return 'gateFailedItems';
                                                        });
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                                                >
                                                    Gate未过
                                                    <ChevronDown
                                                        size={12}
                                                        className={`transition-transform ${sortField === 'gateFailedItems' && sortOrder === 'asc' ? 'rotate-180' : ''} ${sortField === 'gateFailedItems' ? 'text-slate-700' : 'text-slate-400'}`}
                                                    />
                                                </button>
                                            </th>
                                            <th className="px-4 py-4 font-semibold text-center w-20 align-middle">
                                                <button
                                                    onClick={() => {
                                                        setSortField(prev => {
                                                            if (prev === 'riskItems') {
                                                                setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                                                                return prev;
                                                            }
                                                            setSortOrder('desc');
                                                            return 'riskItems';
                                                        });
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                                                >
                                                    风险项
                                                    <ChevronDown
                                                        size={12}
                                                        className={`transition-transform ${sortField === 'riskItems' && sortOrder === 'asc' ? 'rotate-180' : ''} ${sortField === 'riskItems' ? 'text-slate-700' : 'text-slate-400'}`}
                                                    />
                                                </button>
                                            </th>
                                            <th className="px-4 py-4 font-semibold text-center w-28 align-middle">更新时间</th>
                                            <th className="px-4 py-4 font-semibold text-center w-32 align-middle">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(() => {
                                            // Pagination logic
                                            const totalItems = filteredAssets.length;
                                            const totalPages = Math.ceil(totalItems / pageSize);
                                            const startIndex = (currentPage - 1) * pageSize;
                                            const endIndex = startIndex + pageSize;
                                            const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

                                            return paginatedAssets.map((asset, index) => (
                                                <tr key={asset.table}
                                                    onClick={() => {
                                                        handleTableClick(asset.table);
                                                        setPageMode('BROWSE'); // 行点击进入浏览模式
                                                    }}
                                                    className={`hover:bg-purple-50/30 cursor-pointer group transition-all duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} ${selectedTables.includes(asset.table) ? '!bg-purple-50' : ''}`}
                                                >
                                                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTables.includes(asset.table)}
                                                            disabled={isReadOnly}
                                                            onChange={() => {
                                                                if (isReadOnly) return;
                                                                toggleTableSelection(asset.table);
                                                            }}
                                                            className={`w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                                                <Table size={14} className="text-blue-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-blue-600 font-semibold text-sm truncate group-hover:text-blue-700">{asset.table || asset.name || 'Unknown Table'}</div>
                                                                {asset.comment && <div className="text-xs text-slate-400 truncate max-w-[180px]">{asset.comment}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {asset.semanticAnalysis?.businessName ? (
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className="text-slate-800 font-medium">{asset.semanticAnalysis.businessName}</span>
                                                                {(() => {
                                                                    // Check if mapped
                                                                    const mappedEntry = Object.entries(mockBOTableMappings).find(([_, config]) => config.tableName === asset.table);
                                                                    if (mappedEntry) {
                                                                        const [boId, config] = mappedEntry;
                                                                        const boName = businessObjects?.find(b => b.id === boId)?.name || boId;
                                                                        return (
                                                                            <span
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setViewMappingBO(boId);
                                                                                }}
                                                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                                                                            >
                                                                                <Share2 size={10} />
                                                                                已关联: {boName}
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {(() => {
                                                            const semanticStage = asset.semanticStage || 'NOT_STARTED';
                                                            const runSummary = asset.lastRun as RunSummary | null;
                                                            return (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${semanticStageToneMap[semanticStage]}`}>
                                                                        {semanticStageLabelMap[semanticStage]}
                                                                    </span>
                                                                    {runSummary && (
                                                                        <span className={`text-[10px] ${runStatusToneMap[runSummary.status]}`}>
                                                                            Run {runSummary.runId} · {runStatusLabelMap[runSummary.status]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                                                {asset.sourceType}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[140px]">{asset.sourceName}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="font-mono text-slate-700 font-medium">
                                                            {typeof asset.rows === 'number'
                                                                ? asset.rows >= 1000000 ? `${(asset.rows / 1000000).toFixed(1)}M`
                                                                    : asset.rows >= 1000 ? `${(asset.rows / 1000).toFixed(1)}K`
                                                                        : asset.rows.toLocaleString()
                                                                : asset.rows || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {(() => {
                                                            const governanceStatus = asset.governanceStatus as GovernanceStatus;
                                                            const stats = asset.reviewStats as ReviewStats | null;
                                                            if (governanceStatus === 'S0') return <span className="text-slate-300">-</span>;
                                                            const value = stats?.pendingReviewFields || 0;
                                                            return (
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${value > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {value}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {(() => {
                                                            const governanceStatus = asset.governanceStatus as GovernanceStatus;
                                                            const stats = asset.reviewStats as ReviewStats | null;
                                                            if (governanceStatus === 'S0') return <span className="text-slate-300">-</span>;
                                                            const value = stats?.gateFailedItems || 0;
                                                            return (
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${value > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {value}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {(() => {
                                                            const governanceStatus = asset.governanceStatus as GovernanceStatus;
                                                            const stats = asset.reviewStats as ReviewStats | null;
                                                            if (governanceStatus === 'S0') return <span className="text-slate-300">-</span>;
                                                            const value = stats?.riskItems || 0;
                                                            return (
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${value > 0 ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {value}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1 text-slate-500 text-xs">
                                                            <Clock size={12} className="text-slate-400" />
                                                            {asset.updateTime?.split(' ')[0] || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Handle both traditional table ID and internal ID
                                                                handleTableClick(asset.table || asset.name || asset.id);
                                                                // CTA 统一进入语义理解模式
                                                                setPageMode('SEMANTIC');
                                                            }}
                                                            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 mx-auto ${asset.semanticStage === 'READY_FOR_OBJECT'
                                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                                }`}
                                                        >
                                                            {asset.semanticStage === 'READY_FOR_OBJECT' ? (
                                                                <>
                                                                    <Share2 size={12} />
                                                                    查看结果
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {asset.semanticStage === 'NOT_STARTED' && <Wand2 size={12} />}
                                                                    {asset.semanticStage === 'NOT_STARTED' ? '开始理解' : '继续理解'}
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                                {filteredAssets.length === 0 && (
                                    <div className="p-12 text-center text-slate-400">
                                        <Search size={48} className="mx-auto mb-4 opacity-10" />
                                        <p>没有找到匹配的表</p>
                                    </div>
                                )}
                                {/* Pagination Controls */}
                                {filteredAssets.length > 0 && (
                                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                            <span>共 {filteredAssets.length} 条记录</span>
                                            <div className="flex items-center gap-2">
                                                <span>每页</span>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => {
                                                        setPageSize(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                                <span>条</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(1)}
                                                disabled={currentPage === 1}
                                                className={`px-2 py-1 text-xs rounded ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                首页
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1 text-sm rounded ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                上一页
                                            </button>
                                            <span className="px-3 py-1 text-sm text-slate-700">
                                                第 <span className="font-medium text-purple-600">{currentPage}</span> / {Math.ceil(filteredAssets.length / pageSize)} 页
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAssets.length / pageSize), p + 1))}
                                                disabled={currentPage >= Math.ceil(filteredAssets.length / pageSize)}
                                                className={`px-3 py-1 text-sm rounded ${currentPage >= Math.ceil(filteredAssets.length / pageSize) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                下一页
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(Math.ceil(filteredAssets.length / pageSize))}
                                                disabled={currentPage >= Math.ceil(filteredAssets.length / pageSize)}
                                                className={`px-2 py-1 text-xs rounded ${currentPage >= Math.ceil(filteredAssets.length / pageSize) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                末页
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {viewMode === 'detail' && (
                        selectedTable ? (
                            <div className="flex flex-col h-full animate-slide-in-right">
                                {/* Detail Header */}
                                {/* V2.4: Governance Top Bar */}
                                <GovernanceTopBar
                                    profile={semanticProfile}
                                    mode={governanceMode}
                                    onModeChange={(mode) => {
                                        if (mode === 'SEMANTIC' && governanceMode === 'BROWSE') {
                                            // Trigger Simulation
                                            setIsAnalysisLoading(true);
                                        } else {
                                            setGovernanceMode(mode);
                                        }
                                    }}
                                    fields={selectedTableFields}
                                    onBack={handleBackToList}
                                    onFinish={() => {
                                        setGovernanceMode('BROWSE');
                                        // Update status to S3 (Governance Complete)
                                        setSemanticProfile(prev => ({
                                            ...prev,
                                            governanceStatus: 'S3',
                                            analysisStep: 'done'
                                        }));
                                    }}
                                />
                                {/* V2.4: Semantic Assist Bar - 语义理解辅助检测状态条 */}
                                <div className="px-4 pt-2">
                                    <SemanticAssistBar
                                        assist={{
                                            ...DEFAULT_SEMANTIC_ASSIST,
                                            enabled: isAssistEnabled,
                                            template: assistSettings.template as any,
                                            runtimeConfig: {
                                                ...DEFAULT_SEMANTIC_ASSIST.runtimeConfig,
                                                sampleRatio: (assistSettings.sampleRatio * 100) as any
                                            },
                                            scope: 'TABLE',
                                            status: semanticProfile.governanceStatus === 'S1' ? 'SUCCESS' : 'IDLE',
                                        }}
                                        onToggle={(enabled) => {
                                            setIsAssistEnabled(enabled);
                                        }}
                                        onOpenConfig={() => {
                                            setShowAssistConfig(true);
                                        }}
                                        onOpenTemplateInfo={() => {
                                            setShowTemplateInfo(true);
                                        }}
                                        onRefresh={() => {
                                            // Handle refresh logic similar to handleRunProfile
                                            setIsAnalysisLoading(true);
                                            // Simulation
                                            setTimeout(() => {
                                                setIsAnalysisLoading(false);
                                                // Update last time?
                                            }, 2000);
                                        }}
                                    />
                                </div>

                                {isAnalysisLoading && (
                                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                                        <div className="w-[600px] animate-in zoom-in-95 duration-200">
                                            <AnalysisProgressPanel
                                                tableName={selectedTableId || 'Unknown Table'}
                                                onComplete={(result) => {
                                                    setIsAnalysisLoading(false);
                                                    setGovernanceMode('SEMANTIC');
                                                    // Update profile with mock result and set status to S1 (AI Suggested)
                                                    setSemanticProfile(prev => ({
                                                        ...prev,
                                                        ...result,
                                                        governanceStatus: 'S1', // Mark as AI Suggested
                                                        analysisStep: 'done'
                                                    }));
                                                }}
                                                onCancel={() => setIsAnalysisLoading(false)}
                                                mockAnalysisResult={{ ...semanticProfile, finalScore: 0.92 }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className={`flex-1 ${governanceMode === 'BROWSE' ? 'overflow-y-auto p-6 bg-slate-50/50' : 'overflow-hidden bg-slate-50 p-4'}`}>
                                    {/* Map governanceMode to display logic */}
                                    {governanceMode === 'SEMANTIC' ? (
                                        <div className="grid grid-cols-[240px_1fr_350px] gap-4 h-full">
                                            {/* LEFT: Field List */}
                                            <GovernanceFieldList
                                                fields={selectedTableFields}
                                                semanticProfile={semanticProfile}
                                                selectedField={focusField}
                                                onSelectField={setFocusField}
                                                className="border-slate-200 shadow-sm"
                                            />

                                            {/* CENTER: Context */}
                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 font-medium text-slate-700 flex items-center gap-2 text-sm">
                                                    <FileText size={16} className="text-blue-600" />
                                                    {focusField ? `🔍 字段语义分析: ${focusField}` : '💡 整表语义概览'}
                                                </div>
                                                <div className="flex-1 overflow-y-auto relative">
                                                    {focusField ? (
                                                        <div className="absolute inset-0">
                                                            <SemanticContextPanel
                                                                profile={semanticProfile}
                                                                focusField={focusField}
                                                                fields={selectedTableFields}
                                                            />
                                                        </div>
                                                    ) : (
                                                        (() => {
                                                            // Calculate statistics
                                                            const totalFields = selectedTableFields.length;
                                                            const confirmedFields = semanticProfile.fields?.filter(f => f.semanticStatus === 'DECIDED') || [];
                                                            const confirmedCount = confirmedFields.length;
                                                            const pendingCount = totalFields - confirmedCount;
                                                            const stats = semanticProfile.reviewStats as any;
                                                            const highRiskCount = stats?.riskItems || 0;

                                                            // AI field grouping by pattern
                                                            const coreFields = selectedTableFields.filter(f =>
                                                                /^(id|code|name|title|key|uid|uuid)$/i.test(f.fieldName) ||
                                                                /_id$|_code$|_name$/i.test(f.fieldName)
                                                            );
                                                            const auditFields = selectedTableFields.filter(f =>
                                                                /(create|update|delete|modify|insert)_(time|date|at|by|user)/i.test(f.fieldName) ||
                                                                /^(created_at|updated_at|deleted_at|creator|updater|modifier)$/i.test(f.fieldName)
                                                            );
                                                            const statusFields = selectedTableFields.filter(f =>
                                                                /(status|state|flag|enabled|disabled|active|deleted|is_)/i.test(f.fieldName)
                                                            );

                                                            return (
                                                                <div className="p-6 space-y-5">
                                                                    {/* Statistics Cards */}
                                                                    <div className="grid grid-cols-3 gap-3">
                                                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200">
                                                                            <div className="text-xs text-blue-600 font-medium mb-1">字段总数</div>
                                                                            <div className="text-2xl font-bold text-blue-900">{totalFields}</div>
                                                                        </div>
                                                                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-4 border border-emerald-200">
                                                                            <div className="text-xs text-emerald-600 font-medium mb-1">已确认</div>
                                                                            <div className="text-2xl font-bold text-emerald-900">{confirmedCount}</div>
                                                                            <div className="text-xs text-emerald-600 mt-1">{totalFields > 0 ? Math.round((confirmedCount / totalFields) * 100) : 0}%</div>
                                                                        </div>
                                                                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-4 border border-amber-200">
                                                                            <div className="text-xs text-amber-600 font-medium mb-1">待确认</div>
                                                                            <div className="text-2xl font-bold text-amber-900">{pendingCount}</div>
                                                                            <div className="text-xs text-amber-600 mt-1">{totalFields > 0 ? Math.round((pendingCount / totalFields) * 100) : 0}%</div>
                                                                        </div>
                                                                    </div>

                                                                    {/* High Risk Alert */}
                                                                    {highRiskCount > 0 && (
                                                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                                <span className="text-red-600 text-sm font-bold">!</span>
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className="text-sm font-semibold text-red-900 mb-1">
                                                                                    发现 {highRiskCount} 个高风险字段
                                                                                </div>
                                                                                <div className="text-xs text-red-700">
                                                                                    建议优先处理高风险字段，确保数据质量
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* AI Field Grouping */}
                                                                    <div className="space-y-3">
                                                                        <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                                            <Wand2 size={16} className="text-purple-600" />
                                                                            AI 推荐字段分组
                                                                        </div>

                                                                        {/* Core Fields */}
                                                                        {coreFields.length > 0 && (
                                                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                                                <div className="text-xs font-medium text-slate-700 mb-2 flex items-center justify-between">
                                                                                    <span>🔑 业务核心字段</span>
                                                                                    <span className="text-slate-500">{coreFields.length}</span>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {coreFields.slice(0, 8).map(field => (
                                                                                        <button
                                                                                            key={field.fieldName}
                                                                                            onClick={() => setFocusField(field.fieldName)}
                                                                                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                                                        >
                                                                                            {field.fieldName}
                                                                                        </button>
                                                                                    ))}
                                                                                    {coreFields.length > 8 && (
                                                                                        <span className="px-2 py-1 text-xs text-slate-400">+{coreFields.length - 8}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Audit Fields */}
                                                                        {auditFields.length > 0 && (
                                                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                                                <div className="text-xs font-medium text-slate-700 mb-2 flex items-center justify-between">
                                                                                    <span>📝 审计字段</span>
                                                                                    <span className="text-slate-500">{auditFields.length}</span>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {auditFields.slice(0, 6).map(field => (
                                                                                        <button
                                                                                            key={field.fieldName}
                                                                                            onClick={() => setFocusField(field.fieldName)}
                                                                                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                                                        >
                                                                                            {field.fieldName}
                                                                                        </button>
                                                                                    ))}
                                                                                    {auditFields.length > 6 && (
                                                                                        <span className="px-2 py-1 text-xs text-slate-400">+{auditFields.length - 6}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Status Fields */}
                                                                        {statusFields.length > 0 && (
                                                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                                                <div className="text-xs font-medium text-slate-700 mb-2 flex items-center justify-between">
                                                                                    <span>🔄 状态字段</span>
                                                                                    <span className="text-slate-500">{statusFields.length}</span>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {statusFields.slice(0, 6).map(field => (
                                                                                        <button
                                                                                            key={field.fieldName}
                                                                                            onClick={() => setFocusField(field.fieldName)}
                                                                                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                                                        >
                                                                                            {field.fieldName}
                                                                                        </button>
                                                                                    ))}
                                                                                    {statusFields.length > 6 && (
                                                                                        <span className="px-2 py-1 text-xs text-slate-400">+{statusFields.length - 6}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* No groups found */}
                                                                        {coreFields.length === 0 && auditFields.length === 0 && statusFields.length === 0 && (
                                                                            <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-400 text-sm">
                                                                                未识别出推荐字段分组
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Quick Action Hint */}
                                                                    <div className="pt-4 border-t border-slate-100">
                                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                            <ArrowLeft size={14} />
                                                                            <span>从左侧字段列表或上方分组中选择字段开始语义判定</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()
                                                    )}
                                                </div>
                                            </div>

                                            {/* RIGHT: Decision Panel */}
                                            {focusField ? (
                                                isReadOnly ? (
                                                    <div className="flex items-center justify-center h-full text-slate-400 bg-white border border-slate-200 rounded-xl border-dashed">
                                                        <div className="text-center">
                                                            <Wand2 size={24} className="mx-auto mb-2 opacity-20" />
                                                            <span className="text-xs">语义判定仅在工作态可编辑</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <SemanticDecisionPanel
                                                        fieldName={focusField}
                                                        fieldProfile={(() => {
                                                            // Get existing profile or create with AI suggestions
                                                            const existingProfile = semanticProfile.fields?.find((f: any) => f.fieldName === focusField);
                                                            if (existingProfile) return existingProfile;

                                                            // Generate AI suggestions for new fields
                                                            const fieldNameLower = focusField.toLowerCase();
                                                            let aiRole = 'BusAttr';
                                                            let aiConfidence = 70;
                                                            let aiSuggestion = '';

                                                            if (fieldNameLower.endsWith('_id') || fieldNameLower === 'id') {
                                                                aiRole = 'Identifier';
                                                                aiConfidence = 95;
                                                                aiSuggestion = focusField.replace(/_id$/i, '').replace(/_/g, ' ') + '编号';
                                                            } else if (fieldNameLower.includes('status') || fieldNameLower.includes('state')) {
                                                                aiRole = 'Status';
                                                                aiConfidence = 90;
                                                                aiSuggestion = '状态';
                                                            } else if (fieldNameLower.includes('time') || fieldNameLower.includes('date') || fieldNameLower.includes('created') || fieldNameLower.includes('updated')) {
                                                                aiRole = 'EventHint';
                                                                aiConfidence = 92;
                                                                aiSuggestion = fieldNameLower.includes('created') ? '创建时间' : fieldNameLower.includes('updated') ? '更新时间' : '时间';
                                                            } else if (fieldNameLower.includes('name')) {
                                                                aiRole = 'BusAttr';
                                                                aiConfidence = 85;
                                                                aiSuggestion = '名称';
                                                            } else if (fieldNameLower.includes('amount') || fieldNameLower.includes('price') || fieldNameLower.includes('count')) {
                                                                aiRole = 'Measure';
                                                                aiConfidence = 88;
                                                                aiSuggestion = fieldNameLower.includes('amount') ? '金额' : fieldNameLower.includes('price') ? '价格' : '数量';
                                                            }

                                                            return {
                                                                fieldName: focusField,
                                                                name: focusField,
                                                                role: aiRole,
                                                                roleConfidence: aiConfidence,
                                                                aiSuggestion: aiSuggestion,
                                                                tags: [aiRole === 'Identifier' ? '主键' : aiRole === 'Status' ? '状态' : '业务'],
                                                                semanticStatus: 'SUGGESTED'
                                                            } as any;
                                                        })()}
                                                        onDecision={(decision) => handleSemanticDecision(focusField, decision)}
                                                        className="border-slate-200 shadow-sm"
                                                    />
                                                )
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-400 bg-white border border-slate-200 rounded-xl border-dashed">
                                                    <div className="text-center">
                                                        <Wand2 size={24} className="mx-auto mb-2 opacity-20" />
                                                        <span className="text-xs">选择字段进行语义判定</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {isIdle && (
                                                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
                                                    <Info size={14} className="mt-0.5 text-blue-600" />
                                                    <div>
                                                        <div className="font-medium">当前仅展示字段结构与统计特征</div>
                                                        <div className="text-xs text-blue-600">语义理解完成后生成业务语义建议。</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Analysis Progress / Result Area */}
                                            <div className="mb-6">
                                                {isAnalyzing ? (
                                                    <AnalysisProgressPanel
                                                        tableName={selectedTable.table}
                                                        mockAnalysisResult={pendingAnalysisResult}
                                                        onCancel={() => setIsAnalyzing(false)}
                                                        onComplete={(result) => {
                                                            setSemanticProfile({
                                                                ...result,
                                                                governanceStatus: (result.governanceStatus || 'S1') as GovernanceStatus,
                                                                analysisStep: 'done',
                                                                relationships: semanticProfile.relationships
                                                            });
                                                            setScanResults((prev: any[]) => prev.map((item: any) =>
                                                                item.table === selectedTable.table
                                                                    ? {
                                                                        ...item,
                                                                        status: 'pending_review',
                                                                        governanceStatus: 'S1',
                                                                        reviewStats: result.reviewStats,
                                                                        semanticAnalysis: { ...result, analysisStep: 'done' }
                                                                    }
                                                                    : item
                                                            ));
                                                            setResultTab('overview');
                                                            setFieldViewMode('semantic');
                                                            setEditModeSafe(true);
                                                            setIsAnalyzing(false);
                                                            setPendingAnalysisResult(null);
                                                        }}
                                                    />
                                                ) : semanticProfile.analysisStep === 'idle' ? (
                                                    // V2.3 Phase 2: Hide Analysis Engine and Conclusion in Pending State
                                                    // Only show the header and the field list (rendered below)
                                                    null
                                                ) : (
                                                    <>
                                                        {(() => {
                                                            const scorePercent = Math.round((semanticProfile.finalScore || 0) * 100);
                                                            const ruleEvidence = Array.isArray(semanticProfile.ruleEvidence)
                                                                ? semanticProfile.ruleEvidence
                                                                : [];
                                                            const aiEvidenceItems = Array.isArray(semanticProfile.aiEvidenceItems)
                                                                ? semanticProfile.aiEvidenceItems
                                                                : [];
                                                            const conflictCount = ruleEvidence.filter((item) => /冲突|待确认|复核/.test(item)).length;
                                                            const commentCoverage = Math.round((semanticProfile.ruleScore?.comment || 0) * 100);
                                                            const gateResult = semanticProfile.gateResult?.result;
                                                            const reviewStats = semanticProfile.reviewStats
                                                                || buildReviewStats(selectedTable.table, selectedTableFields, selectedTable.comment);
                                                            const pendingReviewCount = reviewStats?.pendingReviewFields || 0;
                                                            const gateFailedCount = reviewStats?.gateFailedItems || 0;
                                                            const riskItemsCount = reviewStats?.riskItems || 0;
                                                            const ruleScoreTotal = semanticProfile.ruleScore?.total || 0;
                                                            const analyzedFieldsForRisk = selectedTableFields.map((field: any) => analyzeField(field));
                                                            const sensitiveCount = analyzedFieldsForRisk.filter((field) => ['L3', 'L4'].includes(field.sensitivity)).length;
                                                            const sensitivityRatio = analyzedFieldsForRisk.length === 0 ? 0 : sensitiveCount / analyzedFieldsForRisk.length;
                                                            const sensitivityPercent = Math.round(sensitivityRatio * 100);
                                                            let riskLabel = '低风险';
                                                            let riskTone: 'red' | 'amber' | 'emerald' = 'emerald';
                                                            if (gateResult === 'REJECT' || riskItemsCount >= 2) {
                                                                riskLabel = '高风险';
                                                                riskTone = 'red';
                                                            } else if (gateResult === 'REVIEW' || riskItemsCount === 1) {
                                                                riskLabel = '中风险';
                                                                riskTone = 'amber';
                                                            }
                                                            const gateFallbackReasons: string[] = [];
                                                            if (semanticProfile.gateResult?.details?.primaryKey === false) {
                                                                gateFallbackReasons.push('未找到主键字段。');
                                                            }
                                                            if (semanticProfile.gateResult?.details?.lifecycle === false) {
                                                                gateFallbackReasons.push('未找到生命周期字段 (如: create_time, update_time)。');
                                                            }
                                                            if (semanticProfile.gateResult?.details?.tableType === false) {
                                                                gateFallbackReasons.push('表类型命中排除规则。');
                                                            }
                                                            const gateReasonsSource = semanticProfile.gateResult?.reasons?.length
                                                                ? semanticProfile.gateResult.reasons
                                                                : gateFallbackReasons;
                                                            const uniqueGateReasons = Array.from(new Set(gateReasonsSource));
                                                            const gateIssueCount = gateResult === 'PASS'
                                                                ? 0
                                                                : Math.max(gateFailedCount, uniqueGateReasons.length || 0, 1);
                                                            const gateTitle = gateResult === 'REVIEW' ? 'Gate 需复核项' : 'Gate 未通过项';
                                                            const gateSummaryItems = uniqueGateReasons.slice(0, 3);
                                                            const riskReasonCandidates = [
                                                                ...ruleEvidence.filter((item) => /冲突|敏感|风险|复核|缺失/.test(item)),
                                                                ...aiEvidenceItems.map(item => `${item.field}：${item.reason}`),
                                                                conflictCount > 0 ? `冲突字段 ${conflictCount} 个` : null,
                                                                commentCoverage < 60 ? `口径覆盖度 ${commentCoverage}%` : null,
                                                                ruleScoreTotal < 0.6 ? `规则评分 ${Math.round(ruleScoreTotal * 100)}%` : null,
                                                                sensitivityRatio >= 0.3 ? `高敏字段占比 ${sensitivityPercent}%` : null,
                                                                scorePercent < 65 ? `通过率 ${scorePercent}%` : null,
                                                                gateResult === 'REJECT' ? 'Gate 未通过' : gateResult === 'REVIEW' ? 'Gate 需复核' : null
                                                            ].filter(Boolean) as string[];
                                                            const riskSummaryItems = riskReasonCandidates.slice(0, 3);
                                                            const pendingSummaryItems = [
                                                                `字段 ${pendingReviewCount}`,
                                                                `对象 ${pendingReviewCount > 0 ? 1 : 0}`
                                                            ];
                                                            const summarySections = [
                                                                { key: 'gate', title: gateTitle, count: gateIssueCount, items: gateSummaryItems },
                                                                { key: 'risk', title: '风险项', count: riskItemsCount, items: riskSummaryItems },
                                                                { key: 'review', title: '待Review', count: pendingReviewCount, items: pendingSummaryItems }
                                                            ];
                                                            const gateLabelMap: Record<string, string> = {
                                                                PASS: '通过',
                                                                REVIEW: '需复核',
                                                                REJECT: '未通过'
                                                            };
                                                            const gateLabel = gateResult ? (gateLabelMap[gateResult] || gateResult) : '-';
                                                            const gateReviewable = gateResult ? gateResult !== 'PASS' : false;
                                                            const canJumpToReview = pendingReviewCount > 0;
                                                            const canOpenGateDetail = gateReviewable;
                                                            const riskStyles = {
                                                                red: 'bg-red-50 text-red-600 border-red-100',
                                                                amber: 'bg-amber-50 text-amber-600 border-amber-100',
                                                                emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            };

                                                            const status = (semanticProfile.governanceStatus || (semanticProfile.analysisStep === 'done' ? 'S1' : 'S0')) as GovernanceStatus;
                                                            const statusDisplay = getGovernanceDisplay(status, rolledBackTableIds.has(selectedTable.table));
                                                            const statusSummary = statusDisplay.hint || statusDisplay.label;

                                                            const evidenceCount = ruleEvidence.length + aiEvidenceItems.length;
                                                            const fieldsCount = selectedTableFields.length;
                                                            const logsCount = upgradeHistory.filter(entry => entry.tableId === selectedTable.table).length;
                                                            const overviewAnchors = [
                                                                { id: 'result-summary', label: '治理摘要' },
                                                                { id: 'result-key-evidence', label: '关键证据' },
                                                                ...(gateReviewable ? [{ id: 'result-gate-detail', label: 'Gate 明细' }] : []),
                                                                { id: 'result-score-breakdown', label: '评分拆解' }
                                                            ];
                                                            const anchors = {
                                                                overview: overviewAnchors,
                                                                evidence: [
                                                                    { id: 'result-summary', label: '治理摘要' },
                                                                    { id: 'result-conclusion', label: '综合结论' },
                                                                    { id: 'result-analysis', label: '分析详情' }
                                                                ],
                                                                fields: [
                                                                    { id: 'result-summary', label: '治理摘要' },
                                                                    { id: 'result-fields', label: '字段分析' }
                                                                ],
                                                                structure: [
                                                                    { id: 'result-fields', label: '字段结构' }
                                                                ],
                                                                graph: [
                                                                    { id: 'result-graph', label: '关系图谱' }
                                                                ],
                                                                quality: [
                                                                    { id: 'result-quality', label: '质量概览' }
                                                                ],
                                                                logs: [
                                                                    { id: 'result-summary', label: '治理摘要' },
                                                                    { id: 'result-logs', label: '操作记录' }
                                                                ]
                                                            };

                                                            return (
                                                                <>
                                                                    <div id="result-summary" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div>
                                                                                <div className="text-xs text-slate-500">治理建议摘要</div>
                                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusDisplay.tone}`}>
                                                                                        {statusDisplay.label}
                                                                                    </span>
                                                                                    <span className="text-base font-semibold text-slate-800">
                                                                                        {statusSummary}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="mt-1 text-xs text-slate-400">基于规则门槛、字段评分与 AI 语义识别综合生成</div>
                                                                            </div>
                                                                            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${riskStyles[riskTone]}`}>
                                                                                {riskLabel}
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
                                                                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                                                                <div className="text-xs text-slate-500">通过率</div>
                                                                                <div className="text-lg font-semibold text-slate-800">{scorePercent}%</div>
                                                                            </div>
                                                                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                                                                <div className="text-xs text-slate-500">冲突数</div>
                                                                                <div className="text-lg font-semibold text-slate-800">{conflictCount}</div>
                                                                            </div>
                                                                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                                                                <div className="text-xs text-slate-500">覆盖度</div>
                                                                                <div className="text-lg font-semibold text-slate-800">{commentCoverage}%</div>
                                                                            </div>
                                                                            <button
                                                                                onClick={canJumpToReview ? handleJumpToProblemFields : undefined}
                                                                                disabled={!canJumpToReview}
                                                                                className={`rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition-colors ${canJumpToReview ? 'hover:border-amber-200 hover:bg-amber-50/40 cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                                                                            >
                                                                                <div className="text-xs text-slate-500">待Review字段</div>
                                                                                <div className="text-lg font-semibold text-slate-800">{pendingReviewCount}</div>
                                                                                <div className="text-[10px] text-slate-400 mt-1">{canJumpToReview ? '点击定位问题字段' : '暂无待Review字段'}</div>
                                                                            </button>
                                                                            <button
                                                                                onClick={canOpenGateDetail ? handleOpenGateDetail : undefined}
                                                                                disabled={!canOpenGateDetail}
                                                                                className={`rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition-colors ${canOpenGateDetail ? 'hover:border-red-200 hover:bg-red-50/40 cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                                                                            >
                                                                                <div className="text-xs text-slate-500">门槛状态</div>
                                                                                <div className="text-lg font-semibold text-slate-800">{gateLabel}</div>
                                                                                <div className="text-[10px] text-slate-400 mt-1">{canOpenGateDetail ? '查看 Gate 明细' : '门槛通过'}</div>
                                                                            </button>
                                                                        </div>
                                                                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                                                                            {summarySections.map(section => (
                                                                                <div key={section.key} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                                                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                                                                        <span>{section.title}</span>
                                                                                        <span className="font-medium text-slate-700">{section.count}</span>
                                                                                    </div>
                                                                                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                                                                                        {section.items.length > 0 ? section.items.map((item, idx) => (
                                                                                            <div key={`${section.key}-${idx}`} className="flex items-start gap-2">
                                                                                                <span className="text-slate-400">-</span>
                                                                                                <span>{item}</span>
                                                                                            </div>
                                                                                        )) : (
                                                                                            <div className="text-xs text-slate-400">无</div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-6 grid grid-cols-1 gap-6">
                                                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative min-h-[600px]">
                                                                            <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 justify-between">
                                                                                <div className="flex items-center gap-1">
                                                                                    {([
                                                                                        { key: 'overview', label: '概览', count: undefined },
                                                                                        { key: 'evidence', label: '证据', count: evidenceCount },
                                                                                        { key: 'structure', label: '字段结构', count: fieldsCount },
                                                                                        { key: 'graph', label: '关系图谱', count: semanticProfile.relationships?.length || 0 },
                                                                                        { key: 'quality', label: '质量概览', count: undefined },
                                                                                        { key: 'logs', label: '日志', count: logsCount }
                                                                                    ] as const).map(tab => (
                                                                                        <button
                                                                                            key={tab.key}
                                                                                            onClick={() => setResultTab(tab.key)}
                                                                                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${resultTab === tab.key ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}
                                                                                        >
                                                                                            <span className="flex items-center gap-2">
                                                                                                <span>{tab.label}</span>
                                                                                                {typeof tab.count === 'number' && (
                                                                                                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500">
                                                                                                        {tab.count}
                                                                                                    </span>
                                                                                                )}
                                                                                            </span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            <div className="p-4 relative">
                                                                                {/* Directory Floating Widget */}
                                                                                {/* Directory Widget - Hidden temporarily per user request
                                                {anchors[resultTab] && anchors[resultTab].length > 0 && (
                                                    <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${showDirectory ? 'w-48 bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg p-3' : ''}`}>
                                                        <div className={`flex items-center ${showDirectory ? 'justify-between mb-2' : 'justify-end'}`}>
                                                            {showDirectory && <div className="text-xs font-medium text-slate-500 px-1">结果目录</div>}
                                                            <button
                                                                onClick={() => setShowDirectory(!showDirectory)}
                                                                className={`p-1.5 rounded-lg transition-colors ${showDirectory ? 'hover:bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600'}`}
                                                                title={showDirectory ? "收起目录" : "展开目录"}
                                                            >
                                                                {showDirectory ? <PanelLeftClose size={14} /> : <ListPlus size={16} />}
                                                            </button>
                                                        </div>
                                                        {showDirectory && (
                                                            <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                {anchors[resultTab].map(item => (
                                                                    <button
                                                                        key={item.id}
                                                                        onClick={() => scrollToSection(item.id)}
                                                                        className="w-full text-left text-xs text-slate-500 px-2 py-1.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                    >
                                                                        {item.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                */}

                                                                                {resultTab === 'overview' && (
                                                                                    <OverviewTab
                                                                                        profile={semanticProfile}
                                                                                        onNavigateToEvidence={() => setResultTab('evidence')}
                                                                                    />
                                                                                )}

                                                                                {resultTab === 'evidence' && (
                                                                                    <EvidenceTab
                                                                                        profile={semanticProfile}
                                                                                        fields={selectedTableFields}
                                                                                        selectedTable={selectedTable}
                                                                                        businessObject={(() => {
                                                                                            const mappedEntry = Object.entries(mockBOTableMappings).find(([_, config]) => config.tableName === selectedTable.table);
                                                                                            return mappedEntry ? (businessObjects || []).find(b => b.id === mappedEntry[0]) : undefined;
                                                                                        })()}
                                                                                        editMode={isReadOnly ? false : editMode}
                                                                                        setEditMode={setEditModeSafe}
                                                                                        onProfileChange={isReadOnly ? () => { } : (updates) => setSemanticProfile(prev => ({ ...prev, ...updates }))}
                                                                                        actions={{
                                                                                            onAccept: guardAction(handleSaveToMetadata),
                                                                                            onReject: guardAction(handleIgnore),
                                                                                            onConfirmEffective: guardAction(handleConfirmEffective),
                                                                                            onViewLogs: handleViewLogs,
                                                                                            onEvidenceAction: guardAction(handleEvidenceAction),
                                                                                            onSaveEdit: () => {
                                                                                                if (isReadOnly) return;
                                                                                                handleJustSave();
                                                                                                setEditModeSafe(false);
                                                                                            },
                                                                                            onFocusField: handleFocusField,
                                                                                            onUpgradeAccepted: guardAction((before, after) => {
                                                                                                if (!selectedTable) return;
                                                                                                recordUpgradeHistory(
                                                                                                    selectedTable.table,
                                                                                                    selectedTable.table,
                                                                                                    before,
                                                                                                    after
                                                                                                );
                                                                                            })
                                                                                        }}
                                                                                    />
                                                                                )}

                                                                                {resultTab === 'structure' && (
                                                                                    <div id="result-fields">
                                                                                        <DeepAnalysisTabs
                                                                                            profile={semanticProfile}
                                                                                            fields={selectedTableFields}
                                                                                            onProfileChange={isReadOnly ? () => { } : (updates) => setSemanticProfile(prev => ({ ...prev, ...updates }))}
                                                                                            focusField={focusField}
                                                                                        />
                                                                                    </div>
                                                                                )}

                                                                                {resultTab === 'graph' && (
                                                                                    <div className="bg-white rounded-xl border border-slate-200">
                                                                                        <RelationshipGraphTab semanticProfile={semanticProfile} />
                                                                                    </div>
                                                                                )}

                                                                                {resultTab === 'quality' && (
                                                                                    <QualityOverviewTab />
                                                                                )}

                                                                                {resultTab === 'logs' && (
                                                                                    <LogsTab
                                                                                        auditLogs={auditLogs.filter(entry => entry.tableId === selectedTable.table)}
                                                                                        upgradeHistory={upgradeHistory.filter(entry => entry.tableId === selectedTable.table)}
                                                                                        onRollback={rollbackUpgrade}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </>
                                                )}
                                            </div>


                                            {/* Field List & Relationships (Tabs) - Hidden when SemanticAnalysisCard is shown (V2) */}
                                            {semanticProfile.analysisStep === 'idle' && (
                                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                                    <div className="border-b border-slate-100 bg-slate-50 flex items-center px-2">
                                                        <button
                                                            onClick={() => setDetailTab('fields')}
                                                            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${detailTab === 'fields' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                                        >
                                                            <Table size={16} /> 字段结构 ({selectedTableFields.length})
                                                        </button>
                                                        {semanticProfile.analysisStep !== 'idle' && (
                                                            <button
                                                                onClick={() => setDetailTab('graph')}
                                                                className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${detailTab === 'graph' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                                            >
                                                                <Share2 size={16} /> 关系图谱 ({semanticProfile.relationships?.length || 0})
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setDetailTab('dimensions')}
                                                            title={isIdle ? "语义维度待理解" : ""}
                                                            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${detailTab === 'dimensions' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                                        >
                                                            <Layers size={16} /> 语义维度
                                                        </button>
                                                        <button
                                                            onClick={() => setDetailTab('quality')}
                                                            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${detailTab === 'quality' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                                        >
                                                            <Activity size={16} /> 质量概览
                                                        </button>
                                                    </div>

                                                    {/* Relationships View (Simple Visualization) */}
                                                    {/* Tab Content Rendering */}
                                                    {detailTab === 'graph' ? (
                                                        // Graph Tab with Edit Functionality
                                                        <div className="p-6 bg-slate-50/30 min-h-[400px]">
                                                            {/* Toolbar */}
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Share2 size={16} className="text-slate-500" />
                                                                    <span className="text-sm font-medium text-slate-700">
                                                                        实体关系图谱
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">
                                                                        ({semanticProfile.relationships?.length || 0} 个关联)
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingRel({ index: null, targetTable: '', type: 'Many-to-One', key: '' });
                                                                        setShowRelModal(true);
                                                                    }}
                                                                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                                                >
                                                                    <Plus size={14} />
                                                                    添加关系
                                                                </button>
                                                            </div>

                                                            {semanticProfile.relationships && semanticProfile.relationships.length > 0 ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <div className="relative flex items-center">
                                                                        <div className="z-10 w-32 h-32 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center p-2 text-center shadow-lg border-4 border-blue-100">
                                                                            <Database size={24} className="mb-1 opacity-80" />
                                                                            <div className="text-xs font-bold truncate w-full px-2">{selectedTable.table}</div>
                                                                            <div className="text-[10px] opacity-80">当前实体</div>
                                                                        </div>
                                                                        {semanticProfile.relationships.map((rel, idx) => {
                                                                            const angle = (idx * (360 / semanticProfile.relationships!.length)) * (Math.PI / 180);
                                                                            const radius = 180;
                                                                            const x = Math.cos(angle) * radius;
                                                                            const y = Math.sin(angle) * radius;
                                                                            return (
                                                                                <div key={idx} className="absolute flex flex-col items-center group" style={{ transform: `translate(${x}px, ${y}px)` }}>
                                                                                    <div className="absolute top-1/2 left-1/2 -z-10 h-[2px] bg-slate-300 origin-center"
                                                                                        style={{ transform: `translate(-50%, -50%) rotate(${angle * (180 / Math.PI) + 180}deg)`, width: `${radius}px`, left: `${-x / 2}px`, top: `${-y / 2}px` }} />
                                                                                    <div className="w-24 h-24 rounded-full bg-white border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center p-2 text-center z-10 hover:border-blue-400 transition-all cursor-pointer relative">
                                                                                        <div className="text-[10px] font-bold text-slate-500 mb-1">{rel.type}</div>
                                                                                        <div className="text-xs font-bold text-slate-700 break-all leading-tight">{rel.targetTable}</div>
                                                                                        <div className="mt-1 text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{rel.key}</div>
                                                                                        {/* Edit/Delete buttons on hover */}
                                                                                        <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setEditingRel({ index: idx, targetTable: rel.targetTable, type: rel.type, key: rel.key });
                                                                                                    setShowRelModal(true);
                                                                                                }}
                                                                                                className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                                                                                            >
                                                                                                <Edit3 size={10} />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setSemanticProfile(prev => ({
                                                                                                        ...prev,
                                                                                                        relationships: prev.relationships?.filter((_, i) => i !== idx)
                                                                                                    }));
                                                                                                }}
                                                                                                className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                                                                            >
                                                                                                <X size={10} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                                                                    <Share2 size={48} className="opacity-20 mb-4" />
                                                                    <p>暂无关联关系数据</p>
                                                                    <p className="text-xs mt-2">点击上方「添加关系」创建第一个关联</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : detailTab === 'dimensions' ? (
                                                        // Dimensions Tab - Seven Dimension Accordion View
                                                        <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                                                            {isIdle ? (
                                                                <>
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <span className="text-sm text-slate-500">共 {selectedTableFields.length} 个字段</span>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs text-slate-400">语义维度将在语义理解完成后生成</span>
                                                                            <button
                                                                                onClick={() => setExpandedFields(expandedFields.length === selectedTableFields.length ? [] : selectedTableFields.map((f: any) => f.fieldName))}
                                                                                className="text-xs text-blue-600 hover:text-blue-700"
                                                                            >
                                                                                {expandedFields.length === selectedTableFields.length ? '全部折叠' : '全部展开'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    {selectedTableFields.map((field: any, idx: number) => {
                                                                        const isExpanded = expandedFields.includes(field.fieldName);
                                                                        return (
                                                                            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                                                                                <button
                                                                                    onClick={() => setExpandedFields(isExpanded
                                                                                        ? expandedFields.filter(f => f !== field.fieldName)
                                                                                        : [...expandedFields, field.fieldName]
                                                                                    )}
                                                                                    className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors"
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <ChevronRight size={16} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                                        <span className="font-mono font-medium text-slate-700">{field.fieldName}</span>
                                                                                        <span className="text-xs text-slate-400">({field.type})</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-400">未识别</span>
                                                                                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-400">待识别</span>
                                                                                    </div>
                                                                                </button>
                                                                                {isExpanded && (
                                                                                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-01 语义角色</div>
                                                                                            <div className="text-xs text-slate-400">未识别（需语义理解）</div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-02 类型语义</div>
                                                                                            <div className="text-xs text-slate-400">未分析</div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-03 值域特征</div>
                                                                                            <div className="text-xs text-slate-400">未分析</div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-04 敏感等级</div>
                                                                                            <div className="text-xs text-slate-400">待识别</div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-05 业务元信息</div>
                                                                                            <div className="text-xs text-slate-400">尚未生成</div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-06 质量信号</div>
                                                                                            <div className="text-xs text-slate-400">仅展示统计项</div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100 col-span-2 lg:col-span-3">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-07 关联性</div>
                                                                                            <div className="text-xs text-slate-400">未分析</div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    <div className="text-xs text-slate-400">
                                                                        语义维度将在语义理解完成后生成，用于辅助确认字段业务含义。
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <span className="text-sm text-slate-500">共 {selectedTableFields.length} 个字段</span>
                                                                        <button
                                                                            onClick={() => setExpandedFields(expandedFields.length === selectedTableFields.length ? [] : selectedTableFields.map((f: any) => f.fieldName))}
                                                                            className="text-xs text-blue-600 hover:text-blue-700"
                                                                        >
                                                                            {expandedFields.length === selectedTableFields.length ? '全部折叠' : '全部展开'}
                                                                        </button>
                                                                    </div>
                                                                    {selectedTableFields.map((field: any, idx: number) => {
                                                                        const isExpanded = expandedFields.includes(field.fieldName);
                                                                        // Semantic calculations
                                                                        const ruleRole = field.fieldName?.endsWith('_id') ? 'Identifier' :
                                                                            field.fieldName?.includes('time') ? 'EventHint' :
                                                                                field.fieldName?.includes('status') ? 'Status' : 'BusAttr';
                                                                        const getSensitivity = (name: string): 'L1' | 'L2' | 'L3' | 'L4' => {
                                                                            if (name.includes('id_card') || name.includes('bank')) return 'L4';
                                                                            if (name.includes('mobile') || name.includes('phone') || name.includes('name') || name.includes('address')) return 'L3';
                                                                            if (name.includes('user') || name.includes('employee')) return 'L2';
                                                                            return 'L1';
                                                                        };
                                                                        const sensitivity = getSensitivity(field.fieldName);
                                                                        const getValueDomain = (type: string): string => {
                                                                            if (type.includes('tinyint') || type.includes('enum')) return '枚举型';
                                                                            if (type.includes('decimal') || type.includes('int')) return '范围型';
                                                                            if (type.includes('varchar') && type.includes('18')) return '格式型';
                                                                            return '自由文本';
                                                                        };
                                                                        const valueDomain = getValueDomain(field.type);
                                                                        const nullRate = Math.floor(Math.random() * 10);
                                                                        const uniqueness = field.fieldName.includes('id') ? 100 : Math.floor(Math.random() * 50) + 50;

                                                                        return (
                                                                            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                                                                                <button
                                                                                    onClick={() => setExpandedFields(isExpanded
                                                                                        ? expandedFields.filter(f => f !== field.fieldName)
                                                                                        : [...expandedFields, field.fieldName]
                                                                                    )}
                                                                                    className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors"
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <ChevronRight size={16} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                                        <span className="font-mono font-medium text-slate-700">{field.fieldName}</span>
                                                                                        <span className="text-xs text-slate-400">({field.type})</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-600">{ruleRole}</span>
                                                                                        <span className={`px-2 py-0.5 rounded text-xs ${sensitivity === 'L4' ? 'bg-red-50 text-red-600' : sensitivity === 'L3' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{sensitivity}</span>
                                                                                    </div>
                                                                                </button>
                                                                                {isExpanded && (
                                                                                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-01 语义角色</div>
                                                                                            <div className="font-medium text-slate-700">{ruleRole}</div>
                                                                                            <div className="text-xs text-slate-400 mt-1">置信度: 95%</div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-02 类型语义</div>
                                                                                            <div className="font-medium text-slate-700">{field.type}</div>
                                                                                            <div className="text-xs text-slate-400 mt-1">推断: {field.comment || '未知'}</div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-03 值域特征</div>
                                                                                            <div className="font-medium text-slate-700">{valueDomain}</div>
                                                                                            {/* Enhanced value domain details */}
                                                                                            {valueDomain === '枚举型' && (
                                                                                                <div className="mt-2">
                                                                                                    <div className="text-[10px] text-slate-400 mb-1">可能值:</div>
                                                                                                    <div className="flex flex-wrap gap-1">
                                                                                                        {(field.fieldName.includes('status')
                                                                                                            ? ['待处理', '进行中', '已完成', '已取消']
                                                                                                            : field.fieldName.includes('type')
                                                                                                                ? ['普通', 'VIP', '企业']
                                                                                                                : ['值1', '值2', '值3']
                                                                                                        ).map((v, i) => (
                                                                                                            <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">{v}</span>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                            {valueDomain === '格式型' && (
                                                                                                <div className="mt-2 text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded">
                                                                                                    {field.fieldName.includes('mobile') || field.fieldName.includes('phone')
                                                                                                        ? '格式: ^1[3-9]\\d{9}$'
                                                                                                        : field.fieldName.includes('id_card') || field.fieldName.includes('sfz')
                                                                                                            ? '格式: ^\\d{17}[\\dX]$'
                                                                                                            : field.fieldName.includes('email')
                                                                                                                ? '格式: ^[\\w.-]+@[\\w.-]+$'
                                                                                                                : '格式: 固定18位'}
                                                                                                </div>
                                                                                            )}
                                                                                            {valueDomain === '范围型' && (
                                                                                                <div className="mt-2 flex items-center gap-3 text-[10px]">
                                                                                                    <span className="text-slate-400">MIN: <span className="text-slate-600 font-medium">{field.fieldName.includes('amt') || field.fieldName.includes('price') ? '0.01' : '1'}</span></span>
                                                                                                    <span className="text-slate-400">MAX: <span className="text-slate-600 font-medium">{field.fieldName.includes('amt') || field.fieldName.includes('price') ? '99999.99' : '9999'}</span></span>
                                                                                                    <span className="text-slate-400">AVG: <span className="text-slate-600 font-medium">{field.fieldName.includes('amt') || field.fieldName.includes('price') ? '258.50' : '156'}</span></span>
                                                                                                </div>
                                                                                            )}
                                                                                            {valueDomain === '自由文本' && (
                                                                                                <div className="mt-2 text-[10px] text-slate-500">
                                                                                                    长度分布: 平均 {Math.floor(Math.random() * 50) + 20} 字符
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-04 敏感等级</div>
                                                                                            <div className={`font-medium ${sensitivity === 'L4' ? 'text-red-600' : sensitivity === 'L3' ? 'text-orange-600' : 'text-slate-700'}`}>
                                                                                                {sensitivity === 'L4' ? 'L4 高敏' : sensitivity === 'L3' ? 'L3 敏感' : sensitivity === 'L2' ? 'L2 内部' : 'L1 公开'}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-05 业务元信息</div>
                                                                                            <input
                                                                                                type="text"
                                                                                                defaultValue={field.comment || ''}
                                                                                                placeholder="业务名称..."
                                                                                                className="w-full text-sm font-medium text-slate-700 border-b border-slate-200 focus:border-blue-400 outline-none bg-transparent"
                                                                                            />
                                                                                            {/* Enhanced metadata */}
                                                                                            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                                                                                                <div>
                                                                                                    <span className="text-slate-400">责任人:</span>
                                                                                                    <span className="ml-1 text-slate-600">{field.fieldName.includes('user') ? '用户中心' : field.fieldName.includes('order') ? '交易中心' : '数据管理部'}</span>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="text-slate-400">标准:</span>
                                                                                                    <span className="ml-1 text-blue-600">{field.fieldName.includes('id') ? 'GB/T 35273' : field.fieldName.includes('time') ? 'ISO 8601' : '-'}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-06 质量信号</div>
                                                                                            <div className="space-y-1.5">
                                                                                                <div className="flex items-center justify-between text-xs">
                                                                                                    <span className="text-slate-500">空值率</span>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                                            <div className={`h-full rounded-full ${nullRate > 10 ? 'bg-red-500' : nullRate > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(nullRate * 5, 100)}%` }}></div>
                                                                                                        </div>
                                                                                                        <span className={`font-medium ${nullRate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{nullRate}%</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between text-xs">
                                                                                                    <span className="text-slate-500">唯一性</span>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${uniqueness}%` }}></div>
                                                                                                        </div>
                                                                                                        <span className="font-medium text-slate-700">{uniqueness}%</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between text-xs">
                                                                                                    <span className="text-slate-500">格式一致</span>
                                                                                                    <span className="font-medium text-emerald-600">{field.fieldName.includes('id') ? '100%' : Math.floor(95 + Math.random() * 5) + '%'}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100 col-span-2 lg:col-span-3">
                                                                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-07 关联性</div>
                                                                                            <div className="text-sm text-slate-600">
                                                                                                {field.fieldName?.endsWith('_id') ? (
                                                                                                    <div className="flex items-center gap-4">
                                                                                                        <span className="flex items-center gap-1.5">
                                                                                                            <Share2 size={12} className="text-blue-500" />
                                                                                                            <span className="text-slate-500">外键:</span>
                                                                                                            <span className="font-mono text-blue-600">t_{field.fieldName.replace('_id', '')}</span>
                                                                                                        </span>
                                                                                                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">显式FK</span>
                                                                                                    </div>
                                                                                                ) : field.fieldName.includes('code') || field.fieldName.includes('no') ? (
                                                                                                    <div className="flex items-center gap-4">
                                                                                                        <span className="flex items-center gap-1.5">
                                                                                                            <Share2 size={12} className="text-amber-500" />
                                                                                                            <span className="text-slate-500">潜在关联:</span>
                                                                                                            <span className="font-mono text-amber-600">可能与外部系统关联</span>
                                                                                                        </span>
                                                                                                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded">隐式FK</span>
                                                                                                    </div>
                                                                                                ) : field.fieldName.includes('total') || field.fieldName.includes('sum') || field.fieldName.includes('count') ? (
                                                                                                    <div className="flex items-center gap-4">
                                                                                                        <span className="flex items-center gap-1.5">
                                                                                                            <Activity size={12} className="text-purple-500" />
                                                                                                            <span className="text-slate-500">派生字段</span>
                                                                                                        </span>
                                                                                                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded">计算字段</span>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <span className="text-slate-400">无关联</span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    {/* Upgrade Suggestions Section */}
                                                                    {(() => {
                                                                        // Status Object Detection: status/state fields with expected multiple values
                                                                        const statusFields = selectedTableFields.filter((f: any) =>
                                                                            f.fieldName.includes('status') || f.fieldName.includes('state') ||
                                                                            f.fieldName.includes('phase') || f.fieldName.includes('stage')
                                                                        );

                                                                        // Behavior Object Detection: time fields with verb-like semantics
                                                                        const behaviorVerbs = ['pay', 'create', 'update', 'submit', 'approve', 'confirm', 'cancel', 'delete', 'login', 'logout', 'sign', 'complete', 'finish', 'start', 'end'];
                                                                        const behaviorFields = selectedTableFields.filter((f: any) => {
                                                                            if (!f.fieldName.includes('time') && !f.fieldName.includes('date') && !f.fieldName.includes('_at')) return false;
                                                                            return behaviorVerbs.some(verb => f.fieldName.includes(verb));
                                                                        });

                                                                        if (statusFields.length === 0 && behaviorFields.length === 0) return null;

                                                                        return (
                                                                            <div className="mt-4 pt-4 border-t border-slate-200">
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <Activity size={16} className="text-amber-500" />
                                                                                    <span className="text-sm font-bold text-slate-700">升级建议</span>
                                                                                    <span className="text-xs text-slate-400">基于语义理解自动识别</span>
                                                                                </div>

                                                                                {statusFields.length > 0 && (
                                                                                    <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            <Layers size={14} className="text-amber-600" />
                                                                                            <span className="text-sm font-medium text-amber-800">状态对象</span>
                                                                                            <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded">
                                                                                                发现 {statusFields.length} 个
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="text-xs text-amber-700 mb-2">
                                                                                            状态字段通常包含多个业务状态值，建议升级为独立的状态对象以便管理状态流转
                                                                                        </div>
                                                                                        <div className="space-y-1.5">
                                                                                            {statusFields.map((field: any, idx: number) => (
                                                                                                <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-amber-100">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="font-mono text-sm text-slate-600">{field.fieldName}</span>
                                                                                                        <span className="text-slate-400">→</span>
                                                                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                                                                                            {field.fieldName.replace(/^(.*?)_?(status|state|phase|stage)$/i, '$1')}状态对象
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-1">
                                                                                                        <button className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600">
                                                                                                            升级
                                                                                                        </button>
                                                                                                        <button className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">
                                                                                                            忽略
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {behaviorFields.length > 0 && (
                                                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            <Clock size={14} className="text-blue-600" />
                                                                                            <span className="text-sm font-medium text-blue-800">行为对象</span>
                                                                                            <span className="text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded">
                                                                                                发现 {behaviorFields.length} 个
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="text-xs text-blue-700 mb-2">
                                                                                            时间字段配合动词语义，表示业务行为发生的时刻，建议升级为独立的行为对象
                                                                                        </div>
                                                                                        <div className="space-y-1.5">
                                                                                            {behaviorFields.map((field: any, idx: number) => {
                                                                                                // Extract verb from field name
                                                                                                const matchedVerb = behaviorVerbs.find(v => field.fieldName.includes(v));
                                                                                                const behaviorName = matchedVerb ?
                                                                                                    (matchedVerb === 'pay' ? '支付' :
                                                                                                        matchedVerb === 'create' ? '创建' :
                                                                                                            matchedVerb === 'update' ? '更新' :
                                                                                                                matchedVerb === 'submit' ? '提交' :
                                                                                                                    matchedVerb === 'approve' ? '审批' :
                                                                                                                        matchedVerb === 'confirm' ? '确认' :
                                                                                                                            matchedVerb === 'cancel' ? '取消' :
                                                                                                                                matchedVerb === 'delete' ? '删除' :
                                                                                                                                    matchedVerb === 'login' ? '登录' :
                                                                                                                                        matchedVerb === 'logout' ? '登出' :
                                                                                                                                            matchedVerb === 'sign' ? '签署' :
                                                                                                                                                matchedVerb === 'complete' ? '完成' :
                                                                                                                                                    matchedVerb === 'finish' ? '结束' :
                                                                                                                                                        matchedVerb === 'start' ? '开始' :
                                                                                                                                                            matchedVerb === 'end' ? '终止' : matchedVerb) + '行为'
                                                                                                    : '业务行为';

                                                                                                return (
                                                                                                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-blue-100">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <span className="font-mono text-sm text-slate-600">{field.fieldName}</span>
                                                                                                            <span className="text-slate-400">→</span>
                                                                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                                                                                {behaviorName}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        <div className="flex items-center gap-1">
                                                                                                            <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                                                                                                升级
                                                                                                            </button>
                                                                                                            <button className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">
                                                                                                                忽略
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : detailTab === 'quality' ? (
                                                        // Quality Overview Tab
                                                        <div className="p-6 space-y-6">
                                                            {/* Overall Grade */}
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="text-lg font-bold text-slate-800">数据质量总览</h3>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-slate-500">综合评级:</span>
                                                                    <span className="px-3 py-1 text-lg font-bold bg-emerald-100 text-emerald-700 rounded-lg">B+</span>
                                                                </div>
                                                            </div>

                                                            {/* Quality Metrics Grid */}
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                {/* Completeness */}
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="font-medium text-slate-700">完整性 (非空率)</span>
                                                                        <span className="text-lg font-bold text-emerald-600">82%</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                                        <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: '82%' }}></div>
                                                                    </div>
                                                                    <div className="mt-2 text-xs text-slate-500">
                                                                        问题字段: <span className="text-amber-600 font-medium">description (空值率 35%)</span>
                                                                    </div>
                                                                </div>

                                                                {/* Consistency */}
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="font-medium text-slate-700">一致性 (格式符合率)</span>
                                                                        <span className="text-lg font-bold text-blue-600">95%</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                                        <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: '95%' }}></div>
                                                                    </div>
                                                                    <div className="mt-2 text-xs text-slate-500">
                                                                        问题字段: <span className="text-amber-600 font-medium">mobile (5% 格式异常)</span>
                                                                    </div>
                                                                </div>

                                                                {/* Uniqueness */}
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="font-medium text-slate-700">唯一性 (主键/标识字段)</span>
                                                                        <span className="text-lg font-bold text-purple-600">100%</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                                        <div className="bg-purple-500 h-3 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                                                                    </div>
                                                                    <div className="mt-2 text-xs text-slate-500">
                                                                        <span className="text-emerald-600">✓ 无重复主键</span>
                                                                    </div>
                                                                </div>

                                                                {/* Timeliness */}
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="font-medium text-slate-700">时效性 (数据新鲜度)</span>
                                                                        <span className="text-lg font-bold text-orange-600">72%</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                                        <div className="bg-orange-500 h-3 rounded-full transition-all duration-500" style={{ width: '72%' }}></div>
                                                                    </div>
                                                                    <div className="mt-2 text-xs text-slate-500">
                                                                        最后更新: <span className="text-slate-700">2024-05-21 02:00:00</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Sensitivity Distribution */}
                                                            {isIdle ? (
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                                    <h4 className="font-medium text-slate-700 mb-2">敏感字段分布</h4>
                                                                    <div className="text-xs text-slate-400">语义理解完成后生成敏感等级分布。</div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                                    <h4 className="font-medium text-slate-700 mb-4">敏感字段分布</h4>
                                                                    <div className="flex items-end gap-4 h-32">
                                                                        {(() => {
                                                                            const fields = selectedTableFields;
                                                                            const getSensitivity = (name: string): 'L1' | 'L2' | 'L3' | 'L4' => {
                                                                                if (name.includes('id_card') || name.includes('bank')) return 'L4';
                                                                                if (name.includes('mobile') || name.includes('phone') || name.includes('name') || name.includes('address')) return 'L3';
                                                                                if (name.includes('user') || name.includes('employee')) return 'L2';
                                                                                return 'L1';
                                                                            };
                                                                            const counts = { L1: 0, L2: 0, L3: 0, L4: 0 };
                                                                            fields.forEach((f: any) => counts[getSensitivity(f.fieldName)]++);
                                                                            const maxCount = Math.max(...Object.values(counts), 1);
                                                                            const config = [
                                                                                { level: 'L1', label: '公开', color: 'bg-slate-300', count: counts.L1 },
                                                                                { level: 'L2', label: '内部', color: 'bg-blue-400', count: counts.L2 },
                                                                                { level: 'L3', label: '敏感', color: 'bg-orange-400', count: counts.L3 },
                                                                                { level: 'L4', label: '高敏', color: 'bg-red-500', count: counts.L4 },
                                                                            ];
                                                                            return config.map((item, i) => (
                                                                                <div key={i} className="flex-1 flex flex-col items-center">
                                                                                    <div className={`w-full ${item.color} rounded-t-lg transition-all duration-500`}
                                                                                        style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '8px' : '0' }}>
                                                                                    </div>
                                                                                    <div className="mt-2 text-center">
                                                                                        <div className="text-lg font-bold text-slate-700">{item.count}</div>
                                                                                        <div className="text-xs text-slate-500">{item.level}</div>
                                                                                        <div className="text-[10px] text-slate-400">{item.label}</div>
                                                                                    </div>
                                                                                </div>
                                                                            ));
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Problem Fields Summary */}
                                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                                <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                                                                    <AlertTriangle size={16} /> 质量问题字段 ({Math.min(2, selectedTableFields.length)})
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm">
                                                                        <span className="font-mono text-slate-700">description</span>
                                                                        <span className="text-amber-600">空值率过高 (35%)</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm">
                                                                        <span className="font-mono text-slate-700">remark</span>
                                                                        <span className="text-amber-600">字段未使用 (100% 空值)</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (() => {
                                                        // Calculate conflict stats for batch actions
                                                        const allFields = selectedTableFields;
                                                        const getRuleResult = (name: string = '', type: string = '') => {
                                                            const safeName = (name || '').toLowerCase();
                                                            const safeType = (type || '').toLowerCase();
                                                            if (safeName.endsWith('_id') || safeName === 'id') return { role: 'Identifier', reason: '字段名含_id后缀', confidence: 95 };
                                                            if (safeName.includes('time') || safeName.includes('date') || safeType.includes('datetime') || safeType.includes('timestamp')) return { role: 'EventHint', reason: '时间类型字段', confidence: 90 };
                                                            if (safeName.includes('status') || safeName.includes('state') || safeName.includes('type')) return { role: 'Status', reason: '状态/类型字段', confidence: 85 };
                                                            if (safeName.includes('amount') || safeName.includes('price') || safeName.includes('total') || safeType.includes('decimal')) return { role: 'Measure', reason: '金额/数量字段', confidence: 80 };
                                                            return { role: 'BusAttr', reason: '默认业务属性', confidence: 60 };
                                                        };
                                                        const getAIResult = (name: string) => {
                                                            const aiMappings: Record<string, { role: string; meaning: string; scenario: string; confidence: number }> = {
                                                                'id': { role: 'id', meaning: '记录标识', scenario: '主键关联', confidence: 92 },
                                                                'user_id': { role: 'user_id', meaning: '用户标识', scenario: '用户关联查询', confidence: 95 },
                                                                'name': { role: 'name', meaning: '名称属性', scenario: '展示/搜索', confidence: 88 },
                                                                'mobile': { role: 'phone', meaning: '手机号码', scenario: '联系/验证', confidence: 90 },
                                                                'phone': { role: 'phone', meaning: '电话号码', scenario: '联系方式', confidence: 90 },
                                                                'email': { role: 'email', meaning: '电子邮箱', scenario: '通知/登录', confidence: 92 },
                                                                'status': { role: 'status', meaning: '状态标识', scenario: '状态流转', confidence: 85 },
                                                                'create_time': { role: 'create_time', meaning: '创建时间', scenario: '审计追踪', confidence: 95 },
                                                                'update_time': { role: 'update_time', meaning: '更新时间', scenario: '变更追踪', confidence: 95 },
                                                                'address': { role: 'address', meaning: '地址信息', scenario: '配送/定位', confidence: 85 },
                                                                'amount': { role: 'amount', meaning: '金额数值', scenario: '财务统计', confidence: 88 },
                                                                'order_id': { role: 'order_id', meaning: '订单标识', scenario: '订单关联', confidence: 95 },
                                                            };
                                                            const key = Object.keys(aiMappings).find(k => name.includes(k));
                                                            if (key) return aiMappings[key];
                                                            return { role: 'unknown', meaning: '待识别', scenario: '-', confidence: 0 };
                                                        };
                                                        const analyzedFields = allFields.map((field: any) => ({
                                                            field,
                                                            analysis: analyzeField(field)
                                                        }));
                                                        const analysisMap = new Map(analyzedFields.map((entry) => [entry.field.fieldName || entry.field.name, entry.analysis]));
                                                        const getFieldGroup = (field: any) => {
                                                            const fieldName = field.fieldName || field.name || '';
                                                            const analysis = analysisMap.get(fieldName) || analyzeField(field);
                                                            const ruleRole = getRuleResult(fieldName, field.type || '').role;
                                                            const aiRole = field.suggestion || getAIResult(fieldName).role;
                                                            const isResolved = !!fieldRoleOverrides[fieldName];
                                                            const hasConflict = ruleRole.toLowerCase() !== aiRole.toLowerCase() && aiRole !== 'unknown' && !isResolved;
                                                            const sensitivity = sensitivityOverrides[fieldName] || analysis.sensitivity;
                                                            const confidence = analysis.roleConfidence || 0;
                                                            if (sensitivity === 'L3' || sensitivity === 'L4') return 'C';
                                                            if (hasConflict || confidence < 0.7) return 'C';
                                                            if (confidence >= 0.85 && (sensitivity === 'L1' || sensitivity === 'L2')) return 'A';
                                                            return 'B';
                                                        };
                                                        const groupLabelMap: Record<string, string> = { A: '可批量', B: '需下钻', C: '高风险' };
                                                        const groupToneMap: Record<string, string> = {
                                                            A: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                                            B: 'bg-slate-50 text-slate-600 border-slate-200',
                                                            C: 'bg-red-50 text-red-700 border-red-100'
                                                        };
                                                        const groupCounts = allFields.reduce((acc, field) => {
                                                            const group = getFieldGroup(field);
                                                            acc[group] = (acc[group] || 0) + 1;
                                                            return acc;
                                                        }, { A: 0, B: 0, C: 0 } as Record<string, number>);
                                                        const fieldGroupMap = new Map(allFields.map(field => [field.fieldName, getFieldGroup(field)]));
                                                        const reviewFieldNames = new Set(
                                                            analyzedFields
                                                                .filter((entry) => ['L3', 'L4'].includes(entry.analysis.sensitivity) || (entry.analysis.roleConfidence || 0) < 0.7)
                                                                .map((entry) => entry.field.fieldName)
                                                        );
                                                        const baseFields = fieldProblemFilter === 'review'
                                                            ? allFields.filter((field: any) => reviewFieldNames.has(field.fieldName))
                                                            : allFields;
                                                        // Filter fields by search term
                                                        const filteredFields = fieldSearchTerm.trim()
                                                            ? baseFields.filter((field: any) =>
                                                                field.fieldName.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                                                                field.type?.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                                                                field.comment?.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                                                            )
                                                            : baseFields;
                                                        const displayFields = fieldGroupFilter === 'all'
                                                            ? filteredFields
                                                            : filteredFields.filter((field: any) => fieldGroupMap.get(field.fieldName) === fieldGroupFilter);
                                                        const visibleFieldNames = displayFields.map(field => field.fieldName);
                                                        const selectedFieldSet = new Set(selectedFieldNames);
                                                        const isAllVisibleSelected = visibleFieldNames.length > 0 && visibleFieldNames.every(name => selectedFieldSet.has(name));
                                                        const visibleSelectedCount = visibleFieldNames.filter(name => selectedFieldSet.has(name)).length;
                                                        const selectedHighConfidence = selectedFieldNames.filter(name => fieldGroupMap.get(name) === 'A');
                                                        const canViewEvidence = isSuggestionsReady(semanticProfile.governanceStatus as GovernanceStatus);
                                                        const isFieldAnalysisReady = isSuggestionsReady(semanticProfile.governanceStatus as GovernanceStatus) || hasFieldAnalysis;
                                                        const showSemanticColumns = isFieldAnalysisReady && fieldViewMode === 'semantic';
                                                        const tableColSpan = showSemanticColumns ? 10 : 5;
                                                        const hasSearch = fieldSearchTerm.trim().length > 0;
                                                        const hasProblemFilter = fieldProblemFilter !== 'all';
                                                        const hasGroupFilter = fieldGroupFilter !== 'all';
                                                        const conflictFields = allFields.filter((field: any) => {
                                                            const ruleRole = getRuleResult(field.fieldName, field.type || '').role;
                                                            const aiRole = field.suggestion ? field.suggestion : getAIResult(field.fieldName).role;
                                                            const isResolved = !!fieldRoleOverrides[field.fieldName];
                                                            return ruleRole !== aiRole && aiRole !== 'unknown' && !isResolved;
                                                        });
                                                        const resolvedCount = Object.keys(fieldRoleOverrides).length;
                                                        const isTableConfirmed = (semanticProfile.governanceStatus || 'S0') === 'S3';
                                                        const reviewStatusToneMap: Record<string, string> = {
                                                            suggested: 'bg-amber-50 text-amber-700 border-amber-100',
                                                            confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                                            pending: 'bg-slate-50 text-slate-600 border-slate-200'
                                                        };
                                                        const reviewStatusLabelMap: Record<string, string> = {
                                                            suggested: '建议',
                                                            confirmed: '已确认',
                                                            pending: '待定'
                                                        };
                                                        const handleToggleSelectAll = (checked: boolean) => {
                                                            setSelectedFieldNames(prev => {
                                                                if (checked) {
                                                                    const merged = new Set([...prev, ...visibleFieldNames]);
                                                                    return Array.from(merged);
                                                                }
                                                                return prev.filter(name => !visibleFieldNames.includes(name));
                                                            });
                                                        };
                                                        const handleToggleFieldSelection = (fieldName: string, checked: boolean) => {
                                                            setSelectedFieldNames(prev => {
                                                                if (checked) {
                                                                    return prev.includes(fieldName) ? prev : [...prev, fieldName];
                                                                }
                                                                return prev.filter(name => name !== fieldName);
                                                            });
                                                        };
                                                        const applyReviewStatus = (
                                                            fieldNames: string[],
                                                            status: 'confirmed' | 'pending',
                                                            action: 'accept' | 'override' | 'pending',
                                                            reason: string
                                                        ) => {
                                                            if (fieldNames.length === 0) return;
                                                            setFieldReviewStatus(prev => {
                                                                const next = { ...prev };
                                                                fieldNames.forEach(name => {
                                                                    next[name] = status;
                                                                });
                                                                return next;
                                                            });
                                                            const timestamp = new Date().toISOString();
                                                            fieldNames.forEach(name => {
                                                                recordAuditLog({
                                                                    field: name,
                                                                    action,
                                                                    source: '融合',
                                                                    reason,
                                                                    timestamp
                                                                });
                                                            });
                                                        };
                                                        const handleBatchAcceptHighConfidence = () => {
                                                            if (selectedHighConfidence.length === 0) return;
                                                            applyReviewStatus(selectedHighConfidence, 'confirmed', 'accept', '批量接受高置信');
                                                            setSelectedFieldNames(prev => prev.filter(name => !selectedHighConfidence.includes(name)));
                                                        };
                                                        const handleBatchOverride = () => {
                                                            if (selectedFieldNames.length === 0) return;
                                                            applyReviewStatus(selectedFieldNames, 'pending', 'override', '批量改判');
                                                            setEditModeSafe(true);
                                                            setSelectedFieldNames([]);
                                                        };
                                                        const handleBatchPending = () => {
                                                            if (selectedFieldNames.length === 0) return;
                                                            applyReviewStatus(selectedFieldNames, 'pending', 'pending', '加入待办');
                                                            setSelectedFieldNames([]);
                                                        };

                                                        // Batch resolve all conflicts
                                                        const batchResolve = (choice: 'rule' | 'ai') => {
                                                            const newOverrides: Record<string, { role: string; source: 'rule' | 'ai' }> = { ...fieldRoleOverrides };
                                                            conflictFields.forEach((field: any) => {
                                                                const ruleRole = field.fieldName?.endsWith('_id') ? 'Identifier' :
                                                                    field.fieldName?.includes('time') ? 'EventHint' :
                                                                        field.fieldName?.includes('status') ? 'Status' : 'BusAttr';
                                                                const aiRole = field.suggestion ? field.suggestion : ruleRole;
                                                                newOverrides[field.fieldName] = {
                                                                    role: choice === 'rule' ? ruleRole : aiRole,
                                                                    source: choice
                                                                };
                                                            });
                                                            setFieldRoleOverrides(newOverrides);
                                                        };

                                                        return (
                                                            // Fields Tab (default)
                                                            <div className="space-y-4">
                                                                {/* 1. Statistics Dashboard (New Design) */}
                                                                <div className="grid grid-cols-4 gap-4">
                                                                    {/* Total Fields */}
                                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
                                                                        <div>
                                                                            <div className="text-slate-500 text-xs font-medium mb-1">总字段数</div>
                                                                            <div className="text-2xl font-bold text-slate-800">{allFields.length}</div>
                                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                                                <span>来自元数据</span>
                                                                                <button
                                                                                    onClick={handleViewEvidence}
                                                                                    disabled={!canViewEvidence}
                                                                                    className={`text-[10px] ${canViewEvidence ? 'text-blue-600 hover:underline' : 'text-slate-300 cursor-not-allowed'}`}
                                                                                >
                                                                                    查看证据
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                                            <Table size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                                        </div>
                                                                    </div>

                                                                    {/* Primary Keys */}
                                                                    {(() => {
                                                                        const pkFromMeta = allFields.filter((f: any) => f.key === 'PK' || f.primaryKey);
                                                                        const hasPkMeta = pkFromMeta.length > 0;
                                                                        const pkCount = hasPkMeta
                                                                            ? pkFromMeta.length
                                                                            : allFields.filter((f: any) => f.fieldName?.endsWith('_id') || f.fieldName === 'id').length;
                                                                        return (
                                                                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
                                                                                <div>
                                                                                    <div className="text-slate-500 text-xs font-medium mb-1">主键/标识</div>
                                                                                    <div className="text-2xl font-bold text-slate-800">{pkCount}</div>
                                                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                                                        <span>{hasPkMeta ? '来自元数据' : '规则建议'}</span>
                                                                                        <button
                                                                                            onClick={handleViewEvidence}
                                                                                            disabled={!canViewEvidence}
                                                                                            className={`text-[10px] ${canViewEvidence ? 'text-blue-600 hover:underline' : 'text-slate-300 cursor-not-allowed'}`}
                                                                                        >
                                                                                            查看证据
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                                                                                    <Key size={20} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    {/* Sensitive Fields */}
                                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-red-300 transition-colors">
                                                                        <div>
                                                                            <div className="text-slate-500 text-xs font-medium mb-1">敏感字段</div>
                                                                            <div className="text-2xl font-bold text-slate-800">{allFields.filter((f: any) => {
                                                                                const name = f.fieldName.toLowerCase();
                                                                                return name.includes('id_card') || name.includes('sfz') || name.includes('bank') ||
                                                                                    name.includes('mobile') || name.includes('phone') || name.includes('address');
                                                                            }).length}</div>
                                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                                                <span>规则建议</span>
                                                                                <button
                                                                                    onClick={handleViewEvidence}
                                                                                    disabled={!canViewEvidence}
                                                                                    className={`text-[10px] ${canViewEvidence ? 'text-blue-600 hover:underline' : 'text-slate-300 cursor-not-allowed'}`}
                                                                                >
                                                                                    查看证据
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-red-50 transition-colors">
                                                                            <Shield size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                                                                        </div>
                                                                    </div>

                                                                    {/* Required Fields */}
                                                                    {(() => {
                                                                        const hasRequiredMeta = allFields.some((f: any) => typeof f.required === 'boolean');
                                                                        const requiredCount = hasRequiredMeta
                                                                            ? allFields.filter((f: any) => f.required === true).length
                                                                            : 0;
                                                                        return (
                                                                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
                                                                                <div>
                                                                                    <div className="text-slate-500 text-xs font-medium mb-1">必填字段</div>
                                                                                    <div className="text-2xl font-bold text-slate-800">{requiredCount}</div>
                                                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                                                        <span>{hasRequiredMeta ? '来自元数据' : '未提供元数据'}</span>
                                                                                        <button
                                                                                            onClick={handleViewEvidence}
                                                                                            disabled={!canViewEvidence}
                                                                                            className={`text-[10px] ${canViewEvidence ? 'text-blue-600 hover:underline' : 'text-slate-300 cursor-not-allowed'}`}
                                                                                        >
                                                                                            查看证据
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                                                                    <CheckCircle2 size={20} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>

                                                                {/* 2. Table Section */}
                                                                <div id="detail-fields-table" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                                                    {/* Toolbar */}
                                                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="relative">
                                                                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="搜索字段名称、描述..."
                                                                                    value={fieldSearchTerm}
                                                                                    onChange={(e) => setFieldSearchTerm(e.target.value)}
                                                                                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                                                                />
                                                                            </div>
                                                                            {fieldProblemFilter !== 'all' && (
                                                                                <button
                                                                                    onClick={() => setFieldProblemFilter('all')}
                                                                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors"
                                                                                >
                                                                                    <Filter size={12} />
                                                                                    已筛选: 待Review字段
                                                                                    <X size={12} className="ml-1" />
                                                                                </button>
                                                                            )}
                                                                            {hasGroupFilter && (
                                                                                <button
                                                                                    onClick={() => setFieldGroupFilter('all')}
                                                                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
                                                                                >
                                                                                    <Tag size={12} />
                                                                                    已筛选: {groupLabelMap[fieldGroupFilter]}
                                                                                    <X size={12} className="ml-1" />
                                                                                </button>
                                                                            )}
                                                                            <div className="h-4 w-[1px] bg-slate-200"></div>
                                                                            <span className="text-xs text-slate-500">
                                                                                显示 <span className="font-medium text-slate-900">{displayFields.length}</span> / {allFields.length} 字段
                                                                            </span>
                                                                            <div className="h-4 w-[1px] bg-slate-200"></div>
                                                                            <div className="flex items-center gap-1 text-[10px]">
                                                                                <button
                                                                                    onClick={() => setFieldViewMode('structure')}
                                                                                    className={`px-2 py-1 rounded ${fieldViewMode === 'structure'
                                                                                        ? 'bg-slate-200 text-slate-700'
                                                                                        : 'text-slate-500 hover:bg-slate-100'}`}
                                                                                >
                                                                                    结构视图
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => isSuggestionsReady(semanticProfile.governanceStatus as GovernanceStatus) && setFieldViewMode('semantic')}
                                                                                    title={isSuggestionsReady(semanticProfile.governanceStatus as GovernanceStatus) ? '' : '需生成建议后查看'}
                                                                                    className={`px-2 py-1 rounded ${fieldViewMode === 'semantic'
                                                                                        ? 'bg-blue-100 text-blue-700'
                                                                                        : isSuggestionsReady(semanticProfile.governanceStatus as GovernanceStatus)
                                                                                            ? 'text-slate-500 hover:bg-slate-100'
                                                                                            : 'text-slate-300 cursor-not-allowed'}`}
                                                                                >
                                                                                    语义视图
                                                                                </button>
                                                                            </div>
                                                                            {showSemanticColumns && (
                                                                                <div className="flex items-center gap-1 text-[10px] ml-2">
                                                                                    <button
                                                                                        onClick={() => setFieldGroupFilter('all')}
                                                                                        className={`px-2 py-1 rounded ${fieldGroupFilter === 'all' ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                                                                    >
                                                                                        全部
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => setFieldGroupFilter('A')}
                                                                                        className={`px-2 py-1 rounded ${fieldGroupFilter === 'A' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                                                                    >
                                                                                        可批量 {groupCounts.A}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => setFieldGroupFilter('B')}
                                                                                        className={`px-2 py-1 rounded ${fieldGroupFilter === 'B' ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                                                                    >
                                                                                        需下钻 {groupCounts.B}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => setFieldGroupFilter('C')}
                                                                                        className={`px-2 py-1 rounded ${fieldGroupFilter === 'C' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                                                                    >
                                                                                        高风险 {groupCounts.C}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Analysis Status Badge */}
                                                                        {semanticProfile.analysisStep !== 'idle' && (
                                                                            <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-1.5">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                                <span className="text-xs font-medium text-emerald-700">
                                                                                    {getGovernanceDisplay((semanticProfile.governanceStatus || 'S1') as GovernanceStatus, rolledBackTableIds.has(selectedTable.table)).label}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Large Dataset Warning */}
                                                                    {allFields.length > 30 && (
                                                                        <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100 text-xs text-blue-600 flex items-center gap-2">
                                                                            <Layers size={14} />
                                                                            <span>大表提示: 当前表字段较多，建议使用搜索功能快速定位。</span>
                                                                        </div>
                                                                    )}
                                                                    {showSemanticColumns && (
                                                                        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
                                                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isAllVisibleSelected}
                                                                                        disabled={isReadOnly}
                                                                                        onChange={(e) => {
                                                                                            if (isReadOnly) return;
                                                                                            handleToggleSelectAll(e.target.checked);
                                                                                        }}
                                                                                        className={`w-3.5 h-3.5 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                                                    />
                                                                                    全选当前筛选
                                                                                </label>
                                                                                <span>已选 {selectedFieldNames.length}</span>
                                                                                <span className="text-slate-400">当前筛选 {visibleSelectedCount}</span>
                                                                                <span className="text-emerald-600">高置信 {selectedHighConfidence.length}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={handleBatchAcceptHighConfidence}
                                                                                    disabled={selectedHighConfidence.length === 0}
                                                                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedHighConfidence.length > 0
                                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                                        : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                                                                                >
                                                                                    批量接受高置信
                                                                                </button>
                                                                                <button
                                                                                    onClick={handleBatchOverride}
                                                                                    disabled={selectedFieldNames.length === 0}
                                                                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedFieldNames.length > 0
                                                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                                                        : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                                                                                >
                                                                                    批量改判
                                                                                </button>
                                                                                <button
                                                                                    onClick={handleBatchPending}
                                                                                    disabled={selectedFieldNames.length === 0}
                                                                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedFieldNames.length > 0
                                                                                        ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                                                                        : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                                                                                >
                                                                                    加入待办
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className={`${allFields.length > 30 ? "max-h-[520px] overflow-y-auto" : ""} overflow-x-auto`}>
                                                                        <table className="w-full min-w-[1160px] text-sm text-left">
                                                                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                                                                                <tr>
                                                                                    {showSemanticColumns && (
                                                                                        <th className="px-4 py-4 w-10 text-xs font-semibold"></th>
                                                                                    )}
                                                                                    <th className="px-5 py-4 w-12 text-xs font-semibold">#</th>
                                                                                    <th className="px-5 py-4 text-xs w-56 font-semibold">物理字段</th>
                                                                                    <th className="px-5 py-4 text-xs w-56 font-semibold">业务描述</th>
                                                                                    <th className="px-5 py-4 text-xs w-36 font-semibold">数据类型</th>
                                                                                    {showSemanticColumns && (
                                                                                        <th className="px-5 py-4 text-xs w-40 font-semibold">
                                                                                            <span className="flex items-center gap-1.5 text-purple-600"><Settings size={13} /> 规则判定</span>
                                                                                        </th>
                                                                                    )}
                                                                                    {showSemanticColumns && (
                                                                                        <th className="px-5 py-4 text-xs w-44 font-semibold">
                                                                                            <span className="flex items-center gap-1.5 text-blue-600"><Sparkles size={13} /> AI 语义</span>
                                                                                        </th>
                                                                                    )}
                                                                                    <th className="px-5 py-4 text-xs w-32 font-semibold">
                                                                                        <span className="flex items-center gap-1.5 text-slate-500"><Database size={13} /> 采样值</span>
                                                                                    </th>
                                                                                    {showSemanticColumns && (
                                                                                        <th className="px-5 py-4 text-xs w-28 font-semibold">
                                                                                            <span className="flex items-center gap-1.5 text-orange-600"><Shield size={13} /> 敏感级</span>
                                                                                        </th>
                                                                                    )}
                                                                                    {showSemanticColumns && (
                                                                                        <th className="px-5 py-4 text-xs text-center w-36 font-semibold">
                                                                                            <span className="flex items-center justify-center gap-1.5 text-emerald-600"><Layers size={13} /> 融合结果</span>
                                                                                        </th>
                                                                                    )}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {displayFields.length === 0 && (hasSearch || hasProblemFilter || hasGroupFilter) ? (
                                                                                    <tr>
                                                                                        <td colSpan={tableColSpan} className="px-5 py-14 text-center text-slate-400 bg-slate-50/30">
                                                                                            <Search size={32} className="mx-auto mb-3 opacity-30" />
                                                                                            <div className="text-sm font-medium">
                                                                                                {hasSearch ? `未找到匹配 "${fieldSearchTerm}" 的字段` : hasProblemFilter ? '暂无待Review字段' : hasGroupFilter ? `暂无${groupLabelMap[fieldGroupFilter]}字段` : '暂无字段'}
                                                                                            </div>
                                                                                            <div className="mt-3 flex items-center justify-center gap-3">
                                                                                                {hasSearch && (
                                                                                                    <button
                                                                                                        onClick={() => setFieldSearchTerm('')}
                                                                                                        className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                                                                                                    >
                                                                                                        清除搜索条件
                                                                                                    </button>
                                                                                                )}
                                                                                                {hasProblemFilter && (
                                                                                                    <button
                                                                                                        onClick={() => setFieldProblemFilter('all')}
                                                                                                        className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                                                                                                    >
                                                                                                        清除筛选条件
                                                                                                    </button>
                                                                                                )}
                                                                                                {hasGroupFilter && (
                                                                                                    <button
                                                                                                        onClick={() => setFieldGroupFilter('all')}
                                                                                                        className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
                                                                                                    >
                                                                                                        清除分组筛选
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : displayFields.map((field: any, idx: number) => {
                                                                                    const ruleResult = getRuleResult(field.fieldName, field.type || '');
                                                                                    const ruleRole = ruleResult.role;

                                                                                    const aiResult = getAIResult(field.fieldName);
                                                                                    const aiRole = field.suggestion || aiResult.role;

                                                                                    // Sample values for the field
                                                                                    const getSampleValues = (name: string, type: string): string[] => {
                                                                                        if (name.includes('id')) return ['1001', '1002', '1003'];
                                                                                        if (name.includes('name')) return ['张三', '李四', '王五'];
                                                                                        if (name.includes('mobile') || name.includes('phone')) return ['138****1234', '159****5678'];
                                                                                        if (name.includes('status')) return ['1', '2', '3'];
                                                                                        if (name.includes('time') || name.includes('date')) return ['2024-01-15', '2024-02-20'];
                                                                                        if (name.includes('amount') || name.includes('price')) return ['99.00', '188.50', '520.00'];
                                                                                        if (type.includes('varchar')) return ['示例值A', '示例值B'];
                                                                                        return ['-'];
                                                                                    };
                                                                                    const sampleValues = getSampleValues(field.fieldName, field.type);

                                                                                    // Check if user has resolved this conflict
                                                                                    const override = fieldRoleOverrides[field.fieldName];
                                                                                    const isResolved = !!override;
                                                                                    const hasConflict = showSemanticColumns && ruleRole.toLowerCase() !== aiRole.toLowerCase() && aiRole !== 'unknown' && !isResolved;
                                                                                    const displayRole = override?.role || ruleRole; // Unused but kept for logic consistency if needed

                                                                                    // Sensitivity level inference (with override support)
                                                                                    const getInferredSensitivity = (name: string): 'L1' | 'L2' | 'L3' | 'L4' => {
                                                                                        if (name.includes('id_card') || name.includes('sfz') || name.includes('bank')) return 'L4';
                                                                                        if (name.includes('mobile') || name.includes('phone') || name.includes('name') || name.includes('address')) return 'L3';
                                                                                        if (name.includes('user') || name.includes('employee')) return 'L2';
                                                                                        return 'L1';
                                                                                    };
                                                                                    const inferredSensitivity = getInferredSensitivity(field.fieldName);
                                                                                    const sensitivity = sensitivityOverrides[field.fieldName] || inferredSensitivity;
                                                                                    const isOverridden = !!sensitivityOverrides[field.fieldName];
                                                                                    const fieldGroup = fieldGroupMap.get(field.fieldName) || 'B';

                                                                                    const sensitivityConfig: Record<string, { bg: string, text: string, label: string }> = {
                                                                                        'L1': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'L1 公开' },
                                                                                        'L2': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'L2 内部' },
                                                                                        'L3': { bg: 'bg-orange-50', text: 'text-orange-600', label: 'L3 敏感' },
                                                                                        'L4': { bg: 'bg-red-50', text: 'text-red-600', label: 'L4 高敏' },
                                                                                    };
                                                                                    const reviewStatus = isTableConfirmed
                                                                                        ? 'confirmed'
                                                                                        : fieldReviewStatus[field.fieldName] || 'suggested';

                                                                                    return (
                                                                                        <tr key={idx} className={`group odd:bg-slate-50/40 hover:bg-slate-50/80 transition-colors ${hasConflict ? 'bg-amber-50/30' : ''} ${selectedFieldSet.has(field.fieldName) ? 'bg-blue-50/40' : ''}`}>
                                                                                            {showSemanticColumns && (
                                                                                                <td className="px-4 py-4 align-top">
                                                                                                    <input
                                                                                                        type="checkbox"
                                                                                                        checked={selectedFieldSet.has(field.fieldName)}
                                                                                                        disabled={isReadOnly}
                                                                                                        onChange={(e) => {
                                                                                                            if (isReadOnly) return;
                                                                                                            handleToggleFieldSelection(field.fieldName, e.target.checked);
                                                                                                        }}
                                                                                                        className={`w-3.5 h-3.5 ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                                                                    />
                                                                                                </td>
                                                                                            )}
                                                                                            <td className="px-5 py-4 align-top text-slate-400 text-xs font-mono">{idx + 1}</td>
                                                                                            {/* Enhanced Physical Field */}
                                                                                            <td className="px-5 py-4 align-top">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="font-mono text-sm font-bold text-slate-700">{field.fieldName}</span>
                                                                                                    {field.key === 'PK' && (
                                                                                                        <span title="主键" className="bg-amber-100 text-amber-600 p-1 rounded-md"><Key size={12} className="fill-amber-100" /></span>
                                                                                                    )}
                                                                                                    {showSemanticColumns && (
                                                                                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] border ${groupToneMap[fieldGroup]}`}>
                                                                                                            {groupLabelMap[fieldGroup]}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                            {/* Business Description */}
                                                                                            <td className="px-5 py-4 align-top">
                                                                                                <div className="text-sm text-slate-600 flex items-center gap-1 leading-relaxed">
                                                                                                    {field.comment ? (
                                                                                                        <span>{field.comment}</span>
                                                                                                    ) : (
                                                                                                        <span className="text-slate-300 italic text-xs">--</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                            {/* Enhanced Type Column */}
                                                                                            <td className="px-5 py-4 align-top">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium border ${field.type.toLowerCase().includes('int') || field.type.toLowerCase().includes('long') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                                                        field.type.toLowerCase().includes('date') || field.type.toLowerCase().includes('time') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                                                                            'bg-blue-50 text-blue-700 border-blue-100'
                                                                                                        }`}>
                                                                                                        {field.type}
                                                                                                    </span>
                                                                                                    {field.required !== false ? (
                                                                                                        <span title="必填"><CheckCircle2 size={14} className="text-emerald-500/50" /></span>
                                                                                                    ) : (
                                                                                                        <span title="非必填" className="w-3.5 h-3.5 rounded-full border border-slate-200 bg-slate-50"></span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                            {/* Enhanced Rule Judgment Column */}
                                                                                            {showSemanticColumns && (
                                                                                                <td className="px-5 py-3 align-top">
                                                                                                    {!isFieldAnalysisReady ? (
                                                                                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100/50 border border-slate-200/50 w-fit">
                                                                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                                                                            <span className="text-xs text-slate-400">待分析</span>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className={`px-2.5 py-1.5 rounded w-fit ${override?.source === 'rule' ? 'border-2 border-purple-400 bg-purple-100' : 'bg-purple-50 border border-purple-100'}`}>
                                                                                                            <div className="text-xs font-medium text-purple-700">{ruleRole}</div>
                                                                                                            <div className="text-[10px] text-purple-500/80">{ruleResult.reason}</div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </td>
                                                                                            )}
                                                                                            {/* Enhanced AI Semantic Column */}
                                                                                            {showSemanticColumns && (
                                                                                                <td className="px-5 py-3 align-top">
                                                                                                    {isAnalyzing ? (
                                                                                                        <div className="animate-pulse bg-slate-100 h-8 w-24 rounded"></div>
                                                                                                    ) : !isFieldAnalysisReady ? (
                                                                                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100/50 border border-slate-200/50 w-fit">
                                                                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                                                                            <span className="text-xs text-slate-400">待分析</span>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className={`px-2.5 py-1.5 rounded w-fit ${override?.source === 'ai' ? 'border-2 border-blue-400 bg-blue-100' : 'bg-blue-50 border border-blue-100'}`}>
                                                                                                            <div className="text-xs font-medium text-blue-700">{aiResult.meaning}</div>
                                                                                                            <div className="text-[10px] text-blue-500/80">场景: {aiResult.scenario}</div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </td>
                                                                                            )}
                                                                                            {/* Sample Values Column */}
                                                                                            <td className="px-5 py-3 align-top">
                                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                                    {sampleValues.slice(0, 2).map((val, i) => (
                                                                                                        <span key={i} className="px-2 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[10px] font-mono truncate max-w-[72px]" title={val}>
                                                                                                            {val}
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </td>
                                                                                            {/* Sensitivity Column */}
                                                                                            {showSemanticColumns && (
                                                                                                <td className="px-5 py-3 align-top">
                                                                                                    {!isFieldAnalysisReady ? (
                                                                                                        <span className="text-xs text-slate-400">待识别</span>
                                                                                                    ) : (
                                                                                                        <select
                                                                                                            value={sensitivity}
                                                                                                            onChange={(e) => setSensitivityOverrides(prev => ({
                                                                                                                ...prev,
                                                                                                                [field.fieldName]: e.target.value as 'L1' | 'L2' | 'L3' | 'L4'
                                                                                                            }))}
                                                                                                            className={`px-2 py-1 rounded text-xs font-medium cursor-pointer outline-none border transition-all w-full appearance-none ${isOverridden ? 'border-2 border-emerald-400' : 'border-transparent'} ${sensitivityConfig[sensitivity].bg} ${sensitivityConfig[sensitivity].text}`}
                                                                                                        >
                                                                                                            <option value="L1" className="bg-white text-slate-600">L1 公开</option>
                                                                                                            <option value="L2" className="bg-white text-blue-600">L2 内部</option>
                                                                                                            <option value="L3" className="bg-white text-orange-600">L3 敏感</option>
                                                                                                            <option value="L4" className="bg-white text-red-600">L4 高敏</option>
                                                                                                        </select>
                                                                                                    )}
                                                                                                </td>
                                                                                            )}
                                                                                            {/* Enhanced Merge Result Column */}
                                                                                            {showSemanticColumns && (
                                                                                                <td className="px-5 py-3 align-top text-center">
                                                                                                    {!isFieldAnalysisReady ? (
                                                                                                        <span className="text-slate-300">-</span>
                                                                                                    ) : (
                                                                                                        <div className="space-y-1.5">
                                                                                                            {/* Conflict indicator */}
                                                                                                            {hasConflict && (
                                                                                                                <div className="flex items-center justify-center gap-1 text-amber-600 text-[10px] animate-pulse">
                                                                                                                    <AlertTriangle size={10} /> 待确认
                                                                                                                </div>
                                                                                                            )}
                                                                                                            <div className="flex flex-wrap items-center justify-center gap-1">
                                                                                                                {/* Rule role */}
                                                                                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-600 border border-purple-100">
                                                                                                                    {ruleRole}
                                                                                                                </span>
                                                                                                                {/* Sensitivity tag for L3/L4 */}
                                                                                                                {(sensitivity === 'L3' || sensitivity === 'L4') && (
                                                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${sensitivity === 'L4' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                                                                                        {sensitivity === 'L4' ? '高敏' : '敏感'}
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <div className="flex items-center justify-center">
                                                                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] border ${reviewStatusToneMap[reviewStatus]}`}>
                                                                                                                    {reviewStatusLabelMap[reviewStatus]}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </td>
                                                                                            )}
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </>
                                    )}
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
                        )
                    )}
                </div>
            </div>

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
                            // Note: template, maxRows, ttl are currently fixed in UI updates but could be mapped here if editable
                        }));
                        // property enabled does not exist on newConfig (SemanticAssistRuntimeConfig)
                        setShowAssistConfig(false);
                    }}
                    asModal={true}
                />
            )}
            {/* Relationship Edit Modal */}
            {
                showRelModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-white rounded-xl shadow-2xl w-[450px] overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Share2 size={18} className="text-blue-600" />
                                    {editingRel.index !== null ? '编辑关系' : '添加关系'}
                                </h3>
                                <button onClick={() => setShowRelModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">目标表名</label>
                                    <input
                                        type="text"
                                        value={editingRel.targetTable}
                                        onChange={(e) => setEditingRel(prev => ({ ...prev, targetTable: e.target.value }))}
                                        placeholder="例如: t_user_profile"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">关系类型</label>
                                    <select
                                        value={editingRel.type}
                                        onChange={(e) => setEditingRel(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                    >
                                        <option value="Many-to-One">Many-to-One (多对一)</option>
                                        <option value="One-to-Many">One-to-Many (一对多)</option>
                                        <option value="One-to-One">One-to-One (一对一)</option>
                                        <option value="Many-to-Many">Many-to-Many (多对多)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">关联键</label>
                                    <input
                                        type="text"
                                        value={editingRel.key}
                                        onChange={(e) => setEditingRel(prev => ({ ...prev, key: e.target.value }))}
                                        placeholder="例如: user_id"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
                                <button
                                    onClick={() => setShowRelModal(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        if (!editingRel.targetTable || !editingRel.key) return;
                                        const newRel = { targetTable: editingRel.targetTable, type: editingRel.type, key: editingRel.key, description: '' };
                                        if (editingRel.index !== null) {
                                            // Edit existing
                                            setSemanticProfile(prev => ({
                                                ...prev,
                                                relationships: prev.relationships?.map((r, i) => i === editingRel.index ? newRel : r)
                                            }));
                                        } else {
                                            // Add new
                                            setSemanticProfile(prev => ({
                                                ...prev,
                                                relationships: [...(prev.relationships || []), newRel]
                                            }));
                                        }
                                        setShowRelModal(false);
                                    }}
                                    disabled={!editingRel.targetTable || !editingRel.key}
                                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${editingRel.targetTable && editingRel.key
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {editingRel.index !== null ? '保存修改' : '添加关系'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Batch Review Modal */}
            {
                showBatchReview && batchResults.length > 0 && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Sparkles size={20} className="text-purple-600" />
                                        语义理解结果审核
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        共 {batchResults.length} 项，
                                        <span className="text-emerald-600">{batchResults.filter(r => !r.needsReview && r.status === 'success').length} 项通过</span>，
                                        <span className="text-amber-600">{batchResults.filter(r => r.needsReview).length} 项需审核</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowBatchReview(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Results List */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                                {batchResults.map((result, idx) => (
                                    <div
                                        key={result.tableId}
                                        className={`p-4 rounded-lg border transition-all ${result.userAction === 'accepted' ? 'bg-emerald-50 border-emerald-200' :
                                            result.userAction === 'rejected' ? 'bg-red-50 border-red-200 opacity-60' :
                                                result.needsReview ? 'bg-amber-50 border-amber-200' :
                                                    'bg-slate-50 border-slate-200'
                                            }`}
                                    >
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (expandedReviewItems.includes(result.tableId)) {
                                                                setExpandedReviewItems(prev => prev.filter(id => id !== result.tableId));
                                                            } else {
                                                                setExpandedReviewItems(prev => [...prev, result.tableId]);
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-slate-600"
                                                    >
                                                        <ChevronRight size={16} className={`transition-transform ${expandedReviewItems.includes(result.tableId) ? 'rotate-90' : ''}`} />
                                                    </button>
                                                    <span className="font-mono text-sm text-slate-600">{result.tableName}</span>
                                                    <span className="text-slate-400">→</span>
                                                    <span className="font-medium text-slate-800">{result.businessName}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2 pl-6">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${result.scorePercent >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        置信度 {result.scorePercent}%
                                                    </span>
                                                    {result.needsReview && (
                                                        <span className="text-xs text-amber-600 flex items-center gap-1">
                                                            <AlertTriangle size={12} /> 需人工确认
                                                        </span>
                                                    )}
                                                    {/* Quick Stats */}
                                                    {result.fieldStats && (
                                                        <span className="text-xs text-slate-400">
                                                            {result.fieldStats.total}字段 · {result.sensitiveFields?.count || 0}敏感 · {result.relationships?.count || 0}关联
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {result.userAction === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => setBatchResults((prev: any[]) => prev.map((r: any, i: number) =>
                                                                i === idx ? { ...r, userAction: 'accepted' } : r
                                                            ))}
                                                            className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                                        >
                                                            接受
                                                        </button>
                                                        <button
                                                            onClick={() => setBatchResults((prev: any[]) => prev.map((r: any, i: number) =>
                                                                i === idx ? { ...r, userAction: 'rejected' } : r
                                                            ))}
                                                            className="px-3 py-1.5 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                                        >
                                                            拒绝
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`text-xs flex items-center gap-1 ${result.userAction === 'accepted' ? 'text-emerald-600' : 'text-red-500'
                                                        }`}>
                                                        {result.userAction === 'accepted' ? <><CheckCircle size={14} /> 已接受</> : <><X size={14} /> 已拒绝</>}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expandable Details */}
                                        {expandedReviewItems.includes(result.tableId) && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                                {/* Analysis Summary */}
                                                <div className="bg-white rounded-lg p-3 border border-slate-100">
                                                    <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                        <FileText size={12} /> 分析摘要
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">识别字段:</span>
                                                            <span className="text-slate-700">
                                                                {result.fieldStats?.total}个
                                                                <span className="text-slate-400 ml-1">
                                                                    ({result.fieldStats?.identifiers}主键, {result.fieldStats?.status}状态, {result.fieldStats?.busAttr}业务, {result.fieldStats?.time}时间)
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">敏感字段:</span>
                                                            <span className={`${(result.sensitiveFields?.count || 0) > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                                                                {result.sensitiveFields?.count || 0}个
                                                                {result.sensitiveFields?.examples && result.sensitiveFields.examples.length > 0 && (
                                                                    <span className="text-slate-400 font-mono ml-1">({result.sensitiveFields.examples.join(', ')})</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">发现关系:</span>
                                                            <span className="text-blue-600">
                                                                {result.relationships?.count || 0}个
                                                                {result.relationships?.targets && result.relationships.targets.length > 0 && (
                                                                    <span className="text-slate-400 font-mono ml-1">(→{result.relationships.targets.join(', →')})</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">升级建议:</span>
                                                            <span className="text-purple-600">
                                                                {(result.upgradeSuggestions?.statusObjects || 0) + (result.upgradeSuggestions?.behaviorObjects || 0)}个
                                                                {((result.upgradeSuggestions?.statusObjects || 0) > 0 || (result.upgradeSuggestions?.behaviorObjects || 0) > 0) && (
                                                                    <span className="text-slate-400 ml-1">
                                                                        ({result.upgradeSuggestions?.statusObjects}状态对象, {result.upgradeSuggestions?.behaviorObjects}行为对象)
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Low Confidence Reasons */}
                                                {result.lowConfidenceReasons && result.lowConfidenceReasons.length > 0 && (
                                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                                        <div className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                                                            <AlertTriangle size={12} /> 低置信度原因
                                                        </div>
                                                        <ul className="text-xs text-amber-600 space-y-1">
                                                            {result.lowConfidenceReasons.map((reason: any, i: number) => (
                                                                <li key={i} className="flex items-start gap-1.5">
                                                                    <span className="text-amber-400 mt-0.5">•</span>
                                                                    {reason}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {(() => {
                                                    const table = scanResults.find((t: any) => t.table === result.tableId);
                                                    const fields = table?.fields || [];
                                                    const derivedProfile = {
                                                        ...(table?.semanticAnalysis || {}),
                                                        fields,
                                                        aiScore: (result.scorePercent || 0) / 100,
                                                        fieldScore: table?.semanticAnalysis?.fieldScore
                                                    };
                                                    const upgradeSuggestion = generateUpgradeSuggestion(derivedProfile);

                                                    return (
                                                        <>
                                                            {upgradeSuggestion && (
                                                                <div className="bg-white rounded-lg p-3 border border-slate-100">
                                                                    <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                                        <Activity size={12} /> 升级建议
                                                                    </div>
                                                                    {result.upgradeDecision && (
                                                                        <div className={`text-xs mb-2 ${result.upgradeDecision === 'accepted' ? 'text-emerald-600' :
                                                                            result.upgradeDecision === 'rejected' ? 'text-red-600' :
                                                                                result.upgradeDecision === 'rolled_back' ? 'text-orange-600' :
                                                                                    'text-slate-500'
                                                                            }`}>
                                                                            {result.upgradeDecision === 'accepted' && '已接受升级建议'}
                                                                            {result.upgradeDecision === 'later' && '已标记为稍后处理'}
                                                                            {result.upgradeDecision === 'rejected' && `已拒绝升级建议${result.upgradeRejectReason ? `：${result.upgradeRejectReason}` : ''}`}
                                                                            {result.upgradeDecision === 'rolled_back' && '已撤销升级变更'}
                                                                        </div>
                                                                    )}
                                                                    <UpgradeSuggestionCard
                                                                        suggestion={upgradeSuggestion}
                                                                        onAccept={() => {
                                                                            const beforeState = table?.semanticAnalysis ? { ...table.semanticAnalysis } : {};
                                                                            recordUpgradeHistory(
                                                                                result.tableId,
                                                                                result.tableName,
                                                                                beforeState,
                                                                                upgradeSuggestion.afterState
                                                                            );
                                                                            setBatchResults((prev: any[]) => prev.map((r: any) =>
                                                                                r.tableId === result.tableId
                                                                                    ? { ...r, upgradeDecision: 'accepted', upgradeRejectReason: undefined }
                                                                                    : r
                                                                            ));
                                                                            setScanResults((prev: any[]) => prev.map((item: any) =>
                                                                                item.table === result.tableId
                                                                                    ? { ...item, semanticAnalysis: { ...item.semanticAnalysis, ...upgradeSuggestion.afterState } }
                                                                                    : item
                                                                            ));
                                                                        }}
                                                                        onReject={(reason) => {
                                                                            setBatchResults((prev: any[]) => prev.map((r: any) =>
                                                                                r.tableId === result.tableId
                                                                                    ? { ...r, upgradeDecision: 'rejected', upgradeRejectReason: reason }
                                                                                    : r
                                                                            ));
                                                                        }}
                                                                        onLater={() => {
                                                                            setBatchResults((prev: any[]) => prev.map((r: any) =>
                                                                                r.tableId === result.tableId
                                                                                    ? { ...r, upgradeDecision: 'later', upgradeRejectReason: undefined }
                                                                                    : r
                                                                            ));
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}

                                                            {fields.length > 0 && (
                                                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                                    <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                                        <Layers size={12} /> 字段列表 ({fields.length}个)
                                                                    </div>
                                                                    <div className="max-h-40 overflow-y-auto">
                                                                        <table className="w-full text-xs">
                                                                            <thead className="bg-slate-100 sticky top-0">
                                                                                <tr>
                                                                                    <th className="px-2 py-1 text-left text-slate-500">字段名</th>
                                                                                    <th className="px-2 py-1 text-left text-slate-500">类型</th>
                                                                                    <th className="px-2 py-1 text-left text-slate-500">语义角色</th>
                                                                                    <th className="px-2 py-1 text-left text-slate-500">说明</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {fields.slice(0, 10).map((field: any, i: number) => (
                                                                                    <tr key={i} className="hover:bg-white">
                                                                                        <td className="px-2 py-1.5 font-mono text-blue-600">{field.fieldName}</td>
                                                                                        <td className="px-2 py-1.5 text-slate-500">{field.type}</td>
                                                                                        <td className="px-2 py-1.5">
                                                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${field.fieldName.includes('id') ? 'bg-purple-100 text-purple-700' :
                                                                                                field.fieldName.includes('time') || field.fieldName.includes('date') ? 'bg-blue-100 text-blue-700' :
                                                                                                    field.fieldName.includes('status') ? 'bg-amber-100 text-amber-700' :
                                                                                                        'bg-slate-100 text-slate-600'
                                                                                                }`}>
                                                                                                {field.fieldName.includes('id') ? '标识符' :
                                                                                                    field.fieldName.includes('time') || field.fieldName.includes('date') ? '时间' :
                                                                                                        field.fieldName.includes('status') ? '状态' : '业务属性'}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5 text-slate-400 truncate max-w-[120px]">{field.comment || '-'}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                        {fields.length > 10 && (
                                                                            <div className="text-center text-xs text-slate-400 py-1">
                                                                                还有 {fields.length - 10} 个字段...
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                                {/* Relationship Details Section */}
                                                {result.relationships && result.relationships.count > 0 && (
                                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                                        <div className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                                                            <Share2 size={12} /> 关系详情 ({result.relationships.count}个)
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {result.relationships.targets.map((target: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 text-xs">
                                                                    <span className="text-blue-400">→</span>
                                                                    <span className="font-mono text-blue-600">{target}</span>
                                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px]">
                                                                        {['Many-to-One', 'One-to-Many', 'Many-to-Many'][i % 3]}
                                                                    </span>
                                                                    <span className="text-slate-400">
                                                                        via <span className="font-mono">{target.replace('t_', '')}_id</span>
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {upgradeHistory.length > 0 && (
                                <div className="px-6 pb-4">
                                    <div className="bg-white rounded-lg border border-slate-100 p-3">
                                        <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                            <Clock size={12} /> 升级操作记录
                                        </div>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {upgradeHistory.map(entry => (
                                                <div key={entry.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-md px-2 py-1.5">
                                                    <div className="text-slate-600">
                                                        <span className="font-mono text-slate-700">{entry.tableName}</span>
                                                        <span className="text-slate-400"> · {entry.timestamp}</span>
                                                        {entry.rolledBack && (
                                                            <span className="ml-2 text-orange-600">已撤销</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => rollbackUpgrade(entry.id)}
                                                        disabled={entry.rolledBack}
                                                        className={`px-2 py-1 rounded ${entry.rolledBack
                                                            ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                                                            : 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                                                            }`}
                                                    >
                                                        撤销
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                                <div className="text-sm text-slate-600">
                                    已确认 {batchResults.filter(r => r.userAction !== 'pending').length} / {batchResults.length} 项
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setBatchResults(prev => prev.map(r => ({ ...r, userAction: 'accepted' as const })))}
                                        className="px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                    >
                                        全部接受
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Apply accepted results
                                            batchResults.forEach(result => {
                                                if (result.userAction === 'accepted') {
                                                    setScanResults((prev: any[]) => prev.map((item: any) =>
                                                        item.table === result.tableId
                                                            ? { ...item, status: 'analyzed', governanceStatus: 'S3' }
                                                            : item
                                                    ));
                                                } else {
                                                    setScanResults((prev: any[]) => prev.map((item: any) =>
                                                        item.table === result.tableId
                                                            ? { ...item, status: 'scanned', governanceStatus: 'S0', reviewStats: null }
                                                            : item
                                                    ));
                                                }
                                            });
                                            setShowBatchReview(false);
                                            setBatchResults([]);
                                        }}
                                        disabled={batchResults.some(r => r.userAction === 'pending')}
                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${batchResults.some(r => r.userAction === 'pending')
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        确认提交 ({batchResults.filter(r => r.userAction === 'accepted').length} 项)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {/* Mapping Details Modal */}
            {viewMappingBO && mockBOTableMappings[viewMappingBO] && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[80vh] flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <Share2 size={18} className="text-blue-500" />
                                    业务对象映射详情
                                </h3>
                                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    <span>{mockBOTableMappings[viewMappingBO].tableName}</span>
                                    <ArrowLeft size={12} />
                                    <span className="font-medium text-blue-600">
                                        {businessObjects?.find(b => b.id === viewMappingBO)?.name || viewMappingBO}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewMappingBO(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-auto">
                            {mockBOTableMappings[viewMappingBO].mappings.length > 0 ? (
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-4 py-3 text-right w-1/3">物理字段</th>
                                                <th className="px-4 py-3 text-center w-24">映射规则</th>
                                                <th className="px-4 py-3 text-left w-1/3">业务属性</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {mockBOTableMappings[viewMappingBO].mappings.map((m, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{m.tblField}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                                            {m.rule === 'Direct Copy' ? '直连' : '转换'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left font-medium text-blue-700">{m.boField}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center text-slate-400">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                        <Share2 size={24} className="opacity-20" />
                                    </div>
                                    <p>暂无字段映射记录</p>
                                </div>
                            )}

                            {/* Additional Info / Stats */}
                            <div className="mt-6 grid grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 mb-1">物理字段总数</div>
                                    <div className="text-xl font-bold text-slate-800">
                                        {mockBOTableMappings[viewMappingBO].fields.length}
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                    <div className="text-xs text-blue-500 mb-1">已映射字段</div>
                                    <div className="text-xl font-bold text-blue-700">
                                        {mockBOTableMappings[viewMappingBO].mappings.length}
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                                    <div className="text-xs text-green-600 mb-1">覆盖率</div>
                                    <div className="text-xl font-bold text-green-700">
                                        {Math.round((mockBOTableMappings[viewMappingBO].mappings.length / Math.max(1, mockBOTableMappings[viewMappingBO].fields.length)) * 100)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setViewMappingBO(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Generation Modal */}
            {showDirectGenModal && pendingGenData && (() => {
                const eligibility = getDirectGenEligibility(pendingGenData.table, pendingGenData.profile);
                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-white rounded-xl shadow-2xl w-[560px] overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">高置信度识别结果</h3>
                                        <p className="text-sm text-slate-500">
                                            基于AI分析，对表
                                            <span className="font-mono font-medium text-slate-700 mx-1">{pendingGenData.table.table}</span>
                                            的识别置信度较高
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500 block text-xs mb-1">建议业务对象名</span>
                                            <span className="font-medium text-slate-800">{pendingGenData.profile.businessName}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-xs mb-1">识别置信度</span>
                                            <span className="font-medium text-emerald-600">{(pendingGenData.profile.aiScore || 0.85) * 100}%</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-slate-500 block text-xs mb-1">业务描述</span>
                                            <span className="text-slate-600">{pendingGenData.profile.description || pendingGenData.table.comment || '无描述'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                                    <div className="text-sm font-medium text-slate-700 mb-2">生成前置校验清单</div>
                                    <div className="space-y-2 text-xs">
                                        {eligibility.checklist.map(item => (
                                            <div key={item.key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {item.passed ? (
                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                    ) : (
                                                        <XCircle size={14} className="text-red-500" />
                                                    )}
                                                    <span className="text-slate-600">{item.label}</span>
                                                </div>
                                                <span className={`text-[10px] ${item.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {item.detail}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-600 mb-4">
                                    <div className="font-medium text-slate-700 mb-1">动作差异说明</div>
                                    <div>直接生成＝写入语义注册表（生效，可回滚）</div>
                                    <div>加入候选＝草稿对象（不生效，待Review）</div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => eligibility.canGenerate && executeDirectGenerate(pendingGenData.table, pendingGenData.profile)}
                                        disabled={!eligibility.canGenerate}
                                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm ${eligibility.canGenerate
                                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        <Box size={18} /> 直接生成业务对象
                                    </button>
                                    {!eligibility.canGenerate && (
                                        <div className="text-[10px] text-red-500 text-center">
                                            未满足前置条件，仅可加入候选
                                        </div>
                                    )}

                                    <div className="relative flex py-1 items-center">
                                        <div className="flex-grow border-t border-slate-200"></div>
                                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">或者</span>
                                        <div className="flex-grow border-t border-slate-200"></div>
                                    </div>

                                    <button
                                        onClick={() => executeAddToCandidates(pendingGenData.table, pendingGenData.profile)}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <ListPlus size={18} /> 加入候选业务对象
                                    </button>

                                </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-center">
                                <button
                                    onClick={() => setShowDirectGenModal(false)}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                >
                                    取消操作
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

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
                    currentTable={batchSemanticProgress.current}
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
                    onViewTableDetail={handleViewTableDetail}
                />
            )}
        </>
    );
};

export default DataSemanticUnderstandingView;
