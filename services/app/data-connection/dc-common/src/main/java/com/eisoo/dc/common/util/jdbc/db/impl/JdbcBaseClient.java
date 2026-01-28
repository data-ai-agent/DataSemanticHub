package com.eisoo.dc.common.util.jdbc.db.impl;

import com.alibaba.fastjson2.JSON;
import com.eisoo.dc.common.connector.ConnectorConfig;
import com.eisoo.dc.common.connector.TypeConfig;
import com.eisoo.dc.common.constant.CatalogConstant;
import com.eisoo.dc.common.enums.ConnectorEnums;
import com.eisoo.dc.common.metadata.entity.AdvancedParamsDTO;
import com.eisoo.dc.common.metadata.entity.DataSourceEntity;
import com.eisoo.dc.common.metadata.entity.FieldScanEntity;
import com.eisoo.dc.common.metadata.entity.TableScanEntity;
import com.eisoo.dc.common.util.RSAUtil;
import com.eisoo.dc.common.util.jdbc.db.DataSourceConfig;
import com.eisoo.dc.common.util.jdbc.db.DbClientInterface;
import com.eisoo.dc.common.util.jdbc.db.DbConnectionStrategyFactory;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.sql.*;
import java.util.*;

import static com.alibaba.fastjson2.JSONWriter.Feature.WriteMapNullValue;

/**
 * @author Tian.lan
 */
@Slf4j
public abstract class JdbcBaseClient implements DbClientInterface {
    @Override
    public Connection getConnection(DataSourceConfig config) throws Exception {
        Class.forName(config.getDriverClass());
        Properties props = new Properties();
        String url = config.getUrl();
        String token = config.getToken();
        if (CatalogConstant.INCEPTOR_JDBC_CATALOG.equals(config.getDbType()) && StringUtils.isNotEmpty(token)) {
            url = url + ";guardianToken=" + token;
            log.info("inceptor-jdbc:url:{}", url);
        } else {
            props.setProperty("user", config.getUsername());
            props.setProperty("password", config.getPassword());
        }
        // 2. 获取连接
        return DriverManager.getConnection(
                url,
                props
        );
    }

