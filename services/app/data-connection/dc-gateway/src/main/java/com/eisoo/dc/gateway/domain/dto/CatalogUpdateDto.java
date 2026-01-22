package com.eisoo.dc.gateway.domain.dto;

import cn.hutool.json.JSONObject;
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
public class CatalogUpdateDto {
    @ApiModelProperty(value = "数据源类型", example = "", dataType = "java.lang.String")
    @NotBlank(message = "数据源类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String connectorName;
    private String name;
    private String host;
    private int port;
    private String databaseName;
    private String username;
    private String password;
    private String schema;
    @ApiModelProperty(value = "数据源ID", example = "", dataType = "java.lang.String")
    @NotBlank(message = "数据源类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String id;
    @ApiModelProperty(value = "hive是否开启krb", example = "", dataType = "java.lang.String")
    private String hiveKrb;
    @ApiModelProperty(value = "数据源添加配置", example = "",required=true)
    private JSONObject properties;
}
