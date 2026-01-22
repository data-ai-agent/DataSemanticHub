package com.eisoo.dc.common.auditLog;

import com.eisoo.dc.common.auditLog.enums.OperatorType;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 操作者信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Operator {
    /**
     * 操作者ID，最大长度40
     */
    @JsonProperty("id")
    private String operatorId;

    /**
     * 操作者名称，最大长度128,type为internal_service必传
     */
    @JsonProperty("name")
    private String operatorName;

    /**
     * 操作者类型，枚举检查
     */
    @JsonProperty("type")
    private OperatorType operatorType;

    /**
     * 操作者设备信息
     */
    @JsonProperty("agent")
    private OperatorAgent operatorAgent;
}

