import { useState, useEffect, useCallback } from 'react';

// 定义合法的模块 ID 类型（根据 App.tsx 中的 case）
export type ModuleId =
    | 'dashboard' | 'modeling_overview'
    | 'td_goals' | 'mapping' | 'bo_mapping' | 'candidate_confirmation' | 'td_modeling' | 'resource_knowledge_network' | 'scenario_orchestration'
    | 'bu_connect' | 'bu_scan' | 'bu_discovery' | 'bu_semantic' | 'bu_candidates'
    | 'governance' | 'smart_data' | 'data_supermarket' | 'term_mgmt' | 'tag_mgmt' | 'ask_data' | 'data_standard'
    | 'field_semantic' | 'data_quality' | 'data_security' | 'semantic_version'
    | 'user_permission' | 'workflow_mgmt' | 'approval_policy' | 'audit_log'
    | 'ee_api' | 'ee_cache'
    | 'auth' | 'menu_mgmt' | 'org_mgmt' | 'user_mgmt';

const DEFAULT_MODULE: ModuleId = 'dashboard';

/**
 * 自定义 Hook：管理模块导航状态，并与 URL Query 参数同步
 * 效果：切换模块时 URL 变为 /?tab=module_id，刷新页面可保持状态
 */
export function useModuleNavigation(initialModule: ModuleId = DEFAULT_MODULE) {
    // 1. 初始化时优先尝试从 URL 读取
    const getInitialModule = (): ModuleId => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab) {
                return tab as ModuleId;
            }
        }
        return initialModule;
    };

    const [activeModule, setActiveModuleState] = useState<ModuleId>(getInitialModule);

    // 2. 包装 setActiveModule，同步更新 URL
    const setActiveModule = useCallback((module: string) => {
        const moduleId = module as ModuleId;
        setActiveModuleState(moduleId);

        // 更新 URL 但不刷新页面
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', moduleId);
        window.history.pushState({ path: newUrl.href }, '', newUrl.href);
    }, []);

    // 3. 监听浏览器的前进/后退事件 (popstate)
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab) {
                setActiveModuleState(tab as ModuleId);
            } else {
                setActiveModuleState(DEFAULT_MODULE);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    return [activeModule, setActiveModule] as const;
}
