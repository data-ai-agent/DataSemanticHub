package com.eisoo.dc.gateway.service.impl;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.StringUtils;
import com.eisoo.dc.gateway.common.Detail;
import com.eisoo.dc.gateway.common.Message;
import com.eisoo.dc.gateway.domain.dto.SchemaDto;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.gateway.service.SchemaService;
import com.eisoo.dc.gateway.util.ErrorParseUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

/**
 * @Author zdh
 **/
@Service
public class SchemaServiceImpl implements SchemaService {

    private static final Logger log = LoggerFactory.getLogger(SchemaServiceImpl.class);

    @Autowired
    GatewayOlkCollectionServiceImpl olkCollection;

    @Override
    public ResponseEntity<?> createSchema(SchemaDto params, String user) {
        if (StringUtils.isNull(params)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        if (StringUtils.isBlank(user)) {
            // 用户不能为空
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.X_PRESTO_USER_MISSING);
        }
        /*String statementResponse = olkCollection.getStatement(params.getQuery(), user);
        String nextUri = olkCollection.getnextUri(statementResponse);
        if (StringUtils.isBlank(nextUri)) {
            throw new AiShuException(ErrorCodeEnum.InternalError);
        }*/
        log.info("createSchemaSql虚拟化引擎底层执行\n" +
                "SchemaServiceImpl.createSchemaSql SQL statement:\n{}", params.getQuery());
        //多次调用nextUri接口
        //String jsonStr = olkCollection.execute(nextUri, user);
        String jsonStr = olkCollection.getStatementURL(params.getQuery(), user);
        if (StringUtils.isBlank(jsonStr)){
            log.error("未知错误,请求结果:{}", jsonStr);
            throw new AiShuException(ErrorCodeEnum.InternalError, jsonStr, Message.MESSAGE_INTERNAL_ERROR);
        }
        String msg=olkCollection.checkState(jsonStr);
        if (StringUtils.endsWithIgnoreCase(msg, "FAILED") ||StringUtils.isEmpty(msg)) {
            String errorMessage = olkCollection.getErrorMessage(jsonStr);
            String errorName = olkCollection.getErrorName(jsonStr);
            log.error("SQL语句执行异常,detail:{}", errorMessage);
            throw ErrorParseUtils.finerErrorInfo(errorMessage,errorName);
        } else if (StringUtils.endsWithIgnoreCase(msg, "FINISHED")) {
            log.info("-----------------finish--------------");
            JSONArray array = JSONUtil.createArray();
            JSONObject obj = JSONUtil.createObj();
            obj.putOpt("name", params.getCatalogName() + "." + params.getSchemaName());
            array.add(obj);
            return ResponseEntity.ok(array);
        } else {
            log.error("未知错误,请求结果:{}", jsonStr);
            throw new AiShuException(ErrorCodeEnum.InternalError, jsonStr, Message.MESSAGE_INTERNAL_ERROR);
        }
    }

    @Override
    public ResponseEntity<?> dropSchema(SchemaDto params, String user) {
        if (StringUtils.isNull(params)) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter);
        }
        if (StringUtils.isBlank(user)) {
            // 用户不能为空
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.X_PRESTO_USER_MISSING);
        }
        /*String statementResponse = olkCollection.getStatement(params.getQuery(), user);
        String nextUri = olkCollection.getnextUri(statementResponse);
        if (StringUtils.isBlank(nextUri)) {
            throw new AiShuException(ErrorCodeEnum.InternalError);
        }*/
        log.info("dropSchemaSql虚拟化引擎底层执行\n" +
                "SchemaServiceImpl.dropSchema SQL statement:\n{}", params.getQuery());
        //多次调用nextUri接口
        //String jsonStr = olkCollection.execute(nextUri, user);
        String jsonStr = olkCollection.getStatementURL(params.getQuery(), user);
        if (StringUtils.isBlank(jsonStr)){
            log.error("未知错误,请求结果:{}", jsonStr);
            throw new AiShuException(ErrorCodeEnum.InternalError, jsonStr, Message.MESSAGE_INTERNAL_ERROR);
        }
        String msg=olkCollection.checkState(jsonStr);
        if (StringUtils.endsWithIgnoreCase(msg, "FAILED") ||StringUtils.isEmpty(msg)) {
            String errorMessage = olkCollection.getErrorMessage(jsonStr);
            String errorName = olkCollection.getErrorName(jsonStr);
            log.error("SQL语句执行异常,detail:{}", errorMessage);
            throw ErrorParseUtils.finerErrorInfo(errorMessage,errorName);
        } else if (StringUtils.endsWithIgnoreCase(msg, "FINISHED")) {
            log.info("-----------------finish--------------");
            JSONArray array = JSONUtil.createArray();
            JSONObject obj = JSONUtil.createObj();
            obj.putOpt("name", params.getCatalogName() + "." + params.getSchemaName());
            array.add(obj);
            return ResponseEntity.ok(array);
        } else {
            log.error("未知错误,请求结果:{}", jsonStr);
            throw new AiShuException(ErrorCodeEnum.InternalError, jsonStr, Message.MESSAGE_INTERNAL_ERROR);
        }
    }
}
