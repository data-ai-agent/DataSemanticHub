package com.eisoo.dc.gateway.util;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.util.StringUtils;
import com.eisoo.dc.gateway.domain.vo.AuthTokenInfo;
import com.eisoo.dc.gateway.domain.vo.DataViewInfo;
import com.eisoo.dc.gateway.domain.vo.IntrospectInfo;
import com.eisoo.dc.gateway.domain.vo.RowColumnRuleVo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;

/**
 * AF接口工具类
 */
@Slf4j
public class AFUtil {
    private static final int DATA_VIEW_LIMIT = 10;

    /**
     * 获取用户全部逻辑视图，包括我自己创建的视图和其他用户赋权给我的视图
     * @param url
     * @param token
     * @return
     */
    public DataViewInfo getAllDataView(String url, String token) {
        DataViewInfo ownerViews = getDataView(url, token, true);
        DataViewInfo otherViews = getDataView(url, token, false);
        if (ownerViews.getEntries() != null && otherViews.getEntries() != null) {
            ownerViews.getEntries().addAll(otherViews.getEntries());
            ownerViews.setTotalCount(ownerViews.getTotalCount() + otherViews.getTotalCount());
        } else if (ownerViews.getEntries() == null && otherViews.getEntries() != null) {
            return otherViews;
        }
        return ownerViews;
    }

