package com.eisoo.dc.main;

import cn.hutool.core.io.IORuntimeException;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.driven.Authorization;
import com.eisoo.dc.common.driven.Calculate;
import com.eisoo.dc.common.driven.Hydra;
import com.eisoo.dc.common.driven.UserManagement;
import com.eisoo.dc.common.metadata.entity.TableScanEntity;
import com.eisoo.dc.common.metadata.mapper.*;
import com.eisoo.dc.common.util.http.ExcelHttpUtils;
import com.eisoo.dc.common.util.http.EtrinoHttpUtils;
import com.eisoo.dc.common.util.http.TingYunHttpUtils;
import com.eisoo.dc.common.vo.Ext;
import com.eisoo.dc.common.vo.IntrospectInfo;
import com.eisoo.dc.common.webfilter.Auth2ProxyFilter;
import com.eisoo.dc.common.metadata.entity.DataSourceEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.runner.RunWith;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@SpringBootTest
@EmbeddedKafka(
        partitions = 1,
        brokerProperties = {
                "listeners=PLAINTEXT://localhost:9092",
                "port=9092",
                "spring.kafka.producer.linger-ms=0",       // 禁用批处理延迟
                "spring.kafka.producer.batch-size=1",     // 最小化批次大小
                "spring.kafka.producer.max-block-ms=5000" // 设置适当的阻塞超时
        })
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("数据源单元测试")
public class CatalogControllerTest {

    @Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;
    private MockedStatic<EtrinoHttpUtils> httpClient;
    private MockedStatic<Hydra> hydra;
    private MockedStatic<Authorization> authorization;
    private MockedStatic<Calculate> calculate;
    private MockedStatic<UserManagement> userManagement;
    private MockedStatic<ExcelHttpUtils> asUtil;
    private MockedStatic<TingYunHttpUtils> tingYunUtil;
    @MockBean
    private TblsMapper tblsMapper;
    @MockBean
    private CatalogRuleMapper catalogRuleMapper;
    @MockBean
    private DataSourceMapper dataSourceMapper;
    @MockBean
    private TableScanMapper tableScanMapper;
    @MockBean
    private FieldScanMapper fieldScanMapper;
    private final IntrospectInfo introspectInfo = new IntrospectInfo();

    @Before
    public void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilter(new Auth2ProxyFilter("http://mock-hydra-url"), "/*")
                .build();
        this.httpClient = mockStatic(EtrinoHttpUtils.class);
        this.hydra = mockStatic(Hydra.class);
        this.authorization = mockStatic(Authorization.class);
        this.calculate = mockStatic(Calculate.class);
        this.userManagement = mockStatic(UserManagement.class);
        this.asUtil = mockStatic(ExcelHttpUtils.class);
        this.tingYunUtil = mockStatic(TingYunHttpUtils.class);

