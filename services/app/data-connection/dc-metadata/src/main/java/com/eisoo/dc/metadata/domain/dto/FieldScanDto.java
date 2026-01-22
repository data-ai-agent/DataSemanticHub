package com.eisoo.dc.metadata.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * @author Tian.lan
 */
@Data
@JsonInclude(JsonInclude.Include.ALWAYS)
@ApiModel
@NoArgsConstructor
@AllArgsConstructor
public class FieldScanDto implements Serializable {
    @JsonProperty(value = "table_id")
    private String tableId;
    @JsonProperty(value = "id")
    private String id;
    @JsonProperty(value = "name")
    private String name;
    @JsonProperty(value = "type")
    private String type;
    @JsonProperty(value = "vega_type")
    private String vegaType;
    @JsonProperty(value = "comment")
    private String comment;
}
