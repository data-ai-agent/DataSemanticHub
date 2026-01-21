import React from 'react';
import { TableSemanticProfile } from '../../../../types/semantic';
import { RelationshipGraphTab } from '../../tabs/RelationshipGraphTab';

interface RelationViewProps {
    profile: TableSemanticProfile;
}

export const RelationView: React.FC<RelationViewProps> = ({ profile }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[600px] overflow-hidden">
            <RelationshipGraphTab semanticProfile={profile} />
        </div>
    );
};
