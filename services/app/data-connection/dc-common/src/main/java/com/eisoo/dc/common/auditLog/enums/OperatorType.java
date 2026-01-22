package com.eisoo.dc.common.auditLog.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.HashMap;
import java.util.Map;

/**
 * 操作者类型枚举
 */
public enum OperatorType {
    AUTHENTICATED_USER("authenticated_user","实名用户"),
    ANONYMOUS_USER("anonymous_user","匿名用户"),
    APP("app","应用账户"),
    INTERNAL_SERVICE("internal_service","内部服务");

    private final String value;
    private final String description;

    OperatorType(String value,String description) {
        this.value = value;
        this.description = description;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static OperatorType fromValue(String value) {
        for (OperatorType type : OperatorType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("未知的操作者类型: " + value);
    }

    @Override
    public String toString() {
        return description;
    }


    public static final Map<String, OperatorType> visitorTypeMap = new HashMap<>();

    static {
        visitorTypeMap.put("realname", OperatorType.AUTHENTICATED_USER);
        visitorTypeMap.put("anonymous", OperatorType.ANONYMOUS_USER);
        visitorTypeMap.put("business", OperatorType.APP);
    }

}
