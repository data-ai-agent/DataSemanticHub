package com.eisoo.dc.gateway.service.impl;

import cn.hutool.core.date.StopWatch;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.eisoo.dc.common.driven.service.ServiceEndpoints;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.metadata.mapper.*;
import com.eisoo.dc.gateway.common.CatalogConstant;
import com.eisoo.dc.gateway.common.Detail;
import com.eisoo.dc.gateway.common.Message;
import com.eisoo.dc.gateway.common.QueryConstant;
import com.eisoo.dc.gateway.domain.dto.CatalogDto;
import com.eisoo.dc.gateway.domain.dto.SchemaDto;
import com.eisoo.dc.gateway.domain.vo.HttpResInfo;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.gateway.service.GatewayCatalogService;
import com.eisoo.dc.gateway.service.SchemaService;
import com.eisoo.dc.gateway.service.GatewayViewService;
import com.eisoo.dc.gateway.util.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * @Author zdh
 **/
@Service
public class GatewayCatalogServiceImpl implements GatewayCatalogService {
    private static final Logger log = LoggerFactory.getLogger(GatewayCatalogServiceImpl.class);

    @Autowired(required = false)
    SchemaService schemaService;

    @Autowired(required = false)
    GatewayViewService gatewayViewService;

    @Autowired(required = false)
    ExcelUtil excelUtil;

    @Autowired(required = false)
    GatewayASUtil gatewayAsUtil;

    @Autowired
    private ServiceEndpoints serviceEndpoints;

    @Autowired(required = false)
    TblsMapper tblsMapper;

    @Autowired(required = false)
    CatalogRuleMapper catalogRuleMapper;

    @Autowired(required = false)
    VegaDatasourceMapper vegaDatasourceMapper;

    @Autowired(required = false)
    DataSourceMapper metadataDataSourceMapper;

    @Autowired(required = false)
    DictMapper metadataDictMapper;

