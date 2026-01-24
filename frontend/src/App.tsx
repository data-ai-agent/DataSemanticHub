import { useState, useCallback } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, AlertCircle, CheckCircle, ArrowRight,
    FileText, Settings, Activity, Cpu, Link,
    Code, RefreshCw, ChevronRight, PieChart, Shield,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, Users, Clock, MessageCircle, Send
} from 'lucide-react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
import DashboardView from './views/DashboardView';
import SemanticModelingOverview from './views/SemanticModelingOverview';
import MappingStudioView from './views/MappingStudioView';
import BOMappingStudioView from './views/BOMappingStudioView';
import CandidateConfirmationView from './views/CandidateConfirmationView';
import ScenarioOrchestrationView from './views/ScenarioOrchestrationView';
import BusinessScenarioView from './views/BusinessScenarioView';
import BusinessModelingView from './views/BusinessModelingView';
import ResourceKnowledgeNetworkView from './views/ResourceKnowledgeNetworkView';
import TechDiscoveryView from './views/TechDiscoveryView';
import DataSemanticUnderstandingView from './views/DataSemanticUnderstandingView';
import DataSemanticUnderstandingViewV2 from './views/DataSemanticUnderstandingViewV2';
import CandidateGenerationView from './views/CandidateGenerationView';
import ConflictDetectionView from './views/ConflictDetectionView';
import SmartDataHubView from './views/SmartDataHubView';
import ApiGatewayView from './views/ApiGatewayView';
import CacheStrategyView from './views/CacheStrategyView';
import SemanticVersionView from './views/SemanticVersionView';
import DataSourceManagementView from './views/DataSourceManagementView';
import AssetScanningView from './views/AssetScanningView';
import AskDataView from './views/AskDataView';
import AdvancedAskDataView from './views/AdvancedAskDataView';
import { DataCatalogView } from './views/DataCatalogView';
import SemanticAssetManagerView from './views/SemanticAssetManagerView';
import { FieldSemanticWorkbenchView } from './views/FieldSemanticWorkbenchView';
import { useModuleNavigation } from './hooks/useModuleNavigation';
import AuthView from './views/AuthView';
import UserPermissionView from './views/UserPermissionView';
import PermissionTemplatesView from './views/PermissionTemplatesView';
import WorkflowManagementView from './views/WorkflowManagementView';
import ApprovalPolicyView from './views/ApprovalPolicyView';
import AuditLogView from './views/AuditLogView';
import MenuManagementView from './views/MenuManagementView';
import OrgManagementView from './views/OrgManagementView';
import UserManagementView from './views/UserManagementView';

// ==========================================
// 组件定义
// ==========================================


export default function SemanticLayerApp() {
    const [activeModule, setActiveModule] = useModuleNavigation('governance');

    // 处理需要认证时的回调
    const handleAuthRequired = useCallback(() => {
        setActiveModule('auth');
    }, [setActiveModule]);

    // 处理登录成功后的回调，跳转到治理概览页面
    const handleAuthSuccess = useCallback(() => {
        setActiveModule('governance');
    }, [setActiveModule]);

    // 确保 mockBusinessObjects 存在且不为空，避免 undefined 错误
    const [selectedBO, setSelectedBO] = useState(mockBusinessObjects && mockBusinessObjects.length > 0 ? mockBusinessObjects[0] : null);
    const [showRuleEditor, setShowRuleEditor] = useState(null);
    const [navigationParams, setNavigationParams] = useState<any>(null);

    const handleNavigateWithParams = (module: string, params: any) => {
        setNavigationParams(params);
        setActiveModule(module);
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
                initialState={navigationParams}
            />;
            case 'bu_semantic_v2': return <DataSemanticUnderstandingViewV2
                scanResults={scanResults}
                setScanResults={setScanResults}
                candidateResults={candidateResults}
                setCandidateResults={setCandidateResults}
                businessObjects={businessObjects}
                setBusinessObjects={setBusinessObjects}
                setActiveModule={setActiveModule}
                initialState={navigationParams}
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
            default: return <DashboardView setActiveModule={setActiveModule} />;
        }
    };

    // 如果当前是登录页面，直接渲染登录页面
    if (activeModule === 'auth') {
        return <AuthView onContinue={handleAuthSuccess} />;
    }



    // 已登录用户访问主应用，使用路由守卫保护
    return (
        <ProtectedRoute onAuthRequired={handleAuthRequired}>
            <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
                {/* 侧边栏 */}
                <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

                {/* 主界面 */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#F7F8FA]">
                    <Header activeModule={activeModule} setActiveModule={setActiveModule} />
                    <BreadcrumbBar activeModule={activeModule} />
                    <main className="flex-1 overflow-auto p-4 relative">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
