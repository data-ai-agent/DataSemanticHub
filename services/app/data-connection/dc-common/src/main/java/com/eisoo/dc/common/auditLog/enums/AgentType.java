package com.eisoo.dc.common.auditLog.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 操作者客户端类型枚举
 */
public enum AgentType {
    WINDOWS("windows", "Windows同步盘/Windows客户端"),
    IOS("ios", "iOS客户端"),
    ANDROID("android", "Android客户端"),
    HARMONY("harmony", "Harmony客户端"),
    MAC_OS("mac_os", "Mac客户端/Mac同步盘"),
    WEB("web", "Web客户端"),
    MOBILE_WEB("mobile_web", "移动Web客户端"),
    LINUX("linux", "Linux客户端"),
    OFFICE_PLUGIN("office_plugin", "Office插件"),
    CONSOLE_WEB("console_web","管理控制台"),
    DEPLOY_WEB("deploy_web","部署控制台"),
    APP("app","应用账户"),
    UNKNOWN("unknown", "未知类型的客户端");

    private final String code;
    private final String description;

    AgentType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static AgentType fromCode(String code) {
        for (AgentType type : AgentType.values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return UNKNOWN;
    }

    @Override
    public String toString() {
        return description;
    }
}
