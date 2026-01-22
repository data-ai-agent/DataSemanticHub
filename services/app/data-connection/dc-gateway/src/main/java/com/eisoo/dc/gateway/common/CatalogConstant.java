package com.eisoo.dc.gateway.common;

/**
 * @Author zdh
 **/
public class CatalogConstant {
    /**
     * 数据源url
     */
    public static final String MYSQL_URL = "jdbc:mysql:";
    public static final String MARIADB_URL = "jdbc:mariadb:";
    public static final String POSTGRESQL_URL = "jdbc:postgresql:";
    public static final String SQLSERVER_URL = "jdbc:sqlserver:";
    public static final String ORACLE_URL = "jdbc:oracle:";
    public static final String HIVE_URL = "jdbc:hive2:";
    public static final String CLICKHOUSE_URL = "jdbc:clickhouse:";
    public static final String HOLOGRES_URL = "jdbc:hologres:";
    public static final String INCEPTOR_JDBC_URL = "jdbc:inceptor2:";
    public static final String OPENGAUSS_URL = "jdbc:opengauss:";
    public static final String DORIS_URL = "jdbc:doris:";
    public static final String HIVE_THRIFT_URL = "thrift:";
    public static final String DAMENG_URL = "jdbc:dm:";
    public static final String GAUSSDB_URL = "jdbc:gaussdb:";

    /**
     * 数据源类型配置
     */
    public static final String HIVE_CATALOG = "hive-hadoop2";
    public static final String MYSQL_CATALOG = "mysql";
    public static final String MONGO_CATALOG = "mongodb";
    public static final String POSTGRESQL_CATALOG = "postgresql";
    public static final String SQLSERVER_CATALOG = "sqlserver";
    public static final String MARIA_CATALOG = "maria";
    public static final String ORACLE_CATALOG = "oracle";
    public static final String REDIS_CATALOG="redis";
    public static final String CLICKHOUSE_CATALOG="clickhouse";
    public static final String HOLOGRES_CATALOG="hologres";
    public static  final String OPENGAUSS_CATALOG="opengauss";
    public static  final String GAUSSDB_CATALOG="gaussdb";
    public static final String DORIS_CATALOG="doris";
    public static final String VDM_CATALOG="vdm";
    public static final String OLK_VIEW_VDM="olk_view_vdm";

    public static final String HIVE_JDBC_CATALOG="hive-jdbc";

    public static final String INCEPTOR_JDBC_CATALOG="inceptor-jdbc";
    public static final String DAMENG_CATALOG="dameng";
    public static final String EXCEL_CATALOG="excel";
    public static final String CONNECTION_URL = "connection-url";
    public static final String TOKEN = "guardianToken";

    public static final String USER="connection-user";

    public static final String PASSWORD="connection-password";


    public static final String VIEW_DEFAULT_SCHEMA = "default";

    /**
     * mysql 配置项
     */
    public static final String PUSH_DOWN_MODULE = "jdbc.pushdown-module";

    public static final String CASE_INSENSITIVE_NAME="case-insensitive-name-matching";


    /**
     * openlookeng请求地址
     */
    public static final String VIRTUAL_V1_CATALOG = "/v1/catalog";

    public static final String VIRTUAL_V1_CATALOG_RULE = "/v1/rule";

    public static final String VIRTUAL_V1_SHOW_CATALOG = "/v1/showCatalog";
    public static final String VIRTUAL_METADATA_SCHEMAS = "/api/metadata/schemas";

    /**
     * 标识
     */
    public static final String COMMENT = "已删除数据源";
    /**
     * HIVE配置
     */
    public static final String HIVE_PROPERTIES_PATH = "/hive.properties";

    public static final String HIVE_CORE_SITE = "/core-site.xml";
    public static final String HIVE_HDFS_SITE = "/hdfs-site.xml";
    public static final String HIVE_METASTORE_URI = "hive.metastore.uri";

    /**
     * connector config
     */
    public static final String CONNECTOR_CONFIG_PATH = "/connector/config/";
    public static final String CONNECTOR_IMAGE_PATH = "/connector/image/";

    public static final String RULE_CONFIG_PATH = "/rule";
    public static final String CONNECTOR_OLK = "olk";
    public static final String CONNECTOR_VEGA = "vega";

    public static final String ERROR_MSG="Query not found";

    public static final String CONNECTOR_NAME = "connector.name";
    public static final String CONNECTOR_SOURCE_OLK = "source_olk";


    public static final String CANCEL_MAX_RUN = "cancel-max-run";
    public static final String CANCEL_MAX_EXECUTION = "cancel-max-execution";

    /**
     * storage protocol
     */

    public static final String STORAGE_PROTOCOL_ANYSHARE="anyshare";
    public static final String STORAGE_PROTOCOL_DOCLIB="doclib";

}
