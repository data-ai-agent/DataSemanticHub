import {
    Layout,
    Database,
    Layers,
    Search,
    FileText,
    Activity,
    Sparkles,
    MessageCircle,
    Verified,
    Lock,
    History,
    Book,
    Tag,
    Bookmark,
    Network,
    LayoutGrid,
    Building2,
    UserCog,
    GitBranch,
    FileCheck,
    PanelLeftClose,
    Edit,
    CheckSquare,
    Upload,
    Cpu,
    TrendingUp,
    Link,
    Shield,
    Settings,
    ListChecks,
    EyeOff,
    Box
} from 'lucide-react';

export interface MenuItem {
    id: string;
    label: string;
    icon: any;
    children?: MenuItem[];
}

export interface MenuGroup {
    title: string;
    color: string;
    items: MenuItem[];
}

export type ProductId = 'governance' | 'agent_factory';

export interface AppProduct {
    id: ProductId;
    name: string;
    icon: any;
    color: string;
    defaultModule: string;
    menus: MenuGroup[];
}

export const GOVERNANCE_MENUS: MenuGroup[] = [
    {
        title: '数据服务',
        color: 'text-indigo-400',
        items: [
            { id: 'ask_data', label: '问数', icon: MessageCircle },
            { id: 'advanced_ask_data', label: '高级问数', icon: Sparkles },
            { id: 'data_supermarket', label: '找数', icon: Search }
        ]
    },
    {
        title: '数据应用',
        color: 'text-teal-400',
        items: [
            { id: 'scenario_orchestration', label: '场景编排', icon: Layers }
        ]
    },
    {
        title: '语义治理',
        color: 'text-blue-400',
        items: [
            { id: 'dashboard', label: '语义治理总览', icon: Activity },
            {
                id: 'semantic_modeling',
                label: '语义建模',
                icon: Layout,
                children: [
                    { id: 'modeling_overview', label: '语义建模概览', icon: Activity },
                    { id: 'td_goals', label: '业务梳理', icon: FileText },
                    { id: 'bu_semantic', label: '逻辑视图', icon: FileText },
                    { id: 'bu_semantic_v2', label: '逻辑视图2', icon: FileText },
                    { id: 'field_semantic', label: '字段语义理解', icon: Search },
                    { id: 'td_modeling', label: '业务对象建模', icon: Layout }
                ]
            },
            {
                id: 'data_quality',
                label: '数据质量',
                icon: Verified,
                children: [
                    { id: 'quality_overview', label: '质量概览', icon: Activity },
                    { id: 'quality_rules', label: '规则配置', icon: Settings },
                    { id: 'quality_tasks', label: '质量任务', icon: ListChecks }
                ]
            },
            {
                id: 'data_security',
                label: '数据安全',
                icon: Lock,
                children: [
                    { id: 'security_overview', label: '安全概览', icon: Activity },
                    { id: 'security_permission', label: '权限管理', icon: UserCog },
                    { id: 'data_masking', label: '数据脱敏', icon: EyeOff }
                ]
            },
            { id: 'semantic_version', label: '语义版本', icon: History }
        ]
    },
    {
        title: '语义资产管理',
        color: 'text-purple-400',
        items: [
            { id: 'term_mgmt', label: '术语管理', icon: Book },
            { id: 'tag_mgmt', label: '标签管理', icon: Tag },
            { id: 'data_standard', label: '数据标准', icon: Bookmark },
            { id: 'resource_knowledge_network', label: '资源知识网络', icon: Network }
        ]
    },
    {
        title: '数据连接',
        color: 'text-emerald-400',
        items: [
            { id: 'bu_connect', label: '数据源管理', icon: Database },
            { id: 'bu_scan', label: '资产扫描', icon: Search },
        ]
    },
    {
        title: '平台管理',
        color: 'text-slate-400',
        items: [
            { id: 'org_mgmt', label: '组织架构管理', icon: Building2 },
            { id: 'user_mgmt', label: '用户管理', icon: UserCog },
            { id: 'menu_mgmt', label: '菜单管理', icon: LayoutGrid },
            { id: 'user_permission', label: '角色与权限', icon: PanelLeftClose },
            { id: 'permission_templates', label: '权限模板', icon: FileText },
            { id: 'workflow_mgmt', label: '工作流管理', icon: GitBranch },
            { id: 'approval_policy', label: '审批策略', icon: FileCheck },
            { id: 'audit_log', label: '审计与审批', icon: FileText }
        ]
    }
];

export const AGENT_FACTORY_MENUS: MenuGroup[] = [
    {
        title: '智能体工厂',
        color: 'text-violet-400',
        items: [
            { id: 'agent_overview', label: '概览', icon: Activity },
            { id: 'agent_templates', label: '模板库', icon: Bookmark },
            { id: 'agent_validation_center', label: '验证中心', icon: CheckSquare },
            { id: 'agent_release', label: '发布与灰度', icon: Upload },
            { id: 'agent_operation_center', label: '运行中心', icon: Cpu }
        ]
    },
    {
        title: '底座能力',
        color: 'text-emerald-400',
        items: [
            { id: 'agent_model_factory', label: '模型工厂设置', icon: Box },
            { id: 'agent_tools', label: '工具与技能', icon: Link },
            { id: 'agent_knowledge', label: '知识源与连接', icon: Network },
            { id: 'agent_runtime_packs', label: '运行包与策略', icon: Shield }
        ]
    },
    {
        title: '治理与设置',
        color: 'text-slate-400',
        items: [
            { id: 'agent_audit', label: '审计日志', icon: FileText },
            { id: 'agent_settings', label: '工厂设置', icon: Settings }
        ]
    }
];

export const APP_PRODUCTS: AppProduct[] = [
    {
        id: 'governance',
        name: '数据语义治理',
        icon: LayoutGrid,
        color: 'text-blue-600 bg-blue-50',
        defaultModule: 'governance',
        menus: GOVERNANCE_MENUS
    },
    {
        id: 'agent_factory',
        name: '智能体工厂',
        icon: Sparkles,
        color: 'text-violet-600 bg-violet-50',
        defaultModule: 'agent_overview',
        menus: AGENT_FACTORY_MENUS
    }
];

export const DEFAULT_PRODUCT_ID: ProductId = 'governance';

export const getProductById = (id?: string | null) => (
    APP_PRODUCTS.find(product => product.id === id) ?? APP_PRODUCTS[0]
);
