package com.eisoo.dc.gateway.domain.dto;

import com.eisoo.dc.gateway.common.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * @Author Xiaoxiang.er
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class DownloadDto {

    @ApiModelProperty(value = "数据源名称", example = "", dataType = "java.lang.String")
    @NotBlank(message = "数据源名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String catalog;
    @ApiModelProperty(value = "库名称", example = "", dataType = "java.lang.String")
    @NotBlank(message = "库名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String schema;
    @ApiModelProperty(value = "表名称", example = "", dataType = "java.lang.String")
    @NotBlank(message = "表名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String table;
    @ApiModelProperty(value = "列限制", example = "", dataType = "java.lang.String")
    @NotBlank(message = "列限制" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String columns;
    @ApiModelProperty(value = "行限制", example = "", dataType = "java.lang.String")
    private String row_rules;
    @ApiModelProperty(value = "排序", example = "", dataType = "java.lang.String")
    private String order_by;
    @ApiModelProperty(example = "", dataType = "java.lang.Integer")
    private Integer offset;
    @ApiModelProperty(example = "", dataType = "java.lang.Integer")
    private Integer limit;

}
