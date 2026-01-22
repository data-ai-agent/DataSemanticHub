package com.eisoo.dc.gateway.controller;

import com.eisoo.dc.common.util.CommonUtil;
import com.eisoo.dc.common.util.StringUtils;
import com.eisoo.dc.common.vo.IntrospectInfo;
import com.eisoo.dc.gateway.common.QueryConstant;
import com.eisoo.dc.gateway.domain.dto.DownloadDto;
import com.eisoo.dc.gateway.domain.vo.FetchQueryVO;
import com.eisoo.dc.gateway.service.QueryService;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.Pattern;

/**
 * paul.yan
 */
@Api(tags = "查询管理")
@RestController
@RequestMapping({"/api"})
@Validated
public class FetchController {
    @Autowired(required = false)
    private QueryService queryService;

//    @ApiOperation(value = "数据查询", notes = "数据查询接口")
//    @PostMapping("/fetch")
//    public ResponseEntity<?> fetch(@Validated @RequestBody String statement,
//                                   @RequestParam(value = "statement_type")
//                                   @Pattern(regexp = "dsl|sql", flags = Pattern.Flag.CASE_INSENSITIVE, message = "可选参数值：dsl、sql") String statementType,
//                                   @RequestParam(value = "catalog_name", required = false) String catalogName,
//                                   @RequestParam(value = "table_name", required = false) String tableName,
//                                   @RequestHeader(name = "X-Presto-User", required = false) String user,
//                                   @RequestHeader(name = "x-user", required = false) String userId,
//                                   @RequestHeader(name = "X-Presto-Session", required = false) String xPrestoSession,
//                                   @RequestParam(name = "action", required = false) String action,
//                                   @RequestParam(value = "type", required = false, defaultValue = "0") int type) throws Exception {
//        return queryService.statement(statementType, catalogName, tableName, statement, user, type, "", action, xPrestoSession);
//    }

    @ApiOperation(value = "数据查询（内部）", notes = "数据查询接口（内部）")
    @PostMapping("/internal/data-connection/v1/gateway/fetch")
    public ResponseEntity<?> fetchByInternal(@RequestHeader(name = "x-account-id") String accountId,
                                             @RequestHeader(name = "x-account-type")
                                             @Pattern(regexp = "user|app|anonymous", message = "可选参数值：user、app、anonymous")
                                             String accountType,
                                             @Validated @RequestBody FetchQueryVO fetchQueryVO) {
        return queryService.statement(accountId, accountType, fetchQueryVO);
    }

    @ApiOperation(value = "数据查询", notes = "数据查询接口")
    @PostMapping("/data-connection/v1/gateway/fetch")
    public ResponseEntity<?> fetch(HttpServletRequest request,
                                   @Validated @RequestBody FetchQueryVO fetchQueryVO) {
        IntrospectInfo introspectInfo = CommonUtil.getOrCreateIntrospectInfo(request);
        String userId = StringUtils.defaultString(introspectInfo.getSub());
        String userType = introspectInfo.getAccountType();
        return queryService.statement(userId, userType, fetchQueryVO);
    }

    @ApiOperation(value = "阶段查询", notes = "流式查询接口")
    @GetMapping("/internal/data-connection/v1/gateway/statement/executing/{queryId}/{slug}/{token}")
    public ResponseEntity<?> nextFetch(@RequestHeader(name = "x-account-id") String accountId,
                                       @RequestHeader(name = "x-account-type")
                                       @Pattern(regexp = "user|app|anonymous", message = "可选参数值：user、app、anonymous")
                                       String accountType,
                                       @PathVariable("queryId") String queryId,
                                       @PathVariable("slug") String slug,
                                       @PathVariable("token") long token,
                                       @RequestParam(name = "batchSize", required = false)
                                       @Min(value = 1, message = "batchSize must be greater than or equal to 1")
                                       @Max(value = 100000, message = "batchSize must be less than or equal to 100000")
                                       Integer batchSize
    ) {
        return queryService.statement(accountId, accountType, queryId, slug, token,batchSize);
    }
//    @ApiOperation(value = "阶段查询", notes = "流式查询接口")
//    @GetMapping("/statement/executing/{queryId}/{slug}/{token}")
//    public ResponseEntity<?> nextFetch(@PathVariable("queryId") String queryId,
//                                       @RequestHeader(name = "x-user", required = false) String userId,
//                                       @PathVariable("slug") String slug,
//                                       @PathVariable("token") long token, @RequestHeader(name = "X-Presto-User", required = false) String user) throws JsonProcessingException {
//        return queryService.statement(queryId, slug, token, user);
//    }

    @ApiOperation(value = "样例数据查询", notes = "样例数据查询接口")
    @GetMapping("/preview/{catalog}/{schema}/{table}")
    public ResponseEntity<?> fetch(@PathVariable("catalog") String catalog,
                                   @PathVariable("schema") String schema,
                                   @PathVariable("table") String table,
                                   @RequestParam(value = "columns", required = false) String columns,
                                   @RequestParam(value = "limit", required = false, defaultValue = "100") Long limit,
                                   @RequestParam(value = "type", required = false, defaultValue = "0") int type,
                                   @RequestParam(name = "action", required = false) String action,
                                   @RequestHeader(name = "x-user", required = false) String userId,
                                   @RequestHeader(name = "X-Presto-User", required = false) String user) throws Exception {
        return queryService.statement(catalog, schema, table, columns, limit, type, user, "", action);
    }

    @ApiOperation(value = "数据下载", notes = "数据下载接口")
    @PostMapping("/download")
    public ResponseEntity<?> download(@RequestHeader(name = "X-Presto-User", required = false) String user,
                                      @RequestHeader(name = "x-user", required = false) String userId,
                                      @RequestParam(name = "action", required = false) String action,
                                      @Validated @RequestBody DownloadDto downloadDto) throws JsonProcessingException {
        return queryService.statement(downloadDto, QueryConstant.DEFAULT_ASYNC_TASK_USER, "", action);
    }

    @ApiOperation(value = "数据分页查询", notes = "数据分页查询接口")
    @PostMapping("/query")
    public ResponseEntity<?> query(@Validated @RequestBody String statement,
                                   @RequestHeader(name = "X-Presto-User", required = false) String user,
                                   @RequestHeader(name = "x-user", required = false) String userId,
                                   @RequestParam(name = "action", required = false) String action) throws Exception {
        return queryService.statement(statement, user, "", action);
    }

}
