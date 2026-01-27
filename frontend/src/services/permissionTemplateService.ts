/**
 * Permission Template Service
 *
 * Service layer for permission template API integration.
 * Handles data transformation between frontend and backend formats.
 *
 * Backend API: /api/v1/system/permission-templates
 * Backend Status: draft | published | disabled
 * Frontend Status: '草稿' | '已发布' | '停用'
 */

import { systemServiceClient } from '../utils/serviceClient';
import type { ErrorResponse } from '../utils/httpClient';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Backend Types (matching Go API contract)

export type BackendStatus = 'draft' | 'published' | 'disabled';

export type BackendScope = 'global' | 'organization' | 'domain' | 'project';

export interface PolicyMatrixEntry {
    actions: string[];
    scope?: string;
}

export interface AdvancedPermEntry {
    enabled: boolean;
    config?: Record<string, any>;
}

export interface CreatePermissionTemplateReq {
    name: string;
    code: string;
    description?: string;
    scope_suggestion: BackendScope;
    policy_matrix: Record<string, PolicyMatrixEntry>;
    advanced_perms?: Record<string, AdvancedPermEntry>;
}

export interface UpdatePermissionTemplateReq extends CreatePermissionTemplateReq {
    id: string;
}

export interface ListPermissionTemplatesReq {
    keyword?: string;
    status?: BackendStatus;
    scope_suggestion?: BackendScope;
    page?: number;
    page_size?: number;
}

export interface ClonePermissionTemplateReq {
    name: string;
    code: string;
}

export interface PermissionTemplateDetail {
    id: string;
    name: string;
    code: string;
    description: string;
    status: BackendStatus;
    scope_suggestion: BackendScope;
    policy_matrix: Record<string, PolicyMatrixEntry>;
    advanced_perms: Record<string, AdvancedPermEntry>;
    version: number;
    used_by_role_count: number;
    last_applied_at: string;
    created_by: string;
    created_at: string;
    updated_by: string;
    updated_at: string;
}

export interface PermissionTemplateItem {
    id: string;
    name: string;
    code: string;
    status: BackendStatus;
    scope_suggestion: BackendScope;
    version: number;
    updated_at: string;
}

export interface ListPermissionTemplatesResp {
    total: number;
    data: PermissionTemplateItem[];
}

export interface CreatePermissionTemplateResp {
    id: string;
}

export interface UpdatePermissionTemplateResp {
    success: boolean;
}

export interface PublishPermissionTemplateResp {
    success: boolean;
    version: number;
}

export interface ActionResp {
    success: boolean;
}

export interface GetPermissionTemplateResp {
    data: PermissionTemplateDetail;
}

// Frontend Types (existing UI types)

export type FrontendStatus = '草稿' | '已发布' | '停用';

export interface FrontendPermissionItem {
    module: string;
    actions: string[];
    operationPoints?: string[];  // Reserved for future, not saved to backend
    note: string;
}

