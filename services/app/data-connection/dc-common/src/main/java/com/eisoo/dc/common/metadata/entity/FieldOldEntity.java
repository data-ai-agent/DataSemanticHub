package com.eisoo.dc.common.metadata.entity;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * @author aishu.cn
 * @email xxxx@aishu.cn
 * @date 2023-02-23 17:12:30
 */
@Data
@TableName("t_table_field")
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class FieldOldEntity implements Serializable {
    @TableField(value = "f_field_name")
    private String fFieldName;
    @TableField(value = "f_field_type")
    private String fFieldType;
    @TableField(value = "f_field_length", insertStrategy = FieldStrategy.IGNORED, updateStrategy = FieldStrategy.IGNORED)
    private Integer fFieldLength;

    /**
     * 字段精度
     */
    @TableField(value = "f_field_precision", insertStrategy = FieldStrategy.IGNORED, updateStrategy = FieldStrategy.IGNORED)
    private Integer fFieldPrecision;

    /**
     * 字段注释，默认为空字符串
     */
    @TableField(value = "f_field_comment")
    private String fFieldComment;

    /**
     * Table唯一标识
     */
    @JsonIgnore
    @TableField(value = "f_table_id")
    private Long fTableId;

    /**
     * 高级参数，默认为"[]"，格式为"[{key:key1, value:value1}]"
     */
    @TableField(value = "f_advanced_params")
    private String fAdvancedParams;

    /**
     * 更新标识
     */
    @TableField(value = "f_update_flag")
    private Boolean fUpdateFlag;

    /**
     * 更新时间
     */
    @TableField(value = "f_update_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date fUpdateTime;

    /**
     * 删除标识
     */
    @TableField(value = "f_delete_flag")
    private Boolean fDeleteFlag;

    /**
     * 删除时间
     */
    @TableField(value = "f_delete_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date fDeleteTime;
}
