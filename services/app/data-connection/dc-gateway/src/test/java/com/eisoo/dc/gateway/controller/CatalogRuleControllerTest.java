package com.eisoo.dc.gateway.controller;

import cn.hutool.core.io.IORuntimeException;
import com.eisoo.dc.common.metadata.entity.CatalogRuleEntity;
import com.eisoo.dc.common.metadata.mapper.CatalogRuleMapper;
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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("数据源下推规则单元测试")
public class CatalogRuleControllerTest {

    @Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;
    private MockedStatic<HttpOpenUtils> httpClient;


    @MockBean
    private CatalogRuleMapper catalogRuleMapper;

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
    public void getRuleList_ok() throws Exception {
        List<CatalogRuleEntity> catalogRuleEntities = new ArrayList<>();
        catalogRuleEntities.add(new CatalogRuleEntity());
        when(catalogRuleMapper.selectAll()).thenReturn(catalogRuleEntities);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/rule"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void configRule_ok() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}\n"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[\n" +
                        "    {\n" +
                        "        \"catalogName\": \"vdm_xxx\",\n" +
                        "        \"connectorName\": \"vdm\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "        \"catalogName\": \"mysql1\",\n" +
                        "        \"connectorName\": \"mysql\"\n" +
                        "    }\n" +
                        "]"));
        List<CatalogRuleEntity> catalogRuleEntityList = new ArrayList<>();
        when(catalogRuleMapper.selectRuleInfo(any())).thenReturn(catalogRuleEntityList);
        httpClient.when(()->HttpOpenUtils.sendPost(any(),anyString(),any())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,""));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void configRule_openlookengError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}\n"));
        List<CatalogRuleEntity> catalogRuleEntityList = new ArrayList<>();
        when(catalogRuleMapper.selectRuleInfo(any())).thenReturn(catalogRuleEntityList);
        httpClient.when(()->HttpOpenUtils.sendPost(any(),anyString(),any()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"));

        //1
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));

        //2
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void configRule_paramError() throws Exception {
        // header error
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        //body error
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        // rule error
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        //is_enable error
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        //name error
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));

        //datasourceType error
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ]\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void configRule_catalogNotExist() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"show catalog failed. please check your request info."));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"mysql1\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void configRule_catalogTypeError() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"connection-password\":\"xxx\",\"connector.name\":\"mysql\",\"connection-url\":\"jdbc:mysql://127.0.0.1:3306\",\"connection-user\":\"root\",\"jdbc.pushdown-module\":\"FULL_PUSHDOWN\"}\n"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"hive\",\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"hive\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void configRule_showCatalogListError() throws Exception {
        List<CatalogRuleEntity> catalogRuleEntityList = new ArrayList<>();
        when(catalogRuleMapper.selectRuleInfo(any())).thenReturn(catalogRuleEntityList);
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.BAD_REQUEST,"error"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"rule\": [\n" +
                                "    {\n" +
                                "      \"name\": \"AggregationNode\",\n" +
                                "      \"is_enable\": \"true\"\n" +
                                "    }\n" +
                                "  ],\n" +
                                "  \"datasourceType\": \"mysql\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void getCatalogRule_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/rule/{operator}","FilterNode"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void getCatalogRuleList_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/rule/all"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }
}
