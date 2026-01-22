import { useState } from 'react';
import { TableSemanticProfile, GovernanceStatus, AuditLogEntry, UpgradeHistoryEntry } from '../../../types/semantic';
import { resolveGovernanceStatus, buildReviewStats, analyzeSingleTable } from '../logic';

// Default Empty Profile
export const emptyProfile: TableSemanticProfile = {
    tableName: '',
    gateResult: { result: 'PASS', details: { primaryKey: false, lifecycle: false, tableType: false }, reasons: [] },
    ruleScore: { naming: 0, behavior: 0, comment: 0, total: 0 },
    aiScore: 0,
    fieldScore: 0,
    finalScore: 0,
    businessName: '',
    description: '',
    tags: [],
    fields: [],
    aiEvidence: [],
    ruleEvidence: [],
    governanceStatus: 'S0',
    reviewStats: { pendingReviewFields: 0, gateFailedItems: 0, riskItems: 0 }
};

export const useSemanticProfile = (
    selectedTable: any,
    selectedTableFields: any[],
    setScanResults: (fn: (prev: any[]) => any[]) => void
) => {
    // State
    const [semanticProfile, setSemanticProfile] = useState<TableSemanticProfile & { analysisStep: 'idle' | 'analyzing' | 'done', relationships?: any[] }>({
        ...emptyProfile,
        analysisStep: 'idle',
        relationships: []
    });

    // Auxiliary State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [pendingAnalysisResult, setPendingAnalysisResult] = useState<TableSemanticProfile | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [upgradeHistory, setUpgradeHistory] = useState<UpgradeHistoryEntry[]>([]);
    const [fieldReviewStatus, setFieldReviewStatus] = useState<Record<string, 'suggested' | 'confirmed' | 'pending'>>({});

    // Handlers
    const recordAuditLog = (payload: {
        field?: string;
        action: 'accept' | 'override' | 'pending' | 'confirm';
        source?: string;
        reason?: string;
        timestamp: string;
    }) => {
        if (!selectedTable) return;
        const entry: AuditLogEntry = {
            id: `AUD-${Date.now()}`,
            tableId: selectedTable.table,
            ...payload
        };
        setAuditLogs(prev => [entry, ...prev]);
    };

    const recordUpgradeHistory = (
        tableId: string,
        tableName: string,
        beforeState: any,
        afterState: any
    ) => {
        const entry: UpgradeHistoryEntry = {
            id: `UPG-${Date.now()}`,
            tableId,
            tableName,
            beforeState: JSON.parse(JSON.stringify(beforeState)),
            afterState: JSON.parse(JSON.stringify(afterState)),
            timestamp: new Date().toISOString(),
            rolledBack: false
        };
        setUpgradeHistory(prev => [entry, ...prev]);
    };

    const rollbackUpgrade = (id: string) => {
        const entry = upgradeHistory.find(e => e.id === id);
        if (!entry || entry.rolledBack) return;

        // Restore beforeState
        // Note: This logic assumes simple state restoration. 
        // In reality, might need more complex merge.
        const restoredProfile = { ...entry.beforeState };
        setSemanticProfile(prev => ({ ...prev, ...restoredProfile }));

        setUpgradeHistory(prev => prev.map(e =>
            e.id === id ? { ...e, rolledBack: true } : e
        ));

        recordAuditLog({
            action: 'override',
            source: 'System',
            reason: `Rollback upgrade ${id}`,
            timestamp: new Date().toISOString()
        });
    };

    const handleAnalyze = async () => {
        if (!selectedTable) return;
        setIsAnalyzing(true);
        setSemanticProfile(prev => ({ ...prev, analysisStep: 'analyzing' }));

        try {
            const result = await analyzeSingleTable(
                selectedTable.table,
                selectedTableFields.length > 0 ? selectedTableFields : [],
                selectedTable.comment
            );

            setPendingAnalysisResult(result);
        } catch (error) {
            console.error(error);
            setIsAnalyzing(false);
        }
    };

    const handleConfirmEffective = () => {
        if (!selectedTable) return;
        const confirmedAt = new Date().toISOString();
        const confirmScope = selectedTable.sourceName
            ? `${selectedTable.sourceName} / ${selectedTable.table}`
            : selectedTable.table;
        const confirmFieldNames = selectedTableFields.map(field => field.fieldName);
        const updatedProfile = {
            ...semanticProfile,
            governanceStatus: 'S3' as GovernanceStatus,
            confirmedBy: '当前用户',
            confirmedAt,
            confirmScope
        };
        setSemanticProfile(prev => ({ ...prev, ...updatedProfile }));

        if (confirmFieldNames.length > 0) {
            setFieldReviewStatus(prev => {
                const next = { ...prev };
                confirmFieldNames.forEach(name => {
                    next[name] = 'confirmed';
                });
                return next;
            });
        }

        setScanResults(prev => prev.map((item: any) =>
            item.table === selectedTable.table
                ? { ...item, status: 'analyzed', governanceStatus: 'S3', semanticAnalysis: { ...item.semanticAnalysis, ...updatedProfile } }
                : item
        ));

        recordAuditLog({
            action: 'confirm',
            source: '融合',
            reason: '确认生效',
            timestamp: confirmedAt
        });
    };

    const handleIgnore = (onComplete?: () => void) => {
        if (!selectedTable) return;
        setScanResults(prev => prev.map((item: any) =>
            item.table === selectedTable.table
                ? { ...item, status: 'ignored' }
                : item
        ));
        if (onComplete) onComplete();
    };

    const handleSave = () => {
        if (!selectedTable) return;
        setScanResults(prev => prev.map((item: any) =>
            item.table === selectedTable.table
                ? { ...item, semanticAnalysis: semanticProfile }
                : item
        ));
    };

    const updateFieldDecision = (fieldName: string, decision: any) => {
        setSemanticProfile(prev => ({
            ...prev,
            fields: prev.fields.map(f => f.fieldName === fieldName ? { ...f, ...decision } : f)
        }));
    };

    const resetProfile = () => {
        setSemanticProfile({
            ...emptyProfile,
            analysisStep: 'idle',
            relationships: []
        });
        setPendingAnalysisResult(null);
        setAuditLogs([]);
        setUpgradeHistory([]);
        setFieldReviewStatus({});
    };

    return {
        semanticProfile,
        setSemanticProfile,
        isAnalyzing,
        setIsAnalyzing,
        pendingAnalysisResult,
        setPendingAnalysisResult,
        auditLogs,
        setAuditLogs,
        upgradeHistory,
        setUpgradeHistory,
        fieldReviewStatus,
        setFieldReviewStatus,
        recordAuditLog,
        recordUpgradeHistory,
        rollbackUpgrade,
        handleAnalyze,
        handleConfirmEffective,
        handleIgnore,
        handleSave,
        updateFieldDecision,
        resetProfile
    };
};
