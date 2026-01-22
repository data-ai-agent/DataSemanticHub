package com.eisoo.dc.gateway.proxyfilter;

import com.aishu.af.vega.sql.extract.SqlExtractUtil;
import com.alibaba.fastjson2.JSONException;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.metadata.entity.ClientIdEntity;
import com.eisoo.dc.gateway.common.Message;
import com.eisoo.dc.gateway.domain.vo.AuthTokenInfo;
import com.eisoo.dc.gateway.domain.vo.DataViewInfo;
import com.eisoo.dc.gateway.domain.vo.RowColumnRuleVo;
import com.eisoo.dc.gateway.service.ClientIdService;
import com.eisoo.dc.gateway.service.RewriteSqlService;
import com.eisoo.dc.gateway.util.AFUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.*;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestTemplate;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static java.nio.charset.StandardCharsets.ISO_8859_1;

@Slf4j
public class OpenLookengProxyFilter implements Filter {
    private String openlookengUrl;
    private String pwdAuthUrl;
    private String dataViewUrl;
    private boolean isOpen;
    private String jdbcIp;
    private String jdbcPort;
    private static Map<String, AuthTokenInfo> tokenMap = new HashMap<>();
    private AFUtil afUtil = new AFUtil();
    private ClientIdService clientIdService;
    private RewriteSqlService rewriteSqlService;

    public OpenLookengProxyFilter(String openlookengUrl, String pwdAuthUrl, String dataViewUrl,
                                  boolean isOpen, String jdbcIp, String jdbcPort,
                                  ClientIdService clientIdService, RewriteSqlService rewriteSqlService) {
        this.openlookengUrl = openlookengUrl;
        this.pwdAuthUrl = pwdAuthUrl;
        this.dataViewUrl = dataViewUrl;
        this.isOpen = isOpen;
        this.jdbcIp = jdbcIp;
        this.jdbcPort = jdbcPort;
        this.clientIdService = clientIdService;
        this.rewriteSqlService = rewriteSqlService;
    }

