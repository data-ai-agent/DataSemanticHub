import { useState } from 'react';
import { LayoutTemplate, Sparkles, Cpu, Settings } from 'lucide-react';
import TemplateLibraryView from './TemplateLibraryView';
import AgentTemplateDesignerView from './AgentTemplateDesignerView';
import { AgentType, AgentStatus, Template } from './types';

// Mock templates data matching the types
const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tpl_001',
    name: '供应链问数助手',
    description: '结合语义版本与指标库，支持跨域问数与归因解释。',
    type: AgentType.QNA,
    status: AgentStatus.STABLE,
    version: 'v1.0.0',
    updatedAt: '2024-01-20',
    owner: 'Alice',
    domain: '供应链',
    tags: ['辅助决策', '智能洞察'],
    health: 'HEALTHY',
    deployment: { prodStable: 'v1.0.0' },
    governance: { gateStatus: 'PASS', runtimePack: 'SC_QNA_Pack_v1', semanticVersion: 'Retail_v4' },
    stats: {
      calls: 298000,
      successRate: 98.4,
      p95: 2600,
      cost: 4.64,
      trends: { calls: 12, successRate: 0.1, p95: -5, cost: -2 }
    }
  },
  {
    id: 'tpl_002',
    name: '运营日报生成器',
    description: '自动生成日/周/月经营报告与异常说明。',
    type: AgentType.REPORT,
    status: AgentStatus.CANARY,
    version: 'v1.0.0',
    updatedAt: '2024-01-20',
    owner: 'Bob',
    domain: '运营',
    tags: ['辅助决策', '智能洞察'],
    health: 'WARNING',
    deployment: { prodStable: 'v0.9.0', prodCanary: 'v1.0.0', canaryPercent: 10 },
    governance: { gateStatus: 'PASS', runtimePack: 'Finance_Report_Pack', semanticVersion: 'Fin_GL_v2' },
    stats: {
      calls: 412000,
      successRate: 99.1,
      p95: 1900,
      cost: 0.26,
      trends: { calls: 5, successRate: -0.2, p95: 15, cost: 20 }
    }
  },
  {
    id: 'tpl_003',
    name: '合同风险审查',
    description: '识别合同条款风险点与合规建议。',
    type: AgentType.SEM,
    status: AgentStatus.STABLE,
    version: 'v1.0.0',
    updatedAt: '2024-01-20',
    owner: 'Charlie',
    domain: '法务',
    tags: ['辅助决策', '智能洞察'],
    health: 'HEALTHY',
    deployment: { prodStable: 'v1.0.0' },
    governance: { gateStatus: 'PASS', runtimePack: 'KG_Builder_Pack', semanticVersion: 'Knowledge_v2' },
    stats: {
      calls: 184000,
      successRate: 97.9,
      p95: 3100,
      cost: 1.06,
      trends: { calls: -2, successRate: 0.5, p95: -10, cost: -5 }
    }
  },
  {
    id: 'tpl_004',
    name: '政府事项解读',
    description: '政务事项材料解读与流程指引。',
    type: AgentType.SEM,
    status: AgentStatus.DRAFT,
    version: 'v1.0.0',
    updatedAt: '2024-01-20',
    owner: 'Dave',
    domain: '政务',
    tags: ['辅助决策', '智能洞察'],
    health: 'HEALTHY',
    deployment: {},
    governance: { gateStatus: 'PASS' },
    stats: {
      calls: 38000,
      successRate: 96.8,
      p95: 3900,
      cost: 2.77,
      trends: { calls: 8, successRate: 1.2, p95: 2, cost: 0 }
    }
  },
  {
    id: 'tpl_005',
    name: '供应商画像助手',
    description: '结合知识网络输出供应商风险画像与评分。',
    type: AgentType.KG,
    status: AgentStatus.DEPRECATED,
    version: 'v1.0.0',
    updatedAt: '2024-01-20',
    owner: 'Eve',
    domain: '采购',
    tags: ['辅助决策', '智能洞察'],
    health: 'HEALTHY',
    deployment: { prodStable: 'v1.0.0' },
    governance: { gateStatus: 'PASS' },
    stats: {
      calls: 12000,
      successRate: 94.2,
      p95: 4700,
      cost: 2.45,
      trends: { calls: -50, successRate: -2, p95: 5, cost: 0 }
    }
  },
  {
    id: 'tpl_006',
    name: '销售预测洞察',
    description: '通过多源数据结构预测并解释。',
    type: AgentType.ASSISTANT,
    status: AgentStatus.CANARY,
    version: 'v1.0.0',
    updatedAt: '2024-01-20',
    owner: 'Frank',
    domain: '销售',
    tags: ['辅助决策', '智能洞察'],
    health: 'HEALTHY',
    deployment: { prodStable: 'v0.8.0', prodCanary: 'v1.0.0', canaryPercent: 50 },
    governance: { gateStatus: 'PASS' },
    stats: {
      calls: 64000,
      successRate: 95.2,
      p95: 5200,
      cost: 0.50,
      trends: { calls: 15, successRate: 0.8, p95: -2, cost: 5 }
    }
  }
];

type SubView = 'library' | 'designer' | 'settings';

