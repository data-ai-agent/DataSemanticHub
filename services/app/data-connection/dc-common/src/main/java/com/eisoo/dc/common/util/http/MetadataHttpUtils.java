package com.eisoo.dc.common.util.http;

import cn.hutool.core.date.StopWatch;
import cn.hutool.core.lang.Validator;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import cn.hutool.http.Method;
import com.eisoo.dc.common.config.MetaDataConfig;
import com.eisoo.dc.common.constant.Detail;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.vo.HttpResInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.concurrent.TimeUnit;

/**
 * @author Tian.lan
 */
@Slf4j
public class MetadataHttpUtils {
    private static int MAX_RETRIES = 1;
    //超时时间
    private static int connectTimeout = 3000;
    private static int readTimeout = 3000;
    public static String MESSAGE_FORMAT = "【请求meta-data 扫描数据源】 请求{}: httpStatus={}, result={}, 耗时={}ms";

    public static void sendMetaDataScan(MetaDataConfig metaDataConfig, String taskId, String token) throws Exception {
        String urlOpen = metaDataConfig.getScanUrl();
        urlOpen = String.format(urlOpen, taskId);
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        log.info("开始请求meta-data 扫描数据源:urlOpen:{}", urlOpen);
        HttpResInfo result;
        try {
            result = sendPostWithToken(urlOpen, null, token);
        } catch (Exception e) {
            log.error("【请求meta-data 扫描数据源】失败", e);
            throw new Exception(e);
        }
        stopWatch.stop();
        if (result.getHttpStatus() >= HttpStatus.BAD_REQUEST.value()) {
            log.error(MESSAGE_FORMAT,
                    "失败",
                    result.getHttpStatus(),
                    result.getResult(),
                    stopWatch.getTotal(TimeUnit.MILLISECONDS)
            );
            throw new Exception();
        }
        log.info(MESSAGE_FORMAT,
                "成功",
                result.getHttpStatus(),
                result.getResult(),
                stopWatch.getTotal(TimeUnit.MILLISECONDS)
        );
    }

    public static HttpResInfo sendPostWithToken(String url, HashMap param, String token) {
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
                        .header("Authorization", token)
                        .header("Content-Type", "multipart/form-data")
                        .removeHeader("Content-Encoding")
                        .formStr(param)
                        .execute();
                break;
            } catch (Exception e) {
                log.error("调用HttpOpenUtils.sendPost Exception, url=" + url + ",param=" + param.toString(), e);
                if (retryCount == MAX_RETRIES - 1) {
                    throw e;
                }
            }
        }
        execute.close();
        return new HttpResInfo(execute.getStatus(), execute.body());
    }
}
