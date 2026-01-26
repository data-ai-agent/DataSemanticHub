import {
    Layout, Database, GitMerge, Server, Layers,
    Search, FileText, Activity, Cpu, Link,
    RefreshCw, ChevronRight, Shield, CheckSquare,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, Users, Clock, MessageCircle, Send,
    Book, Tag, CheckCircle, ArrowRight, Sparkles, Box, Edit, XCircle, ZoomIn, ZoomOut, Eye, Share2, Network, GitBranch, Table, Globe, ChevronDown, Check,
    ScanText, Verified, Lock, History, Bookmark, LayoutGrid, Building2, UserCog, PanelLeftClose, Grip, Settings,
    BarChart3, PieChart, FileBarChart, LineChart, TrendingDown, Home, Menu as MenuIcon, Save, Download, Trash2,
    Archive, Star, Heart, ThumbsUp, Flag, Award, Trophy, Zap, Power, Battery, Wifi, Bluetooth, Radio, Tv, Monitor,
    Smartphone, Tablet, Laptop, Printer, Key as KeyIcon, Unlock, EyeOff, ShieldCheck, ShieldAlert, Info, HelpCircle,
    AlertCircle, CheckCircle2, Minus, Calendar, Bell, Mail, Phone, MapPin, Camera, Image, Video, Music, File, FolderOpen
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Menu } from './menuService';
import { MenuItem, MenuGroup, ProductId } from '../config/menuConfig';
import { getIconByName as getIconByNameUtil } from '../utils/iconUtils';


// ==================== 图标映射表 ====================
// 基于菜单 code 或 path 映射到对应的图标组件
const ICON_MAP: Record<string, LucideIcon> = {
    // 数据服务
    'ask_data': MessageCircle,
    'advanced_ask_data': Sparkles,
    'data_supermarket': Search,

    // 数据应用
    'scenario_orchestration': Layers,

    // 语义治理
    'dashboard': Activity,
    'semantic_modeling': Layout,
    'modeling_overview': Activity,
    'td_goals': FileText,
    'bu_semantic': FileText,
    'bu_semantic_v2': FileText,
    'field_semantic': Search,
    'td_modeling': Layout,
    'data_quality': Verified,
    'data_security': Lock,
    'semantic_version': History,

    // 语义资产管理
    'term_mgmt': Book,
    'tag_mgmt': Tag,
    'data_standard': Bookmark,
    'resource_knowledge_network': Network,

    // 数据连接
    'bu_connect': Database,
    'bu_scan': Search,

    // 平台管理
    'org_mgmt': Building2,
    'user_mgmt': UserCog,
    'menu_mgmt': LayoutGrid,
    'user_permission': PanelLeftClose,
    'permission_templates': FileText,
    'workflow_mgmt': GitBranch,
    'approval_policy': FileCheck,
    'audit_log': FileText,

    // 智能体工厂
    'agent_overview': Activity,
    'agent_templates': Bookmark,
    'agent_designer': Edit,
    'agent_debug': Search,
    'agent_test': CheckSquare,
    'agent_release': Upload,
    'agent_instances': Cpu,
    'agent_observability': TrendingUp,
    'agent_tools': Link,
    'agent_knowledge': Network,
    'agent_runtime_packs': Shield,
    'agent_audit': FileText,
    'agent_settings': Settings,

    // 默认图标
    'default': Layout,
};

// ==================== 分组配置 ====================
// 基于 group_id 或菜单 code 映射到分组信息
const GROUP_CONFIG: Record<string, { title: string; color: string }> = {
    // 数据服务
    'data_service': { title: '数据服务', color: 'text-indigo-400' },

    // 数据应用
    'data_application': { title: '数据应用', color: 'text-teal-400' },

    // 语义治理
    'semantic_governance': { title: '语义治理', color: 'text-blue-400' },

    // 语义资产管理
    'semantic_asset': { title: '语义资产管理', color: 'text-purple-400' },

    // 数据连接
    'data_connection': { title: '数据连接', color: 'text-emerald-400' },

    // 平台管理
    'platform_management': { title: '平台管理', color: 'text-slate-400' },

    // 智能体工厂
    'agent_factory': { title: '智能体工厂', color: 'text-violet-400' },

    // 底座能力
    'agent_capability': { title: '底座能力', color: 'text-emerald-400' },

    // 治理与设置
    'agent_governance': { title: '治理与设置', color: 'text-slate-400' },
};

