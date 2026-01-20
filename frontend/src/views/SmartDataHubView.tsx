import { useState } from 'react';
import { Search, Database, Layout, FileText, Send, MessageCircle, ChevronRight, CheckCircle, Plus } from 'lucide-react';
import { mockCatalogItems, mockBusinessObjects } from '../data/mockData';

interface SmartDataHubViewProps {
    businessObjects?: any[];
}

const SmartDataHubView = ({ businessObjects = [] }: SmartDataHubViewProps) => {
    const [activeTab, setActiveTab] = useState<'find' | 'ask'>('find');
    const [searchTerm, setSearchTerm] = useState('');
    const [assetTypeFilter, setAssetTypeFilter] = useState('all');
    const [selectedAssets, setSelectedAssets] = useState<any[]>([]);

    // Ask Data state
    const [messages, setMessages] = useState<any[]>([
        { type: 'system', content: '欢迎使用智能问数。您可以用自然语言询问任何数据相关问题。' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Mock catalog data
    // Merge mock items with dynamic published business objects
    const publishedBOs = businessObjects
        .filter(bo => bo.status === 'published')
        .map(bo => ({
            id: bo.id,
            type: 'bo', // Use 'bo' type to match existing logic
            name: bo.name,
            code: bo.code,
            description: bo.description,
            domain: bo.domain,
            status: bo.status,
            tags: ['业务对象', bo.domain], // Add some default tags
            fieldCount: bo.fields?.length || 0,
            mappingCount: 0, // Placeholder
            lastUpdated: new Date().toISOString().split('T')[0], // Today
            createdAt: new Date().toISOString().split('T')[0]
        }));

    // Filter out mock BOs if we have dynamic ones to avoid duplication or confusion, 
    // OR just append. For this feature, appending is safer to see the new ones.
    // Let's prepend the dynamic ones so they show up first.
    const catalogAssets = [...publishedBOs, ...(mockCatalogItems || [])];

    const filteredAssets = catalogAssets.filter(asset => {
        const matchesSearch = asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = assetTypeFilter === 'all' || asset.type === assetTypeFilter;
        return matchesSearch && matchesType;
    });

    const handleSend = () => {
        if (!inputValue.trim()) return;

        setMessages(prev => [...prev, { type: 'user', content: inputValue }]);
        setIsLoading(true);
        setInputValue('');

        setTimeout(() => {
            const mockResponses: Record<string, any> = {
                '订单': { type: 'assistant', content: '找到 3 个与订单相关的业务对象:\n\n1. **订单主表** (t_order_main)\n2. **订单明细** (t_order_item)\n3. **订单状态** (t_order_status)\n\n您想了解哪个对象的详细信息？' },
                '用户': { type: 'assistant', content: '找到用户相关资产:\n\n- **用户画像表** (t_user_profile) - 15,420 条记录\n- **用户行为日志** (t_user_log)\n\n这些数据可用于用户分析场景。' },
            };

            const response = Object.entries(mockResponses).find(([key]) =>
                inputValue.toLowerCase().includes(key.toLowerCase())
            )?.[1] || { type: 'assistant', content: '我理解您在查询关于"' + inputValue + '"的信息。请提供更多上下文，我可以帮助您找到相关的数据资产和业务对象。' };

            setMessages(prev => [...prev, response]);
            setIsLoading(false);
        }, 1000);
    };

    const toggleAssetSelect = (asset: any) => {
        setSelectedAssets(prev =>
            prev.find(a => a.id === asset.id)
                ? prev.filter(a => a.id !== asset.id)
                : [...prev, asset]
        );
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Tab Header */}
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">智能数据中心</h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setActiveTab('find')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'find' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
                        <Search size={14} className="inline mr-1" /> 找数
                    </button>
                    <button onClick={() => setActiveTab('ask')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ask' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
                        <MessageCircle size={14} className="inline mr-1" /> 问数
                    </button>
                </div>
            </div>

            {activeTab === 'find' ? (
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Asset List */}
                    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="搜索数据资产..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select value={assetTypeFilter} onChange={e => setAssetTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                <option value="all">所有类型</option>
                                <option value="table">物理表</option>
                                <option value="bo">业务对象</option>
                                <option value="api">API</option>
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredAssets.map(asset => (
                                    <div key={asset.id} onClick={() => toggleAssetSelect(asset)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAssets.find(a => a.id === asset.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${asset.type === 'bo' ? 'bg-blue-100 text-blue-600' : asset.type === 'table' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                                                {asset.type === 'bo' ? <Layout size={16} /> : asset.type === 'table' ? <Database size={16} /> : <FileText size={16} />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{asset.name}</div>
                                                <div className="text-xs text-slate-500">{asset.type}</div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-2">{asset.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Selected Assets Panel */}
                    {selectedAssets.length > 0 && (
                        <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <h3 className="font-bold text-slate-800 mb-4">已选资产 ({selectedAssets.length})</h3>
                            <div className="space-y-2">
                                {selectedAssets.map(asset => (
                                    <div key={asset.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                                        <CheckCircle size={14} className="text-blue-500" />
                                        <span className="text-sm flex-1 truncate">{asset.name}</span>
                                        <button onClick={() => toggleAssetSelect(asset)} className="text-slate-400 hover:text-red-500">×</button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setActiveTab('ask')}
                                className="w-full mt-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                                使用选中资产问数
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-4 rounded-xl ${msg.type === 'user' ? 'bg-blue-600 text-white' : msg.type === 'system' ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-800 border border-slate-200'}`}>
                                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <div className="flex gap-2">
                            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                                placeholder="输入您的问题，例如：帮我找下订单相关的数据表..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={handleSend} disabled={!inputValue.trim() || isLoading}
                                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartDataHubView;
