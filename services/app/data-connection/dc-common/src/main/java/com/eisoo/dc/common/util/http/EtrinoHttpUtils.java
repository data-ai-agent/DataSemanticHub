package com.eisoo.dc.common.util.http;

import cn.hutool.core.lang.Validator;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import cn.hutool.http.Method;
import com.eisoo.dc.common.constant.Constants;
import com.eisoo.dc.common.constant.Detail;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.vo.HttpResInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;

@Component
public class EtrinoHttpUtils {
    private static final Logger log = LoggerFactory.getLogger(EtrinoHttpUtils.class);

    //重试次数
    private static final int MAX_RETRIES = 1;

    //超时时间
    private static int connectTimeout;
    private static int readTimeout;

    @Value("${http.client.connect-timeout}")
    public void setConnectTimeout(int connectTimeout) {
        EtrinoHttpUtils.connectTimeout = connectTimeout;
    }

    @Value("${http.client.read-timeout}")
    public void setReadTimeout(int readTimeout) {
        EtrinoHttpUtils.readTimeout = readTimeout;
    }




    /**
     * 向指定 URL 发送POST方法的请求
     *
     * @param url   发送请求的 URL
     * @param param 请求参数，请求参数key,value形式。
     * @return 所代表远程资源的响应结果
     */
    public static HttpResInfo sendPost(String url, HashMap param, String user) {
        if (!Validator.isUrl(url)) {
            log.error("调用HttpOpenUtils.sendPost url error=" + url);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, String.format(Detail.URL_ERROR, url));
        }
        HttpResponse execute = null;
        for (int retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
            try {
                execute = HttpUtil.createRequest(Method.POST, url)
                        .setConnectionTimeout(connectTimeout)
                        .setReadTimeout(readTimeout)
                        .header("X-Presto-User", user)
                        .header("Content-Type", "multipart/form-data")
                        .removeHeader("Content-Encoding")
                        .formStr(param)
                        .execute();
                break;
            } catch (Exception e) {
                log.error("调用HttpOpenUtils.sendPost Exception, url=" + url, e);
                if (retryCount == MAX_RETRIES - 1) {
                    throw e;
                }
            }
        }
        execute.close();
        return new HttpResInfo(execute.getStatus(), execute.body());
    }

    /**
     * 向指定 URL 发送POST方法的请求
     *
     * @param url  发送请求的 URL
     * @param body 请求参数
     * @return 所代表远程资源的响应结果
     */
    public static HttpResInfo sendPostWithBody(String url, String body, String user) {
        if (!Validator.isUrl(url)) {
            log.error("调用HttpOpenUtils.sendPost url error=" + url);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, String.format(Detail.URL_ERROR, url));
        }
        HttpResponse execute = null;
        for (int retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
            try {
                execute = HttpUtil.createRequest(Method.POST, url)
                        .setConnectionTimeout(connectTimeout)
                        .setReadTimeout(1000 * 60 * 30)
                        .header("X-Presto-User", user)
                        .header("Content-Type", "text/plain")
                        .body(body)
                        .execute();
                break;
            } catch (Exception e) {
                log.error("调用HttpOpenUtils.sendPostWithBody Exception, url=" + url, e);
                if (retryCount == MAX_RETRIES - 1) {
                    throw e;
                }
            }
        }
        execute.close();
        return new HttpResInfo(execute.getStatus(), execute.body());
    }


    /**
     * 向指定 URL 发送PUT方法的请求
     *
     * @param url   发送请求的 URL
     * @param param 请求参数，请求参数key,value形式。
     * @return 所代表远程资源的响应结果
     */
    public static HttpResInfo sendPut(String url, HashMap param, String user) {
        if (!Validator.isUrl(url)) {
            log.error("调用HttpOpenUtils.sendPut url error=" + url);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, String.format(Detail.URL_ERROR, url));
        }
        HttpResponse execute = null;
        for (int retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
            try {
                execute = HttpUtil.createRequest(Method.PUT, url)
                        .setConnectionTimeout(connectTimeout)
                        .setReadTimeout(readTimeout)
                        .header("X-Presto-User", user)
                        .header("Content-Type", "multipart/form-data")
                        .removeHeader("Content-Encoding")
                        .formStr(param)
                        .execute();
                break;
            } catch (Exception e) {
                log.error("调用HttpOpenUtils.sendPut Exception, url=" + url, e);
                if (retryCount == MAX_RETRIES - 1) {
                    throw e;
                }
            }
        }
        execute.close();
        return new HttpResInfo(execute.getStatus(), execute.body());
    }

    /**
     * 向指定 URL 发送GET方法的请求
     *
     * @param url  发送请求的 URL
     * @param user 用户
     * @return 所代表远程资源的响应结果
     */
    public static HttpResInfo sendGet(String url, String user) {
        if (!Validator.isUrl(url)) {
            log.error("调用HttpOpenUtils.sendGet url error=" + url);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, String.format(Detail.URL_ERROR, url));
        }
        HttpResponse execute = null;
        for (int retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
            try {
                execute = HttpUtil.createRequest(Method.GET, url)
                        .charset(Constants.UTF8)
                        .setConnectionTimeout(connectTimeout)
                        .setReadTimeout(1000 * 60 * 30)
                        .header("X-Presto-User", user)
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .removeHeader("Content-Encoding")
                        .removeHeader("Accept-Encoding")
                        .execute();
                break;
            } catch (Exception e) {
                log.error("调用HttpOpenUtils.sendGet Exception, url=" + url, e);
                if (retryCount == MAX_RETRIES - 1) {
                    throw e;
                }
            }
        }
        execute.close();
        return new HttpResInfo(execute.getStatus(), execute.body());
    }

    /**
     * 向指定 URL 发送Delete方法的请求
     *
     * @param url  发送请求的 URL
     * @param user 用户
     * @return 所代表远程资源的响应结果
     */
    public static HttpResInfo sendDelete(String url, String user) {
        if (!Validator.isUrl(url)) {
            log.error("调用HttpOpenUtils.sendDelete url error=" + url);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, String.format(Detail.URL_ERROR, url));
        }
        HttpResponse execute = null;
        for (int retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
            try {
                execute = HttpUtil.createRequest(Method.DELETE, url)
                        .charset(Constants.UTF8)
                        .setConnectionTimeout(connectTimeout)
                        .setReadTimeout(readTimeout)
                        .header("X-Presto-User", user)
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .removeHeader("Content-Encoding")
                        .removeHeader("Accept-Encoding")
                        .execute();
                break;
            } catch (Exception e) {
                log.error("调用HttpOpenUtils.sendDelete Exception, url=" + url, e);
                if (retryCount == MAX_RETRIES - 1) {
                    throw e;
                }
            }
        }
        execute.close();
        return new HttpResInfo(execute.getStatus(), execute.body());
    }
}
