package com.eisoo.dc.gateway.controller;

import cn.hutool.core.io.IORuntimeException;
import com.eisoo.dc.gateway.domain.vo.HttpResInfo;
import com.eisoo.dc.gateway.util.HttpOpenUtils;
import com.eisoo.dc.gateway.util.HttpStatus;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.runner.RunWith;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockStatic;

@SpringBootTest
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("创建表、插入数据、清除数据单元测试")
public class TableDdlAndDmlControllerTest {

    @Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;
    private MockedStatic<HttpOpenUtils> httpClient;

    @Before
    public void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
        this.httpClient = mockStatic(HttpOpenUtils.class);
    }

    @After
    public void teardown() {
        this.httpClient.close();
    }

    @Test
    public void createTest_ok() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FINISHED\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void createTest_openlookengError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"));
        //1
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
        //2
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
        //3
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
        //4
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void createTest_paramNull() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createTest_headerNull() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createTest_catalogNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createTest_schemaNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": []}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createTest_tableNameError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.111(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createTest_typeLengthError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 varchar(0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createTest_failed() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FAILED\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createTest_error() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"ERROR\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/create")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","CREATE TABLE mysql1.test.test1(col1 decimal(38,0))"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void insertTest_ok() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FINISHED\"},\"updateCount\": \"1\"}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/insert")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","INSERT INTO mysql1.test.test1(col1) values(1)"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void insertTest_paramNull() throws Exception {
       mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/insert")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void insertTest_headerNull() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/insert")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .param("statement","INSERT INTO mysql1.test.test1(col1) values(1)"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void insertTest_catalogNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/insert")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","INSERT INTO mysql1.test.test1(col1) values(1)"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void insertTest_schemaNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": []}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/insert")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","INSERT INTO mysql1.test.test1(col1) values(1)"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void insertTest_failed() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FAILED\"},\"updateCount\": \"0\"}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/insert")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","INSERT INTO mysql1.test.test1(col1) values(1)"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void insertTest_error() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"ERROR\"},\"updateCount\": \"0\"}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/insert")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","INSERT INTO mysql1.test.test1(col1) values(1)"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void truncateTest_ok() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FINISHED\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/truncate")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","truncate table mysql1.test.test1"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void truncateTest_paramNull() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/truncate")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void truncateTest_headerNull() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/truncate")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .param("statement","truncate table mysql1.test.test1"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void truncateTest_catalogNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/truncate")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","truncate table mysql1.test.test1"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void truncateTest_schemaNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": []}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/truncate")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","truncate table mysql1.test.test1"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void truncateTest_failed() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FAILED\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/truncate")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","truncate table mysql1.test.test1"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void truncateTest_error() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\"mysql1\"]"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"ERROR\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/table/truncate")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                        .header("X-Presto-User","admin")
                        .param("statement","truncate table mysql1.test.test1"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }
}
