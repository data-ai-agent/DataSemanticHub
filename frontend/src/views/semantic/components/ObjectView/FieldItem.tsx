import React from 'react';
import { Info } from 'lucide-react';
import { FieldSemanticProfile } from '../../../../types/semantic';

interface FieldItemProps {
    field: FieldSemanticProfile;
}

export const FieldItem: React.FC<FieldItemProps> = ({ field }) => {
    // Determine style based on role
    const getRoleStyle = (role: string) => {
        if (role === 'Identifier') return 'bg-purple-100 text-purple-700 border-purple-200';
        if (role === 'Status') return 'bg-amber-100 text-amber-700 border-amber-200';
        if (role === 'Time') return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-slate-100 text-slate-600 border-slate-200'; // Attribute and others
    };

    const getRoleLabel = (role: string) => {
        const map: Record<string, string> = {
            'Identifier': '主键',
            'ForeignKey': '外键',
            'Status': '状态',
            'Time': '时间',
            'Measure': '度量',
            'Attribute': '属性',
            'Audit': '审计',
            'Technical': '技术'
        };
        return map[role] || role;
    };

    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{field.fieldName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{field.dataType}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRoleStyle(field.role)}`}>
                    {getRoleLabel(field.role)}
                </span>
            </div>

            {field.aiSuggestion && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity" title={field.aiSuggestion}>
                    <Info size={14} className="text-slate-400" />
                </div>
            )}
        </div>
    );
};
