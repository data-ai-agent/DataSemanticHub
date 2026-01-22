package com.eisoo.dc.gateway.controller;

import com.eisoo.dc.gateway.domain.dto.ViewDto;
import com.eisoo.dc.gateway.service.GatewayViewService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;


/**
 * @Author zdh
 **/
@Api(tags = "视图管理")
@RestController
@RequestMapping({"/api/data-connection/v1/gateway/view", "/api/internal/data-connection/v1/gateway/view"})
public class ViewManagerController {

    @Autowired(required = false)
    private GatewayViewService gatewayViewService;


    @ApiOperation(value = "新增视图", notes = "新增视图接口")
    @PostMapping("/create")
    public ResponseEntity<?> create(
            @Validated @RequestBody ViewDto viewDto,
            @RequestHeader(name = "X-Presto-User", required = false) String user) {
        return gatewayViewService.createView(viewDto, user, false);
    }

    @ApiOperation(value = "查询视图", notes = "查询视图接口")
    @GetMapping
    public ResponseEntity<?> viewList(
            @RequestParam(value = "pageNum", required = false) Long pageNum,
            @RequestParam(value = "pageSize", required = false) Long pageSize,
            @RequestParam(value = "catalogName", required = false) String catalogName,
            @RequestParam(value = "schemaName", required = false) String schemaName,
            @RequestParam(value = "viewName", required = false) String viewName) {
        return gatewayViewService.viewList(pageNum, pageSize,catalogName,schemaName,viewName);
    }

    @ApiOperation(value = "修改视图", notes = "修改视图接口")
    @PostMapping("/replace")
    public ResponseEntity<?> updateCatalog(
            @Validated @RequestBody ViewDto viewDto,
            @RequestHeader(name = "X-Presto-User", required = false) String user) {
        return gatewayViewService.replaceView(viewDto, user);
    }

    @ApiOperation(value = "删除视图", notes = "删除视图接口")
    @PostMapping("/delete")
    public ResponseEntity<?> deleteCatalog(
            @Validated @RequestBody ViewDto viewDto,
            @RequestHeader(name = "X-Presto-User", required = false) String user) {
        return gatewayViewService.deleteView(viewDto, user, false);
    }
}
