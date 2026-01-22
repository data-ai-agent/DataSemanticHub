package com.eisoo.dc.common.auditLog.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 操作类型枚举
 */
public enum OperationType {
    CREATE("create","新建"),
    UPDATE("update","更新"),
    DELETE("delete","删除"),
    OTHER("other","其他");

    private final String value;
    private final String description;

    OperationType(String value, String description) {
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
    public static OperationType fromValue(String value) {
        for (OperationType type : OperationType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return OTHER; // 未知类型默认为OTHER
    }

    @Override
    public String toString() {
        return description;
    }
}

