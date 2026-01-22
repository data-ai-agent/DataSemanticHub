package com.eisoo.dc.gateway.common;

public class Detail {

    public final static String SOURCE_NOT_NULL = "source对象不能为null。";

    public final static String TARGET_NOT_NULL = "target对象不能为null。";

    public final static String SOURCE_TARGET_ERROR = "source[%s]和target[%s]必须为同一对象。";

    public final static String OPERATOR_UNSUPPORTED = "%s算子规则不支持。";

    public final static String NAME_MISSING = "参数:name缺失。";

    public final static String IS_ENABLE_MISSING = "参数:is_enable缺失。";

    public final static String X_PRESTO_USER_MISSING = "请求头X-Presto-User参数为空。";

    public final static String BUILT_IN_CATALOG_CONFLICT = "与内置视图源名称 olk_view_vdm 冲突。";

    public final static String CATALOG_TYPE_INCONSISTENT = "数据源类型不一致。";

    public final static String SQL_NOT_SELECT = "sql必须为查询语句。";

    public final static String SQL_LIMIT = "每页数据量不能超过1000。";

    public final static String JSON_ANALYZE_ERROR = "json解析错误。";

    public final static String PROJECT_NODE_RULE_NOT_CANCELED = "不能取消ProjectNode配置。";

    public final static String MISSING_DEPENDENCY_RULES_FILTER_OR_PROJECT = "缺少依赖规则FilterNode或ProjectNode配置。";

    public final static String MISSING_DEPENDENCY_RULES_AGGREGATION = "缺少依赖规则AggregationNode配置。";

    public final static String CONNECTOR_CONFIG_CACHE_JSON_ANALYZE_ERROR = "connector config cache parse json error.";

    public final static String CATALOG_RULE_CACHE_JSON_ANALYZE_ERROR = "catalog rule cache parse json error.";

    public final static String DB_ERROR = "访问数据库发生异常。";

    public final static String BUILT_IN_CATALOG_DEL_UNSUPPORTED = "内置数据源不允许删除。";

    public final static String DEFAULT_VIEW_DEL_UNSUPPORTED = "默认视图不允许删除。";

    public final static String CATALOG_EXIST_VIEW = "视图源下存在视图，不能删除。";

    public final static String DB_CONNECT_FAILED = "数据库连接失败。";

    public final static String BUILT_IN_SCHEMA_CREATE_ERROR = "指定视图schema创建失败。";

    public final static String BUILT_IN_CATALOG_CREATE_ERROR = "创建内置视图源失败。";

    public final static String CATALOG_TYPE_UNSUPPORTED = "数据源类型不支持。";

    public final static String SOURCE_TYPE_NULL = "type原始数据类型参数为空。";

    public final static String CONNECTOR_CONFIG_INCONSISTENT = "connectorName与connection-url协议不一致。";

    public final static String CATALOG_DB_REQUIRED = "添加该类型数据源需要指定数据库。";

    public final static String CATALOG_MONGO_SEEDS_NOT_NULL = "mongodb数据源参数mongodb.seeds不能为空。";

    public final static String CATALOG_MONGO_SEEDS_ERROR = "mongodb数据源参数mongodb.seeds不合法。";

    public final static String CATALOG_MONGO_REQUIRED_REPLICA_SET_NOT_NULL = "mongodb数据源副本集名称参数mongodb.required-replica-set不能为空。";

    public final static String CATALOG_MONGO_CREDENTIALS_NOT_NULL = "mongodb数据源参数mongodb.credentials不能为空。";

    public final static String CATALOG_MONGO_CREDENTIALS_ERROR = "mongodb数据源参数mongodb.credentials格式错误。";

    public final static String CATALOG_PROPERTIES_NOT_NULL = "数据源连接配置参数不能为空。";

    public final static String SOURCE_TYPE_OR_INDEX_NULL = "原始数据类型sourceTypeName为空或类型索引index为空。";

    public final static String QUERY_NOT_FOUND = "Query not found.";

    public final static String QUERY_TYPE_ERROR = "不支持的样例数据获取类型。";

    public final static String CATALOG_DB_TYPE_ERROR = "数据源与数据库不一致。";

    public final static String KEY_FLOAT_OR_DOUBLE_ERROR = "主键字段不能为float或double类型。";

    public final static String FIELD_ERROR = "%s的值[%s]不符合接口要求。";

    public final static String TRUNCATE_TABLE_UNSUPPORTED = "不支持清空表。";

    public final static String CREATE_TABLE_UNSUPPORTED = "不支持创建表。";

    public final static String INSERT_DATA_UNSUPPORTED = "不支持插入数据。";

    public final static String CATALOG_NAME_ERROR = "数据源名称不规范。";

    public final static String TABLE_NAME_ERROR = "表名称不规范。";

    public final static String TYPE_LENGTH_ERROR = "类型长度异常。";

    public final static String PAGE_OR_SIZE_ERROR = "PageNum、PageSize必须是大于等于1的整数。";

    public final static String SQL_NULL = "SQL query为空。";

    public final static String RULE_NOT_NULL = "规则不能为空。";

    public final static String CATALOG_TYPE_NOT_NULL = "数据源类型不能为空。";

    public final static String ENUM_UNSUPPORTED = "不支持的枚举值。";

    public final static String PASSWORD_ERROR = "密码解密错误。";

    public final static String URL_ERROR = "URL解析异常:%s。";

