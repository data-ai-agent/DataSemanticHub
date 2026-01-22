package com.eisoo.dc.gateway.service.impl;

import cn.hutool.core.date.StopWatch;
import com.aishu.af.vega.sql.extract.SqlExtractUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.constant.Constants;
import com.eisoo.dc.common.constant.Description;
import com.eisoo.dc.common.driven.service.ServiceConfig;
import com.eisoo.dc.common.driven.service.ServiceEndpoints;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.metadata.entity.DataSourceEntity;
import com.eisoo.dc.common.metadata.mapper.DataSourceMapper;
import com.eisoo.dc.common.util.http.EtrinoHttpUtils;
import com.eisoo.dc.common.util.http.OpensearchHttpUtils;
import com.eisoo.dc.common.util.StringUtils;
import com.eisoo.dc.gateway.common.CatalogConstant;
import com.eisoo.dc.gateway.common.Detail;
import com.eisoo.dc.gateway.common.Message;
import com.eisoo.dc.gateway.common.QueryConstant;
import com.eisoo.dc.gateway.domain.dto.DownloadDto;
import com.eisoo.dc.gateway.domain.vo.*;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.gateway.service.QueryService;
import com.eisoo.dc.gateway.util.CommonUtil;
import com.eisoo.dc.gateway.util.HttpOpenUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import com.eisoo.dc.gateway.util.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * paul.yan
 */
@Service
public class QueryServiceImpl implements QueryService {
    private static final Logger log = LoggerFactory.getLogger(QueryServiceImpl.class);

    @Autowired
    private ServiceEndpoints serviceEndpoints;
    @Value(value = "${spring.application.name}")
    private String applicationName;

    @Value(value = "${spring.application.queryName}")
    private String queryName;
    @Autowired
    RewriteSqlServiceImpl rewriteSqlService;
    @Autowired
    DataSourceMapper dataSourceMapper;
    @Autowired
    ServiceConfig serviceConfig;

    @Override
    public ResponseEntity<?> statement(String statementType, String catalogName, String tableName, String statement, String user, int type, String userId, String action, String xPrestoSession) throws Exception {
        DataSourceEntity dataSourceEntity = dataSourceMapper.selectByCatalog(catalogName);
        if ("dsl".equals(statementType)) {
            if (StringUtils.isNull(catalogName)) {
                throw new AiShuException(ErrorCodeEnum.BadRequest,
                        "catalog_name是空",
                        "catalog_name不能为空",
                        Message.MESSAGE_INTERNAL_ERROR);
            } else if (StringUtils.isNull(tableName)) {
                throw new AiShuException(ErrorCodeEnum.BadRequest,
                        "table_name是空",
                        "table_name不能为空",
                        Message.MESSAGE_INTERNAL_ERROR);
            } else if (null == dataSourceEntity) {
                throw new AiShuException(ErrorCodeEnum.BadRequest,
                        Description.DS_NOT_FOUND_ERROR,
                        String.format(com.eisoo.dc.common.constant.Detail.DS_NOT_EXIST, catalogName),
                        Message.MESSAGE_INTERNAL_ERROR);
            }
            String response = OpensearchHttpUtils.queryStatement(dataSourceEntity, tableName, statement);
            JSONObject result = new JSONObject();
            result.put("nextUri", null);
            result.put("progressPercentage", null);
            result.put("data", new String[]{response});
            result.put("columns", null);
            result.put("total_count", null);
            return ResponseEntity.ok(result);
        }
        String emptyStr = "{\n" +
                "    \"columns\": [],\n" +
                "    \"data\": [],\n" +
                "    \"total_count\": 0\n" +
                "}";
        if (StringUtils.isNull(user)) {
            // 用户不能为空
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.X_PRESTO_USER_MISSING);
        }

        //解析sql
        String sql;
        if (type == 0) {
            sql = analyzeSql(statement);
        } else {
            sql = statement;
        }

        log.info("query sql:{}", sql);
        // 改写sql从而实现行列权限控制
        if (StringUtils.isNotEmpty(userId)) {
            RowColumnRuleVo rowColumnRuleVo = rewriteSqlService.rewriteSql(sql, userId, action, null);
            if (rowColumnRuleVo.getStatusCode() == 200) {
                sql = rowColumnRuleVo.getTargetSql();
            } else {
                throw new AiShuException(ErrorCodeEnum.AuthServiceError, rowColumnRuleVo.getMessage(), Message.MESSAGE_AUTH_SERVICE_ERROR_SOLUTION);
            }
        }
        log.info("auth query sql:{}", sql);
        //请求转换
        JSONObject clientInfo = new JSONObject();
        clientInfo.put(CatalogConstant.CANCEL_MAX_RUN, type == 1);
        clientInfo.put(CatalogConstant.CANCEL_MAX_EXECUTION, type == 1);
        String statementResponse = getStatement(sql, user, clientInfo, xPrestoSession);
        //请求第二个接口queued接口
        String queuedUri = getStrToJson(statementResponse);
        if (StringUtils.equalsAnyIgnoreCase(queuedUri, CatalogConstant.ERROR_MSG)) {
            throw new AiShuException(ErrorCodeEnum.SystemBusy, queuedUri, Message.MESSAGE_SYSTEM_BUSY);
        }
        ErrorInfo info = queueStage(queuedUri, user);
        if (info.getState() != null && info.getState().contains("FAILED")) {
            log.error("sql syntax errors,detail :" + info.getMessage());
            finerErrorInfo(info);
        }
        //请求第三个接口executing 会调用多次，返回标准化的jsonstr
        ErrorInfo result = null;
        if (type == 0) {
            result = this.executing(info.getNextUrl(), user, type);
        } else if (type == 1) {
            result = this.nextStatement(info.getNextUrl(), user, type);
        }
        if (result == null) {
            throw new AiShuException(ErrorCodeEnum.SystemBusy, Detail.QUERY_NOT_FOUND, Message.MESSAGE_SYSTEM_BUSY);
        }
        if (result.getData() != null && result.getData().equals("{}")) {
            return ResponseEntity.ok(emptyStr);
        }