    @Override
    public void doFilter(ServletRequest servletRequest,
                         ServletResponse servletResponse,
                         FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        // uri
        String uri = request.getRequestURI();

        //跳过，暂时不考虑永洪BI
        if (uri.startsWith("/")) {
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }

        if (!uri.startsWith("/v1") && !uri.startsWith("/ui")) {
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }
        // 请求类型
        String method = request.getMethod();
        HttpMethod httpMethod = HttpMethod.resolve(method);
        // 请求头
        MultiValueMap<String, String> headers = parseRequestHeader(request);
        removeAcceptEncoding(uri, headers);
        // 请求体
        byte[] body = parseRequestBody(request);
        if (isOpen) {
            String usernameAndPassword = parseAuthFromReqHeads(headers);
            AuthTokenInfo authTokenInfo = login(usernameAndPassword);
            if (authTokenInfo.getStatusCode() != HttpStatus.OK.value()) {
                // 登录失败
                response.setStatus(authTokenInfo.getStatusCode());
                write(response, null, authTokenInfo.getErrorMsg());
                log.warn("login failed: {}", usernameAndPassword);
                return;
            }
            String sql = new String(body);
            Map<String, Map<String, List<String>>> catalogMap = getCatalogMap(authTokenInfo.getAccessToken(), usernameAndPassword);
            // 校验用户对视图是否有操作权限
            String verifyFailedTable = verifyTable(sql, catalogMap);
            if (StringUtils.isNotEmpty(verifyFailedTable)) {
                response.setStatus(403);
                write(response, null, "You do not have permission for this table: " + verifyFailedTable);
                log.warn("{} do not have permission for this table: {}", usernameAndPassword, verifyFailedTable);
                return;
            }
            if (sql.contains("system.jdbc.")) {
                if (catalogMap.size() == 0) {
                    // 该用户无有效逻辑视图
                    return;
                }
                // 通过修改查询sql来控制用户能看到的数据资源范围
                body = replaceQuerySql(body, headers, catalogMap);
            } else if (uri.startsWith("/v1/statement") && StringUtils.isNotEmpty(sql)) {
                // 解决永洪BI由于存在异常数据源导致所有数据源缺少schema的bug
                if (sql.toLowerCase().contains("from")) {
                    Map<SqlExtractUtil.TableName, Set<String>> tableMap = SqlExtractUtil.extractTableAndColumnRelationFromSqlNew(sql);
                    if (tableMap.size() > 0) {
                        for (SqlExtractUtil.TableName table : tableMap.keySet()) {
                            String[] arr = table.getTableName().split("\\.");
                            if (arr.length == 2) {
                                sql = sql.replaceAll(table.getTableName(), arr[0] + "." + "default" + "." + arr[1]);
                            }
                        }
                    }
                }

                // 改写sql，增加行列权限控制
                RowColumnRuleVo rowColumnRuleVo = rewriteSqlService.rewriteSql(sql, null, "read", authTokenInfo.getAccessToken());
                if (rowColumnRuleVo.getStatusCode() == 200) {
                    sql = rowColumnRuleVo.getTargetSql();
                } else {
                    response.setStatus(400);
                    AiShuException aiShuException = new AiShuException(ErrorCodeEnum.AuthServiceError, rowColumnRuleVo.getMessage(), Message.MESSAGE_AUTH_SERVICE_ERROR_SOLUTION);
                    write(response, null, aiShuException.toString());
                    log.warn("auth-service error : {}", aiShuException.toString());
                    return;
                }
                // 解决永洪BI9版本的bug
                // newSql = newSql.replaceAll("\"_col0\"", "*");
                body = rowColumnRuleVo.getTargetSql().getBytes();
                log.info("source sql:{}\ttarget sql:{}", sql, rowColumnRuleVo.getTargetSql());
            }
            // 解决永洪BI的bug，修改x-presto-prepared-statement，跟执行sql中的statement保持一致
            // resetHeaderStatement(sql, headers);
        }
        // 封装发送http请求
        RequestEntity requestEntity = new RequestEntity(body, headers, httpMethod, URI.create(openlookengUrl + uri));
        // 编码格式转换
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getMessageConverters().set(1, new StringHttpMessageConverter(StandardCharsets.UTF_8));
        ResponseEntity<String> result = restTemplate.exchange(requestEntity, String.class);

        // 替换重定向地址为网关地址
        String resultBody = result.getBody();
        try {
            JSONObject resultBodyJson = JSONObject.parseObject(resultBody);
            if (resultBodyJson != null) {
                replaceUri(resultBodyJson);
                resultBody = resultBodyJson.toJSONString();
            }
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }

        // 将转发请求得到的结果和响应头返回客户端
        HttpHeaders resultHeaders = result.getHeaders();
        write(response, resultHeaders, resultBody);

        log.info("openlookeng proxy ->\turi:{}\treqMethod:{}\treqHeaders:{}\treqBody:{}\trespHeaders:{}",
                uri, method, headers, new String(body), resultHeaders);
        log.debug("\r\nopenlookeng proxy:\r\n \turi:{} \r\n\treqMethod:{} \r\n\treqHeaders:{} \r\n\treqBody:{} " +
                        "\r\n\trespHeaders:{} \r\n\trespBody:{}",
                uri, method, headers, new String(body), resultHeaders, resultBody);
    }

    private String verifyTable(String sql, Map<String, Map<String, List<String>>> catalogMap) {
        if (!sql.toLowerCase().contains("from")) {
            return null;
        }
        // 解析sql获取表名和字段名
        Map<SqlExtractUtil.TableName, Set<String>> tableColumnMap = SqlExtractUtil.extractTableAndColumnRelationFromSqlNew(sql);
        for (SqlExtractUtil.TableName table : tableColumnMap.keySet()) {
            if (table.getTableName().toLowerCase().startsWith("system.jdbc.")) {
                return null;
            }
            String[] arr = table.getTableName().split("\\.");
            if (arr.length != 3) {
                continue;
            }
            if (!catalogMap.containsKey(arr[0]) ||
                !catalogMap.get(arr[0]).containsKey(arr[1]) ||
                !catalogMap.get(arr[0]).get(arr[1]).contains(arr[2])) {
                return table.getTableName();
            }
        }
        return null;
    }

//    private void resetHeaderStatement(String sql, MultiValueMap<String, String> headers) {
//        String key = "x-presto-prepared-statement";
//        if (!headers.containsKey(key)) {
//            return;
//        }
//        if (sql.startsWith("PREPARE statement")) {
//            String statement = sql.split(" ")[1];
//            headers.set(key, statement + "=" + headers.getFirst(key).split("=")[1]);
//        }
//        if (sql.startsWith("DESCRIBE OUTPUT statement")) {
//            String statement = sql.split(" ")[2];
//            headers.set(key, statement + "=" + headers.getFirst(key).split("=")[1]);
//        }
//        if (sql.startsWith("EXECUTE statement")) {
//            String statement = sql.split(" ")[1];
//            headers.set(key, statement + "=" + headers.getFirst(key).split("=")[1]);
//        }
//        if (sql.startsWith("DEALLOCATE PREPARE statement")) {
//            String statement = sql.split(" ")[2];
//            headers.set(key, statement + "=" + headers.getFirst(key).split("=")[1]);
//        }
//    }

