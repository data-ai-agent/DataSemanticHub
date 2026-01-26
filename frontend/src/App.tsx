import { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, AlertCircle, CheckCircle, ArrowRight,
    FileText, Settings, Activity, Cpu, Link,
    Code, RefreshCw, ChevronRight, PieChart, Shield,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, Users, Clock, MessageCircle, Send
} from 'lucide-react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { menuService } from './services/menuService';
import { transformMenuTreeToMenuGroups, filterMenusByProduct } from './services/menuTransformService';
import { getCachedMenus, setCachedMenus, clearExpiredCaches } from './services/menuCacheService';
import { MenuGroup, APP_PRODUCTS, GOVERNANCE_MENUS, AGENT_FACTORY_MENUS, getProductById } from './config/menuConfig';

// ==========================================
// 导入模块化组件
// ==========================================
import {
    mockBusinessObjects,
    mockAICandidates,
    mockScanResults
} from './data/mockData';
import { BusinessObject } from './types/semantic';


import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BreadcrumbBar from './components/layout/BreadcrumbBar';
import { agentFactoryMock } from './data/mockAgentFactory';
const DashboardView = lazy(() => import('./views/DashboardView'));
const SemanticModelingOverview = lazy(() => import('./views/SemanticModelingOverview'));
const MappingStudioView = lazy(() => import('./views/MappingStudioView'));
const BOMappingStudioView = lazy(() => import('./views/BOMappingStudioView'));
const CandidateConfirmationView = lazy(() => import('./views/CandidateConfirmationView'));
const ScenarioOrchestrationView = lazy(() => import('./views/ScenarioOrchestrationView'));
const BusinessScenarioView = lazy(() => import('./views/BusinessScenarioView'));
const BusinessModelingView = lazy(() => import('./views/BusinessModelingView'));
const ResourceKnowledgeNetworkView = lazy(() => import('./views/ResourceKnowledgeNetworkView'));
const TechDiscoveryView = lazy(() => import('./views/TechDiscoveryView'));
const DataSemanticUnderstandingView = lazy(() => import('./views/DataSemanticUnderstandingView'));
const DataSemanticUnderstandingViewV2 = lazy(() => import('./views/DataSemanticUnderstandingViewV2'));
const CandidateGenerationView = lazy(() => import('./views/CandidateGenerationView'));
const ConflictDetectionView = lazy(() => import('./views/ConflictDetectionView'));
const SmartDataHubView = lazy(() => import('./views/SmartDataHubView'));
const ApiGatewayView = lazy(() => import('./views/ApiGatewayView'));
const CacheStrategyView = lazy(() => import('./views/CacheStrategyView'));
const SemanticVersionView = lazy(() => import('./views/SemanticVersionView'));
const DataSourceManagementView = lazy(() => import('./views/DataSourceManagementView'));
const AssetScanningView = lazy(() => import('./views/AssetScanningView'));
const AskDataView = lazy(() => import('./views/AskDataView'));
const AdvancedAskDataView = lazy(() => import('./views/AdvancedAskDataView'));
const AgentFactoryOverviewView = lazy(() => import('./views/agent-factory/AgentFactoryOverviewView'));
const TemplateLibraryView = lazy(() => import('./views/agent-factory/TemplateLibraryView'));
const AgentTemplateDesignerView = lazy(() => import('./views/agent-factory/AgentTemplateDesignerView'));
const DebugTraceView = lazy(() => import('./views/agent-factory/DebugTraceView'));
const TestEvaluationView = lazy(() => import('./views/agent-factory/TestEvaluationView'));
const ReleaseCanaryView = lazy(() => import('./views/agent-factory/ReleaseCanaryView'));
const AgentInstancesView = lazy(() => import('./views/agent-factory/AgentInstancesView'));
const AgentWorkbenchView = lazy(() => import('./views/agent-factory/AgentWorkbenchView'));
const ObservabilityView = lazy(() => import('./views/agent-factory/ObservabilityView'));
const ToolRegistryView = lazy(() => import('./views/agent-factory/ToolRegistryView'));
const KnowledgeConnectorsView = lazy(() => import('./views/agent-factory/KnowledgeConnectorsView'));
const RuntimePacksView = lazy(() => import('./views/agent-factory/RuntimePacksView'));
const AuditLogsView = lazy(() => import('./views/agent-factory/AuditLogsView'));
const FactorySettingsView = lazy(() => import('./views/agent-factory/FactorySettingsView'));
// Handling named exports for lazy loading
const DataCatalogView = lazy(() => import('./views/DataCatalogView').then(module => ({ default: module.DataCatalogView })));
const SemanticAssetManagerView = lazy(() => import('./views/SemanticAssetManagerView'));
const FieldSemanticWorkbenchView = lazy(() => import('./views/FieldSemanticWorkbenchView').then(module => ({ default: module.FieldSemanticWorkbenchView })));