        if (result.getState() != null && result.getState().contains("FAILED")) {
            log.error("found errors,detail :" + result.getMessage());
            finerErrorInfo(result);
        }
        return ResponseEntity.ok(result.getData());
    }

    @Override
    public ResponseEntity<?> statement(String catalog, String schema, String table, String columns, long limit, int type, String user, String userId, String action) {
        String emptyStr = "{\n" + "    \"columns\": [],\n" + "    \"data\": [],\n" + "    \"total_count\": 0\n" + "}";
        if (StringUtils.isNull(user)) {
            // 用户不能为空
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.X_PRESTO_USER_MISSING);
        }
        //if (StringUtils.isNotEmpty(CheckUtil.checkPath())) {
        // 挂载文件路径为空
        //return Result.error(new AiShuException(ErrorCodeEnum.deployError));
        //}
        if (limit > 1000) {
            limit = 1000;
        }
        if (type != 0) //0代表随机取数
        {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.QUERY_TYPE_ERROR, Message.MESSAGE_QUERY_TYPE_SOLUTION);
        }
        // 表名用双引号引起来，解决中文表名报错的问题
        if (!table.contains("\"")) {
            table = "\"" + table + "\"";
        }
        //解析sql,//analyzeSql(statement);
        String tableName = catalog + "." + schema + "." + table;
        log.info("tableName:{} columns:{} limit:{} type:{} user:{} userId:{}", tableName, columns, limit, type, user, userId);
        if (StringUtils.isNotEmpty(userId)) {
            Set<String> set = new HashSet<>();
            if (StringUtils.isNotEmpty(columns)) {
                String[] arr = columns.split(",");
                for (String c : arr) {
                    set.add(c.trim().replaceAll("\"", ""));
                }
            }
            RowColumnRuleVo rowColumnRuleVo = rewriteSqlService.getSqlByTable(new SqlExtractUtil.TableName(tableName, null, false), userId, set, action, null, null);
            if (rowColumnRuleVo.getStatusCode() == 200) {
                tableName = rowColumnRuleVo.getRuleSql();
            } else {
                throw new AiShuException(ErrorCodeEnum.AuthServiceError, rowColumnRuleVo.getMessage(), Message.MESSAGE_AUTH_SERVICE_ERROR_SOLUTION);
            }
        }
        String sql;
        if (StringUtils.isEmpty(columns)) {
            sql = String.format("select * from (select * from %s limit %d) ORDER BY random() ", tableName, limit);
        } else {
            String[] arr = columns.split(",");
            StringBuilder allColumn = new StringBuilder();
            for (String c : arr) {
                allColumn.append("\"").append(c.replaceAll("\"", "")).append("\",");
            }
            sql = String.format("select * from (select distinct " + allColumn.substring(0, allColumn.length() - 1) + " from %s limit %d) ORDER BY random()", tableName, limit);
        }
        log.info("auth query sql:{}", sql);
        ErrorInfo result;
        try {
            String replaceTable = table.replace("\"", "");
            String statementResponse = getStatementWithTabInfo(sql, user, catalog, schema, replaceTable);
            //请求第二个接口queued接口
            String queuedUri = getStrToJson(statementResponse);
            if (StringUtils.equalsAnyIgnoreCase(queuedUri, CatalogConstant.ERROR_MSG)) {
                throw new AiShuException(ErrorCodeEnum.SystemBusy, queuedUri, Message.MESSAGE_SYSTEM_BUSY);
            }
            ErrorInfo info = queueStage(queuedUri, user);
            if (info.getState() != null && info.getState().contains("FAILED")) {
                log.error("sql syntax errors,detail :" + info.getMessage());
                finerErrorInfo(info);
            }
            //请求第三个接口executing 会调用多次，返回标准化的jsonstr
            result = this.executing(info.getNextUrl(), user, 0);
            if (result == null) {
                throw new AiShuException(ErrorCodeEnum.SystemBusy, Detail.QUERY_NOT_FOUND, Message.MESSAGE_SYSTEM_BUSY);
            }
            if (result.getData() != null && result.getData().equals("{}")) {
                return ResponseEntity.ok(emptyStr);
            }
            if (result.getState() != null && result.getState().contains("FAILED")) {
                log.error("found errors,detail :" + result.getMessage());
                finerErrorInfo(result);
            }
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            log.error(e.getMessage());
            throw new AiShuException(ErrorCodeEnum.InternalError, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
        }
        return ResponseEntity.ok(result.getData());
    }

    @Override
    public ResponseEntity<?> statement(String queryId, String slug, long token, String user) throws JsonProcessingException {
        String emptyStr = "{\n" +
                "    \"nextUri\": null,\n" +
                "    \"columns\": [],\n" +
                "    \"data\": [],\n" +
                "    \"total_count\": 0\n" +
                "}";

        String jsonStr = getExecuting(queryId, slug, token, user);
        String state = checkState(jsonStr);
        if (StringUtils.endsWith(state, "FAILED")) {
            ErrorInfo errorInfo = getErrors(jsonStr);
            errorInfo.setResult(jsonStr);
            errorInfo.setState(state);
            log.error("getExecuting error :" + errorInfo.getMessage());
            finerErrorInfo(errorInfo);
        }
        String jsonResult = ConverseJson(jsonStr, 1);
        if (StringUtils.isEmpty(jsonResult)) {
            return ResponseEntity.ok(emptyStr);
        }
        return ResponseEntity.ok(jsonResult);
    }

    @Override
    public ResponseEntity<?> statement(DownloadDto downloadDto, String user, String userId, String action) throws JsonProcessingException {
        String emptyStr = "{\n" +
                "    \"columns\": [],\n" +
                "    \"data\": [],\n" +
                "    \"total_count\": 0\n" +
                "}";
//        if (StringUtils.isNull(user)) {
//            // 用户不能为空
//            throw new AiShuException(ErrorCodeEnum.InvalidParameter,Detail.X_PRESTO_USER_MISSING);
//        }

        // 拼接sql
        RowColumnRuleVo rowColumnRuleVo = createSql(downloadDto, userId, action);
        if (rowColumnRuleVo.getStatusCode() != 200) {
            throw new AiShuException(ErrorCodeEnum.AuthServiceError, rowColumnRuleVo.getMessage(), Message.MESSAGE_AUTH_SERVICE_ERROR_SOLUTION);
        }
        log.info("auth query sql:{}", rowColumnRuleVo.getTargetSql());

        //请求转换
        JSONObject clientInfo = new JSONObject();
        clientInfo.put(CatalogConstant.CANCEL_MAX_RUN, true);
        clientInfo.put(CatalogConstant.CANCEL_MAX_EXECUTION, true);
        String statementResponse = getStatement(rowColumnRuleVo.getTargetSql(), user, clientInfo, "");
        //请求第二个接口queued接口
        String queuedUri = getStrToJson(statementResponse);
        if (StringUtils.equalsAnyIgnoreCase(queuedUri, CatalogConstant.ERROR_MSG)) {
            throw new AiShuException(ErrorCodeEnum.SystemBusy, queuedUri, Message.MESSAGE_SYSTEM_BUSY);
        }
        ErrorInfo info = queueStage(queuedUri, user);
        if (info.getState() != null && info.getState().contains("FAILED")) {
            log.error("sql syntax errors,detail :" + info.getMessage());
            finerErrorInfo(info);
        }
        //请求第三个接口executing 会调用多次，返回标准化的jsonstr
        ErrorInfo result;
        result = this.nextStatement(info.getNextUrl(), user, 1);
        if (result == null) {
            throw new AiShuException(ErrorCodeEnum.SystemBusy, Detail.QUERY_NOT_FOUND, Message.MESSAGE_SYSTEM_BUSY);
        }
        if (result.getData() != null && result.getData().equals("{}")) {
            return ResponseEntity.ok(emptyStr);
        }

        if (result.getState() != null && result.getState().contains("FAILED")) {
            log.error("found errors,detail :" + result.getMessage());
            finerErrorInfo(result);
        }
        return ResponseEntity.ok(result.getData());
    }

    private RowColumnRuleVo createSql(DownloadDto downloadDto, String userId, String action) {
        RowColumnRuleVo rowColumnRuleVo;
        StringBuffer sql = new StringBuffer();
        String tableName = downloadDto.getCatalog() + "." + downloadDto.getSchema() + "." + downloadDto.getTable();
        sql.append("select ");
        String[] columnsArr = downloadDto.getColumns().split(";");
        Set<String> columnSet = new TreeSet<>();
        for (String column : columnsArr) {
            sql.append(column).append(",");
            columnSet.add(column.replaceAll("\"", "").toLowerCase());
        }
        sql = sql.deleteCharAt(sql.length() - 1);
        sql.append(" from ");
        if (StringUtils.isEmpty(userId)) {
            rowColumnRuleVo = new RowColumnRuleVo();
            rowColumnRuleVo.setStatusCode(200);
            sql.append(tableName);
        } else {
            StringBuilder rowRule = new StringBuilder();
            if (StringUtils.isNotEmpty(downloadDto.getRow_rules())) {
                String[] rowRuleArr = downloadDto.getRow_rules().split(";");
                for (String r : rowRuleArr) {
                    rowRule.append("(").append(r).append(")").append(" or ");
                }
                rowRule = new StringBuilder(rowRule.substring(0, rowRule.length() - 3));
            }
            rowColumnRuleVo = rewriteSqlService.getSqlByTable(new SqlExtractUtil.TableName(tableName, null, false), userId, columnSet, action, null, rowRule.toString());
            sql.append(rowColumnRuleVo.getRuleSql());
        }
        if (StringUtils.isNotEmpty(downloadDto.getOrder_by())) {
            sql.append(" order by ");
            String[] orderByArr = downloadDto.getOrder_by().split(";");
            for (String orderBy : orderByArr) {
                sql.append(orderBy).append(",");
            }
            sql = sql.deleteCharAt(sql.length() - 1);
        }
        if (downloadDto.getOffset() != null && downloadDto.getOffset() >= 0) {
            sql.append(" offset ").append(downloadDto.getOffset());
        }
        if (downloadDto.getOffset() != null && downloadDto.getLimit() >= 0) {
            sql.append(" limit ").append(downloadDto.getLimit());
        }
        rowColumnRuleVo.setTargetSql(sql.toString());
        return rowColumnRuleVo;
    }

    private void finerErrorInfo(ErrorInfo info) {
        if (StringUtils.equalsIgnoreCase(info.getErrorName(), "SERVER_STARTING_UP")) {
            throw new AiShuException(ErrorCodeEnum.InternalError, info.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
        }
        if (info.getState().equals("FAILED") && info.getErrorName().equals("GENERIC_INSUFFICIENT_RESOURCES")) {
            throw new AiShuException(ErrorCodeEnum.VirEngineWorkError, info.getMessage(), Message.MESSAGE_WORKER_ERROR);
        }
        if (Objects.equals(info.getErrorName(), "JDBC_ERROR")) {
            throw new AiShuException(ErrorCodeEnum.DBError, info.getMessage(), Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        }
        if (info.getErrorName().equals("QUERY_QUEUE_FULL")) {
            throw new AiShuException(ErrorCodeEnum.SystemBusy, info.getMessage(), Message.MESSAGE_SYSTEM_BUSY);
        }
        if (info.getErrorName().equals("ABANDONED_QUERY")) {
            throw new AiShuException(ErrorCodeEnum.AbandonedQuery, info.getMessage(), Message.MESSAGE_QUERY_SOLUTION);
        }
        if (StringUtils.isEmpty(info.getSemanticErrorName())) {
            throw new AiShuException(ErrorCodeEnum.SqlSyntaxError, info.getMessage(), info.getErrorName());
        }
        switch (info.getSemanticErrorName()) {
            case "MISSING_CATALOG":
                throw new AiShuException(ErrorCodeEnum.CatalogNotExist, info.getMessage(), info.getErrorName());
            case "MISSING_SCHEMA":
                throw new AiShuException(ErrorCodeEnum.SchemaNotExist, info.getMessage(), info.getErrorName());
            case "MISSING_TABLE":
                throw new AiShuException(ErrorCodeEnum.TableNotExist, info.getMessage(), info.getErrorName());
            case "VIEW_IS_STALE":
            case "MISSING_ATTRIBUTE":
                throw new AiShuException(ErrorCodeEnum.TableFieldError, info.getMessage(), Message.MESSAGE_QUERY_VIEW_STALE_SOLUTION);
            case "VIEW_ANALYSIS_ERROR":
            case "SYNTAX_ERROR":

                Pattern pattern = Pattern.compile("View (\\S+) is stale; it must be re-created");
                Matcher matcher = pattern.matcher(info.getMessage());
                if (matcher.find()) {
                    throw new AiShuException(ErrorCodeEnum.TableFieldError, info.getMessage(), Message.MESSAGE_QUERY_VIEW_STALE_SOLUTION);
                }

                pattern = Pattern.compile("(Table|Schema|View) (\\S+) does not exist");
                matcher = pattern.matcher(info.getMessage());
                if (matcher.find()) {
                    // matcher.group(1) 是 "Table" 或 "Schema"
                    String type = matcher.group(1);
                    switch (type) {
                        case "Schema":
                            throw new AiShuException(ErrorCodeEnum.SchemaNotExist, info.getMessage(), info.getErrorName());
                        case "Table":
                            throw new AiShuException(ErrorCodeEnum.TableNotExist, info.getMessage(), info.getErrorName());
                        case "View":
                            throw new AiShuException(ErrorCodeEnum.ViewNotExist, info.getMessage(), info.getErrorName());
                    }
                }

                throw new AiShuException(ErrorCodeEnum.SqlSyntaxError, info.getMessage(), info.getErrorName());
            default:
                throw new AiShuException(ErrorCodeEnum.SqlSyntaxError, info.getMessage(), info.getErrorName());
        }
    }


    public String analyzeSql(String sql) {
        sql = sql.trim();
        Pattern limitPattern = Pattern.compile("(?i)\\bLIMIT\\s+(\\d+)$");// 匹配 LIMIT XXX
        Matcher matcher = limitPattern.matcher(sql);
        int oldLimit;
        if (matcher.find()) {
            String limitPart = matcher.group(0);
            String limitStr = limitPart.substring(5).trim();
            try {
                oldLimit = Integer.parseInt(limitStr);
            } catch (NumberFormatException e) {
                log.error(e.getMessage());
                throw new AiShuException(ErrorCodeEnum.InternalError, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
            }
            int newLimit = 1000;
            if (oldLimit > newLimit) {
                sql = sql.replaceFirst("(?i)\\bLIMIT\\s+(\\d+)$", "limit " + newLimit);
            }
        } else if (StringUtils.containsIgnoreCase(sql, "select")) {
            sql = sql + " limit 1000";
        }
        return sql;
    }


    /**
     * sql queued and execute
     *
     * @param nextUri
     * @param user
     * @return
     * @throws JsonProcessingException
     */
    public ErrorInfo queued_optimistic(String nextUri, String user) throws JsonProcessingException {
        HttpResInfo result;
        ErrorInfo errorInfo;
        try {
            result = HttpOpenUtils.sendGet(nextUri, user);
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, e.getMessage(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }

        if (result.getHttpStatus() >= HttpStatus.BAD_REQUEST) {
            log.error("Http queued_optimistic 请求失败: nextUri={}, httpStatus={}, result={}", nextUri, result.getHttpStatus(), result.getResult());
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, result.getResult(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.debug("Http queued_optimistic 请求成功: httpStatus={}, result={}", result.getHttpStatus(), result.getResult());

        String state = checkState(result.getResult());
        if (StringUtils.endsWith(state, "FAILED")) {
            errorInfo = getErrors(result.getResult());
        } else {
            errorInfo = new ErrorInfo();
            errorInfo.setNextUrl(getStrToJson(result.getResult()));
        }
        errorInfo.setResult(result.getResult());
        errorInfo.setState(state);

        return errorInfo;
    }

    public ErrorInfo queueStage(String nextUri, String user) throws JsonProcessingException {
        ErrorInfo errorInfo = queued_optimistic(nextUri, user);
        //获取下一个nextUri
        if (errorInfo.getNextUrl() != null && errorInfo.getNextUrl().contains("queued")) {
            return queueStage(errorInfo.getNextUrl(), user);
        } else {
            log.info("queueStage 执行完成");
            return errorInfo;
        }
    }

    /**
     * 检查执行状态
     *
     * @param result
     * @return
     * @throws JsonProcessingException
     */
    public String checkState(String result) throws JsonProcessingException {
        // 创建 ObjectMapper 对象
        ObjectMapper objectMapper = new ObjectMapper();
        //log.info("-------------------result----------------" + result);

        // 检查 result 是否为空
        if (result == null || result.isEmpty() || StringUtils.containsAnyIgnoreCase(result, CatalogConstant.ERROR_MSG)) {
            log.error("Result is null or empty");
            return null;
        }

        // 将 JSON 解析成 Map 类型的对象
        Map<String, Object> map;
        try {
            map = objectMapper.readValue(result, new TypeReference<Map<String, Object>>() {
            });
        } catch (IOException e) {
            log.error("Error parsing JSON: " + e.getMessage());
            return null; // 或者抛出异常，具体根据业务需求来决定
        }

        // 检查 map 是否为空
        if (map == null || map.isEmpty()) {
            log.error("Parsed map is null or empty");
            return null; // 或者抛出异常，具体根据业务需求来决定
        }

        // 获取 stats.state 的值
        Object statsObj = map.get("stats");
        if (!(statsObj instanceof Map)) {
            log.error("stats is null or not a Map");
            return null; // 或者抛出异常，具体根据业务需求来决定
        }
        Map<String, Object> stats = (Map<String, Object>) statsObj;

        Object stateObj = stats.get("state");
        if (!(stateObj instanceof String)) {
            log.error("state is null or not a String");
            return null; // 或者抛出异常，具体根据业务需求来决定
        }

        //log.info("--------------------stats json---------------------" + stats);

        return (String) stateObj;
    }


    /**
     * 提取错误信息
     *
     * @param result
     * @return
     */
    public ErrorInfo getErrors(String result) {
        // 创建 ObjectMapper 对象
        ObjectMapper objectMapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        ErrorInfo errorInfo = null;
        try {
            errorInfo = objectMapper.readValue(result, QueryResult.class).getError();
            // 其他处理错误对象的代码
        } catch (Exception e) {
            log.error(e.getMessage());
        }
        return errorInfo;
    }

    /**
     * validation fetch interface status
     *
     * @param nextUri
     * @param user
     * @return
     * @throws JsonProcessingException
     */
    private ErrorInfo executeStage(String nextUri, String user) throws JsonProcessingException {
        HttpResInfo result;
        ErrorInfo errorInfo;
        try {
            result = HttpOpenUtils.sendGet(nextUri, user);
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, e.getMessage(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }

        if (result.getHttpStatus() >= HttpStatus.BAD_REQUEST) {
            log.error("Http executeStage 请求失败: nextUri={}, httpStatus={}, result={}", nextUri, result.getHttpStatus(), result.getResult());
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, result.getResult(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.debug("Http executeStage 请求成功: httpStatus={}, result={}", result.getHttpStatus(), result.getResult());

        String state = checkState(result.getResult());
        if (StringUtils.endsWith(state, "FAILED")) {
            errorInfo = getErrors(result.getResult());
        } else {
            errorInfo = new ErrorInfo();
            errorInfo.setNextUrl(getStrToJson(result.getResult()));
        }
        errorInfo.setResult(result.getResult());
        errorInfo.setState(state);
        return errorInfo;
    }

    public ErrorInfo executing(String nextUri, String user, int type) throws Exception {
        List<QueryEntity> dataQueues = new ArrayList<>();
        ErrorInfo info = executeStage(nextUri, user);
        if (StringUtils.isEmpty(info.getResult())) {
            return info;
        }
        if (StringUtils.containsAnyIgnoreCase(info.getResult(), "Query not found")) {
            info.setResult("FAILED");
            info.setMessage(info.getResult());
            return info;
        }
        if (info.getState() != null && info.getState().contains("FAILED")) {
            return info;
        }
        String jsonResult = ConverseJson(info.getResult(), type);
        QueryEntity queryEntity = ConverseJsonToList(jsonResult, nextUri, info.getState());
        if (queryEntity != null) {
            dataQueues.add(queryEntity);
        }
        String url = getStrToJson(info.getResult());
        while (url != null) {
            queryEntity = nextExecuting(url, user, type);
            if (queryEntity != null) {
                url = queryEntity.getUrl();
                dataQueues.add(queryEntity);
            } else {
                url = null;
            }
        }

        String jsonStr = CommonUtil.convertListToJson(dataQueues);
        ErrorInfo errorInfo = new ErrorInfo();
        errorInfo.setData(jsonStr);
        log.info("executing 执行完成");
        return errorInfo;
    }

    public QueryEntity nextExecuting(String nextUri, String user, int type) throws Exception {
        QueryEntity queryEntity;
        ErrorInfo info = executeStage(nextUri, user);
        if (StringUtils.containsAnyIgnoreCase(info.getResult(), "Query not found")) {
            log.error("found errors,detail :" + info.getResult());
            finerErrorInfo(info);
        }
        if (info.getState() != null && info.getState().contains("FAILED")) {
            log.error("found errors,detail :" + info.getMessage());
            finerErrorInfo(info);
        }
        String jsonResult;
        jsonResult = ConverseJson(info.getResult(), type);
        if (jsonResult != null) {
            queryEntity = ConverseJsonToList(jsonResult, info.getNextUrl(), info.getState());
            return queryEntity;
        }
        return null;
    }

    public ErrorInfo nextStatement(String nextUri, String user, int type) throws JsonProcessingException {
        ErrorInfo info = executeStage(nextUri, user);
        String jsonResult;
        if (StringUtils.isEmpty(info.getResult())) {
            return info;
        }
        if (StringUtils.containsAnyIgnoreCase(info.getResult(), "Query not found")) {
            info.setResult("FAILED");
            info.setMessage(info.getResult());
            return info;
        }
        if (info.getState() != null && info.getState().contains("FAILED")) {
            return info;
        }
        jsonResult = ConverseJson(info.getResult(), type);
        info.setData(jsonResult);
        return info;
    }

    protected String getExecuting(String queryId, String slug, long token, String user) {
        String urlOpen = serviceEndpoints.getVegaCalculateCoordinator() + QueryConstant.VIRTUAL_V1_EXECUTING_V1 + queryId + "/" + slug + "/" + token;
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        HttpResInfo result;
        try {
            result = HttpOpenUtils.sendGet(urlOpen, user);
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, e.getMessage(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        stopWatch.stop();

        if (result.getHttpStatus() >= HttpStatus.BAD_REQUEST) {
            log.error("Http getExecuting 请求失败: nextUri={}, httpStatus={}, result={}, 耗时={}ms",
                    urlOpen, result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, result.getResult(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.debug("Http getExecuting 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
        return result.getResult();
    }

    public String getStatement(String statement, String user, JSONObject clientInfo, String xPrestoSession) {
        String urlOpen = serviceEndpoints.getVegaCalculateCoordinator() + QueryConstant.VIRTUAL_V1_STATEMENT;
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        HttpResInfo result;
        try {
            result = HttpOpenUtils.sendPost(urlOpen, statement, user, clientInfo, xPrestoSession);
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, e.getMessage(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        stopWatch.stop();

        if (result.getHttpStatus() >= HttpStatus.BAD_REQUEST) {
            log.error("Http getStatement 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, result.getResult(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.info("Http getStatement 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
        return result.getResult();
    }

    public String getStrToJson(String responseStr) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        String nextUri = null;
        if (StringUtils.containsAnyIgnoreCase(responseStr, CatalogConstant.ERROR_MSG)) {
            return responseStr;
        }
        JsonNode jsonNode = mapper.readTree(responseStr);
        // 获取nextUri字段的值
        if (jsonNode.has("nextUri")) {
            // 获取下一个接口的URI
            nextUri = jsonNode.get("nextUri").asText();
        }
        return nextUri;
    }

    public QueryEntity ConverseJsonToList(String jsonStr, String url, String state) throws JsonProcessingException {
        // 创建 ObjectMapper 对象
        ObjectMapper objectMapper = new ObjectMapper();
        // 将 json1 解析为 Map 类型的对象
        Map<String, Object> map = objectMapper.readValue(jsonStr, Map.class);
        ConcurrentHashMap<String, Object> concurrentHashMap = new ConcurrentHashMap<>(map);

        //last fetch data
        if (concurrentHashMap.get("data") == null && url == null) {
            return null;
        }
        // 从 map 中获取 columns 的值
        List<Map<String, String>> rawColumns = (List<Map<String, String>>) concurrentHashMap.get("columns");
        if (map.get("data") == null) {
            return new QueryEntity(rawColumns, null, url, state);
        }
        List<List<Object>> data = (List<List<Object>>) map.get("data");
        return new QueryEntity(rawColumns, data, url, state);
    }

    /**
     * convert new json
     *
     * @param jsonStr
     * @return
     * @throws JsonProcessingException
     */
    public String ConverseJson(String jsonStr, int catalog) throws JsonProcessingException {
        // 创建 ObjectMapper 对象
        ObjectMapper objectMapper = new ObjectMapper();

        // 将 json1 解析为 Map 类型的对象
        if (StringUtils.isEmpty(jsonStr)) {
            return jsonStr;
        }
        Map<String, Object> map = objectMapper.readValue(jsonStr, Map.class);
        ConcurrentHashMap<String, Object> concurrentHashMap = new ConcurrentHashMap<>(map);

        //返回的json没有data,直接返回
        if (catalog != 1 && concurrentHashMap.get("data") == null && concurrentHashMap.get("nextUri") == null) {
            return null;
        }
        // 从 map 中获取 columns 的值
        List<Map<String, String>> columns = new ArrayList<>();
        List<Map<String, Object>> rawColumns = (List<Map<String, Object>>) concurrentHashMap.get("columns");
        for (Map<String, Object> rawColumn : rawColumns) {
            Map<String, String> column = new HashMap<>();
            String type = (String) rawColumn.get("type");
            if (StringUtils.equalsIgnoreCase("numeric_v1", type)) {
                type = "numeric";
            }
            column.put("name", (String) rawColumn.get("name"));
            column.put("type", type);
            columns.add(column);
        }
        // 获取 data 的值
        List<List<Object>> data = (List<List<Object>>) concurrentHashMap.get("data");
        // 创建一个新的 Map 对象，用于存储转换后的数据
        LinkedHashMap<String, Object> json2 = new LinkedHashMap<>();
        // 将 columns 和 data 的值赋值给新的 Map 对象
        if (catalog == 1) {
            String nextUrl = concurrentHashMap.get("nextUri") == null ? null : concurrentHashMap.get("nextUri").toString().replace(queryName + ":8090", applicationName + ":8099/api/virtual_engine_service");
            json2.put("nextUri", nextUrl);
            if (concurrentHashMap.containsKey("stats")) {
                Object statsObj = concurrentHashMap.get("stats");
                if (statsObj instanceof Map) {
                    Map<String, Object> stats = (Map<String, Object>) statsObj;
                    if (stats.containsKey("progressPercentage")) {
                        json2.put("progressPercentage", Double.parseDouble(stats.get("progressPercentage").toString()));
                    }
                }
            }
        }
        json2.put("columns", columns);
        if (data != null) {
            json2.put("data", data);
            json2.put("total_count", data.size()); // 统计行数
        }
        log.debug("ConverseJson 请求成功: json2={}", json2);
        return objectMapper.writeValueAsString(json2);
    }

    @Override
    public ResponseEntity<?> statement(String statement, String user, String userId, String action) throws Exception {
        String emptyStr = "{\n" +
                "    \"columns\": [],\n" +
                "    \"data\": [],\n" +
                "    \"total_count\": 0,\n" +
                "    \"total\": 0\n" +
                "}";
        if (StringUtils.isNull(user)) {
            // 用户不能为空
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.X_PRESTO_USER_MISSING);
        }

        //解析sql
        String sql = assembleSql(statement);
        log.info("query sql:{}", sql);

        // 改写sql从而实现行列权限控制
        if (StringUtils.isNotEmpty(userId)) {
            RowColumnRuleVo rowColumnRuleVo = rewriteSqlService.rewriteSql(sql, userId, action, null);
            if (rowColumnRuleVo.getStatusCode() == 200) {
                sql = rowColumnRuleVo.getTargetSql();
            } else {
                throw new AiShuException(ErrorCodeEnum.AuthServiceError, rowColumnRuleVo.getMessage(), Message.MESSAGE_AUTH_SERVICE_ERROR_SOLUTION);
            }
        }

        log.info("auth query sql:{}", sql);
        //请求转换
        String statementResponse = getStatement(sql, user, new JSONObject(), "");
        //请求第二个接口queued接口
        String queuedUri = getStrToJson(statementResponse);
        if (StringUtils.equalsAnyIgnoreCase(queuedUri, CatalogConstant.ERROR_MSG)) {
            throw new AiShuException(ErrorCodeEnum.SystemBusy, queuedUri, Message.MESSAGE_SYSTEM_BUSY);
        }
        ErrorInfo info = queueStage(queuedUri, user);
        if (info.getState() != null && info.getState().contains("FAILED")) {
            log.error("sql syntax errors,detail :" + info.getMessage());
            finerErrorInfo(info);
        }
        //请求第三个接口executing 会调用多次，返回标准化的jsonstr
        ErrorInfo result = this.executing(info.getNextUrl(), user, 0);
        if (result == null) {
            throw new AiShuException(ErrorCodeEnum.SystemBusy, Detail.QUERY_NOT_FOUND, Message.MESSAGE_SYSTEM_BUSY);
        }
        if (result.getData() != null && result.getData().equals("{}")) {
            return ResponseEntity.ok(emptyStr);
        }

        if (result.getState() != null && result.getState().contains("FAILED")) {
            log.error("found errors,detail :" + result.getMessage());
            finerErrorInfo(result);
        }
        return ResponseEntity.ok(analyzeRes(result.getData()));
    }

    @Override
    public ResponseEntity<?> statement(String accountId, String accountType, FetchQueryVO fetchQueryVO) {
        Integer type = fetchQueryVO.getType();
        if (0 != type && 1 != type && 2 != type) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter,
                    Detail.TYPE_ENUM_MESSAGE_ADD,
                    Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
        if (2 == type) {
            String catalogName = fetchQueryVO.getCatalogName();
            String tableName = "";
            List<String> tableNames = fetchQueryVO.getTableName();
            if (tableNames != null && !tableNames.isEmpty()) {
                tableName = tableNames.stream().collect(Collectors.joining(","));
            }
            JSONObject dsl = fetchQueryVO.getDsl();
            if (dsl == null) {
                throw new AiShuException(ErrorCodeEnum.InvalidParameter,
                        Detail.DSL_IS_NULL,
                        Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }
            DataSourceEntity dataSourceEntity = dataSourceMapper.selectByCatalog(catalogName);
            if (StringUtils.isNull(catalogName)) {
                throw new AiShuException(ErrorCodeEnum.BadRequest,
                        Detail.CATALOG_NAME_IS_NULL,
                        Message.MESSAGE_PARAM_ERROR_SOLUTION);
            } else if (null == dataSourceEntity) {
                throw new AiShuException(ErrorCodeEnum.BadRequest,
                        Description.DS_NOT_FOUND_ERROR,
                        String.format(com.eisoo.dc.common.constant.Detail.DS_NOT_EXIST, catalogName),
                        Message.MESSAGE_INTERNAL_ERROR);
            }
            String response = null;
            JSONObject jsonObject = null;
            try {
                response = OpensearchHttpUtils.queryStatement(dataSourceEntity, tableName, dsl.toString());
                if (!StringUtils.isEmpty(response)) {
                    jsonObject = JSON.parseObject(response);
                }
            } catch (Exception e) {
                throw new AiShuException(ErrorCodeEnum.InternalServerError,
                        e.getMessage(),
                        Message.OPENSEARCH_ERROR_SOLUTION);
            }
            JSONObject result = new JSONObject();
            result.put("nextUri", null);
            result.put("progressPercentage", null);
            if (jsonObject != null) {
                result.put("data", new JSONObject[]{jsonObject});
            } else {
                result.put("data", null);
            }
            result.put("columns", null);
            result.put("total_count", null);
            return ResponseEntity.ok(result);
        }
        Integer batchSize = fetchQueryVO.getBatchSize();
        Integer timeOut = fetchQueryVO.getTimeOut();
        // 调用vega-gateway的fetch接口：/api/internal/virtual_engine_service/v1/fetch
        String urlOpen = serviceConfig.getVegaGateway() + "/api/internal/virtual_engine_service/v1/fetch?type=" + type;
        String sql = fetchQueryVO.getSql();
        if (StringUtils.isEmpty(sql)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter,
                    Detail.SQL_IS_NULL,
                    Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
        if (timeOut != null) {
            urlOpen = urlOpen + "&maxWaitResultTime=" + timeOut;
        }
        if (batchSize != null) {
            urlOpen = urlOpen + "&batchSize=" + batchSize;
        }
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        log.info("开始调用vega-gateway的fetch接口:urlOpen：{}", urlOpen);
        com.eisoo.dc.common.vo.HttpResInfo result;
        try {
            result = EtrinoHttpUtils.sendPostWithBody(urlOpen, sql, Constants.DEFAULT_AD_HOC_USER);
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.CalculateError, e.getMessage());
        }
        stopWatch.stop();
        if (result.getHttpStatus() >= org.springframework.http.HttpStatus.BAD_REQUEST.value()) {
            log.error("Http vega-gateway fetch接口请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(),
                    result.getResult(),
                    stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.CalculateError, result.getResult()
            );
        }
        log.info("Http vega-gateway fetch接口请求成功: httpStatus={}, 耗时={}ms",
                result.getHttpStatus(),
                stopWatch.getTotal(TimeUnit.MILLISECONDS)
        );
        return ResponseEntity.ok(result.getResult());
    }

    @Override
    public ResponseEntity<?> statement(String accountId, String accountType, String queryId, String slug, long token, Integer batchSize) {
        String urlOpen = serviceConfig.getVegaGateway() + "/api/internal/virtual_engine_service/v1/statement/executing/%s/%s/%d";
        urlOpen = String.format(urlOpen, queryId, slug, token);
        if (batchSize != null) {
            urlOpen = urlOpen + "?batchSize=" + batchSize;
        }
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        log.info("开始调用vega-gateway的fetch接口:urlOpen：{}", urlOpen);
        com.eisoo.dc.common.vo.HttpResInfo result;
        try {
            result = EtrinoHttpUtils.sendGet(urlOpen, Constants.DEFAULT_AD_HOC_USER);
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.CalculateError, e.getMessage());
        }
        // {"nextUri":null,"progressPercentage":100.0,"columns":[{"name":"f_varchar","type":"varchar(64)"}]}
        return ResponseEntity.ok(result.getResult());
    }

    //解析后sql拼装count查询语句
    public String assembleSql(String sql) {
        sql = sql.trim();
        Pattern selectPattern = Pattern.compile("(?i)select");
        if (!selectPattern.matcher(sql).find()) {
            throw new AiShuException(ErrorCodeEnum.SqlSyntaxError, Detail.SQL_NOT_SELECT);
        }

        // 匹配 LIMIT XXX 或 OFFSET XXX LIMIT XXX
        Pattern limitPattern = Pattern.compile("(?i)\\b(OFFSET\\s+\\d+\\s+)?(LIMIT\\s+(\\d+))$");
        Matcher matcher = limitPattern.matcher(sql);
        if (matcher.find()) {
            int limitIntValue = Integer.parseInt(matcher.group(3));
            if (limitIntValue > 1000) {
                throw new AiShuException(ErrorCodeEnum.SqlSyntaxError, Detail.SQL_LIMIT);
            }

            String detailSql = matcher.replaceAll(" ").trim();
            sql = "with detail_sql as (" + sql + "),count_sql as (select count(*) as total from (" + detailSql + ")) select detail_sql.*,count_sql.total from detail_sql,count_sql";
        } else {
            sql = "with detail_sql as (" + sql + " offset 0 limit 1000),count_sql as (select count(*) as total from (" + sql + ")) select detail_sql.*,count_sql.total from detail_sql,count_sql";
        }
        return sql;
    }

    //解析字符串 处理count语句查询出的total字段
    public String analyzeRes(String res) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode rootNode = (ObjectNode) mapper.readTree(res);

        if (rootNode.has("columns") && rootNode.get("columns").isArray() && rootNode.get("columns").size() > 0) {
            ArrayNode columnsArray = (ArrayNode) rootNode.get("columns");
            Iterator<JsonNode> columnIterator = columnsArray.elements();
            while (columnIterator.hasNext()) {
                ObjectNode columnNode = (ObjectNode) columnIterator.next();
                if ("total".equals(columnNode.get("name").asText())) {
                    columnIterator.remove();
                    break; // 找到total字段后移除并跳出循环
                }
            }
        }

        // 检查data数组是否至少有一个元素
        if (rootNode.has("data") && rootNode.get("data").isArray() && rootNode.get("data").size() > 0) {
            // 获取data数组的第一个元素
            ArrayNode dataArray = (ArrayNode) rootNode.get("data");
            JsonNode dataNode = dataArray.get(0);

            // 检查该元素是否包含total字段
            if (dataNode.isArray() && dataNode.size() > 0) {
                // 将total字段添加到与total_count平级的外部对象中
                rootNode.set("total", dataNode.get(dataNode.size() - 1));

                for (JsonNode dataElement : dataArray) {
                    ((ArrayNode) dataElement).remove(dataElement.size() - 1);
                }

            }
        }

        return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(rootNode);
    }

    /***
     * 增加一个携带catalog schema table的post请求用于触发引擎的缓存
     * @param statement
     * @param user
     * @param catalog
     * @param schema
     * @param table
     * @return
     */
    private String getStatementWithTabInfo(String statement, String user, String catalog, String schema, String table) {
        String urlOpen = serviceEndpoints.getVegaCalculateCoordinator() + QueryConstant.VIRTUAL_V1_STATEMENT;
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        HttpResInfo result;
        try {
            result = HttpOpenUtils.sendPostWithTabInfo(urlOpen, statement, user, catalog, schema, table);
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, e.getMessage(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        stopWatch.stop();

        if (result.getHttpStatus() >= HttpStatus.BAD_REQUEST) {
            log.error("Http getStatement 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError, result.getResult(), Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.info("Http getStatement 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
        return result.getResult();
    }
}
