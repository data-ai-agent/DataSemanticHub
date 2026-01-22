package com.eisoo.dc.common.metadata.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.io.Serializable;

/**
 * @author aishu.cn
 * @email xxxx@aishu.cn
 * @String 2023-02-23 17:12:30
 */
@Data
@TableName("t_table")
public class TableOldEntity implements Serializable {
    /**
     * 唯一id，雪花算法
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long fId;
    /**
     * 表名称
     */
    @TableField(value = "f_name")
    private String fName;

    /**
     * 高级参数，默认为"[]"，格式为"[{key:key1, value:value1}]"
     */
    @TableField(value = "f_advanced_params")
    private String fAdvancedParams;

    /**
     * 表描述，默认为空字符串
     */
    @TableField(value = "f_description")
    private String fDescription;

    /**
     * 表数据量，默认0
     */
    @TableField(value = "f_table_rows")
    private Long fTableRows;

    /**
     * schema唯一标识
     */
    @TableField(value = "f_schema_id")
    private Long fSchemaId;

    /**
     * 冗余字段，schema名称
     */
    @TableField(value = "f_schema_name")
    private String fSchemaName;

    /**
     * 数据源唯一标识
     */
    @TableField(value = "f_data_source_id")
    private String fDataSourceId;

    /**
     * 冗余字段，数据源名称
     */
    @TableField(value = "f_data_source_name")
    private String fDataSourceName;

    /**
     * 冗余字段，数据源类型，关联字典表f_dict_type为1时的f_dict_key
     */
    @TableField(value = "f_data_source_type")
    private Integer fDataSourceType;

    /**
     * 冗余字段，数据源类型名称，对应字典表f_dict_type为1时的f_dict_value
     */
    @TableField(value = "f_data_source_type_name")
    private String fDataSourceTypeName;

    /**
     * Table版本号
     */
    @JsonIgnore
    @TableField(value = "f_version")
    private Integer fVersion;

    /**
     * 权限域（目前为预留字段），默认0
     */
    @TableField(value = "f_authority_id")
    private String fAuthorityId;

    /**
     * 创建时间
     */
    @TableField(value = "f_create_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private String fCreateTime;

    /**
     * 创建用户（ID），默认空字符串
     */
    @TableField(value = "f_create_user")
    private String fCreateUser;

    /**
     * 修改时间，默认当前时间
     */
    @TableField(value = "f_update_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private String fUpdateTime;

    /**
     * 修改用户（ID），默认空字符串
     */
    @TableField(value = "f_update_user")
    private String fUpdateUser;

    /**
     * 逻辑删除标识，默认0
     */
    @TableField(value = "f_delete_flag")
    private Integer fDeleted;

    /**
     * 修改时间
     */
    @TableField(value = "f_delete_time")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private String fDeleteTime;
    /**
     * 扫描来源
     */
    @TableField(value = "f_scan_source")
    private Integer fScanSource;
}
