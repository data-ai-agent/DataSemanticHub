import { useState } from 'react';
import { analyzeSingleTable } from '../logic';
import { RunSummary, GovernanceStatus } from '../../../types/semantic';

export interface BatchSemanticConfig {
    template: string;
    scope: 'INCREMENTAL' | 'ALL';
    forceRebuild: boolean;
    parallel: number;
}

export const useBatchOperations = (
    scanResults: any[],
    setScanResults: (fn: (prev: any[]) => any[]) => void
) => {
    // Selection State
    const [selectedTables, setSelectedTables] = useState<string[]>([]);

    // Batch Modal Workflow State
    const [showBatchSemanticModal, setShowBatchSemanticModal] = useState(false);
    const [batchSemanticStep, setBatchSemanticStep] = useState<'config' | 'running' | 'result'>('config');
    const [batchConfig, setBatchConfig] = useState<any>(null); // Type as BatchSemanticConfig

    // Execution State
    const [batchAnalyzing, setBatchAnalyzing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, completed: 0 });
    const [currentAnalyzing, setCurrentAnalyzing] = useState<string | null>(null);
    const [batchResult, setBatchResult] = useState<any>(null); // Result summary object
    const [completedResults, setCompletedResults] = useState<any[]>([]);

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

    // Handle Start from Config Modal
    const handleBatchSemanticStart = async (config: any) => {
        setBatchConfig(config);
        setBatchSemanticStep('running');
        setBatchAnalyzing(true);
        setBatchProgress({ current: 1, total: selectedTables.length, completed: 0 });
        setBatchResult(null);
        setCompletedResults([]);

        const results: any[] = [];
        const tablesToRun = selectedTables; // or filtered from config

        for (let i = 0; i < tablesToRun.length; i++) {
            const tableId = tablesToRun[i];
            const table = scanResults.find((t: any) => t.table === tableId);

            if (table) {
                setCurrentAnalyzing(tableId);
                // Simulate analyze or call actual logic
                // For demo/stub purposes:
                await new Promise(r => setTimeout(r, 500));

                // Construct result item stub
                const resultItem = {
                    tableId,
                    status: 'success',
                    score: 0.85 // Mock score
                };
                results.push(resultItem);
                setCompletedResults(prev => [...prev, resultItem]);
            }

            setBatchProgress(prev => ({ ...prev, current: i + 2, completed: i + 1 }));
        }

        // Finish
        setBatchAnalyzing(false);
        setCurrentAnalyzing(null);
        setBatchResult({
            successCount: results.length, // simplify
            failureCount: 0,
            totalCount: tablesToRun.length,
            items: results
        });
        setBatchSemanticStep('result');
    };

    const handleBatchBackground = () => {
        setShowBatchSemanticModal(false);
        // Background logic would continue update state effects if mounted, 
        // or rely on a global context. For now, just close modal.
    };

    const handleBatchViewWorkbench = () => {
        setShowBatchSemanticModal(false);
        // Logic to navigate
    };

    const handleBatchBackToList = () => {
        setShowBatchSemanticModal(false);
        setBatchSemanticStep('config');
        clearSelection();
    };


    return {
        // Selection
        selectedTables,
        setSelectedTables,
        toggleTableSelection,
        handleSelectAll,
        clearSelection,

        // Modal Flow
        showBatchSemanticModal,
        setShowBatchSemanticModal,
        batchSemanticStep,
        batchConfig,

        // Progress / Execution
        batchAnalyzing,
        batchSemanticProgress: batchProgress, // Aliased to match V2 view expectation
        batchResult, // The summary object

        // Handlers
        handleBatchSemanticStart,
        handleBatchBackground,
        handleBatchViewWorkbench,
        handleBatchBackToList,
        currentAnalyzing, // Exporting for usage in Modal prop

        // Legacy/Other props if needed
        batchProgress,
        batchResults: completedResults,
        completedResults, // For direct access
        showBatchReview: showBatchSemanticModal, // Alias for compatibility
        setShowBatchReview: setShowBatchSemanticModal, // Alias for compatibility
        handleBatchAnalyze: handleBatchSemanticStart, // Alias for compatibility
        setBatchResults: setCompletedResults // For manual overrides
    };
};
