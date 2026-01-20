import { useState } from 'react';
import {
    Search, AlertCircle, CheckCircle, TrendingUp, FileCheck,
    Upload, Plus, ChevronRight, Settings, MoreHorizontal, X,
    AlertTriangle, Activity, RefreshCw, Link
} from 'lucide-react';
import { mockBusinessGoals } from '../data/mockData';

const BusinessGoalsView = () => {
    const [goals, setGoals] = useState(mockBusinessGoals);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingGoal, setEditingGoal] = useState<any>(null);
    const [viewingGoal, setViewingGoal] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [openDropdown, setOpenDropdown] = useState<any>(null);

    const [formData, setFormData] = useState({
        title: '',
        type: '改革事项',
        priority: 'Medium',
        owner: '',
        description: ''
    });

    // 重置表单
    const resetForm = () => {
        setFormData({ title: '', type: '改革事项', priority: 'Medium', owner: '', description: '' });
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingGoal(null);
    };

    // 创建新事项
    const handleCreate = () => {
        if (!formData.title) return;
        const goalData = {
            id: `G_${Date.now()}`,
            ...formData,
            status: 'planning',
            progress: 0,
            lastUpdate: new Date().toISOString().split('T')[0],
            relatedObjects: []
        };
        setGoals([goalData, ...goals]);
        resetForm();
    };

    // 打开编辑
    const handleEdit = (goal: any) => {
        setEditingGoal(goal);
        setFormData({
            title: goal.title,
            type: goal.type,
            priority: goal.priority,
            owner: goal.owner,
            description: goal.description
        });
        setIsEditMode(true);
        setIsModalOpen(true);
        setOpenDropdown(null);
    };

    // 保存编辑
    const handleSaveEdit = () => {
        if (!formData.title) return;
        setGoals(goals.map(g =>
            g.id === editingGoal.id
                ? { ...g, ...formData, lastUpdate: new Date().toISOString().split('T')[0] }
                : g
        ));
        resetForm();
    };

    // 删除事项
    const handleDelete = (id: string) => {
        setGoals(goals.filter(g => g.id !== id));
        setDeleteConfirm(null);
        setOpenDropdown(null);
    };

    // 过滤逻辑
    const filteredGoals = goals.filter(goal => {
        const matchSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            goal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            goal.owner.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || goal.status === filterStatus;
        const matchPriority = filterPriority === 'all' || goal.priority === filterPriority;
        return matchSearch && matchStatus && matchPriority;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
            {/* 顶部 Header 区 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">业务梳理</h2>
                    <p className="text-slate-500 mt-1">定义企业核心改革事项与政策文件，驱动自顶向下的数据建模。</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        <Upload size={16} /> 导入政策文件
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus size={16} /> 新建梳理事项
                    </button>
                </div>
            </div>

            {/* 统计概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">活跃事项 (Active Items)</p>
                            <h3 className="text-3xl font-bold">{goals.length}</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-100">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-white mr-2">本周新增</span>
                        <span>持续更新中</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">建模覆盖率</p>
                            <h3 className="text-3xl font-bold text-slate-800">65%</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <FileCheck size={20} className="text-emerald-600" />
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">已完成 8 个目标的 L1 对象定义</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">待解决阻点</p>
                            <h3 className="text-3xl font-bold text-slate-800">3</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle size={20} className="text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded border border-red-100">数据缺失</span>
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded border border-orange-100">口径冲突</span>
                    </div>
                </div>
            </div>

            {/* 目标列表 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-800">梳理清单</h3>
                        <span className="text-sm text-slate-500">{filteredGoals.length} / {goals.length} 项</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜索标题、描述或负责人..."
                                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 w-full"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">全部状态</option>
                            <option value="planning">规划中</option>
                            <option value="modeling">建模中</option>
                            <option value="implemented">已实施</option>
                        </select>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">全部优先级</option>
                            <option value="High">高优先级</option>
                            <option value="Medium">中优先级</option>
                            <option value="Low">低优先级</option>
                        </select>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredGoals.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-slate-400 mb-2">
                                <Search size={48} className="mx-auto opacity-50" />
                            </div>
                            <p className="text-slate-500 font-medium">未找到匹配的事项</p>
                            <p className="text-slate-400 text-sm mt-1">尝试调整搜索条件或筛选器</p>
                        </div>
                    ) : (
                        filteredGoals.map((goal) => (
                            <div key={goal.id} className="p-6 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${goal.priority === 'High' ? 'bg-red-500' :
                                            goal.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'
                                            }`}></span>
                                        <h4
                                            onClick={() => setViewingGoal(goal)}
                                            className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer"
                                        >
                                            {goal.title}
                                        </h4>
                                        <span className="px-2 py-0.5 rounded text-xs border border-slate-200 text-slate-500 bg-white">
                                            {goal.type}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === goal.id ? null : goal.id)}
                                            className="text-slate-300 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                        {openDropdown === goal.id && (
                                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px] animate-fade-in">
                                                <button
                                                    onClick={() => setViewingGoal(goal)}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Search size={14} /> 查看详情
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(goal)}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Settings size={14} /> 编辑
                                                </button>
                                                <div className="border-t border-slate-100 my-1"></div>
                                                <button
                                                    onClick={() => setDeleteConfirm(goal)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <X size={14} /> 删除
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-slate-500 text-sm mb-4 max-w-3xl leading-relaxed">
                                    {goal.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        {/* Status Badge */}
                                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${goal.status === 'implemented' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            goal.status === 'modeling' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {goal.status === 'implemented' && <CheckCircle size={12} />}
                                            {goal.status === 'modeling' && <RefreshCw size={12} className="animate-spin-slow" />}
                                            {goal.status === 'planning' && <Activity size={12} />}
                                            <span className="capitalize">{goal.status}</span>
                                        </div>

                                        {/* Owner */}
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="text-slate-400">Owner:</span>
                                            <span>{goal.owner || '待定'}</span>
                                        </div>

                                        {/* Related Objects */}
                                        {goal.relatedObjects.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Link size={14} className="text-slate-400" />
                                                <div className="flex gap-1">
                                                    {goal.relatedObjects.map((obj: string, i: number) => (
                                                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer">
                                                            {obj}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="flex items-center gap-3 min-w-[150px]">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${goal.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-mono font-medium text-slate-600 w-8 text-right">
                                            {goal.progress}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button className="text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1">
                        查看更多历史记录 <ChevronRight size={14} />
                    </button>
                </div>
            </div>


            {/* 新建/编辑 Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800">
                                    {isEditMode ? '编辑业务梳理事项' : '新建业务梳理事项'}
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">事项名称 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="例如：残疾人服务一件事"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                            <option value="改革事项">改革事项</option>
                                            <option value="政策文件">政策文件</option>
                                            <option value="重点任务">重点任务</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                            <option value="High">High (高)</option>
                                            <option value="Medium">Medium (中)</option>
                                            <option value="Low">Low (低)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">牵头部门</label>
                                    <input
                                        type="text"
                                        value={formData.owner}
                                        onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="例如：民政局"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-24 resize-none"
                                        placeholder="请输入事项的详细背景或目标..."
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={isEditMode ? handleSaveEdit : handleCreate}
                                    disabled={!formData.title}
                                    className={`px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm ${!formData.title ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                                >
                                    {isEditMode ? '保存修改' : '创建事项'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 查看详情 Modal */}
            {
                viewingGoal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${viewingGoal.priority === 'High' ? 'bg-red-500' : viewingGoal.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                    {viewingGoal.title}
                                </h3>
                                <button
                                    onClick={() => setViewingGoal(null)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Type</h4>
                                        <p className="text-slate-700 font-medium">{viewingGoal.type}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</h4>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium border ${viewingGoal.status === 'implemented' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : viewingGoal.status === 'modeling' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            <span className="capitalize">{viewingGoal.status}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Owner</h4>
                                        <p className="text-slate-700">{viewingGoal.owner || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Progress</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                                <div className="h-full bg-blue-500" style={{ width: `${viewingGoal.progress}%` }}></div>
                                            </div>
                                            <span className="text-sm text-slate-600">{viewingGoal.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                                    <div className="bg-slate-50 rounded-lg p-4 text-slate-700 leading-relaxed text-sm">
                                        {viewingGoal.description}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setViewingGoal(null)}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm"
                                >
                                    关闭
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 删除确认 Modal */}
            {
                deleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in">
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">确认删除?</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    您确定要删除 "{deleteConfirm.title}" 吗? 此操作无法撤销。
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm text-sm"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default BusinessGoalsView;
