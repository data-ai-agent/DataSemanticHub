package com.eisoo.dc.gateway.common;

public class QueryConstant {
    public static final String VIRTUAL_V1_STATEMENT = "/v1/statement";

    public static final String VIRTUAL_V1_STATEMENT_V1 = "/v1/statement/execute";

    public static final String VIRTUAL_V1_EXECUTING_V1 = "/v1/statement/executing/";

    public static final String VIRTUAL_V1_STATEMENT_TASK = "/v1/statement/task";

    public static final String VIRTUAL_V1_SCHEMA_TABLE = "/api/metadata/tables/";

    public static final String VIRTUAL_V1_CATALOG_SCHEMA = "/api/metadata/schemas/";

    public static final String VIRTUAL_V1_SCHEMA_COLUMNS = "/api/metadata/columns/";

    public static final String VIRTUAL_V1_SCHEMA = "/api/metadata/schemas/";

    public static final String VIRTUAL_V1_QUERY_TASK = "/v1/query/task/";

    public static final String VIRTUAL_V1_QUERY = "/v1/query/task_";

    public static final String SCHEDULE_MODEL = "/api/data-sync/v2/model";
    public static final String SCHEDULE_MODEL_RUN = "/api/data-sync/v2/model/run/";
    public static final String VIRTUAL_V1_DATA_EXPLORATION = "/v1/data_exploration";

    /**
     * 默认 async-task 用户
     */
    public static final String DEFAULT_ASYNC_TASK_USER = "async_task_user";

    /**
     * 默认 ad-hoc 用户
     */
    public static final String DEFAULT_AD_HOC_USER = "admin";

    /**
     * http header里面携带token的key
     */
    public final static String HTTP_HEADER_TOKEN_KEY = "Authorization";

    /**
     * 版本号规则校验正则
     */
    public final static String REGEX_VERSION_NAME_RULE = "^[V][0-9]{1,4}$";

    /**
     * 版本号规则开头首字母
     */
    public final static String REGEX_VERSION_NAME_RULE_PREFIX = "V";

    /**
     * AF配置中心采用的加密算法
     */
    public static final String CIPHER_ALGORITHM = "RSA/ECB/PKCS1Padding";
}
