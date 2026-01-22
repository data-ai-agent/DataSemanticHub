package com.eisoo.dc.common.metadata.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/*
 * @Author paul
 *
 **/
@Data
@Getter
@NoArgsConstructor
@AllArgsConstructor
@TableName("datasource")
public class VegaDatasourceEntity implements Serializable {
    /**
     * 主键，生成规则:32位uuid
     */
    @TableId(value = "id")
    private String id;

    /**
     * 数据源雪花id
     */
    @TableField(value = "data_source_id")
    private Long dataSourceId;

    /**
     * 数据源名称
     */
    @TableField(value = "name")
    private String name;

    /**
     * 数据源catalog名称：类型+随机数
     */
    @TableField(value = "catalog_name")
    private String catalogName;

    /**
     * 数据源类型 1:记录型、2:分析型
     */
    @TableField(value = "source_type")
    private Integer sourceType;

    /**
     * 数据库类型。已废弃，使用 type_name 替代
     */
    @TableField(value = "type")
    private Integer type;

    /**
     * 数据库类型
     */
    @TableField(value = "type_name")
    private String typeName;

    /**
     * 信息系统名称
     */
    @TableField(value = "info_system_id")
    private String infoSystemId;

    /**
     * 数据库名称
     */
    @TableField(value = "database_name")
    private String databaseName;

    /**
     * schema
     */
    @TableField(value = "schema")
    private String schema;

    /**
     * 数据库地址
     */
    @TableField(value = "host")
    private String host;

    /**
     * 端口
     */
    @TableField(value = "port")
    private Integer port;

    /**
     * 数据库用户名
     */
    @TableField(value = "username")
    private String username;

    /**
     * 数据库密码
     */
    @TableField(value = "password")
    private String password;

    /**
     * excel存储位置
     */
    @TableField(value = "excel_protocol")
    private String excelProtocol;

    /**
     * excel路径
     */
    @TableField(value = "excel_base")
    private String excelBase;

    /**
     * 数据视图源
     */
    @TableField(value = "data_view_source")
    private String dataViewSource;

    /**
     * 数据源状态
     */
    @TableField(value = "status")
    private Integer status;

    /**
     * 元数据采集平台任务id
     */
    @TableField(value = "metadata_task_id")
    private String metadataTaskId;

    /**
     * 创建人
     */
    @TableField(value = "created_by_uid")
    private String createdByUid;

    /**
     * 创建时间
     */
    @TableField(value = "created_at")
    private LocalDateTime createdAt;

    /**
     * 修改人
     */
    @TableField(value = "updated_by_uid")
    private String updatedByUid;

    /**
     * 更新时间
     */
    @TableField(value = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * inceptor数据库存储token认证
     */
    @TableField(value = "token")
    private String token;

}