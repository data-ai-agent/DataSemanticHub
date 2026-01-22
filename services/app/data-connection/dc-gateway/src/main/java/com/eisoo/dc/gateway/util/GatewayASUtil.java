package com.eisoo.dc.gateway.util;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.constant.Description;
import com.eisoo.dc.common.constant.Message;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.gateway.common.Detail;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.Credentials;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.ssl.SSLContexts;
import org.apache.http.ssl.TrustStrategy;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.net.ssl.SSLContext;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Component
public class GatewayASUtil {
    private static final Logger log = LoggerFactory.getLogger(GatewayASUtil.class);

    public static InputStream getInputStream(String url, String token, String docid) throws Exception {

        JSONObject json = getOsdDownloadUrl(url, token, docid);
        JSONArray array = json.getJSONArray("authrequest");

        String downloadUrl = array.getString(1);
        String authorization = array.getString(2).split(": ")[1];
        String dateName = null;
        String dateValue = null;
        for (int i = 0; i < array.size(); i++) {
            if (array.getString(i).toLowerCase().contains("x-amz-date")
                    || array.getString(i).toLowerCase().contains("x-obs-date")) {
                dateName = array.getString(i).split(": ")[0];
                dateValue= array.getString(i).split(": ")[1];
            }
        }
        return downloadFile(downloadUrl, authorization, dateName, dateValue);
    }

    public static InputStream downloadFile(String url, String authorization, String dateName, String dateValue) throws Exception {
        CloseableHttpClient httpClient = getHttpClient();

        HttpGet httpGet = new HttpGet(url);
        httpGet.addHeader("Authorization", authorization);
        httpGet.addHeader(dateName, dateValue);
        log.info("excel downloadFile url:{}, authorization:{}, dateName:{}, dateValue:{}", url, authorization, dateName, dateValue);

        HttpResponse response = httpClient.execute(httpGet);

        log.info("excel downloadFile:{}", response.getStatusLine());

        return response.getEntity().getContent();
    }

    public static JSONObject getOsdDownloadUrl(String url, String token, String docid) throws Exception {
        CloseableHttpClient httpClient = getHttpClient();

        HttpPost httpPost = new HttpPost(url + "/api/efast/v1/file/osdownload");
        httpPost.addHeader("Content-Type", "application/json");
        httpPost.addHeader("Authorization", token);

        JSONObject body = new JSONObject();
        body.put("docid", docid);
        StringEntity httpEntity = new StringEntity(body.toString());
        httpEntity.setContentType("application/json");
        httpPost.setEntity(httpEntity);

        HttpResponse response = httpClient.execute(httpPost);
        JSONObject json = JSON.parseObject(EntityUtils.toString(response.getEntity()));

        return json;
    }

    public static JSONObject loadDir(String url, String token, String docid) {
        try {
            CloseableHttpClient httpClient = getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/efast/v1/dir/list");
            httpPost.addHeader("Content-Type", "application/json");
            httpPost.addHeader("Authorization", token);

            JSONObject body = new JSONObject();
            body.put("docid", docid);
            StringEntity httpEntity = new StringEntity(body.toString());
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            HttpResponse response = httpClient.execute(httpPost);
            JSONObject json = JSON.parseObject(EntityUtils.toString(response.getEntity()));
            log.info("excel loadDir:{}", json.toJSONString());

            if (json.containsKey("message")) {
                String message = json.getString("message");
                if (message.contains("权限")) {
                    throw new AiShuException(ErrorCodeEnum.ForbiddenError,
                            Description.DOC_LIB_PERMISSION_ERROR,
                            json.toJSONString(),
                            Message.MESSAGE_RESOURCE_AUTHORIZATION_SOLUTION);
                }
                throw new AiShuException(ErrorCodeEnum.InternalServerError, json.toJSONString());
            }

            return json;
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.DS_DOC_DIR_ERROR, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
        }
    }

