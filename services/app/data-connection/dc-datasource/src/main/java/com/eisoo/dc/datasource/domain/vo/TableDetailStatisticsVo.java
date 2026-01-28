package com.eisoo.dc.datasource.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 表详细统计信息 VO
 * 包含表级别和列级别的详细统计
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(value = "表详细统计信息", description = "表级别和列级别的详细统计信息")
public class TableDetailStatisticsVo implements Serializable {

    @ApiModelProperty(value = "数据源ID")
    @JsonProperty("data_source_id")
    private String dataSourceId;

    @ApiModelProperty(value = "表ID")
    @JsonProperty("table_id")
    private String tableId;

    @ApiModelProperty(value = "表名称")
    @JsonProperty("table_name")
    private String tableName;

    // ==================== 表级别统计 ====================

    @ApiModelProperty(value = "表级别统计信息")
    @JsonProperty("table_statistics")
    private TableLevelStatistics tableStatistics;

    /**
     * 表级别统计信息
     */
    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @ApiModel(value = "表级别统计", description = "表的统计指标")
    public static class TableLevelStatistics implements Serializable {

        @ApiModelProperty(value = "总行数")
        @JsonProperty("row_count")
        private Long rowCount;

        @ApiModelProperty(value = "数据大小（字节）")
        @JsonProperty("data_size")
        private Long dataSize;

        @ApiModelProperty(value = "数据大小（格式化显示）")
        @JsonProperty("data_size_formatted")
        private String dataSizeFormatted;

        @ApiModelProperty(value = "索引大小（字节）")
        @JsonProperty("index_size")
        private Long indexSize;

        @ApiModelProperty(value = "索引大小（格式化显示）")
        @JsonProperty("index_size_formatted")
        private String indexSizeFormatted;

        @ApiModelProperty(value = "总大小（数据+索引）")
        @JsonProperty("total_size")
        private Long totalSize;

        @ApiModelProperty(value = "总大小（格式化显示）")
        @JsonProperty("total_size_formatted")
        private String totalSizeFormatted;

        @ApiModelProperty(value = "平均行长度（字节）")
        @JsonProperty("avg_row_length")
        private Long avgRowLength;

        @ApiModelProperty(value = "字符集")
        @JsonProperty("character_set")
        private String characterSet;

        @ApiModelProperty(value = "排序规则")
        @JsonProperty("collation")
        private String collation;

        @ApiModelProperty(value = "引擎类型")
        @JsonProperty("engine")
        private String engine;

        @ApiModelProperty(value = "创建时间")
        @JsonProperty("create_time")
        private String createTime;

        @ApiModelProperty(value = "最后更新时间")
        @JsonProperty("update_time")
        private String updateTime;

        @ApiModelProperty(value = "最后扫描时间")
        @JsonProperty("last_scan_time")
        private String lastScanTime;
    }

    // ==================== 列级别统计 ====================

    @ApiModelProperty(value = "列级别统计信息列表")
    @JsonProperty("column_statistics")
    private List<ColumnStatistics> columnStatistics;

    /**
     * 列级别统计信息
     */
    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @ApiModel(value = "列级别统计", description = "列的统计指标")
    public static class ColumnStatistics implements Serializable {

        @ApiModelProperty(value = "列名")
        @JsonProperty("column_name")
        private String columnName;

        @ApiModelProperty(value = "列类型")
        @JsonProperty("column_type")
        private String columnType;

        @ApiModelProperty(value = "是否主键")
        @JsonProperty("is_primary_key")
        private Boolean isPrimaryKey;

        @ApiModelProperty(value = "是否可为空")
        @JsonProperty("is_nullable")
        private Boolean isNullable;

        @ApiModelProperty(value = "默认值")
        @JsonProperty("default_value")
        private String defaultValue;

        @ApiModelProperty(value = "空值数量")
        @JsonProperty("null_count")
        private Long nullCount;

        @ApiModelProperty(value = "空值占比")
        @JsonProperty("null_ratio")
        private Double nullRatio;

        @ApiModelProperty(value = "唯一值数量")
        @JsonProperty("unique_count")
        private Long uniqueCount;

        @ApiModelProperty(value = "唯一值占比")
        @JsonProperty("unique_ratio")
        private Double uniqueRatio;

        @ApiModelProperty(value = "是否重复")
        @JsonProperty("has_duplicates")
        private Boolean hasDuplicates;

        // ==================== 数值类型统计 ====================

        @ApiModelProperty(value = "最小值")
        @JsonProperty("min_value")
        private String minValue;

        @ApiModelProperty(value = "最大值")
        @JsonProperty("max_value")
        private String maxValue;

        @ApiModelProperty(value = "平均值")
        @JsonProperty("avg_value")
        private String avgValue;

        @ApiModelProperty(value = "标准差")
        @JsonProperty("std_dev")
        private String stdDev;

        @ApiModelProperty(value = "中位数")
        @JsonProperty("median")
        private String median;

        // ==================== 字符串类型统计 ====================

        @ApiModelProperty(value = "平均长度")
        @JsonProperty("avg_length")
        private Double avgLength;

        @ApiModelProperty(value = "最大长度")
        @JsonProperty("max_length")
        private Integer maxLength;

        @ApiModelProperty(value = "最小长度")
        @JsonProperty("min_length")
        private Integer minLength;

        // ==================== 数据分布（直方图） ====================

        @ApiModelProperty(value = "数据分布（前10个最常见值及其计数）")
        @JsonProperty("value_distribution")
        private List<ValueDistribution> valueDistribution;

        /**
         * 值分布
         */
        @Data
        @JsonInclude(JsonInclude.Include.NON_NULL)
        public static class ValueDistribution implements Serializable {
            @ApiModelProperty(value = "值")
            private String value;

            @ApiModelProperty(value = "计数")
            private Long count;

            @ApiModelProperty(value = "占比")
            private Double ratio;
        }

        // ==================== 传统数仓统计信息 ====================

        @ApiModelProperty(value = "注释")
        @JsonProperty("comment")
        private String comment;

        @ApiModelProperty(value = "在索引中")
        @JsonProperty("in_index")
        private Boolean inIndex;

        @ApiModelProperty(value = "索引类型列表")
        @JsonProperty("index_types")
        private List<String> indexTypes;
    }
}