// 基于菜单 code 的默认分组映射（用于没有 group_id 的情况）
const CODE_TO_GROUP_MAP: Record<string, string> = {
    // 数据服务
    'ask_data': 'data_service',
    'advanced_ask_data': 'data_service',
    'data_supermarket': 'data_service',

    // 数据应用
    'scenario_orchestration': 'data_application',

    // 语义治理
    'dashboard': 'semantic_governance',
    'semantic_modeling': 'semantic_governance',
    'modeling_overview': 'semantic_governance',
    'td_goals': 'semantic_governance',
    'bu_semantic': 'semantic_governance',
    'bu_semantic_v2': 'semantic_governance',
    'field_semantic': 'semantic_governance',
    'td_modeling': 'semantic_governance',
    'data_quality': 'semantic_governance',
    'data_security': 'semantic_governance',
    'semantic_version': 'semantic_governance',

    // 语义资产管理
    'term_mgmt': 'semantic_asset',
    'tag_mgmt': 'semantic_asset',
    'data_standard': 'semantic_asset',
    'resource_knowledge_network': 'semantic_asset',

    // 数据连接
    'bu_connect': 'data_connection',
    'bu_scan': 'data_connection',

    // 平台管理
    'org_mgmt': 'platform_management',
    'user_mgmt': 'platform_management',
    'menu_mgmt': 'platform_management',
    'user_permission': 'platform_management',
    'permission_templates': 'platform_management',
    'workflow_mgmt': 'platform_management',
    'approval_policy': 'platform_management',
    'audit_log': 'platform_management',

    // 智能体工厂
    'agent_overview': 'agent_factory',
    'agent_templates': 'agent_factory',
    'agent_designer': 'agent_factory',
    'agent_debug': 'agent_factory',
    'agent_test': 'agent_factory',
    'agent_release': 'agent_factory',
    'agent_instances': 'agent_factory',
    'agent_observability': 'agent_factory',
    'agent_tools': 'agent_capability',
    'agent_knowledge': 'agent_capability',
    'agent_runtime_packs': 'agent_capability',
    'agent_audit': 'agent_governance',
    'agent_settings': 'agent_governance',
};

// ==================== 工具函数 ====================

/**
 * 获取菜单图标
 */
function getMenuIcon(menu: Menu, iconName?: string): LucideIcon {
    // 优先使用菜单中存储的图标名称（如果后端支持或从 MenuItem 传入）
    if (iconName) {
        const icon = getIconByNameUtil(iconName);
        // 如果找到了有效的图标（不是默认的 LayoutGrid），使用它
        if (icon) {
            return icon;
        }
    }

    // 其次使用 code 查找
    if (menu.code && ICON_MAP[menu.code]) {
        return ICON_MAP[menu.code];
    }

    // 再次使用 path 查找（提取路径的最后一段）
    if (menu.path) {
        const pathKey = menu.path.split('/').pop()?.replace(/[-_]/g, '_') || '';
        if (ICON_MAP[pathKey]) {
            return ICON_MAP[pathKey];
        }
    }

    // 默认图标
    return ICON_MAP.default || Layout;
}

/**
 * 获取分组信息
 */
function getGroupInfo(menu: Menu): { title: string; color: string } {
    // 优先使用 group_id
    if (menu.group_id) {
        const groupInfo = GROUP_CONFIG[menu.group_id];
        if (groupInfo) {
            return groupInfo;
        }
    }

    // 其次使用 code 映射
    if (menu.code && CODE_TO_GROUP_MAP[menu.code]) {
        const groupKey = CODE_TO_GROUP_MAP[menu.code];
        const groupInfo = GROUP_CONFIG[groupKey];
        if (groupInfo) {
            return groupInfo;
        }
    }

    // 默认分组
    return { title: '其他', color: 'text-slate-400' };
}

/**
 * 将后端 Menu 转换为前端 MenuItem（用于 Sidebar）
 */
function convertMenuToMenuItem(menu: Menu): MenuItem {
    const children = menu.children && menu.children.length > 0
        ? menu.children.map(child => convertMenuToMenuItem(child))
        : undefined;

    // 优先使用菜单中存储的图标名称（如果后端支持 icon 字段）
    // 否则使用自动查找逻辑
    const storedIconName = menu.icon;
    const icon = storedIconName
        ? getIconByNameUtil(storedIconName)
        : getMenuIcon(menu, storedIconName);

    return {
        id: menu.code || menu.id, // 使用 code 作为 id，如果没有则使用 id
        label: menu.name,
        icon: icon,
        children,
    };
}

/**
 * 过滤菜单（根据 enabled、visible、show_in_nav）
 */
function filterMenu(menu: Menu): boolean {
    // 只显示启用、可见且在导航中显示的菜单
    return menu.enabled && menu.visible && menu.show_in_nav;
}