import { useModuleNavigation } from './hooks/useModuleNavigation';

const AuthView = lazy(() => import('./views/AuthView'));
const UserPermissionView = lazy(() => import('./views/UserPermissionView'));
const PermissionTemplatesView = lazy(() => import('./views/PermissionTemplatesView'));
const WorkflowManagementView = lazy(() => import('./views/WorkflowManagementView'));
const ApprovalPolicyView = lazy(() => import('./views/ApprovalPolicyView'));
const AuditLogView = lazy(() => import('./views/AuditLogView'));
const MenuManagementView = lazy(() => import('./views/MenuManagementView'));
const OrgManagementView = lazy(() => import('./views/OrgManagementView'));
const UserManagementView = lazy(() => import('./views/UserManagementView'));

// Loading Component
const PageLoading = () => (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm animate-pulse">加载资源中...</p>
    </div>
);

// ==========================================
// 组件定义
// ==========================================


export default function SemanticLayerApp() {
    const { activeModule, setActiveModule, activeProduct, setActiveProduct } = useModuleNavigation();
    const productMeta = getProductById(activeProduct);
    
    // 菜单状态管理
    const [menus, setMenus] = useState<MenuGroup[]>(productMeta.menus); // 默认使用静态配置
    const [menuLoading, setMenuLoading] = useState(false);
    const [menuError, setMenuError] = useState<string | null>(null);
    const [useStaticMenus, setUseStaticMenus] = useState(false); // 是否使用静态菜单（降级方案）

    // 处理需要认证时的回调
    const handleAuthRequired = useCallback(() => {
        setActiveModule('auth');
    }, [setActiveModule]);

    // 处理登录成功后的回调，跳转到治理概览页面
    const handleAuthSuccess = useCallback(() => {
        setActiveModule('governance');
    }, [setActiveModule]);

    // 加载菜单数据
    const loadMenus = useCallback(async (productId: string) => {
        // 如果使用静态菜单，直接返回
        if (useStaticMenus) {
            const staticMenus = productId === 'governance' ? GOVERNANCE_MENUS : AGENT_FACTORY_MENUS;
            setMenus(staticMenus);
            return;
        }

        // 先尝试从缓存获取
        const cachedMenus = getCachedMenus(productId as any);
        if (cachedMenus) {
            setMenus(cachedMenus);
            setMenuError(null);
            return;
        }

        // 从API加载
        setMenuLoading(true);
        setMenuError(null);
        
        try {
            // 获取菜单树
            const menuTree = await menuService.getMenuTree({
                enabled: true,
                visible: true,
            });

            // 按产品过滤
            const filteredMenus = filterMenusByProduct(menuTree, productId as any);

            // 转换为前端格式
            const transformedMenus = transformMenuTreeToMenuGroups(filteredMenus, productId as any);

            // 如果转换后的菜单为空，使用静态配置作为降级
            if (transformedMenus.length === 0) {
                console.warn('转换后的菜单为空，使用静态配置');
                const staticMenus = productId === 'governance' ? GOVERNANCE_MENUS : AGENT_FACTORY_MENUS;
                setMenus(staticMenus);
                setUseStaticMenus(true);
            } else {
                setMenus(transformedMenus);
                // 缓存菜单
                setCachedMenus(productId as any, transformedMenus);
            }
        } catch (error: any) {
            console.error('Failed to load menus from API:', error);
            setMenuError(error.message || '加载菜单失败');
            
            // 降级到静态配置
            const staticMenus = productId === 'governance' ? GOVERNANCE_MENUS : AGENT_FACTORY_MENUS;
            setMenus(staticMenus);
            setUseStaticMenus(true);
        } finally {
            setMenuLoading(false);
        }
    }, [useStaticMenus]);

    // 当产品切换时，重新加载菜单
    useEffect(() => {
        loadMenus(activeProduct);
    }, [activeProduct, loadMenus]);

    // 组件挂载时清除过期缓存
    useEffect(() => {
        clearExpiredCaches();
    }, []);

    // 确保 mockBusinessObjects 存在且不为空，避免 undefined 错误
    const [selectedBO, setSelectedBO] = useState(mockBusinessObjects && mockBusinessObjects.length > 0 ? mockBusinessObjects[0] : null);
    const [showRuleEditor, setShowRuleEditor] = useState(null);
    const [navigationParams, setNavigationParams] = useState<{ module: string; params: any } | null>(null);

    const handleNavigateWithParams = (module: string, params: any) => {
        setNavigationParams({ module, params });
        setActiveModule(module);
    };

    const handleUpsertAgentTemplate = (template: any) => {
        if (!template?.id) {
            return;
        }
        setAgentTemplates(prev => {
            const index = prev.findIndex(item => item.id === template.id);
            if (index === -1) {
                return [template, ...prev];
            }
            const next = [...prev];
            next[index] = { ...next[index], ...template };
            return next;
        });
        setAgentTemplateHighlight({ id: template.id, reason: 'saved' });
    };

    // Lifted State: Business Objects
    const [businessObjects, setBusinessObjects] = useState(() => {
        // Map AI Candidates to Business Objects
        const mappedCandidates = mockAICandidates.map(c => ({
            id: c.id,
            name: c.suggestedName,
            code: c.sourceTable.toUpperCase(),
            type: 'CORE_ENTITY',
            domain: '待分类',
            owner: 'AI',
            status: 'candidate',
            description: c.reason,
            confidence: Math.round(c.confidence * 100),
            source: 'AI',
            evidence: {
                sourceTables: [c.sourceTable],
                score: c.scores,
                keyFields: []
            },
            fields: c.previewFields?.map((f: any) => ({
                id: crypto.randomUUID(),
                name: f.attr,
                code: f.col,
                type: f.type,
                description: `Confidence: ${f.conf}`
            })) || []
        } as BusinessObject));

        return [...mockBusinessObjects, ...mappedCandidates];
    });

    // Lifted State: Scan Results (Shared between BU-02 and BU-04)
    // Lifted State: Scan Results (Shared between BU-02 and BU-04)
    // Initialized with mock data to show logic view immediately
    const [scanResults, setScanResults] = useState<any[]>(mockScanResults || []);
    const [agentTemplates, setAgentTemplates] = useState(agentFactoryMock.templateLibrary.templates);
    const [agentTemplateHighlight, setAgentTemplateHighlight] = useState<{ id: string; reason: 'created' | 'saved' } | null>(null);

    // Lifted State: Candidate Results (Shared between Semantic view and Confirmation view)
    const [candidateResults, setCandidateResults] = useState<any[]>([]);

    const handleAddBusinessObject = (newBO: any) => {
        setBusinessObjects([...businessObjects, newBO]);
    };

    const handleNavigateToMapping = (bo: any) => {
        setSelectedBO(bo);
        setActiveModule('bo_mapping');
    };

    // 渲染主内容区域
    const renderContent = () => {
        switch (activeModule) {
            case 'dashboard': return <DashboardView setActiveModule={setActiveModule} />;
            case 'modeling_overview': return <SemanticModelingOverview setActiveModule={setActiveModule} />;
            case 'td_goals': return <BusinessScenarioView />;
            case 'mapping': return <MappingStudioView selectedBO={selectedBO} showRuleEditor={showRuleEditor} setShowRuleEditor={setShowRuleEditor} businessObjects={businessObjects} />;
            case 'bo_mapping': return <BOMappingStudioView selectedBO={selectedBO} showRuleEditor={showRuleEditor} setShowRuleEditor={setShowRuleEditor} businessObjects={businessObjects} setBusinessObjects={setBusinessObjects} onBack={() => setActiveModule('td_modeling')} />;
            case 'candidate_confirmation': return <CandidateConfirmationView
                candidateResults={candidateResults}
                setCandidateResults={setCandidateResults}
                businessObjects={businessObjects}
                setBusinessObjects={setBusinessObjects}
                setActiveModule={setActiveModule}
            />;
            case 'td_modeling': return <BusinessModelingView businessObjects={businessObjects} setBusinessObjects={setBusinessObjects} onNavigateToMapping={handleNavigateToMapping} />;
            case 'resource_knowledge_network': return <ResourceKnowledgeNetworkView />;
            case 'scenario_orchestration': return <ScenarioOrchestrationView businessObjects={businessObjects} />;
            case 'bu_connect': return <DataSourceManagementView />;
            case 'bu_scan': return <AssetScanningView onNavigate={setActiveModule} />;
            case 'bu_discovery': return <TechDiscoveryView onAddBusinessObject={handleAddBusinessObject} scanResults={scanResults} setScanResults={setScanResults} />;
            case 'bu_semantic': return <DataSemanticUnderstandingView
                scanResults={scanResults}
                setScanResults={setScanResults}
                candidateResults={candidateResults}
                setCandidateResults={setCandidateResults}
                businessObjects={businessObjects}
                setBusinessObjects={setBusinessObjects}
                setActiveModule={setActiveModule}
                initialState={navigationParams?.module === 'bu_semantic' ? navigationParams.params : null}
            />;
            case 'bu_semantic_v2': return <DataSemanticUnderstandingViewV2
                scanResults={scanResults}
                setScanResults={setScanResults}
                candidateResults={candidateResults}
                setCandidateResults={setCandidateResults}
                businessObjects={businessObjects}
                setBusinessObjects={setBusinessObjects}
                setActiveModule={setActiveModule}
                initialState={navigationParams?.module === 'bu_semantic_v2' ? navigationParams.params : null}
            />;
            case 'field_semantic': return <FieldSemanticWorkbenchView
                scanResults={scanResults}
                onNavigateToField={(tableId, fieldName) => handleNavigateWithParams('bu_semantic', { tableId, mode: 'SEMANTIC', focusField: fieldName })}
            />;
            case 'semantic_version': return <SemanticVersionView />;
            case 'bu_candidates': return <CandidateGenerationView scanResults={scanResults} setScanResults={setScanResults} onAddBusinessObject={handleAddBusinessObject} />;
            case 'governance': return <ConflictDetectionView />;
            case 'smart_data': return <SmartDataHubView businessObjects={businessObjects} />;
            case 'data_supermarket': return <DataCatalogView />;
            case 'term_mgmt': return <SemanticAssetManagerView initialTab="terms" />;
            case 'tag_mgmt': return <SemanticAssetManagerView initialTab="tags" />;
            case 'ask_data': return <AskDataView />;
            case 'advanced_ask_data': return <AdvancedAskDataView />;
            case 'ee_api': return <ApiGatewayView businessObjects={businessObjects} />;
            case 'ee_cache': return <CacheStrategyView />;
            case 'user_permission': return <UserPermissionView />;
            case 'permission_templates': return <PermissionTemplatesView />;
            case 'workflow_mgmt': return <WorkflowManagementView />;
            case 'approval_policy': return <ApprovalPolicyView />;
            case 'audit_log': return <AuditLogView />;
            case 'menu_mgmt': return <MenuManagementView />;
            case 'org_mgmt': return <OrgManagementView />;
            case 'user_mgmt': return <UserManagementView />;
            case 'agent_overview': return <AgentFactoryOverviewView setActiveModule={setActiveModule} />;
            case 'agent_templates': return (
                <TemplateLibraryView
                    setActiveModule={setActiveModule}
                    onNavigateWithParams={handleNavigateWithParams}
                    templates={agentTemplates}
                    setTemplates={setAgentTemplates}
                    highlightId={agentTemplateHighlight?.id ?? null}
                    highlightReason={agentTemplateHighlight?.reason}
                    onClearHighlight={() => setAgentTemplateHighlight(null)}
                />
            );
            case 'agent_designer': return (
                <AgentTemplateDesignerView
                    setActiveModule={setActiveModule}
                    template={navigationParams?.module === 'agent_designer' ? navigationParams.params?.template : undefined}
                    source={navigationParams?.module === 'agent_designer' ? navigationParams.params?.source : undefined}
                    onSaveDraft={handleUpsertAgentTemplate}
                />
            );
            case 'agent_debug': return <DebugTraceView setActiveModule={setActiveModule} />;
            case 'agent_test': return <TestEvaluationView />;
            case 'agent_release': return <ReleaseCanaryView />;
            case 'agent_instances': return <AgentInstancesView setActiveModule={setActiveModule} />;
            case 'agent_workbench': return <AgentWorkbenchView setActiveModule={setActiveModule} />;
            case 'agent_observability': return <ObservabilityView />;
            case 'agent_tools': return <ToolRegistryView />;
            case 'agent_knowledge': return <KnowledgeConnectorsView />;
            case 'agent_runtime_packs': return <RuntimePacksView />;
            case 'agent_audit': return <AuditLogsView />;
            case 'agent_settings': return <FactorySettingsView />;
            default: return <DashboardView setActiveModule={setActiveModule} />;
        }
    };

    // 如果当前是登录页面，直接渲染登录页面
    if (activeModule === 'auth') {
        return (
            <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                <AuthView onContinue={handleAuthSuccess} />
            </Suspense>
        );
    }



    // 已登录用户访问主应用，使用路由守卫保护
    return (
        <ProtectedRoute onAuthRequired={handleAuthRequired}>
            <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
                {/* 侧边栏 */}
                <Sidebar
                    activeModule={activeModule}
                    setActiveModule={setActiveModule}
                    activeProduct={productMeta.id}
                    setActiveProduct={setActiveProduct}
                    menus={menus}
                    products={APP_PRODUCTS}
                />

                {/* 主界面 */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#F7F8FA]">
                    <Header activeModule={activeModule} setActiveModule={setActiveModule} />
                    <BreadcrumbBar activeModule={activeModule} menus={menus} />
                    <main className="flex-1 overflow-auto p-4 relative">
                        <Suspense fallback={<PageLoading />}>
                            {renderContent()}
                        </Suspense>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
