package com.eisoo.dc.gateway.domain.dto;

import com.eisoo.dc.gateway.common.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * @author paul
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class RuleDto {
    @ApiModelProperty(value = "规则名称", example = "", dataType = "java.lang.String")
    @NotBlank(message = "规则名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String name;
    @ApiModelProperty(value = "规则启用", example = "", dataType = "java.lang.String")
    //@NotBlank(message = "规则启用" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty("is_enable")
    private String isEnable;
}
