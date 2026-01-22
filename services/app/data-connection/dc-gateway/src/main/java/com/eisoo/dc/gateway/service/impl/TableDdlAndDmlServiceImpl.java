package com.eisoo.dc.gateway.service.impl;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.eisoo.dc.common.driven.service.ServiceEndpoints;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.StringUtils;
import com.eisoo.dc.gateway.common.Detail;
import com.eisoo.dc.gateway.common.Message;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.gateway.enums.ErrorMagEnum;
import com.eisoo.dc.gateway.service.TableDdlAndDmlService;
import com.eisoo.dc.gateway.util.CheckUtil;
import com.eisoo.dc.gateway.util.ErrorParseUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

/**
 * @Author zdh
 **/
@Service
public class TableDdlAndDmlServiceImpl implements TableDdlAndDmlService {

    private static final Logger log = LoggerFactory.getLogger(TableDdlAndDmlServiceImpl.class);

    @Autowired
    GatewayOlkCollectionServiceImpl olkCollection;

    @Autowired
    private ServiceEndpoints serviceEndpoints;

    @Override
    public ResponseEntity<?> createTableSql(String statement, String user) {
        if (StringUtils.isBlank(statement)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        if (StringUtils.isBlank(user)) {
            // 用户不能为空
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.X_PRESTO_USER_MISSING);
        }
        //if (StringUtils.isNotEmpty(CheckUtil.checkPath())) {
        // 挂载文件路径为空
        //return Result.error(new AiShuException(ErrorCodeEnum.deployError));
        //}
        switch (CheckUtil.checkDdlOrDmlDatabase(serviceEndpoints.getVegaCalculateCoordinator(), statement, user)) {
            case 1 :
                throw new AiShuException(ErrorCodeEnum.CatalogNotExist,Detail.CATALOG_DB_TYPE_ERROR, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
            case 2 :
                throw new AiShuException(ErrorCodeEnum.SchemaNotExist,Detail.CATALOG_DB_TYPE_ERROR, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }
        if (!CheckUtil.checkTableNameLen(statement)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.TABLE_NAME_ERROR, Message.MESSAGE_TABLE_NAME_SOLUTION);
        }
        if (CheckUtil.checkDataType(statement)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.TYPE_LENGTH_ERROR, Message.MESSAGE_TYPE_LENGTH_SOLUTION);
        }
        //请求转换
        String statementResponse = olkCollection.getStatement(statement, user);
        String nextUri = olkCollection.getnextUri(statementResponse);
        if (StringUtils.isBlank(nextUri)) {
            throw new AiShuException(ErrorCodeEnum.InternalError, nextUri, Message.MESSAGE_INTERNAL_ERROR);
        }
        log.info("createTableSql虚拟化引擎底层执行QueryId:{}\n" + "TableDdlAndDmlServiceImpl.createTableSql SQL statement:\n{}", olkCollection.getQueryId(statementResponse), statement);
        //多次调用nextUri接口
        String jsonStr = olkCollection.execute(nextUri, user);
        if (StringUtils.endsWithIgnoreCase(olkCollection.checkState(jsonStr), "FAILED")) {
            String errorMessage = olkCollection.getErrorMessage(jsonStr);
            String errorName = olkCollection.getErrorName(jsonStr);
            log.error("SQL语句执行异常,detail:{}", errorMessage);
            if (errorMessage.contains("Float or double can not used as a key")) {
                throw new AiShuException(ErrorCodeEnum.TableKeyError, Detail.KEY_FLOAT_OR_DOUBLE_ERROR);
            }
            if (errorMessage.contains("not support")) {
                throw new AiShuException(ErrorCodeEnum.VirEngineNotSupportError, Detail.CREATE_TABLE_UNSUPPORTED);
            }
            throw ErrorParseUtils.finerErrorInfo(errorMessage,errorName);
        } else if (StringUtils.endsWithIgnoreCase(olkCollection.checkState(jsonStr), "FINISHED")) {
            log.info("-----------------finish--------------");
            JSONArray array = JSONUtil.createArray();
            JSONObject obj = JSONUtil.createObj();
            obj.putOpt("result", true);
            array.add(obj);
            return ResponseEntity.ok(array);
        } else {
            log.error("未知错误,请求结果:{}", jsonStr);
            throw new AiShuException(ErrorCodeEnum.InternalError, jsonStr, Message.MESSAGE_INTERNAL_ERROR);
        }
    }

//    public int insertTableSqlTimeOut(String statement, String user) {
//        if (StringUtils.isBlank(statement)) {
//            log.error("执行insertTableSqlTimeOut报错：传入的statement={}是空,直接返回!", statement);
//            return -1;
//        }
//        if (StringUtils.isBlank(user)) {
//            // 用户不能为空
//            log.error("执行insertTableSqlTimeOut报错：请求头X-Presto-User参数为空,直接返回!");
//            return -1;
//        }
//        switch (CheckUtil.checkDdlOrDmlDatabase(openlookengUrl, statement, user)) {
//            case 1:
//            case 2:
//                log.error("执行insertTableSqlTimeOut报错：数据源与数据库不一致, 检查数据源---数据库是否一致,直接返回!");
//                return -1;
//        }
//        //请求转换
//        String statementResponse = olkCollection.getStatement(statement, user);
//        String queryId = olkCollection.getQueryId(statementResponse);
//        String nextUri = olkCollection.getnextUri(statementResponse);
//        if (StringUtils.isBlank(nextUri)) {
//            log.error("执行insertTableSqlTimeOut报错：olkCollection.getNextUri(statementResponse)返回是空,直接返回!statementResponse={}", statementResponse);
//            return -1;
//        }
//        log.info("insertTableSql虚拟化引擎底层执行QueryId:{}\nTableDdlAndDmlServiceImpl.insertTableSql SQL statement:\n{}", queryId, statement);
//        //多次调用nextUri接口:2分钟超时
//        String jsonStr = olkCollection.executeWithQueryId(nextUri, user, queryId, 2 * 60 * 1000);
//        if (null == jsonStr) {
//            return -1;
//        }
//        String msg = olkCollection.checkState(jsonStr);
//        if (StringUtils.isEmpty(msg) || StringUtils.endsWithIgnoreCase(olkCollection.checkState(jsonStr), "FAILED")) {
//            log.error("SQL语句执行已完成，但是出现异常,detail:{}", jsonStr);
//            return -1;
//        } else if (StringUtils.endsWithIgnoreCase(olkCollection.checkState(jsonStr), "FINISHED")) {
//            log.info("-----------------finish--------------" + jsonStr);
//            return Integer.parseInt(olkCollection.getRowCount(jsonStr));
//        } else {
//            log.info("未知错误,请求结果:{}", jsonStr);
//            return -1;
//        }
//    }


