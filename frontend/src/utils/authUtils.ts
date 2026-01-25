/**
 * 认证工具函数
 * 提供登录状态检查、用户信息获取等功能
 */

export interface UserInfo {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    organization?: string;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
};

/**
 * 获取存储的 token
 * @returns {string | null} token
 */
export const getToken = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * 获取当前用户信息
 * @returns {UserInfo | null} 用户信息
 */
export const getCurrentUser = (): UserInfo | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
        try {
            return JSON.parse(userStr) as UserInfo;
        } catch {
            return null;
        }
    }
    return null;
};

/**
 * 保存认证信息
 * @param {string} token - JWT token
 * @param {UserInfo} userInfo - 用户信息
 */
export const setAuthInfo = (token: string, userInfo: UserInfo): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
};

/**
 * 清除认证信息（登出）
 */
export const clearAuthInfo = (): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};
