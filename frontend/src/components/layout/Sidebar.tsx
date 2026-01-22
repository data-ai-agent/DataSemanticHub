import { useState } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, FileText, Activity, Cpu, Link,
    RefreshCw, ChevronRight, Shield, CheckSquare,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, Users, Clock, MessageCircle, Send,
    Book, Tag, CheckCircle, ArrowRight, Sparkles, Box, Edit, XCircle, ZoomIn, ZoomOut, Eye, Share2, Network, GitBranch, Table, Globe, ChevronDown, Check,
    ScanText, Verified, Lock, History, Bookmark, LayoutGrid, Building2, UserCog
} from 'lucide-react';

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    children?: MenuItem[];
}

interface MenuGroup {
    title: string;
    color: string;
    items: MenuItem[];
}

interface SidebarProps {
    activeModule: string;
    setActiveModule: (module: string) => void;
}

const Sidebar = ({ activeModule, setActiveModule }: SidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>(['semantic_modeling']);
    const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

    const toggleExpand = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleGroup = (title: string) => {
        setCollapsedGroups(prev =>
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        );
    };

    const menus: MenuGroup[] = [
        {
            title: '数据服务',
            color: 'text-indigo-400',
            items: [
                { id: 'ask_data', label: '问数', icon: MessageCircle },
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
                        { id: 'field_semantic', label: '字段语义理解', icon: ScanText },

                        { id: 'td_modeling', label: '业务对象建模', icon: Layout }
                    ]
                },
                { id: 'data_quality', label: '数据质量', icon: Verified },
                { id: 'data_security', label: '数据安全', icon: Lock },
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
                // { id: 'bu_semantic', label: '逻辑视图', icon: FileText },
                // { id: 'bu_candidates', label: '候选生成', icon: Cpu },
            ]
        },
        /*
        {
            title: '语义治理中心',
            color: 'text-purple-400',
            items: [
                // { id: 'mapping', label: '映射工作台', icon: GitMerge },
                // { id: 'governance', label: '冲突检测', icon: Shield },
                // { id: 'sg_candidate_confirm', label: '候选业务对象确认', icon: CheckCircle },
                // { id: 'smart_data', label: '智能数据中心', icon: Cpu },
            ]
        },
        */
        /*
        {
            title: 'EE 服务执行',
            color: 'text-orange-400',
            items: [
                { id: 'ee_api', label: 'API 网关', icon: Server },
                { id: 'ee_cache', label: '缓存策略', icon: RefreshCw },
            ]
        },
        */
        {
            title: '平台管理',
            color: 'text-slate-400',
            items: [
                { id: 'org_mgmt', label: '组织架构管理', icon: Building2 },
                { id: 'user_mgmt', label: '用户管理', icon: UserCog },
                { id: 'menu_mgmt', label: '菜单管理', icon: LayoutGrid },
                { id: 'user_permission', label: '角色与权限', icon: Users },
                { id: 'workflow_mgmt', label: '工作流管理', icon: GitBranch },
                { id: 'approval_policy', label: '审批策略', icon: FileCheck },
                { id: 'audit_log', label: '审计日志', icon: FileText }
            ]
        },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl z-20 transition-all duration-300`}>
            {/* Logo Header */}
            <div className={`h-16 flex items-center border-b border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
                {!isCollapsed && (
                    <div className="flex items-center overflow-hidden">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shrink-0">
                            <Link className="text-white" size={18} />
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <h1 className="font-bold text-white tracking-tight whitespace-nowrap">数据语义治理</h1>
                            <p className="text-[10px] text-slate-500 tracking-wider whitespace-nowrap">企业版</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={isCollapsed ? '展开菜单' : '收起菜单'}
                >
                    <ChevronRight size={20} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                {menus.map((group, idx) => {
                    const isGroupCollapsed = collapsedGroups.includes(group.title);

                    return (
                        <div key={idx} className={`mb-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                            {!isCollapsed && (
                                <div
                                    className={`flex items-center justify-between cursor-pointer mb-2 py-1 group ${group.color || 'text-slate-500'}`}
                                    onClick={() => toggleGroup(group.title)}
                                >
                                    <h3 className="text-xs font-bold uppercase tracking-wider">
                                        {group.title}
                                    </h3>
                                    <ChevronRight
                                        size={14}
                                        className={`transition-transform duration-200 ${isGroupCollapsed ? '' : 'rotate-90'} opacity-0 group-hover:opacity-100`}
                                    />
                                </div>
                            )}
                            {isCollapsed && idx > 0 && (
                                <div className="border-t border-slate-700 my-2" />
                            )}
                            <div className={`space-y-1 transition-all duration-300 ${!isCollapsed && isGroupCollapsed ? 'hidden' : ''}`}>
                                {group.items.map(item => {
                                    const hasChildren = item.children && item.children.length > 0;
                                    const isExpanded = expandedItems.includes(item.id);
                                    const isActive = activeModule === item.id || (hasChildren && item.children?.some(child => child.id === activeModule));

                                    return (
                                        <div key={item.id}>
                                            <button
                                                onClick={() => {
                                                    if (hasChildren) {
                                                        toggleExpand(item.id);
                                                    } else {
                                                        setActiveModule(item.id);
                                                    }
                                                }}
                                                title={isCollapsed ? item.label : undefined}
                                                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-2' : 'px-3'} py-2 rounded-md text-sm transition-all duration-200 ${activeModule === item.id
                                                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                                                    : isExpanded ? 'text-slate-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                                    }`}
                                            >
                                                <item.icon size={16} strokeWidth={1.5} className={activeModule === item.id ? 'text-blue-400' : ''} />
                                                {!isCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                                                {!isCollapsed && hasChildren && (
                                                    <ChevronRight
                                                        size={14}
                                                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                )}
                                            </button>
                                            {/* Submenu */}
                                            {!isCollapsed && hasChildren && isExpanded && (
                                                <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-2">
                                                    {item.children?.map(child => (
                                                        <button
                                                            key={child.id}
                                                            onClick={() => setActiveModule(child.id)}
                                                            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${activeModule === child.id
                                                                ? 'text-blue-400 bg-slate-800/50'
                                                                : 'text-slate-500 hover:text-slate-300'
                                                                }`}
                                                        >
                                                            <span className="truncate">{child.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* User Profile */}
            <div className={`p-4 border-t border-slate-800 bg-slate-900/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
                {isCollapsed ? (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white" title="John Doe">
                        JD
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white shrink-0">
                            JD
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">Admin User</p>
                            <p className="text-xs text-slate-500 truncate">admin@company.com</p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
