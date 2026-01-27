export type UserStatusCode = 0 | 1 | 2 | 3 | 4;

export interface RoleBinding {
    id: number;
    user_id: string;
    org_id: string;
    position?: string;
    permission_role?: string;
}

export interface AuditLog {
    id: number;
    action: string;
    operator: string;
    operator_id: string;
    changes?: Record<string, unknown>;
    timestamp: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    dept_id?: string;
    status: UserStatusCode;
    account_source: string;
    last_login?: string;
    created_at: string;
    created_by?: string;
    updated_at: string;
    updated_by?: string;
}

export interface ListUsersParams {
    page: number;
    page_size: number;
    keyword?: string;
    dept_id?: string;
    status?: UserStatusCode;
    account_source?: string;
    permission_role?: string;
    sort_field?: string;
    sort_order?: 'asc' | 'desc';
}

export interface ListUsersResp {
    total: number;
    page: number;
    page_size: number;
    users: User[];
}

export interface GetUserResp {
    user: User;
    role_bindings: RoleBinding[];
    audit_logs: AuditLog[];
}

export interface CreateUserReq {
    name: string;
    email: string;
    phone?: string;
    dept_id: string;
    role_bindings?: Array<{
        org_id: string;
        position?: string;
        permission_role?: string;
    }>;
    account_source: 'local' | 'sso';
    send_invitation?: boolean;
    initial_password?: string;
}

export interface CreateUserResp {
    user_id: string;
    initial_password?: string;
}

export interface UpdateUserReq {
    name?: string;
    phone?: string;
    dept_id?: string;
    role_bindings?: Array<{
        org_id: string;
        position?: string;
        permission_role?: string;
    }>;
}

export interface BatchUpdateStatusReq {
    user_ids: string[];
    status: UserStatusCode;
    reason?: string;
}

export interface BatchUpdateStatusResp {
    success_count: number;
    failed_count: number;
    errors?: Array<{ user_id: string; reason: string }>;
}

export interface DeleteUserReq {
    transfer_to?: string;
    force?: boolean;
}

export interface DeleteUserResp {
    archived: boolean;
    impacts_transferred: boolean;
}

export interface GetStatisticsResp {
    total: number;
    active: number;
    locked: number;
    inactive: number;
    no_org_binding: number;
    no_permission_role: number;
    recent_active_rate: number;
}

const API_BASE = '/api/v1/user_management';

const buildHeaders = (hasBody: boolean) => {
    const headers: Record<string, string> = {};
    if (hasBody) {
        headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('auth_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const request = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_BASE}${path}`, options);
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

    // 业务状态码检查：如果 code > 0 则视为错误
    if (data && typeof data === 'object' && 'code' in data) {
        const code = Number(data.code);
        if (code > 0) {
            const msg = data.msg || data.message || data.description || data.error || `操作失败 (Code: ${code})`;
            throw new Error(msg);
        }
    }

    return data as T;
};

export const userManagementService = {
    listUsers(params: ListUsersParams): Promise<ListUsersResp> {
        const search = new URLSearchParams();
        search.set('page', String(params.page));
        search.set('page_size', String(params.page_size));
        if (params.keyword) search.set('keyword', params.keyword);
        if (params.dept_id) search.set('dept_id', params.dept_id);
        if (params.status !== undefined) search.set('status', String(params.status));
        if (params.account_source) search.set('account_source', params.account_source);
        if (params.permission_role) search.set('permission_role', params.permission_role);
        if (params.sort_field) search.set('sort_field', params.sort_field);
        if (params.sort_order) search.set('sort_order', params.sort_order);
        const query = search.toString();
        return request<ListUsersResp>(`/users${query ? `?${query}` : ''}`, {
            method: 'GET',
            headers: buildHeaders(false),
        });
    },

    getUser(userId: string): Promise<GetUserResp> {
        return request<GetUserResp>(`/users/${userId}`, {
            method: 'GET',
            headers: buildHeaders(false),
        });
    },

    createUser(data: CreateUserReq): Promise<CreateUserResp> {
        return request<CreateUserResp>('/users', {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(data),
        });
    },

    updateUser(userId: string, data: UpdateUserReq): Promise<void> {
        return request<void>(`/users/${userId}`, {
            method: 'PUT',
            headers: buildHeaders(true),
            body: JSON.stringify(data),
        });
    },

    batchUpdateStatus(data: BatchUpdateStatusReq): Promise<BatchUpdateStatusResp> {
        return request<BatchUpdateStatusResp>('/users/batch-status', {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(data),
        });
    },

    unlockUser(userId: string, reason?: string): Promise<void> {
        return request<void>(`/users/${userId}/unlock`, {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(reason ? { reason } : {}),
        });
    },

    deleteUser(userId: string, data?: DeleteUserReq): Promise<DeleteUserResp> {
        return request<DeleteUserResp>(`/users/${userId}`, {
            method: 'DELETE',
            headers: buildHeaders(true),
            body: JSON.stringify(data ?? {}),
        });
    },

    getStatistics(): Promise<GetStatisticsResp> {
        return request<GetStatisticsResp>('/statistics', {
            method: 'GET',
            headers: buildHeaders(false),
        });
    },
};
