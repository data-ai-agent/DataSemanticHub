import { systemServiceClient } from '../utils/serviceClient';
import type { ErrorResponse } from '../utils/httpClient';

// ==================== 类型定义 ====================

/**
 * 菜单类型
 */
export type MenuType = 'directory' | 'page' | 'external' | 'button';

/**
 * 菜单状态
 */
export type MenuStatus = '启用' | '隐藏' | '停用';

/**
 * 菜单项（与后端 API 类型对应）
 */
export interface Menu {
    id: string; // UUID v7
    name: string;
    code: string;
    type: MenuType; // directory/page/external/button
    group_id?: string;
    parent_id?: string;
    path?: string;
    route_name?: string;
    component_key?: string;
    external_url?: string;
    open_mode?: 'new' | 'iframe' | 'same';
    permission_key?: string;
    icon?: string; // 图标名称（如 'Layout', 'Database'）
    visible: boolean;
    enabled: boolean;
    order: number;
    show_in_nav: boolean;
    cacheable: boolean;
    children_count: number;
    risk_flags?: string[]; // UNBOUND_PERMISSION/ROUTE_CONFLICT/ORDER_CONFLICT
    created_at: string;
    created_by?: string;
    updated_at: string;
    updated_by?: string;
    children?: Menu[]; // 树形结构
}

/**
 * 权限项
 */
export interface PermissionItem {
    key: string;
    name: string;
    description?: string;
}

/**
 * 菜单树查询参数
 */
export interface GetMenuTreeParams {
    keyword?: string; // 搜索关键词（name/code/path/permission_key）
    enabled?: boolean; // 是否启用
    visible?: boolean; // 是否可见
    permission_bind?: 'bound' | 'unbound'; // 权限绑定状态
    type?: MenuType; // 类型：directory/page/external/button
    group_id?: string; // 分组ID
}

/**
 * 菜单树响应
 */
export interface GetMenuTreeResp {
    menus: Menu[];
}

/**
 * 菜单详情响应
 */
export interface GetMenuResp {
    menu: Menu;
    audit_summary?: {
        last_operator_id?: string;
        last_operator_name?: string;
        last_operation_at?: string;
    };
}

/**
 * 创建菜单请求
 */
export interface CreateMenuReq {
    name: string;
    code: string;
    type: MenuType;
    group_id?: string;
    parent_id?: string;
    path?: string;
    route_name?: string;
    component_key?: string;
    external_url?: string;
    open_mode?: 'new' | 'iframe' | 'same';
    permission_key?: string;
    icon?: string; // 图标名称
    visible?: boolean;
    enabled?: boolean;
    order?: number;
    show_in_nav?: boolean;
    cacheable?: boolean;
    create_permission?: boolean;
    permission_name?: string;
}

/**
 * 创建菜单响应
 */
export interface CreateMenuResp {
    menu: Menu;
}

/**
 * 更新菜单请求
 */
export interface UpdateMenuReq {
    name?: string;
    code?: string;
    type?: MenuType;
    group_id?: string;
    parent_id?: string;
    path?: string;
    route_name?: string;
    component_key?: string;
    external_url?: string;
    open_mode?: 'new' | 'iframe' | 'same';
    permission_key?: string;
    icon?: string; // 图标名称
    visible?: boolean;
    enabled?: boolean;
    order?: number;
    show_in_nav?: boolean;
    cacheable?: boolean;
}

/**
 * 更新菜单响应
 */
export interface UpdateMenuResp {
    menu: Menu;
}

/**
 * 删除菜单请求
 */
export interface DeleteMenuReq {
    cascade?: boolean; // 是否级联删除
}

/**
 * 删除菜单响应
 */
export interface DeleteMenuResp {
    impact_info?: {
        children_count: number;
    };
}

/**
 * 切换菜单启用状态请求
 */
export interface ToggleMenuEnabledReq {
    enabled: boolean;
}

/**
 * 切换菜单启用状态响应
 */
export interface ToggleMenuEnabledResp {
    menu: Menu;
}

/**
 * 切换菜单可见状态请求
 */
export interface ToggleMenuVisibleReq {
    visible: boolean;
}

/**
 * 切换菜单可见状态响应
 */
export interface ToggleMenuVisibleResp {
    menu: Menu;
}

