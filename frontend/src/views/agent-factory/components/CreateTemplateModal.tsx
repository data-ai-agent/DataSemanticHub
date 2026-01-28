import { useState } from 'react';
import {
    X,
    Database,
    Brain,
    Network,
    FileText,
    Bot,
    ArrowRight,
    Check
} from 'lucide-react';

interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (templateData: any, shouldRedirect: boolean) => void;
}

type CapabilityType = '问数(QNA)' | '语义理解(SEM)' | '知识网络构建(KG)' | '报告生成' | '智能洞察';

const CAPABILITIES: { type: CapabilityType; title: string; desc: string; icon: any; color: string; bgColor: string }[] = [
    {
        type: '问数(QNA)',
        title: '问数(QNA)',
        desc: '连接数据库或数仓，通过自然语言查询数据。',
        icon: Database,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
    },
    {
        type: '语义理解(SEM)',
        title: '语义理解(SEM)',
        desc: '理解非结构化文本，提取实体与关系。',
        icon: Brain,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
    },
    {
        type: '知识网络构建(KG)',
        title: '知识网络构建(KG)',
        desc: '构建或扩充企业知识图谱。',
        icon: Network,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
    },
    {
        type: '报告生成',
        title: '报告生成',
        desc: '基于数据生成分析报告或摘要。',
        icon: FileText,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
    },
    {
        type: '智能洞察',
        title: '智能洞察',
        desc: '通用对话助手，支持多轮交互。',
        icon: Bot,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50'
    }
];

const CreateTemplateModal = ({ isOpen, onClose, onCreate }: CreateTemplateModalProps) => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        capability: '问数(QNA)' as CapabilityType,
        skeleton: '',
        name: '',
        description: '',
        domain: '',
        tags: ''
    });

    if (!isOpen) return null;

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handlePrev = () => {
        setStep(prev => Math.max(prev - 1, 0));
    };

    const renderStep1_Capability = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAPABILITIES.map((cap) => (
                <button
                    key={cap.type}
                    onClick={() => setFormData(prev => ({ ...prev, capability: cap.type }))}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all hover:bg-slate-50 flex items-start gap-4 ${formData.capability === cap.type
                        ? 'border-indigo-500 bg-indigo-50/10 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-slate-100 hover:border-slate-200'
                        } ${cap.type === '智能洞察' ? 'md:col-span-2' : ''}`} // Make the last item span full width if needed to match image, or just keeping the grid
                >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${cap.bgColor} ${cap.color}`}>
                        <cap.icon size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className={`font-bold text-sm ${formData.capability === cap.type ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {cap.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {cap.desc}
                        </div>
                    </div>
                    {formData.capability === cap.type && (
                        <div className="absolute top-4 right-4 text-indigo-600">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                <Check size={12} className="text-white" strokeWidth={3} />
                            </div>
                        </div>
                    )}
                </button>
            ))}
        </div>
    );

    const renderStep2_Skeleton = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">选择基础骨架</h3>
            <p className="text-sm text-slate-500">骨架包含默认的 Prompt、Schema 与流程配置，可加速开发。</p>
            <div className="grid grid-cols-1 gap-3">
                {['标准问数骨架', '简单查询骨架', '复杂推理骨架'].map(item => (
                    <button
                        key={item}
                        className={`rounded-lg border p-4 text-left transition-colors ${formData.skeleton === item
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        onClick={() => setFormData(prev => ({ ...prev, skeleton: item }))}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{item}</span>
                            {formData.skeleton === item && <Check size={16} />}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep3_Info = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">填写基本信息</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">模板名称</label>
                    <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="例如：供应链问数助手"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">模板简介</label>
                    <textarea
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        rows={3}
                        placeholder="描述该模板的用途与输出"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">业务域</label>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="例如：供应链"
                            value={formData.domain}
                            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">标签</label>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="用逗号分隔多个标签"
                            value={formData.tags}
                            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">新建智能体模板</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar (Optional, simpler than numbered steps for this modern look) */}
                <div className="w-full h-1 bg-slate-50">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${((step + 1) / 3) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {step === 0 && renderStep1_Capability()}
                    {step === 1 && renderStep2_Skeleton()}
                    {step === 2 && renderStep3_Info()}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                    {step > 0 ? (
                        <button
                            onClick={handlePrev}
                            className="text-slate-500 hover:text-slate-800 text-sm font-medium px-4 py-2"
                        >
                            上一步
                        </button>
                    ) : (
                        <div /> /* Spacer */
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                        >
                            取消
                        </button>
                        {step < 2 ? (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                            >
                                下一步
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onCreate(formData, false)}
                                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    disabled={!formData.name}
                                >
                                    创建并返回
                                </button>
                                <button
                                    onClick={() => onCreate(formData, true)}
                                    className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                                    disabled={!formData.name}
                                >
                                    创建并设计
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTemplateModal;
