package com.eisoo.dc.gateway.util;

import com.eisoo.dc.gateway.common.QueryConstant;
import com.eisoo.dc.gateway.domain.vo.HttpResponseVo;
import org.apache.http.Header;
import org.apache.http.message.BasicHeader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * token 工具类
 *
 */
public class TokenUtil {

    private final static Logger logger = LoggerFactory.getLogger(TokenUtil.class);

    /**
     * 获取 http请求中的token
     */
    public static String getToken() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                .getRequest();
        return getToken(request);
    }


    public static String getToken(ServletRequest servletRequest) {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        return getToken(request);
    }

    public static String getToken(HttpServletRequest httpServletRequest) {
        String prefix = "Bearer";
        if (null == httpServletRequest) {
            return null;
        }
        String token = httpServletRequest.getHeader(QueryConstant.HTTP_HEADER_TOKEN_KEY);
        if (AiShuUtil.isNotEmpty(token)) {
            if (token.startsWith(prefix)) {
                return token.replace(prefix, "").trim();
            } else {
                return token;
            }
        }
        return null;
    }

    public static String getBearerToken(HttpServletRequest httpServletRequest) {
        if (null == httpServletRequest) {
            return null;
        }
        String token = httpServletRequest.getHeader(QueryConstant.HTTP_HEADER_TOKEN_KEY);
        if (AiShuUtil.isNotEmpty(token)) {
            return token;
        }
        return "";
    }


    /**
     * 校验token有效性
     *
     * @param tokenCheckUrl
     * @param token
     * @return
     */
    public static boolean checkTokenValid(String tokenCheckUrl, String token) {
        if (AiShuUtil.isEmpty(token)) {
            return false;
        }
        Map<String, String> params = new HashMap<>();
        params.put("token", token);
        try {
            HttpResponseVo responseVo = HttpUtil.httpPostFromData(tokenCheckUrl, params, null);
            if (null == responseVo) {
                return false;
            }
            String data = responseVo.getResult();
            if (AiShuUtil.isEmpty(data)) {
                return false;
            }
            Map<String, Object> dataMap = JsonUtil.json2Obj(data, Map.class);
            if (AiShuUtil.isNotEmpty(dataMap) && dataMap.containsKey("active")) {
                Boolean active = (Boolean) dataMap.get("active");
                if (active) {
                    return true;
                }
            }
        } catch (Exception e) {
            logger.error("请求令牌内省失败，url={}", tokenCheckUrl, e);
        }
        return false;
    }

    public static boolean checkRoleAccessControl(String url, String token, Map<String, String> params) {
        if (AiShuUtil.isEmpty(token)) {
            return false;
        }
        try {
            HttpResponseVo responseVo = HttpUtil.httpGet(url, params, createTokenHeader(token));
            if (responseVo.getCode() < 200 || responseVo.getCode() > 300) {
                return false;
            }
            String data = responseVo.getResult();
            if (AiShuUtil.isEmpty(data)) {
                return false;
            }

            if (data.trim().equalsIgnoreCase("true")) {
                return true;
            }

        } catch (Exception e) {
            logger.error("请求失败，url={}", url, e);
        }
        return false;
    }

    private static Header[] createTokenHeader(String token) {
        Header[] headers = new Header[]{new BasicHeader("Authorization", String.format("Bearer %s", token))};
        return headers;
    }
}
