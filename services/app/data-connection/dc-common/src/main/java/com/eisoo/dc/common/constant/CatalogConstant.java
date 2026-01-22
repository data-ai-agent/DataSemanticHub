package com.eisoo.dc.common.constant;

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
    public static final String HIVE_HADOOP2_CATALOG = "hive-hadoop2";
    public static final String HIVE_JDBC_CATALOG="hive-jdbc";
    public static final String HIVE_CATALOG="hive";
    public static final String MYSQL_CATALOG = "mysql";
    public static final String MONGO_CATALOG = "mongodb";
    public static final String POSTGRESQL_CATALOG = "postgresql";
    public static final String SQLSERVER_CATALOG = "sqlserver";
    public static final String MARIA_CATALOG = "maria";
    public static final String ORACLE_CATALOG = "oracle";
    public static final String REDIS_CATALOG="redis";
    public static final String CLICKHOUSE_CATALOG="clickhouse";
    public static final String HOLOGRES_CATALOG="hologres";
    public static final String OPENGAUSS_CATALOG="opengauss";
    public static final String MAXCOMPUTE_CATALOG="maxcompute";
    public static final String GAUSSDB_CATALOG="gaussdb";
    public static final String DORIS_CATALOG="doris";
    public static final String OLK_VIEW_VDM="olk_view_vdm";

    public static final String INCEPTOR_JDBC_CATALOG="inceptor-jdbc";
    public static final String DAMENG_CATALOG="dameng";
    public static final String EXCEL_CATALOG="excel";
    public static final String KINGBASE_CATALOG="kingbase";
    public static final String TINGYUN_CATALOG="tingyun";
    public static final String ANYSHARE7_CATALOG="anyshare7";
    public static final String OPENSEARCH_CATALOG="opensearch";
    public static final String INDEX_BASE_DS="index_base";

    public static final String TEST_CATALOG_PREFIX="test_";





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
     * HIVE配置
     */
    public static final String HIVE_METASTORE_URI = "hive.metastore.uri";
    public static final String HIVE_ALLOW_DROP_TABLE="hive.allow-drop-table";
    public static final String HIVE_ALLOW_TRUNCATE_TABLE="hive.allow-truncate-table";
    public static final String HIVE_MAX_PARTITIONS_PER_WRITERS="hive.max-partitions-per-writers";

    /**
     * connect protocol
     */

    public static final String CONNECT_PROTOCOL_THRIFT="thrift";

    /**
     * storage protocol
     */

    public static final String STORAGE_PROTOCOL_ANYSHARE="anyshare";
    public static final String STORAGE_PROTOCOL_DOCLIB="doclib";

    /**
     * maxcompute 配置项
     */

    public static final String METADATA_CACHE_GLOBAL="metadata-cache-global";
    public static final String METADATA_CACHE_TTL="metadata-cache-ttl";
    public static final String METADATA_CACHE_MAXIMUM_SIZE="metadata-cache-maximum-size";
    public static final String METADATA_CACHE_ENABLED="metadata-cache-enabled";


    /**
     * 连接池配置
     */
    public static final String USE_CONNECTION_POOL="use-connection-pool";
    public static final String JDBC_CONNECTION_POOL_BLOCKWHENEXHAUSTED="jdbc.connection.pool.blockWhenExhausted";

    /**
     * connector config
     */
    public static final String CONNECTOR_CONFIG_PATH = "/connector/";
    public static final String CONNECTOR_VEGA = "vega";



}
