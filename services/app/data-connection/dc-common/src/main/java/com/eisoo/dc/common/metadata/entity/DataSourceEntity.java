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

@Data
@Getter
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_data_source_info")
public class DataSourceEntity implements Serializable {
    /**
     * 主键:36位uuid
     */
    @TableId(value = "f_id")
    private String fId;

    /**
     * 数据源展示名称
     */
    @TableField(value = "f_name")
    private String fName;

    /**
     * 数据库类型
     */
    @TableField(value = "f_type")
    private String fType;

    /**
     * 数据源catalog名称
     */
    @TableField(value = "f_catalog")
    private String fCatalog;
    /**
     * 数据库名称
     */
    @TableField(value = "f_database")
    private String fDatabase;
    /**
     * 数据库模式
     */
    @TableField(value = "f_schema")
    private String fSchema;
    /**
     * 连接方式，当前支持http、https、thrift、jdbc
     */
    @TableField(value = "f_connect_protocol")
    private String fConnectProtocol;
    /**
     * 地址
     */
    @TableField(value = "f_host")
    private String fHost;
    /**
     * 端口
     */
    @TableField(value = "f_port")
    private int fPort;
    /**
     * excel、anyshare7、tingyun数据源为用户id，其他数据源为用户名
     */
    @TableField(value = "f_account")
    private String fAccount;
    /**
     * 密码
     */
    @TableField(value = "f_password")
    private String fPassword;
    /**
     * 存储介质，当前仅excel数据源使用
     */
    @TableField(value = "f_storage_protocol")
    private String fStorageProtocol;
    /**
     * 存储路径，当前仅excel、anyshare7数据源使用
     */
    @TableField(value = "f_storage_base")
    private String fStorageBase;
    /**
     * token认证，当前仅inceptor数据源使用
     */
    @TableField(value = "f_token")
    private String fToken;
    /**
     * 副本集名称，仅副本集模式部署的Mongo数据源使用
     */
    @TableField(value = "f_replica_set")
    private String fReplicaSet;

    /**
     * 是否为内置数据源（0 特殊 1 非内置 2 内置），默认为0
     */
    @TableField(value = "f_is_built_in")
    private int fIsBuiltIn;

    /**
     * 描述
     */
    @TableField(value = "f_comment")
    private String fComment;

    /**
     * 创建人
     */
    @TableField(value = "f_created_by_uid")
    private String fCreatedByUid;

    /**
     * 创建时间
     */
    @TableField(value = "f_created_at")
    private LocalDateTime fCreatedAt;

    /**
     * 修改人
     */
    @TableField(value = "f_updated_by_uid")
    private String fUpdatedByUid;

    /**
     * 更新时间
     */
    @TableField(value = "f_updated_at")
    private LocalDateTime fUpdatedAt;
}