/**
 * 移动菜单请求
 */
export interface MoveMenuReq {
    new_parent_id?: string; // 新父级ID（空表示移到根节点）
    new_order: number; // 新位置（同级排序）
}

/**
 * 移动菜单响应
 */
export interface MoveMenuResp {
    menu: Menu;
}

/**
 * 批量排序请求
 */
export interface ReorderMenusReq {
    updates: Array<{
        id: string;
        order: number;
    }>;
}

/**
 * 批量排序响应
 */
export interface ReorderMenusResp {
    success_count: number;
    failed_count: number;
    errors?: Array<{
        id: string;
        reason: string;
    }>;
}

/**
 * 绑定权限请求
 */
export interface BindPermissionReq {
    permission_key?: string; // 已有权限标识
    create_permission?: boolean; // 是否创建新权限
    permission_name?: string; // 新权限名称
}

/**
 * 绑定权限响应
 */
export interface BindPermissionResp {
    menu: Menu;
}

/**
 * 审计日志项
 */
export interface MenuAuditLog {
    id: string;
    menu_id: string;
    operation_type: string; // create/update/delete/move/reorder/enable/disable/show/hide/bind_permission
    operator_id?: string;
    operator_name?: string;
    changed_fields?: string[];
    old_value?: Record<string, any>;
    new_value?: Record<string, any>;
    remark?: string;
    created_at: string;
}

/**
 * 查询审计日志参数
 */
export interface GetMenuAuditsParams {
    page?: number;
    page_size?: number;
    operation_type?: string;
    operator_id?: string;
    start_time?: string;
    end_time?: string;
}

/**
 * 审计日志查询响应
 */
export interface GetMenuAuditsResp {
    total: number;
    page: number;
    page_size: number;
    logs: MenuAuditLog[];
}

/**
 * 风险项
 */
export interface RiskItem {
    menu_id: string;
    menu_name: string;
    menu_code: string;
    risk_type: 'UNBOUND_PERMISSION' | 'ROUTE_CONFLICT' | 'ORDER_CONFLICT';
    description: string;
}

/**
 * 风险巡检响应
 */
export interface GetMenuInspectionResp {
    risks: RiskItem[];
}

/**
 * KPI 统计响应
 */
export interface GetMenuStatsResp {
    total: number;
    enabled: number;
    hidden: number;
    unbound_permission: number;
}

// ==================== 错误处理 ====================

/**
 * 解析菜单管理错误响应
 */
const parseMenuError = async (response: Response): Promise<Error & ErrorResponse> => {
    const data = await response.json().catch(() => ({}));

    if (data.description) {
        return Object.assign(new Error(data.description), {
            title: '操作失败',
            message: data.description,
            solution: data.solution,
            cause: data.cause,
            code: data.code,
            httpStatus: response.status,
        });
    }

    if (data.msg) {
        return Object.assign(new Error(data.msg), {
            title: '操作失败',
            message: data.msg,
            code: data.code,
            httpStatus: response.status,
        });
    }

    return Object.assign(new Error('操作失败'), {
        title: '操作失败',
        message: `服务器返回 ${response.status}`,
        httpStatus: response.status,
    });
};

const fetchMenuTree = async (params?: GetMenuTreeParams): Promise<Menu[]> => {
    const searchParams = new URLSearchParams();
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    if (params?.enabled !== undefined) searchParams.set('enabled', String(params.enabled));
    if (params?.visible !== undefined) searchParams.set('visible', String(params.visible));
    if (params?.permission_bind) searchParams.set('permission_bind', params.permission_bind);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.group_id) searchParams.set('group_id', params.group_id);

    const query = searchParams.toString();
    const url = `/menus/tree${query ? `?${query}` : ''}`;

    const response = await systemServiceClient(url, {
        method: 'GET',
    });

    if (!response.ok) {
        throw await parseMenuError(response);
    }

    const result = await response.json();
    return result.menus || [];
};

const collectPermissionItems = (menus: Menu[]): PermissionItem[] => {
    const permissionMap = new Map<string, PermissionItem>();
    const walk = (items: Menu[]) => {
        items.forEach((menu) => {
            if (menu.permission_key) {
                if (!permissionMap.has(menu.permission_key)) {
                    permissionMap.set(menu.permission_key, {
                        key: menu.permission_key,
                        name: menu.name || menu.permission_key,
                    });
                }
            }
            if (menu.children && menu.children.length > 0) {
                walk(menu.children);
            }
        });
    };
    walk(menus);
    return Array.from(permissionMap.values());
};

