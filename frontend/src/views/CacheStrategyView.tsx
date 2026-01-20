import { useState } from 'react';
import { RefreshCw, Settings, Activity } from 'lucide-react';

const CacheStrategyView = () => {
    const [policies] = useState([
        { id: 'CP_001', name: '高频代码表缓存', target: 'Dictionaries', type: 'Local', ttl: '24h', eviction: 'LFU', status: 'Active' },
        { id: 'CP_002', name: '新生儿实时查询', target: 'Newborn (Single)', type: 'Redis', ttl: '5m', eviction: 'LRU', status: 'Active' },
        { id: 'CP_003', name: '统计报表预计算', target: 'Reports', type: 'Redis Cluster', ttl: '1h', eviction: 'FIFO', status: 'Inactive' },
    ]);

    const [cacheKeys] = useState([
        { key: 'bo:newborn:nb_123456', size: '2.4KB', created: '10:00:05', expires: '10:05:05', hits: 145 },
        { key: 'dict:hosp_level', size: '15KB', created: '08:00:00', expires: 'Tomorrow', hits: 5200 },
        { key: 'api:query:birth_cert:list', size: '450KB', created: '10:02:30', expires: '10:03:30', hits: 12 },
    ]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <RefreshCw className="text-purple-500" size={24} />
                    缓存策略配置
                </h2>
                <p className="text-slate-500 mt-1">配置语义层数据的缓存加速策略</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Policies */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Settings size={18} /> 策略定义
                    </h3>
                    {policies.map(cp => (
                        <div key={cp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="font-bold text-slate-700">{cp.name}</div>
                                <div className={`w-2 h-2 rounded-full ${cp.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <div>Target: <span className="text-slate-700">{cp.target}</span></div>
                                <div>Type: <span className="text-slate-700">{cp.type}</span></div>
                                <div>TTL: <span className="text-slate-700">{cp.ttl}</span></div>
                                <div>Eviction: <span className="text-slate-700">{cp.eviction}</span></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cache Keys */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Activity size={18} /> 热门缓存 Key
                    </h3>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-2">Key Pattern</th>
                                    <th className="px-4 py-2">Size</th>
                                    <th className="px-4 py-2">Hits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cacheKeys.map((k, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2 font-mono text-slate-600 truncate max-w-[150px]" title={k.key}>{k.key}</td>
                                        <td className="px-4 py-2 text-slate-500">{k.size}</td>
                                        <td className="px-4 py-2 text-slate-700 font-medium">{k.hits}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CacheStrategyView;