    /**
     * 获取用户逻辑视图
     * @param url
     * @param token
     * @return
     * @throws Exception
     */
    public DataViewInfo getDataView(String url, String token, boolean isOwner) {
        int offset = 1;
        RestTemplate restTemplate;
        DataViewInfo dataViewInfo = null;
        HttpEntity<MultiValueMap<String, Object>> httpEntity;
        ResponseEntity<DataViewInfo> responseEntity = null;
        HttpHeaders headers = new HttpHeaders();
        try {
            headers.set("Authorization", token);
            restTemplate = HttpsUtil.getRestTemplate();
            httpEntity = new HttpEntity<>(headers);
            String realUrl = url + "?limit=" + DATA_VIEW_LIMIT + "&offset=" + offset + "&owner=" + isOwner;

            responseEntity = restTemplate.exchange(realUrl, HttpMethod.GET, httpEntity, DataViewInfo.class);
            dataViewInfo = responseEntity.getBody();
        } catch (HttpClientErrorException e) {
            log.warn(e.getMessage());
            dataViewInfo = new DataViewInfo();
            dataViewInfo.setStatusCode(e.getStatusCode().value());
            return dataViewInfo;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        offset ++;

        // 继续翻页，直到获取所有视图
        int total = dataViewInfo.getTotalCount() - DATA_VIEW_LIMIT;
        while (total > 0) {
            String realUrl = url + "?limit=" + DATA_VIEW_LIMIT + "&offset=" + offset + "&owner=" + isOwner;
            httpEntity = new HttpEntity<>(headers);
            DataViewInfo nextDataViewInfo = restTemplate.exchange(realUrl, HttpMethod.GET, httpEntity, DataViewInfo.class).getBody();
            dataViewInfo.getEntries().addAll(nextDataViewInfo.getEntries());
            total -= DATA_VIEW_LIMIT;
            offset ++;
        }
        return dataViewInfo;
    }

    public JSONObject registerClientId(String url, String clientName) {
        try {
            JSONObject requestBody = getRegisterClientIdReqBody(clientName);
            RestTemplate restTemplate = HttpsUtil.getRestTemplate();
            HttpEntity<Object> entity = new HttpEntity<>(requestBody);
            ResponseEntity<String> responseEntity = restTemplate.postForEntity(url,
                    entity,
                    String.class);
            return JSON.parseObject(responseEntity.getBody());
        } catch (HttpClientErrorException e) {
            log.warn(e.getMessage());
            JSONObject response = new JSONObject();
            response.put("statusCode", e.getStatusCode().value());
            response.put("errorMsg", e.getResponseBodyAsString());
            return response;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private JSONObject getRegisterClientIdReqBody(String clientName) {
        JSONObject requestBody = new JSONObject();
        JSONArray grantTypes = new JSONArray();
        grantTypes.add("urn:ietf:params:oauth:grant-type:jwt-bearer");
        grantTypes.add("client_credentials");
        JSONArray responseTypes = new JSONArray();
        responseTypes.add("token");
        JSONArray redirectUris = new JSONArray();
        redirectUris.add("https://127.0.0.1:9010/callback");
        JSONArray postLogoutRedirectUris = new JSONArray();
        postLogoutRedirectUris.add("https://127.0.0.1:9010/successful-logout");
        requestBody.put("client_name", clientName);
        requestBody.put("grant_types", grantTypes);
        requestBody.put("response_types", responseTypes);
        requestBody.put("scope", "all");
        requestBody.put("redirect_uris", redirectUris);
        requestBody.put("post_logout_redirect_uris", postLogoutRedirectUris);
        return requestBody;
    }

    /**
     * 令牌内省可获取user_id等信息
     * @param token
     * @param scope
     * @return
     * @throws Exception
     */
    public IntrospectInfo getIntrospectInfoByToken(String url, String token, String scope) throws Exception {
        MultiValueMap<String, Object> params = new LinkedMultiValueMap<>();
        params.add("token", token);
        //params.add("scope", scope);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-type", "application/x-www-form-urlencoded"); // 增加自定义Header
        headers.add("Accept", "application/json"); // 增加自定义Header
        RestTemplate restTemplate = HttpsUtil.getRestTemplate();
        HttpEntity<MultiValueMap<String, Object>> httpEntity = new HttpEntity<MultiValueMap<String, Object>>(params,headers);
        IntrospectInfo introspectInfo = restTemplate.exchange(url, HttpMethod.POST, httpEntity, IntrospectInfo.class).getBody();
        return introspectInfo;
    }

    /**
     * 通过用户名密码登录，获取token
     */
    public AuthTokenInfo login(String url, String account, String password, String clientId, String clientSecret) {
        log.info("login params url:{} account:{} password:{} clientId:{} clientSecret:{}", url, account, password, clientId, clientSecret);
        AuthTokenInfo authTokenInfo = null;
        try {
            JSONObject requestBody = new JSONObject();
            requestBody.put("account", account);
            requestBody.put("password", RSAUtil.encryptWithRSAPublicKey(password));
            RestTemplate restTemplate = HttpsUtil.getRestTemplateAndSetBaisAuth(clientId, clientSecret);
            HttpEntity<Object> entity = new HttpEntity<>(requestBody);
            ResponseEntity<AuthTokenInfo> responseEntity = restTemplate.postForEntity(url,
                    entity,
                    AuthTokenInfo.class);
            authTokenInfo = responseEntity.getBody();
            authTokenInfo.setStatusCode(responseEntity.getStatusCodeValue());
            log.info("username:{} token:{}", account, authTokenInfo);
            return authTokenInfo;
        } catch (HttpClientErrorException e) {
            log.warn(e.getMessage());
            authTokenInfo = new AuthTokenInfo();
            authTokenInfo.setStatusCode(e.getStatusCode().value());
            authTokenInfo.setErrorMsg(e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        if (authTokenInfo != null && StringUtils.isNotEmpty(authTokenInfo.getAccessToken()) && !authTokenInfo.getAccessToken().startsWith("Bearer ")) {
            authTokenInfo.setAccessToken("Bearer " + authTokenInfo.getAccessToken());
        }
        return authTokenInfo;
    }

    /**
     * 通过clientId和clientSecret获取token
     * @param url
     * @param clientId
     * @param clientSecret
     * @return
     */
    public AuthTokenInfo login(String url, String clientId, String clientSecret) {
        AuthTokenInfo authTokenInfo = null;
        try {
            MultiValueMap<String, String> paramsMap = new LinkedMultiValueMap<>();
            paramsMap.add("grant_type", "client_credentials");
            paramsMap.add("scope", "all");
            RestTemplate restTemplate = HttpsUtil.getRestTemplateAndSetBaisAuth(clientId, clientSecret);
            RequestEntity requestEntity = RequestEntity.post("")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.ALL)
                    .acceptCharset(StandardCharsets.UTF_8)
                    .body(paramsMap);
            ResponseEntity<AuthTokenInfo> responseEntity = restTemplate.postForEntity(url,
                    requestEntity,
                    AuthTokenInfo.class);
            authTokenInfo = responseEntity.getBody();
            authTokenInfo.setStatusCode(responseEntity.getStatusCodeValue());
            log.info("clientId token:{}", authTokenInfo);
            return authTokenInfo;
        } catch (HttpClientErrorException e) {
            log.warn(e.getMessage());
            authTokenInfo = new AuthTokenInfo();
            authTokenInfo.setStatusCode(e.getStatusCode().value());
            authTokenInfo.setErrorMsg(e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        if (authTokenInfo != null && StringUtils.isNotEmpty(authTokenInfo.getAccessToken()) && !authTokenInfo.getAccessToken().startsWith("Bearer ")) {
            authTokenInfo.setAccessToken("Bearer " + authTokenInfo.getAccessToken());
        }
        return authTokenInfo;
    }

    public RowColumnRuleVo getRowColumnRule(String url, String tableName, String userId, String action, String token) {
        RowColumnRuleVo rowColumnRuleVo = null;
        HttpHeaders headers = new HttpHeaders();
        try {
            headers.set("Authorization", token);
            RestTemplate restTemplate = HttpsUtil.getRestTemplate();
            HttpEntity<MultiValueMap<String, Object>> httpEntity = new HttpEntity<>(headers);
            String realUrl = url + "?logic_view_name=" + tableName.replaceAll("\"", "");
            if (StringUtils.isNotEmpty(userId)) {
                realUrl += "&user_id=" + userId;
            }
            if (StringUtils.isNotEmpty(action)) {
                realUrl += "&action=" + action;
            }

            ResponseEntity<RowColumnRuleVo> responseEntity = restTemplate.exchange(realUrl, HttpMethod.GET, httpEntity, RowColumnRuleVo.class);
            rowColumnRuleVo = responseEntity.getBody();
            rowColumnRuleVo.setStatusCode(200);
            if (rowColumnRuleVo.getEntries() != null) {
                for (RowColumnRuleVo.Entry en : rowColumnRuleVo.getEntries()) {
                    if (en.getColumns() != null) {
                        for (int i = 0; i < en.getColumns().size(); i++) {
                            en.getColumns().set(i, en.getColumns().get(i).toLowerCase());
                        }
                    }
                }
            }
            return rowColumnRuleVo;
        } catch (Exception e) {
            log.warn(e.getMessage());
            rowColumnRuleVo = new RowColumnRuleVo();
            if (e instanceof HttpClientErrorException) {
                rowColumnRuleVo.setStatusCode(((HttpClientErrorException) e).getStatusCode().value());
            } else {
                rowColumnRuleVo.setStatusCode(400);
            }
            rowColumnRuleVo.setMessage(e.getMessage());
            return rowColumnRuleVo;
        }
    }
}
