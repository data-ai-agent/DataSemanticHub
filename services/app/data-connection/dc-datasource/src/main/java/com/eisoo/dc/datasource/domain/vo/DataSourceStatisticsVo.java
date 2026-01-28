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

    // ==================== 存储统计 ====================

    @ApiModelProperty(value = "总数据行数", example = "15000000")
    @JsonProperty("total_rows")
    private Long totalRows;

    @ApiModelProperty(value = "总数据大小（字节）")
    @JsonProperty("total_data_size")
    private Long totalDataSize;

    @ApiModelProperty(value = "总数据大小（格式化显示）")
    @JsonProperty("total_data_size_formatted")
    private String totalDataSizeFormatted;

    @ApiModelProperty(value = "总索引大小（字节）")
    @JsonProperty("total_index_size")
    private Long totalIndexSize;

    @ApiModelProperty(value = "总索引大小（格式化显示）")
    @JsonProperty("total_index_size_formatted")
    private String totalIndexSizeFormatted;

    @ApiModelProperty(value = "总大小（数据+索引）")
    @JsonProperty("total_size")
    private Long totalSize;

    @ApiModelProperty(value = "总大小（格式化显示）")
    @JsonProperty("total_size_formatted")
    private String totalSizeFormatted;

    // ==================== 质量统计 ====================

    @ApiModelProperty(value = "有注释的表数量")
    @JsonProperty("tables_with_comment")
    private Long tablesWithComment;

    @ApiModelProperty(value = "有注释的字段数量")
    @JsonProperty("fields_with_comment")
    private Long fieldsWithComment;

    @ApiModelProperty(value = "有主键的表数量")
    @JsonProperty("tables_with_primary_key")
    private Long tablesWithPrimaryKey;

    @ApiModelProperty(value = "有索引的表数量")
    @JsonProperty("tables_with_index")
    private Long tablesWithIndex;

    @ApiModelProperty(value = "总索引数量")
    @JsonProperty("total_index_count")
    private Long totalIndexCount;

    // ==================== 字段级别统计汇总 ====================

    @ApiModelProperty(value = "平均空值率（百分比）", example = "5.2")
    @JsonProperty("avg_null_ratio")
    private Double avgNullRatio;

    @ApiModelProperty(value = "最大空值率（百分比）", example = "25.8")
    @JsonProperty("max_null_ratio")
    private Double maxNullRatio;

    @ApiModelProperty(value = "高空值率字段数量（空值率>20%）", example = "3")
    @JsonProperty("high_null_ratio_field_count")
    private Long highNullRatioFieldCount;

    @ApiModelProperty(value = "平均唯一值占比（百分比）", example = "85.3")
    @JsonProperty("avg_unique_ratio")
    private Double avgUniqueRatio;

    @ApiModelProperty(value = "唯一字段数量（唯一值占比>95%）", example = "42")
    @JsonProperty("unique_field_count")
    private Long uniqueFieldCount;

    @ApiModelProperty(value = "有数据分布的字段数量", example = "15")
    @JsonProperty("fields_with_distribution_count")
    private Long fieldsWithDistributionCount;

    @ApiModelProperty(value = "已分析字段总数（有统计信息的字段）", example = "104")
    @JsonProperty("analyzed_field_count")
    private Long analyzedFieldCount;
}