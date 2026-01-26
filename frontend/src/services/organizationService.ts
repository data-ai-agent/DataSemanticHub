
export interface OrgTreeNode {
    id: string;
    parentId: string;
    name: string;
    code: string;
    type: number; // 1: Tenant/Root, 2: Department
    status: number; // 0: Disabled, 1: Enabled
    sortOrder: number;
    leaderId: string;
    leaderName: string;
    children: OrgTreeNode[];
}

export interface GetOrgTreeReq {
    name?: string;
    status?: number;
}

export interface GetOrgTreeResp {
    tree: OrgTreeNode[];
}

export interface OrgDetail {
    id: string;
    parentId: string;
    parentName: string;
    name: string;
    code: string;
    ancestors: string;
    sortOrder: number;
    leaderId: string;
    leaderName: string;
    type: number;
    status: number;
    desc: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrgReq {
    parentId: string;
    name: string;
    code?: string;
    sortOrder?: number;
    leaderId?: string;
    type?: number; // 1: Tenant, 2: Dept (default 2)
    desc?: string;
}

export interface CreateOrgResp {
    id: string;
}

export interface UpdateOrgReq {
    name?: string;
    code?: string;
    sortOrder?: number;
    leaderId?: string;
    status?: number;
    desc?: string;
}

export interface MoveOrgReq {
    id: string;
    targetParentId: string;
    sortOrders?: string[];
}

export interface DeptUser {
    userId: string;
    userName: string;
    isPrimary: boolean;
}

export interface GetOrgUsersResp {
    users: DeptUser[];
}

export interface SetUserPrimaryDeptReq {
    userId: string;
    deptId: string;
}

export interface SetUserPrimaryDeptResp {
    success: boolean;
}

export interface AddUserAuxDeptReq {
    userId: string;
    deptId: string;
}

export interface AddUserAuxDeptResp {
    success: boolean;
}

export interface RemoveUserAuxDeptReq {
    userId: string;
    deptId: string;
}

export interface RemoveUserAuxDeptResp {
    success: boolean;
}

const API_BASE = '/api/v1/system';

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

    // Business status code check
    if (data && typeof data === 'object' && 'code' in data) {
        const code = Number(data.code);
        if (code > 0) {
            const msg = data.msg || data.message || data.description || data.error || `Operation failed (Code: ${code})`;
            throw new Error(msg);
        }
    }

    return data as T;
};

export const organizationService = {
    getOrgTree(params: GetOrgTreeReq = {}): Promise<GetOrgTreeResp> {
        const search = new URLSearchParams();
        if (params.name) search.set('name', params.name);
        if (params.status !== undefined) search.set('status', String(params.status));

        const query = search.toString();
        return request<GetOrgTreeResp>(`/organization/tree${query ? `?${query}` : ''}`, {
            method: 'GET',
            headers: buildHeaders(false),
        });
    },

    getOrgDetail(id: string): Promise<{ detail: OrgDetail }> {
        return request<{ detail: OrgDetail }>(`/organization/${id}`, {
            method: 'GET',
            headers: buildHeaders(false),
        });
    },

    createOrg(data: CreateOrgReq): Promise<CreateOrgResp> {
        return request<CreateOrgResp>('/organization', {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(data),
        });
    },

    updateOrg(id: string, data: UpdateOrgReq): Promise<{ success: boolean }> {
        return request<{ success: boolean }>(`/organization/${id}`, {
            method: 'PUT',
            headers: buildHeaders(true),
            body: JSON.stringify(data),
        });
    },

    deleteOrg(id: string): Promise<{ success: boolean }> {
        return request<{ success: boolean }>(`/organization/${id}`, {
            method: 'DELETE',
            headers: buildHeaders(false),
        });
    },

    moveOrg(data: MoveOrgReq): Promise<{ success: boolean }> {
        return request<{ success: boolean }>('/organization/move', {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(data),
        });
    },

    getOrgUsers(id: string, recursive: boolean = false): Promise<GetOrgUsersResp> {
        return request<GetOrgUsersResp>(`/organization/${id}/users?recursive=${recursive}`, {
            method: 'GET',
            headers: buildHeaders(false),
        });
    },

    setUserPrimaryDept(data: SetUserPrimaryDeptReq): Promise<SetUserPrimaryDeptResp> {
        return request<SetUserPrimaryDeptResp>('/user/primary-dept', {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(data),
        });
    },

    addUserAuxDept(data: AddUserAuxDeptReq): Promise<AddUserAuxDeptResp> {
        return request<AddUserAuxDeptResp>('/user/aux-dept', {
            method: 'POST',
            headers: buildHeaders(true),
            body: JSON.stringify(data),
        });
    },

    removeUserAuxDept(data: RemoveUserAuxDeptReq): Promise<RemoveUserAuxDeptResp> {
        return request<RemoveUserAuxDeptResp>(`/user/${data.userId}/aux-dept/${data.deptId}`, {
            method: 'DELETE',
            headers: buildHeaders(false),
        });
    }
};