export interface FrontendTemplate {
    id: string;
    name: string;
    code: string;
    description: string;
    status: FrontendStatus;
    moduleCount: number;
    updatedAt: string;
    scopeHint: string;
    permissions: FrontendPermissionItem[];
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Status Mapping: Backend -> Frontend
 */
export function mapBackendToFrontendStatus(status: BackendStatus): FrontendStatus {
    const statusMap: Record<BackendStatus, FrontendStatus> = {
        'draft': '草稿',
        'published': '已发布',
        'disabled': '停用',
    };
    return statusMap[status];
}

/**
 * Status Mapping: Frontend -> Backend
 */
export function mapFrontendToBackendStatus(status: FrontendStatus): BackendStatus {
    const statusMap: Record<FrontendStatus, BackendStatus> = {
        '草稿': 'draft',
        '已发布': 'published',
        '停用': 'disabled',
    };
    return statusMap[status];
}

/**
 * Scope Mapping: Backend -> Frontend
 */
export function mapBackendToFrontendScope(scope: BackendScope): string {
    const scopeMap: Record<BackendScope, string> = {
        'global': '全平台',
        'organization': '组织级',
        'domain': '数据域',
        'project': '租户',
    };
    return scopeMap[scope];
}

/**
 * Scope Mapping: Frontend -> Backend
 */
export function mapFrontendToBackendScope(scope: string): BackendScope {
    const scopeMap: Record<string, BackendScope> = {
        '全平台': 'global',
        '组织级': 'organization',
        '数据域': 'domain',
        '租户': 'project',
    };
    return scopeMap[scope] || 'organization';
}

/**
 * Convert frontend permissions to backend policy matrix
 * Note: operationPoints are NOT included (reserved for future)
 */
export function convertFrontendToBackendPolicyMatrix(
    permissions: FrontendPermissionItem[]
): Record<string, PolicyMatrixEntry> {
    const policyMatrix: Record<string, PolicyMatrixEntry> = {};

    permissions.forEach(perm => {
        if (perm.actions.length > 0) {
            policyMatrix[perm.module] = {
                actions: perm.actions,
                scope: '', // Backend scope field
            };
        }
    });

    return policyMatrix;
}

/**
 * Convert backend policy matrix to frontend permissions
 * Note: operationPoints will be empty (reserved for future)
 */
export function convertBackendToFrontendPermissions(
    policyMatrix: Record<string, PolicyMatrixEntry>,
    permissionCatalog: FrontendPermissionItem[]
): FrontendPermissionItem[] {
    // Create a map of module -> note from the catalog
    const moduleNotes = new Map(
        permissionCatalog.map(p => [p.module, p.note])
    );

    // Convert backend policy matrix to frontend permissions
    return Object.entries(policyMatrix).map(([module, entry]) => ({
        module,
        actions: entry.actions,
        note: moduleNotes.get(module) || '',
        operationPoints: [], // Reserved for future, not loaded from backend yet
    }));
}

/**
 * Convert backend template detail to frontend template
 */
export function convertBackendToFrontendTemplate(
    backend: PermissionTemplateDetail,
    permissionCatalog: FrontendPermissionItem[]
): FrontendTemplate {
    return {
        id: backend.id,
        name: backend.name,
        code: backend.code,
        description: backend.description,
        status: mapBackendToFrontendStatus(backend.status),
        moduleCount: Object.keys(backend.policy_matrix).length,
        updatedAt: backend.updated_at.split('T')[0], // Format: YYYY-MM-DD
        scopeHint: mapBackendToFrontendScope(backend.scope_suggestion),
        permissions: convertBackendToFrontendPermissions(
            backend.policy_matrix,
            permissionCatalog
        ),
    };
}

/**
 * Convert backend template item to frontend template (for list view)
 */
export function convertBackendToFrontendTemplateItem(
    backend: PermissionTemplateItem
): FrontendTemplate {
    return {
        id: backend.id,
        name: backend.name,
        code: backend.code,
        description: '',
        status: mapBackendToFrontendStatus(backend.status),
        moduleCount: 0, // Not available in list response
        updatedAt: backend.updated_at.split('T')[0],
        scopeHint: mapBackendToFrontendScope(backend.scope_suggestion),
        permissions: [],
    };
}

/**
 * Convert frontend template to backend create request
 * Note: operationPoints are NOT included (reserved for future)
 */
export function convertFrontendToCreateRequest(
    frontend: FrontendTemplate
): CreatePermissionTemplateReq {
    return {
        name: frontend.name,
        code: frontend.code,
        description: frontend.description || undefined,
        scope_suggestion: mapFrontendToBackendScope(frontend.scopeHint),
        policy_matrix: convertFrontendToBackendPolicyMatrix(frontend.permissions),
        // advanced_perms: reserved for future, not sent to backend yet
    };
}

/**
 * Convert frontend template to backend update request
 */
export function convertFrontendToUpdateRequest(
    frontend: FrontendTemplate
): UpdatePermissionTemplateReq {
    return {
        id: frontend.id,
        ...convertFrontendToCreateRequest(frontend),
    };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Parse permission template API error response
 * Follows the pattern from menuService.ts
 */
const parsePermissionTemplateError = async (response: Response): Promise<Error & ErrorResponse> => {
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

// ============================================================================
// SERVICE API
// ============================================================================

export const permissionTemplateService = {
    /**
     * List permission templates with pagination and filters
     */
    async listPermissionTemplates(
        params?: ListPermissionTemplatesReq
    ): Promise<ListPermissionTemplatesResp> {
        const searchParams = new URLSearchParams();
        if (params?.keyword) searchParams.set('keyword', params.keyword);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.scope_suggestion) searchParams.set('scope_suggestion', params.scope_suggestion);
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.page_size) searchParams.set('page_size', String(params.page_size));

        const query = searchParams.toString();
        const url = `/permission-templates${query ? `?${query}` : ''}`;

        const response = await systemServiceClient(url, { method: 'GET' });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        return response.json();
    },

    /**
     * Get permission template detail by ID
     */
    async getPermissionTemplate(id: string): Promise<PermissionTemplateDetail> {
        const response = await systemServiceClient(`/permission-templates/${id}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        const result: GetPermissionTemplateResp = await response.json();
        return result.data;
    },

    /**
     * Create a new permission template
     */
    async createPermissionTemplate(
        data: CreatePermissionTemplateReq
    ): Promise<CreatePermissionTemplateResp> {
        const response = await systemServiceClient('/permission-templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        return response.json();
    },

    /**
     * Update an existing permission template
     */
    async updatePermissionTemplate(
        id: string,
        data: UpdatePermissionTemplateReq
    ): Promise<UpdatePermissionTemplateResp> {
        const response = await systemServiceClient(`/permission-templates/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        return response.json();
    },

    /**
     * Publish a permission template (draft -> published)
     */
    async publishPermissionTemplate(
        id: string
    ): Promise<PublishPermissionTemplateResp> {
        const response = await systemServiceClient(`/permission-templates/${id}/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        return response.json();
    },

    /**
     * Disable a permission template (published -> disabled)
     */
    async disablePermissionTemplate(id: string): Promise<ActionResp> {
        const response = await systemServiceClient(`/permission-templates/${id}/disable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        return response.json();
    },

    /**
     * Enable a permission template (disabled -> published)
     */
    async enablePermissionTemplate(id: string): Promise<ActionResp> {
        const response = await systemServiceClient(`/permission-templates/${id}/enable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        return response.json();
    },

    /**
     * Clone a permission template
     */
    async clonePermissionTemplate(
        id: string,
        data: ClonePermissionTemplateReq
    ): Promise<CreatePermissionTemplateResp> {
        const response = await systemServiceClient(`/permission-templates/${id}/clone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        return response.json();
    },

    /**
     * Delete a permission template
     */
    async deletePermissionTemplate(id: string): Promise<ActionResp> {
        const response = await systemServiceClient(`/permission-templates/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw await parsePermissionTemplateError(response);
        }

        return response.json();
    },
};
