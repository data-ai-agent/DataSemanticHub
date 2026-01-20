import React, { useEffect, useState } from 'react';
import { TableSemanticProfile } from '../../../types/semantic';
import { SemanticFieldDetail } from '../SemanticFieldDetail';
import { SignalsDrawer } from './SignalsDrawer';
import { profileService, FieldProfileSnapshot } from '../../../services/profile';
import { LayoutDashboard } from 'lucide-react';

interface SemanticContextPanelProps {
    profile: TableSemanticProfile;
    focusField: string | null;
    fields: any[];
}

export const SemanticContextPanel: React.FC<SemanticContextPanelProps> = ({
    profile,
    focusField,
    fields
}) => {
    const [profileSnapshots, setProfileSnapshots] = useState<Record<string, FieldProfileSnapshot>>({});
    const [showSignalsDrawer, setShowSignalsDrawer] = useState(false);

    // Fetch Profile for focus field
    useEffect(() => {
        if (focusField) {
            // Check cache
            if (profileSnapshots[focusField]) return;

            // Fetch
            profileService.getSignals(profile.tableName, [focusField]).then(snapshots => {
                if (snapshots.length > 0) {
                    setProfileSnapshots(prev => ({
                        ...prev,
                        [focusField]: snapshots[0]
                    }));
                }
            });
        }
    }, [focusField, profile.tableName]);

    if (!focusField) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <LayoutDashboard size={32} className="opacity-20" />
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">整表语义概览</h3>
                <p className="text-xs max-w-[200px] text-center">
                    请从左侧列表选择一个字段，查看详细的语义分析、采样数据与质量信号。
                </p>
            </div>
        );
    }

    const fieldInfo = fields.find(f => f.name === focusField);
    const semanticInfo = profile.fields?.find(f => f.fieldName === focusField) || {};
    const snapshot = profileSnapshots[focusField];

    return (
        <div className="h-full overflow-y-auto bg-white">
            <SemanticFieldDetail
                field={fieldInfo}
                semanticProfile={semanticInfo}
                profileSnapshot={snapshot}
                onViewDetails={() => setShowSignalsDrawer(true)}
            />

            <SignalsDrawer
                open={showSignalsDrawer}
                onClose={() => setShowSignalsDrawer(false)}
                fieldProfile={semanticInfo as any}
                profileSnapshot={snapshot}
            />
        </div>
    );
};
