package com.eisoo.dc.metadata.controller;

import com.eisoo.dc.metadata.domain.dto.TypeMappingDto;
import com.eisoo.dc.metadata.service.ConnectorService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.Pattern;

/**
 * @Author zdh
 **/
@Api(tags = "快速适配数据源")
@RestController
@Validated
@RequestMapping({"/api/data-connection/v1/metadata/connectors","/api/internal/data-connection/v1/metadata/connectors"})
public class ConnectorController {

    @Autowired(required = false)
    private ConnectorService connectorService;

    @ApiOperation(value = "查询对应数据源配置项", notes = "查询对应数据源配置项接口")
    @GetMapping("/config/{connectorName}")
    public ResponseEntity<?> connectorConfig(@Validated @PathVariable("connectorName")
                                                 @Pattern(regexp = "oracle|postgresql|doris|sqlserver|hive|clickhouse|mysql|maria|mongodb|dameng|hologres|gaussdb|excel|opengauss|inceptor-jdbc|maxcompute|opensearch", message = "支持传参：oracle, postgresql, doris, sqlserver, hive, clickhouse, mysql, maria, mongodb, dameng, hologres, gaussdb, excel, opengauss, inceptor-jdbc, maxcompute, opensearch")
                                                 String connectorName) {
        return connectorService.getConnectorConfig(connectorName);
    }

    @ApiOperation(value = "跨数据源类型映射", notes = "跨数据源类型映射接口")
    @PostMapping("/type/mapping")
    public ResponseEntity<?> connectorMapping(@Validated @RequestBody TypeMappingDto mappingDto) {
        return connectorService.getConnectorsMapping(mappingDto);
    }

}