    @Override
    public ResponseEntity<?> insertTableSql(String statement, String user) {
        if (StringUtils.isBlank(statement)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        if (StringUtils.isBlank(user)) {
            // 用户不能为空
            throw new AiShuException(ErrorCodeEnum.InvalidParameter,Detail.X_PRESTO_USER_MISSING);
        }
        //if (StringUtils.isNotEmpty(CheckUtil.checkPath())) {
        // 挂载文件路径为空
        //return Result.error(new AiShuException(ErrorCodeEnum.deployError));
        // }
        switch (CheckUtil.checkDdlOrDmlDatabase(serviceEndpoints.getVegaCalculateCoordinator(), statement, user)) {
            case 1:
                throw new AiShuException(ErrorCodeEnum.CatalogNotExist, Detail.CATALOG_DB_TYPE_ERROR, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
            case 2:
                throw new AiShuException(ErrorCodeEnum.SchemaNotExist, Detail.CATALOG_DB_TYPE_ERROR, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }
       /* //请求转换
        String statementResponse = olkCollection.getStatement(statement, user);
        String nextUri = olkCollection.getnextUri(statementResponse);
        if (StringUtils.isBlank(nextUri)) {
            throw new AiShuException(ErrorCodeEnum.InternalError);
        }
        log.info("insertTableSql虚拟化引擎底层执行QueryId:{}\n" +
                "TableDdlAndDmlServiceImpl.insertTableSql SQL statement:\n{}",olkCollection.getQueryId(statementResponse),statement);
        //多次调用nextUri接口
        String jsonStr = olkCollection.execute(nextUri, user);*/
        String jsonStr = olkCollection.getStatementURL(statement, user);
        if (StringUtils.isBlank(jsonStr)){
            log.error("未知错误,请求结果:{}", jsonStr);
            throw new AiShuException(ErrorCodeEnum.InternalError, jsonStr, Message.MESSAGE_INTERNAL_ERROR);
        }
        String msg = olkCollection.checkState(jsonStr);
        if (StringUtils.isEmpty(msg) || StringUtils.endsWithIgnoreCase(olkCollection.checkState(jsonStr), "FAILED")) {
            log.error("SQL语句执行异常,detail:{}", jsonStr);
            if (ErrorMagEnum.errorMsgConvert(jsonStr).contains("not support")) {
                throw new AiShuException(ErrorCodeEnum.VirEngineNotSupportError, Detail.INSERT_DATA_UNSUPPORTED);
            }
            throw ErrorParseUtils.finerErrorInfo(ErrorMagEnum.errorMsgConvert(jsonStr), Message.MESSAGE_QUERY_SQL_SOLUTION);
        } else if (StringUtils.endsWithIgnoreCase(olkCollection.checkState(jsonStr), "FINISHED")) {
            log.info("-----------------finish--------------" + jsonStr);
            long rowCount = Long.parseLong(olkCollection.getRowCount(jsonStr));
            JSONArray array = JSONUtil.createArray();
            JSONObject obj = JSONUtil.createObj();
            obj.putOpt("result", true);
            obj.putOpt("count", rowCount);
            array.add(obj);
            return ResponseEntity.ok(array);
        }else {
            log.error("未知错误,请求结果:{}", jsonStr);
            throw new AiShuException(ErrorCodeEnum.InternalError, jsonStr, Message.MESSAGE_INTERNAL_ERROR);
        }
    }

    @Override
    public ResponseEntity<?> truncateTableSql(String statement, String user) {
        if (StringUtils.isBlank(statement)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        if (StringUtils.isBlank(user)) {
            // 用户不能为空
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.X_PRESTO_USER_MISSING);
        }
        //if (StringUtils.isNotEmpty(CheckUtil.checkPath())) {
        // 挂载文件路径为空
        //return Result.error(new AiShuException(ErrorCodeEnum.deployError));
        //}
        switch (CheckUtil.checkDdlOrDmlDatabase(serviceEndpoints.getVegaCalculateCoordinator(),statement, user)) {
            case 1:
                throw new AiShuException(ErrorCodeEnum.CatalogNotExist, Detail.CATALOG_DB_TYPE_ERROR, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
            case 2:
                throw new AiShuException(ErrorCodeEnum.SchemaNotExist, Detail.CATALOG_DB_TYPE_ERROR, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }
        //请求转换
        String statementResponse = olkCollection.getStatement(statement, user);
        String nextUri = olkCollection.getnextUri(statementResponse);
        if (StringUtils.isBlank(nextUri)) {
            throw new AiShuException(ErrorCodeEnum.InternalError, nextUri, Message.MESSAGE_INTERNAL_ERROR);
        }
        log.info("truncateTableSql虚拟化引擎底层执行QueryId:{}\n" +
                "TableDdlAndDmlServiceImpl.truncateTableSql SQL statement:\n{}",olkCollection.getQueryId(statementResponse),statement);
        //多次调用nextUri接口
        String jsonStr = olkCollection.execute(nextUri, user);
        if (StringUtils.endsWithIgnoreCase(olkCollection.checkState(jsonStr), "FAILED")) {
            String errorMessage = olkCollection.getErrorMessage(jsonStr);
            String errorName = olkCollection.getErrorName(jsonStr);
            log.error("SQL语句执行异常,detail:{}", errorMessage);
            if (errorMessage.contains("Cannot truncate table") || errorMessage.contains("not support")) {
                throw new AiShuException(ErrorCodeEnum.SqlSyntaxError, Detail.TRUNCATE_TABLE_UNSUPPORTED);
            }
            throw ErrorParseUtils.finerErrorInfo(errorMessage,errorName);
        } else if (StringUtils.endsWithIgnoreCase(olkCollection.checkState(jsonStr), "FINISHED")) {
            log.info("-----------------finish--------------");
            JSONArray array = JSONUtil.createArray();
            JSONObject obj = JSONUtil.createObj();
            obj.putOpt("result", true);
            array.add(obj);
            return ResponseEntity.ok(array);
        } else {
            log.error("系统未知错误,请求结果:{}", jsonStr);
            throw new AiShuException(ErrorCodeEnum.InternalError, jsonStr, Message.MESSAGE_INTERNAL_ERROR);
        }
    }


}