    private void write(HttpServletResponse response, HttpHeaders headers, String body) throws IOException {
        if (headers != null) {
            Set<String> headerKeys = headers.keySet();
            for (String key : headerKeys) {
                response.setHeader(key, headers.get(key).toString());
            }
        }
        if (headers!= null && headers.getContentType() != null) {
            response.setContentType(headers.getContentType().toString());
        }
        if (body != null) {
            // 在getWriterz之前执行，否则不生效
            response.setCharacterEncoding("UTF-8");
            PrintWriter writer = response.getWriter();
            writer.write(body);
            writer.flush();
        }
    }

    private AuthTokenInfo login(String usernameAndPassword) {
        ClientIdEntity clientIdEntity = clientIdService.getClientIdAndSecret();
        if (StringUtils.isEmpty(usernameAndPassword) || !usernameAndPassword.contains(":")) {
            return afUtil.login(pwdAuthUrl, "", "", clientIdEntity.getClientId(), clientIdEntity.getClientSecret());
        }
        if (tokenMap.containsKey(usernameAndPassword)) {
            return tokenMap.get(usernameAndPassword);
        }
        return refreshToken(usernameAndPassword);
    }

    private AuthTokenInfo refreshToken(String usernameAndPassword) {
        // 校验用户名密码
        ClientIdEntity clientIdEntity = clientIdService.getClientIdAndSecret();
        String[] userPassArray = usernameAndPassword.split(":");
        AuthTokenInfo tokenInfo = afUtil.login(pwdAuthUrl, userPassArray[0], userPassArray[1], clientIdEntity.getClientId(), clientIdEntity.getClientSecret());
        tokenMap.put(usernameAndPassword, tokenInfo);
        return tokenInfo;
    }

    private Map<String, Map<String, List<String>>> getCatalogMap(String token, String usernameAndPassword) {
        Map<String, Map<String, List<String>>> catalogMap = new HashMap<>();
        // 获取用户逻辑视图
        DataViewInfo dataViewInfo = afUtil.getAllDataView(dataViewUrl, token);
        // token失效则刷新token，重新获取逻辑视图
        if (dataViewInfo.getStatusCode() == 401) {
            AuthTokenInfo tokenInfo = refreshToken(usernameAndPassword);
            dataViewInfo = afUtil.getAllDataView(dataViewUrl, tokenInfo.getAccessToken());
        }
        for (int i = 0; i < dataViewInfo.getTotalCount(); i++) {
            DataViewInfo.Entry en = dataViewInfo.getEntries().get(i);
            String catalog = en.getViewSourceCatalogName().split("\\.")[0];
            String schema = en.getViewSourceCatalogName().split("\\.")[1];
            String view = en.getTechnicalName();
            if (catalogMap.containsKey(catalog)) {
                if (catalogMap.get(catalog).containsKey(schema)) {
                    catalogMap.get(catalog).get(schema).add(view);
                } else {
                    List<String> viewList = new ArrayList<>();
                    viewList.add(view);
                    catalogMap.get(catalog).put(schema, viewList);
                }
            } else {
                List<String> viewList = new ArrayList<>();
                viewList.add(view);
                Map<String, List<String>> schemaMap = new HashMap<>();
                schemaMap.put(schema, viewList);
                catalogMap.put(catalog, schemaMap);
            }
        }
        return catalogMap;
    }

