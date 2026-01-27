import { Play, SplitSquareVertical, Zap } from 'lucide-react';
import { agentFactoryMock } from '../../data/mockAgentFactory';
import PageHeader from './components/PageHeader';

const TestEvaluationView = () => {
    const { testEvaluation } = agentFactoryMock;

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="用例与评测"
                description="回归、对比与质量门禁配置。"
                actions={(
                    <div className="flex items-center gap-2">
                        <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
                            <option>评测版本：v2.3.1</option>
                            <option>评测版本：Draft</option>
                        </select>
                        <select className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
                            <option>基线版本：v2.2.8</option>
                        </select>
                        <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                            <Play size={14} /> 单用例
                        </button>
                        <button className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm flex items-center gap-2">
                            <Zap size={14} /> 全量
                        </button>
                        <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex items-center gap-2">
                            <SplitSquareVertical size={14} /> 对比
                        </button>
                    </div>
                )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">用例列表</h3>
                    <div className="mt-4 space-y-3">
                        {testEvaluation.cases.map(item => (
                            <button key={item.id} className="w-full text-left rounded-lg border border-slate-200 p-3 hover:border-slate-300">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-slate-800">{item.name}</span>
                                    <span className={`text-xs ${item.status === '通过' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.status}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{item.input}</div>
                            </button>
                        ))}
                    </div>
                    <button className="mt-4 w-full px-3 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                        + 新建用例
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">用例编辑器</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600">
                            输入变量（JSON）示例：{`{"metric":"库存周转率","period":"30d"}`}
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-400">断言条件</div>
                            <ul className="text-sm text-slate-600 mt-2 space-y-1">
                                <li>schema 必须通过</li>
                                <li>关键字段：entities / evidence</li>
                                <li>置信度阈值 ≥ 0.75</li>
                            </ul>
                        </div>
                        <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm">保存用例</button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800">评测报告</h3>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(testEvaluation.report).map(([label, value]) => (
                                <div key={label} className="rounded-lg border border-slate-200 p-3">
                                    <div className="text-xs text-slate-400">{label}</div>
                                    <div className="text-slate-800 font-semibold mt-1">{value}</div>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
                            失败样本：case_002（跨域归因解释）→ 可打开 Trace 查看
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800">质量门禁配置</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    {['成功率 ≥ 97%', '超时率 ≤ 1%', 'Schema 通过率 ≥ 95%', '成本 ≤ ￥0.03/次'].map(rule => (
                        <div key={rule} className="rounded-lg border border-slate-200 p-3">
                            <div className="text-slate-700">{rule}</div>
                            <div className="text-xs text-emerald-600 mt-1">当前通过</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestEvaluationView;
