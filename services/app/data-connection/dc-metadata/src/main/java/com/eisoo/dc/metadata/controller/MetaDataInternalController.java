package com.eisoo.dc.metadata.controller;

import com.eisoo.dc.metadata.domain.vo.*;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.Min;
import javax.validation.constraints.Pattern;

import com.eisoo.dc.metadata.service.ITableScanService;
import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Api(tags = "元数据管理")
@RestController
@Validated
@RequestMapping("/api/internal/data-connection/v1/metadata")
public class MetaDataInternalController {
    @Autowired(required = false)
    private ITableScanService tableScanService;

    @ApiOperation(value = "批量查询数据源下的所有表", notes = "批量查询数据源下的所有表接口")
    @PostMapping("/data-source/table/batch")
    public ResponseEntity<?> getTableListByDsIdBatchInternal(HttpServletRequest request,
                                                             @RequestHeader(name = "x-account-id", required = false) String accountId,
                                                             @RequestHeader(name = "x-account-type", required = false) String accountType,
                                                             @RequestBody DataSourceIdsVo req,
                                                             @RequestParam(value = "update_time", required = false, defaultValue = "") String updateTime,
                                                             @RequestParam(value = "limit", required = false, defaultValue = "-1") @Min(value = -1) int limit,
                                                             @RequestParam(value = "offset", required = false, defaultValue = "0") @Min(value = 0) int offset,
                                                             @RequestParam(value = "keyword", required = false) String keyword,
                                                             @RequestParam(value = "direction", required = false, defaultValue = "desc")
                                                             @Pattern(regexp = "asc|desc", flags = Pattern.Flag.CASE_INSENSITIVE, message = "可选参数值：asc、desc")
                                                             String direction,
                                                             @RequestParam(value = "sort", required = false, defaultValue = "f_name")
                                                             @Pattern(regexp = "f_name", message = "可选参数值：f_name")
                                                             String sort) {
        return tableScanService.getTableListByDsIdsBatch(accountId, accountType, req, updateTime,keyword, limit, offset, sort, direction);
    }

    @ApiOperation(value = "批量查询指定的表和列", notes = "批量查询指定的表和列接口")
    @PostMapping("/data-source/tableAndField/batch")
    public ResponseEntity<?> getTableAndFieldInternal(HttpServletRequest request,
                                                      @RequestHeader(name = "x-account-id", required = false) String accountId,
                                                      @RequestHeader(name = "x-account-type", required = false) String accountType,
                                                      @RequestBody TableIdsVo req) {
        return tableScanService.getTableAndFieldDetailBatch(accountId, accountType, req);
    }
}
