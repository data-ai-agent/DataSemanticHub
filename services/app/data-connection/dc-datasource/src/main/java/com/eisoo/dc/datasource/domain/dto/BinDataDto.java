package com.eisoo.dc.datasource.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BinDataDto {

    /**
     * 数据源catalog名称，程序内部生成，生成规则：类型+随机数
     */
    private String catalogName;
    /**
     * 数据库名称
     */
    private String databaseName;
    /**
     * 数据库模式，主要针对数据源opengauss、gaussdb、pg、oracle、sqlserver、hologres、kingbase
     */
    private String schema;
    /**
     * 连接方式，当前支持http、https、thrift、jdbc
     */
    private String connectProtocol;
    /**
     * 地址
     */
    private String host;
    /**
     * 端口
     */
    private int port;
    /**
     * excel、anyshare7数据源为应用账户id，tingyun数据源为用户id，其他数据源为用户名
     */
    private String account;
    /**
     * 密码，anyshare7数据源为应用账户密码，其他数据源为用户密码
     */
    private String password;
    /**
     * 存储介质，当前仅excel数据源使用
     */
    private String storageProtocol;
    /**
     * 存储路径，当前仅excel、anyshare7数据源使用
     */
    private String storageBase;
    /**
     * token认证，当前仅inceptor数据源使用
     */
    private String token;
    /**
     * 副本集名称，仅副本集模式部署的Mongo数据源使用
     */
    private String replicaSet;
}
