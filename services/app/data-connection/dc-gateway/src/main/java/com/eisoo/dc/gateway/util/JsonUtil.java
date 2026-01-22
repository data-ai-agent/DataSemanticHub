package com.eisoo.dc.gateway.util;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.util.StringUtils;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.commons.lang3.StringEscapeUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * json 工具类
 */
public class JsonUtil {

    private static final Logger logger = LoggerFactory.getLogger(JsonUtil.class);
    private static ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static ConcurrentHashMap<String, JSONObject> jsonMap = new ConcurrentHashMap<>();

    static {
        // 对象的所有字段全部列入，还是其他的选项，可以忽略null等
        OBJECT_MAPPER.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // 驼峰下滑线互转 ,不开启
        OBJECT_MAPPER.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        // 忽略空Bean转json的错误
        OBJECT_MAPPER.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        // 忽略未知属性，防止json字符串中存在，java对象中不存在对应属性的情况出现错误
        OBJECT_MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        // 注册一个时间序列化及反序列化的处理模块，用于解决jdk8中localDateTime等的序列化问题
        OBJECT_MAPPER.registerModule(new JavaTimeModule());

    }


    public static Map<String, String> jsonToMap(String json) {
        return json2Obj(json, Map.class);
    }

    public static <T> String map2json(Map<String, T> map) {
        return obj2json(map);
    }

    public static String obj2json(Object o) {
        try {
            return OBJECT_MAPPER.writeValueAsString(o);
        } catch (IOException e) {
            logger.error("序列化错误：", e);
        }
        return null;
    }

    public static <T> T json2Obj(String json, Class<T> valueType) {
        try {
            return OBJECT_MAPPER.readValue(json, valueType);
        } catch (IOException e) {
            logger.error("反序列化错误：{}", json);
            logger.error(e.getMessage(), e);
        }
        return null;
    }

    public static <T> List<T> json2List(String jsonString, Class<T> valueType) {
        try {
            JavaType javaType = getCollectionType(ArrayList.class, valueType);
            return OBJECT_MAPPER.readValue(jsonString, javaType);
        } catch (IOException e) {
            logger.error("反序列化错误：{}", jsonString);
            logger.error(e.getMessage(), e);
        }
        return null;
    }



    /**
     * 获取泛型的 Collection Type
     */
    public static JavaType getCollectionType(Class<?> collectionClass, Class<?>... elementClasses) {
        return OBJECT_MAPPER.getTypeFactory().constructParametricType(collectionClass, elementClasses);
    }

    public static JSONObject buildJson(String name,String uuid,String queueName,String jsonStr,String notice,String url) {
        //url="http://10.4.109.247";
        logger.info("---------------------buildJson.uuid----------------------------"+uuid);
        //JSONObject json = jsonMap.computeIfAbsent("defaultJson", k -> {
        JSONObject jsonObj = new JSONObject();
        jsonObj.put("name", name);
        jsonObj.put("base_task_type", "Http");
        jsonObj.put("uuid", uuid);
        JSONArray advancedParams = new JSONArray();
        advancedParams.add(buildKeyValue("modelType", "Explore"));
        advancedParams.add(buildKeyValue("httpMethod", "POST"));
        advancedParams.add(buildKeyValue("url", url+"/v1/data_exploration"));
        advancedParams.add(buildKeyValue("delayTime", "1"));
        advancedParams.add(buildKeyValue("failRetryInterval", "1"));
        advancedParams.add(buildKeyValue("failRetryTimes", "1"));
        advancedParams.add(buildKeyValue("connectTimeout", "7200000"));
        advancedParams.add(buildKeyValue("socketTimeout", "7200000"));
        advancedParams.add(buildKeyValue("httpCheckCondition", "STATUS_CODE_DEFAULT"));
        advancedParams.add(buildKeyValue("condition", ""));
        advancedParams.add(buildKeyValue("httpParams", StringEscapeUtils.unescapeJson(jsonStr)));
        advancedParams.add(buildKeyValue("noticeUrl", url+"/v1/data_exploration/notice"));
        advancedParams.add(buildKeyValue("noticeHttpMethod", "POST"));
        advancedParams.add(buildKeyValue("noticeHttpParams", StringEscapeUtils.unescapeJson(notice)));
        advancedParams.add(buildKeyValue("taskGroupName", queueName));
        jsonObj.put("advanced_params", advancedParams);
        // return jsonObj;
        // });
        JSONObject json=jsonObj;
        return json;
    }