    private byte[] replaceQuerySql(byte[] body, MultiValueMap<String, String> headers, Map<String, Map<String, List<String>>> catalogMap) {
        List<String> catalogList = headers.get("x-presto-catalog");
        String xPrestoCatalog = null;
        if (catalogList != null && catalogList.size() > 0) {
            xPrestoCatalog = catalogList.get(0);
        }
        String sql = new String(body);
        StringBuffer condition = new StringBuffer();
        StringBuffer newSql = new StringBuffer();
        if (StringUtils.isEmpty(sql)) {
            return body;
        }
        // 修改查询catalog的sql
        if (sql.contains("SELECT TABLE_CAT")
                && sql.contains("FROM system.jdbc.catalogs")
                && sql.contains("ORDER BY TABLE_CAT")) {
            Set<String> catalogSet = catalogMap.keySet();
            for (String catalog : catalogSet) {
                condition.append("'").append(catalog).append("',");
            }
            condition.deleteCharAt(condition.length()-1);
            newSql.append("SELECT TABLE_CAT ")
                    .append("FROM system.jdbc.catalogs ")
                    .append("WHERE TABLE_CAT IN (" + condition + ") ")
                    .append("ORDER BY TABLE_CAT ");
            return newSql.toString().getBytes();
        }
        // 修改查询schemas的sql
        if (sql.contains("SELECT TABLE_SCHEM, TABLE_CATALOG")
                && sql.contains("FROM system.jdbc.schemas")
                && sql.contains("WHERE TABLE_SCHEM LIKE")) {
            Set<String> catalogSet = catalogMap.keySet();
            for (String catalog : catalogSet) {
                condition.append("OR (TABLE_CATALOG='").append(catalog).append("' AND TABLE_SCHEM IN(");
                Set<String> schemeSet = catalogMap.get(catalog).keySet();
                for (String scheme : schemeSet) {
                    condition.append("'").append(scheme).append("',");
                }
                condition.deleteCharAt(condition.length() - 1);
                condition.append("))");
            }
            condition.delete(0, 2);
            newSql.append("SELECT TABLE_SCHEM, TABLE_CATALOG ")
                    .append("FROM system.jdbc.schemas ")
                    .append("WHERE TABLE_SCHEM LIKE '%' ESCAPE '\\' AND(")
                    .append(condition)
                    .append(") ORDER BY TABLE_CATALOG, TABLE_SCHEM ");
            return newSql.toString().getBytes();
        }
        // 修改查询指定catalog下schemas的sql
        if (sql.contains("SELECT TABLE_SCHEM, TABLE_CATALOG")
                && sql.contains("FROM system.jdbc.schemas")
                && sql.contains("WHERE TABLE_CATALOG = ")) {
            String[] sqlArr = sql.split("ORDER BY");
            String catalog = sql.split("WHERE TABLE_CATALOG = '")[1].split("' AND TABLE_SCHEM LIKE")[0];
            Set<String> schemeSet = catalogMap.get(catalog).keySet();
            for (String scheme : schemeSet) {
                condition.append("'").append(scheme).append("',");
            }
            condition.deleteCharAt(condition.length() - 1);
            newSql.append(sqlArr[0]).append(" AND TABLE_SCHEM IN(").append(condition).append(") ORDER BY TABLE_CATALOG, TABLE_SCHEM");
            return newSql.toString().getBytes();
        }
        // 修改查询所有schemas的sql
        if (sql.contains("SELECT TABLE_SCHEM, TABLE_CATALOG")
                && sql.contains("FROM system.jdbc.schemas")
                && !sql.contains("WHERE")) {
            Set<String> catalogSet = catalogMap.keySet();
            for (String catalog : catalogSet) {
                condition.append("OR (TABLE_CATALOG='").append(catalog).append("' AND TABLE_SCHEM IN(");
                Set<String> schemeSet = catalogMap.get(catalog).keySet();
                for (String scheme : schemeSet) {
                    condition.append("'").append(scheme).append("',");
                }
                condition.deleteCharAt(condition.length() - 1);
                condition.append("))");
            }
            condition.delete(0, 2);
            newSql.append("SELECT TABLE_SCHEM, TABLE_CATALOG ")
                    .append("FROM system.jdbc.schemas WHERE ")
                    .append(condition)
                    .append("ORDER BY TABLE_CATALOG, TABLE_SCHEM ");
            return newSql.toString().getBytes();
        }
        // 修改查询指定catalog下所有tables的sql
        if (sql.contains("SELECT TABLE_CAT, TABLE_SCHEM, TABLE_NAME, TABLE_TYPE, REMARKS")
                && sql.contains("TYPE_CAT, TYPE_SCHEM, TYPE_NAME,   SELF_REFERENCING_COL_NAME, REF_GENERATION")
                && sql.contains("FROM system.jdbc.tables")
                && sql.contains("AND TABLE_NAME LIKE '%'")
                && !sql.contains("' AND TABLE_SCHEM LIKE")) {
            String[] sqlArr = sql.split("AND TABLE_NAME LIKE '%' ESCAPE '\\\\'");
            if (StringUtils.isEmpty(xPrestoCatalog)) {
                if (sql.contains("WHERE TABLE_CAT = '")) {
                    xPrestoCatalog = sql.split("WHERE TABLE_CAT = '")[1].split("' AND TABLE_NAME LIKE")[0];
                } else {
                    return body;
                }
            }
            Set<String> schemeSet = catalogMap.get(xPrestoCatalog).keySet();
            condition.append("AND (");
            for (String scheme : schemeSet) {
                condition.append("OR (TABLE_SCHEM='").append(scheme).append("' AND TABLE_NAME IN(");
                for (String table : catalogMap.get(xPrestoCatalog).get(scheme)) {
                    condition.append("'").append(table).append("',");
                }
                condition.deleteCharAt(condition.length() - 1);
                condition.append("))");
            }
            condition.append(")");
            condition.delete(5, 7);
            newSql.append(sqlArr[0]).append(condition).append(sqlArr[1]);
            return newSql.toString().getBytes();
        }
        // 修改查询指定schema下tables的sql
        if (sql.contains("SELECT TABLE_CAT, TABLE_SCHEM, TABLE_NAME, TABLE_TYPE, REMARKS")
                && sql.contains("TYPE_CAT, TYPE_SCHEM, TYPE_NAME,   SELF_REFERENCING_COL_NAME, REF_GENERATION")
                && sql.contains("FROM system.jdbc.tables")
                && sql.contains("' AND TABLE_SCHEM LIKE")) {
            if (StringUtils.isEmpty(xPrestoCatalog)) {
                if (sql.contains("WHERE TABLE_CAT = '")) {
                    xPrestoCatalog = sql.split("WHERE TABLE_CAT = '")[1].split("' AND TABLE_SCHEM LIKE")[0];
                } else {
                    return body;
                }
            }
            if (!sql.contains("AND TABLE_SCHEM LIKE '")) {
                return body;
            }
            String scheme = sql.split("AND TABLE_SCHEM LIKE '")[1].split("' ESCAPE '")[0].replaceAll("\\\\", "");
            condition.append("TABLE_CAT='").append(xPrestoCatalog).
                    append("' AND TABLE_SCHEM='").append(scheme).append("' AND TABLE_NAME IN(");
            if (!catalogMap.containsKey(xPrestoCatalog)) {
                return body;
            }
            for (String table : catalogMap.get(xPrestoCatalog).get(scheme)) {
                condition.append("'").append(table).append("',");
            }
            condition.deleteCharAt(condition.length() - 1);
            condition.append(")");
            newSql.append("SELECT TABLE_CAT, TABLE_SCHEM, TABLE_NAME, TABLE_TYPE, REMARKS, ")
                    .append("TYPE_CAT, TYPE_SCHEM, TYPE_NAME,   SELF_REFERENCING_COL_NAME, REF_GENERATION ")
                    .append("FROM system.jdbc.tables WHERE ")
                    .append(condition);
            if (sql.contains("AND TABLE_TYPE IN ('VIEW')")) {
                newSql.append(" AND TABLE_TYPE IN ('VIEW') ");
            }
            if (sql.contains("AND TABLE_TYPE IN ('TABLE')")) {
                newSql.append(" AND TABLE_TYPE IN ('TABLE') ");
            }
            newSql.append(" ORDER BY TABLE_TYPE, TABLE_CAT, TABLE_SCHEM, TABLE_NAME ");
            return newSql.toString().getBytes();
        }
        // 修改查询指定schema下columns的sql
        if (sql.contains("SELECT TABLE_CAT, TABLE_SCHEM, TABLE_NAME, COLUMN_NAME, DATA_TYPE")
                && sql.contains("TYPE_NAME, COLUMN_SIZE, BUFFER_LENGTH, DECIMAL_DIGITS, NUM_PREC_RADIX")
                && sql.contains("FROM system.jdbc.columns")
                && sql.contains("AND TABLE_SCHEM LIKE '")) {
            String scheme = sql.split("AND TABLE_SCHEM LIKE '")[1].split("' ESCAPE '")[0].replaceAll("\\\\", "");
            condition.append("TABLE_CAT='").append(xPrestoCatalog).
                    append("' AND TABLE_SCHEM='").append(scheme).append("' AND TABLE_NAME IN(");
            for (String table : catalogMap.get(xPrestoCatalog).get(scheme)) {
                condition.append("'").append(table).append("',");
            }
            condition.deleteCharAt(condition.length() - 1);
            condition.append(")");
            newSql.append("SELECT TABLE_CAT, TABLE_SCHEM, TABLE_NAME, COLUMN_NAME, DATA_TYPE, ")
                    .append("TYPE_NAME, COLUMN_SIZE, BUFFER_LENGTH, DECIMAL_DIGITS, NUM_PREC_RADIX, ")
                    .append("NULLABLE, REMARKS, COLUMN_DEF, SQL_DATA_TYPE, SQL_DATETIME_SUB, ")
                    .append("CHAR_OCTET_LENGTH, ORDINAL_POSITION, IS_NULLABLE, ")
                    .append("SCOPE_CATALOG, SCOPE_SCHEMA, SCOPE_TABLE, ")
                    .append("SOURCE_DATA_TYPE, IS_AUTOINCREMENT, IS_GENERATEDCOLUMN ")
                    .append("FROM system.jdbc.columns WHERE ")
                    .append(condition);
            return newSql.toString().getBytes();
        }
        return body;
    }

