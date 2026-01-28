import React, { useEffect, useState } from 'react';
import {
    Table, Database, CheckCircle2, ChevronDown, ChevronRight, Key
} from 'lucide-react';
import { TableSemanticProfile, FieldSemanticProfile } from '../../types/semantic';
import { SemanticFieldDetail } from './SemanticFieldDetail';
import { SignalsDrawer } from './components/SignalsDrawer';
import { profileService, FieldProfileSnapshot } from '../../services/profile';

interface DeepAnalysisTabsProps {
    profile: TableSemanticProfile;
    fields: any[];
    onProfileChange?: (updates: Partial<TableSemanticProfile>) => void;
    focusField?: string | null;
}

export const DeepAnalysisTabs: React.FC<DeepAnalysisTabsProps> = ({
    profile,
    fields,
    onProfileChange,
    focusField
}) => {
    // Only 'fields' logic remains
    const [expandedFields, setExpandedFields] = useState<string[]>([]);
    const [fieldSearchTerm, setFieldSearchTerm] = useState('');
    const [highlightedField, setHighlightedField] = useState<string | null>(null);
    const [showAnomalyOnly, setShowAnomalyOnly] = useState(false);

    // V2.4: Profile Signals
    const [profileSnapshots, setProfileSnapshots] = useState<Record<string, FieldProfileSnapshot>>({});
    const [showSignalsDrawer, setShowSignalsDrawer] = useState(false);

    // Check if we are in single field detail mode
    const isSingleFieldMode = focusField && fields.length === 1 && fields[0].name === focusField;

    useEffect(() => {
        if (!focusField) return;
        setFieldSearchTerm(focusField);
        setHighlightedField(focusField);
        setExpandedFields(prev => (prev.includes(focusField) ? prev : [...prev, focusField]));
        const timer = window.setTimeout(() => setHighlightedField(null), 3500);
        const scrollTimer = window.setTimeout(() => {
            const el = document.querySelector(`[data-field-row="${focusField}"]`);
            if (el) {
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }, 50);
        return () => {
            window.clearTimeout(timer);
            window.clearTimeout(scrollTimer);
        };
    }, [focusField]);

    // V2.4: Fetch Profile when in single field mode
    useEffect(() => {
        if (isSingleFieldMode && focusField) {
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
    }, [isSingleFieldMode, focusField, profile.tableName]);

    // Helper functions for field analysis
    const getSemanticRole = (name: string, primaryKey?: boolean): string => {
        if (primaryKey || /^id$/.test(name) || /_id$/.test(name)) return '标识符';
        if (/status|state|phase|stage/.test(name)) return '状态';
        if (/time$|date$|_at$/.test(name)) return '时间标记';
        return '业务属性';
    };

    const getSensitivity = (name: string): 'L1' | 'L2' | 'L3' | 'L4' => {
        if (/id_card|bank/.test(name)) return 'L4';
        if (/mobile|phone|name|address/.test(name)) return 'L3';
        if (/user|employee/.test(name)) return 'L2';
        return 'L1';
    };

    return (
        <div className="mt-0 pt-0">
            {/* Header with Stats or just Content? The original header had activeTab buttons. 
                Now we don't need buttons, but maybe we want the Anomaly Toggle?
                The 'Statistics Dashboard' is inside the fields block, so it's good.
             */}

            {/* V2.2: Anomaly Filter Toggle - Positioned above content if needed, or integrated. 
                The original layout had it in the tab bar. Let's put it in a small header or top right.
            */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-medium text-slate-700">字段结构详请</div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">只看异常项</span>
                    <button
                        onClick={() => setShowAnomalyOnly(!showAnomalyOnly)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showAnomalyOnly ? 'bg-purple-600' : 'bg-slate-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showAnomalyOnly ? 'translate-x-5' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            <div className="bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden">
                {isSingleFieldMode ? (
                    <SemanticFieldDetail
                        field={fields[0]}
                        semanticProfile={profile.fields?.find(f => f.fieldName === fields[0].name) || {}}
                        profileSnapshot={fields[0] ? profileSnapshots[fields[0].name] : undefined}
                        onUpdate={(updates) => {
                            // Mock update handler for now, or bubble up
                            console.log('Update field:', updates);
                        }}
                        onViewDetails={() => setShowSignalsDrawer(true)}
                    />
                ) : (
                    <div className="space-y-4 p-4">
                        {/* Statistics Dashboard */}
                        <div className="grid grid-cols-4 gap-4 mb-2">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{fields.length}</div>
                                <div className="text-xs text-blue-400 font-medium">总字段数</div>
                            </div>
                            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-amber-600 mb-1">
                                    {fields.filter(f => getSemanticRole(f.name, f.primaryKey) === '标识符').length}
                                </div>
                                <div className="text-xs text-amber-400 font-medium">主键字段</div>
                            </div>
                            <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-red-600 mb-1">
                                    {fields.filter(f => getSensitivity(f.name) !== 'L1').length}
                                </div>
                                <div className="text-xs text-red-400 font-medium">敏感字段</div>
                            </div>
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-emerald-600 mb-1">
                                    {fields.filter(f => f.required).length}
                                </div>
                                <div className="text-xs text-emerald-400 font-medium">必填字段</div>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="relative w-64">
                                <input
                                    type="text"
                                    placeholder="搜索字段..."
                                    value={fieldSearchTerm}
                                    onChange={(e) => setFieldSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100/50"
                                />
                                <Database size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            <div className="text-xs text-slate-400">
                                共 {fields.length} 个字段
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-12">#</th>
                                        <th className="px-4 py-3 text-left">物理字段</th>
                                        <th className="px-4 py-3 text-left">业务描述</th>
                                        <th className="px-4 py-3 text-left">数据类型</th>
                                        <th className="px-4 py-3 text-center w-16">主键</th>
                                        <th className="px-4 py-3 text-center w-16">必填</th>
                                        <th className="px-4 py-3 text-left w-24">⚙️ 规则判定</th>
                                        <th className="px-4 py-3 text-left w-24">✨ AI 语义</th>
                                        <th className="px-4 py-3 text-left w-32">💾 采样值</th>
                                        <th className="px-4 py-3 text-left w-24">🛡️ 敏感等级</th>
                                        <th className="px-4 py-3 text-center w-20">⚛️ 融合结果</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {fields
                                        .filter((field: any) => {
                                            if (!fieldSearchTerm.trim()) return true;
                                            return (
                                                (field.fieldName || field.name || "").toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                                                field.type?.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                                                field.comment?.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                                            );
                                        })
                                        .map((field: any, idx: number) => {
                                            const role = getSemanticRole(field.name, field.primaryKey);
                                            const isIdentifier = role === '标识符';
                                            const isHighlighted = highlightedField === field.name;

                                            // Mock sample values
                                            const samples = isIdentifier
                                                ? ['1001', '1002', '1003']
                                                : ((field.fieldName || field.name || "").includes('status')
                                                    ? ['1', '2', '3']
                                                    : field.type === 'datetime'
                                                        ? ['-']
                                                        : ['1001', '1002', '1003']);

                                            return (
                                                <tr
                                                    key={idx}
                                                    data-field-row={field.name}
                                                    className={`hover:bg-slate-50/50 group transition-colors ${isHighlighted ? 'bg-purple-50 ring-1 ring-purple-200' : ''}`}
                                                >
                                                    <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                                                        {field.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {field.comment || '-'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 w-fit ${isIdentifier ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                            }`}>
                                                            {field.type}
                                                            <CheckCircle2 size={10} className="opacity-50" />
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {field.primaryKey && (
                                                            <div className="flex justify-center">
                                                                <Key size={14} className="text-amber-500" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {field.required ? (
                                                            <span className="text-slate-500 font-medium">是</span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="bg-slate-50 text-slate-400 px-2 py-1 rounded text-[10px] border border-slate-100/50">
                                                            待分析
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="bg-slate-50 text-slate-400 px-2 py-1 rounded text-[10px] border border-slate-100/50">
                                                            待分析
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {samples.map((s, i) => (
                                                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] border border-slate-200/50">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-slate-400 italic text-[10px]">待分析</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-slate-300">
                                                        -
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Signals Drawer (V2.4) */}
            {
                isSingleFieldMode && focusField && (
                    <SignalsDrawer
                        open={showSignalsDrawer}
                        onClose={() => setShowSignalsDrawer(false)}
                        fieldProfile={profile.fields?.find(f => f.fieldName === focusField) || { fieldName: focusField } as any}
                        profileSnapshot={profileSnapshots[focusField]}
                    />
                )
            }
        </div >
    );
};
