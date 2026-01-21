import React from 'react';
import { Box, Sparkles, Database } from 'lucide-react';
import { TableSemanticProfile, FieldSemanticProfile } from '../../../../types/semantic';
import { FieldItem } from './FieldItem';

interface ObjectCardProps {
    profile: TableSemanticProfile;
}

export const ObjectCard: React.FC<ObjectCardProps> = ({ profile }) => {
    // Group fields
    const groupedFields = React.useMemo(() => {
        const groups = {
            pk: [] as FieldSemanticProfile[],
            status: [] as FieldSemanticProfile[],
            time: [] as FieldSemanticProfile[],
            attr: [] as FieldSemanticProfile[],
        };

        profile.fields.forEach(field => {
            if (field.role === 'Identifier') groups.pk.push(field);
            else if (field.role === 'Status') groups.status.push(field);
            else if (field.role === 'Time') groups.time.push(field);
            else groups.attr.push(field);
        });

        return groups;
    }, [profile.fields]);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
            {/* Object Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Box className="text-indigo-600" size={20} />
                            {profile.businessName || profile.tableName}
                        </h3>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-200 flex items-center gap-1">
                            <Sparkles size={10} /> 系统识别
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${profile.aiScore >= 0.8 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                profile.aiScore >= 0.6 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                    'bg-red-100 text-red-700 border-red-200'
                            }`}>
                            置信度 {Math.round(profile.aiScore * 100)}%
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Database size={12} />
                        <span>来源逻辑视图: {profile.tableName}</span>
                    </div>
                </div>

                {/* Optional: Add status badge or other meta */}
            </div>

            {/* Object Meta & Tooltip Hint */}
            <div className="px-6 py-3 bg-indigo-50/30 border-b border-indigo-100 text-xs text-indigo-800">
                <p>该业务对象由系统基于字段语义理解自动识别，将在业务对象建模阶段进行确认与调整。</p>
            </div>

            {/* Fields Groups */}
            <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* PK Group */}
                {groupedFields.pk.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            主键 / 标识
                            <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full text-[10px]">{groupedFields.pk.length}</span>
                        </h4>
                        <div className="space-y-1">
                            {groupedFields.pk.map(f => <FieldItem key={f.fieldName} field={f} />)}
                        </div>
                    </div>
                )}

                {/* Status Group */}
                {groupedFields.status.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            生命周期 / 状态
                            <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full text-[10px]">{groupedFields.status.length}</span>
                        </h4>
                        <div className="space-y-1">
                            {groupedFields.status.map(f => <FieldItem key={f.fieldName} field={f} />)}
                        </div>
                    </div>
                )}

                {/* Time Group */}
                {groupedFields.time.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            时间维度
                            <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full text-[10px]">{groupedFields.time.length}</span>
                        </h4>
                        <div className="space-y-1">
                            {groupedFields.time.map(f => <FieldItem key={f.fieldName} field={f} />)}
                        </div>
                    </div>
                )}

                {/* Attributes Group - Might be large, so maybe span full width if needed, or stick to column */}
                {groupedFields.attr.length > 0 && (
                    <div className="space-y-3 col-span-1 md:col-span-2 lg:col-span-1">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            业务属性
                            <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full text-[10px]">{groupedFields.attr.length}</span>
                        </h4>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {groupedFields.attr.map(f => <FieldItem key={f.fieldName} field={f} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
