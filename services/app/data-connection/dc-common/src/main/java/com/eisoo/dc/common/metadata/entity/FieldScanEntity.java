package com.eisoo.dc.common.metadata.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.io.Serializable;

/**
 * @author Tian.lan
 */
@Data
@TableName("t_table_field_scan")
public class FieldScanEntity implements Serializable {
    /**
     * 扫描任务唯一id
     */
    @TableId(value = "f_id")
    private String fId;
    /**
     * 字段名
     */
    @TableField(value = "f_field_name")
    private String fFieldName;
    /**
     * Table唯一标识
     */
    @TableField(value = "f_table_id")
    private String fTableId;

    /**
     * 表名称
     */
    @TableField(value = "f_table_name")
    private String fTableName;
    /**
     * 字段类型
     */
    @TableField(value = "f_field_type")
    private String fFieldType;
    /**
     * 字段长度
     */
    @TableField(value = "f_field_length")
    private Integer fFieldLength;
    /**
     * 字段精度
     */
    @TableField(value = "f_field_precision")
    private Integer fFieldPrecision;
    /**
     * 字段注释
     */
    @TableField(value = "f_field_comment")
    private String fFieldComment;
    /**
     * 字段序号
     */
    @TableField(value = "f_field_order_no")
    private String fFieldOrderNo;

    /**
     * 高级参数
     */
    @TableField(value = "f_advanced_params")
    private String fAdvancedParams;

    @TableField(value = "f_version")
    private Integer fVersion;
    /**
     * 创建时间
     */
    @TableField(value = "f_create_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private String fCreatTime;
    /**
     * 创建用户
     */
    @TableField(value = "f_create_user")
    private String fCreatUser;
    /**
     * 修改时间
     */
    @TableField(value = "f_operation_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private String fOperationTime;
    /**
     * 修改用户
     */
    @TableField(value = "f_operation_user")
    private String fOperationUser;
    /**
     * 状态：0新增1删除2更新
     */
    @TableField(value = "f_operation_type")
    private Integer fOperationType = 0;
    /**
     * 状态是否发生变化：0 否1 是
     */
    @TableField(value = "f_status_change")
    private Integer fStatusChange = 0;
}
