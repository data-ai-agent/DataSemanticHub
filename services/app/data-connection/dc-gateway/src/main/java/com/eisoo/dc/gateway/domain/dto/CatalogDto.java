package com.eisoo.dc.gateway.domain.dto;

import com.eisoo.dc.gateway.common.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * @Author zdh
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class CatalogDto implements Serializable {
    @ApiModelProperty(value = "数据源名称", example = "", dataType = "java.lang.String")
    @NotBlank(message = "数据源名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String catalogName;
    @ApiModelProperty(value = "数据源类型", example = "", dataType = "java.lang.String")
    @NotBlank(message = "数据源类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String connectorName;
}
