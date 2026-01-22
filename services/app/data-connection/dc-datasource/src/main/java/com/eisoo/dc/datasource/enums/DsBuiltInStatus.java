package com.eisoo.dc.datasource.enums;

public enum DsBuiltInStatus {
    /**
     * 特殊数据源
     */
    SPECIAL(0),

    /**
     * 非内置数据源
     */
    NON_BUILT_IN(1),

    /**
     * 内置数据源
     */
    BUILT_IN(2);

    private final int value;

    DsBuiltInStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public static DsBuiltInStatus fromValue(int value) {
        for (DsBuiltInStatus status : DsBuiltInStatus.values()) {
            if (status.value == value) {
                return status;
            }
        }
        throw new IllegalArgumentException("无效的数据源内置状态值: " + value);
    }

    public static boolean isBuiltIn(int value) {
        return value == BUILT_IN.getValue();
    }
}

