package com.eisoo.dc.metadata.domain.dto;

import com.eisoo.dc.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import java.util.List;

/**
 * @Author zdh
 **/
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class TypeMappingDto {
    @ApiModelProperty(value = "原始数据源类型", example = "", dataType = "java.lang.String")
    @NotBlank(message = "原始数据源类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Pattern(regexp = "vega|oracle|postgresql|doris|sqlserver|hive|clickhouse|mysql|maria|mongodb|dameng|hologres|gaussdb|excel|opengauss|inceptor-jdbc|maxcompute|opensearch", message = "原始数据源类型支持传参：vega, oracle, postgresql, doris, sqlserver, hive, clickhouse, mysql, maria, mongodb, dameng, hologres, gaussdb, excel, opengauss, inceptor-jdbc, maxcompute, opensearch")
    @JsonProperty("source_connector")
    private String sourceConnector;
    @ApiModelProperty(value = "目标数据源类型", example = "", dataType = "java.lang.String")
    @NotBlank(message = "目标数据源类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Pattern(regexp = "vega|oracle|postgresql|doris|sqlserver|hive|clickhouse|mysql|maria|mongodb|dameng|hologres|gaussdb|opengauss|inceptor-jdbc|maxcompute|opensearch", message = "目标数据源支持传参：vega, oracle, postgresql, doris, sqlserver, hive, clickhouse, mysql, maria, mongodb, dameng, hologres, gaussdb, opengauss, inceptor-jdbc, maxcompute, opensearch")
    @JsonProperty("target_connector")
    private String targetConnector;
    @ApiModelProperty(value = "目标数据源数据类型", example = "", dataType = "java.util.Object")
    private List<SourceTypeDto> type;

}
