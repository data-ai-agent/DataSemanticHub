package com.eisoo.dc.common.driven;

import com.eisoo.dc.common.vo.IntrospectInfo;
import org.apache.http.client.HttpClient;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContextBuilder;
import org.apache.http.impl.client.HttpClients;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

public class Hydra {

    /**
     * 令牌内省可获取user_id等信息
     * @param url
     * @param token
     * @param scope
     * @return
     * @throws Exception
     */
    public static IntrospectInfo getIntrospectInfoByToken(String url, String token, String scope) throws Exception {
        MultiValueMap<String, Object> params = new LinkedMultiValueMap<>();
        params.add("token", token);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-type", "application/x-www-form-urlencoded"); // 增加自定义Header
        headers.add("Accept", "application/json"); // 增加自定义Header
        RestTemplate restTemplate = getRestTemplate();
        HttpEntity<MultiValueMap<String, Object>> httpEntity = new HttpEntity<MultiValueMap<String, Object>>(params,headers);
        IntrospectInfo introspectInfo = restTemplate.exchange(url + "/admin/oauth2/introspect", HttpMethod.POST, httpEntity, IntrospectInfo.class).getBody();
        return introspectInfo;
    }

    public static RestTemplate getRestTemplate() throws Exception {
        SSLConnectionSocketFactory socketFactory = new SSLConnectionSocketFactory(
                new SSLContextBuilder().loadTrustMaterial(null, (chain, authType) -> true).build(),
                NoopHostnameVerifier.INSTANCE);

        HttpClient httpClient = HttpClients.custom().setSSLSocketFactory(socketFactory).build();
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);

        RestTemplate restTemplate = new RestTemplate(factory);
        return restTemplate;
    }
}
