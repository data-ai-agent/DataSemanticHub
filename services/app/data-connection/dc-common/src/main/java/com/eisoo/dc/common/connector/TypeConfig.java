package com.eisoo.dc.common.connector;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * @Author zdh
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TypeConfig {
    @JsonProperty(value = "source_type")
    private String sourceType;
    @JsonProperty(value = "vega_type")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String vegaType;
    @JsonProperty(value = "target_type")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String targetType;
}
