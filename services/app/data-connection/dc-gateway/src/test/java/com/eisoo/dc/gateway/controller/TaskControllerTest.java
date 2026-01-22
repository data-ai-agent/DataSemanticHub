package com.eisoo.dc.gateway.controller;

import cn.hutool.core.io.IORuntimeException;
import com.eisoo.dc.common.metadata.entity.TaskEntity;
import com.eisoo.dc.common.metadata.entity.TaskEntityQuery;
import com.eisoo.dc.common.metadata.mapper.TaskMapper;
import com.eisoo.dc.gateway.domain.vo.HttpResInfo;
import com.eisoo.dc.gateway.util.HttpOpenUtils;
import com.eisoo.dc.gateway.util.HttpStatus;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("任务管理单元测试")
public class TaskControllerTest {


    @Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;
    private MockedStatic<HttpOpenUtils> httpClient;

    @MockBean
    private TaskMapper taskMapper;
    @MockBean
    private HikariDataSource dataSource;
    @Mock
    private HikariConfig config;
    @MockBean
    private Connection connection;
    @MockBean
    private Statement statement;
    @MockBean
    private CompletableFuture<Void> completableFuture;
    @MockBean
    private CompletableFuture<String> completableStringFuture;
    @MockBean
    private MockedStatic<CompletableFuture> completableFutureStatic;
    private ResultSet resultSet;

    @Before
    public void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
        this.httpClient = mockStatic(HttpOpenUtils.class);
        this.completableFutureStatic=mockStatic(CompletableFuture.class);
        this.resultSet=mock(ResultSet.class);
        // 模拟从数据源获取连接
        when(dataSource.getConnection()).thenReturn(connection);

        // 模拟从连接创建语句
        when(connection.createStatement()).thenReturn(statement);

