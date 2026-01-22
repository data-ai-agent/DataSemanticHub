package com.eisoo.dc.gateway.controller;

import com.eisoo.dc.gateway.common.QueryConstant;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.concurrent.CompletableFuture;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockStatic;

@SpringBootTest
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("表信息管理单元测试")
public class TableSchemaControllerTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    private MockedStatic<HttpOpenUtils> httpClient;

    private MockedStatic<CompletableFuture> completableFuture;

    private String openlookengUrl = "http://127.0.0.1:8090";



    @Before
    public void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
        this.httpClient = mockStatic(HttpOpenUtils.class);
        this.completableFuture = mockStatic(CompletableFuture.class);
    }

    @After
    public void teardown() {
        this.httpClient.close();
        this.completableFuture.close();
    }

    @Test
    public void catalogSchemaListTest_ok() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/schemas/{catalog}","mysql1")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void catalogSchemaListTest_headerError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/schemas/{catalog}","mysql1"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void catalogSchemaListTest_jsonError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{catalogName: mysql1,schemas: [test]}"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/schemas/{catalog}","mysql1")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void schemaTableListTest_ok() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}"));

        httpClient.when(()->HttpOpenUtils.sendGetOlk(openlookengUrl + QueryConstant.VIRTUAL_V1_SCHEMA +"mysql1","admin")).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(openlookengUrl + QueryConstant.VIRTUAL_V1_SCHEMA_TABLE + "mysql1/test?originCatalog=test&connectorName=mysql","admin"))
                //第一次请求
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"connectorId\":\"mysql1\",\"schema\":\"anydata\",\"table\":\"test\",\"columns\":[],\"comment\":\"\",\"fqn\":\"mysql1.anydata.test\"}]\n"))
                //第二次请求
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]\n"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{catalog}/{schema}","mysql1","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{catalog}/{schema}","mysql1","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void schemaTableListTest_headerError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{catalog}/{schema}","mysql1","test"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void schemaTableListTest_catalogNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.BAD_REQUEST,"show catalog failed. please check your request info."));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{catalog}/{schema}","mysql1","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void schemaTableListTest_jsonError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}"));

        httpClient.when(()->HttpOpenUtils.sendGetOlk(openlookengUrl + QueryConstant.VIRTUAL_V1_SCHEMA +"mysql1","admin"))
                //第一次请求
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{catalogName: mysql1,schemas: [test]}"))
                //第二次请求
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(openlookengUrl + QueryConstant.VIRTUAL_V1_SCHEMA_TABLE + "mysql1/test?originCatalog=test&connectorName=mysql","admin"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"xxx"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{catalog}/{schema}","mysql1","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{catalog}/{schema}","mysql1","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void collectSchemaTableListTest_ok() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}"));
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"success"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{collector}/{catalog}/{schema}","mymaria_fast2","mysql1","test")
                        .header("X-Presto-User","admin")
                        .param("datasourceId","22")
                        .param("schemaId","22"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void collectSchemaTableListTest_headerError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{collector}/{catalog}/{schema}","mymaria_fast2","mysql1","test")
                        .param("datasourceId","22")
                        .param("schemaId","22"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void collectSchemaTableListTest_collectError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}"));
        httpClient.when(()->HttpOpenUtils.sendPost(anyString(),anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.BAD_REQUEST,"xxx"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/tables/{collector}/{catalog}/{schema}","mymaria_fast2","mysql1","test")
                        .header("X-Presto-User","admin")
                        .param("datasourceId","22")
                        .param("schemaId","22"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void schemaTableColumnsTest_ok() throws Exception {

        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));

        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}"));

        httpClient.when(()->HttpOpenUtils.sendGetOlk(openlookengUrl + QueryConstant.VIRTUAL_V1_SCHEMA_COLUMNS + "mysql1/test/test?originCatalog=test&connectorName=mysql","admin"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[" +
                        "{\"name\":\"name\",\"type\":\"varchar(50)\",\"origType\":\"VARCHAR(50)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"NULL\",\"typeSignature\":{\"rawType\":\"varchar\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"kind\":\"LONG_LITERAL\",\"value\":50}]},\"comment\":\"sfsdgsgsgsgsg\"}," +
                        "{\"name\":\"age\",\"type\":\"bigint\",\"origType\":\"BIGINT(19)\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"NULL\",\"typeSignature\":{\"rawType\":\"bigint\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[]},\"comment\":\"\"},"+
                        "{\"name\":\"rows\",\"type\":\"row\",\"origType\":\"xxx\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"NULL\",\"typeSignature\":{\"rawType\":\"row\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[]},\"comment\":\"\"},"+
                        "{\"name\":\"arrays\",\"type\":\"array\",\"origType\":\"xxx\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"NULL\",\"typeSignature\":{\"rawType\":\"array\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[{\"value\":{\"arguments\":[{\"kind\":\"STRING_LITERAL\",\"value\":50}]}}]},\"comment\":\"\"},"+
                        "{\"name\":\"xxx\",\"type\":\"numeric_v1\",\"origType\":\"xxx\",\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"NULL\",\"typeSignature\":{\"rawType\":\"numeric_v1\",\"typeArguments\":[],\"literalArguments\":[],\"arguments\":[]},\"comment\":\"\"}"+
                        "]"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/columns/{catalog}/{schema}/{table}","mysql1","test","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());

    }

    @Test
    public void schemaTableColumnsTest_headerError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/columns/{catalog}/{schema}/{table}","mysql1","test","test"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

    }

    @Test
    public void schemaTableColumnsTest_catalogNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"xxx\"]}"));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/columns/{catalog}/{schema}/{table}","mysql1","test","test"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

    }

    @Test
    public void schemaTableColumnsTest_jsonError() throws Exception {

        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}"));

        httpClient.when(()->HttpOpenUtils.sendGetOlk(openlookengUrl + QueryConstant.VIRTUAL_V1_SCHEMA_COLUMNS + "mysql1/test/test?originCatalog=test&connectorName=mysql","admin"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{name:name,type:varchar(50),origType:VARCHAR(50),primaryKey:false,nullAble:true,columnDef:NULL,typeSignature:{rawType:varchar,typeArguments:[],literalArguments:[],arguments:[{kind:LONG_LITERAL,value:50}]},comment:sfsdgsgsgsgsg}]"));


        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/columns/{catalog}/{schema}/{table}","mysql1","test","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));

    }

    @Test
    public void schemaTableColumnsFastTest_ok() throws Exception {

        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"test\"]}"));

        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}"));

        httpClient.when(()->HttpOpenUtils.sendGetOlk(openlookengUrl + QueryConstant.VIRTUAL_V1_SCHEMA_COLUMNS + "fast/mysql1/test/test?originCatalog=test","admin"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[{\"name\":\"name\",\"type\":\"VARCHAR\",\"length\":50,\"precision\":0,\"primaryKey\":false,\"nullAble\":true,\"columnDef\":\"NULL\",\"comment\":\"sfsdgsgsgsgsg\"}]"));


        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/columns/fast/{catalog}/{schema}/{table}","mysql1","test","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void schemaTableColumnsFastTest_headerError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/columns/fast/{catalog}/{schema}/{table}","mysql1","test","test"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

    }

    @Test
    public void schemaTableColumnsFastTest_catalogNotExist() throws Exception {

        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"catalogName\": \"mysql1\",\"schemas\": [\"xxx\"]}"));
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/metadata/columns/fast/{catalog}/{schema}/{table}","mysql1","test","test")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
}
