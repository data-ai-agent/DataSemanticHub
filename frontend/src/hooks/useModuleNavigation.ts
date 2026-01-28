import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PRODUCT_ID, ProductId } from '../config/menuConfig';
import { isAuthenticated } from '../utils/authUtils';

// 定义合法的模块 ID 类型（根据 App.tsx 中的 case）
export type ModuleId =
    | 'dashboard' | 'modeling_overview'
    | 'td_goals' | 'mapping' | 'bo_mapping' | 'candidate_confirmation' | 'td_modeling' | 'resource_knowledge_network' | 'scenario_orchestration'
    | 'bu_connect' | 'bu_scan' | 'bu_discovery' | 'bu_semantic' | 'bu_semantic_v2' | 'bu_candidates'
    | 'governance' | 'smart_data' | 'data_supermarket' | 'term_mgmt' | 'tag_mgmt' | 'ask_data' | 'advanced_ask_data' | 'data_standard'
    | 'field_semantic' | 'data_quality' | 'quality_overview' | 'quality_rules' | 'quality_tasks'
    | 'data_security' | 'security_overview' | 'security_permission' | 'data_masking' | 'semantic_version'
    | 'user_permission' | 'permission_templates' | 'workflow_mgmt' | 'approval_policy' | 'audit_log'
    | 'ee_api' | 'ee_cache'
    | 'auth' | 'menu_mgmt' | 'org_mgmt' | 'user_mgmt'
    | 'agent_overview' | 'agent_templates' | 'agent_designer' | 'agent_debug'
    | 'agent_test' | 'agent_release' | 'agent_instances' | 'agent_workbench'
    | 'agent_observability' | 'agent_tools' | 'agent_knowledge' | 'agent_runtime_packs'
    | 'agent_audit' | 'agent_settings'
    | 'agent_validation_center' | 'agent_operation_center' | 'agent_model_factory';

// 默认模块：治理概览
const DEFAULT_MODULE_BY_PRODUCT: Record<ProductId, ModuleId> = {
    governance: 'governance',
    agent_factory: 'agent_overview'
};

const isValidProductId = (value: string | null): value is ProductId => (
    value === 'governance' || value === 'agent_factory'
);

/**
 * 自定义 Hook：管理模块导航状态，并与 URL Query 参数同步
 * 效果：切换模块时 URL 变为 /?tab=module_id，刷新页面可保持状态
 *
 * 认证逻辑：
 * - 如果未登录，自动跳转到 auth 模块
 * - 如果已登录，默认跳转到 governance（治理概览）页面
 */
export function useModuleNavigation(initialModule: ModuleId = DEFAULT_MODULE_BY_PRODUCT[DEFAULT_PRODUCT_ID], initialProduct: ProductId = DEFAULT_PRODUCT_ID) {
    // 1. 初始化时优先尝试从 URL 读取，同时检查登录状态
    const getInitialState = (): { module: ModuleId; product: ProductId } => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            const productParam = params.get('product');
            const inferredProduct = tab?.startsWith('agent_') ? 'agent_factory' : initialProduct;
            const resolvedProduct = isValidProductId(productParam) ? productParam : inferredProduct;

            // 如果 URL 中指定了 auth 模块，直接返回
            if (tab === 'auth') {
                return { module: 'auth', product: resolvedProduct };
            }

            // 检查登录状态
            if (!isAuthenticated()) {
                // 未登录，跳转到登录页
                return { module: 'auth', product: resolvedProduct };
            }

            // 已登录，使用 URL 中的模块或默认模块
            if (tab) {
                return { module: tab as ModuleId, product: resolvedProduct };
            }

            return { module: DEFAULT_MODULE_BY_PRODUCT[resolvedProduct], product: resolvedProduct };
        }
        return { module: initialModule, product: initialProduct };
    };

    const initialState = getInitialState();
    const [activeModule, setActiveModuleState] = useState<ModuleId>(initialState.module);
    const [activeProduct, setActiveProductState] = useState<ProductId>(initialState.product);

    // 2. 包装 setActiveModule，同步更新 URL
    const setActiveModule = useCallback((module: string) => {
        const moduleId = module as ModuleId;
        const inferredProduct = moduleId.startsWith('agent_') ? 'agent_factory' : 'governance';
        setActiveModuleState(moduleId);
        if (moduleId !== 'auth') {
            setActiveProductState(inferredProduct);
        }

        // 更新 URL 但不刷新页面
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', moduleId);
        newUrl.searchParams.set('product', moduleId === 'auth' ? activeProduct : inferredProduct);
        window.history.pushState({ path: newUrl.href }, '', newUrl.href);
    }, [activeProduct]);

    const setActiveProduct = useCallback((product: ProductId) => {
        setActiveProductState(product);
        const nextModule = DEFAULT_MODULE_BY_PRODUCT[product];
        setActiveModuleState(nextModule);

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('product', product);
        newUrl.searchParams.set('tab', nextModule);
        window.history.pushState({ path: newUrl.href }, '', newUrl.href);
    }, []);

    // 3. 监听浏览器的前进/后退事件 (popstate)
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            const productParam = params.get('product');
            const inferredProduct = tab?.startsWith('agent_') ? 'agent_factory' : DEFAULT_PRODUCT_ID;
            const resolvedProduct = isValidProductId(productParam) ? productParam : inferredProduct;

            // 如果 URL 中指定了 auth 模块，直接使用
            if (tab === 'auth') {
                setActiveModuleState('auth');
                setActiveProductState(resolvedProduct);
                return;
            }

            // 检查登录状态
            if (!isAuthenticated()) {
                // 未登录，跳转到登录页
                setActiveModuleState('auth');
                setActiveProductState(resolvedProduct);
                return;
            }

            // 已登录，使用 URL 中的模块或默认模块
            if (tab) {
                setActiveModuleState(tab as ModuleId);
                setActiveProductState(resolvedProduct);
            } else {
                setActiveModuleState(DEFAULT_MODULE_BY_PRODUCT[resolvedProduct]);
                setActiveProductState(resolvedProduct);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    return { activeModule, setActiveModule, activeProduct, setActiveProduct } as const;
}