    public static String getItemPath(String url, String token, String docid) {
        try {
            CloseableHttpClient httpClient = getHttpClient();
            // 对docid中的斜杠进行URL编码
            String encodedDocid = docid.replace("/", "%2F");
            HttpGet httpGet = new HttpGet(url + "/api/efast/v1/items/"+encodedDocid+"/path");
            httpGet.addHeader("Authorization", token);

            HttpResponse response = httpClient.execute(httpGet);
            JSONObject json = JSON.parseObject(EntityUtils.toString(response.getEntity()));
            log.info("excel getItemPath:{}", json.toJSONString());

            if (json.containsKey("message")) {
                String message = json.getString("message");
                if (message.contains("权限")) {
                    throw new AiShuException(ErrorCodeEnum.ForbiddenError,
                            Description.DOC_LIB_PERMISSION_ERROR,
                            json.toJSONString(),
                            Message.MESSAGE_RESOURCE_AUTHORIZATION_SOLUTION);
                }
                throw new AiShuException(ErrorCodeEnum.InternalServerError, json.toJSONString());
            }

            return json.getString("path");
        } catch (AiShuException e) {
            throw e;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.DS_DOC_DIR_ERROR, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
        }
    }

    public static String getDocid(String url, String token, String path) {
        try {
            CloseableHttpClient httpClient = getHttpClient();
            HttpPost httpPost = new HttpPost(url + "/api/efast/v1/file/getinfobypath");
            httpPost.addHeader("Content-Type", "application/json");
            httpPost.addHeader("Authorization", token);

            JSONObject body = new JSONObject();
            body.put("namepath", path);
            StringEntity httpEntity = new StringEntity(body.toString(), "UTF-8");
            httpEntity.setContentType("application/json");
            httpPost.setEntity(httpEntity);

            HttpResponse response = httpClient.execute(httpPost);
            JSONObject json = JSON.parseObject(EntityUtils.toString(response.getEntity()));
            log.info("excel getDocid:{}", json.toJSONString());

            if (json.containsKey("message")) {
                String message = json.getString("message");
                if (message.contains("权限")) {
                    throw new AiShuException(ErrorCodeEnum.ForbiddenError,
                            Description.DOC_LIB_PERMISSION_ERROR,
                            json.toJSONString(),
                            Message.MESSAGE_RESOURCE_AUTHORIZATION_SOLUTION);
                }
                throw new AiShuException(ErrorCodeEnum.InternalServerError, json.toJSONString());
            }

            return json.getString("docid");
        } catch (IOException e) {
            log.error("excel getDocid Error");
            throw new AiShuException(ErrorCodeEnum.InternalServerError, e.getMessage());
        }
    }

    public static String getToken(String host, String port, String username, String password) {
        try {
            CloseableHttpClient httpClient = getHttpClient();

            HttpPost httpPost = new HttpPost("https://" + host + ":" + port + "/oauth2/token");
            httpPost.addHeader("Content-Type", "application/x-www-form-urlencoded");
            httpPost.addHeader("Authorization", "Basic " + Base64.getEncoder().encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8)));

            List<NameValuePair> params = new ArrayList<>();
            params.add(new BasicNameValuePair("grant_type","client_credentials"));
            params.add(new BasicNameValuePair("scope","all"));
            UrlEncodedFormEntity httpEntity = new UrlEncodedFormEntity(params, StandardCharsets.UTF_8);
            httpPost.setEntity(httpEntity);

            HttpResponse response = httpClient.execute(httpPost, createBasicAuthContext(host, port, username, password));
            JSONObject json = JSON.parseObject(EntityUtils.toString(response.getEntity()));

            if (json.containsKey("error")) {
                log.error("用户名或密码错误{}:{}", username, com.eisoo.dc.common.util.RSAUtil.encrypt(password));
                throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.USERNAME_OR_PASSWORD_ERROR);
            }

            String token = "Bearer " + json.getString("access_token");
            log.debug("excel token:{}", token);
            return token;
        } catch (IOException e) {
            log.error("excel getToken Error");
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Detail.ANYSHARE_TOKEN_ERROR);
        }
    }

    public static CloseableHttpClient getHttpClient() {
        try {
            SSLContext sslContext = SSLContexts.custom().loadTrustMaterial(null, new TrustStrategy() {
                @Override
                public boolean isTrusted(X509Certificate[] x509Certificates, String s) throws CertificateException {
                    return true;
                }
            }).build();

            CloseableHttpClient httpClient = HttpClients.custom().setSSLContext(sslContext).setSSLHostnameVerifier(new NoopHostnameVerifier()).build();
            return httpClient;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, e.getMessage());
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
