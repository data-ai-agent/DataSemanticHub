package com.eisoo.dc.common.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 资源认证实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAuthVo {
    /**
     * 资源实例id
     */
    @JsonProperty("id")
    private String id;
    /**
     * 资源类型
     */
    @JsonProperty("type")
    private String type;
}
