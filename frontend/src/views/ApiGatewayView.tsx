import { useState } from 'react';
import { Code, Layout, CheckCircle, Copy, Play, Settings, Plus, ChevronRight } from 'lucide-react';

interface ApiGatewayViewProps {
    businessObjects: any[];
}

const ApiGatewayView = ({ businessObjects }: ApiGatewayViewProps) => {
    const [selectedBO, setSelectedBO] = useState<string | null>(null);
    const [generatedApis, setGeneratedApis] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateApi = () => {
        if (!selectedBO) return;
        setIsGenerating(true);

        const bo = businessObjects.find(b => b.id === selectedBO);
        if (!bo) return;

        setTimeout(() => {
            const newApiSet = [
                {
                    id: `API_${Date.now()}_1`,
                    name: `Get ${bo.name}`,
                    method: 'GET',
                    path: `/api/v1/${bo.code.toLowerCase()}/{id}`,
                    boId: bo.id,
                    boName: bo.name,
                    status: 'draft',
                    description: `获取单个${bo.name}的详细信息`
                },
                {
                    id: `API_${Date.now()}_2`,
                    name: `List ${bo.name}`,
                    method: 'GET',
                    path: `/api/v1/${bo.code.toLowerCase()}`,
                    boId: bo.id,
                    boName: bo.name,
                    status: 'draft',
                    description: `分页获取${bo.name}列表`
                },
                {
                    id: `API_${Date.now()}_3`,
                    name: `Create ${bo.name}`,
                    method: 'POST',
                    path: `/api/v1/${bo.code.toLowerCase()}`,
                    boId: bo.id,
                    boName: bo.name,
                    status: 'draft',
                    description: `创建新的${bo.name}记录`
                },
                {
                    id: `API_${Date.now()}_4`,
                    name: `Update ${bo.name}`,
                    method: 'PUT',
                    path: `/api/v1/${bo.code.toLowerCase()}/{id}`,
                    boId: bo.id,
                    boName: bo.name,
                    status: 'draft',
                    description: `更新${bo.name}信息`
                },
                {
                    id: `API_${Date.now()}_5`,
                    name: `Delete ${bo.name}`,
                    method: 'DELETE',
                    path: `/api/v1/${bo.code.toLowerCase()}/{id}`,
                    boId: bo.id,
                    boName: bo.name,
                    status: 'draft',
                    description: `删除${bo.name}记录`
                }
            ];
            setGeneratedApis(prev => [...prev, ...newApiSet]);
            setIsGenerating(false);
        }, 1000);
    };

    const handlePublishApi = (apiId: string) => {
        setGeneratedApis(prev => prev.map(api =>
            api.id === apiId ? { ...api, status: 'published' } : api
        ));
    };

    const methodColors: Record<string, string> = {
        GET: 'bg-emerald-100 text-emerald-700',
        POST: 'bg-blue-100 text-blue-700',
        PUT: 'bg-orange-100 text-orange-700',
        DELETE: 'bg-red-100 text-red-700'
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Code className="text-purple-500" size={24} /> API 网关
                    </h2>
                    <p className="text-slate-500 mt-1">从业务对象自动生成 RESTful API</p>
                </div>
            </div>

            {/* Generator */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus size={16} /> 生成 API
                </h3>
                <div className="flex gap-4">
                    <select value={selectedBO || ''} onChange={e => setSelectedBO(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                        <option value="">选择业务对象...</option>
                        {businessObjects.map(bo => (
                            <option key={bo.id} value={bo.id}>{bo.name} ({bo.code})</option>
                        ))}
                    </select>
                    <button onClick={handleGenerateApi} disabled={!selectedBO || isGenerating}
                        className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
                        {isGenerating ? (
                            <>生成中...</>
                        ) : (
                            <><Code size={16} /> 生成 CRUD API</>
                        )}
                    </button>
                </div>
            </div>

            {/* API List */}
            {generatedApis.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800">已生成 API ({generatedApis.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {generatedApis.map(api => (
                            <div key={api.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[api.method]}`}>
                                    {api.method}
                                </span>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-800">{api.name}</div>
                                    <div className="font-mono text-xs text-slate-500">{api.path}</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Layout size={12} />
                                    {api.boName}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${api.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {api.status}
                                </span>
                                {api.status === 'draft' && (
                                    <button onClick={() => handlePublishApi(api.id)}
                                        className="px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded border border-purple-200">
                                        发布
                                    </button>
                                )}
                                <button className="p-1 text-slate-400 hover:text-slate-600">
                                    <Copy size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {generatedApis.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                    <Code size={48} className="mx-auto mb-4 opacity-20" />
                    <p>暂无生成的 API</p>
                    <p className="text-xs mt-1">选择业务对象并点击生成按钮</p>
                </div>
            )}
        </div>
    );
};

export default ApiGatewayView;
