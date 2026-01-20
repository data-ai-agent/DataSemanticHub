import { useState } from 'react';
import { AlertTriangle, CheckCircle, X, Shield, Search } from 'lucide-react';
import { mockConflicts } from '../data/mockData';

const ConflictDetectionView = () => {
    const [conflicts, setConflicts] = useState(mockConflicts);
    const [selectedConflict, setSelectedConflict] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const handleResolve = (id: string) => {
        setConflicts(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
        setSelectedConflict(null);
    };

    const handleIgnore = (id: string) => {
        setConflicts(prev => prev.map(c => c.id === id ? { ...c, status: 'ignored' } : c));
    };

    const filteredConflicts = conflicts.filter(c => {
        const matchesSearch = c.boField?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: conflicts.length,
        pending: conflicts.filter(c => c.status === 'pending').length,
        resolved: conflicts.filter(c => c.status === 'resolved').length,
        ignored: conflicts.filter(c => c.status === 'ignored').length
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Shield className="text-amber-500" size={24} /> 冲突检测与治理
                    </h2>
                    <p className="text-slate-500 mt-1">检测并解决业务对象定义冲突</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: '总计', value: stats.total, color: 'bg-slate-100 text-slate-700' },
                    { label: '待处理', value: stats.pending, color: 'bg-amber-100 text-amber-700' },
                    { label: '已解决', value: stats.resolved, color: 'bg-emerald-100 text-emerald-700' },
                    { label: '已忽略', value: stats.ignored, color: 'bg-slate-100 text-slate-500' }
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-medium">{stat.label}</div>
                        <div className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="搜索冲突字段或描述..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="all">所有状态</option>
                    <option value="pending">待处理</option>
                    <option value="resolved">已解决</option>
                    <option value="ignored">已忽略</option>
                </select>
            </div>

            {/* Conflict List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3 text-left">冲突类型</th>
                            <th className="px-6 py-3 text-left">字段 / 对象</th>
                            <th className="px-6 py-3 text-left">描述</th>
                            <th className="px-6 py-3 text-left">严重程度</th>
                            <th className="px-6 py-3 text-left">状态</th>
                            <th className="px-6 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredConflicts.map(conflict => (
                            <tr key={conflict.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-2">
                                        <AlertTriangle size={14} className="text-amber-500" />
                                        {conflict.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">{conflict.boField}</td>
                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{conflict.description}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${conflict.severity === 'high' ? 'bg-red-100 text-red-700' : conflict.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {conflict.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${conflict.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : conflict.status === 'ignored' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                                        {conflict.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {conflict.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleResolve(conflict.id)}
                                                className="px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded">
                                                <CheckCircle size={14} />
                                            </button>
                                            <button onClick={() => handleIgnore(conflict.id)}
                                                className="px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-50 rounded">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredConflicts.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <Shield size={48} className="mx-auto mb-4 opacity-20" />
                        <p>没有匹配的冲突记录</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConflictDetectionView;