// ==================== 类型转换函数 ====================

/**
 * 将前端 MenuItem 转换为后端 CreateMenuReq
 */
function convertMenuItemToCreateReq(item: Omit<MenuItem, 'id' | 'updatedAt'>): CreateMenuReq {
    const typeMap: Record<'目录' | '页面' | '操作' | '外链', MenuType> = {
        '目录': 'directory',
        '页面': 'page',
        '外链': 'external',
        '操作': 'button',
    };

    const openModeMap: Record<'新窗口' | '当前', 'new' | 'iframe' | 'same'> = {
        '新窗口': 'new',
        '当前': 'same',
    };

    const req: CreateMenuReq = {
        name: item.name,
        code: item.code,
        type: typeMap[item.type] || 'page',
        visible: item.visibility === '显示',
        enabled: item.enablement === '启用',
        order: item.order,
        show_in_nav: true,
        cacheable: false,
    };

    if (item.group) req.group_id = item.group;
    if (item.parentId) req.parent_id = item.parentId;
    if (item.path) req.path = item.path;
    if (item.permission) req.permission_key = item.permission;
    if (item.url) req.external_url = item.url;
    if (item.openMode) req.open_mode = openModeMap[item.openMode] || 'new';
    if (item.icon) req.icon = item.icon; // 添加图标字段

    return req;
}

/**
 * 将前端 MenuItem 转换为后端 UpdateMenuReq
 */
function convertMenuItemToUpdateReq(item: Partial<MenuItem>): UpdateMenuReq {
    const typeMap: Record<'目录' | '页面' | '操作' | '外链', MenuType> = {
        '目录': 'directory',
        '页面': 'page',
        '外链': 'external',
        '操作': 'button',
    };

    const openModeMap: Record<'新窗口' | '当前', 'new' | 'iframe' | 'same'> = {
        '新窗口': 'new',
        '当前': 'same',
    };

    const req: UpdateMenuReq = {};

    if (item.name !== undefined) req.name = item.name;
    if (item.code !== undefined) req.code = item.code;
    if (item.type !== undefined) req.type = typeMap[item.type] || 'page';
    if (item.group !== undefined) req.group_id = item.group || '';
    if (item.parentId !== undefined) req.parent_id = item.parentId || '';
    if (item.path !== undefined) req.path = item.path || '';
    if (item.permission !== undefined) req.permission_key = item.permission || '';
    if (item.url !== undefined) req.external_url = item.url || '';
    if (item.openMode !== undefined) req.open_mode = openModeMap[item.openMode] || 'new';
    if (item.visibility !== undefined) req.visible = item.visibility === '显示';
    if (item.enablement !== undefined) req.enabled = item.enablement === '启用';
    if (item.order !== undefined) req.order = item.order;
    if (item.icon !== undefined) req.icon = item.icon; // 添加图标字段
    if (item.status !== undefined) {
        // status 是 '启用' | '隐藏' | '停用'
        req.enabled = item.status === '启用';
        req.visible = item.status !== '隐藏';
    }

    return req;
}

// ==================== Menu Service ====================

