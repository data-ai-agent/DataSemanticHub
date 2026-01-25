import { useEffect, type ReactNode } from 'react';
import { isAuthenticated, clearAuthInfo } from '../../utils/authUtils';

interface ProtectedRouteProps {
    children: ReactNode;
    onAuthRequired: () => void;
}

/**
 * 受保护路由组件
 * 检查用户是否已登录，如果未登录则触发 onAuthRequired 回调
 */
export function ProtectedRoute({ children, onAuthRequired }: ProtectedRouteProps) {
    useEffect(() => {
        // 检查登录状态
        if (!isAuthenticated()) {
            // 清除可能存在的无效认证信息
            clearAuthInfo();
            // 触发跳转到登录页
            onAuthRequired();
        }
    }, [onAuthRequired]);

    // 如果未登录，不渲染子组件
    if (!isAuthenticated()) {
        return null;
    }

    return <>{children}</>;
}