    @Override
    public Map<String, TableScanEntity> getTables(DataSourceEntity dataSourceEntity, List<String> scanStrategy) throws Exception {
        String fType = dataSourceEntity.getFType();
        String fSchema = dataSourceEntity.getFSchema();
        if (StringUtils.isEmpty(fSchema)) {
            fSchema = dataSourceEntity.getFDatabase();
        }
        String fCatalog = dataSourceEntity.getFCatalog();
        String fId = dataSourceEntity.getFId();

        Map<String, TableScanEntity> currentTables = new HashMap<>();
        String fToken = dataSourceEntity.getFToken();
        String fPassword = dataSourceEntity.getFPassword();

        // 调试日志：验证密码解密
        log.info("【JDBC连接调试】dsId:{}, type:{}, host:{}, port:{}, account:{}",
            dataSourceEntity.getFId(),
            fType,
            dataSourceEntity.getFHost(),
            dataSourceEntity.getFPort(),
            dataSourceEntity.getFAccount());
        log.info("【JDBC连接调试】原始密码长度:{}, 是否为空:{}",
            fPassword != null ? fPassword.length() : 0,
            StringUtils.isEmpty(fPassword));

        if (StringUtils.isNotEmpty(fPassword)) {
            try {
                String decryptedPassword = RSAUtil.decrypt(fPassword);
                log.info("【JDBC连接调试】密码解密成功，解密后密码长度:{}", decryptedPassword.length());
                fPassword = decryptedPassword;
            } catch (Exception e) {
                log.error("【JDBC连接调试】密码解密失败", e);
            }
        }

        DataSourceConfig dataSourceConfig = new DataSourceConfig(
                fType,
                DbConnectionStrategyFactory.DRIVER_CLASS_MAP.get(fType),
                DbConnectionStrategyFactory.getDriverURL(dataSourceEntity),
                dataSourceEntity.getFAccount(),
                fPassword,
                fToken);

        log.info("【JDBC连接调试】JDBC URL: {}", DbConnectionStrategyFactory.getDriverURL(dataSourceEntity));
        Connection connection = null;
        Statement statement = null;
        ResultSet resultSet = null;
        try {
            connection = this.getConnection(dataSourceConfig);
            statement = connection.createStatement();
            long offset = 0;
            String sql = DbConnectionStrategyFactory.TABLE_METADATA_SQL_TEMPLATE_MAP.get(fType);
            while (true) {
                int currentBatchSize = 0;
                if ("oracle".equals(fType)) {
                    sql = String.format(sql, offset + 1000, fSchema);
                } else {
                    sql = String.format(sql, fSchema, offset);
                }
                log.info("【{}采集table元数据】:dsId:{};sql:\n {}", fType, fId, sql);
                // 高级参数
                List<AdvancedParamsDTO> advancedParamsDTOList = new ArrayList<>();
                AdvancedParamsDTO vCatalogNameParam = new AdvancedParamsDTO("vCatalogName", "fCatalog");
                advancedParamsDTOList.add(vCatalogNameParam);
//                String advancedParams = new JSONArray(priStoreSize).toJSONString();
                resultSet = statement.executeQuery(sql);
                long startTimeScan = System.currentTimeMillis();
                while (resultSet.next()) {
                    TableScanEntity tableScanEntity = new TableScanEntity();
                    tableScanEntity.setFId(UUID.randomUUID().toString());
                    tableScanEntity.setFName(resultSet.getString("table_name"));
                    tableScanEntity.setFDescription(resultSet.getString("remarks"));

                    String tableName = tableScanEntity.getFName();

                    // 高级参数 - MySQL 和 MariaDB
                    if (ConnectorEnums.MYSQL.getConnector().equals(fType) || ConnectorEnums.MARIA.getConnector().equals(fType)) {
                        String engine = resultSet.getString("ENGINE");
                        long tableRows = resultSet.getLong("TABLE_ROWS");
                        String createTime = resultSet.getString("CREATE_TIME");
                        String updateTime = resultSet.getString("UPDATE_TIME");
                        double dataLengthMB = resultSet.getDouble("DATA_LENGTH");
                        double indexLengthMB = resultSet.getDouble("INDEX_LENGTH");

                        // 转换为字节
                        long dataLengthBytes = (long) (dataLengthMB * 1024 * 1024);
                        long indexLengthBytes = (long) (indexLengthMB * 1024 * 1024);

                        advancedParamsDTOList.add(new AdvancedParamsDTO("engine", engine));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("table_rows", String.valueOf(tableRows)));
                        tableScanEntity.setFTableRows((int) tableRows);
                        advancedParamsDTOList.add(new AdvancedParamsDTO("create_time", createTime));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("update_time", updateTime));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("data_length", String.valueOf(dataLengthBytes)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("index_length", String.valueOf(indexLengthBytes)));

                        // 查询主键和索引信息
                        try {
                            String indexSql = String.format(
                                "SELECT COUNT(DISTINCT CASE WHEN NON_UNIQUE = 0 AND COLUMN_NAME = 'PRIMARY' THEN index_name END) as pk_count, " +
                                "COUNT(DISTINCT index_name) as index_count " +
                                "FROM information_schema.statistics " +
                                "WHERE table_schema = '%s' AND table_name = '%s'",
                                fSchema, tableName);

                            Statement indexStatement = null;
                            ResultSet indexResultSet = null;
                            try {
                                indexStatement = connection.createStatement();
                                indexResultSet = indexStatement.executeQuery(indexSql);

                                if (indexResultSet.next()) {
                                    long pkCount = indexResultSet.getLong("pk_count");
                                    long indexCount = indexResultSet.getLong("index_count");

                                    advancedParamsDTOList.add(new AdvancedParamsDTO("has_primary_key", String.valueOf(pkCount > 0)));
                                    advancedParamsDTOList.add(new AdvancedParamsDTO("primary_key_count", String.valueOf(pkCount)));
                                    advancedParamsDTOList.add(new AdvancedParamsDTO("index_count", String.valueOf(indexCount)));
                                }
                            } finally {
                                if (indexResultSet != null) {
                                    try {
                                        indexResultSet.close();
                                    } catch (Exception e) {
                                        // ignore
                                    }
                                }
                                if (indexStatement != null) {
                                    try {
                                        indexStatement.close();
                                    } catch (Exception e) {
                                        // ignore
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Failed to fetch index info for table: {}", tableName, e);
                        }

                        if ("VIEW".equals(tableScanEntity.getFDescription())) {
                            tableScanEntity.setFDescription("");
                        }
                    }
                    tableScanEntity.setFAdvancedParams(JSON.toJSONString(advancedParamsDTOList, WriteMapNullValue));
                    String tableType = resultSet.getString("table_type");
                    Integer type = null;
                    if (StringUtils.isNotEmpty(tableType)) {
                        if ("table".equalsIgnoreCase(tableType)) {
                            type = 0;
                        } else if ("view".equalsIgnoreCase(tableType)) {
                            type = 1;
                        }
                    }
                    tableScanEntity.setFScanSource(type);
                    tableScanEntity.setFDataSourceName(dataSourceEntity.getFName());
                    ++currentBatchSize;
                    currentTables.put(tableScanEntity.getFName(), tableScanEntity);
                }
                long endTime = System.currentTimeMillis();
                log.info("采集table元数据:[{}}] schema [{}}] startTime [{}}] endTime [{}}] currentBatchSize [{}}] totalSize [{}}]",
                        fCatalog,
                        fSchema,
                        startTimeScan,
                        endTime,
                        currentBatchSize,
                        currentTables.size());
                if (currentTables.size() == 0) {
                    break;
                }
                if (currentTables.size() < 1000) {
                    break;
                }
                offset += 1000;
            }
            log.info("-----------------------【采集table元数据】成功！ catalog [{}] schema [{}] totalSize [{}] -----------------------",
                    fCatalog,
                    fSchema,
                    currentTables.size());
        } catch (Exception e) {
            log.error("【{}采集table元数据】:dsId:{}", fType, fId, e);
            throw e;
        } finally {
            try {
                resultSet.close();
                statement.close();
                connection.close();
            } catch (Exception e) {
            }
        }
        return currentTables;
    }


    @Override
    public Map<String, FieldScanEntity> getFields(String tableName, DataSourceEntity dataSourceEntity, ConnectorConfig connectorConfig) throws Exception {
        return getFieldsInner(tableName, dataSourceEntity, connectorConfig);
    }

    // 模板方法：定义固定流程（用final防止子类修改执行顺序）
    public final Map<String, FieldScanEntity> getFieldsInner(String tableName, DataSourceEntity dataSourceEntity, ConnectorConfig connectorConfig) throws Exception {
        List<FieldScanEntity> fieldScanEntities = mainJob(tableName, dataSourceEntity, connectorConfig);
        processLengthAndPrecision(fieldScanEntities);
        Map<String, FieldScanEntity> result = new HashMap<>();
        for (FieldScanEntity fieldScanEntity : fieldScanEntities) {
            result.put(fieldScanEntity.getFFieldName(), fieldScanEntity);
        }
        return result;
    }

    private List<FieldScanEntity> mainJob(String tableName,
                                          DataSourceEntity dataSourceEntity,
                                          ConnectorConfig connectorConfig) throws Exception {
        List<TypeConfig> typeList = connectorConfig.getType();
        HashMap<String, String> typeMap = new HashMap<>();
        for (TypeConfig typeConfig : typeList) {
            typeMap.put(typeConfig.getSourceType(), typeConfig.getVegaType());
        }
        String fType = dataSourceEntity.getFType();
        String fToken = dataSourceEntity.getFToken();
        String fPassword = dataSourceEntity.getFPassword();
        if (StringUtils.isNotEmpty(fPassword)) {
            fPassword = RSAUtil.decrypt(fPassword);
        }
        DataSourceConfig dataSourceConfig = new DataSourceConfig(
                fType,
                DbConnectionStrategyFactory.DRIVER_CLASS_MAP.get(fType),
                DbConnectionStrategyFactory.getDriverURL(dataSourceEntity),
                dataSourceEntity.getFAccount(),
                fPassword,
                fToken);
        Connection connection = null;
        ResultSet columnSet = null;
        try {
            connection = this.getConnection(dataSourceConfig);
            DatabaseMetaData metadata = connection.getMetaData();
            String fDatabase = dataSourceEntity.getFSchema();
            if (StringUtils.isBlank(fDatabase)) {
                fDatabase = dataSourceEntity.getFDatabase();
            }
            columnSet = metadata.getColumns(
                    fDatabase,
                    null,
                    tableName,
                    null);
            List<FieldScanEntity> list = new ArrayList<>();
            while (columnSet.next()) {
                FieldScanEntity fieldScanEntity = new FieldScanEntity();
                fieldScanEntity.setFId(UUID.randomUUID().toString());
                fieldScanEntity.setFTableName(columnSet.getString("TABLE_NAME"));
                String columnDef = columnSet.getString("COLUMN_DEF");
                fieldScanEntity.setFFieldName(columnSet.getString("COLUMN_NAME"));
                String type = columnSet.getString("TYPE_NAME");
                String[] strings = StringUtils.split(type, '(');
                type = (strings == null || strings.length == 0) ? null : strings[0];
                fieldScanEntity.setFFieldType(type);
                fieldScanEntity.setFFieldComment(columnSet.getString("REMARKS"));
                Integer length = columnSet.getInt("COLUMN_SIZE");
                // 不同数据源实现有差异，因此子类实现
                String decimalDigits = processDecimalDigits(columnSet);
                Integer precision;
                try {
                    precision = Integer.valueOf(decimalDigits);
                } catch (Exception e) {
                    precision = null;
                }
                fieldScanEntity.setFFieldLength(length);
                fieldScanEntity.setFFieldPrecision(precision);
                //--------------------上面基本的处理完成，下面是不同数据源单独的处理--------------------
                // 钩子方法：需要对上述进行额外的处理
                if (needProcessColumnSet()) {
                    processColumnSet(columnSet, fieldScanEntity);
                }
                // 处理高级参数
                List<AdvancedParamsDTO> advancedParamsDTOList = new ArrayList<>();
                AdvancedParamsDTO isPrimaryKeyParam = new AdvancedParamsDTO("checkPrimaryKey", "true");
                advancedParamsDTOList.add(isPrimaryKeyParam);
                AdvancedParamsDTO columnDefParam = new AdvancedParamsDTO("COLUMN_DEF", columnDef == null ? "" : columnDef);
                advancedParamsDTOList.add(columnDefParam);
                AdvancedParamsDTO originFieldTypeParam = new AdvancedParamsDTO("originFieldType", StringUtils.lowerCase(type));
                advancedParamsDTOList.add(originFieldTypeParam);
                AdvancedParamsDTO virtualFieldTypeParam = new AdvancedParamsDTO("virtualFieldType", typeMap.get(StringUtils.lowerCase(type)));
                advancedParamsDTOList.add(virtualFieldTypeParam);
                fieldScanEntity.setFAdvancedParams(JSON.toJSONString(advancedParamsDTOList));
                list.add(fieldScanEntity);
            }

            // 收集字段级别的统计信息（空值率、唯一值、数据分布等）
            collectFieldStatistics(connection, tableName, fDatabase, list);

            return list;
        } catch (Exception e) {
            log.error("获取字段信息异常", e);
            throw e;
        } finally {
            try {
                if (columnSet != null) {
                    columnSet.close();
                }
                if (connection != null) {
                    connection.close();
                }
            } catch (Exception e) {
            }
        }
    }

    protected abstract String processDecimalDigits(ResultSet columnSet) throws SQLException;

    protected void processLengthAndPrecision(List<FieldScanEntity> fieldScanEntities) {
        for (FieldScanEntity fieldScanEntity : fieldScanEntities) {
            String type = fieldScanEntity.getFFieldType();
            Integer length = fieldScanEntity.getFFieldLength();
            Integer precision = fieldScanEntity.getFFieldPrecision();
            if (type.equalsIgnoreCase("decimal") || type.equalsIgnoreCase("numeric") || type.equalsIgnoreCase("number")) {
                //按BUG单709240特殊要求限制带精度字段类型字段精度为18
                //按BUG单709240特殊要求限制带精度字段类型字段长度为38
                // 特殊情况处理：当length为0且precision为-127时
                if (length != null && length == 0 && precision != null && precision == -127) {
                    length = 38;// 设置默认长度为38
                    precision = 0;// 设置默认精度为0
                } else {
                    // 一般情况处理
                    if (length == null) {
                        length = null;
                    } else {
                        length = Math.min(length, 38);
                    }
                    if (precision == null) {
                        precision = null;
                    } else {
                        precision = Math.min(precision, 18);
                    }
                }
            } else {
                if (length == null) {
                    length = null;
                }
                if (precision == null) {
                    precision = null;
                }
            }
            fieldScanEntity.setFFieldLength(length);
            fieldScanEntity.setFFieldPrecision(precision);
        }
    }

    protected boolean needProcessColumnSet() {
        return false;
    }

    protected void processColumnSet(ResultSet columnSet, FieldScanEntity fieldScanEntity) throws Exception {
        log.info("======需要额外处理columnSet======");
    }

    @Override
    public boolean judgeTwoFiledIsChange(FieldScanEntity newScanEntity, FieldScanEntity oldScanEntity) {
        String fFieldCommentNew = newScanEntity.getFFieldComment();
        String fFieldCommentOld = oldScanEntity.getFFieldComment();

        Integer fFieldLengthNew = newScanEntity.getFFieldLength();
        Integer fFieldLengthOld = oldScanEntity.getFFieldLength();

        Integer fFieldPrecisionNew = newScanEntity.getFFieldPrecision();
        Integer fFieldPrecisionOld = oldScanEntity.getFFieldPrecision();

        String fAdvancedParamsNew = newScanEntity.getFAdvancedParams();
        String fAdvancedParamsOld = oldScanEntity.getFAdvancedParams();

        String fFieldTypeNew = newScanEntity.getFFieldType();
        String fFieldTypeOld = oldScanEntity.getFFieldType();

        if (!equalsWithEmptyAsNull(fFieldCommentNew, fFieldCommentOld)) {
            return true;
        } else if (!equalsWithEmptyAsNull(fFieldLengthNew, fFieldLengthOld)) {
            return true;
        } else if (!equalsWithEmptyAsNull(fFieldPrecisionNew, fFieldPrecisionOld)) {
            return true;
        } else if (!equalsWithEmptyAsNull(fAdvancedParamsNew, fAdvancedParamsOld)) {
            return true;
        } else if (!equalsWithEmptyAsNull(fFieldTypeNew, fFieldTypeOld)) {
            return true;
        }
        return false;
    }

    private static boolean equalsWithEmptyAsNull(Integer i1, Integer i2) {
        // 步骤1：统一处理null和""，转换为同一个标识（比如空字符串）
        i1 = (i1 == null) ? 0 : i1;
        i2 = (i2 == null) ? 0 : i2;
        // 步骤2：安全比较（此时s1和s2都非null）
        return i1.equals(i2);
    }

    private static boolean equalsWithEmptyAsNull(String str1, String str2) {
        // 步骤1：统一处理null和""，转换为同一个标识（比如空字符串）
        String s1 = (str1 == null) ? "" : str1;
        String s2 = (str2 == null) ? "" : str2;
        // 步骤2：安全比较（此时s1和s2都非null）
        return s1.equals(s2);
    }

    /**
     * 收集字段级别的统计信息
     * 包括：空值率、唯一值数量和占比、数据分布等
     */
    private void collectFieldStatistics(Connection connection, String tableName, String databaseName,
                                       List<FieldScanEntity> fieldScanEntities) {
        if (fieldScanEntities == null || fieldScanEntities.isEmpty()) {
            return;
        }

        // 获取表行数，用于判断是否需要采样
        long totalRowCount = getTableRowCount(connection, databaseName, tableName);

        // 对每个字段收集统计信息
        for (FieldScanEntity field : fieldScanEntities) {
            try {
                collectSingleFieldStatistics(connection, databaseName, tableName, field, totalRowCount);
            } catch (Exception e) {
                log.warn("Failed to collect statistics for field: {}.{}", tableName, field.getFFieldName(), e);
                // 继续处理下一个字段，不中断整体流程
            }
        }
    }

    /**
     * 获取表行数
     */
    private long getTableRowCount(Connection connection, String databaseName, String tableName) {
        String sql = String.format("SELECT COUNT(*) FROM %s.%s", databaseName, tableName);
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getLong(1);
            }
        } catch (Exception e) {
            log.debug("Failed to get row count for table: {}.{}", databaseName, tableName, e);
        }
        return 0;
    }

    /**
     * 收集单个字段的统计信息
     */
    private void collectSingleFieldStatistics(Connection connection, String databaseName,
                                             String tableName, FieldScanEntity field,
                                             long totalRowCount) {
        String fieldType = field.getFFieldType();
        String fieldName = field.getFFieldName();

        // 只对适合的字段类型进行统计
        if (!shouldCollectStatistics(fieldType)) {
            return;
        }

        // 对于大表（超过100万行），采样统计
        boolean shouldSample = totalRowCount > 1_000_000;
        int sampleLimit = shouldSample ? 100_000 : 0; // 采样10万行

        // 收集空值率
        double nullRatio = calculateNullRatio(connection, databaseName, tableName, fieldName, sampleLimit);
        long nullCount = (totalRowCount > 0 && sampleLimit == 0) ? (long) (nullRatio * totalRowCount / 100) : 0;

        // 收集唯一值统计
        UniqueStatistics uniqueStats = calculateUniqueStatistics(connection, databaseName, tableName,
                fieldName, fieldType, totalRowCount, sampleLimit);

        // 收集数据分布
        String valueDistribution = collectValueDistribution(connection, databaseName, tableName,
                fieldName, fieldType, sampleLimit);

        // 更新 advanced_params
        updateFieldAdvancedParams(field, nullRatio, nullCount, uniqueStats, valueDistribution);
    }

    /**
     * 判断字段类型是否适合收集统计信息
     */
    private boolean shouldCollectStatistics(String fieldType) {
        if (fieldType == null) {
            return false;
        }
        String type = fieldType.toLowerCase();
        // 排除不适合统计的类型
        if (type.contains("blob") || type.contains("clob") || type.contains("text") || type.contains("binary")) {
            return false;
        }
        // 只对数值、字符串、日期时间类型进行统计
        return type.contains("int") || type.contains("bigint") || type.contains("smallint") || type.contains("tinyint")
                || type.contains("decimal") || type.contains("numeric") || type.contains("float") || type.contains("double")
                || type.contains("varchar") || type.contains("char") || type.contains("date") || type.contains("time");
    }

    /**
     * 计算空值率
     */
    private double calculateNullRatio(Connection connection, String databaseName, String tableName,
                                      String fieldName, int sampleLimit) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT COUNT(*) * 100.0 / COUNT(");
        if (sampleLimit > 0) {
            sql.append("CASE WHEN ").append(fieldName).append(" IS NULL THEN 1 END");
        } else {
            sql.append("*");
        }
        sql.append(") as null_ratio FROM ");
        if (sampleLimit > 0) {
            sql.append("(SELECT * FROM ").append(databaseName).append(".").append(tableName)
                    .append(" LIMIT ").append(sampleLimit).append(") as t");
        } else {
            sql.append(databaseName).append(".").append(tableName);
        }

        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql.toString())) {
            if (rs.next()) {
                return rs.getDouble("null_ratio");
            }
        } catch (Exception e) {
            log.debug("Failed to calculate null ratio for field: {}", fieldName, e);
        }
        return 0.0;
    }

    /**
     * 计算唯一值统计
     */
    private UniqueStatistics calculateUniqueStatistics(Connection connection, String databaseName, String tableName,
                                                       String fieldName, String fieldType,
                                                       long totalRowCount, int sampleLimit) {
        UniqueStatistics stats = new UniqueStatistics();
        stats.uniqueCount = 0L;
        stats.uniqueRatio = 0.0;

        try {
            StringBuilder sql = new StringBuilder();
            if (sampleLimit > 0) {
                sql.append("SELECT COUNT(DISTINCT ").append(fieldName).append(") as unique_count, ")
                        .append("COUNT(*) as total_count FROM ")
                        .append("(SELECT * FROM ").append(databaseName).append(".").append(tableName)
                        .append(" LIMIT ").append(sampleLimit).append(") as t");
            } else {
                sql.append("SELECT COUNT(DISTINCT ").append(fieldName).append(") as unique_count, ")
                        .append("COUNT(*) as total_count FROM ")
                        .append(databaseName).append(".").append(tableName);
            }

            try (Statement stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery(sql.toString())) {
                if (rs.next()) {
                    long uniqueCount = rs.getLong("unique_count");
                    long rowCount = rs.getLong("total_count");
                    stats.uniqueCount = uniqueCount;
                    if (rowCount > 0) {
                        stats.uniqueRatio = (uniqueCount * 100.0) / rowCount;
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Failed to calculate unique statistics for field: {}", fieldName, e);
        }

        return stats;
    }

    /**
     * 收集数据分布（前10个最常见的值）
     */
    private String collectValueDistribution(Connection connection, String databaseName, String tableName,
                                           String fieldName, String fieldType, int sampleLimit) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT ").append(fieldName).append(" as value, COUNT(*) as count FROM ");
            if (sampleLimit > 0) {
                sql.append("(SELECT * FROM ").append(databaseName).append(".").append(tableName)
                        .append(" LIMIT ").append(sampleLimit).append(") as t");
            } else {
                sql.append(databaseName).append(".").append(tableName);
            }
            sql.append(" WHERE ").append(fieldName).append(" IS NOT NULL ")
                    .append("GROUP BY ").append(fieldName)
                    .append(" ORDER BY count DESC LIMIT 10");

            StringBuilder distribution = new StringBuilder();
            distribution.append("[");

            try (Statement stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery(sql.toString())) {
                boolean first = true;
                long totalCount = 0;
                while (rs.next()) {
                    if (!first) {
                        distribution.append(",");
                    }
                    String value = rs.getString("value");
                    long count = rs.getLong("count");
                    totalCount += count;

                    // 转义值中的特殊字符
                    if (value != null) {
                        value = value.replace("\\", "\\\\").replace("\"", "\\\"");
                    } else {
                        value = "NULL";
                    }

                    distribution.append(String.format("{\"value\":\"%s\",\"count\":%d}", value, count));
                    first = false;
                }
            }
            distribution.append("]");
            return distribution.toString();
        } catch (Exception e) {
            log.debug("Failed to collect value distribution for field: {}", fieldName, e);
            return null;
        }
    }

    /**
     * 更新字段的 advanced_params
     */
    private void updateFieldAdvancedParams(FieldScanEntity field, double nullRatio, long nullCount,
                                          UniqueStatistics uniqueStats, String valueDistribution) {
        try {
            // 解析现有的 advanced_params
            String existingParams = field.getFAdvancedParams();
            List<AdvancedParamsDTO> paramsList = new ArrayList<>();

            if (StringUtils.isNotBlank(existingParams)) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, Object>>> typeRef =
                        new com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, Object>>>() {};
                    List<java.util.Map<String, Object>> existingList = mapper.readValue(existingParams, typeRef);

                    if (existingList != null) {
                        for (java.util.Map<String, Object> param : existingList) {
                            String key = String.valueOf(param.get("key"));
                            String value = String.valueOf(param.get("value"));
                            paramsList.add(new AdvancedParamsDTO(key, value));
                        }
                    }
                } catch (Exception e) {
                    log.debug("Failed to parse existing advanced params for field: {}", field.getFFieldName(), e);
                }
            }

            // 添加新的统计信息
            paramsList.add(new AdvancedParamsDTO("null_ratio", String.format("%.2f", nullRatio)));
            paramsList.add(new AdvancedParamsDTO("null_count", String.valueOf(nullCount)));
            paramsList.add(new AdvancedParamsDTO("unique_count", String.valueOf(uniqueStats.uniqueCount)));
            paramsList.add(new AdvancedParamsDTO("unique_ratio", String.format("%.2f", uniqueStats.uniqueRatio)));

            if (valueDistribution != null) {
                paramsList.add(new AdvancedParamsDTO("value_distribution", valueDistribution));
            }

            // 更新 advanced_params
            field.setFAdvancedParams(JSON.toJSONString(paramsList, WriteMapNullValue));

        } catch (Exception e) {
            log.debug("Failed to update advanced params for field: {}", field.getFFieldName(), e);
        }
    }

    /**
     * 收集表级别的统计信息（行数、大小、索引等）
     * 支持 MySQL、PostgreSQL、Oracle、SQL Server 等多种数据库类型
     */
    private void collectTableStatistics(Connection connection, String databaseName, String tableName,
                                       String fType, List<AdvancedParamsDTO> advancedParamsDTOList) {
        try {
            // 如果已经收集过统计信息（MySQL/MariaDB），跳过
            for (AdvancedParamsDTO dto : advancedParamsDTOList) {
                if ("table_rows".equals(dto.getKey())) {
                    return; // 已经收集过了
                }
            }

            // 根据数据库类型收集统计信息
            if (ConnectorEnums.POSTGRESQL.getConnector().equals(fType) ||
                ConnectorEnums.HOLOGRES.getConnector().equals(fType) ||
                ConnectorEnums.OPENGAUSS.getConnector().equals(fType)) {
                collectPostgreSQLTableStatistics(connection, databaseName, tableName, advancedParamsDTOList);
            } else if (ConnectorEnums.ORACLE.getConnector().equals(fType)) {
                collectOracleTableStatistics(connection, databaseName, tableName, advancedParamsDTOList);
            } else if (ConnectorEnums.SQLSERVER.getConnector().equals(fType)) {
                collectSQLServerTableStatistics(connection, databaseName, tableName, advancedParamsDTOList);
            } else {
                // 其他数据库类型，使用通用方法收集基本统计
                collectGenericTableStatistics(connection, databaseName, tableName, advancedParamsDTOList);
            }
        } catch (Exception e) {
            log.warn("Failed to collect table statistics for: {}", tableName, e);
        }
    }

    /**
     * PostgreSQL 类型的表统计收集
     */
    private void collectPostgreSQLTableStatistics(Connection connection, String databaseName, String tableName,
                                                   List<AdvancedParamsDTO> advancedParamsDTOList) {
        try {
            // 获取表行数和大小信息
            String sql = "SELECT reltuples::bigint as row_count, " +
                    "pg_total_relation_size(quote_ident(?)::regclass) as total_size, " +
                    "pg_relation_size(quote_ident(?)::regclass) as data_size, " +
                    "pg_indexes_size(quote_ident(?)::regclass) as index_size " +
                    "FROM pg_class WHERE relname = ? AND relnamespace = " +
                    "(SELECT oid FROM pg_namespace WHERE nspname = ?)";

            try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
                pstmt.setString(1, tableName);
                pstmt.setString(2, tableName);
                pstmt.setString(3, tableName);
                pstmt.setString(4, tableName);
                pstmt.setString(5, tableName);
                pstmt.setString(6, databaseName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long rowCount = rs.getLong("row_count");
                        long totalSize = rs.getLong("total_size");
                        long dataSize = rs.getLong("data_size");
                        long indexSize = rs.getLong("index_size");

                        advancedParamsDTOList.add(new AdvancedParamsDTO("table_rows", String.valueOf(rowCount)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("data_length", String.valueOf(dataSize)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("index_length", String.valueOf(indexSize)));
                    }
                }
            }

            // 获取主键和索引信息
            String indexSql = "SELECT COUNT(DISTINCT CASE WHEN contype = 'p' THEN conname END) as pk_count, " +
                    "COUNT(DISTINCT conname) as index_count " +
                    "FROM pg_constraint con " +
                    "JOIN pg_class rel ON rel.oid = con.conrelid " +
                    "JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace " +
                    "WHERE rel.relname = ? AND nsp.nspname = ?";

            try (PreparedStatement pstmt = connection.prepareStatement(indexSql)) {
                pstmt.setString(1, tableName);
                pstmt.setString(2, databaseName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long pkCount = rs.getLong("pk_count");
                        long indexCount = rs.getLong("index_count");

                        advancedParamsDTOList.add(new AdvancedParamsDTO("has_primary_key", String.valueOf(pkCount > 0)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("primary_key_count", String.valueOf(pkCount)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("index_count", String.valueOf(indexCount)));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Failed to collect PostgreSQL table statistics: {}.{}", databaseName, tableName, e);
        }
    }

    /**
     * Oracle 类型的表统计收集
     */
    private void collectOracleTableStatistics(Connection connection, String databaseName, String tableName,
                                             List<AdvancedParamsDTO> advancedParamsDTOList) {
        try {
            // Oracle 表统计信息
            String sql = "SELECT num_rows as row_count, " +
                    "blocks * 8192 as total_size " +
                    "FROM all_tables WHERE table_name = ? AND owner = UPPER(?)";

            try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
                pstmt.setString(1, tableName);
                pstmt.setString(2, databaseName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long rowCount = rs.getLong("row_count");
                        long totalSize = rs.getLong("total_size");

                        advancedParamsDTOList.add(new AdvancedParamsDTO("table_rows", String.valueOf(rowCount)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("data_length", String.valueOf(totalSize)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("index_length", "0")); // Oracle 不单独提供索引大小
                    }
                }
            }

            // 获取主键信息
            String pkSql = "SELECT COUNT(*) as pk_count FROM all_constraints " +
                    "WHERE table_name = ? AND owner = UPPER(?) AND constraint_type = 'P'";

            try (PreparedStatement pstmt = connection.prepareStatement(pkSql)) {
                pstmt.setString(1, tableName);
                pstmt.setString(2, databaseName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long pkCount = rs.getLong("pk_count");
                        advancedParamsDTOList.add(new AdvancedParamsDTO("has_primary_key", String.valueOf(pkCount > 0)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("primary_key_count", String.valueOf(pkCount)));
                    }
                }
            }

            // 获取索引信息
            String indexSql = "SELECT COUNT(DISTINCT index_name) as index_count FROM all_indexes " +
                    "WHERE table_name = ? AND table_owner = UPPER(?)";

            try (PreparedStatement pstmt = connection.prepareStatement(indexSql)) {
                pstmt.setString(1, tableName);
                pstmt.setString(2, databaseName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long indexCount = rs.getLong("index_count");
                        advancedParamsDTOList.add(new AdvancedParamsDTO("index_count", String.valueOf(indexCount)));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Failed to collect Oracle table statistics: {}.{}", databaseName, tableName, e);
        }
    }

    /**
     * SQL Server 类型的表统计收集
     */
    private void collectSQLServerTableStatistics(Connection connection, String databaseName, String tableName,
                                                 List<AdvancedParamsDTO> advancedParamsDTOList) {
        try {
            // SQL Server 表统计信息
            String sql = "SELECT SUM(row_count) as row_count " +
                    "FROM sys.dm_db_partition_stats " +
                    "WHERE object_id = OBJECT_ID(?)";

            try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
                pstmt.setString(1, tableName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long rowCount = rs.getLong("row_count");
                        advancedParamsDTOList.add(new AdvancedParamsDTO("table_rows", String.valueOf(rowCount)));
                    }
                }
            }

            // 获取表和索引大小
            String sizeSql = "SELECT SUM(CASE WHEN index_id = 0 THEN used_pages * 8 ELSE 0 END) as data_size, " +
                    "SUM(CASE WHEN index_id > 0 THEN used_pages * 8 ELSE 0 END) as index_size " +
                    "FROM sys.dm_db_partition_stats " +
                    "WHERE object_id = OBJECT_ID(?) " +
                    "GROUP BY object_id";

            try (PreparedStatement pstmt = connection.prepareStatement(sizeSql)) {
                pstmt.setString(1, tableName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long dataSize = rs.getLong("data_size");
                        long indexSize = rs.getLong("index_size");

                        advancedParamsDTOList.add(new AdvancedParamsDTO("data_length", String.valueOf(dataSize)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("index_length", String.valueOf(indexSize)));
                    }
                }
            }

            // 获取主键信息
            String pkSql = "SELECT COUNT(*) as pk_count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
                    "WHERE TABLE_NAME = ? AND CONSTRAINT_TYPE = 'PRIMARY KEY'";

            try (PreparedStatement pstmt = connection.prepareStatement(pkSql)) {
                pstmt.setString(1, tableName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long pkCount = rs.getLong("pk_count");
                        advancedParamsDTOList.add(new AdvancedParamsDTO("has_primary_key", String.valueOf(pkCount > 0)));
                        advancedParamsDTOList.add(new AdvancedParamsDTO("primary_key_count", String.valueOf(pkCount)));
                    }
                }
            }

            // 获取索引信息
            String indexSql = "SELECT COUNT(DISTINCT index_name) as index_count FROM sys.indexes " +
                    "WHERE object_id = OBJECT_ID(?) AND is_primary_key = 0";

            try (PreparedStatement pstmt = connection.prepareStatement(indexSql)) {
                pstmt.setString(1, tableName);

                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        long indexCount = rs.getLong("index_count");
                        advancedParamsDTOList.add(new AdvancedParamsDTO("index_count", String.valueOf(indexCount)));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Failed to collect SQL Server table statistics: {}.{}", databaseName, tableName, e);
        }
    }

    /**
     * 通用表统计收集（适用于其他数据库类型）
     */
    private void collectGenericTableStatistics(Connection connection, String databaseName, String tableName,
                                              List<AdvancedParamsDTO> advancedParamsDTOList) {
        try {
            // 至少收集表行数
            long rowCount = getTableRowCount(connection, databaseName, tableName);
            advancedParamsDTOList.add(new AdvancedParamsDTO("table_rows", String.valueOf(rowCount)));
        } catch (Exception e) {
            log.debug("Failed to collect generic table statistics: {}.{}", databaseName, tableName, e);
        }
    }

    /**
     * 唯一值统计信息
     */
    private static class UniqueStatistics {
        long uniqueCount;
        double uniqueRatio;
    }
}
