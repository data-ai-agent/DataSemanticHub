package com.eisoo.dc.gateway.domain.dto;

import com.eisoo.dc.gateway.common.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * @Author zdh
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class SchemaDto {
    @ApiModelProperty(value = "数据源名称", example = "", dataType = "java.lang.String")
    @NotBlank(message = "schema名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String catalogName;
    @ApiModelProperty(value = "schema名称", example = "", dataType = "java.lang.String")
    @NotBlank(message = "schema名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String schemaName;
    @ApiModelProperty(value = "schema相关执行语句", example = "", dataType = "java.lang.String")
    @NotBlank(message = "schema名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String query;
}
