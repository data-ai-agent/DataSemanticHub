package com.eisoo.dc.common.driven;

import cn.hutool.core.date.StopWatch;
import cn.hutool.json.JSONUtil;
import com.eisoo.dc.common.constant.Constants;
import com.eisoo.dc.common.constant.Description;
import com.eisoo.dc.common.constant.Message;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.util.http.EtrinoHttpUtils;
import com.eisoo.dc.common.vo.CatalogDto;
import com.eisoo.dc.common.vo.HttpResInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class Calculate {
    private static final Logger log = LoggerFactory.getLogger(Calculate.class);

    /**
     * 新增数据源post请求
     */
    public static void createCatalog(String url, CatalogDto params) {
        String urlOpen = url + "/v1/catalog";
        String catalogInfo = JSONUtil.parseObj(params).toString();
        HashMap<String, String> catalogs = new HashMap<>();
        catalogs.put("catalogInformation", catalogInfo);
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        log.info("开始添加数据源:{},数据源类型:{}", params.getCatalogName(), params.getConnectorName());
        HttpResInfo result;
        try{
            result = EtrinoHttpUtils.sendPost(urlOpen, catalogs, Constants.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.CalculateError, e.getMessage());
        }
        stopWatch.stop();

        if (result.getHttpStatus()>= HttpStatus.BAD_REQUEST.value()){
            log.error("Http createCatalog 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.CalculateError, result.getResult());
        }
        log.info("Http createCatalog 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
    }

    /**
     * 更新数据源 PUT请求
     */
    public static void updateCatalog(String url, CatalogDto params) {
        String urlOpen = url + "/v1/catalog";
        HashMap<String, String> catalogs = new HashMap<>();
        String catalogInfo = JSONUtil.parseObj(params).toString();
        catalogs.put("catalogInformation", catalogInfo);
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        log.info("开始更新数据源:{},数据源类型:{}", params.getCatalogName(), params.getConnectorName());
        HttpResInfo result;
        try{
            result = EtrinoHttpUtils.sendPut(urlOpen, catalogs, Constants.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.CalculateError,e.getMessage());
        }
        stopWatch.stop();

        if (result.getHttpStatus()>=HttpStatus.BAD_REQUEST.value()){
            log.error("Http updateCatalog 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.CalculateError, result.getResult());
        }
        log.info("Http updateCatalog 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
    }

    /**
     * 删除数据源 DELETE
     */
    public static void deleteCatalog(String url, String catalogName) {
        String urlOpen = url + "/v1/catalog/" + catalogName;
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        HttpResInfo result;
        try{
            result = EtrinoHttpUtils.sendDelete(urlOpen, Constants.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.CalculateError,e.getMessage());
        }
        stopWatch.stop();

        if (result.getHttpStatus()>=HttpStatus.BAD_REQUEST.value()){
            log.error("Http deleteCatalog 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.CalculateError, result.getResult());
        }
        log.info("Http deleteCatalog 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
    }

    /**
     * 查询数据源名称列表GET请求
     */
    public static List<String> getCatalogNameList(String url) {
        String urlOpen = url + "/v1/catalog";
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        HttpResInfo result;
        try{
            result = EtrinoHttpUtils.sendGet(urlOpen, Constants.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.CalculateError,e.getMessage());
        }
        stopWatch.stop();

        if (result.getHttpStatus()>=HttpStatus.BAD_REQUEST.value()){
            log.error("Http getCatalogNameList 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.CalculateError, result.getResult());
        }
        log.info("Http getCatalogNameList 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));

        ObjectMapper mapper = new ObjectMapper();
        List<String> catalogNameList;
        try {
            catalogNameList = mapper.readValue(result.getResult(), new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.error(e.getMessage());
            throw new AiShuException(ErrorCodeEnum.InternalServerError, e.getMessage());
        }
        return catalogNameList;
    }

    /**
     * 测试数据源
     */
    public static void testCatalog(String url, CatalogDto params, String schemaName) {
        String urlOpen = url + "/v1/catalog/test";
        String catalogInfo = JSONUtil.parseObj(params).toString();
        HashMap<String, String> catalogs = new HashMap<>();
        catalogs.put("catalogInformation", catalogInfo);
        catalogs.put("schema", schemaName);
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        log.info("开始测试数据源:{},数据源类型:{},schema:{}", params.getCatalogName(), params.getConnectorName(), schemaName);
        HttpResInfo result;
        try{
            result = EtrinoHttpUtils.sendPost(urlOpen, catalogs, Constants.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.CalculateError, e.getMessage());
        }
        stopWatch.stop();

        if (result.getHttpStatus()>= HttpStatus.BAD_REQUEST.value()){
            log.error("Http testCatalog 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.CONNECT_FAILED, parseErrorMessage(result.getResult()), Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
        log.info("Http testCatalog 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
    }

    /**
     * 解析错误信息，提取关键错误内容
     */
    private static String parseErrorMessage(String fullErrorMessage) {
        if (fullErrorMessage == null) {
            return "未知错误";
        }

        // 提取第一行错误信息
        String firstLine = fullErrorMessage.split("\n")[0].trim();

        // 如果是xxxException:，提取更友好的信息
        if (firstLine.contains("Exception:")) {
            int colonIndex = firstLine.indexOf(":");
            if (colonIndex > 0) {
                return firstLine.substring(colonIndex + 1).trim();
            }
        }


        return fullErrorMessage;
    }

}
