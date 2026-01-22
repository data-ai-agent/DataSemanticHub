package com.eisoo.dc.gateway.enums;

import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;

import java.util.HashMap;

public class ErrorMagEnum {
    // 定义转换规则
    public enum ConvertRule {
        OutOfRange("Out of range for insert query type", "插入语句字段长度超出限制"),
        NonManagedHive("Cannot write to non-managed Hive table", "不支持写入Hive外部表"),
        ;

        private final String sourceMsg;
        private final String convertMsg;

        ConvertRule(String sourceMsg, String convertMsg) {
            this.sourceMsg = sourceMsg;
            this.convertMsg = convertMsg;
        }

        public String getSourceMsg() {
            return sourceMsg;
        }

        public String getConvertMsg() {
            return convertMsg;
        }
    }

    // 初始化转换规则
    private static final HashMap<String, String> ERROR_MSG_RULES = new HashMap<>();

    static {
        for (ConvertRule rule : ConvertRule.values()) {
            ERROR_MSG_RULES.put(rule.getSourceMsg(), rule.getConvertMsg());
        }
    }

    /**
     * 错误信息转化
     * 例：
     * param:  Out of range for insert query type: Table: varchar(2147483643), Query: varchar
     * return: 插入语句字段长度超出限制: 目标数据类型: varchar(2147483643), 原数据类型: varchar
     */
    public static String errorMsgConvert(String errorMsg) {

        if (ERROR_MSG_RULES.containsKey(errorMsg)){
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, ERROR_MSG_RULES.get(errorMsg));
        }

        if (errorMsg != null && errorMsg.contains(":")) {
            String[] msgArr = errorMsg.split(":");
            if (ERROR_MSG_RULES.containsKey(msgArr[0])) {
                msgArr[0] = ERROR_MSG_RULES.get(msgArr[0]);
                msgArr[1] = msgArr[1].replace("Table","目标数据类型");
                msgArr[2] = msgArr[2].replace("Query","原数据类型");
            }
            return String.join(":", msgArr);
        }
        return errorMsg;
    }

}
