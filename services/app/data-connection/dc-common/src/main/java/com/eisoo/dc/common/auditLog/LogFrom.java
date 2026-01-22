package com.eisoo.dc.common.auditLog;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 日志来源信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LogFrom {
    /**
     * 大包名
     */
    @JsonProperty("package")
    private String pkg;

    /**
     * 服务信息
     */
    private LogFromService service;
}