    @Override
    public ResponseEntity<?> create(CatalogDto params) {
        CheckUtil.catalogCheck(params.getCatalogName(), params.getConnectorName());

        if (StringUtils.equalsIgnoreCase(params.getCatalogName(), CatalogConstant.OLK_VIEW_VDM) && !StringUtils.equalsIgnoreCase(params.getConnectorName(), "vdm")) {
            log.error("与内置视图源名称冲突：{}", params.getCatalogName());
            throw new AiShuException(ErrorCodeEnum.InvalidParameter, Detail.BUILT_IN_CATALOG_CONFLICT);
        }

        String catalogNameList = getCatalogNameList(serviceEndpoints.getVegaCalculateCoordinator());
        ObjectMapper mapper = new ObjectMapper();
        List<String> result;
        try {
            result = mapper.readValue(catalogNameList, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.error(e.getMessage());
            throw new AiShuException(ErrorCodeEnum.InternalError, e.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
        }
        if (result.contains(params.getCatalogName())) {
            log.error("数据源已存在catalogName:{}", params.getCatalogName());
            throw new AiShuException(ErrorCodeEnum.CatalogExist, params.getCatalogName(), Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }

        if (params.getConnectorName().equals(CatalogConstant.VDM_CATALOG)) {
            return vdmCreate(serviceEndpoints.getVegaCalculateCoordinator(), params);
        }
        return null;
    }


    private ResponseEntity<?> vdmCreate(String openlookengUrl, CatalogDto catalogDto) {
        postCatalogInfo(openlookengUrl, catalogDto);
        try{
            createSchema(catalogDto);
        }catch(Exception e){
            deleteCatalogInfo(openlookengUrl, catalogDto.getCatalogName());
            log.info("catalogName:{},新增数据源时数据库同步失败，并删除数据源成功!", catalogDto.getCatalogName());
            throw new AiShuException(ErrorCodeEnum.InternalError,e.getMessage(), Message.MESSAGE_INTERNAL_ERROR);
        }
        log.info("数据源添加成功:{}", catalogDto.getCatalogName());
        JSONArray jsonArray = JSONUtil.createArray();
        JSONObject jsonObject = JSONUtil.createObj();
        jsonObject.set("name", catalogDto.getCatalogName() + "." + CatalogConstant.VIEW_DEFAULT_SCHEMA);
        jsonArray.add(jsonObject);
        return ResponseEntity.ok(jsonArray);
    }

    /**
     * 视图创建schema
     *
     * @param catalogDto
     */
    private void createSchema(CatalogDto catalogDto) {
        String createSchema = String.format("CREATE SCHEMA IF NOT EXISTS %s.%s", catalogDto.getCatalogName(), CatalogConstant.VIEW_DEFAULT_SCHEMA);
        SchemaDto schemaDto = new SchemaDto();
        schemaDto.setCatalogName(catalogDto.getCatalogName());
        schemaDto.setSchemaName(CatalogConstant.VIEW_DEFAULT_SCHEMA);
        schemaDto.setQuery(createSchema);
        log.info("创建视图源schema,catalogName:{},schema:{}", catalogDto.getCatalogName(), CatalogConstant.VIEW_DEFAULT_SCHEMA);
        ResponseEntity<?> responseEntity = schemaService.createSchema(schemaDto, "admin");
        if (responseEntity.getStatusCode().value() != 200) {
            log.error("View创建视图源schema失败,catalogName:{},schema:{}", catalogDto.getCatalogName(), CatalogConstant.VIEW_DEFAULT_SCHEMA);
            throw new AiShuException(ErrorCodeEnum.InternalError, Detail.BUILT_IN_SCHEMA_CREATE_ERROR, Message.MESSAGE_INTERNAL_ERROR);
        }
    }

    /**
     * 新增数据源post请求
     *
     * @param url
     * @param params
     */
    public void postCatalogInfo(String url, CatalogDto params) {
        String urlOpen = url + CatalogConstant.VIRTUAL_V1_CATALOG;
        String catalogInfo = JSONUtil.parseObj(params).toString();
        HashMap<String, String> catalogs = new HashMap<>();
        catalogs.put("catalogInformation", catalogInfo);
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        log.info("开始添加数据源:{},数据源类型:{}", params.getCatalogName(), params.getConnectorName());
        HttpResInfo result;
        try{
            result = HttpOpenUtils.sendPost(urlOpen, catalogs, QueryConstant.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError,e.getMessage(),Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        stopWatch.stop();

        if (result.getHttpStatus()>= HttpStatus.BAD_REQUEST){
            log.error("Http postCatalogInfo 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError,result.getResult(),Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.info("Http postCatalogInfo 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
    }

    /**
     * 删除数据源 DELETE
     *
     * @param url
     */
    public void deleteCatalogInfo(String url, String catalogName) {
        String urlOpen = url + CatalogConstant.VIRTUAL_V1_CATALOG + "/" + catalogName;
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        HttpResInfo result;
        try{
            result = HttpOpenUtils.sendDelete(urlOpen, QueryConstant.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError,e.getMessage(),Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        stopWatch.stop();

        if (result.getHttpStatus()>=HttpStatus.BAD_REQUEST){
            log.error("Http deleteCatalogInfo 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError,result.getResult(),Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.info("Http deleteCatalogInfo 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
    }

    /**
     * 查询数据源名称列表GET请求
     *
     * @param url
     * @return
     */
    public String getCatalogNameList(String url) {
        String urlOpen = url + CatalogConstant.VIRTUAL_V1_CATALOG;
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        HttpResInfo result;
        try{
            result = HttpOpenUtils.sendGet(urlOpen, QueryConstant.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError,e.getMessage(),Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        stopWatch.stop();

        if (result.getHttpStatus()>=HttpStatus.BAD_REQUEST){
            log.error("Http getCatalogNameList 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError,result.getResult(),Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.info("Http getCatalogNameList 请求成功: httpStatus={}, result={}, 耗时={}ms",
                result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
        return result.getResult();
    }

    @Override
    public String showCatalogInfo(String catalogName) {

        String urlOpen = serviceEndpoints.getVegaCalculateCoordinator() + CatalogConstant.VIRTUAL_V1_SHOW_CATALOG+"/"+catalogName;
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        HttpResInfo result;
        try{
            result = HttpOpenUtils.sendGet(urlOpen, QueryConstant.DEFAULT_AD_HOC_USER);
        }catch (AiShuException e){
            throw e;
        }catch (Exception e){
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError,e.getMessage(),Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        stopWatch.stop();

        if (result.getHttpStatus()>=HttpStatus.BAD_REQUEST){
            log.error("Http showCatalogInfo 请求失败: httpStatus={}, result={}, 耗时={}ms",
                    result.getHttpStatus(), result.getResult(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
            throw new AiShuException(ErrorCodeEnum.OpenLooKengError,result.getResult(),Message.MESSAGE_OPENLOOKENG_ERROR);
        }
        log.info("Http showCatalogInfo 请求成功: httpStatus={}, 耗时={}ms",
                result.getHttpStatus(), stopWatch.getTotal(TimeUnit.MILLISECONDS));
        return result.getResult();
    }


}