    public final static String CONNECT_ERROR = "连接失败:%s。";

    public final static String READ_FILE_ERROR = "读取文件失败:%s。";

    public final static String CATALOG_TYPE_ERROR = "数据源存在但数据源类型不一致无法更新,catalogName:%s。";

    public final static String READ_SHEET_ERROR = "读取sheet失败:%s。";

    public final static String TABLE_NAME_NOT_NULL = "table_name不能为空。";

    public final static String TABLE_NAME_EXIST = "table_name已存在。";

    public final static String VDM_CATALOG_NOT_NULL = "vdm_catalog不能为空。";

    public final static String FILE_TYPE_ERROR = "文件类型错误:%s。";

    public final static String FILE_NOT_EXIST = "文件不存在:%s。";

    public final static String START_CELL_ERROR = "start_cell不合法。";

    public final static String END_CELL_ERROR = "end_cell不合法。";

    public final static String START_CELL_RANGE_ERROR = "起始单元格超过最大限制。";

    public final static String EXCEL_FILENAME_ERROR = "Excel文件名不合法。";

    public final static String END_CELL_RANGE_ERROR = "结束单元格超过最大限制。";

    public final static String CELL_RANGE_ERROR = "单元格范围不正确，开始单元格不能大于结束单元格。";

    public final static String CELL_RANGE_AND_COLUMNS_INCONSISTENT = "指定列数与columns列类型数量不一致。";

    public final static String COLUMN_NOT_NULL = "列名不能为空。";

    public final static String COLUMN_ERROR = "列名长度不合法。";

    public final static String COLUMN_NAME_FORMAT_ERROR = "列名格式不合法。";

    public final static String COLUMN_TYPE_NOT_NULL = "字段类型不能为空。";

    public final static String COLUMN_NAME_ERROR = "字段名称重复:%s。";

    public final static String COLUMN_TYPE_UNSUPPORTED = "字段类型不支持。";

    public final static String CATALOG_NOT_EXIST_FILE = "catalog下没有该文件。";

    public final static String EXCEL_CATALOG_TYPE_UNSUPPORTED = "目标数据源不支持excel类型。";

    public final static String EXCEL_VIEW_OPERATE_UNSUPPORTED = "不支持通用视图管理接口对excel类型视图进行操作。";

    public final static String PARAMETER_ILLEGAL = "%s不合法。";

    public final static String PARAMETER_NOT_NULL = "%s不能为空。";

    public final static String CATALOG_TEST_CONNECT_UNSUPPORTED = "该数据源类型不支持测试连接：%s。";

    public final static String USERNAME_OR_PASSWORD_ERROR = "用户名或密码错误。";
    public final static String ANYSHARE_TOKEN_ERROR = "AnyShare认证失败。";


    public final static String STATEMENT_MISSING = "请求statement参数为空";
    public final static String TASKID_MISSING = "请求task_id参数为空";
    public final static String TYPE_NOT_NULL = "type不能为空";
    public final static String TYPE_ENUM_MESSAGE = "type必须为0或1";
    public final static String TYPE_ENUM_MESSAGE_ADD = "type必须为0或1或2";

    public final static String BODY_MESSAGE = "type与请求体结构不匹配";
    public final static String REQUEST_NOT_NULL = "请求体不能为空";
    public final static String STATEMENT_NOT_NULL = "statement不能为空";
    public final static String TOPIC_ERROR = "参数异常: topic 必须为字符串类型";
    public final static String FIELD_NOT_NULL = "fields不能为空";
    public final static String CATALOG_NOT_NULL = "catalog不能为空";
    public final static String SCHEMA_NOT_NULL = "schema不能为空";
    public final static String TABLE_NOT_NULL = "table不能为空";
    public final static String TASKID_FORMAT_ERROR = "请求task_id数据格式不对";
    public final static String CANCELED_ERROR = "任务已取消过了,不能重复取消";
    public final static String CANCELED_FINISHED_ERROR = "完成";
    public final static String TASK_DELETED = "任务已删除,不能进行取消";
    public final static String TASK_NOT_EXISTS = "任务不存在";
    public final static String TASK_RUNNING_ERROR = "任务正在运行中,不能取消";

    public final static String ID_NOT_EXISTS = "数据源ID不存在。";
    public final static String CREATE_DATASOURCE_FAILED = "创建数据源失败。";
    public final static String UPDATE_DATASOURCE_FAILED = "更新数据源失败。";
    public final static String DELETED_DATASOURCE_FAILED = "删除数据源失败。";
    public final static String DATASOURCE_NAME_EXIST = "数据源名称已存在:%s。";
    public final static String DATABASE_NAME_NOT_EMPLOY = "数据库名称不能为空。";
    public final static String DATASOURCE_AUTH_NOT_EMPLOY = "数据源身份认证方式必须为用户名密码认证和Token认证其中一种。";
    public final static String EXCEL_BASE_AND_PROTOCOL_NOT_EMPLOY = "excel存储位置及存储路径不能为空。";

    public static final String TIME_OUT_NOT_NUMBER = "timeOut不是一个数字类型";
    public static final String BATCH_SIZE_NOT_NUMBER = "batchSize不是一个数字类型";
    public static final String CATALOG_NAME_IS_NULL = "catalog_name不能为空。";
    public static final String SQL_IS_NULL = "sql不能为空。";
    public static final String DSL_IS_NULL = "dsl不能为空。";
            ;
}
