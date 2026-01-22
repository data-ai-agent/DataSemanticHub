package com.eisoo.dc.common.constant;

public class Constants {

    /**
     * UTF-8 字符集
     */
    public static final String UTF8 = "UTF-8";

    /**
     * http请求
     */
    public static final String HTTP = "http://";

    /**
     * https请求
     */
    public static final String HTTPS = "https://";

    /**
     * header里面携带token的key
     */
    public final static String HEADER_TOKEN_KEY = "Authorization";

    /**
     * header里面携带mac的key
     */
    public final static String HEADER_MAC_KEY = "X-Request-MAC";

    /**
     * 默认 ad-hoc 用户
     */
    public static final String DEFAULT_AD_HOC_USER = "admin";

    /**
     * 审计日志级别:INFO
     * 警告：“WARN”，信息：”INFO“
     */
    public static final String AUDIT_LOG_LEVEL_INFO = "INFO";

    /**
     * 审计日志类型:operation
     * 日志类型，枚举
     * ”login“: 登录审计日志，”operation“:操作审计日志，”management“:管理审计日志
     * 三种类型的审计日志：登录、管理、操作
     * 登录：所有的登录行为，包括客户端和管理控制台
     * 管理：管理员行为
     * 操作：普通用户行为
     */
    public static final String AUDIT_LOG_TYPE_OPERATION = "operation";

    /**
     * 大包名
     */
    public static final String PACKAGE_NAME = "VEGA";

    /**
     * 服务名
     */
    public static final String SERVICE_NAME = "data-connection";
}
