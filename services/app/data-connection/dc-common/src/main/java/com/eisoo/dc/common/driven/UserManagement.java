package com.eisoo.dc.common.driven;

import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.constant.Description;
import com.eisoo.dc.common.constant.Message;
import com.eisoo.dc.common.constant.ResourceAuthConstant;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.CommonUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class UserManagement {
    private static final Logger log = LoggerFactory.getLogger(UserManagement.class);

    /**
     * 批量获取用户类型和名称
     * @param url 地址
     * @param userIds 用户ID数组
     * @return 用户信息映射，键为用户ID，值为用户类型和名称数组，分别为[用户类型, 用户名]
     * @throws AiShuException 如果请求失败则抛出异常
     */
    public static Map<String, String[]> batchGetUserInfosByUserIds(String url, Set<String> userIds) {
        if (userIds.isEmpty()){
            return new HashMap<>();
        }
        try {
            // 1. 创建HTTP客户端和POST请求
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/user-management/v1/names");

            // 2. 设置请求头
            httpPost.addHeader("Content-Type", "application/json");

            // 3. 构建请求体
            JSONObject body = new JSONObject();
            body.put("method", "GET");
            body.put("user_ids", userIds);

            // 4. 设置请求实体
            StringEntity httpEntity = new StringEntity(body.toString());
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            // 5. 执行请求并处理响应
            HttpResponse response = httpClient.execute(httpPost);
            String responseBody = EntityUtils.toString(response.getEntity());
            if (response.getStatusLine().getStatusCode() == HttpStatus.BAD_REQUEST.value()){
                // 解析错误响应
                ObjectMapper objectMapper = new ObjectMapper();
                Map<String, Object> errorMap = objectMapper.readValue(responseBody, Map.class);
                // 检查是否为400019001错误码
                if (errorMap.get("code") != null && errorMap.get("code").equals(400019001)) {
                    Map<String, Object> detail = (Map<String, Object>) errorMap.get("detail");
                    List<String> invalidIds = (List<String>) detail.get("ids");

                    // 分离实名账户ID和应用账户ID
                    Set<String> validUserIds = new HashSet<>(userIds);
                    Set<String> appIds = new HashSet<>(invalidIds);
                    validUserIds.removeAll(appIds);

                    // 构建accountInfos并调用batchGetNamesByAccountIds
                    Map<String, Set<String>> accountInfos = new HashMap<>();
                    accountInfos.put(ResourceAuthConstant.USER_TYPE_USER, validUserIds);
                    accountInfos.put(ResourceAuthConstant.USER_TYPE_APP, appIds);
                    return batchGetUserInfosByAccountIds(url, accountInfos);
                }
            }
            if (response.getStatusLine().getStatusCode() != HttpStatus.OK.value()) {
                throw new AiShuException(ErrorCodeEnum.InternalServerError,
                        Description.USER_MANAGEMENT_SERVICE_ERROR,
                        responseBody,
                        Message.MESSAGE_SERVICE_ERROR);
            }

            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> resultMap = objectMapper.readValue(responseBody, Map.class);

            // 创建结果Map，根据accountType获取对应的名称映射
            Map<String, String[]> idNameMap = new HashMap<>();
            List<Map<String, String>> userNameList = (List<Map<String, String>>) resultMap.get("user_names");
            if (userNameList != null) {
                for (Map<String, String> item : userNameList) {
                    idNameMap.put(item.get("id"), new String[]{ResourceAuthConstant.USER_TYPE_USER, item.get("name")});
                }
            }
            return idNameMap;


        } catch (AiShuException e){
            log.error("user-management 批量获取用户名称失败：{}", e.getErrorDetails());
            throw e;
        } catch (Exception e) {
            log.error("user-management 批量获取用户名称失败。", e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.USER_MANAGEMENT_SERVICE_ERROR, e.getMessage(), Message.MESSAGE_SERVICE_ERROR);
        }
    }

    /**
     * 批量获取普通用户、应用账户名称
     * @param url 地址
     * @param accountInfos 账户信息，key为用户类型，value为账户ID列表
     * @return 用户信息映射，键为用户ID，值为用户类型和名称数组，分别为[用户类型, 用户名]
     * @throws AiShuException 如果请求失败则抛出异常
     */
    public static Map<String, String[]> batchGetUserInfosByAccountIds(String url, Map<String, Set<String>> accountInfos) {

        if (accountInfos.isEmpty() || (accountInfos.get(ResourceAuthConstant.USER_TYPE_USER).isEmpty() && accountInfos.get(ResourceAuthConstant.USER_TYPE_APP).isEmpty())){
            return new HashMap<>();
        }
        try {
            // 1. 创建HTTP客户端和POST请求
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/user-management/v1/names");

            // 2. 设置请求头
            httpPost.addHeader("Content-Type", "application/json");

            // 3. 构建请求体
            JSONObject body = new JSONObject();
            body.put("method", "GET");
            body.put("user_ids", accountInfos.getOrDefault(ResourceAuthConstant.USER_TYPE_USER, Collections.emptySet()));
            body.put("app_ids", accountInfos.getOrDefault(ResourceAuthConstant.USER_TYPE_APP, Collections.emptySet()));

            // 4. 设置请求实体
            StringEntity httpEntity = new StringEntity(body.toString());
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            // 5. 执行请求并处理响应
            HttpResponse response = httpClient.execute(httpPost);
            String responseBody = EntityUtils.toString(response.getEntity());
            if (response.getStatusLine().getStatusCode()!= HttpStatus.OK.value()){
                throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.USER_MANAGEMENT_SERVICE_ERROR, responseBody, Message.MESSAGE_SERVICE_ERROR);
            }
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> resultMap = objectMapper.readValue(responseBody, Map.class);

            // 创建结果Map，根据accountType获取对应的名称映射
            Map<String, String[]> idNameMap = new HashMap<>();
            List<Map<String, String>> appNameList = (List<Map<String, String>>) resultMap.get("app_names");
            List<Map<String, String>> userNameList = (List<Map<String, String>>) resultMap.get("user_names");

            if (appNameList != null) {
                for (Map<String, String> item : appNameList) {
                    idNameMap.put(item.get("id"), new String[]{ResourceAuthConstant.USER_TYPE_APP, item.get("name")});
                }
            }
            if (userNameList != null) {
                for (Map<String, String> item : userNameList) {
                    idNameMap.put(item.get("id"), new String[]{ResourceAuthConstant.USER_TYPE_USER, item.get("name")});
                }
            }

            return idNameMap;

        } catch (AiShuException e){
            log.error("user-management 批量获取用户名称失败：{}", e.getErrorDetails());
            throw e;
        } catch (Exception e) {
            log.error("user-management 批量获取用户名称失败。", e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.USER_MANAGEMENT_SERVICE_ERROR, e.getMessage(), Message.MESSAGE_SERVICE_ERROR);
        }
    }
}
