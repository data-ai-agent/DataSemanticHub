package com.eisoo.dc.datasource.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;

/**
 * 数据源统计信息 VO
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(value = "数据源统计信息", description = "数据源表和字段的统计信息")
public class DataSourceStatisticsVo implements Serializable {

    @ApiModelProperty(value = "数据源ID", example = "123e4567-e89b-12d3-a456-426614174000")
    private String dataSourceId;

    @ApiModelProperty(value = "数据源名称", example = "mysql_133_144_1")
    private String dataSourceName;

    @ApiModelProperty(value = "表总数", example = "150")
    @JsonProperty("table_count")
    private Long tableCount;

    @ApiModelProperty(value = "字段总数", example = "1200")
    @JsonProperty("field_count")
    private Long fieldCount;

    @ApiModelProperty(value = "已扫描的表数量", example = "120")
    @JsonProperty("scanned_table_count")
    private Long scannedTableCount;

    @ApiModelProperty(value = "扫描中的表数量", example = "25")
    @JsonProperty("scanning_table_count")
    private Long scanningTableCount;

    @ApiModelProperty(value = "未扫描的表数量", example = "5")
    @JsonProperty("unscanned_table_count")
    private Long unscannedTableCount;
}