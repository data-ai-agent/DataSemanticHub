package com.eisoo.dc.gateway.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * @Author paul
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class CatalogRuleDto implements Serializable {
    @ApiModelProperty(value = "数据源名称", example = "", dataType = "java.lang.Bigint")
    private String catalogName;
    @ApiModelProperty(value = "下推规则", example = "", dataType = "java.lang.String")
    private List<RuleDto> rule;
    @ApiModelProperty(value = "数据源名称", example = "", dataType = "java.lang.String")
    private String datasourceType;
}
