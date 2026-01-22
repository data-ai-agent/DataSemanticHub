package com.eisoo.dc.common.util.http;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.constant.Constants;
import com.eisoo.dc.common.constant.Description;
import com.eisoo.dc.common.constant.Detail;
import com.eisoo.dc.common.constant.Message;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.CommonUtil;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.Credentials;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Component
public class ExcelHttpUtils {
    private static final Logger log = LoggerFactory.getLogger(ExcelHttpUtils.class);

    public static String getUrl(String protocol, String host, String port) {
        return protocol + "://" + host + ":" + port;
    }

    public static JSONObject loadDir(String url, String token, String docid) {
        try {
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/efast/v1/dir/list");
            httpPost.addHeader("Content-Type", "application/json");
            httpPost.addHeader(Constants.HEADER_TOKEN_KEY, token);

            JSONObject body = new JSONObject();
            body.put("docid", docid);
            StringEntity httpEntity = new StringEntity(body.toString());
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            HttpResponse response = httpClient.execute(httpPost);
            JSONObject json = JSON.parseObject(EntityUtils.toString(response.getEntity()));

            return json;
        } catch (Exception e) {
            log.error("excel loadDir Error, url:{}, token:{}, docid:{}", url, token, docid, e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, e.getMessage(), "请检查base参数:加载目录失败");
        }
    }

    public static String getDocid(String url, String token, String path) {
        try {
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/efast/v1/file/getinfobypath");
            httpPost.addHeader("Content-Type", "application/json");
            httpPost.addHeader(Constants.HEADER_TOKEN_KEY, token);

            JSONObject body = new JSONObject();
            body.put("namepath", path);
            StringEntity httpEntity = new StringEntity(body.toString(), "UTF-8");
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            HttpResponse response = httpClient.execute(httpPost);
            JSONObject json = JSON.parseObject(EntityUtils.toString(response.getEntity()));

            if (json.containsKey("message")) {
                String message = json.getString("message");
                if (message.contains("权限")) {
                    message = "无权操作请求的文件或目录";
                }
                throw new AiShuException(ErrorCodeEnum.BadRequest, json.getString("cause"), "请检查base参数:" + message);
            }

            return json.getString("docid");
        } catch (IOException e) {
            log.error("excel getDocid Error, url:{}, token:{}, path:{}", url, token, path, e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, e.getMessage());
        }
    }

    public static String getToken(String host, String port, String username, String password) {
        try {
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();

            HttpPost httpPost = new HttpPost("https://" + host + ":" + port + "/oauth2/token");
            httpPost.addHeader("Content-Type", "application/x-www-form-urlencoded");
            httpPost.addHeader(Constants.HEADER_TOKEN_KEY, "Basic " + Base64.getEncoder().encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8)));

            List<NameValuePair> params = new ArrayList<>();
            params.add(new BasicNameValuePair("grant_type","client_credentials"));
            params.add(new BasicNameValuePair("scope","all"));
            UrlEncodedFormEntity httpEntity = new UrlEncodedFormEntity(params, StandardCharsets.UTF_8);
            httpPost.setEntity(httpEntity);

            HttpResponse response = httpClient.execute(httpPost, createBasicAuthContext(host, port, username, password));
            JSONObject json = JSON.parseObject(EntityUtils.toString(response.getEntity()));

            if (json.containsKey("error")) {
                log.error("用户名或密码错误{}:{}", username, Base64.getEncoder().encodeToString(password.getBytes()));
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.USERNAME_OR_PASSWORD_ERROR);
            }

            return "Bearer " + json.getString("access_token");
        } catch (IOException e) {
            log.error("getToken Error, host:{}, port:{}, username:{}, password:{}", host, port, username, Base64.getEncoder().encodeToString(password.getBytes()), e);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.ANYSHARE_TOKEN_ERROR, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
        }
    }



    private static HttpClientContext createBasicAuthContext(String host, String port, String username, String password) {
        CredentialsProvider credsProvider = new BasicCredentialsProvider();
        Credentials defaultCreds = new UsernamePasswordCredentials(username, password);
        credsProvider.setCredentials(new AuthScope(host, Integer.parseInt(port)), defaultCreds);

        AuthCache authCache = new BasicAuthCache();
        BasicScheme basicAuth = new BasicScheme();
        authCache.put(new HttpHost(host, Integer.parseInt(port)), basicAuth);

        HttpClientContext context = HttpClientContext.create();
        context.setCredentialsProvider(credsProvider);
        context.setAuthCache(authCache);
        return context;
    }


}
