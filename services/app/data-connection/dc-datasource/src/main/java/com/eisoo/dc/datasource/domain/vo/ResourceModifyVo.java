package com.eisoo.dc.datasource.domain.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 资源修改实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceModifyVo {
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
    /**
     * 实例名称
     */
    @JsonProperty("name")
    private String name;
}
