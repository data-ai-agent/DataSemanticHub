import React from 'react';
import { TableSemanticProfile, BusinessObject } from '../../../types/semantic';
import { SemanticConclusionCard } from '../SemanticConclusionCard';
import { SemanticAnalysisCard } from '../SemanticAnalysisCard';

interface EvidenceTabProps {
    profile: TableSemanticProfile;
    fields: any[];
    selectedTable: {
        table: string;
        sourceType: string;
        comment?: string;
    } | null;
    businessObject?: BusinessObject;
    editMode: boolean;
    setEditMode: (mode: boolean) => void;
    onProfileChange: (updates: Partial<TableSemanticProfile>) => void;
    actions: {
        onAccept: () => void;
        onReject: () => void;
        onConfirmEffective: () => void;
        onViewLogs: () => void;
        onEvidenceAction: (payload: any) => void;
        onSaveEdit: () => void;
        onFocusField: (fieldName: string) => void;
        onUpgradeAccepted: (before: any, after: any) => void;
    };
}

export const EvidenceTab: React.FC<EvidenceTabProps> = ({
    profile,
    fields,
    selectedTable,
    businessObject,
    editMode,
    setEditMode,
    onProfileChange,
    actions
}) => {
    return (
        <div className="space-y-6">
            <div id="result-conclusion">
                <SemanticConclusionCard
                    profile={profile}
                    fields={profile.fields && profile.fields.length > 0 ? profile.fields : fields}
                    onAccept={actions.onAccept}
                    onReject={actions.onReject}
                    onConfirmEffective={actions.onConfirmEffective}
                    onViewLogs={actions.onViewLogs}
                    onEvidenceAction={actions.onEvidenceAction}
                    onEdit={() => setEditMode(true)}
                    isEditing={editMode}
                    onProfileChange={onProfileChange}
                    onSaveEdit={() => {
                        actions.onSaveEdit();
                    }}
                    onFocusField={actions.onFocusField}
                    existingBO={businessObject}
                />
            </div>
            <div id="result-analysis">
                <SemanticAnalysisCard
                    profile={profile}
                    fields={fields}
                    onProfileChange={onProfileChange}
                    onUpgradeAccepted={(before, after) => {
                        actions.onUpgradeAccepted(before, after);
                    }}
                />
            </div>
        </div>
    );
};
