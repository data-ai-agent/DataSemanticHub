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

public class IndexbaseHttpUtils {
    //重试次数
    private static final int MAX_RETRIES = 1;

    //超时时间
    private static int connectTimeout;
    private static int readTimeout;

    @Value("${http.client.connect-timeout}")
    public void setConnectTimeout(int connectTimeout) {
        IndexbaseHttpUtils.connectTimeout = connectTimeout;
    }

    @Value("${http.client.read-timeout}")
    public void setReadTimeout(int readTimeout) {
        IndexbaseHttpUtils.readTimeout = readTimeout;
    }
    private static final Logger log = LoggerFactory.getLogger(EtrinoHttpUtils.class);
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
}