    private static JSONObject buildKeyValue(String key, String value) {
        JSONObject keyValue = new JSONObject();
        keyValue.put("key", key);
        keyValue.put("value", value);
        return keyValue;
    }

    public static String buildSqlParam(String sql1, String sql2, String sql3, String sql4, String taskId, String topicName) {
        if(StringUtils.endsWithIgnoreCase("SELECT",sql1)){
            sql1=null;
        }
        JSONArray result = new JSONArray();
        // Content-Type header
        JSONObject contentTypeHeader = new JSONObject();
        contentTypeHeader.put("prop", "Content-Type");
        contentTypeHeader.put("httpParametersType", "HEADERS");
        contentTypeHeader.put("value", "application/json");
        result.add(contentTypeHeader);

        // X-Presto-User header
        JSONObject prestoUserHeader = new JSONObject();
        prestoUserHeader.put("prop", "X-Presto-User");
        prestoUserHeader.put("httpParametersType", "HEADERS");
        prestoUserHeader.put("value", "admin");
        result.add(prestoUserHeader);

        // SQL statements in the request body
        JSONObject requestBody = new JSONObject();
        requestBody.put("prop", "");
        requestBody.put("httpParametersType", "BODY");

        JSONArray statements = new JSONArray();
        if(StringUtils.isNotEmpty(sql1)){
            statements.add(sql1);
        }
        if(StringUtils.isNotEmpty(sql2)){
            statements.add(sql2);
        }
        if(StringUtils.isNotEmpty(sql3)){
            statements.add(sql3);
        }
        if(StringUtils.isNotEmpty(sql4)){
            statements.add(sql4);
        }
        JSONObject jsonObject=new JSONObject();
        jsonObject.put("statement", statements);
        jsonObject.put("taskId", taskId);
        jsonObject.put("topic", topicName);
        requestBody.put("value", StringEscapeUtils.escapeJson(jsonObject.toString()));
        result.add(requestBody);

        return result.toString();
    }

    public static String buildSqlRequest(String sql1, String sql2, String sql3, String sql4, String taskId, String topicName) {
        JSONObject result = new JSONObject();
        JSONArray statements = new JSONArray();
        List<String> subtaskIds = new ArrayList<>();

        int subTaskIndex = 1;

        if (StringUtils.isNotEmpty(sql1)) {
            statements.add(sql1);
            subtaskIds.add(taskId + "_0" + subTaskIndex++);
        }
        if (StringUtils.isNotEmpty(sql2)) {
            statements.add(sql2);
            subtaskIds.add(taskId + "_0" + subTaskIndex++);
        }
        if (StringUtils.isNotEmpty(sql3)) {
            statements.add(sql3);
            subtaskIds.add(taskId + "_0" + subTaskIndex++);
        }
        if (StringUtils.isNotEmpty(sql4)) {
            statements.add(sql4);
            subtaskIds.add(taskId + "_0" + subTaskIndex++);
        }

        result.put("statement", statements);
        result.put("taskId", taskId);
        result.put("topic", topicName);
        result.put("subtaskId", subtaskIds);

        return result.toString();
    }

    public static String buildSqlParam(String taskId, String topicName) {
        JSONArray result = new JSONArray();

        // Content-Type header
        JSONObject contentTypeHeader = new JSONObject();
        contentTypeHeader.put("prop", "Content-Type");
        contentTypeHeader.put("httpParametersType", "HEADERS");
        contentTypeHeader.put("value", "application/json");
        result.add(contentTypeHeader);

        // X-Presto-User header
        JSONObject prestoUserHeader = new JSONObject();
        prestoUserHeader.put("prop", "X-Presto-User");
        prestoUserHeader.put("httpParametersType", "HEADERS");
        prestoUserHeader.put("value", "admin");
        result.add(prestoUserHeader);

        // SQL statements in the request body
        JSONObject requestBody = new JSONObject();
        requestBody.put("prop", "");
        requestBody.put("httpParametersType", "BODY");

        JSONObject jsonObject=new JSONObject();
        jsonObject.put("taskId", taskId);
        jsonObject.put("topic", topicName);
        requestBody.put("value", StringEscapeUtils.escapeJson(jsonObject.toString()));
        result.add(requestBody);
        return result.toString();
    }

}
