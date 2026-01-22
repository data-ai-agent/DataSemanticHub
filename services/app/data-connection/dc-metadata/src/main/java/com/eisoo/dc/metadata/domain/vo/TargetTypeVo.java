package com.eisoo.dc.metadata.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * @Author zdh
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TargetTypeVo {
    private Integer index;
    @JsonProperty("target_type")
    private String targetTypeName;
    private Long precision;
    @JsonProperty("decimal_digits")
    private Long decimalDigits;

}