    private void removeAcceptEncoding(String uri, MultiValueMap<String, String> headers) {
        if (uri.equals("/v1/info")) {
            // 不让服务端进行压缩，否则会乱码
            headers.remove("Accept-Encoding");
        }
        if (uri.startsWith("/v1/statement")) {
            // 不让服务端进行压缩，否则会乱码
            headers.remove("accept-encoding");
        }
    }

    private void replaceUri(JSONObject resultBodyJson) {
        if (resultBodyJson.containsKey("infoUri")) {
            resultBodyJson.put("infoUri", replaceIpAndPort(resultBodyJson.getString("infoUri")));
        }
        if (resultBodyJson.containsKey("nextUri")) {
            resultBodyJson.put("nextUri", replaceIpAndPort(resultBodyJson.getString("nextUri")));
        }
        if (resultBodyJson.containsKey("partialCancelUri")) {
            resultBodyJson.put("partialCancelUri", replaceIpAndPort(resultBodyJson.getString("partialCancelUri")));
        }
    }

    private String replaceIpAndPort(String uri) {
        if (StringUtils.isEmpty(uri)) {
            return uri;
        }
        if (uri.contains("/ui/")) {
            String[] array = uri.split("/ui/");
            return "http://" + jdbcIp + ":" + jdbcPort + "/ui/" + array[1];
        } else if (uri.contains("/v1/")) {
            String[] array = uri.split("/v1/");
            return "http://" + jdbcIp + ":" + jdbcPort + "/v1/" + array[1];
        } else {
            return uri;
        }
    }

