import { systemServiceClient } from '../utils/serviceClient';
import type { ErrorResponse } from '../utils/httpClient';

// ==================== 类型定义 ====================

export interface LoginReq {
    email: string;
    password?: string;
    remember_me?: boolean;
}

export interface UserInfo {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    organization?: string;
}

export interface LoginResp {
    token: string;
    refresh_token?: string;
    expires_in: number;
    user_info: UserInfo;
}

export interface RegisterReq {
    first_name: string;
    last_name: string;
    email: string;
    organization?: string;
    password: string;
    confirm_password: string;
    agree_terms: boolean;
}

export interface RegisterResp {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    token: string;
}

export interface ForgotPasswordReq {
    email: string;
}

export interface ForgotPasswordResp {
    message: string;
    email: string;
}

export interface SSOLoginReq {
    domain: string;
}

// ==================== Mock 数据（开发环境备用） ====================

const MOCK_DELAY = 800;

const mockLogin = async (data: LoginReq): Promise<LoginResp> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return {
        token: 'mock-jwt-token-' + Date.now(),
        expires_in: 3600,
        user_info: {
            id: 'mock-user-001',
            first_name: 'Demo',
            last_name: 'User',
            email: data.email,
            organization: 'Default Org'
        }
    };
};

const mockRegister = async (data: RegisterReq): Promise<RegisterResp> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return {
        id: 'mock-user-new-' + Date.now(),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        token: 'mock-jwt-token-' + Date.now()
    };
};

// ==================== 错误处理 ====================

/**
 * 解析认证错误响应
 */
const parseAuthError = async (response: Response): Promise<Error & ErrorResponse> => {
    const data = await response.json().catch(() => ({}));

    // 尝试解析增强格式 (HttpError)
    if (data.description) {
        return Object.assign(new Error(data.description), {
            title: '认证失败',
            message: data.description,
            solution: data.solution,
            cause: data.cause,
            code: data.code,
            httpStatus: response.status,
        });
    }

    // 尝试解析简单格式 (HttpResponse)
    if (data.msg) {
        return Object.assign(new Error(data.msg), {
            title: '认证失败',
            message: data.msg,
            code: data.code,
            httpStatus: response.status,
        });
    }

    // 默认错误
    return Object.assign(new Error('认证失败'), {
        title: '认证失败',
        message: `服务器返回 ${response.status}`,
        httpStatus: response.status,
    });
};

// ==================== Auth Service ====================

export const authService = {
    /**
     * 用户登录
     */
    async login(data: LoginReq): Promise<LoginResp> {
        try {
            const response = await systemServiceClient('/user/login', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                // Fallback to mock on 404 or 500 in dev
                if (import.meta.env.DEV && (response.status === 404 || response.status >= 500)) {
                    console.warn('System Service connection failed, falling back to Mock Mode');
                    return mockLogin(data);
                }
                throw await parseAuthError(response);
            }

            const result = await response.json();

            // 检查业务状态码 (如果 HTTP 是 200 OK，但业务逻辑报错)
            if (result.code && result.code !== 0 && result.code !== 200) {
                const errorMsg = result.msg || result.description || '登录失败';
                const error = new Error(errorMsg);
                Object.assign(error, {
                    code: result.code,
                    title: '登录失败',
                    message: errorMsg
                });
                throw error;
            }

            // 登录成功后，自动存储 token
            if (result.token) {
                localStorage.setItem('auth_token', result.token);
            }

            return result;
        } catch (error) {
            if (import.meta.env.DEV && (error as Error).name === 'TypeError') {
                // Network error
                console.warn('Network error, falling back to Mock Mode');
                return mockLogin(data);
            }
            throw error;
        }
    },

    /**
     * 用户注册
     */
    async register(data: RegisterReq): Promise<RegisterResp> {
        try {
            const response = await systemServiceClient('/user/register', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                if (import.meta.env.DEV && (response.status === 404 || response.status >= 500)) {
                    console.warn('System Service connection failed, falling back to Mock Mode');
                    return mockRegister(data);
                }
                throw await parseAuthError(response);
            }

            const result = await response.json();

            // 注册成功后，自动存储 token（自动登录）
            if (result.token) {
                localStorage.setItem('auth_token', result.token);
            }

            return result;
        } catch (error) {
            if (import.meta.env.DEV && (error as Error).name === 'TypeError') {
                // Network error
                console.warn('Network error, falling back to Mock Mode');
                return mockRegister(data);
            }
            throw error;
        }
    },

    /**
     * 忘记密码
     */
    async forgotPassword(data: ForgotPasswordReq): Promise<ForgotPasswordResp> {
        try {
            const response = await systemServiceClient('/user/forgot-password', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw await parseAuthError(response);
            }

            return response.json();
        } catch (error) {
            // 开发环境 fallback
            if (import.meta.env.DEV) {
                console.warn('Forgot password API not available, using mock');
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
                return {
                    message: '密码重置链接已发送',
                    email: data.email,
                };
            }
            throw error;
        }
    },

    /**
     * SSO 登录
     */
    async ssoLogin(data: SSOLoginReq): Promise<{ redirect_url: string }> {
        try {
            const response = await systemServiceClient('/sso/login', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw await parseAuthError(response);
            }

            return response.json();
        } catch (error) {
            // 开发环境 fallback
            if (import.meta.env.DEV) {
                console.warn('SSO API not available, using mock redirect');
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
                return {
                    redirect_url: `https://sso.${data.domain}/login?redirect_uri=${window.location.origin}`,
                };
            }
            throw error;
        }
    },

    /**
     * 退出登录
     */
    async logout(): Promise<void> {
        try {
            await systemServiceClient('/user/logout', {
                method: 'POST',
            });
        } catch (error) {
            // 即使退出登录失败，也要清除本地 token
            console.warn('Logout request failed:', error);
        } finally {
            // 清除本地存储
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
        }
    },

    /**
     * 获取当前用户信息
     */
    async getUserInfo(): Promise<UserInfo> {
        const response = await systemServiceClient('/user/info', {
            method: 'GET',
        });

        if (!response.ok) {
            throw await parseAuthError(response);
        }

        return response.json();
    },

    /**
     * 检查是否已登录
     */
    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_token');
    },

    /**
     * 获取存储的 token
     */
    getToken(): string | null {
        return localStorage.getItem('auth_token');
    },

    /**
     * 获取存储的用户信息
     */
    getStoredUserInfo(): UserInfo | null {
        const info = localStorage.getItem('user_info');
        return info ? JSON.parse(info) : null;
    },
};

export type { ErrorResponse };
