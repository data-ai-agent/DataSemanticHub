import { API_ENDPOINTS } from '../config/api';

export type MenuStatus = '启用' | '隐藏' | '停用';
export type MenuType = '目录' | '页面' | '操作' | '外链';

export interface MenuItem {
    id: string;
    name: string;
    code: string;
    path: string;
    group: string;
    type: MenuType;
    visibility: '显示' | '隐藏';
    enablement: '启用' | '停用';
    status: MenuStatus;
    parentId: string | null;
    order: number;
    icon: string;
    permission: string;
    associatedRoles?: string[];
    owner: string;
    builtIn: boolean;
    updatedAt: string;
    url?: string;
    openMode?: '新窗口' | '当前';
}

export interface PermissionItem {
    key: string;
    name: string;
    description?: string;
}

const MOCK_MENUS: MenuItem[] = [
    {
        id: 'menu_dashboard',
        name: '语义治理总览',
        code: 'dashboard',
        path: '/dashboard',
        group: '语义治理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 1,
        icon: 'Activity',
        permission: 'view_dashboard',
        associatedRoles: ['平台管理员', '语义治理专员'],
        owner: '平台管理员',
        builtIn: true,
        updatedAt: '2024-06-25'
    },
    {
        id: 'menu_semantic_modeling',
        name: '语义建模',
        code: 'semantic_modeling',
        path: '/semantic/modeling',
        group: '语义治理',
        type: '目录',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 2,
        icon: 'Layout',
        permission: 'view_semantic_modeling',
        associatedRoles: ['平台管理员'],
        owner: '平台管理员',
        builtIn: true,
        updatedAt: '2024-06-23'
    },
    {
        id: 'menu_modeling_overview',
        name: '语义建模概览',
        code: 'modeling_overview',
        path: '/semantic/modeling/overview',
        group: '语义治理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: 'menu_semantic_modeling',
        order: 1,
        icon: 'Activity',
        permission: 'view_modeling_overview',
        associatedRoles: ['语义治理专员'],
        owner: '语义治理中心',
        builtIn: true,
        updatedAt: '2024-06-23'
    },
    {
        id: 'menu_business_object',
        name: '业务对象建模',
        code: 'td_modeling',
        path: '/semantic/modeling/bo',
        group: '语义治理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: 'menu_semantic_modeling',
        order: 2,
        icon: 'Layout',
        permission: 'manage_business_object',
        associatedRoles: ['语义治理专员'],
        owner: '语义治理中心',
        builtIn: false,
        updatedAt: '2024-06-20'
    },
    {
        id: 'menu_resource_network',
        name: '资源知识网络',
        code: 'resource_knowledge_network',
        path: '/assets/knowledge',
        group: '语义资产管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 1,
        icon: 'Network',
        permission: 'view_resource_network',
        owner: '语义治理中心',
        builtIn: false,
        updatedAt: '2024-06-18'
    },
    {
        id: 'menu_ask_data',
        name: '问数',
        code: 'ask_data',
        path: '/data/ask',
        group: '数据服务',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 1,
        icon: 'MessageCircle',
        permission: 'use_ask_data',
        owner: '数据服务运营',
        builtIn: false,
        updatedAt: '2024-06-19'
    },
    {
        id: 'menu_org_mgmt',
        name: '组织架构管理',
        code: 'org_mgmt',
        path: '/platform/org',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 1,
        icon: 'Building2',
        permission: 'manage_org',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-27'
    },
    {
        id: 'menu_user_permission',
        name: '角色与权限',
        code: 'user_permission',
        path: '/platform/permission',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 4,
        icon: 'Users',
        permission: 'manage_permissions',
        owner: '平台管理员',
        builtIn: true,
        updatedAt: '2024-06-15'
    },
    {
        id: 'menu_user_mgmt',
        name: '用户管理',
        code: 'user_mgmt',
        path: '/platform/users',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 2,
        icon: 'UserCog',
        permission: 'manage_user',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-27'
    },
    {
        id: 'menu_workflow_mgmt',
        name: '工作流管理',
        code: 'workflow_mgmt',
        path: '/platform/workflow',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 5,
        icon: 'GitBranch',
        permission: 'manage_workflow',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-27'
    },
    {
        id: 'menu_approval_policy',
        name: '审批策略',
        code: 'approval_policy',
        path: '/platform/approval',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 6,
        icon: 'FileCheck',
        permission: 'manage_approval_policy',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-27'
    },
    {
        id: 'menu_audit_log',
        name: '审计日志',
        code: 'audit_log',
        path: '/platform/audit',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 7,
        icon: 'FileText',
        permission: 'view_audit_log',
        owner: '安全审计',
        builtIn: true,
        updatedAt: '2024-06-16'
    },
    {
        id: 'menu_menu_mgmt',
        name: '菜单管理',
        code: 'menu_mgmt',
        path: '/platform/menu',
        group: '平台管理',
        type: '页面',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 3,
        icon: 'LayoutGrid',
        permission: 'manage_menu',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-26'
    },
    {
        id: 'menu_external_doc',
        name: '帮助文档',
        code: 'help_doc',
        path: '',
        url: 'https://docs.example.com/semantic-hub',
        openMode: '新窗口',
        group: '平台管理',
        type: '外链',
        visibility: '显示',
        enablement: '启用',
        status: '启用',
        parentId: null,
        order: 8,
        icon: 'Link2',
        permission: '',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-28'
    },
    {
        id: 'menu_hidden_feature',
        name: '测试功能',
        code: 'test_feature',
        path: '/platform/test',
        group: '平台管理',
        type: '页面',
        visibility: '隐藏',
        enablement: '启用',
        status: '隐藏',
        parentId: null,
        order: 99,
        icon: 'Settings',
        permission: '',
        owner: '平台管理员',
        builtIn: false,
        updatedAt: '2024-06-28'
    }
];

