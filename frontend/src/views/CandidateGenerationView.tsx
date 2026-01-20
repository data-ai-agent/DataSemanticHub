import { useState } from 'react';
import { Database, Layout, Activity, ArrowRight, CheckCircle, AlertTriangle, X, ChevronRight, Sparkles, FileText, Code } from 'lucide-react';

interface CandidateGenerationViewProps {
    scanResults: any[];
    setScanResults: (fn: (prev: any[]) => any[]) => void;
    onAddBusinessObject: (bo: any) => void;
}

const CandidateGenerationView = ({ scanResults, setScanResults, onAddBusinessObject }: CandidateGenerationViewProps) => {
    const [confidenceFilter, setConfidenceFilter] = useState(80);
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewingCandidate, setViewingCandidate] = useState<any>(null);

    const objectTypes: Record<string, { label: string; color: string; bgColor: string }> = {
        'entity': { label: '实体对象', color: 'text-blue-600', bgColor: 'bg-blue-100' },
        'event': { label: '事件对象', color: 'text-orange-600', bgColor: 'bg-orange-100' },
        'master': { label: '主数据', color: 'text-purple-600', bgColor: 'bg-purple-100' },
        'transaction': { label: '交易对象', color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
    };

    const detectObjectType = (tableName: string): string => {
        if (tableName.includes('_log') || tableName.includes('_event')) return 'event';
        if (tableName.includes('_master') || tableName.includes('_info')) return 'master';
        if (tableName.includes('_order') || tableName.includes('_trans')) return 'transaction';
        return 'entity';
    };

    const candidates = scanResults.filter(r => r.status !== 'mapped');

    // Group by high confidence for "Auto-Candidate" feel
    const highConfidenceCandidates = candidates.filter(c => (c.confidence || 0) >= confidenceFilter);

    const handleToggleSelect = (tableName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCandidates(prev =>
            prev.includes(tableName) ? prev.filter(c => c !== tableName) : [...prev, tableName]
        );
    };

    const handleSelectAll = () => {
        setSelectedCandidates(prev =>
            prev.length === highConfidenceCandidates.length ? [] : highConfidenceCandidates.map(c => c.table)
        );
    };

    const createBOFromCandidate = (candidate: any) => {
        return {
            id: `BO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: candidate.aiSuggestion?.split(': ')[1] || candidate.table,
            code: `BO_${candidate.table.toUpperCase().replace('T_', '')}`,
            domain: 'Generated',
            owner: 'System',
            status: 'draft',
            description: `AI生成的业务对象，源自 ${candidate.table} (${candidate.comment || '无注释'})`,
            fields: (candidate.fields || []).map((f: any) => ({
                name: f.suggestion || f.name,
                type: 'String',
                required: false,
                description: f.comment || `映射自 ${f.name}`
            }))
        };
    };

    const handleBatchGenerate = () => {
        if (selectedCandidates.length === 0) return;
        setIsProcessing(true);

        setTimeout(() => {
            selectedCandidates.forEach(tableName => {
                const candidate = candidates.find(c => c.table === tableName);
                if (candidate) {
                    onAddBusinessObject(createBOFromCandidate(candidate));
                }
            });

            setScanResults((prev: any[]) => prev.map((item: any) =>
                selectedCandidates.includes(item.table) ? { ...item, status: 'mapped' } : item
            ));
            setSelectedCandidates([]);
            setIsProcessing(false);
        }, 1200);
    };

    const handleSingleGenerate = (candidate: any) => {
        onAddBusinessObject(createBOFromCandidate(candidate));
        setScanResults((prev: any[]) => prev.map((item: any) =>
            item.table === candidate.table ? { ...item, status: 'mapped' } : item
        ));
        setViewingCandidate(null);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Sparkles className="text-purple-500" size={24} />
                        候选对象生成
                    </h2>
                    <p className="text-slate-500 mt-1">AI 自动分析物理资产并推荐业务对象候选，支持批量转换</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="px-3 border-r border-slate-200">
                        <span className="text-xs text-slate-500 block mb-1">置信度过滤</span>
                        <div className="flex items-center gap-2">
                            <input type="range" min="50" max="100" value={confidenceFilter}
                                onChange={e => setConfidenceFilter(Number(e.target.value))}
                                className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <span className="text-sm font-bold text-purple-600 min-w-[3ch]">{confidenceFilter}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                        <button onClick={handleSelectAll}
                            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                            {selectedCandidates.length === highConfidenceCandidates.length && highConfidenceCandidates.length > 0 ? '取消' : '全选'}
                        </button>
                        <button onClick={handleBatchGenerate} disabled={selectedCandidates.length === 0 || isProcessing}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-md shadow-purple-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transition-all">
                            {isProcessing ? <Activity size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isProcessing ? '生成中...' : `生成 (${selectedCandidates.length})`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {highConfidenceCandidates.map(candidate => {
                    const objType = detectObjectType(candidate.table);
                    const typeStyle = objectTypes[objType];
                    const isSelected = selectedCandidates.includes(candidate.table);

                    return (
                        <div key={candidate.table}
                            onClick={() => setViewingCandidate(candidate)}
                            className={`group bg-white rounded-xl border transition-all duration-200 relative overflow-hidden cursor-pointer hover:shadow-md ${isSelected ? 'border-purple-500 ring-1 ring-purple-100' : 'border-slate-200 hover:border-purple-300'}`}>

                            {/* Selection Checkbox (Top Right) */}
                            <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleToggleSelect(candidate.table, e as any)}
                                    className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                            </div>

                            <div className="p-5">
                                {/* Header Info */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeStyle.bgColor} ${typeStyle.color} shadow-sm`}>
                                        <Layout size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="text-xs font-mono text-slate-400 mb-0.5">{candidate.table}</div>
                                        <div className="font-bold text-slate-800 truncate text-lg">{candidate.aiSuggestion?.split(': ')[1] || candidate.table}</div>
                                    </div>
                                </div>

                                {/* Tags & Confidence */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeStyle.bgColor} ${typeStyle.color}`}>{typeStyle.label}</span>
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                                        <Database size={10} /> {candidate.sourceType || 'MySQL'}
                                    </span>
                                </div>

                                {/* AI Reasoning Preview */}
                                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 mb-4 border border-slate-100">
                                    <div className="flex items-center gap-1.5 text-purple-600 font-medium mb-1">
                                        <Sparkles size={10} />
                                        AI 推荐理由
                                    </div>
                                    <p className="line-clamp-2 opacity-80">
                                        根据表名及字段特征，识别为{typeStyle.label}。匹配度高，建议映射为"{candidate.aiSuggestion?.split(': ')[1] || candidate.table}"。
                                    </p>
                                </div>

                                {/* Footer Stats */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="text-xs text-slate-400">
                                        包含 {candidate.fields?.length || 0} 个字段
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <Activity size={12} />
                                        {candidate.confidence}% 置信度
                                    </div>
                                </div>
                            </div>

                            {/* Hover Action Strip */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    );
                })}
            </div>

            {/* Detailed Modal */}
            {viewingCandidate && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Sparkles className="text-purple-500" size={18} />
                                    候选详情：{viewingCandidate.aiSuggestion?.split(': ')[1] || viewingCandidate.table}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    源表: <span className="font-mono text-slate-600">{viewingCandidate.table}</span>
                                    <span className="mx-2">|</span>
                                    注释: {viewingCandidate.comment || '无'}
                                </p>
                            </div>
                            <button onClick={() => setViewingCandidate(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left: Source Info */}
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <Database size={14} /> 源数据特征
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1 border-b border-slate-50">
                                                <span className="text-slate-500">类型</span>
                                                <span className="font-medium">{viewingCandidate.sourceType || 'MySQL'}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-slate-50">
                                                <span className="text-slate-500">字段数</span>
                                                <span className="font-medium">{viewingCandidate.fields?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                                <span className="text-slate-500">数据量</span>
                                                <span className="font-medium font-mono text-slate-600">--</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                        <h4 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                                            <Activity size={14} /> AI 分析报告
                                        </h4>
                                        <p className="text-xs text-purple-700 leading-relaxed mb-3">
                                            该表结构符合通用"{detectObjectType(viewingCandidate.table)}"定义。
                                            主键与核心字段完整，建议生成标准业务对象。
                                        </p>
                                        <div className="w-full bg-purple-200 rounded-full h-1.5 mb-1">
                                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${viewingCandidate.confidence || 80}%` }}></div>
                                        </div>
                                        <div className="text-right text-xs font-bold text-purple-600">{viewingCandidate.confidence}% 置信度</div>
                                    </div>
                                </div>

                                {/* Right: Mapping Preview */}
                                <div className="md:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Code size={14} /> 字段映射预览
                                        </h4>
                                        <span className="text-xs text-slate-500">将生成 BO 属性</span>
                                    </div>
                                    <div className="flex-1 overflow-auto max-h-[400px]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 font-medium text-xs">源字段 (Physical)</th>
                                                    <th className="px-4 py-2 w-8"></th>
                                                    <th className="px-4 py-2 font-medium text-xs">目标属性 (Logical)</th>
                                                    <th className="px-4 py-2 font-medium text-xs">类型</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(viewingCandidate.fields || []).map((field: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50 group">
                                                        <td className="px-4 py-2.5">
                                                            <div className="font-mono text-xs text-slate-600">{field.name}</div>
                                                            <div className="text-[10px] text-slate-400">{field.comment || '-'}</div>
                                                        </td>
                                                        <td className="px-4 py-2 text-center text-slate-300">
                                                            <ArrowRight size={14} />
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="font-medium text-slate-700 flex items-center gap-1.5">
                                                                {field.suggestion || field.name}
                                                                <FileText size={10} className="text-slate-400 opacity-0 group-hover:opacity-100" />
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">自动转换</div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs font-mono text-slate-500">
                                                            String
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button onClick={() => setViewingCandidate(null)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                关闭
                            </button>
                            <button onClick={() => handleSingleGenerate(viewingCandidate)}
                                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-colors flex items-center gap-2">
                                <CheckCircle size={16} />
                                确认生成此对象
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {highConfidenceCandidates.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Database size={40} className="opacity-20" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-600 mb-1">暂无高置信度候选</h3>
                    <p className="text-sm">当前阈值 ({confidenceFilter}%) 下没有找到匹配的候选对象</p>
                    <button onClick={() => setConfidenceFilter(60)} className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                        尝试降低阈值
                    </button>
                </div>
            )}
        </div>
    );
};

export default CandidateGenerationView;