/**
 * 递归过滤菜单树
 */
function filterMenuTree(menus: Menu[]): Menu[] {
    return menus
        .filter(filterMenu)
        .map(menu => ({
            ...menu,
            children: menu.children && menu.children.length > 0
                ? filterMenuTree(menu.children)
                : undefined,
        }))
        .filter(menu => {
            // 如果有子菜单，即使自己被过滤，如果子菜单存在也要保留
            if (menu.children && menu.children.length > 0) {
                return true;
            }
            // 如果是目录类型，即使没有子菜单也保留（可能是空的）
            if (menu.type === 'directory') {
                return true;
            }
            // 其他情况按原逻辑
            return filterMenu(menu);
        });
}

/**
 * 将后端菜单树转换为前端 MenuGroup 格式
 */
export function transformMenuTreeToMenuGroups(
    menus: Menu[],
    productId: ProductId
): MenuGroup[] {
    // 1. 过滤菜单（只保留启用、可见、在导航中显示的）
    const filteredMenus = filterMenuTree(menus);

    // 2. 按分组组织菜单
    const groupMap = new Map<string, Menu[]>();

    // 遍历所有菜单，按分组归类
    const traverse = (menuList: Menu[]) => {
        menuList.forEach(menu => {
            // 确定分组key
            let groupKey = menu.group_id;
            if (!groupKey && menu.code) {
                groupKey = CODE_TO_GROUP_MAP[menu.code] || 'other';
            }
            if (!groupKey) {
                groupKey = 'other';
            }

            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, []);
            }

            // 只添加顶级菜单（没有 parent_id 的）
            if (!menu.parent_id) {
                groupMap.get(groupKey)!.push(menu);
            }

            // 递归处理子菜单
            if (menu.children && menu.children.length > 0) {
                traverse(menu.children);
            }
        });
    };

    traverse(filteredMenus);

    // 3. 转换为 MenuGroup 格式
    const menuGroups: MenuGroup[] = [];

    groupMap.forEach((menuList, groupKey) => {
        if (menuList.length === 0) return;

        // 获取分组信息
        const groupInfo = GROUP_CONFIG[groupKey] || { title: '其他', color: 'text-slate-400' };

        // 转换为 MenuItem
        const items = menuList
            .sort((a, b) => a.order - b.order) // 按 order 排序
            .map(convertMenuToMenuItem);

        menuGroups.push({
            title: groupInfo.title,
            color: groupInfo.color,
            items,
        });
    });

    // 4. 按预定义顺序排序分组
    const groupOrder: Record<string, number> = {
        'data_service': 1,
        'data_application': 2,
        'semantic_governance': 3,
        'semantic_asset': 4,
        'data_connection': 5,
        'platform_management': 6,
        'agent_factory': 1,
        'agent_capability': 2,
        'agent_governance': 3,
        'other': 999,
    };

    menuGroups.sort((a, b) => {
        // 找到对应的groupKey
        const aKey = Array.from(groupMap.entries()).find(([key, menus]) => {
            const info = GROUP_CONFIG[key] || { title: '其他', color: 'text-slate-400' };
            return info.title === a.title;
        })?.[0] || 'other';

        const bKey = Array.from(groupMap.entries()).find(([key, menus]) => {
            const info = GROUP_CONFIG[key] || { title: '其他', color: 'text-slate-400' };
            return info.title === b.title;
        })?.[0] || 'other';

        const aOrder = groupOrder[aKey] || 999;
        const bOrder = groupOrder[bKey] || 999;

        return aOrder - bOrder;
    });

    return menuGroups;
}

/**
 * 根据产品ID过滤菜单（如果后端支持按产品过滤）
 * 如果后端不支持，这里可以根据菜单 code 的前缀来过滤
 */
export function filterMenusByProduct(menus: Menu[], productId: ProductId): Menu[] {
    if (productId === 'governance') {
        // 过滤出治理相关的菜单（排除 agent_ 开头的）
        return menus.filter(menu => {
            if (menu.code?.startsWith('agent_')) {
                return false;
            }
            return true;
        });
    } else if (productId === 'agent_factory') {
        // 过滤出智能体工厂相关的菜单（只保留 agent_ 开头的）
        return menus.filter(menu => {
            if (menu.code?.startsWith('agent_')) {
                return true;
            }
            // 也保留一些通用菜单（如平台管理）
            if (menu.code === 'menu_mgmt' || menu.code === 'audit_log') {
                return true;
            }
            return false;
        });
    }

    return menus;
}
