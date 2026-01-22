import React from 'react';
import { TableSemanticProfile } from '../../../../types/semantic';
import { ObjectCard } from './ObjectCard';

interface ObjectViewProps {
    profiles: TableSemanticProfile[];
}

export const ObjectView: React.FC<ObjectViewProps> = ({ profiles }) => {
    if (!profiles || profiles.length === 0) {
        return <div className="text-center py-10 text-slate-400">暂无业务对象</div>;
    }

    return (
        <div className="space-y-6">
            {profiles.map(profile => (
                <ObjectCard key={profile.tableName} profile={profile} />
            ))}
        </div>
    );
};
