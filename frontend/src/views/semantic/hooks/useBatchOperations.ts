import { useState } from 'react';
import { analyzeSingleTable } from '../logic';
import { RunSummary, GovernanceStatus } from '../../../types/semantic';

interface BatchOperationResult {
    tableId: string;
    tableName: string;
    businessName: string;
    status: 'success' | 'error' | 'pending';
    scorePercent: number;
    needsReview?: boolean;
    userAction?: 'accepted' | 'rejected' | 'pending';
    upgradeDecision?: 'accepted' | 'rejected' | 'later' | 'rolled_back';
    upgradeRejectReason?: string;
    fieldStats?: { total: number; identifiers: number; status: number; busAttr: number; time: number };
    sensitiveFields?: { count: number; examples: string[] };
    relationships?: { count: number; targets: string[] };
    upgradeSuggestions?: { statusObjects: number; behaviorObjects: number };
    lowConfidenceReasons?: string[];
}

export const useBatchOperations = (
    scanResults: any[],
    setScanResults: (fn: (prev: any[]) => any[]) => void
) => {
    // Selection State
    const [selectedTables, setSelectedTables] = useState<string[]>([]);

    // Batch Analysis State
    const [batchAnalyzing, setBatchAnalyzing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [currentAnalyzing, setCurrentAnalyzing] = useState<string | null>(null);
    const [completedResults, setCompletedResults] = useState<BatchOperationResult[]>([]);
    const [batchResults, setBatchResults] = useState<BatchOperationResult[]>([]);
    const [showBatchReview, setShowBatchReview] = useState(false);

    // Toggle single table selection
    const toggleTableSelection = (tableId: string) => {
        setSelectedTables(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId]
        );
    };

    // Select/Deselect all visible tables
    const handleSelectAll = (visibleTableIds: string[]) => {
        if (selectedTables.length === visibleTableIds.length && visibleTableIds.length > 0) {
            setSelectedTables([]);
        } else {
            setSelectedTables(visibleTableIds);
        }
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedTables([]);
    };

    // Execute Batch Analysis
    const handleBatchAnalyze = async (runId: string, runSummary: RunSummary, config: any) => {
        if (selectedTables.length === 0) return;

        setBatchAnalyzing(true);
        setBatchProgress({ current: 0, total: selectedTables.length });
        setCompletedResults([]);

        const results: BatchOperationResult[] = [];
        const CONFIDENCE_THRESHOLD = 70;

        for (let i = 0; i < selectedTables.length; i++) {
            const tableId = selectedTables[i];
            const table = scanResults.find((t: any) => t.table === tableId);
            if (!table) continue;

            setCurrentAnalyzing(table.table);
            setBatchProgress({ current: i, total: selectedTables.length });

            // Simulate slight delay for UI feedback
            await new Promise(resolve => setTimeout(resolve, 300));

            const rawFields = Array.isArray(table.fields) ? table.fields : [];
            const profile = await analyzeSingleTable(table.table, rawFields, table.comment);
            const { fields: analyzedFields, ruleScore, ruleEvidence, gateResult, finalScore, aiScore, businessName, reviewStats } = profile;

            const scorePercent = Math.round(finalScore * 100);
            const needsReview = scorePercent < CONFIDENCE_THRESHOLD;
            const identifiers = analyzedFields.filter((f: any) => f.role === 'Identifier').length;
            const statusFields = analyzedFields.filter((f: any) => f.role === 'Status').length;
            const timeFields = analyzedFields.filter((f: any) => f.role === 'EventHint').length;
            const busAttr = analyzedFields.filter((f: any) => f.role === 'BusAttr').length;
            const sensitiveFields = analyzedFields.filter((f: any) => ['L3', 'L4'].includes(f.sensitivity));
            const lowConfidenceReasons: string[] = [];

            if (aiScore < 0.7) {
                lowConfidenceReasons.push('AI 置信度偏低，建议人工复核');
            }
            if (ruleScore.total < 0.6) {
                lowConfidenceReasons.push('规则评分偏低，命名或注释可能不规范');
            }

            const resultItem: BatchOperationResult = {
                tableId: table.table,
                tableName: table.table,
                businessName,
                status: 'success',
                scorePercent,
                needsReview,
                userAction: 'pending',
                fieldStats: {
                    total: analyzedFields.length,
                    identifiers,
                    status: statusFields,
                    busAttr,
                    time: timeFields
                },
                sensitiveFields: {
                    count: sensitiveFields.length,
                    examples: sensitiveFields.map((f: any) => f.fieldName).slice(0, 3)
                },
                relationships: {
                    count: 0,
                    targets: []
                },
                upgradeSuggestions: {
                    statusObjects: statusFields > 0 ? 1 : 0,
                    behaviorObjects: timeFields > 0 ? 1 : 0
                },
                lowConfidenceReasons
            };
            results.push(resultItem);
            setCompletedResults(prev => [...prev, resultItem]);

            // Update main scan results
            setScanResults((prev: any[]) => prev.map((item: any) =>
                item.table === tableId
                    ? {
                        ...item,
                        status: 'pending_review',
                        governanceStatus: 'S1',
                        scorePercent,
                        reviewStats,
                        lastRun: {
                            ...runSummary,
                            runId,
                            status: 'success',
                            finishedAt: new Date().toISOString()
                        },
                        semanticAnalysis: {
                            ...profile,
                            governanceStatus: 'S1',
                            analysisStep: 'done',
                            reviewStats,
                            fields: analyzedFields,
                            gateResult,
                            ruleScore,
                            ruleEvidence
                        }
                    }
                    : item
            ));
        }

        setCurrentAnalyzing(null);
        setBatchProgress({ current: selectedTables.length, total: selectedTables.length });
        setBatchResults(results);
        setBatchAnalyzing(false);
        setSelectedTables([]);

        if (results.some(r => r.needsReview)) {
            setShowBatchReview(true);
        }
    };

    return {
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
    };
};
