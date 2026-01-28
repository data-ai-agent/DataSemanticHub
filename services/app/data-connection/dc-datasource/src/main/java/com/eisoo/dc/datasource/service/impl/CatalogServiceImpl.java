package com.eisoo.dc.datasource.service.impl;

import cn.hutool.core.util.ArrayUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.eisoo.dc.common.auditLog.AuditLog;
import com.eisoo.dc.common.auditLog.LogObject;
import com.eisoo.dc.common.auditLog.Operator;
import com.eisoo.dc.common.auditLog.OperatorAgent;
import com.eisoo.dc.common.auditLog.enums.AgentType;
import com.eisoo.dc.common.auditLog.enums.ObjectType;
import com.eisoo.dc.common.auditLog.enums.OperationType;
import com.eisoo.dc.common.auditLog.enums.OperatorType;
import com.eisoo.dc.common.constant.*;
import com.eisoo.dc.common.driven.Authorization;
import com.eisoo.dc.common.driven.Calculate;
import com.eisoo.dc.common.driven.UserManagement;
import com.eisoo.dc.common.driven.service.ServiceEndpoints;
import com.eisoo.dc.common.enums.ConnectorEnums;
import com.eisoo.dc.common.enums.ScanStatusEnum;
import com.eisoo.dc.common.exception.enums.ErrorCodeEnum;
import com.eisoo.dc.common.exception.vo.AiShuException;
import com.eisoo.dc.common.metadata.entity.*;
import com.eisoo.dc.common.metadata.mapper.*;
import com.eisoo.dc.common.msq.ProtonMQClient;
import com.eisoo.dc.common.msq.Topic;
import com.eisoo.dc.common.util.CommonUtil;
import com.eisoo.dc.common.util.LockUtil;
import com.eisoo.dc.common.util.RSAUtil;
import com.eisoo.dc.common.util.StringUtils;
import com.eisoo.dc.common.util.jdbc.db.DbClientInterface;
import com.eisoo.dc.common.util.jdbc.db.DbConnectionStrategyFactory;
import com.eisoo.dc.common.util.jdbc.db.DataSourceConfig;
import com.eisoo.dc.common.util.http.ExcelHttpUtils;
import com.eisoo.dc.common.util.http.TingYunHttpUtils;
import com.eisoo.dc.common.vo.CatalogDto;
import com.eisoo.dc.common.vo.IntrospectInfo;
import com.eisoo.dc.common.vo.ResourceAuthVo;
import com.eisoo.dc.datasource.domain.vo.*;
import com.eisoo.dc.datasource.enums.DsBuiltInStatus;
import com.eisoo.dc.datasource.enums.MetadataObtainLevel;
import com.eisoo.dc.datasource.service.CatalogService;
import com.eisoo.dc.common.metadata.mapper.TableScanMapper;
import com.eisoo.dc.common.metadata.mapper.FieldScanMapper;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.core5.http.HttpHost;
import org.opensearch.client.RestClient;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.cluster.HealthResponse;
import org.opensearch.client.transport.OpenSearchTransport;
import org.opensearch.client.transport.rest_client.RestClientTransport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;


@Service
public class CatalogServiceImpl implements CatalogService {
    private static final Logger log = LoggerFactory.getLogger(CatalogServiceImpl.class);
    public static final String[] EXCEL_PROTOCOLS = {CatalogConstant.STORAGE_PROTOCOL_ANYSHARE, CatalogConstant.STORAGE_PROTOCOL_DOCLIB};
    @Autowired(required = false)
    TableScanMapper tableScanMapper;
    @Autowired(required = false)
    TableOldMapper tableOldMapper;
    @Autowired(required = false)
    FieldScanMapper fieldScanMapper;
    @Autowired(required = false)
    FieldOldMapper fieldOldMapper;
    @Autowired(required = false)
    CatalogRuleMapper catalogRuleMapper;

    @Autowired(required = false)
    DataSourceMapper dataSourceMapper;

    @Autowired(required = false)
    TaskScanMapper taskScanMapper;
    @Autowired(required = false)
    TaskScanTableMapper taskScanTableMapper;
    @Autowired(required = false)
    private TaskScanScheduleMapper taskScanScheduleMapper;

    @Autowired(required = false)
    ProtonMQClient mqClient;

    @Autowired
    private ServiceEndpoints serviceEndpoints;

    @Value(value = "${openlookeng.jdbc.pushdown-module}")
    private String pushDownModule;

    @Value(value = "${collector-data-source}")
    private String collectorDataSource;

    @Override
    public ResponseEntity<?> createDatasource(HttpServletRequest request, DataSourceVo params) {
        IntrospectInfo introspectInfo = CommonUtil.getOrCreateIntrospectInfo(request);
        String userId = StringUtils.defaultString(introspectInfo.getSub());
        String token = CommonUtil.getToken(request);

        // 如果userId为空且introspectInfo不为空，使用匿名用户
        if (StringUtils.isBlank(userId)) {
            userId = "anonymous";
        }
        
        String accountType = StringUtils.isNotBlank(introspectInfo.getSub()) ? introspectInfo.getAccountType() : ResourceAuthConstant.USER_TYPE_USER;

//        //非扫描用数据源,判断是否有创建数据源的权限
//        if (!params.getName().equals(collectorDataSource)) {
//            // 当userId不是匿名用户时才进行权限检查
//            if (!"anonymous".equals(userId)) {
//                boolean isOk = Authorization.checkResourceOperation(
//                        serviceEndpoints.getAuthorizationPrivate(),
//                        userId,
//                        accountType,
//                        new ResourceAuthVo("*", ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE),
//                        ResourceAuthConstant.RESOURCE_OPERATION_TYPE_CREATE);
//                if (!isOk) {
//                    throw new AiShuException(ErrorCodeEnum.ForbiddenError, String.format(Detail.RESOURCE_PERMISSION_ERROR, ResourceAuthConstant.RESOURCE_OPERATION_TYPE_CREATE));
//                }
//            }
//        }

        String type = params.getType();
        BinDataVo binData = params.getBinData();

        //基本参数校验
        checkDataSourceParam(type, binData);

        //数据源名称重名校验
        List<DataSourceEntity> list = dataSourceMapper.selectByCatalogNameAndId(params.getName(), null);
        if (!list.isEmpty()) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.DATASOURCE_NAME_EXIST, String.format(Detail.DATASOURCE_NAME_EXIST, params.getName()), Message.MESSAGE_Duplicated_SOLUTION);
        }

        //测试连接
        connect(token, type, binData);

        // 创建数据源catalog
        String catalogName = null;
        if (!type.equals(CatalogConstant.TINGYUN_CATALOG)
               && !type.equals(CatalogConstant.ANYSHARE7_CATALOG)) {
            catalogName = createCatalog(token, params);
        }

        // 生成数据库记录
        DataSourceEntity dataSourceEntity = new DataSourceEntity(
                UUID.randomUUID().toString(), // id
                params.getName(),
                params.getType(),
                catalogName,
                binData.getDatabaseName(),
                binData.getSchema(),
                binData.getConnectProtocol(),
                binData.getHost(),
                binData.getPort(),
                binData.getAccount(),
                binData.getPassword(),
                binData.getStorageProtocol(),
                binData.getStorageBase(),
                binData.getToken(),
                binData.getReplicaSet(),
                params.getName().equals(collectorDataSource) ? DsBuiltInStatus.SPECIAL.getValue() : DsBuiltInStatus.NON_BUILT_IN.getValue(),
                params.getComment(),
                userId, // createdByUid
                LocalDateTime.now(), // createdAt
                userId, // updatedByUid
                LocalDateTime.now() // updatedAt
        );

        if (type.equals(CatalogConstant.EXCEL_CATALOG) && binData.getStorageProtocol().equals(CatalogConstant.STORAGE_PROTOCOL_DOCLIB)) {
            String[] parts = serviceEndpoints.getEfastPublic().replace("http://", "").split(":");
            dataSourceEntity.setFHost(parts[0]);
            dataSourceEntity.setFPort(Integer.parseInt(parts[1]));
        }

        try {
            dataSourceMapper.insert(dataSourceEntity);
        } catch (Exception e) {
            if (catalogName != null) {
                catalogRuleMapper.deleteByCatalogName(catalogName);
                Calculate.deleteCatalog(serviceEndpoints.getVegaCalculateCoordinator(), catalogName);
            }
            log.info("新增数据源{},数据库记录写入失败，并删除数据源成功。", params.getName());
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Detail.CREATE_DATASOURCE_FAILED);
        }
        log.info("数据库添加数据源记录成功");

        //日志