        // 模拟执行查询，返回模拟的 ResultSet
        when(statement.executeQuery(anyString())).thenReturn(resultSet);

    }

    @After
    public void teardown() {
        this.httpClient.close();
        this.completableFutureStatic.close();
    }

    @Test
    public void statementTaskExplorationOk() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        },\n" +
                                "        {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Group\",\"Day\",\"Month\",\"Year\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        },\n" +
                                "{\n" +
                                        "            \"key\": \"name\",\n" +
                                        "            \"value\": [\"NullCount\",\"BlankCount\",\"CountTable\",\"True\",\"False\"],\n" +
                                        "            \"type\": \"varchar\"\n" +
                                        "        },\n" +
                                        "        {\n" +
                                        "            \"key\": \"code\",\n" +
                                        "            \"value\": [\"NotNull\"],\n" +
                                        "            \"type\": \"varchar\"\n" +
                                        "        }"+
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"100\",\n" +
                                "     \"groupLimit\": \"200\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        },\n" +
                                "        {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Group\",\"Day\",\"Month\",\"Year\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        },\n" +
                                "{\n" +
                                "            \"key\": \"name\",\n" +
                                "            \"value\": [\"NullCount\",\"BlankCount\",\"CountTable\",\"True\",\"False\"],\n" +
                                "            \"type\": \"varchar\"\n" +
                                "        },\n" +
                                "        {\n" +
                                "            \"key\": \"code\",\n" +
                                "            \"value\": [\"NotNull\"],\n" +
                                "            \"type\": \"varchar\"\n" +
                                "        }"+
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "        {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Group\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }


    @Test
    public void statementTaskExplorationStatusError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.BAD_REQUEST,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }
    @Test
    public void statementTaskExplorationServerError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void statementTaskExplorationSyntaxError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.BAD_REQUEST,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void statementTaskExplorationTreeNodeError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.BAD_REQUEST,"[]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenThrow(new IORuntimeException(" connect timed out"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }
    @Test
    public void statementTaskExplorationValidationError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg1\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg1\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg1\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg1\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ]\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void statementTaskExplorationFunctionError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg1\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void statementTaskExplorationLimitError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"a\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": 123,\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": 456,\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"-20\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"-40\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void statementTaskExplorationGroupError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"1\",\n" +
                                "     \"groupLimit\": \"b\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void statementTaskExplorationFieldError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg1\",\"VarPop\",\"StddevPop\",\"Quantile\"],\n" +
                                "            \"type\": \"test\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void statementTaskExplorationTypeError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);


        completableFutureStatic.when(()->CompletableFuture.runAsync(any())).thenReturn(completableFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableFuture);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendPostWithParams(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"20241024_054927_00001_6h38j\"]"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=0")
                        .header("X-Presto-User","admin")
                        .content("{\\n\" +\n" +
                                "                                \"    \\\"catalogName\\\": \\\"mf_bottom_postgres\\\",\\n\" +\n" +
                                "                                \"    \\\"schema\\\": \\\"pure\\\",\\n\" +\n" +
                                "                                \"    \\\"table\\\": \\\"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\\\",\\n\" +\n" +
                                "                                \"     \\\"limit\\\": \\\"\\\",\\n\" +\n" +
                                "                                \"     \\\"groupLimit\\\": \\\"\\\",\\n\" +\n" +
                                "                                \"    \\\"fields\\\": [\\n\" +\n" +
                                "                                \"       {\\n\" +\n" +
                                "                                \"            \\\"key\\\": \\\"extrahour\\\",\\n\" +\n" +
                                "                                \"            \\\"value\\\": [\\\"Max\\\",\\\"Min\\\",\\\"Zero\\\",\\\"Avg\\\",\\\"VarPop\\\"],\\n\" +\n" +
                                "                                \"            \\\"type\\\": \\\"decimal\\\"\\n\" +\n" +
                                "                                \"        },\\n\" +\n" +
                                "                                \"        {\\n\" +\n" +
                                "                                \"            \\\"key\\\": \\\"extrahour\\\",\\n\" +\n" +
                                "                                \"            \\\"value\\\": [\\\"Group\\\"],\\n\" +\n" +
                                "                                \"            \\\"type\\\": \\\"decimal\\\"\\n\" +\n" +
                                "                                \"        }\\n\" +\n" +
                                "                                \"    ],\\n\" +\n" +
                                "                                \"    \\\"topic\\\": \\\"af.data_exploration_virtual_result1\\\"\\n\" +\n" +
                                "                                \"}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void statementTaskExplorationCatalogError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"xxx\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void statementTaskExplorationTableError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        },\n" +
                                "        {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Group\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void statementTaskExplorationTableLimitError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"-22\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        },\n" +
                                "        {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Group\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void statementTaskExplorationTableLimitGroupError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"-100\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        },\n" +
                                "        {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Group\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void statementTaskExplorationParameterError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\":\"mf_bottom_postgres\",\"schemas\":[\"tc-敏感\",\"information_schema\",\"public\",\"test\",\"pg_catalog\",\"pure\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"proj_code\",\"type\":\"varchar(64)\",\"origType\":\"varchar(64)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":64}]},\"comment\":\"项目代号\"}]"));
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"task_id\":[\"20241024_150552_46336_pncbv\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"mf_bottom_postgres\",\n" +
                                "    \"schema\": \"pure\",\n" +
                                "    \"table\": \"dws_gxbk_xmyy_xmgs_shihao_gongshi_d\",\n" +
                                "     \"limit\": \"\",\n" +
                                "     \"groupLimit\": \"\",\n" +
                                "    \"fields\": [\n" +
                                "       {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Max\",\"Min\",\"Zero\",\"Avg\",\"VarPop\",\"NullCount\",\"BlankCount\",\"CountTable\",\"StddevPop\",\"True\",\"False\",\"Quantile\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        },\n" +
                                "        {\n" +
                                "            \"key\": \"extrahour\",\n" +
                                "            \"value\": [\"Group\",\"Day\",\"Month\",\"Year\"],\n" +
                                "            \"type\": \"decimal\"\n" +
                                "        }\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.data_exploration_virtual_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }
    @Test
    public void statementTaskSyncOk() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);


        completableFutureStatic.when(()->CompletableFuture.runAsync(any())).thenReturn(completableFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableFuture);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendPostWithParams(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"20241024_054927_00001_6h38j\"]"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=0")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"statement\": [\n" +
                                "        \"SELECT cs_item_sk,cs_order_number,cs_quantity,cs_list_price,cs_sold_date_sk,cs_sold_time_sk FROM postgresql_71_29.public.catalog_sales order by cs_item_sk limit 100\"\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.virtual-engine.async_query_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }
    @Test
    public void statementTaskAsyncTypeError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);


        completableFutureStatic.when(()->CompletableFuture.runAsync(any())).thenReturn(completableFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableFuture);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendPostWithParams(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"20241024_054927_00001_6h38j\"]"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"statement\": [\n" +
                                "        \"SELECT cs_item_sk,cs_order_number,cs_quantity,cs_list_price,cs_sold_date_sk,cs_sold_time_sk FROM postgresql_71_29.public.catalog_sales order by cs_item_sk limit 100\"\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.virtual-engine.async_query_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void statementTaskAsyncEmptyError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\"}"));
        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);


        completableFutureStatic.when(()->CompletableFuture.runAsync(any())).thenReturn(completableFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableFuture);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        httpClient.when(()->HttpOpenUtils.sendPostWithParams(anyString(),anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"20241024_054927_00001_6h38j\"]"));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .content("{\n" +
                                "    \"statement\": [\n" +
                                "        \"SELECT cs_item_sk,cs_order_number,cs_quantity,cs_list_price,cs_sold_date_sk,cs_sold_time_sk FROM postgresql_71_29.public.catalog_sales order by cs_item_sk limit 100\"\n" +
                                "    ],\n" +
                                "    \"topic\": \"af.virtual-engine.async_query_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"statement\": {\n" +
                                "        \"SELECT cs_item_sk,cs_order_number,cs_quantity,cs_list_price,cs_sold_date_sk,cs_sold_time_sk FROM postgresql_71_29.public.catalog_sales order by cs_item_sk limit 100\"\n" +
                                "    },\n" +
                                "    \"topic\": \"af.virtual-engine.async_query_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=1")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"statement\": {\n" + "    },\n" +
                                "    \"topic\": \"af.virtual-engine.async_query_result1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=2")
                .header("X-Presto-User","admin")
                .content("{\n" +
                        "    \"statement\": [\n" +
                        "        \"SELECT cs_item_sk,cs_order_number,cs_quantity,cs_list_price,cs_sold_date_sk,cs_sold_time_sk FROM postgresql_71_29.public.catalog_sales order by cs_item_sk limit 100\"\n" +
                        "    ],\n" +
                        "    \"topic\": \"af.virtual-engine.async_query_result1\"\n" +
                        "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=0")
                .header("X-Presto-User","admin")
                .content("{\n" +
                        "    \"statement\": [\n" +
                        "        \"SELECT cs_item_sk,cs_order_number,cs_quantity,cs_list_price,cs_sold_date_sk,cs_sold_time_sk FROM postgresql_71_29.public.catalog_sales order by cs_item_sk limit 100\"\n" +
                        "    ],\n" +
                        "    \"topic\": 123" +
                        "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=0")
                .header("X-Presto-User","admin")
                .content("{\n" +
                        "    \"statement\": [\n" +
                        "        \"SELECT cs_item_sk,cs_order_number,cs_quantity,cs_list_price,cs_sold_date_sk,cs_sold_time_sk FROM postgresql_71_29.public.catalog_sales order by cs_item_sk limit 100\"\n" +
                        "    ],\n" +
                        "    \"topic\": \"12345\"\n" +
                        "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void statementTaskAsyncHeaderError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/task?type=0")
                        .param("statement","select * from mf_bottom.af_metadata.t_dict order by f_id offset 1 limit 4")
                        .param("topic","virtual_engine.query.result"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void getTaskOk() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\n" +
                "\"servlet\":\"org.glassfish.jersey.servlet.ServletContainer-2c557eee\",\n" +
                "\"message\":\"Gone\",\n" +
                "\"url\":\"/v1/query/20241209_033252_00001_367ir\",\n" +
                "\"status\":\"410\"\n" +
                "}"));
        List<TaskEntity> taskEntityList=new ArrayList<>();
        taskEntityList.add(new TaskEntity("20241018_132904_24365_ylxmo","20241018_132904_24365_ylxmo","FINISHED","select * from mf_bottom.af_metadata.t_dict order by f_id offset 1 limit 4","2024-10-18 13:29:04","2024-10-18 13:29:04","","test","100.0"));
        when(taskMapper.selectJoinOne(any())).thenReturn(taskEntityList);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-gateway/v1/task/{taskId}","xxx")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void getTaskMemoryOk() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\n" +
                "    \"queryId\": \"20241209_060707_00001_v44y7\",\n" +
                "    \"state\": \"FINISHED\",\n" +
                "    \"memoryPool\": \"general\",\n" +
                "    \"scheduled\": true,\n" +
                "    \"self\": \"http://10.4.108.63:8090/v1/query/20241209_060707_00001_v44y7\",\n" +
                "    \"fieldNames\": [\n" +
                "        \"rows\"\n" +
                "    ],\n" +
                "    \"query\": \"insert into mysql_108_63.vega.temp001 values(123,'test8741')\",\n" +
                "    \"queryStats\": {\n" +
                "        \"createTime\": \"2024-12-09T06:07:07.570Z\",\n" +
                "        \"executionStartTime\": \"2024-12-09T06:07:07.747Z\",\n" +
                "        \"lastHeartbeat\": \"2024-12-09T06:07:08.777Z\",\n" +
                "        \"endTime\": \"2024-12-09T06:07:08.749Z\",\n" +
                "        \"elapsedTime\": \"1.18s\",\n" +
                "        \"queuedTime\": \"3.51ms\",\n" +
                "        \"resourceWaitingTime\": \"173.89ms\",\n" +
                "        \"dispatchingTime\": \"379.23us\",\n" +
                "        \"executionTime\": \"1.00s\",\n" +
                "        \"analysisTime\": \"148.44ms\",\n" +
                "        \"distributedPlanningTime\": \"181.55us\",\n" +
                "        \"totalPlanningTime\": \"156.30ms\",\n" +
                "        \"totalLogicalPlanningTime\": \"142.16ms\",\n" +
                "        \"totalSyntaxAnalysisTime\": \"177.11ms\",\n" +
                "        \"finishingTime\": \"365.49us\",\n" +
                "        \"progressPercentage\": 100.0\n" +
                "    },\n" +
                "    \"runningAsync\": false,\n" +
                "    \"recoveryEnabled\": false,\n" +
                "    \"updateCount\": 1,\n" +
                "    \"finalQueryInfo\": true\n" +
                "}"));
        List<TaskEntity> taskEntityList=new ArrayList<>();
        taskEntityList.add(new TaskEntity("20241018_132904_24365_ylxmo","20241018_132904_24365_ylxmo","FINISHED","select * from mf_bottom.af_metadata.t_dict order by f_id offset 1 limit 4","2024-10-18 13:29:04","2024-10-18 13:29:04","","test","100.0"));
        when(taskMapper.selectJoinOne(any())).thenReturn(taskEntityList);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-gateway/v1/task/{taskId}","xxx")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }
    @Test
    public void getTaskHeaderError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-gateway/v1/task/{taskId}","xxx"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void sqlCheckOk() throws Exception {

        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"select count(*) from vdm_postgresql_1zi8s2me.default.dwd_service_project_delivery where project_status = 'completed' and actual_end_date >='2024-07-01' and actual_end_date  <='2024-07-31'"));
        httpClient.when(()->HttpOpenUtils.sendDelete(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));

        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);


        completableFutureStatic.when(()->CompletableFuture.runAsync(any())).thenReturn(completableFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableFuture);
        //when(completableFuture.join()).thenReturn(null);


        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/check")
                        .header("X-Presto-User","admin")
                        .content("select count(*) from vdm_postgresql_1zi8s2me.default.dwd_service_project_delivery where project_status = 'completed' and actual_end_date >='2024-07-01' and actual_end_date  <='2024-07-31'"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void sqlCheckHeaderError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/check")
                        .header("X-Presto-User","admin")
                        .content("select count(*) from vdm_postgresql_1zi8s2me.default.dwd_service_project_delivery where"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void sqlCheckSyntaxError() throws Exception {

        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"select count(*) from vdm_postgresql_1zi8s2me.default.dwd_service_project_delivery where project_status = 'completed' and actual_end_date >='2024-07-01' and actual_end_date  <='2024-07-31'"));
        httpClient.when(()->HttpOpenUtils.sendDelete(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));

        HikariDataSource ds=Mockito.mock(HikariDataSource.class);
        when(ds.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-gateway/v1/check")
                        .header("X-Presto-User","admin")
                        .content("select count(*) from vdm_postgresql_1zi8s2me.default.dwd_service_project_delivery project_status = 'completed' and actual_end_date >='2024-07-01' and actual_end_date  <='2024-07-31'"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void deleteTaskOk() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"taskId\":\"20241018_132904_24365_ylxmo\"}]"));
        httpClient.when(()->HttpOpenUtils.sendDelete(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        List<TaskEntity> taskEntityList=new ArrayList<>();
        taskEntityList.add(new TaskEntity("20241018_132904_24365_ylxmo","20241018_132904_24365_ylxmo","FINISHED","select * from mf_bottom.af_metadata.t_dict order by f_id offset 1 limit 4","2024-10-18 13:29:04","2024-10-18 13:29:04","","test","100.0"));
        when(taskMapper.selectJoinOne(any())).thenReturn(taskEntityList);
        httpClient.when(()->HttpOpenUtils.sendPost(any(),anyString(),any())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/vega-gateway/v1/task/{taskId}","20241018_132904_24365_ylxmo")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void deleteTaskHeaderError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/vega-gateway/v1/task/{taskId}","xxx"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void deleteTaskOrigOk() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"taskId\":\"20241018_132904_24365_ylxmo\"}]"));
        httpClient.when(()->HttpOpenUtils.sendDelete(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        List<TaskEntity> taskEntityList=new ArrayList<>();
        taskEntityList.add(new TaskEntity("20241018_132904_24365_ylxmo","20241018_132904_24365_ylxmo","FINISHED","select * from mf_bottom.af_metadata.t_dict order by f_id offset 1 limit 4","2024-10-18 13:29:04","2024-10-18 13:29:04","","test","100.0"));
        when(taskMapper.selectJoinOne(any())).thenReturn(taskEntityList);
        httpClient.when(()->HttpOpenUtils.sendPost(any(),anyString(),any())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/virtual_engine_service/v1/task/{taskId}","20241018_132904_24365_ylxmo")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void deleteTaskOrigHeaderError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/virtual_engine_service/v1/task/{taskId}","xxx"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
    @Test
    public void deleteTaskTaskNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/vega-gateway/v1/task/{taskId}","xxx")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void deleteTaskTaskStateRunning() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"taskId\":\"XXX\"}]"));
        httpClient.when(()->HttpOpenUtils.sendDelete(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        List<TaskEntity> taskEntityList=new ArrayList<>();
        taskEntityList.add(new TaskEntity("XXX","XXX","RUNNING","select * from mf_bottom.af_metadata.t_dict order by f_id offset 1 limit 4","2024-10-18 13:29:04","2024-10-18 13:29:04","","test","100.0"));
        when(taskMapper.selectJoinOne(any())).thenReturn(taskEntityList);
        httpClient.when(()->HttpOpenUtils.sendPost(any(),anyString(),any())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/vega-gateway/v1/task/{taskId}","XXX")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void cancelTaskOk() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"taskId\":[\"20241018_132904_24365_ylxmo\"]}]"));
        httpClient.when(()->HttpOpenUtils.sendDelete(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        List<TaskEntityQuery> taskEntityList=new ArrayList<>();
        taskEntityList.add(new TaskEntityQuery("20241018_132904_24365_ylxmo","20241018_132904_24365_ylxmo","RUNNING"));
        when(taskMapper.batchTaskIds1(any())).thenReturn(taskEntityList);
        httpClient.when(()->HttpOpenUtils.sendPost(any(),anyString(),any())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        httpClient.when(()->HttpOpenUtils.sendDelete(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        completableFutureStatic.when(()->CompletableFuture.supplyAsync(any())).thenReturn(completableStringFuture);
        completableFutureStatic.when(()->CompletableFuture.allOf(any())).thenReturn(completableStringFuture);
        when(taskMapper.updateTaskStateBatch(any(),any(),any())).thenReturn(2);
        when(taskMapper.updateQueryStateBatch(any(),any(),any())).thenReturn(2);
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vega-gateway/v1/task")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"task_id\": [\"20241018_132904_24365_ylxmo\"]\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void cancelTaskHeaderError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vega-gateway/v1/task")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"task_id\": \"20241018_132904_24365_ylxmo\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void cancelTaskNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vega-gateway/v1/task")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"task_id\": \"20241018_132904_24365_ylxmo\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void cancelTaskStateFinished() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"taskId\":\"XXX\"}]"));
        httpClient.when(()->HttpOpenUtils.sendDelete(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        List<TaskEntity> taskEntityList=new ArrayList<>();
        taskEntityList.add(new TaskEntity("XXX","XXX","FINISHED","select * from mf_bottom.af_metadata.t_dict order by f_id offset 1 limit 4","2024-10-18 13:29:04","2024-10-18 13:29:04","","test","100.0"));
        when(taskMapper.selectJoinOne(any())).thenReturn(taskEntityList);
        httpClient.when(()->HttpOpenUtils.sendPost(any(),anyString(),any())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));
        mockMvc.perform(MockMvcRequestBuilders.put("/api/vega-gateway/v1/task")
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"task_id\": \"20241018_132904_24365_ylxmo\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
}