        introspectInfo.setActive(true);
        introspectInfo.setScope("openid offline all");
        introspectInfo.setClientId("fe53e44d-3cea-4d7b-bca1-0d029d50be3d");
        introspectInfo.setSub("66694b0a-4d82-11f0-8e4a-0a0da5168a0e");
        introspectInfo.setExp(1751359019);
        introspectInfo.setIat(1751355418);
        introspectInfo.setNbf(1751355418);
        introspectInfo.setAud(new String[0]);
        introspectInfo.setIss("https://10.4.110.188:443");
        introspectInfo.setTokenType("Bearer");
        introspectInfo.setTokenUse("access_token");
        Ext ext = new Ext();
        ext.setAccountType("other");
        ext.setClientType("console_web");
        ext.setLoginIp("10.4.33.170");
        ext.setUdid("");
        ext.setVisitorType("realname");
        introspectInfo.setExt(ext);
    }

    @After
    public void teardown() {
        this.httpClient.close();
        this.hydra.close();
        this.authorization.close();
        this.calculate.close();
        this.userManagement.close();
        this.asUtil.close();
        this.tingYunUtil.close();
    }

    @Test
    public void createMysqlDatasourceTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        when(dataSourceMapper.selectByCatalogNameAndId(anyString(),anyString())).thenReturn(new ArrayList<>());
        calculate.when(() -> Calculate.getCatalogNameList(any())).thenReturn(Collections.singletonList("xxx"));
        calculate.when(() -> Calculate.createCatalog(any(), any())).thenAnswer(invocation -> null).thenAnswer(invocation -> null);
        calculate.when(()->Calculate.testCatalog(any(),any(),any())).thenAnswer(invocation -> null);
        when(catalogRuleMapper.insert(any())).thenReturn(0);
        when(dataSourceMapper.insert(any())).thenReturn(1);
        userManagement.when(()->UserManagement.batchGetUserInfosByUserIds(any(),any())).thenReturn(new HashMap<String, String[]>());
        authorization.when(() -> Authorization.addResourceOperations(any(), any(), any(), any(), any(), any(), any(), any())).thenAnswer(invocation -> null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"test_5\",\n" +
                                "    \"type\": \"mysql\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"database_name\": \"vega\",\n" +
                                "        \"connect_protocol\": \"jdbc\",\n" +
                                "        \"host\": \"10.4.110.188\",\n" +
                                "        \"port\": 3330,\n" +
                                "        \"account\": \"anyshare\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    }\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void createHiveHadoop2DatasourceTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        when(dataSourceMapper.selectByCatalogNameAndId(anyString(),anyString())).thenReturn(new ArrayList<>());
        calculate.when(() -> Calculate.getCatalogNameList(any())).thenReturn(Collections.singletonList("xxx"));
        calculate.when(() -> Calculate.createCatalog(any(), any())).thenAnswer(invocation -> null).thenAnswer(invocation -> null);
        calculate.when(()->Calculate.testCatalog(any(),any(),any())).thenAnswer(invocation -> null);
        when(catalogRuleMapper.insert(any())).thenReturn(0);
        when(dataSourceMapper.insert(any())).thenReturn(1);
        userManagement.when(()->UserManagement.batchGetUserInfosByUserIds(any(),any())).thenReturn(new HashMap<String, String[]>());
        authorization.when(() -> Authorization.addResourceOperations(any(), any(), any(), any(), any(), any(), any(), any())).thenAnswer(invocation -> null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"hive_test\",\n" +
                                "    \"type\": \"hive\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"database_name\": \"default\",\n" +
                                "        \"connect_protocol\": \"thrift\",\n" +
                                "        \"host\": \"10.4.111.235\",\n" +
                                "        \"port\": 10000,\n" +
                                "        \"account\": \"root\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    },\n" +
                                "    \"comment\":\"test\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void createExcelDatasourceTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        JSONObject dirJson = new JSONObject();
        JSONArray filesArray = new JSONArray();
        JSONObject file = new JSONObject();
        file.put("name", "Excel测试数据.xlsx");
        filesArray.add(file);
        dirJson.put("files", filesArray);
        JSONObject dir = new JSONObject();
        dir.put("name", "VEGA对接测试库");
        JSONArray dirsArray = new JSONArray();
        dirsArray.add(dir);
        dirJson.put("dirs", dirsArray);
        asUtil.when(()-> ExcelHttpUtils.getToken(any(),any(),any(),any())).thenReturn("mock-token");
        asUtil.when(()-> ExcelHttpUtils.getDocid(any(),any(),any())).thenReturn("docid");
        asUtil.when(()-> ExcelHttpUtils.loadDir(any(),any(),any())).thenReturn(dirJson);
        when(dataSourceMapper.selectByCatalogNameAndId(anyString(),anyString())).thenReturn(new ArrayList<>());
        calculate.when(() -> Calculate.getCatalogNameList(any())).thenReturn(Collections.singletonList("xxx"));
        calculate.when(() -> Calculate.createCatalog(any(), any())).thenAnswer(invocation -> null).thenAnswer(invocation -> null);
        calculate.when(()->Calculate.testCatalog(any(),any(),any())).thenAnswer(invocation -> null);
        when(catalogRuleMapper.insert(any())).thenReturn(0);
        when(dataSourceMapper.insert(any())).thenReturn(1);
        userManagement.when(()->UserManagement.batchGetUserInfosByUserIds(any(),any())).thenReturn(new HashMap<String, String[]>());
        authorization.when(() -> Authorization.addResourceOperations(any(), any(), any(), any(), any(), any(), any(), any())).thenAnswer(invocation -> null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"excel_test111\",\n" +
                                "    \"type\": \"excel\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"connect_protocol\": \"https\",\n" +
                                "        \"host\": \"10.4.113.188\",\n" +
                                "        \"port\": 443,\n" +
                                "        \"account\": \"65097652-3fcc-4c15-aaa4-a932ca7fe9c5\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\",\n" +
                                "        \"storage_protocol\": \"anyshare\",\n" +
                                "        \"storage_base\": \"VEGA对接测试库/Excel测试数据.xlsx\"\n" +
                                "    },\n" +
                                "    \"comment\":\"excel test\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

    }

    @Test
    public void createMysqlDatasourceTestSchemaError() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        when(dataSourceMapper.selectByCatalogNameAndId(anyString(),anyString())).thenReturn(new ArrayList<>());
        calculate.when(() -> Calculate.getCatalogNameList(any())).thenReturn(Collections.singletonList("xxx"));
        calculate.when(() -> Calculate.createCatalog(any(), any())).thenAnswer(invocation -> null);
        calculate.when(()->Calculate.testCatalog(any(),any(),any())).thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"test_5\",\n" +
                                "    \"type\": \"mysql\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"database_name\": \"vega\",\n" +
                                "        \"connect_protocol\": \"jdbc\",\n" +
                                "        \"host\": \"10.4.110.188\",\n" +
                                "        \"port\": 3330,\n" +
                                "        \"account\": \"anyshare\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    }\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());
    }

    @Test
    public void createMysqlDatasourceTestDBError() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        when(dataSourceMapper.selectByCatalogNameAndId(anyString(),anyString())).thenReturn(new ArrayList<>());
        calculate.when(() -> Calculate.getCatalogNameList(any())).thenReturn(Collections.singletonList("xxx"));
        calculate.when(() -> Calculate.createCatalog(any(), any())).thenAnswer(invocation -> null).thenAnswer(invocation -> null);
        calculate.when(()->Calculate.testCatalog(any(),any(),any())).thenAnswer(invocation -> null);
        when(catalogRuleMapper.insert(any())).thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out")).thenReturn(1);
        calculate.when(()->Calculate.deleteCatalog(any(),any())).thenAnswer(invocation -> null);
        when(dataSourceMapper.insert(any())).thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"));
        when(catalogRuleMapper.deleteByCatalogName(any())).thenReturn(0);

        //下推规则入库失败
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"test_5\",\n" +
                                "    \"type\": \"mysql\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"database_name\": \"vega\",\n" +
                                "        \"connect_protocol\": \"jdbc\",\n" +
                                "        \"host\": \"10.4.110.188\",\n" +
                                "        \"port\": 3330,\n" +
                                "        \"account\": \"anyshare\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    }\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());

        //数据源信息入库失败
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"test_5\",\n" +
                                "    \"type\": \"mysql\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"database_name\": \"vega\",\n" +
                                "        \"connect_protocol\": \"jdbc\",\n" +
                                "        \"host\": \"10.4.110.188\",\n" +
                                "        \"port\": 3330,\n" +
                                "        \"account\": \"anyshare\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    }\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());
    }

    @Test
    public void createMysqlDatasourceTestAddAuthError() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        when(dataSourceMapper.selectByCatalogNameAndId(anyString(),anyString())).thenReturn(new ArrayList<>());
        calculate.when(() -> Calculate.getCatalogNameList(any())).thenReturn(Collections.singletonList("xxx"));
        calculate.when(() -> Calculate.createCatalog(any(), any())).thenAnswer(invocation -> null).thenAnswer(invocation -> null);
        calculate.when(()->Calculate.testCatalog(any(),any(),any())).thenAnswer(invocation -> null);
        when(catalogRuleMapper.insert(any())).thenReturn(0);
        when(dataSourceMapper.insert(any())).thenReturn(1);
        userManagement.when(()->UserManagement.batchGetUserInfosByUserIds(any(),any())).thenReturn(new HashMap<String, String[]>());
        authorization.when(() -> Authorization.addResourceOperations(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"));
        calculate.when(()->Calculate.deleteCatalog(any(),any())).thenAnswer(invocation -> null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"test_5\",\n" +
                                "    \"type\": \"mysql\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"database_name\": \"vega\",\n" +
                                "        \"connect_protocol\": \"jdbc\",\n" +
                                "        \"host\": \"10.4.110.188\",\n" +
                                "        \"port\": 3330,\n" +
                                "        \"account\": \"anyshare\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    }\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());
    }

    @Test
    public void getDatasourceListTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        when(dataSourceMapper.selectDataSources(any(),any(),any()))
                .thenReturn(new ArrayList<>())
                .thenReturn(Collections.singletonList(new DataSourceEntity(
                        "687856a8-221c-4bdb-8ba5-c36cbacfc444", // id
                        "test1", // name
                        "mysql", // typeName
                        "test_catalog", // catalogName
                        "test_db", // databaseName
                        "public", // schema
                        "jdbc", // connectProtocol
                        "10.4.110.188", // host
                        3306, // port
                        "root", // account
                        "tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==", // password
                        null, // storageProtocol
                        null, // storageBase
                        null, // token
                        null, // replicaSet
                        1, // isBuiltIn (1为非内置)
                        "测试数据源", // comment
                        "687856a8-221c-4bdb-8ba5-c36cbacfc445", // createdByUid
                        LocalDateTime.now(), // createdAt
                        "687856a8-221c-4bdb-8ba5-c36cbacfc445", // updatedByUid
                        LocalDateTime.now() // updatedAt
                )));
        authorization.when(()->Authorization.getAuthIdsByResourceIds(any(),any(),any(),any(),any()))
                .thenReturn(new HashMap<String, Object>())
                .thenReturn(Collections.singletonMap("687856a8-221c-4bdb-8ba5-c36cbacfc444", new String[]{"display"}));
        when(dataSourceMapper.selectPage(any(),any(),any(),anyInt(),anyInt(),any(),any()))
                .thenReturn(Collections.singletonList(new DataSourceEntity(
                        "687856a8-221c-4bdb-8ba5-c36cbacfc444", // id
                        "test1", // name
                        "mysql", // typeName
                        "test_catalog", // catalogName
                        "test_db", // databaseName
                        "public", // schema
                        "jdbc", // connectProtocol
                        "10.4.110.188", // host
                        3306, // port
                        "root", // account
                        "tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==", // password
                        null, // storageProtocol
                        null, // storageBase
                        null, // token
                        null, // replicaSet
                        1, // isBuiltIn (1为非内置)
                        "测试数据源", // comment
                        "687856a8-221c-4bdb-8ba5-c36cbacfc445", // createdByUid
                        LocalDateTime.now(), // createdAt
                        "687856a8-221c-4bdb-8ba5-c36cbacfc445", // updatedByUid
                        LocalDateTime.now() // updatedAt
                            )));
        when(dataSourceMapper.selectCount(any(),any(),any())).thenReturn(1L);
        userManagement.when(()->UserManagement.batchGetUserInfosByUserIds(any(),any()))
                .thenReturn(Collections.singletonMap("687856a8-221c-4bdb-8ba5-c36cbacfc445", new String[]{"user", "test"}));

        //库内没有数据
        mockMvc.perform(MockMvcRequestBuilders.get("/api/data-connection/v1/datasource")
                        .header("Authorization","Bearer xxx")
                        .param("limit","1")
                        .param("offset","1")
                        .param("type","structured"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        //没有存在权限的数据
        mockMvc.perform(MockMvcRequestBuilders.get("/api/data-connection/v1/datasource")
                        .header("Authorization","Bearer xxx")
                        .param("limit","1")
                        .param("offset","1")
                        .param("type","structured"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        //有存在权限的数据
        mockMvc.perform(MockMvcRequestBuilders.get("/api/data-connection/v1/datasource")
                        .header("Authorization","Bearer xxx")
                        .param("limit","1")
                        .param("offset","1")
                        .param("type","structured"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void getAssignableDatasourceListTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        when(dataSourceMapper.selectDataSources(any(),any(),any()))
                .thenReturn(new ArrayList<>())
                .thenReturn(Collections.singletonList(new DataSourceEntity(
                        "687856a8-221c-4bdb-8ba5-c36cbacfc444", // id
                        "test1", // name
                        "mysql", // typeName
                        "test_catalog", // catalogName
                        "test_db", // databaseName
                        "public", // schema
                        "jdbc", // connectProtocol
                        "10.4.110.188", // host
                        3306, // port
                        "root", // account
                        "tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==", // password
                        null, // storageProtocol
                        null, // storageBase
                        null, // token
                        null, // replicaSet
                        1, // isBuiltIn (1为非内置)
                        "测试数据源", // comment
                        "687856a8-221c-4bdb-8ba5-c36cbacfc445", // createdByUid
                        LocalDateTime.now(), // createdAt
                        "687856a8-221c-4bdb-8ba5-c36cbacfc445", // updatedByUid
                        LocalDateTime.now() // updatedAt
                         )));
        authorization.when(()->Authorization.getAuthIdsByResourceIds(any(),any(),any(),any(),any()))
                .thenReturn(new HashMap<String, Object>())
                .thenReturn(Collections.singletonMap("687856a8-221c-4bdb-8ba5-c36cbacfc444", new String[]{"authorize"}));

        when(dataSourceMapper.selectPage(any(),any(),any(),anyInt(),anyInt(),any(),any()))
                .thenReturn(Collections.singletonList(new DataSourceEntity(
                        "687856a8-221c-4bdb-8ba5-c36cbacfc444", // id
                        "test1", // name
                        "mysql", // typeName
                        "test_catalog", // catalogName
                        "test_db", // databaseName
                        "public", // schema
                        "jdbc", // connectProtocol
                        "10.4.110.188", // host
                        3306, // port
                        "root", // account
                        "tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==", // password
                        null, // storageProtocol
                        null, // storageBase
                        null, // token
                        null, // replicaSet
                        1, // isBuiltIn (1为非内置)
                        "测试数据源", // comment
                        "687856a8-221c-4bdb-8ba5-c36cbacfc445", // createdByUid
                        LocalDateTime.now(), // createdAt
                        "687856a8-221c-4bdb-8ba5-c36cbacfc445", // updatedByUid
                        LocalDateTime.now() // updatedAt
                )));
        when(dataSourceMapper.selectCount(any(),any(),any())).thenReturn(1L);

        //库内没有数据
        mockMvc.perform(MockMvcRequestBuilders.get("/api/data-connection/v1/datasource/assignable-catalog")
                        .header("Authorization","Bearer xxx")
                        .param("limit","1")
                        .param("offset","1"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        //没有存在权限的数据
        mockMvc.perform(MockMvcRequestBuilders.get("/api/data-connection/v1/datasource/assignable-catalog")
                        .header("Authorization","Bearer xxx")
                        .param("limit","1")
                        .param("offset","1"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        //有存在权限的数据
        mockMvc.perform(MockMvcRequestBuilders.get("/api/data-connection/v1/datasource/assignable-catalog")
                        .header("Authorization","Bearer xxx")
                        .param("limit","1")
                        .param("offset","1"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void getDatasourceTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        when(dataSourceMapper.selectById(anyString())).thenReturn(new DataSourceEntity(
                "687856a8-221c-4bdb-8ba5-c36cbacfc444", // id
                "test1", // name
                "mysql", // typeName
                "test_catalog", // catalogName
                "test_db", // databaseName
                "public", // schema
                "jdbc", // connectProtocol
                "10.4.110.188", // host
                3306, // port
                "root", // account
                "tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==", // password
                null, // storageProtocol
                null, // storageBase
                null, // token
                null, // replicaSet
                1, // isBuiltIn (1为非内置)
                "测试数据源", // comment
                "687856a8-221c-4bdb-8ba5-c36cbacfc445", // createdByUid
                LocalDateTime.now(), // createdAt
                "687856a8-221c-4bdb-8ba5-c36cbacfc445", // updatedByUid
                LocalDateTime.now() // updatedAt
        ));
        authorization.when(()->Authorization.getAuthIdsByResourceIds(any(),any(),any(),any(),any()))
                .thenReturn(Collections.singletonMap("687856a8-221c-4bdb-8ba5-c36cbacfc444", new String[]{"view_detail"}));
        userManagement.when(()->UserManagement.batchGetUserInfosByUserIds(any(),any()))
                .thenReturn(Collections.singletonMap("687856a8-221c-4bdb-8ba5-c36cbacfc445", new String[]{"user", "test"}));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/data-connection/v1/datasource/687856a8-221c-4bdb-8ba5-c36cbacfc444")
                .header("Authorization","Bearer xxx"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void updateMysqlCatalogTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        ObjectMapper objectMapper = new ObjectMapper();
        when(dataSourceMapper.selectById(anyString())).thenReturn(new DataSourceEntity(
                "687856a8-221c-4bdb-8ba5-c36cbacfc444", // id
                "test1", // name
                "mysql", // typeName
                "test_catalog", // catalogName
                "test_db", // databaseName
                "public", // schema
                "jdbc", // connectProtocol
                "10.4.110.188", // host
                3306, // port
                "root", // account
                "tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==", // password
                null, // storageProtocol
                null, // storageBase
                null, // token
                null, // replicaSet
                1, // isBuiltIn (1为非内置)
                "测试数据源", // comment
                "687856a8-221c-4bdb-8ba5-c36cbacfc445", // createdByUid
                LocalDateTime.now(), // createdAt
                "687856a8-221c-4bdb-8ba5-c36cbacfc445", // updatedByUid
                LocalDateTime.now() // updatedAt
                ));
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        when(dataSourceMapper.selectByCatalogNameAndId(anyString(),anyString())).thenReturn(new ArrayList<>());
        when(dataSourceMapper.updateById(any())).thenReturn(1);
        calculate.when(() -> Calculate.updateCatalog(any(), any())).thenAnswer(invocation -> null);
        calculate.when(()->Calculate.testCatalog(any(),any(),any())).thenAnswer(invocation -> null);
        userManagement.when(()->UserManagement.batchGetUserInfosByUserIds(any(),any())).thenReturn(new HashMap<String, String[]>());
        mockMvc.perform(MockMvcRequestBuilders.put("/api/data-connection/v1/datasource/687856a8-221c-4bdb-8ba5-c36cbacfc444")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                            "    \"name\": \"aaaaaaaaa\",\n" +
                            "    \"type\": \"mysql\",\n" +
                            "    \"bin_data\": {\n" +
                            "        \"database_name\": \"af_openlookeng\",\n" +
                            "        \"connect_protocol\": \"jdbc\",\n" +
                            "        \"host\": \"10.4.133.144\",\n" +
                            "        \"port\": 3306,\n" +
                            "        \"account\": \"root\",\n" +
                            "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                            "    }\n" +
                            "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void updateMysqlDatasourceTestSchemaError() throws Exception {
        when(dataSourceMapper.selectById(anyString())).thenReturn(new DataSourceEntity(
                "687856a8-221c-4bdb-8ba5-c36cbacfc444", // id
                "test1", // name
                "mysql", // typeName
                "test_catalog", // catalogName
                "test_db", // databaseName
                "public", // schema
                "jdbc", // connectProtocol
                "10.4.110.188", // host
                3306, // port
                "root", // account
                "tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==", // password
                null, // storageProtocol
                null, // storageBase
                null, // token
                null, // replicaSet
                1, // isBuiltIn (1为非内置)
                "测试数据源", // comment
                "687856a8-221c-4bdb-8ba5-c36cbacfc445", // createdByUid
                LocalDateTime.now(), // createdAt
                "687856a8-221c-4bdb-8ba5-c36cbacfc445", // updatedByUid
                LocalDateTime.now() // updatedAt
        ));
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        when(dataSourceMapper.selectByCatalogNameAndId(anyString(),anyString())).thenReturn(new ArrayList<>());
        when(dataSourceMapper.updateById(any())).thenReturn(1);
        calculate.when(() -> Calculate.updateCatalog(any(), any())).thenAnswer(invocation -> null);
        calculate.when(()->Calculate.testCatalog(any(),any(),any())).thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"));
        mockMvc.perform(MockMvcRequestBuilders.put("/api/data-connection/v1/datasource/687856a8-221c-4bdb-8ba5-c36cbacfc444")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"test1\",\n" +
                                "    \"type\": \"mysql\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"database_name\": \"af_openlookeng\",\n" +
                                "        \"connect_protocol\": \"jdbc\",\n" +
                                "        \"host\": \"10.4.133.144\",\n" +
                                "        \"port\": 3306,\n" +
                                "        \"account\": \"root\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    }\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isInternalServerError());
    }

    @Test
    public void deleteDatasourceTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        when(dataSourceMapper.selectById(anyString())).thenReturn(new DataSourceEntity(
                "687856a8-221c-4bdb-8ba5-c36cbacfc444", // id
                "test1",
                "excel",
                "excel_xxx",
                null,
                null,
                "https",
                "10.4.133.144",
                443,
                "root",
                "ZWlzb28uY29tMTIz",
                "anyshare",
                "test",
                null,
                null,
                1,
                "",
                null, // createdByUid
                LocalDateTime.now(), // createdAt
                null, // updatedByUid
                LocalDateTime.now() // updatedAt
        ));
        authorization.when(()->Authorization.checkResourceOperation(any(),any(),any(),any(),any())).thenReturn(true);
        when(dataSourceMapper.deleteById(anyString())).thenReturn(1);
        TableScanEntity tableScanEntity = new TableScanEntity();
        tableScanEntity.setFDataSourceName("vdm_excel_xxx");
        tableScanEntity.setFSchemaName("default");
        tableScanEntity.setFName("test");
        when(tableScanMapper.selectList(any())).thenReturn(Collections.singletonList(tableScanEntity));
        when(tblsMapper.existView(any(),any())).thenReturn("test");
        when(tableScanMapper.deleteByDataSourceId(any(), any())).thenReturn(1);
        when(fieldScanMapper.deleteByTableId(any(), any())).thenReturn(1);
        when(catalogRuleMapper.delete(any())).thenReturn(0);
        calculate.when(() -> Calculate.getCatalogNameList(any())).thenReturn(Collections.singletonList("excel_xxx"));
        calculate.when(() -> Calculate.deleteCatalog(any(), any())).thenAnswer(invocation -> null).thenAnswer(invocation -> null);
        authorization.when(() -> Authorization.deleteResourceOperations(any(), any(), any())).thenAnswer(invocation -> null);
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/data-connection/v1/datasource/687856a8-221c-4bdb-8ba5-c36cbacfc444")
                .header("Authorization","Bearer xxx"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void testExcelDataSourceTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        JSONObject dirJson = new JSONObject();
        JSONArray filesArray = new JSONArray();
        JSONObject file = new JSONObject();
        file.put("name", "Excel测试数据.xlsx");
        filesArray.add(file);
        dirJson.put("files", filesArray);
        JSONObject dir = new JSONObject();
        dir.put("name", "VEGA对接测试库");
        JSONArray dirsArray = new JSONArray();
        dirsArray.add(dir);
        dirJson.put("dirs", dirsArray);
        asUtil.when(()-> ExcelHttpUtils.getToken(any(),any(),any(),any())).thenReturn("mock-token");
        asUtil.when(()-> ExcelHttpUtils.getDocid(any(),any(),any())).thenReturn("docid");
        asUtil.when(()-> ExcelHttpUtils.loadDir(any(),any(),any())).thenReturn(dirJson);

        //目录
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"excel_test111\",\n" +
                                "    \"type\": \"excel\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"connect_protocol\": \"https\",\n" +
                                "        \"host\": \"10.4.113.188\",\n" +
                                "        \"port\": 443,\n" +
                                "        \"account\": \"65097652-3fcc-4c15-aaa4-a932ca7fe9c5\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\",\n" +
                                "        \"storage_protocol\": \"anyshare\",\n" +
                                "        \"storage_base\": \"VEGA对接测试库\"\n" +
                                "    },\n" +
                                "    \"comment\":\"excel test\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        //文件
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"excel_test111\",\n" +
                                "    \"type\": \"excel\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"connect_protocol\": \"https\",\n" +
                                "        \"host\": \"10.4.113.188\",\n" +
                                "        \"port\": 443,\n" +
                                "        \"account\": \"65097652-3fcc-4c15-aaa4-a932ca7fe9c5\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\",\n" +
                                "        \"storage_protocol\": \"anyshare\",\n" +
                                "        \"storage_base\": \"VEGA对接测试库/Excel测试数据.xlsx\"\n" +
                                "    },\n" +
                                "    \"comment\":\"excel test\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

    }

    @Test
    public void testAS7DataSourceTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        JSONObject dirJson = new JSONObject();
        JSONArray filesArray = new JSONArray();
        JSONObject file = new JSONObject();
        file.put("name", "Excel测试数据.xlsx");
        filesArray.add(file);
        dirJson.put("files", filesArray);
        JSONObject dir = new JSONObject();
        dir.put("name", "VEGA对接测试库");
        JSONArray dirsArray = new JSONArray();
        dirsArray.add(dir);
        dirJson.put("dirs", dirsArray);
        asUtil.when(()-> ExcelHttpUtils.getToken(any(),any(),any(),any())).thenReturn("mock-token");
        asUtil.when(()-> ExcelHttpUtils.getDocid(any(),any(),any())).thenReturn("docid");
        asUtil.when(()-> ExcelHttpUtils.loadDir(any(),any(),any())).thenReturn(dirJson);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"anyshare7_test111\",\n" +
                                "    \"type\": \"anyshare7\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"connect_protocol\": \"https\",\n" +
                                "        \"host\": \"10.4.113.188\",\n" +
                                "        \"port\": 443,\n" +
                                "        \"account\": \"65097652-3fcc-4c15-aaa4-a932ca7fe9c5\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\",\n" +
                                "        \"storage_base\": \"VEGA对接测试库\"\n" +
                                "    },\n" +
                                "    \"comment\":\"anyshare7 test\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void testTingYunDataSourceTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        tingYunUtil.when(()-> TingYunHttpUtils.getAccessToken(any(),any(),anyInt(),any(),any())).thenReturn("mock-token");
        tingYunUtil.when(()-> TingYunHttpUtils.ping(any(),any(),anyInt(),any())).thenAnswer(invocation -> null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"tingyun_test111\",\n" +
                                "    \"type\": \"tingyun\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"connect_protocol\": \"https\",\n" +
                                "        \"host\": \"10.4.113.188\",\n" +
                                "        \"port\": 443,\n" +
                                "        \"account\": \"65097652-3fcc-4c15-aaa4-a932ca7fe9c5\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    },\n" +
                                "    \"comment\":\"tingyun test\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void testOpenSearchDataSourceTestError() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/data-connection/v1/datasource/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization","Bearer xxx")
                        .content("{\n" +
                                "    \"name\": \"openearch_test111\",\n" +
                                "    \"type\": \"opensearch\",\n" +
                                "    \"bin_data\": {\n" +
                                "        \"connect_protocol\": \"http\",\n" +
                                "        \"host\": \"10.4.113.188\",\n" +
                                "        \"port\": 9201,\n" +
                                "        \"account\": \"test\",\n" +
                                "        \"password\": \"tQ0zFbNeMwyqNuGnjvwlAmrp5YXi6o+JGckgboFZ5Y4k5oFmkCfMCNt9hHRHBd/qg1vDwkrTil6ZKiV/M3DNhpNo4srLCGO+SZNNpx4/CFUm361tscvlNh8S+sfCg3xMhw9e7ypuhAc0N420gb14TVvfwuzmKo5YxqElZ8dvpQgF360/slDuEWtuf8tSOSiG6unzyK8VmgYjot+XaZFU3jYRKBe8E/TXy/BIo2T77jr1AtFxtn5OVPzLp1Fl0CT8xQPioZBVdjwwX1EmMV+l1hv+ClX0QfjIoiZEycxjErArbWfJHw/3fNm+2VViLJW9UFP2nfxa/ZeojoTtDteMCQ==\"\n" +
                                "    },\n" +
                                "    \"comment\":\"opensearch test\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void connectorListTestSuccess() throws Exception {
        hydra.when(()->Hydra.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/data-connection/v1/datasource/connectors")
                        .header("Authorization","Bearer xxx")
                        .header("X-Presto-User", "admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }


}
