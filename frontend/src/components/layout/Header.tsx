import { ChevronRight } from 'lucide-react';

interface HeaderProps {
    activeModule: string;
}

const moduleLabels: Record<string, string> = {
    dashboard: '语义治理总览',
    ask_data: '问数',
    data_supermarket: '找数',
    td_goals: '业务梳理',
    td_modeling: '业务对象建模',
    modeling_overview: '语义建模概览',
    resource_knowledge_network: '资源知识网络',
    bu_semantic: '逻辑视图',
    field_semantic: '字段语义理解',
    candidate_confirmation: '候选业务对象',
    data_quality: '数据质量',
    data_security: '数据安全',
    semantic_version: '语义版本',
    scenario_orchestration: '场景编排',
    bu_connect: '数据源管理',
    bu_scan: '资产扫描',
    bu_discovery: '技术发现',
    bu_candidates: '候选生成',
    mapping: '映射工作台',
    bo_mapping: '业务对象映射',
    governance: '冲突检测',
    data_standard: '数据标准',
    smart_data: '智能数据中心',
    ee_api: 'API 网关',
    ee_cache: '缓存策略',
    user_permission: '角色与权限',
    menu_mgmt: '菜单管理',
    org_mgmt: '组织架构管理',
    user_mgmt: '用户管理',
    workflow_mgmt: '工作流管理',
    approval_policy: '审批策略',
    audit_log: '审计日志'
};

const Header = ({ activeModule }: HeaderProps) => (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center text-sm breadcrumbs text-slate-500">
            <span>数据语义治理</span>
            <ChevronRight size={14} className="mx-2" />
            <span className="font-medium text-slate-800">{moduleLabels[activeModule] || activeModule}</span>
        </div>
        <div className="flex items-center gap-4">
            {/* 右侧预留空间 */}
        </div>
    </header>
);

export default Header;