    private MultiValueMap<String, String> parseRequestHeader(HttpServletRequest request) {
        HttpHeaders httpHeaders = new HttpHeaders();
        List<String> headerNames = Collections.list(request.getHeaderNames());
        for (String headerName : headerNames) {
            List<String> headerValues = Collections.list(request.getHeaders(headerName));
            for (String headerValue : headerValues) {
                if (headerName.contains("prepare")) {
                    // %5B %5D 代表 "["和"]"需要去掉
                    httpHeaders.add(headerName, headerValue.replace("%5B", "").replace("%5D", ""));
                } else {
                    httpHeaders.add(headerName, headerValue);
                }
            }
        }
        return httpHeaders;
    }

    private byte[] parseRequestBody(HttpServletRequest request) throws IOException {
        InputStream inputStream = request.getInputStream();
        return StreamUtils.copyToByteArray(inputStream);
    }

    private String parseAuthFromReqHeads(MultiValueMap<String, String> reqHeads) {
        // This handles HTTP basic auth per RFC 7617. The header contains the
        // case-insensitive "Basic" scheme followed by a Base64 encoded "user:pass".
        String headName = "authorization";
        Map<String, String> headsMap = reqHeads.toSingleValueMap();
        if (!headsMap.containsKey(headName)) {
            return null;
        }
        String header = headsMap.get(headName) == null ? "" : headsMap.get(headName).toString();
        int space = header.indexOf(' ');
        String credentials = new String(Base64.getDecoder().decode(header.substring(space + 1).trim()), ISO_8859_1);
        reqHeads.set(headName, credentials);
        return credentials;
    }

    @Override
    public void destroy() {}

}