package com.eisoo.dc.common.util;

import com.eisoo.dc.common.config.AuthConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

/**
 * 认证相关工具类
 */
@Component
public class AuthUtil {

    @Autowired
    private AuthConfig authConfig;

    private static AuthConfig staticAuthConfig;

    @PostConstruct
    public void init() {
        staticAuthConfig = this.authConfig;
    }

    /**
     * 检查是否启用了token验证
     */
    public static boolean isTokenValidationEnabled() {
        return staticAuthConfig != null ? staticAuthConfig.getToken().getValidation().isEnabled() : true;
    }

    /**
     * 根据配置决定是否返回真实的用户信息或默认值
     */
    public static String getUserIdOrAnonymous(String actualUserId) {
        if (isTokenValidationEnabled()) {
            return actualUserId;
        }
        // 如果未启用token验证，返回默认用户ID
        return "anonymous";
    }

    /**
     * 根据配置决定是否返回真实用户类型或默认值
     */
    public static String getUserTypeOrAnonymous(String actualUserType) {
        if (isTokenValidationEnabled()) {
            return actualUserType;
        }
        // 如果未启用token验证，返回默认用户类型
        return "anonymous";
    }
}