//        AuditLog auditLog = AuditLog.newAuditLog()
//                .withOperation(OperationType.CREATE)
//                .withOperator(buildOperator(request))
//                .withObject(new LogObject(ObjectType.DATA_SOURCE, params.getName(), dataSourceEntity.getFId()))
//                .generateDescription();
//        String message = CommonUtil.obj2json(auditLog);
//        log.info(message);
//
//        //非扫描用数据源,添加资源权限,发送审计日志
//        if (!params.getName().equals(collectorDataSource)) {
//            try {
//                Authorization.addResourceOperations(
//                        serviceEndpoints.getAuthorizationPrivate(),
//                        userId,
//                        introspectInfo.getAccountType(),
//                        dataSourceEntity.getFId(),
//                        ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE,
//                        params.getName(),
//                        ResourceAuthConstant.ALLOW_OPERATION_DATA_SOURCE_CREATED,
//                        new String[]{});
//                log.info("添加资源权限成功");
//            } catch (Exception e) {
//                dataSourceMapper.deleteById(dataSourceEntity.getFId());
//                if (catalogName != null) {
//                    catalogRuleMapper.deleteByCatalogName(catalogName);
//                    Calculate.deleteCatalog(serviceEndpoints.getVegaCalculateCoordinator(), catalogName);
//                }
//                log.info("新增数据源{},添加资源权限失败，并删除数据源成功。", params.getName());
//                throw e;
//            }
//
//            //发送审计日志消息
//            try {
//                mqClient.pub(Topic.ISF_AUDIT_LOG_LOG.getTopicName(), message);
//            } catch (Exception e) {
//                log.error("创建数据源{}成功，发送审计日志消息失败。", dataSourceEntity.getFName());
//            }
//            //发送数据源创建消息
//            JSONObject dataSourceMessage = new JSONObject();
//            JSONObject header = new JSONObject();
//            JSONObject payload = new JSONObject();
//
//            // 设置header部分
//            header.set("method", "create"); // 或 "update" 根据操作类型
//
//            // 设置payload部分
//            payload.set("id", dataSourceEntity.getFId());
//            payload.set("name", params.getName());
//            payload.set("type", params.getType()); // 需要实现getTypeCode方法将类型转换为数字
//            payload.set("database_name", binData.getDatabaseName());
//            payload.set("catalog_name", catalogName);
//            payload.set("schema", binData.getSchema());
//            payload.set("connect_status", "Connecting");
//            payload.set("update_time", System.currentTimeMillis() * 1000000 + RandomStringUtils.randomNumeric(9)); // 示例时间戳
//
//            // 组合完整消息
//            dataSourceMessage.set("header", header);
//            dataSourceMessage.set("payload", payload);
//
//            // 发送消息的代码示例（根据实际需求调整）
//            try {
//                mqClient.pub(Topic.AF_DATASOURCE_MESSAGE_TOPIC.getTopicName(), dataSourceMessage.toString());
//            } catch (Exception e) {
//                log.error("发送数据源消息失败消息失败", e);
//            }
//        }
        JSONObject response = new JSONObject();
        response.set("id", dataSourceEntity.getFId());
        response.set("name", params.getName());
        return ResponseEntity.ok(response);
    }

    private String createCatalog(String token, DataSourceVo dataSourceVo) {

        //生成catalog信息
        String typeWithUnderscore = dataSourceVo.getType().replace("-", "_");
        String randomString = RandomStringUtils.randomAlphanumeric(8).toLowerCase();
        String catalogName = typeWithUnderscore + "_" + randomString;


        return catalogName;
    }

    private CatalogDto buildCatalogDto(String token, String type, BinDataVo binData, String CatalogName) {
        CatalogDto catalogDto = new CatalogDto();

        //catalog name
        catalogDto.setCatalogName(CatalogName);

        if (StringUtils.equalsIgnoreCase(type, CatalogConstant.HIVE_CATALOG)) {
            if (StringUtils.equalsIgnoreCase(binData.getConnectProtocol(), CatalogConstant.CONNECT_PROTOCOL_THRIFT)) {
                type = CatalogConstant.HIVE_HADOOP2_CATALOG;
            } else {
                type = CatalogConstant.HIVE_JDBC_CATALOG;
            }
        }

        //connector name
        if (StringUtils.equalsIgnoreCase(CatalogConstant.HOLOGRES_CATALOG, type)
                || StringUtils.equalsIgnoreCase(CatalogConstant.KINGBASE_CATALOG, type)) {
            catalogDto.setConnectorName(CatalogConstant.POSTGRESQL_CATALOG);
            catalogDto.setOrigConnectorName(type);
        } else if (StringUtils.equalsIgnoreCase(CatalogConstant.GAUSSDB_CATALOG, type)) {
            catalogDto.setConnectorName(CatalogConstant.OPENGAUSS_CATALOG);
            catalogDto.setOrigConnectorName(type);
        } else {
            catalogDto.setConnectorName(type);
        }

        //properties
        catalogDto.setProperties(buildProperties(token, CatalogName, type, binData));
        return catalogDto;
    }

    private void insertCatalogRule(String catalogName, String datasourceType) {
        String[] rules = {"FilterNode", "ProjectNode"};
        Instant now = Instant.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")
                .withZone(ZoneId.of("Asia/Shanghai"));
        String createTime = dtf.format(now);
        for (String rule : rules) {
            CatalogRuleEntity catalogRuleEntity = new CatalogRuleEntity();
            catalogRuleEntity.setCatalogName(catalogName);
            catalogRuleEntity.setDatasourceType(datasourceType);
            catalogRuleEntity.setPushdownRule(rule);
            catalogRuleEntity.setIsEnabled("true");
            catalogRuleEntity.setCreateTime(createTime);
            catalogRuleMapper.insert(catalogRuleEntity);
        }
    }

    @Override
    public ResponseEntity<?> testDataSource(HttpServletRequest request, TestDataSourceVo params) {

        String type = params.getType();
        BinDataVo binData = params.getBinData();

        //基本参数校验
        checkDataSourceParam(type, binData);

        //测试连接
        JSONObject result = new JSONObject();
        Boolean testResult = connect(CommonUtil.getToken(request), type, binData);

        result.set("status", testResult);
        return ResponseEntity.ok(result);
    }

    public Boolean connect(String token, String type, BinDataVo binData) {

        //测试连接
        switch (type) {
            case CatalogConstant.EXCEL_CATALOG:
                return tryConnectExcel(token, binData);
            case CatalogConstant.ANYSHARE7_CATALOG:
                return tryConnectAS7(binData);
            case CatalogConstant.TINGYUN_CATALOG:
                return tryConnectTingYun(binData);
            case CatalogConstant.OPENSEARCH_CATALOG:
                return tryConnectOpenSearch(binData);
            default:
                return tryConnectCatalog(type, binData);
        }
    }

    private Boolean tryConnectExcel(String token, BinDataVo binDataVo) {
        String url = "";
        String base = binDataVo.getStorageBase();
        if (binDataVo.getStorageProtocol().equals(CatalogConstant.STORAGE_PROTOCOL_DOCLIB)) {
            url = serviceEndpoints.getEfastPublic();
        } else {
            String host = binDataVo.getHost();
            String port = String.valueOf(binDataVo.getPort());
            String username = binDataVo.getAccount();
            String password = decryptPassword(binDataVo.getPassword());
            token = ExcelHttpUtils.getToken(host, port, username, password);
            url = ExcelHttpUtils.getUrl(binDataVo.getConnectProtocol(), host, port);
        }
        com.alibaba.fastjson2.JSONObject dirJson = null;
        if (isExcelFile(base)) {
            String[] arr = base.split("/");
            String fileName = arr[arr.length - 1];
            String path = "";
            for (int i = 0; i < arr.length - 1; i++) {
                path += arr[i] + "/";
            }
            String docId = ExcelHttpUtils.getDocid(url, token, path);
            dirJson = ExcelHttpUtils.loadDir(url, token, docId);
            if (!dirJson.containsKey("dirs")) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Description.CONNECT_FAILED, dirJson.toJSONString(), Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }
            com.alibaba.fastjson2.JSONArray files = dirJson.getJSONArray("files");
            for (int i = 0; i < files.size(); i++) {
                if (files.getJSONObject(i).getString("name").equals(fileName)) {
                    return true;
                }
            }
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.CONNECT_FAILED, dirJson.toJSONString(), Message.MESSAGE_PARAM_ERROR_SOLUTION);
        } else {
            String docId = ExcelHttpUtils.getDocid(url, token, base);
            dirJson = ExcelHttpUtils.loadDir(url, token, docId);
            if (dirJson.containsKey("dirs")) {
                return true;
            } else {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Description.CONNECT_FAILED, dirJson.toJSONString(), Message.MESSAGE_PARAM_ERROR_SOLUTION);
            }
        }
    }

    private Boolean tryConnectAS7(BinDataVo binDataVo) {
        String host = binDataVo.getHost();
        String port = String.valueOf(binDataVo.getPort());
        String username = binDataVo.getAccount();
        String password = decryptPassword(binDataVo.getPassword());
        String base = binDataVo.getStorageBase();
        String token = ExcelHttpUtils.getToken(host, port, username, password);
        String url = ExcelHttpUtils.getUrl(binDataVo.getConnectProtocol(), host, port);
        String docId = ExcelHttpUtils.getDocid(url, token, base);
        com.alibaba.fastjson2.JSONObject dirJson = ExcelHttpUtils.loadDir(url, token, docId);
        if (dirJson.containsKey("dirs")) {
            return true;
        } else {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.CONNECT_FAILED, dirJson.toJSONString(), Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    private Boolean tryConnectTingYun(BinDataVo binDataVo) {
        String protocol = binDataVo.getConnectProtocol();
        String host = binDataVo.getHost();
        int port = binDataVo.getPort();
        String apiKey = binDataVo.getAccount();
        String secretKey = decryptPassword(binDataVo.getPassword());
        try {
            String accessToken = TingYunHttpUtils.getAccessToken(protocol, host, port, apiKey, secretKey);
            TingYunHttpUtils.ping(protocol, host, port, accessToken);
            return true;
        } catch (Exception e) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.CONNECT_FAILED, e.getMessage(), Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    private Boolean tryConnectCatalog(String type, BinDataVo binData) {
        // 对于支持新扫描的数据源类型，使用元数据扫描的驱动连接逻辑
        if (DbConnectionStrategyFactory.supportNewScan(type)) {
            return tryConnectCatalogWithDriver(type, binData);
        }

        // 对于不支持新扫描的数据源类型，暂时返回 true
        // TODO: 后续可以为其他数据源类型实现专门的测试连接逻辑
        log.warn("数据源类型 {} 暂不支持使用驱动测试连接，跳过连接测试", type);
        return true;
    }

    /**
     * 使用 JDBC 驱动测试连接（共用元数据扫描的驱动逻辑）
     */
    private Boolean tryConnectCatalogWithDriver(String type, BinDataVo binData) {
        // 解密密码
        String password = decryptPassword(binData.getPassword());

        // 构建临时 DataSourceEntity 用于测试连接
        DataSourceEntity tempDataSource = new DataSourceEntity();
        tempDataSource.setFType(type);
        tempDataSource.setFHost(binData.getHost());
        tempDataSource.setFPort(binData.getPort());
        tempDataSource.setFDatabase(binData.getDatabaseName());
        tempDataSource.setFSchema(binData.getSchema());
        tempDataSource.setFAccount(binData.getAccount());
        tempDataSource.setFPassword(password);
        tempDataSource.setFToken(binData.getToken());
        tempDataSource.setFConnectProtocol(binData.getConnectProtocol());

        log.info("【测试连接】数据源类型:{}, 主机:{}, 端口:{}, 数据库:{}, 用户:{}",
                type, binData.getHost(), binData.getPort(), binData.getDatabaseName(), binData.getAccount());

        java.sql.Connection connection = null;
        try {
            // 使用与元数据扫描相同的连接策略
            DbClientInterface dbClient = DbConnectionStrategyFactory.getStrategy(type);

            // 构建连接配置
            String driverClass = DbConnectionStrategyFactory.DRIVER_CLASS_MAP.get(type);
            String jdbcUrl = DbConnectionStrategyFactory.getDriverURL(tempDataSource);

            log.info("【测试连接】驱动类:{}, JDBC URL:{}", driverClass, jdbcUrl);

            DataSourceConfig dataSourceConfig = new DataSourceConfig(
                    type,
                    driverClass,
                    jdbcUrl,
                    tempDataSource.getFAccount(),
                    password,
                    tempDataSource.getFToken()
            );

            // 尝试获取连接（如果连接失败会抛出异常）
            long startTime = System.currentTimeMillis();
            connection = dbClient.getConnection(dataSourceConfig);
            long connectionTime = System.currentTimeMillis() - startTime;

            // 验证连接是否有效
            if (connection != null && connection.isValid(5)) {
                log.info("【测试连接】成功! 连接耗时: {}ms", connectionTime);
                return true;
            } else {
                log.error("【测试连接】失败: 连接无效或超时");
                return false;
            }
        } catch (ClassNotFoundException e) {
            log.error("【测试连接】失败: 驱动类未找到 - {}", e.getMessage());
            throw new AiShuException(ErrorCodeEnum.BadRequest,
                    Description.CONNECT_FAILED,
                    "数据源驱动类未找到: " + type,
                    Message.MESSAGE_PARAM_ERROR_SOLUTION);
        } catch (java.sql.SQLException e) {
            log.error("【测试连接】失败: 数据库连接异常", e);
            throw new AiShuException(ErrorCodeEnum.BadRequest,
                    Description.CONNECT_FAILED,
                    "数据库连接失败: " + e.getMessage(),
                    Message.MESSAGE_PARAM_ERROR_SOLUTION);
        } catch (Exception e) {
            log.error("【测试连接】失败: 未知异常", e);
            throw new AiShuException(ErrorCodeEnum.BadRequest,
                    Description.CONNECT_FAILED,
                    "连接测试失败: " + e.getMessage(),
                    Message.MESSAGE_PARAM_ERROR_SOLUTION);
        } finally {
            // 关闭连接
            if (connection != null) {
                try {
                    connection.close();
                } catch (Exception e) {
                    log.warn("【测试连接】关闭连接时出现异常", e);
                }
            }
        }
    }

    private Boolean tryConnectOpenSearch(BinDataVo binData) {
        String password = decryptPassword(binData.getPassword());

        try {
            HttpHost host = new HttpHost(binData.getConnectProtocol(), binData.getHost(), binData.getPort());

            BasicCredentialsProvider credentialsProvider = new BasicCredentialsProvider();
            credentialsProvider.setCredentials(
                    new AuthScope(host),
                    new UsernamePasswordCredentials(binData.getAccount(), password.toCharArray())
            );

            try (RestClient restClient = RestClient.builder(host)
                    .setHttpClientConfigCallback(httpClientBuilder ->
                            httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider))
                    .build();
                 OpenSearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper())) {

                OpenSearchClient client = new OpenSearchClient(transport);
                //验证连接
                HealthResponse health = client.cluster().health();
                return true;
            }
        } catch (Exception e) {
            log.error("Failed to connect OpenSearch: {}:{}", binData.getHost(), binData.getPort(), e);
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.CONNECT_FAILED, e.getMessage(), Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    @Override
    public ResponseEntity<?> getDatasourceList(String userId, String userType, String keyword, String types, int limit, int offset, String sort, String direction) {
        JSONObject response = new JSONObject();
        JSONArray entries = new JSONArray();

        // 如果userId为空，使用匿名用户
        String actualUserId = StringUtils.isBlank(userId) ? "anonymous" : userId;
        String actualUserType = StringUtils.isBlank(userType) ? ResourceAuthConstant.USER_TYPE_USER : userType;

        List<String> connectors = null;
        if (StringUtils.isNotBlank(types)) {
            String[] typeList = types.split(",");
            connectors = getConnectorsByTypes(typeList);
        }

        //获取分页前的未认证的资源id列表
        List<DataSourceEntity> dsList = dataSourceMapper.selectDataSources(null, keyword, connectors);
        if (dsList.size() == 0) {
            response.set("entries", entries);
            response.set("total_count", 0);
            return ResponseEntity.ok(response);
        }
        // 修改：对于匿名用户，仍然返回数据，但不进行权限检查
        Set<String> dsIdSet = dsList.stream()
                .map(DataSourceEntity::getFId)
                .collect(Collectors.toSet());
        //根据有权限的id列表进行数据源分页查询
        List<DataSourceEntity> resultList = dataSourceMapper.selectPage(dsIdSet, keyword, connectors, offset, limit, sort, direction);
        long count = dataSourceMapper.selectCount(dsIdSet, keyword, connectors);


        Set<String> userIds = new HashSet<>();
        Set<String> dsIds = new HashSet<>();
        for (DataSourceEntity entity : resultList) {
            if (StringUtils.isNotBlank(entity.getFCreatedByUid())) {
                userIds.add(entity.getFCreatedByUid());
            }
            if (StringUtils.isNotBlank(entity.getFUpdatedByUid())) {
                userIds.add(entity.getFUpdatedByUid());
            }
            dsIds.add(entity.getFId());
        }
        //获取用户类型和名称
        Map<String, String[]> userInfosMap =null;//= UserManagement.batchGetUserInfosByUserIds(serviceEndpoints.getUserManagementPrivate(), userIds);

        //获取数据源最近一次任务状态
        List<TaskScanEntity> taskScanEntities;
        Map<String, Integer> statusMap = null;
        if (dsIds.size() > 0) {
            taskScanEntities = taskScanMapper.selectTaskStatusByDsIds(dsIds);
            statusMap = taskScanEntities.stream()
                    .collect(Collectors.toMap(
                            TaskScanEntity::getDsId,
                            TaskScanEntity::getScanStatus
                    ));
        }

        for (DataSourceEntity entity : resultList) {
            JSONObject entry = new JSONObject();
            entry.set("id", entity.getFId());
            entry.set("name", entity.getFName());
            entry.set("type", entity.getFType());
            entry.set("allow_multi_table_scan", entity.getFType().equals(ConnectorEnums.OPENSEARCH.getConnector()));

            JSONObject binData = new JSONObject();
            binData.set("catalog_name", entity.getFCatalog());
            binData.set("database_name", entity.getFDatabase());
            binData.set("schema", entity.getFSchema());
            binData.set("connect_protocol", entity.getFConnectProtocol());
            binData.set("host", entity.getFHost());
            binData.set("port", entity.getFPort());
            binData.set("account", entity.getFAccount());
            binData.set("password", entity.getFPassword());
            binData.set("storage_protocol", entity.getFStorageProtocol());
            binData.set("storage_base", entity.getFStorageBase());
            binData.set("token", entity.getFToken());
            binData.set("replica_set", entity.getFReplicaSet());
            entry.set("bin_data", binData);

            entry.set("is_built_in", DsBuiltInStatus.isBuiltIn(entity.getFIsBuiltIn()));
            entry.set("latest_task_status", ScanStatusEnum.fromCode(statusMap.getOrDefault(entity.getFId(), ScanStatusEnum.UNSCANNED.getCode())));
            entry.set("metadata_obtain_level", MetadataObtainLevel.getByDsType(entity.getFType()));
            entry.set("comment", StringUtils.isNotBlank(entity.getFComment()) ? entity.getFComment() : "");
            entry.set("operations", null);
            entry.set("created_by_uid", StringUtils.isNotBlank(entity.getFCreatedByUid()) ? entity.getFCreatedByUid() : "");
            entry.set("created_by_user_type","");// userInfosMap.get(entity.getFCreatedByUid()) != null ? userInfosMap.get(entity.getFCreatedByUid())[0] : "");
            entry.set("created_by_username","");// userInfosMap.get(entity.getFCreatedByUid()) != null ? userInfosMap.get(entity.getFCreatedByUid())[1] : "");
            entry.set("created_at", entity.getFCreatedAt().atZone(ZoneId.of("Asia/Shanghai")).toInstant().toEpochMilli());
            entry.set("updated_by_uid", StringUtils.isNotBlank(entity.getFUpdatedByUid()) ? entity.getFUpdatedByUid() : "");
            entry.set("updated_by_user_type","");// userInfosMap.get(entity.getFUpdatedByUid()) != null ? userInfosMap.get(entity.getFUpdatedByUid())[0] : "");
            entry.set("updated_by_username","");// userInfosMap.get(entity.getFUpdatedByUid()) != null ? userInfosMap.get(entity.getFUpdatedByUid())[1] : "");
            entry.set("updated_at", entity.getFUpdatedAt().atZone(ZoneId.of("Asia/Shanghai")).toInstant().toEpochMilli());
            entries.add(entry);
        }
        response.set("entries", entries);
        response.set("total_count", count);

        return ResponseEntity.ok(response);
    }
    @Override
    public ResponseEntity<?> getAssignableDatasourceList(String userId, String userType, String id, String keyword, int limit, int offset, String sort, String direction) {
        JSONObject response = new JSONObject();
        JSONArray entries = new JSONArray();

        //获取分页前的未认证的资源id列表
        List<DataSourceEntity> dsList = dataSourceMapper.selectDataSources(null, keyword, null);
        if (dsList.size() == 0) {
            response.set("entries", entries);
            response.set("total_count", 0);
            return ResponseEntity.ok(response);
        }
        List<ResourceAuthVo> resourceAuthList = new ArrayList<>();
        for (DataSourceEntity ds : dsList) {
            resourceAuthList.add(new ResourceAuthVo(ds.getFId(), ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE));
        }

        if (StringUtils.isBlank(userId)) {
            throw new AiShuException(ErrorCodeEnum.UnauthorizedError);
        }

        //获取有显示权限的数据源id列表，及获取对应id的资源权限列表
        Map<String, Object> idOperationsMap = Authorization.getAuthIdsByResourceIds(
                serviceEndpoints.getAuthorizationPrivate(),
                userId,
                userType,
                resourceAuthList,
                ResourceAuthConstant.RESOURCE_OPERATION_TYPE_DISPLAY);
        if (idOperationsMap.size() == 0) {
            response.set("entries", entries);
            response.set("total_count", 0);
            return ResponseEntity.ok(response);
        }

        //根据有权限的id列表进行数据源分页查询
        List<DataSourceEntity> resultList = dataSourceMapper.selectPage(idOperationsMap.keySet(), keyword, null, offset, limit, sort, direction);
        long count = dataSourceMapper.selectCount(idOperationsMap.keySet(), keyword, null);

        for (DataSourceEntity entity : resultList) {
            JSONObject entry = new JSONObject();
            entry.set("id", entity.getFId());
            entry.set("type", ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE);
            entry.set("name", entity.getFName());
            entries.add(entry);
        }
        response.set("entries", entries);
        response.set("total_count", count);

        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<?> getDatasource(String userId, String userType, String id) {
        DataSourceEntity entity = dataSourceMapper.selectById(id);
        if (entity == null) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.DATASOURCE_NOT_EXIST, Detail.ID_NOT_EXISTS, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }

        if (StringUtils.isBlank(userId)) {
            throw new AiShuException(ErrorCodeEnum.UnauthorizedError);
        }
        //判断是否有查看数据源的权限，及获取对应id的资源权限列表
        Map<String, Object> idOperationsMap = Authorization.getAuthIdsByResourceIds(
                serviceEndpoints.getAuthorizationPrivate(),
                userId,
                userType,
                Collections.singletonList(new ResourceAuthVo(entity.getFId(), ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE)),
                ResourceAuthConstant.RESOURCE_OPERATION_TYPE_VIEW_DETAIL);
        if (idOperationsMap.size() == 0) {
            throw new AiShuException(ErrorCodeEnum.ForbiddenError, String.format(Detail.RESOURCE_PERMISSION_ERROR, ResourceAuthConstant.RESOURCE_OPERATION_TYPE_VIEW_DETAIL));
        }

        //获取用户名称
        Set<String> userIds = new HashSet<>();
        if (StringUtils.isNotBlank(entity.getFCreatedByUid())) {
            userIds.add(entity.getFCreatedByUid());
        }
        if (StringUtils.isNotBlank(entity.getFUpdatedByUid())) {
            userIds.add(entity.getFUpdatedByUid());
        }
        Map<String, String[]> userInfosMap = UserManagement.batchGetUserInfosByUserIds(serviceEndpoints.getUserManagementPrivate(), userIds);

        //获取数据源最近一次任务状态
        List<TaskScanEntity> taskScanEntities = taskScanMapper.selectTaskStatusByDsIds(new HashSet<>(Collections.singletonList(id)));
        int status = taskScanEntities.size() == 1 ? taskScanEntities.get(0).getScanStatus() : ScanStatusEnum.UNSCANNED.getCode();

        JSONObject entry = new JSONObject();
        entry.set("id", entity.getFId());
        entry.set("name", entity.getFName());
        entry.set("type", entity.getFType());

        JSONObject binData = new JSONObject();
        binData.set("catalog_name", entity.getFCatalog());
        binData.set("database_name", entity.getFDatabase());
        binData.set("schema", entity.getFSchema());
        binData.set("connect_protocol", entity.getFConnectProtocol());
        binData.set("host", entity.getFHost());
        binData.set("port", entity.getFPort());
        binData.set("account", entity.getFAccount());
        binData.set("password", entity.getFPassword());
        binData.set("storage_protocol", entity.getFStorageProtocol());
        binData.set("storage_base", entity.getFStorageBase());
        binData.set("token", entity.getFToken());
        binData.set("replica_set", entity.getFReplicaSet());
        entry.set("bin_data", binData);

        entry.set("is_built_in", DsBuiltInStatus.isBuiltIn(entity.getFIsBuiltIn()));
        entry.set("latest_task_status", ScanStatusEnum.fromCode(status));
        entry.set("comment", StringUtils.isNotBlank(entity.getFComment()) ? entity.getFComment() : "");
        entry.set("operations", idOperationsMap.get(entity.getFId()));
        entry.set("created_by_uid", StringUtils.isNotBlank(entity.getFCreatedByUid()) ? entity.getFCreatedByUid() : "");
        entry.set("created_by_user_type", userInfosMap.get(entity.getFCreatedByUid()) != null ? userInfosMap.get(entity.getFCreatedByUid())[0] : "");
        entry.set("created_by_username", userInfosMap.get(entity.getFCreatedByUid()) != null ? userInfosMap.get(entity.getFCreatedByUid())[1] : "");
        entry.set("created_at", entity.getFCreatedAt().atZone(ZoneId.of("Asia/Shanghai")).toInstant().toEpochMilli());
        entry.set("updated_by_uid", StringUtils.isNotBlank(entity.getFUpdatedByUid()) ? entity.getFUpdatedByUid() : "");
        entry.set("updated_by_user_type", userInfosMap.get(entity.getFUpdatedByUid()) != null ? userInfosMap.get(entity.getFUpdatedByUid())[0] : "");
        entry.set("updated_by_username", userInfosMap.get(entity.getFUpdatedByUid()) != null ? userInfosMap.get(entity.getFUpdatedByUid())[1] : "");
        entry.set("updated_at", entity.getFUpdatedAt().atZone(ZoneId.of("Asia/Shanghai")).toInstant().toEpochMilli());
        return ResponseEntity.ok(entry);
    }

    @Override
    public ResponseEntity<?> getDatasourceStatistics(String id, String userId, String userType) {
        // 验证数据源是否存在
        DataSourceEntity entity = dataSourceMapper.selectById(id);
        if (entity == null) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.DATASOURCE_NOT_EXIST, Detail.ID_NOT_EXISTS, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }

        if (StringUtils.isBlank(userId)) {
            throw new AiShuException(ErrorCodeEnum.UnauthorizedError);
        }

        // 判断是否有查看数据源的权限
       // boolean isOk = Authorization.checkResourceOperation(
       //         serviceEndpoints.getAuthorizationPrivate(),
       //         userId,
        //        userType,
       //         new ResourceAuthVo(id, ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE),
        //        ResourceAuthConstant.RESOURCE_OPERATION_TYPE_VIEW_DETAIL);
       // if (!isOk) {
        //    throw new AiShuException(ErrorCodeEnum.ForbiddenError, String.format(Detail.RESOURCE_PERMISSION_ERROR, ResourceAuthConstant.RESOURCE_OPERATION_TYPE_VIEW_DETAIL));
        //}

        // 统计表总数
        long tableCount = tableScanMapper.selectCount(id, null);

        // 统计字段总数
        long fieldCount = fieldScanMapper.countByDataSourceId(id);

        // 统计不同扫描状态的表数量
        List<TableScanEntity> tables = tableScanMapper.selectByDsId(id);
        long scannedTableCount = tables.stream()
                .filter(t -> t.getFStatus() == ScanStatusEnum.SUCCESS.getCode())
                .count();
        long scanningTableCount = tables.stream()
                .filter(t -> t.getFStatus() == ScanStatusEnum.RUNNING.getCode())
                .count();
        long unscannedTableCount = tables.stream()
                .filter(t -> t.getFStatus() == ScanStatusEnum.UNSCANNED.getCode())
                .count();

        // ==================== 新增统计 ====================

        // 统计总行数
        long totalRows = tables.stream()
                .mapToLong(t -> t.getFTableRows() != null ? t.getFTableRows() : 0)
                .sum();

        // 统计有注释的表数量
        long tablesWithComment = tables.stream()
                .filter(t -> StringUtils.isNotBlank(t.getFDescription()))
                .count();

        // 统计有注释的字段数量
        long fieldsWithComment = 0;
        try {
            // 通过表ID列表查询所有字段
            List<String> tableIds = tables.stream()
                    .map(TableScanEntity::getFId)
                    .collect(java.util.stream.Collectors.toList());

            if (!tableIds.isEmpty()) {
                for (String tableId : tableIds) {
                    try {
                        List<FieldScanEntity> fields = fieldScanMapper.selectByTableId(tableId);
                        fieldsWithComment += fields.stream()
                                .filter(f -> StringUtils.isNotBlank(f.getFFieldComment()))
                                .count();
                    } catch (Exception e) {
                        log.debug("Failed to count fields for table: {}", tableId, e);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to count fields with comment for datasource: {}", id, e);
        }

        // 解析高级参数获取存储和索引信息
        long totalDataSize = 0;
        long totalIndexSize = 0;
        long totalSize = 0;
        long tablesWithPrimaryKey = 0;
        long tablesWithIndex = 0;
        long totalIndexCount = 0;

        for (TableScanEntity table : tables) {
            try {
                String advancedParams = table.getFAdvancedParams();
                if (StringUtils.isNotBlank(advancedParams)) {
                    try {
                        // 解析 JSON 格式的高级参数
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, Object>>> typeRef =
                            new com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, Object>>>() {};
                        List<java.util.Map<String, Object>> paramsList = mapper.readValue(advancedParams, typeRef);

                        if (paramsList != null && !paramsList.isEmpty()) {
                            for (java.util.Map<String, Object> params : paramsList) {
                                // 累加数据大小
                                Object dataSize = params.get("data_length");
                                if (dataSize != null) {
                                    try {
                                        totalDataSize += Long.parseLong(dataSize.toString());
                                    } catch (NumberFormatException e) {
                                        // 忽略解析错误
                                    }
                                }

                                // 累加索引大小
                                Object indexSize = params.get("index_length");
                                if (indexSize != null) {
                                    try {
                                        totalIndexSize += Long.parseLong(indexSize.toString());
                                    } catch (NumberFormatException e) {
                                        // 忽略解析错误
                                    }
                                }

                                // 检查是否有主键
                                Object hasPrimaryKey = params.get("has_primary_key");
                                if (Boolean.TRUE.equals(hasPrimaryKey) || "true".equalsIgnoreCase(String.valueOf(hasPrimaryKey))) {
                                    tablesWithPrimaryKey++;
                                }

                                // 检查是否有索引
                                Object indexCount = params.get("index_count");
                                if (indexCount != null) {
                                    try {
                                        int count = Integer.parseInt(indexCount.toString());
                                        if (count > 0) {
                                            tablesWithIndex++;
                                            totalIndexCount += count;
                                        }
                                    } catch (NumberFormatException e) {
                                        // 忽略解析错误
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Failed to parse advanced params for table: {}", table.getFId(), e);
                    }
                }
            } catch (Exception e) {
                log.warn("Error processing table statistics: {}", table.getFId(), e);
            }
        }

        totalSize = totalDataSize + totalIndexSize;

        // 构建返回结果
        DataSourceStatisticsVo statistics = new DataSourceStatisticsVo();
        statistics.setDataSourceId(id);
        statistics.setDataSourceName(entity.getFName());

        // 基础统计
        statistics.setTableCount(tableCount);
        statistics.setFieldCount(fieldCount);
        statistics.setScannedTableCount(scannedTableCount);
        statistics.setScanningTableCount(scanningTableCount);
        statistics.setUnscannedTableCount(unscannedTableCount);

        // 存储统计
        statistics.setTotalRows(totalRows);
        statistics.setTotalDataSize(totalDataSize);
        statistics.setTotalDataSizeFormatted(formatFileSize(totalDataSize));
        statistics.setTotalIndexSize(totalIndexSize);
        statistics.setTotalIndexSizeFormatted(formatFileSize(totalIndexSize));
        statistics.setTotalSize(totalSize);
        statistics.setTotalSizeFormatted(formatFileSize(totalSize));

        // 质量统计
        statistics.setTablesWithComment(tablesWithComment);
        statistics.setFieldsWithComment(fieldsWithComment);
        statistics.setTablesWithPrimaryKey(tablesWithPrimaryKey);
        statistics.setTablesWithIndex(tablesWithIndex);
        statistics.setTotalIndexCount(totalIndexCount);

        // ==================== 字段级别统计汇总 ====================
        // 遍历所有字段的 advanced_params，解析并计算汇总统计
        List<FieldScanEntity> allFields = new ArrayList<>();
        try {
            // 获取所有表ID
            List<String> tableIds = tables.stream()
                    .map(TableScanEntity::getFId)
                    .collect(java.util.stream.Collectors.toList());

            if (!tableIds.isEmpty()) {
                for (String tableId : tableIds) {
                    try {
                        List<FieldScanEntity> fields = fieldScanMapper.selectByTableId(tableId);
                        allFields.addAll(fields);
                    } catch (Exception e) {
                        log.debug("Failed to fetch fields for table: {}", tableId, e);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to collect fields for statistics: {}", id, e);
        }

        // 计算字段级别统计
        long analyzedFieldCount = 0;
        double totalNullRatio = 0.0;
        double maxNullRatio = 0.0;
        long highNullRatioFieldCount = 0;
        double totalUniqueRatio = 0.0;
        long uniqueFieldCount = 0;
        long fieldsWithDistributionCount = 0;

        for (FieldScanEntity field : allFields) {
            try {
                String advancedParams = field.getFAdvancedParams();
                if (StringUtils.isNotBlank(advancedParams)) {
                    try {
                        // 解析 JSON 格式的高级参数
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, Object>>> typeRef =
                            new com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, Object>>>() {};
                        List<java.util.Map<String, Object>> paramsList = mapper.readValue(advancedParams, typeRef);

                        if (paramsList != null && !paramsList.isEmpty()) {
                            // 将参数列表转换为 Map 以便查找
                            java.util.Map<String, Object> paramMap = new java.util.HashMap<>();
                            for (java.util.Map<String, Object> param : paramsList) {
                                if (param.containsKey("key") && param.containsKey("value")) {
                                    paramMap.put(String.valueOf(param.get("key")), param.get("value"));
                                }
                            }

                            analyzedFieldCount++;

                            // 解析空值率
                            Object nullRatioObj = paramMap.get("null_ratio");
                            if (nullRatioObj != null) {
                                try {
                                    double nullRatio = Double.parseDouble(String.valueOf(nullRatioObj));
                                    totalNullRatio += nullRatio;
                                    maxNullRatio = Math.max(maxNullRatio, nullRatio);
                                    if (nullRatio > 20.0) {  // 空值率 > 20%
                                        highNullRatioFieldCount++;
                                    }
                                } catch (NumberFormatException e) {
                                    // 忽略解析错误
                                }
                            }

                            // 解析唯一值占比
                            Object uniqueRatioObj = paramMap.get("unique_ratio");
                            if (uniqueRatioObj != null) {
                                try {
                                    double uniqueRatio = Double.parseDouble(String.valueOf(uniqueRatioObj));
                                    totalUniqueRatio += uniqueRatio;
                                    if (uniqueRatio > 95.0) {  // 唯一值占比 > 95%
                                        uniqueFieldCount++;
                                    }
                                } catch (NumberFormatException e) {
                                    // 忽略解析错误
                                }
                            }

                            // 检查是否有数据分布信息
                            Object valueDistribution = paramMap.get("value_distribution");
                            if (valueDistribution != null) {
                                fieldsWithDistributionCount++;
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Failed to parse advanced params for field: {}", field.getFId(), e);
                    }
                }
            } catch (Exception e) {
                log.debug("Error processing field statistics: {}", field.getFId(), e);
            }
        }

        // 设置字段级别汇总统计
        statistics.setAnalyzedFieldCount(analyzedFieldCount);

        if (analyzedFieldCount > 0) {
            statistics.setAvgNullRatio(totalNullRatio / analyzedFieldCount);
            statistics.setMaxNullRatio(maxNullRatio);
            statistics.setHighNullRatioFieldCount(highNullRatioFieldCount);
            statistics.setAvgUniqueRatio(totalUniqueRatio / analyzedFieldCount);
            statistics.setUniqueFieldCount(uniqueFieldCount);
            statistics.setFieldsWithDistributionCount(fieldsWithDistributionCount);
        }

        return ResponseEntity.ok(statistics);
    }

    /**
     * 格式化文件大小
     */
    private String formatFileSize(long bytes) {
        if (bytes <= 0) {
            return "0 B";
        }

        final String[] units = {"B", "KB", "MB", "GB", "TB", "PB"};
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        return String.format("%.1f %s", bytes / Math.pow(1024, digitGroups), units[digitGroups]);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> updateDatasource(HttpServletRequest request, DataSourceVo params, String id) {

        DataSourceEntity dataSourceEntity = dataSourceMapper.selectById(id);
        if (dataSourceEntity == null) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.DATASOURCE_NOT_EXIST, Detail.ID_NOT_EXISTS, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }

        // 内置数据源不能修改
        if (DsBuiltInStatus.isBuiltIn(dataSourceEntity.getFIsBuiltIn())) {
            throw new AiShuException(ErrorCodeEnum.BadRequest,
                    Description.BUILT_IN_DATASOURCE_CANNOT_MODIFY,
                    String.format(Detail.BUILT_IN_DATASOURCE_CANNOT_MODIFY, dataSourceEntity.getFName()),
                    Message.MESSAGE_OPERATION_EXECUTION);
        }

        // 有正在运行的扫描任务的数据源不能修改
        int taskCount = taskScanMapper.getTaskCountByDsIdAndScanStatus(id, ScanStatusEnum.RUNNING.getCode());
        if (taskCount > 0) {
            throw new AiShuException(ErrorCodeEnum.BadRequest,
                    Description.RUNNING_SCAN_TASK_EXIST,
                    String.format(Detail.RUNNING_SCAN_TASK_EXIST, id),
                    Message.MESSAGE_OPERATION_EXECUTION);
        }

        IntrospectInfo introspectInfo = CommonUtil.getOrCreateIntrospectInfo(request);
        String userId = StringUtils.defaultString(introspectInfo.getSub());
        String token = CommonUtil.getToken(request);
//        if (StringUtils.isBlank(userId)) {
//            throw new AiShuException(ErrorCodeEnum.UnauthorizedError);
//        }
//        //判断是否有修改数据源的权限
//        boolean isOk = Authorization.checkResourceOperation(
//                serviceEndpoints.getAuthorizationPrivate(),
//                userId,
//                introspectInfo.getAccountType(),
//                new ResourceAuthVo(id, ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE),
//                ResourceAuthConstant.RESOURCE_OPERATION_TYPE_MODIFY);
//        if (!isOk) {
//            throw new AiShuException(ErrorCodeEnum.ForbiddenError, String.format(Detail.RESOURCE_PERMISSION_ERROR, ResourceAuthConstant.RESOURCE_OPERATION_TYPE_MODIFY));
//        }

        String type = params.getType();
        BinDataVo binData = params.getBinData();

        //基本参数校验
        checkDataSourceParam(type, binData);

        //数据源类型不允许修改
        if (!dataSourceEntity.getFType().equals(type)) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, String.format(Detail.CATALOG_TYPE_ERROR, dataSourceEntity.getFName()));
        }

        // 连接方式不允许修改
        if (!dataSourceEntity.getFConnectProtocol().equals(binData.getConnectProtocol())) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.CONNECT_PROTOCOL_EDIT_ERROR);
        }

        // excel数据源，存储介质不允许修改
        if (type.equals(CatalogConstant.EXCEL_CATALOG) && !dataSourceEntity.getFStorageProtocol().equals(binData.getStorageProtocol())) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.STORAGE_PROTOCOL_EDIT_ERROR);
        }

        //数据源名称重名校验
        List<DataSourceEntity> list = dataSourceMapper.selectByCatalogNameAndId(params.getName(), id);
        if (!list.isEmpty()) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.DATASOURCE_NAME_EXIST, String.format(Detail.DATASOURCE_NAME_EXIST, params.getName()), Message.MESSAGE_Duplicated_SOLUTION);
        }

        //测试连接
        connect(token, type, binData);


        String oldDataSourceName = dataSourceEntity.getFName();
        dataSourceEntity.setFName(params.getName());
        dataSourceEntity.setFDatabase(binData.getDatabaseName());
        dataSourceEntity.setFSchema(binData.getSchema());
        dataSourceEntity.setFHost(binData.getHost());
        dataSourceEntity.setFPort(binData.getPort());
        dataSourceEntity.setFAccount(binData.getAccount());
        dataSourceEntity.setFPassword(binData.getPassword());
        dataSourceEntity.setFStorageBase(binData.getStorageBase());
        dataSourceEntity.setFToken(binData.getToken());
        dataSourceEntity.setFReplicaSet(binData.getReplicaSet());
        dataSourceEntity.setFComment(params.getComment());
        dataSourceEntity.setFUpdatedByUid(userId);
        dataSourceEntity.setFUpdatedAt(LocalDateTime.now());

        if (type.equals(CatalogConstant.EXCEL_CATALOG) && binData.getStorageProtocol().equals(CatalogConstant.STORAGE_PROTOCOL_DOCLIB)) {
            String[] parts = serviceEndpoints.getEfastPublic().replace("http://", "").split(":");
            dataSourceEntity.setFHost(parts[0]);
            dataSourceEntity.setFPort(Integer.parseInt(parts[1]));
        }

        //修改数据源记录
        dataSourceMapper.updateById(dataSourceEntity);



        //如果名称有改动，发送消息给认证服务
     //   if (!oldDataSourceName.equals(params.getName())) {
      //      ResourceModifyVo resource = new ResourceModifyVo(id, ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE, params.getName());
      //      String modifyMessage = CommonUtil.obj2json(resource);
       //     try {
       //         mqClient.pub(Topic.AUTHORIZATION_RESOURCE_NAME_MODIFY.getTopicName(), modifyMessage);
       //     } catch (Exception e) {
        //        log.error("修改数据源{}成功，发送修改数据源名称消息失败。", params.getName(), e);
        //    }
       // }

        //日志
//        AuditLog auditLog = AuditLog.newAuditLog()
//                .withOperation(OperationType.UPDATE)
//                .withOperator(buildOperator(request))
//                .withObject(new LogObject(ObjectType.DATA_SOURCE, params.getName(), dataSourceEntity.getFId()))
//                .generateDescription();
//        String message = CommonUtil.obj2json(auditLog);
//        log.info(message);
//
//        //发送审计日志消息
//        try {
//            mqClient.pub(Topic.ISF_AUDIT_LOG_LOG.getTopicName(), message);
//        } catch (Exception e) {
//            log.error("修改数据源{}成功，发送审计日志消息失败。", params.getName(), e);
//        }
//        //发送数据源创建消息
//        JSONObject dataSourceMessage = new JSONObject();
//        JSONObject header = new JSONObject();
//        JSONObject payload = new JSONObject();
//
//        // 设置header部分
//        header.set("method", "update"); // 或 "update" 根据操作类型
//
//        // 设置payload部分
//        payload.set("id", dataSourceEntity.getFId());
//        payload.set("name", params.getName());
//        payload.set("type", params.getType()); // 需要实现getTypeCode方法将类型转换为数字
//        payload.set("database_name", binData.getDatabaseName());
//        payload.set("catalog_name", dataSourceEntity.getFCatalog());
//        payload.set("schema", binData.getSchema());
//        payload.set("connect_status", "Connecting");
//        payload.set("update_time", System.currentTimeMillis() * 1000000 + RandomStringUtils.randomNumeric(9)); // 示例时间戳
//
//        // 组合完整消息
//        dataSourceMessage.set("header", header);
//        dataSourceMessage.set("payload", payload);
//
//        // 发送消息的代码示例（根据实际需求调整）
//        try {
//            mqClient.pub(Topic.AF_DATASOURCE_MESSAGE_TOPIC.getTopicName(), dataSourceMessage.toString());
//        } catch (Exception e) {
//            log.error("发送数据源消息失败消息失败", e);
//        }

        JSONObject response = new JSONObject();
        response.set("id", id);
        response.set("name", params.getName());
        return ResponseEntity.ok(response);
    }

    private JSONObject buildProperties(String token, String catalogName, String type, BinDataVo params) {
        JSONObject properties = new JSONObject();

        String password = decryptPassword(params.getPassword());

        if (type.equals(CatalogConstant.EXCEL_CATALOG)) {
            properties.set("excel.catalog", catalogName);
            properties.set("excel.protocol", params.getStorageProtocol());
            //excel数据源，存储介质是文档库时，存储地址设置为docid,host和post为文档库的内部服务efast-private:9123
            if (params.getStorageProtocol().equals(CatalogConstant.STORAGE_PROTOCOL_DOCLIB)) {
                String docid = ExcelHttpUtils.getDocid(serviceEndpoints.getEfastPublic(), token, params.getStorageBase());
                String[] parts = serviceEndpoints.getEfastPrivate().replace("http://", "").split(":");
                properties.set("excel.host", parts[0]);
                properties.set("excel.port", Integer.parseInt(parts[1]));
                properties.set("excel.base", docid);
            } else {
                properties.set("excel.host", params.getHost());
                properties.set("excel.port", params.getPort());
                properties.set("excel.username", params.getAccount());
                properties.set("excel.password", password);
                properties.set("excel.base", params.getStorageBase());
            }
        } else if (type.equals(CatalogConstant.MONGO_CATALOG)) {
            properties.set("mongodb.seeds", params.getHost() + ":" + params.getPort());
            properties.set("mongodb.credentials", params.getAccount() + ":" + password + "@" + params.getDatabaseName());
            if (StringUtils.isNotBlank(params.getReplicaSet())) {
                properties.set("mongodb.required-replica-set", params.getReplicaSet());
            }
        } else {
            String jdbcUrlPrefix = getJdbcUrlPrefix(type);
            String jdbcUrl;
            switch (type) {
                case CatalogConstant.OPENGAUSS_CATALOG:
                case CatalogConstant.GAUSSDB_CATALOG:
                case CatalogConstant.POSTGRESQL_CATALOG:
                case CatalogConstant.HOLOGRES_CATALOG:
                case CatalogConstant.KINGBASE_CATALOG:
                case CatalogConstant.INCEPTOR_JDBC_CATALOG:
                    jdbcUrl = jdbcUrlPrefix + "//" + params.getHost() + ":" + params.getPort() + "/" + params.getDatabaseName();
                    break;
                case CatalogConstant.SQLSERVER_CATALOG:
                    jdbcUrl = jdbcUrlPrefix + "//" + params.getHost() + ":" + params.getPort() + ";databaseName=" + params.getDatabaseName();
                    break;
                case CatalogConstant.ORACLE_CATALOG:
                    jdbcUrl = jdbcUrlPrefix + "thin:@" + params.getHost() + ":" + params.getPort() + "/" + params.getDatabaseName();
                    break;
                case CatalogConstant.MAXCOMPUTE_CATALOG:
                    jdbcUrl = "jdbc:odps:" + params.getConnectProtocol() + "://" + params.getHost() + ":" + params.getPort()
                            + "/api?project=" + params.getDatabaseName() + "&enable_limit=false&fetchResultThreadNum=10&autoSelectLimit=" + 99999999999L;
                    break;
                case CatalogConstant.MYSQL_CATALOG:
                    jdbcUrl = jdbcUrlPrefix + "//" + params.getHost() + ":" + params.getPort() + "?useSSL=false";
                    break;
                default:
                    jdbcUrl = jdbcUrlPrefix + "//" + params.getHost() + ":" + params.getPort();
                    break;
            }

            if (type.equals(CatalogConstant.HIVE_HADOOP2_CATALOG)) {
                properties.set(CatalogConstant.HIVE_METASTORE_URI, jdbcUrl);
                properties.set(CatalogConstant.HIVE_ALLOW_DROP_TABLE, true);
                properties.set(CatalogConstant.HIVE_ALLOW_TRUNCATE_TABLE, true);
                properties.set(CatalogConstant.HIVE_MAX_PARTITIONS_PER_WRITERS, 1000);
            } else {
                properties.set(CatalogConstant.CONNECTION_URL, jdbcUrl);
            }

            if (StringUtils.isNotBlank(params.getAccount())) {
                properties.set(CatalogConstant.USER, params.getAccount());
                properties.set(CatalogConstant.PASSWORD, password);
            } else {
                properties.set(CatalogConstant.CONNECTION_URL, jdbcUrl + ";guardianToken=" + params.getToken());
                properties.set(CatalogConstant.USER, "");
                properties.set(CatalogConstant.PASSWORD, "");
            }

            if (StringUtils.equalsIgnoreCase(CatalogConstant.MYSQL_CATALOG, type) || StringUtils.equalsIgnoreCase(CatalogConstant.MARIA_CATALOG, type)
                    || StringUtils.equalsIgnoreCase(CatalogConstant.HIVE_JDBC_CATALOG, type) || StringUtils.equalsIgnoreCase(CatalogConstant.INCEPTOR_JDBC_CATALOG, type)
                    || StringUtils.equalsIgnoreCase(CatalogConstant.POSTGRESQL_CATALOG, type) || StringUtils.equalsIgnoreCase(CatalogConstant.HOLOGRES_CATALOG, type)
                    || StringUtils.equalsIgnoreCase(CatalogConstant.DAMENG_CATALOG, type) || StringUtils.equalsIgnoreCase(CatalogConstant.KINGBASE_CATALOG, type)
                    || StringUtils.equalsIgnoreCase(CatalogConstant.DORIS_CATALOG, type) || StringUtils.equalsIgnoreCase(CatalogConstant.OPENGAUSS_CATALOG, type)
                    || StringUtils.equalsIgnoreCase(CatalogConstant.GAUSSDB_CATALOG, type) || StringUtils.equalsIgnoreCase(CatalogConstant.MAXCOMPUTE_CATALOG, type)
                    || StringUtils.equalsIgnoreCase(CatalogConstant.ORACLE_CATALOG, type)) {
                properties.set(CatalogConstant.PUSH_DOWN_MODULE, pushDownModule);
            }

//            if (StringUtils.equalsIgnoreCase(CatalogConstant.ORACLE_CATALOG, type)) {
//                properties.set(CatalogConstant.CASE_INSENSITIVE_NAME, false);
//            }

            if (StringUtils.equalsIgnoreCase(CatalogConstant.MAXCOMPUTE_CATALOG, type)
                    || StringUtils.equalsIgnoreCase(CatalogConstant.HOLOGRES_CATALOG, type)
                    || StringUtils.equalsIgnoreCase(CatalogConstant.POSTGRESQL_CATALOG, type)) {
                properties.set(CatalogConstant.METADATA_CACHE_GLOBAL, true);
                properties.set(CatalogConstant.METADATA_CACHE_TTL, "60s");
                properties.set(CatalogConstant.METADATA_CACHE_MAXIMUM_SIZE, 50000);
                properties.set(CatalogConstant.METADATA_CACHE_ENABLED, true);
            }

            // 连接池配置
//            properties.set(CatalogConstant.USE_CONNECTION_POOL, true);
//            properties.set(CatalogConstant.JDBC_CONNECTION_POOL_BLOCKWHENEXHAUSTED, false);
        }
        return properties;
    }

    private String getJdbcUrlPrefix(String type) {
        switch (type) {
            case CatalogConstant.MYSQL_CATALOG:
            case CatalogConstant.DORIS_CATALOG:
                return CatalogConstant.MYSQL_URL;
            case CatalogConstant.MARIA_CATALOG:
                return CatalogConstant.MARIADB_URL;
            case CatalogConstant.POSTGRESQL_CATALOG:
            case CatalogConstant.HOLOGRES_CATALOG:
            case CatalogConstant.OPENGAUSS_CATALOG:
            case CatalogConstant.GAUSSDB_CATALOG:
            case CatalogConstant.KINGBASE_CATALOG:
                return CatalogConstant.POSTGRESQL_URL;
            case CatalogConstant.SQLSERVER_CATALOG:
                return CatalogConstant.SQLSERVER_URL;
            case CatalogConstant.ORACLE_CATALOG:
                return CatalogConstant.ORACLE_URL;
            case CatalogConstant.HIVE_JDBC_CATALOG:
                return CatalogConstant.HIVE_URL;
            case CatalogConstant.HIVE_HADOOP2_CATALOG:
                return CatalogConstant.HIVE_THRIFT_URL;
            case CatalogConstant.CLICKHOUSE_CATALOG:
                return CatalogConstant.CLICKHOUSE_URL;
            case CatalogConstant.INCEPTOR_JDBC_CATALOG:
                return CatalogConstant.INCEPTOR_JDBC_URL;
            case CatalogConstant.DAMENG_CATALOG:
                return CatalogConstant.DAMENG_URL;
            default:
                return null;
        }
    }

    public void delete(String name) {
        if (StringUtils.isBlank(name)) {
            throw new AiShuException(ErrorCodeEnum.BadRequest);
        }

        if (StringUtils.equalsIgnoreCase(CatalogConstant.OLK_VIEW_VDM, name)) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.BUILT_IN_CATALOG_DEL_UNSUPPORTED);
        }

        if (!Calculate.getCatalogNameList(serviceEndpoints.getVegaCalculateCoordinator()).contains(name)) {
            log.error("数据源不存在,catalogName:{}", name);
            throw new AiShuException(ErrorCodeEnum.InternalServerError, Description.CATALOG_NOT_EXIST, name, Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }

        Calculate.deleteCatalog(serviceEndpoints.getVegaCalculateCoordinator(), name);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> deleteDatasource(HttpServletRequest request, String id) {

        DataSourceEntity dataSourceEntity = dataSourceMapper.selectById(id);
        if (dataSourceEntity == null) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Description.DATASOURCE_NOT_EXIST, Detail.ID_NOT_EXISTS, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }

        // 内置数据源不能删除
        if (DsBuiltInStatus.isBuiltIn(dataSourceEntity.getFIsBuiltIn())) {
            throw new AiShuException(ErrorCodeEnum.BadRequest,
                    Description.BUILT_IN_DATASOURCE_CANNOT_DELETE,
                    String.format(Detail.BUILT_IN_DATASOURCE_CANNOT_DELETE, dataSourceEntity.getFName()),
                    Message.MESSAGE_OPERATION_EXECUTION);
        }

        // 有正在运行的扫描任务的数据源不能删除
        int taskCount = taskScanMapper.getTaskCountByDsIdAndScanStatus(id, ScanStatusEnum.RUNNING.getCode());
        if (taskCount > 0) {
            throw new AiShuException(ErrorCodeEnum.BadRequest,
                    Description.RUNNING_SCAN_TASK_EXIST,
                    String.format(Detail.RUNNING_SCAN_TASK_EXIST, id),
                    Message.MESSAGE_OPERATION_EXECUTION);
        }

        IntrospectInfo introspectInfo = CommonUtil.getOrCreateIntrospectInfo(request);
        String userId = StringUtils.defaultString(introspectInfo.getSub());
//        if (StringUtils.isBlank(userId)) {
//            throw new AiShuException(ErrorCodeEnum.UnauthorizedError);
//        }
//        //判断是否有删除数据源的权限
//        boolean isOk = Authorization.checkResourceOperation(
//                serviceEndpoints.getAuthorizationPrivate(),
//                userId,
//                introspectInfo.getAccountType(),
//                new ResourceAuthVo(id, ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE),
//                ResourceAuthConstant.RESOURCE_OPERATION_TYPE_DELETE);
//        if (!isOk) {
//            throw new AiShuException(ErrorCodeEnum.ForbiddenError, String.format(Detail.RESOURCE_PERMISSION_ERROR, ResourceAuthConstant.RESOURCE_OPERATION_TYPE_DELETE));
//        }

        dataSourceMapper.deleteById(id);
        // 删除相关资源：task table field
        deleteResource(id);
        //清除catalog相关数据
        if (!dataSourceEntity.getFType().equals(CatalogConstant.TINGYUN_CATALOG)
                && !dataSourceEntity.getFType().equals(CatalogConstant.ANYSHARE7_CATALOG)
                && !dataSourceEntity.getFType().equals(CatalogConstant.OPENSEARCH_CATALOG)) {
            if (dataSourceEntity.getFType().equals(CatalogConstant.EXCEL_CATALOG)) {
                deleteAllExcelTables(id);
            }
            catalogRuleMapper.deleteByCatalogName(dataSourceEntity.getFCatalog());
            delete(dataSourceEntity.getFCatalog());
        }

//        //清除资源权限
//        try {
//            Authorization.deleteResourceOperations(serviceEndpoints.getAuthorizationPrivate(), id, ResourceAuthConstant.RESOURCE_TYPE_DATA_SOURCE);
//        } catch (Exception e) {
//            log.error("删除数据源{}成功，删除资源权限失败。", dataSourceEntity.getFName(), e);
//        }

        //日志
//        AuditLog auditLog = AuditLog.newAuditLog()
//                .withOperation(OperationType.DELETE)
//                .withOperator(buildOperator(request))
//                .withObject(new LogObject(ObjectType.DATA_SOURCE, dataSourceEntity.getFName(), dataSourceEntity.getFId()))
//                .generateDescription();
//        String message = CommonUtil.obj2json(auditLog);
//        log.info(message);
//
//        //发送审计日志消息
//        try {
//            mqClient.pub(Topic.ISF_AUDIT_LOG_LOG.getTopicName(), message);
//        } catch (Exception e) {
//            log.error("删除数据源{}成功，发送审计日志消息失败。", dataSourceEntity.getFName(), e);
//        }
//        //发送数据源创建消息
//        JSONObject dataSourceMessage = new JSONObject();
//        JSONObject header = new JSONObject();
//        JSONObject payload = new JSONObject();
//
//        // 设置header部分
//        header.set("method", "delete"); // 或 "update" 根据操作类型
//        // 设置payload部分
//        payload.set("id", dataSourceEntity.getFId());
//        // 组合完整消息
//        dataSourceMessage.set("header", header);
//        dataSourceMessage.set("payload", payload);
//
//        // 发送消息的代码示例（根据实际需求调整）
//        try {
//            mqClient.pub(Topic.AF_DATASOURCE_MESSAGE_TOPIC.getTopicName(), dataSourceMessage.toString());
//        } catch (Exception e) {
//            log.error("发送数据源消息失败消息失败", e);
//        }

        JSONObject response = new JSONObject();
        response.set("id", id);
        response.set("name", dataSourceEntity.getFName());
        return ResponseEntity.ok(response);

    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteAllExcelTables(String dataSourceId) {
        QueryWrapper<TableScanEntity> tableWrapper = new QueryWrapper<>();
        tableWrapper.eq("f_data_source_id", dataSourceId);

        List<TableScanEntity> tableScanEntityList = tableScanMapper.selectList(tableWrapper);

        Date now = new Date();
        int tableScanCount = tableScanMapper.deleteByDataSourceId(dataSourceId, now);
        log.info("删除excel表配置:{}", tableScanCount);
        int columnConfigCount = 0;
        for (TableScanEntity tableScanEntity : tableScanEntityList) {
            columnConfigCount += fieldScanMapper.deleteByTableId(tableScanEntity.getFId(), now);
        }
        log.info("删除excel列配置:{}", columnConfigCount);
    }


    /**
     * RSA解密password密文
     */
    private String decryptPassword(String encryptedData) {
        if (encryptedData == null) {
            return "";
        }
        try {
            return RSAUtil.decrypt(encryptedData);
        } catch (Exception e) {
            log.error("密码解密失败。", e);
            throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.PASSWORD_ERROR);
        }
    }

    private Operator buildOperator(HttpServletRequest request) {
        IntrospectInfo introspectInfo = CommonUtil.getOrCreateIntrospectInfo(request);
        OperatorType operatorType;
        if (introspectInfo.isAppUser()) {
            operatorType = OperatorType.APP;
        } else {
            operatorType = OperatorType.visitorTypeMap.getOrDefault(introspectInfo.getExt().getVisitorType(), OperatorType.INTERNAL_SERVICE);
        }

        OperatorAgent operatorAgent = null;
        if (operatorType.equals(OperatorType.ANONYMOUS_USER)) {
            operatorAgent = new OperatorAgent();
            operatorAgent.setOperatorAgentType(AgentType.WEB);
        } else if (operatorType.equals(OperatorType.AUTHENTICATED_USER)) {
            operatorAgent = OperatorAgent.builder()
                    .operatorAgentType(AgentType.fromCode(introspectInfo.getExt().getClientType()))
                    .operatorAgentIp(StringUtils.defaultString(introspectInfo.getExt().getLoginIp()))
                    .operatorAgentMac(StringUtils.defaultString(request.getHeader(Constants.HEADER_MAC_KEY)))
                    .build();
        }

        String operatorName = null;
        if (operatorType.equals(OperatorType.INTERNAL_SERVICE)) {
            operatorName = operatorType.getDescription();
        } else if (operatorType.equals(OperatorType.AUTHENTICATED_USER)) {
            Map<String, String[]> userInfosMap = UserManagement.batchGetUserInfosByUserIds(
                    serviceEndpoints.getUserManagementPrivate(),
                    Collections.singleton(introspectInfo.getSub()));
            operatorName = userInfosMap.get(introspectInfo.getSub()) != null ? userInfosMap.get(introspectInfo.getSub())[1] : null;
        }

        return Operator.builder()
                .operatorId(StringUtils.defaultString(introspectInfo.getSub()))
                .operatorName(operatorName)
                .operatorType(operatorType)
                .operatorAgent(operatorAgent)
                .build();
    }

    @Override
    public ResponseEntity<?> connectorList(String type) {

        Stream<ConnectorEnums> connectorStream = Arrays.stream(ConnectorEnums.values());

        if (StringUtils.isNotBlank(type)) {
            connectorStream = connectorStream.filter(connectorEnum -> type.equals(connectorEnum.getType()));
        }

        List<ConnectorVo> connectorVoList = connectorStream
                .map(connectorEnum -> {
                    ConnectorVo connectorVo = new ConnectorVo();
                    connectorVo.setOlkConnectorName(connectorEnum.getConnector());
                    connectorVo.setShowConnectorName(connectorEnum.getMapping());
                    connectorVo.setType(connectorEnum.getType());
                    connectorVo.setConnectProtocol(connectorEnum.getConnectProtocol());
                    return connectorVo;
                })
                .collect(Collectors.toList());

        ConnectorVos connectorVos = new ConnectorVos();
        connectorVos.setConnectors(connectorVoList);
        return ResponseEntity.ok(connectorVos);
    }

    private List<String> getConnectorsByTypes(String[] types) {
        return Arrays.stream(ConnectorEnums.values())
                .filter(connector -> Arrays.stream(types)
                        .anyMatch(type -> connector.getType().equalsIgnoreCase(type)))
                .map(ConnectorEnums::getConnector)
                .collect(Collectors.toList());
    }

    public void deleteResource(String dsId) {
        log.info("---开始删除dsId：{}相关资源---", dsId);
        // 删除task
        taskScanMapper.delByDsId(dsId);
        log.info("删除t_task_scan成功:dsId:{}", dsId);
        // 删除t_task_scan_table
        taskScanTableMapper.delByDsId(dsId);
        // 删除t_task_scan_schedule
        TaskScanScheduleEntity taskScanScheduleEntity = taskScanScheduleMapper.selectByDsId(dsId);
        if (taskScanScheduleEntity != null) {
            String jobId = taskScanScheduleEntity.getId();
            boolean getLock = LockUtil.SCHEDULE_SCAN_TASK_LOCK.tryLock(jobId,
                    0,
                    TimeUnit.SECONDS,
                    true);
            if (getLock) {
                try {
                    ScheduledFuture<?> scheduledTask = CommonUtil.SCHEDULE_JOB_MAP.get(jobId);
                    if (scheduledTask != null) {
                        // 取消任务调度
                        scheduledTask.cancel(true);
                        // 从映射表移除
                        CommonUtil.SCHEDULE_JOB_MAP.remove(jobId);
                        log.info("定时任务ID：{}，删除成功", jobId);
                    } else {
                        log.warn("定时任务ID：{}，不存在，删除失败", jobId);
                    }
                } catch (Exception e) {
                    log.error("定时任务ID：{}，删除失败", jobId, e);
                    throw new RuntimeException(e);
                } finally {
                    if (LockUtil.SCHEDULE_SCAN_TASK_LOCK.isHoldingLock(jobId)) {
                        LockUtil.SCHEDULE_SCAN_TASK_LOCK.unlock(jobId);
                    }
                }
            }
            taskScanScheduleMapper.deleteById(jobId);
            log.info("删除t_task_scan_schedule成功:jobId:{}", jobId);
        }
        log.info("删除t_task_scan_table成功:dsId:{}", dsId);
        fieldScanMapper.deleteByDsId(dsId);
        log.info("删除t_table_field_scan成功:dsId:{}", dsId);
        // 删除table和field
        tableScanMapper.deleteBysId(dsId);
        log.info("删除t_table_scan成功:dsId:{}", dsId);
        // 删除table和field[old]
        fieldOldMapper.deleteByDsId(dsId);
        log.info("删除t_table_field成功:dsId:{}", dsId);
        tableOldMapper.deleteBysId(dsId);
        log.info("删除t_table成功:dsId:{}", dsId);
        log.info("---成功删除dsId：{}相关资源---", dsId);
    }

    public static boolean isExcelFile(String fileName) {
        return StringUtils.isNotEmpty(fileName) && fileName.toLowerCase().endsWith(".xlsx");
    }

    public static void checkDataSourceParam(String type, BinDataVo binData) {

        // 检查host和port
        boolean isDocLibExcel = StringUtils.equals(type, CatalogConstant.EXCEL_CATALOG)
                && StringUtils.equals(binData.getStorageProtocol(), CatalogConstant.STORAGE_PROTOCOL_DOCLIB);
        if (!isDocLibExcel) {
            if (StringUtils.isBlank(binData.getHost())) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.HOST_NOT_EMPLOY);
            }
            if (binData.getPort() <= 0) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.PORT_NOT_EMPLOY);
            }
        }

        //检查database
        if (!type.equals(CatalogConstant.EXCEL_CATALOG)
                && !type.equals(CatalogConstant.TINGYUN_CATALOG)
                && !type.equals(CatalogConstant.ANYSHARE7_CATALOG)
                && !type.equals(CatalogConstant.OPENSEARCH_CATALOG)
                && StringUtils.isBlank(binData.getDatabaseName())) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.DATABASE_NAME_NOT_EMPLOY);
        }


        //检查excel存储介质和存储地址

        if (type.equals(CatalogConstant.EXCEL_CATALOG)) {
            if (StringUtils.isBlank(binData.getStorageProtocol()) || StringUtils.isBlank(binData.getStorageBase())) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.EXCEL_BASE_AND_PROTOCOL_NOT_EMPLOY);
            } else if (!ArrayUtil.contains(EXCEL_PROTOCOLS, binData.getStorageProtocol())) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.EXCEL_PROTOCOL_ILLEGAL);
            }
        }

        //检查anyshare存储地址
        if (type.equals(CatalogConstant.ANYSHARE7_CATALOG) && StringUtils.isBlank(binData.getStorageBase())) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.BASE_NOT_EMPLOY);
        }

        //检查schema
        if ((StringUtils.equals(type, CatalogConstant.POSTGRESQL_CATALOG)
                || StringUtils.equals(type, CatalogConstant.ORACLE_CATALOG)
                || StringUtils.equals(type, CatalogConstant.SQLSERVER_CATALOG)
                || StringUtils.equals(type, CatalogConstant.HOLOGRES_CATALOG)
                || StringUtils.equals(type, CatalogConstant.OPENGAUSS_CATALOG)
                || StringUtils.equals(type, CatalogConstant.GAUSSDB_CATALOG)
                || StringUtils.equals(type, CatalogConstant.KINGBASE_CATALOG))
                && StringUtils.isBlank(binData.getSchema())) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.SCHEMA_NOT_NULL);
        }

        //检查认证信息
        if (StringUtils.isBlank(binData.getAccount()) || StringUtils.isBlank(binData.getPassword())) {
            if (!type.equals(CatalogConstant.INCEPTOR_JDBC_CATALOG)
                    && !(StringUtils.equals(type, CatalogConstant.EXCEL_CATALOG) && binData.getStorageProtocol().equals(CatalogConstant.STORAGE_PROTOCOL_DOCLIB))) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.USERNAME_OR_PASSWORD_NOT_EMPLOY);
            }
            if (type.equals(CatalogConstant.INCEPTOR_JDBC_CATALOG) && StringUtils.isBlank(binData.getToken())) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.DATASOURCE_AUTH_NOT_EMPLOY);
            }
        }

        //检查连接方式
        String[] connectorProtocol = ConnectorEnums.fromConnector(type).getConnectProtocol().split(",");
        if (!StringUtils.inStringIgnoreCase(binData.getConnectProtocol(), connectorProtocol)) {
            throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.CONNECTOR_PROTOCOL_UNSUPPORTED);
        } else if (StringUtils.equals(type, CatalogConstant.EXCEL_CATALOG)) {
            if (StringUtils.equals(binData.getStorageProtocol(), CatalogConstant.STORAGE_PROTOCOL_ANYSHARE)
                    && StringUtils.equals(binData.getConnectProtocol(), "http")) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.CONNECTOR_PROTOCOL_UNSUPPORTED);
            } else if (StringUtils.equals(binData.getStorageProtocol(), CatalogConstant.STORAGE_PROTOCOL_DOCLIB)
                    && StringUtils.equals(binData.getConnectProtocol(), "https")) {
                throw new AiShuException(ErrorCodeEnum.BadRequest, Detail.CONNECTOR_PROTOCOL_UNSUPPORTED);
            }
        }

        initDataSourceParam(type, binData);
    }

    public static void initDataSourceParam(String type, BinDataVo binData) {

        //检查database
        if (type.equals(CatalogConstant.EXCEL_CATALOG)
                || type.equals(CatalogConstant.TINGYUN_CATALOG)
                || type.equals(CatalogConstant.ANYSHARE7_CATALOG)
                || type.equals(CatalogConstant.OPENSEARCH_CATALOG)) {
            binData.setDatabaseName(null);
        }

        //检查schema
        if (StringUtils.equals(type, CatalogConstant.EXCEL_CATALOG)
                || StringUtils.equals(type, CatalogConstant.OPENSEARCH_CATALOG)) {
            binData.setSchema(CatalogConstant.VIEW_DEFAULT_SCHEMA);
        } else if (!StringUtils.equals(type, CatalogConstant.POSTGRESQL_CATALOG)
                && !StringUtils.equals(type, CatalogConstant.ORACLE_CATALOG)
                && !StringUtils.equals(type, CatalogConstant.SQLSERVER_CATALOG)
                && !StringUtils.equals(type, CatalogConstant.HOLOGRES_CATALOG)
                && !StringUtils.equals(type, CatalogConstant.OPENGAUSS_CATALOG)
                && !StringUtils.equals(type, CatalogConstant.GAUSSDB_CATALOG)
                && !StringUtils.equals(type, CatalogConstant.KINGBASE_CATALOG)) {
            binData.setSchema(null);
        }

        //检查认证信息
        if (StringUtils.equals(type, CatalogConstant.INCEPTOR_JDBC_CATALOG) && StringUtils.isNotBlank(binData.getToken())) {
            binData.setAccount(null);
            binData.setPassword(null);
        } else if (type.equals(CatalogConstant.EXCEL_CATALOG) && binData.getStorageProtocol().equals(CatalogConstant.STORAGE_PROTOCOL_DOCLIB)) {
            binData.setAccount(null);
            binData.setPassword(null);
            binData.setToken(null);
        } else {
            binData.setToken(null);
        }

        //检查存储介质
        if (!type.equals(CatalogConstant.EXCEL_CATALOG)) {
            binData.setStorageProtocol(null);
        }

        //检查存储地址
        if (!type.equals(CatalogConstant.EXCEL_CATALOG)
                && !type.equals(CatalogConstant.ANYSHARE7_CATALOG)) {
            binData.setStorageBase(null);
        }

        //检查mongo副本集
        if (!type.equals(CatalogConstant.MONGO_CATALOG)) {
            binData.setReplicaSet(null);
        }
    }

}
