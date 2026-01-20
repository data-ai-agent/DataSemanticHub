import React from 'react';
import { Filter } from 'lucide-react';
import { FieldSemanticProfile } from '../../types/semantic';

export type FieldFilterType = 'all' | 'issues' | 'sensitive';

interface FieldFilterBarProps {
    fields: FieldSemanticProfile[];
    activeFilter: FieldFilterType;
    onFilterChange: (filter: FieldFilterType) => void;
}

/**
 * P0-3: Field Filter Bar
 * Quick filter buttons for field analysis tab
 */
export const FieldFilterBar: React.FC<FieldFilterBarProps> = ({
    fields,
    activeFilter,
    onFilterChange
}) => {
    // Calculate counts for each filter
    const allCount = fields.length;
    const issuesCount = fields.filter(f =>
        f.roleConfidence < 0.8 ||
        f.quality === 'C' ||
        f.quality === 'D'
    ).length;
    const sensitiveCount = fields.filter(f =>
        f.sensitivity === 'L3' ||
        f.sensitivity === 'L4'
    ).length;

    const filters: Array<{ key: FieldFilterType; label: string; count: number }> = [
        { key: 'all', label: '全部字段', count: allCount },
        { key: 'issues', label: '问题字段', count: issuesCount },
        { key: 'sensitive', label: '敏感字段', count: sensitiveCount }
    ];

    return (
        <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-100">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium mr-2">快速筛选:</span>
            <div className="flex gap-2">
                {filters.map(filter => (
                    <button
                        key={filter.key}
                        onClick={() => onFilterChange(filter.key)}
                        className={`
                            px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                            ${activeFilter === filter.key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }
                        `}
                    >
                        {filter.label}
                        <span className={`ml-1.5 ${activeFilter === filter.key ? 'text-blue-100' : 'text-slate-400'}`}>
                            ({filter.count})
                        </span>
                    </button>
                ))}
            </div>

            {activeFilter !== 'all' && (
                <button
                    onClick={() => onFilterChange('all')}
                    className="ml-2 text-xs text-slate-500 hover:text-slate-700 underline"
                >
                    清除筛选
                </button>
            )}
        </div>
    );
};

/**
 * Helper function to filter fields based on selected filter type
 */
export const filterFields = (
    fields: FieldSemanticProfile[],
    filterType: FieldFilterType
): FieldSemanticProfile[] => {
    switch (filterType) {
        case 'issues':
            return fields.filter(f =>
                f.roleConfidence < 0.8 ||
                f.quality === 'C' ||
                f.quality === 'D'
            );
        case 'sensitive':
            return fields.filter(f =>
                f.sensitivity === 'L3' ||
                f.sensitivity === 'L4'
            );
        case 'all':
        default:
            return fields;
    }
};
