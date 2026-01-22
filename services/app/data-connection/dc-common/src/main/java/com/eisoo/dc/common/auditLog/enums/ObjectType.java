package com.eisoo.dc.common.auditLog.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 对象类型枚举
 */
public enum ObjectType {
    DATA_SOURCE("data_source", "数据源"),
    OTHER("other", "其他类型");

    private final String code;
    private final String description;

    ObjectType(String code, String description) {
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
    public static ObjectType fromCode(String code) {
        for (ObjectType type : ObjectType.values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return OTHER;
    }

    @Override
    public String toString() {
        return description;
    }
}