interface TemplateLibraryItem {
    id: string;
    name: string;
    description: string;
    capability: string;
    domain: string;
    status: string;
    semanticVersion: string;
    calls: string;
    successRate: string;
    p95: string;
    cost?: string;
    category?: string;
    tags?: string | string[];
    skeleton?: string;
    prodStableVersion?: string;
    prodCanaryVersion?: string;
    prodCanaryPercent?: number;
    releaseGateStatus?: 'Pass' | 'Fail' | 'Unrun';
    healthStatus?: 'Normal' | 'Warning' | 'Error';
    owner?: string;
    updatedAt?: string;
    callsTrend?: 'up' | 'down';
    successRateTrend?: 'up' | 'down';
    p95Trend?: 'up' | 'down';
    costTrend?: 'up' | 'down';
    scenario?: string[];
}

// Convert Template to TemplateLibraryItem format
const convertToLibraryItem = (template: Template): TemplateLibraryItem => ({
  id: template.id,
  name: template.name,
  description: template.description,
  capability: template.type === AgentType.QNA ? '问数 (QNA)' :
             template.type === AgentType.SEM ? '语义理解 (SEM)' :
             template.type === AgentType.KG ? '知识网络构建 (KG)' :
             template.type === AgentType.REPORT ? '报告生成' : '智能洞察',
  domain: template.domain || '未分类',
  status: template.status,
  semanticVersion: template.version,
  calls: template.stats.calls >= 1000 ? `${(template.stats.calls / 1000).toFixed(0)}k` : `${template.stats.calls}`,
  successRate: `${template.stats.successRate}%`,
  p95: `${template.stats.p95 / 1000}s`,
  cost: `$${template.stats.cost}`,
  category: template.scenario?.[0] || '分析助手',
  tags: template.tags,
  skeleton: '问数骨架',
  prodStableVersion: template.deployment.prodStable,
  prodCanaryVersion: template.deployment.prodCanary,
  prodCanaryPercent: template.deployment.canaryPercent,
  releaseGateStatus: template.governance.gateStatus === 'PASS' ? 'Pass' :
                  template.governance.gateStatus === 'FAIL' ? 'Fail' : 'Unrun',
  healthStatus: template.health === 'HEALTHY' ? 'Normal' :
               template.health === 'WARNING' ? 'Warning' : 'Error',
  owner: template.owner,
  updatedAt: template.updatedAt,
  callsTrend: template.stats.trends.calls >= 0 ? 'up' : 'down',
  successRateTrend: template.stats.trends.successRate >= 0 ? 'up' : 'down',
  p95Trend: template.stats.trends.p95 >= 0 ? 'up' : 'down',
  costTrend: template.stats.trends.cost >= 0 ? 'up' : 'down',
  scenario: template.tags
});

const ModelFactoryView: React.FC = () => {
    const [activeSubView, setActiveSubView] = useState<SubView>('library');
    const [templates, setTemplates] = useState<TemplateLibraryItem[]>(
      MOCK_TEMPLATES.map(convertToLibraryItem)
    );
    const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
    const [viewSource, setViewSource] = useState<'create' | 'library'>('library');

    const handleNavigateWithParams = (module: string, params: any) => {
        if (module === 'agent_designer') {
            setSelectedTemplate(params.template);
            setViewSource(params.source || 'library');
            setActiveSubView('designer');
        }
    };

    const handleSaveDraft = (template: any) => {
        const newTemplate = {
            ...template,
            id: template.id || `tpl_${Date.now()}`,
            capability: template.capability || '问数 (QNA)',
            domain: template.domain || '未分类',
            status: 'Draft',
            semanticVersion: template.semanticVersion || 'v0.1.0',
            calls: '—',
            successRate: '—',
            p95: '—',
            cost: '$0.00',
            category: template.category || '分析助手',
            tags: template.tags || ['新模板'],
            skeleton: template.skeleton || '问数骨架',
            prodStableVersion: '-',
            healthStatus: 'Normal',
            releaseGateStatus: 'Unrun',
            owner: template.owner || 'Admin',
            updatedAt: new Date().toISOString().split('T')[0]
        };
        setTemplates(prev => [newTemplate, ...prev]);
        setActiveSubView('library');
    };

    const renderContent = () => {
        switch (activeSubView) {
            case 'library':
                return (
                    <TemplateLibraryView
                        setActiveModule={(module) => {
                            if (module === 'agent_designer') {
                                setActiveSubView('designer');
                            }
                        }}
                        onNavigateWithParams={handleNavigateWithParams}
                        templates={templates}
                        setTemplates={setTemplates}
                    />
                );
            case 'designer':
                return (
                    <AgentTemplateDesignerView
                        setActiveModule={(module) => {
                            if (module === 'agent_templates') {
                                setActiveSubView('library');
                            }
                        }}
                        template={selectedTemplate}
                        source={viewSource}
                        onSaveDraft={handleSaveDraft}
                    />
                );
            case 'settings':
                return (
                    <div className="flex items-center justify-center h-full text-slate-400 bg-white m-4 rounded-xl border border-slate-200">
                        <div className="text-center">
                            <Settings className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h2 className="text-lg font-semibold text-slate-800 mb-2">模型工厂设置</h2>
                            <p>配置全局参数、运行包与治理策略</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Cpu className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">模型工厂</h1>
                            <p className="text-sm text-slate-500">设计、发布与管理 AI 智能体模板</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveSubView('library')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                                activeSubView === 'library'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            <span>模板库</span>
                        </button>
                        <button
                            onClick={() => {
                                setSelectedTemplate(null);
                                setViewSource('create');
                                setActiveSubView('designer');
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                                activeSubView === 'designer'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>设计器</span>
                        </button>
                        <button
                            onClick={() => setActiveSubView('settings')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                                activeSubView === 'settings'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Settings className="w-4 h-4" />
                            <span>设置</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default ModelFactoryView;
