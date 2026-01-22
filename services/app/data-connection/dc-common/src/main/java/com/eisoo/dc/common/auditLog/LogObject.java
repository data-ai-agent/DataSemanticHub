package com.eisoo.dc.common.auditLog;

import com.eisoo.dc.common.auditLog.enums.ObjectType;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 操作对象信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LogObject {
    /**
     * 对象类型，枚举
     */
    @JsonProperty("type")
    private ObjectType objectType;

    /**
     * 对象名称，最大长度128（可选）
     */
    @JsonProperty("name")
    private String objectName;

    /**
     * 对象ID，最大长度40（可选）
     */
    @JsonProperty("id")
    private String objectId;
}
