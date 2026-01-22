package com.eisoo.dc.gateway.controller;

import com.eisoo.dc.gateway.domain.dto.ExcelTableConfigDto;
import com.eisoo.dc.gateway.service.ExcelService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * @Author exx
 **/
@Api(tags = "Excel表管理")
@RestController
@RequestMapping("/api/data-connection/v1/gateway/excel")
@Validated
public class ExcelController {

    @Autowired(required = false)
    private ExcelService excelService;

    @ApiOperation(value = "查询Excel文件列表", notes = "查询Excel文件列表接口")
    @GetMapping("/files/{catalog}")
    public ResponseEntity<?> files(HttpServletRequest request, @PathVariable String catalog) {
        return excelService.files(request, catalog);
    }

    @ApiOperation(value = "查询Excel文件sheet列表", notes = "查询Excel文件sheet列表接口")
    @GetMapping("/sheet")
    public ResponseEntity<?> sheet(HttpServletRequest request, @Validated @RequestParam("catalog") String catalog, @RequestParam("file_name") String fileName) {
        return excelService.sheet(request, catalog, fileName);
    }

    @ApiOperation(value = "查询Excel字段列表", notes = "查询Excel字段列表接口")
    @PostMapping("/columns")
    public ResponseEntity<?> columns(HttpServletRequest request, @Validated @RequestBody ExcelTableConfigDto excelTableConfigDto) {
        return excelService.columns(request, excelTableConfigDto);
    }

    @ApiOperation(value = "新增Excel表", notes = "新增Excel表接口")
    @PostMapping("/table")
    public ResponseEntity<?> createTable(HttpServletRequest request,
                                        @Validated @RequestBody ExcelTableConfigDto excelTableConfigDto) {
        return excelService.createTable(request, excelTableConfigDto);
    }

    @ApiOperation(value = "删除Excel表", notes = "删除Excel表接口")
    @DeleteMapping("/table/{tableId}")
    public ResponseEntity<?> deleteTable(
            @PathVariable("tableId") String tableId) {
        return excelService.deleteTable(tableId);
    }
}
