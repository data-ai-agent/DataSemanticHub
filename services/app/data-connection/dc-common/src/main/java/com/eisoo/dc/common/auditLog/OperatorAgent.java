package com.eisoo.dc.common.auditLog;

import com.eisoo.dc.common.auditLog.enums.AgentType;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 操作者设备信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OperatorAgent {
    /**
     * 操作者客户端类型，从token中获取，路径ext.client_type，枚举检查
     */
    @JsonProperty("type")
    private AgentType operatorAgentType;

    /**
     * 操作者设备IP
     */
    @JsonProperty("ip")
    private String operatorAgentIp;

    /**
     * 操作者设备mac地址
     */
    @JsonProperty("mac")
    private String operatorAgentMac;
}