const buildHeaders = (hasBody: boolean) => {
    const headers: Record<string, string> = {};
    if (hasBody) {
        headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(url, options);
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const error = await response.json();
            message = error?.message || error?.msg || error?.error || message;
        } catch {
            // Ignore JSON parse errors
        }
        throw new Error(message);
    }
    if (response.status === 204) {
        return undefined as T;
    }
    const data = await response.json();
    if (data && typeof data === 'object' && 'code' in data) {
        const code = Number(data.code);
        if (code > 0 && code !== 200) { // Assuming 200 is success, adjusting based on common practices or userManagement.ts which says > 0 is error
            const msg = data.msg || data.message || `操作失败 (Code: ${code})`;
            throw new Error(msg);
        }
        return (data.data || data) as T; // Adjust based on wrapper structure
    }
    return data as T;
};

export const menuService = {
    getMenus: async (): Promise<MenuItem[]> => {
        try {
            return await request<MenuItem[]>(API_ENDPOINTS.SYSTEM.MENUS_LIST, {
                method: 'GET',
                headers: buildHeaders(false),
            });
        } catch (error) {
            console.warn('Failed to fetch menus, using mock data:', error);
            // Fallback to mock data if API fails
            return Promise.resolve(MOCK_MENUS);
        }
    },

    createMenu: async (menu: Omit<MenuItem, 'id' | 'updatedAt'>): Promise<MenuItem> => {
        // Mock implementation for development if API fails
        // In real app, we would throw error, but for dev smoothness:
        // const newMenu = { ...menu, id: `menu_${Date.now()}`, updatedAt: new Date().toISOString() } as MenuItem;
        // MOCK_MENUS.unshift(newMenu);
        // return Promise.resolve(newMenu);

        return request<MenuItem>(API_ENDPOINTS.SYSTEM.MENU_CREATE, {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(menu),
        });
    },

    updateMenu: async (id: string, menu: Partial<MenuItem>): Promise<void> => {
        return request<void>(API_ENDPOINTS.SYSTEM.MENU_DETAIL(id), {
            method: 'PUT',
            headers: buildHeaders(true),
            body: JSON.stringify(menu),
        });
    },

    deleteMenu: async (id: string): Promise<void> => {
        return request<void>(API_ENDPOINTS.SYSTEM.MENU_DETAIL(id), {
            method: 'DELETE',
            headers: buildHeaders(false),
        });
    },

    getPermissions: async (): Promise<PermissionItem[]> => {
        try {
            // return await request<PermissionItem[]>(API_ENDPOINTS.SYSTEM.MENU_PERMISSIONS, {
            //     method: 'GET',
            //     headers: buildHeaders(false),
            // });
            // Mock permissions for now as requested by user instructions to support the selection
            return Promise.resolve([
                { key: 'view_dashboard', name: '查看仪表盘' },
                { key: 'manage_menu', name: '菜单管理' },
                { key: 'manage_user', name: '用户管理' },
                { key: 'view_audit_log', name: '查看审计日志' },
                { key: 'manage_system', name: '系统管理' },
                { key: 'view_reports', name: '查看报表' },
            ]);
        } catch (error) {
            return [];
        }
    }
};
