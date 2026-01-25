/**
 * 统一的 HTTP 客户端
 * 自动处理 JWT token 和错误响应
 */

interface HttpError {
    code?: number;
    description?: string;
    solution?: string;
    cause?: string;
    detail?: any;
    msg?: string;
}

interface ErrorResponse {
    title?: string;
    message: string;
    solution?: string;
    cause?: string;
    code?: number;
    httpStatus?: number;
}

const API_BASE = '/api/v1';

/**
 * 从错误响应中解析错误信息
 */
const parseErrorResponse = async (response: Response): Promise<ErrorResponse> => {
    const data: HttpError = await response.json().catch(() => ({}));

    // 尝试解析增强格式 (HttpError)
    if (data.description) {
        return {
            title: '请求失败',
            message: data.description,
            solution: data.solution,
            cause: data.cause,
            code: data.code,
            httpStatus: response.status,
        };
    }

    // 尝试解析简单格式 (HttpResponse)
    if (data.msg) {
        return {
            title: '请求失败',
            message: data.msg,
            code: data.code,
            httpStatus: response.status,
        };
    }

    // 根据 HTTP 状态码返回默认错误
    const statusErrors: Record<number, ErrorResponse> = {
        401: {
            title: '未授权',
            message: '请先登录',
            solution: '您需要登录才能访问此资源',
            httpStatus: 401,
        },
        403: {
            title: '权限不足',
            message: '您没有权限访问此资源',
            solution: '请联系管理员获取相应权限',
            httpStatus: 403,
        },
        404: {
            title: '资源不存在',
            message: '请求的资源不存在',
            httpStatus: 404,
        },
        500: {
            title: '服务器错误',
            message: '服务器内部错误，请稍后重试',
            solution: '如果问题持续存在，请联系技术支持',
            httpStatus: 500,
        },
    };

    return (
        statusErrors[response.status] || {
            title: '请求失败',
            message: `服务器返回 ${response.status}`,
            httpStatus: response.status,
        }
    );
};

/**
 * 创建带有认证的 HTTP 请求
 */
export const httpClient = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    // 获取存储的 token
    const token = localStorage.getItem('auth_token');

    const headers = new Headers({
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    });

    // 如果有 token，添加到 Authorization 头
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    return response;
};

/**
 * 发起 HTTP 请求并自动处理错误
 */
export const httpRequest = async <T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const response = await httpClient(endpoint, options);

    // 处理 401 未授权 - 清除 token 并跳转登录
    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        // 在当前页面跳转到登录页（保持路径便于登录后返回）
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        const error = await parseErrorResponse(response);
        throw Object.assign(new Error(error.message), error);
    }

    // 处理其他错误状态
    if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw Object.assign(new Error(error.message), error);
    }

    return response.json();
};

/**
 * GET 请求
 */
export const get = <T = any>(endpoint: string) => {
    return httpRequest<T>(endpoint, { method: 'GET' });
};

/**
 * POST 请求
 */
export const post = <T = any>(endpoint: string, data?: any) => {
    return httpRequest<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });
};

/**
 * PUT 请求
 */
export const put = <T = any>(endpoint: string, data?: any) => {
    return httpRequest<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
};

/**
 * DELETE 请求
 */
export const del = <T = any>(endpoint: string) => {
    return httpRequest<T>(endpoint, { method: 'DELETE' });
};

export type { ErrorResponse, HttpError };