export const menuService = {
    /**
     * 获取菜单树
     */
    async getMenuTree(params?: GetMenuTreeParams): Promise<Menu[]> {
        return fetchMenuTree(params);
    },

    /**
     * 获取菜单详情
     */
    async getMenu(id: string): Promise<GetMenuResp> {
        const response = await systemServiceClient(`/menus/${id}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        return response.json();
    },

    /**
     * 创建菜单
     * 支持向后兼容：如果传入的是 MenuItem 格式，会自动转换并返回 MenuItem
     */
    async createMenu(data: CreateMenuReq | Omit<MenuItem, 'id' | 'updatedAt'>): Promise<Menu | MenuItem> {
        let req: CreateMenuReq;
        const isMenuItem = 'type' in data && typeof data.type === 'string' && ['目录', '页面', '操作', '外链'].includes(data.type);
        
        // 检查是否是 MenuItem 格式（向后兼容）
        if (isMenuItem) {
            req = convertMenuItemToCreateReq(data as Omit<MenuItem, 'id' | 'updatedAt'>);
        } else {
            req = data as CreateMenuReq;
        }

        const response = await systemServiceClient('/menus', {
            method: 'POST',
            body: JSON.stringify(req),
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        const result = await response.json();
        const createdMenu: Menu = result.menu;
        
        // 如果调用者期望 MenuItem 格式，进行转换
        if (isMenuItem) {
            return convertMenuToMenuItem(createdMenu) as MenuItem;
        }
        return createdMenu as Menu;
    },

    /**
     * 更新菜单
     * 支持向后兼容：如果传入的是 MenuItem 格式，会自动转换
     */
    async updateMenu(id: string, data: UpdateMenuReq | Partial<MenuItem>): Promise<Menu | void> {
        let req: UpdateMenuReq;
        const isMenuItem = 'type' in data && typeof data.type === 'string' && ['目录', '页面', '操作', '外链'].includes(data.type);
        
        // 检查是否是 MenuItem 格式（向后兼容）
        if (isMenuItem) {
            req = convertMenuItemToUpdateReq(data as Partial<MenuItem>);
        } else {
            req = data as UpdateMenuReq;
        }

        const response = await systemServiceClient(`/menus/${id}`, {
            method: 'PUT',
            body: JSON.stringify(req),
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        // 如果调用者传入的是 MenuItem 格式，返回 void（向后兼容）
        if (isMenuItem) {
            return;
        }

        const result = await response.json();
        return result.menu;
    },

    /**
     * 删除菜单
     */
    async deleteMenu(id: string, cascade: boolean = false): Promise<DeleteMenuResp> {
        const searchParams = new URLSearchParams();
        if (cascade) searchParams.set('cascade', 'true');

        const query = searchParams.toString();
        const url = `/menus/${id}${query ? `?${query}` : ''}`;

        const response = await systemServiceClient(url, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        return response.json();
    },

    /**
     * 切换菜单启用状态
     */
    async toggleMenuEnabled(id: string, enabled: boolean): Promise<Menu> {
        const response = await systemServiceClient(`/menus/${id}/enabled`, {
            method: 'PATCH',
            body: JSON.stringify({ enabled }),
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        const result = await response.json();
        return result.menu;
    },

    /**
     * 切换菜单可见状态
     */
    async toggleMenuVisible(id: string, visible: boolean): Promise<Menu> {
        const response = await systemServiceClient(`/menus/${id}/visible`, {
            method: 'PATCH',
            body: JSON.stringify({ visible }),
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        const result = await response.json();
        return result.menu;
    },

    /**
     * 移动菜单
     */
    async moveMenu(id: string, data: MoveMenuReq): Promise<Menu> {
        const response = await systemServiceClient(`/menus/${id}/move`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        const result = await response.json();
        return result.menu;
    },

    /**
     * 批量排序菜单
     */
    async reorderMenus(data: ReorderMenusReq): Promise<ReorderMenusResp> {
        const response = await systemServiceClient('/menus/reorder', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        return response.json();
    },

    /**
     * 绑定权限
     */
    async bindPermission(id: string, data: BindPermissionReq): Promise<Menu> {
        const response = await systemServiceClient(`/menus/${id}/bind-permission`, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        const result = await response.json();
        return result.menu;
    },

    /**
     * 获取菜单审计日志
     */
    async getMenuAudits(id: string, params?: GetMenuAuditsParams): Promise<GetMenuAuditsResp> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.page_size) searchParams.set('page_size', String(params.page_size));
        if (params?.operation_type) searchParams.set('operation_type', params.operation_type);
        if (params?.operator_id) searchParams.set('operator_id', params.operator_id);
        if (params?.start_time) searchParams.set('start_time', params.start_time);
        if (params?.end_time) searchParams.set('end_time', params.end_time);

        const query = searchParams.toString();
        const url = `/menus/${id}/audits${query ? `?${query}` : ''}`;

        const response = await systemServiceClient(url, {
            method: 'GET',
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        return response.json();
    },

    /**
     * 获取风险巡检结果
     */
    async getMenuInspection(): Promise<GetMenuInspectionResp> {
        const response = await systemServiceClient('/menus/inspection', {
            method: 'GET',
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        return response.json();
    },

    /**
     * 获取 KPI 统计
     */
    async getMenuStats(): Promise<GetMenuStatsResp> {
        const response = await systemServiceClient('/menus/stats', {
            method: 'GET',
        });

        if (!response.ok) {
            throw await parseMenuError(response);
        }

        return response.json();
    },

    /**
     * 获取权限列表（暂时返回 mock 数据，后续可对接权限服务）
     */
    async getPermissions(): Promise<PermissionItem[]> {
        const menus = await fetchMenuTree();
        return collectPermissionItems(menus);
    },

    /**
     * 向后兼容：获取菜单列表（转换为 MenuItem 格式）
     * @deprecated 建议使用 getMenuTree 方法
     */
    async getMenus(): Promise<MenuItem[]> {
        try {
            const menus = await this.getMenuTree();
            // 将树形结构扁平化并转换为 MenuItem
            const flattenMenus = (menuList: Menu[]): MenuItem[] => {
                const result: MenuItem[] = [];
                const traverse = (menu: Menu) => {
                    result.push(convertMenuToMenuItem(menu));
                    if (menu.children && menu.children.length > 0) {
                        menu.children.forEach(traverse);
                    }
                };
                menuList.forEach(traverse);
                return result;
            };
            return flattenMenus(menus);
        } catch (error) {
            console.warn('Failed to fetch menus from API:', error);
            // 如果 API 失败，返回空数组而不是 mock 数据
            return [];
        }
    },

    /**
     * 向后兼容：创建菜单（接受 MenuItem 格式）
     * @deprecated 建议使用 createMenu 方法（接受 CreateMenuReq）
     */
    async createMenuFromItem(menu: Omit<MenuItem, 'id' | 'updatedAt'>): Promise<MenuItem> {
        const req = convertMenuItemToCreateReq(menu);
        const createdMenu = await this.createMenu(req);
        // createMenu 返回 Menu 或 MenuItem，这里我们需要 Menu 类型
        if ('type' in createdMenu && typeof createdMenu.type === 'string' && ['目录', '页面', '操作', '外链'].includes(createdMenu.type)) {
            return createdMenu as MenuItem;
        }
        return convertMenuToMenuItem(createdMenu as Menu);
    },

    /**
     * 向后兼容：更新菜单（接受 MenuItem 格式）
     * @deprecated 建议使用 updateMenu 方法（接受 UpdateMenuReq）
     */
    async updateMenuFromItem(id: string, menu: Partial<MenuItem>): Promise<void> {
        const req = convertMenuItemToUpdateReq(menu);
        await this.updateMenu(id, req);
    },
};

// ==================== 向后兼容的类型导出 ====================

/**
 * 向后兼容的菜单项类型（用于现有组件）
 */
export interface MenuItem {
    id: string;
    name: string;
    code: string;
    path: string;
    group: string;
    type: '目录' | '页面' | '操作' | '外链';
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
    riskFlags?: string[];
}

/**
 * 将后端 Menu 转换为前端 MenuItem（向后兼容）
 */
export function convertMenuToMenuItem(menu: Menu): MenuItem {
    const typeMap: Record<MenuType, '目录' | '页面' | '操作' | '外链'> = {
        directory: '目录',
        page: '页面',
        external: '外链',
        button: '操作',
    };

    const openModeMap: Record<string, '新窗口' | '当前'> = {
        new: '新窗口',
        iframe: '新窗口',
        same: '当前',
    };

    return {
        id: menu.id,
        name: menu.name,
        code: menu.code,
        path: menu.path || '',
        group: menu.group_id || '',
        type: typeMap[menu.type] || '页面',
        visibility: menu.visible ? '显示' : '隐藏',
        enablement: menu.enabled ? '启用' : '停用',
        status: menu.enabled ? (menu.visible ? '启用' : '隐藏') : '停用',
        parentId: menu.parent_id || null,
        order: menu.order,
        icon: menu.icon || '', // 使用后端返回的 icon 字段
        permission: menu.permission_key || '',
        owner: menu.created_by || '',
        builtIn: false, // 需要根据业务逻辑判断
        updatedAt: menu.updated_at,
        url: menu.external_url,
        openMode: menu.open_mode ? openModeMap[menu.open_mode] : undefined,
        riskFlags: menu.risk_flags,
    };
}

export type { ErrorResponse };
