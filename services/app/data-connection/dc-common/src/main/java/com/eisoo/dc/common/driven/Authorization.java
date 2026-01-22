package com.eisoo.dc.common.driven;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.constant.Description;
import com.eisoo.dc.common.constant.Message;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.CommonUtil;
import com.eisoo.dc.common.vo.ResourceAuthVo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Authorization {
    private static final Logger log = LoggerFactory.getLogger(Authorization.class);

    /**
     * 根据传入的资源id列表，过滤获取有权限的资源列表
     * @param url 地址
     * @param userId 用户ID
     * @param userType 用户类型
     * @param resources 需要过滤的资源列表
     * @param operation 操作类型
     * @return 资源的权限列表
     * @throws AiShuException 如果请求失败则抛出异常
     */
    public static Map<String, Object> getAuthIdsByResourceIds(String url, String userId, String userType, List<ResourceAuthVo> resources, String operation) {
        if (resources.size() == 0){
            return new HashMap<>();
        }
        try {
            // 1. 创建HTTP客户端和POST请求
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/authorization/v1/resource-filter");

            // 2. 设置请求头
            httpPost.addHeader("Content-Type", "application/json");

            // 3. 构建请求体
            JSONObject body = new JSONObject();

            JSONObject accessor = new JSONObject();
            accessor.put("id", userId);
            accessor.put("type", userType);
            body.put("accessor", accessor);
            body.put("resources", resources);
            body.put("operation", new String[]{operation});
            body.put("method", "GET");
            body.put("allow_operation", true);

            // 4. 设置请求实体
            StringEntity httpEntity = new StringEntity(body.toString());
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            // 5. 执行请求并处理响应
            HttpResponse response = httpClient.execute(httpPost);
            String responseBody = EntityUtils.toString(response.getEntity());
            if (response.getStatusLine().getStatusCode()!= HttpStatus.OK.value()){
                throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.AUTHORIZATION_SERVICE_ERROR, responseBody, Message.MESSAGE_SERVICE_ERROR);
            }
            ObjectMapper objectMapper = new ObjectMapper();
            List<Map<String, Object>> resultList = objectMapper.readValue(responseBody, List.class);

            Map<String, Object> idOperationsMap = new HashMap<>();
            for (Map<String, Object> item : resultList) {
                String id = (String) item.get("id");
                Object operationObj = item.get("allow_operation");
                idOperationsMap.put(id, operationObj);
            }
            return idOperationsMap;

        } catch (AiShuException e){
            log.error("Authorization 过滤获取有权限的资源列表失败：{}", e.getErrorDetails());
            throw e;
        } catch (Exception e) {
            log.error("Authorization 过滤获取有权限的资源列表失败。", e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.AUTHORIZATION_SERVICE_ERROR, e.getMessage(), Message.MESSAGE_SERVICE_ERROR);
        }
    }

    /**
     * 检查资源权限
     * @param url 地址
     * @param userId 用户ID
     * @param userType 用户类型
     * @param resource 资源信息
     * @param operation 操作类型
     * @return 检查结果
     * @throws AiShuException 如果请求失败则抛出异常
     */
    public static boolean checkResourceOperation(String url, String userId, String userType, ResourceAuthVo resource, String operation) {

        try {
            // 1. 创建HTTP客户端和POST请求
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/authorization/v1/operation-check");

            // 2. 设置请求头
            httpPost.addHeader("Content-Type", "application/json");

            // 3. 构建请求体
            JSONObject body = new JSONObject();

            JSONObject accessor = new JSONObject();
            accessor.put("id", userId);
            accessor.put("type", userType);
            body.put("accessor", accessor);
            body.put("resource", resource);

            body.put("operation", new String[]{operation});
            body.put("method", "GET");

            // 4. 设置请求实体
            StringEntity httpEntity = new StringEntity(body.toString());
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            // 5. 执行请求并处理响应
            HttpResponse response = httpClient.execute(httpPost);
            String responseBody = EntityUtils.toString(response.getEntity());
            if (response.getStatusLine().getStatusCode()!= HttpStatus.OK.value()){
                throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.AUTHORIZATION_SERVICE_ERROR, responseBody, Message.MESSAGE_SERVICE_ERROR);
            }
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Boolean> result = objectMapper.readValue(responseBody, Map.class);
            return result.get("result");

        } catch (AiShuException e){
            log.error("Authorization 检查资源权限失败：{}", e.getErrorDetails());
            throw e;
        } catch (Exception e) {
            log.error("Authorization 检查资源权限失败。", e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.AUTHORIZATION_SERVICE_ERROR, e.getMessage(), Message.MESSAGE_SERVICE_ERROR);
        }
    }

    /**
     * 添加资源权限
     * @param url 地址
     * @param userId 用户ID
     * @param userType 用户类型
     * @param resourceId 资源ID
     * @param resourceType 资源类型
     * @param resourceName 资源名称
     * @param allowOperations 允许的资源操作
     * @param denyOperations 拒绝的资源操作
     * @throws AiShuException 如果请求失败则抛出异常
     */
    public static void addResourceOperations(String url, String userId, String userType, String resourceId, String resourceType, String resourceName, String[] allowOperations, String[] denyOperations) {

        try {
            // 1. 创建HTTP客户端和POST请求
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/authorization/v1/policy");

            // 2. 设置请求头
            httpPost.addHeader("Content-Type", "application/json");

            // 3. 构建请求体
            JSONArray req = new JSONArray();
            JSONObject body = new JSONObject();

            JSONObject accessor = new JSONObject();
            accessor.put("id", userId);
            accessor.put("type", userType);
            body.put("accessor", accessor);

            JSONObject resource = new JSONObject();
            resource.put("id", resourceId);
            resource.put("type", resourceType);
            resource.put("name", resourceName);
            body.put("resource", resource);

            JSONObject operation = new JSONObject();
            JSONArray allow = new JSONArray();
            JSONArray deny = new JSONArray();
            for (String allowOperation : allowOperations) {
                JSONObject id = new JSONObject();
                id.put("id",allowOperation);
                allow.add(id);
            }
            for (String denyOperation : denyOperations) {
                JSONObject id = new JSONObject();
                id.put("id",denyOperation);
                deny.add(id);
            }

            operation.put("allow",allow);
            operation.put("deny",deny);
            body.put("operation", operation);
            req.add(body);

            // 4. 设置请求实体
            StringEntity httpEntity = new StringEntity(req.toString());
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            // 5. 执行请求并处理响应
            HttpResponse response = httpClient.execute(httpPost);
            if (response.getStatusLine().getStatusCode()!= HttpStatus.NO_CONTENT.value()){
                throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.AUTHORIZATION_SERVICE_ERROR, EntityUtils.toString(response.getEntity()), Message.MESSAGE_SERVICE_ERROR);
            }

        } catch (AiShuException e){
            log.error("Authorization 添加资源权限失败：{}", e.getErrorDetails());
            throw e;
        } catch (Exception e) {
            log.error("Authorization 添加资源权限失败。", e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.AUTHORIZATION_SERVICE_ERROR, e.getMessage(), Message.MESSAGE_SERVICE_ERROR);
        }
    }

    /**
     * 删除资源权限
     * @param url 地址
     * @param resourceId 资源ID
     * @param resourceType 资源类型
     * @throws AiShuException 如果请求失败则抛出异常
     */
    public static void deleteResourceOperations(String url, String resourceId, String resourceType) {

        try {
            // 1. 创建HTTP客户端和POST请求
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/authorization/v1/policy-delete");

            // 2. 设置请求头
            httpPost.addHeader("Content-Type", "application/json");

            // 3. 构建请求体
            JSONObject body = new JSONObject();
            JSONArray resources = new JSONArray();
            JSONObject resource = new JSONObject();
            resource.put("id", resourceId);
            resource.put("type", resourceType);
            resources.add(resource);
            body.put("resources", resources);
            body.put("method", "DELETE");

            // 4. 设置请求实体
            StringEntity httpEntity = new StringEntity(body.toString());
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            // 5. 执行请求并处理响应
            HttpResponse response = httpClient.execute(httpPost);
            if (response.getStatusLine().getStatusCode()!= HttpStatus.NO_CONTENT.value()){
                throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.AUTHORIZATION_SERVICE_ERROR, EntityUtils.toString(response.getEntity()), Message.MESSAGE_SERVICE_ERROR);
            }

        } catch (AiShuException e){
            log.error("Authorization 删除资源权限失败：{}", e.getErrorDetails());
            throw e;
        } catch (Exception e) {
            log.error("Authorization 删除资源权限失败。", e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.AUTHORIZATION_SERVICE_ERROR, e.getMessage(), Message.MESSAGE_SERVICE_ERROR);
        }
    }
}
