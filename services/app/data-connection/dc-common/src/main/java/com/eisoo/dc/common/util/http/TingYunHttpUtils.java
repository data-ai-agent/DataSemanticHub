package com.eisoo.dc.common.util.http;

import com.eisoo.dc.common.constant.Constants;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.CommonUtil;
import com.eisoo.dc.common.util.StringUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.util.EntityUtils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class TingYunHttpUtils {

    /**
     * 获取听云access_token
     */
    public static String getAccessToken(String protocol, String host, int port, String apiKey, String secretKey){
        try {
            // 1. 创建HTTP客户端和GET请求
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            long currentTime = System.currentTimeMillis();

            // 2. 构造URL和认证参数
            String authStr = String.format("api_key=%s&secret_key=%s&timestamp=%d", apiKey, secretKey, currentTime);
            String auth = md532Lower(authStr); // MD5工具方法
            String url = String.format("%s://%s:%d/auth-api/auth/token?api_key=%s&auth=%s&timestamp=%d", protocol, host, port, apiKey, auth, currentTime);

            // 3. 创建GET请求
            HttpGet httpGet = new HttpGet(url);
            httpGet.addHeader("Content-Type", "application/json");

            // 4. 执行请求
            HttpResponse response = httpClient.execute(httpGet);
            String responseBody = EntityUtils.toString(response.getEntity());

            // 5. 解析响应
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(responseBody);

            // 检查状态码
            if (root.path("code").asInt() != 200) {
                throw new Exception("API error: " + responseBody);
            }

            // 获取access_token
            String accessToken = root.path("access_token").asText();
            if (StringUtils.isBlank(accessToken)) {
                throw new Exception("Empty access token in response");
            }

            // 返回结果
            return accessToken;

        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, e.getMessage(), "获取听云访问令牌失败");
        }
    }

    /**
     * 对字符串进行32位小写MD5加密
     */
    public static String md532Lower(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            // 转换为16进制小写字符串
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 algorithm not available", e);
        }
    }

    /**
     * 使用听云access_token进行认证
     */
    public static void ping(String protocol, String host, int port, String accessToken) {

        try {
            // Construct URL
            String url = String.format("%s://%s:%d/server-api/action/trace?pageSize=0", protocol, host, port);

            // Create GET request
            HttpGet httpGet = new HttpGet(url);
            httpGet.addHeader(Constants.HEADER_TOKEN_KEY, "Bearer " + accessToken);
            httpGet.addHeader("Content-Type", "application/json");

            // Execute request
            CloseableHttpClient httpClient = CommonUtil.getHttpClient();
            try (CloseableHttpResponse response = httpClient.execute(httpGet)) {
                int statusCode = response.getStatusLine().getStatusCode();
                String responseBody = EntityUtils.toString(response.getEntity());

                if (statusCode != 200) {
                    throw new AiShuException(ErrorCodeEnum.BadRequest, responseBody, "听云访问令牌认证失败");
                }
            }
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, e.getMessage(), "听云访问令牌认证失败");
        }
    }
}
