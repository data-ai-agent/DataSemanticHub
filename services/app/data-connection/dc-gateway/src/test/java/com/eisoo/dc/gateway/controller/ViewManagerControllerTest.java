package com.eisoo.dc.gateway.controller;

import cn.hutool.core.io.IORuntimeException;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.eisoo.dc.common.metadata.mapper.TblsMapper;
import com.eisoo.dc.common.vo.ViewTableVo;
import com.eisoo.dc.gateway.domain.vo.HttpResInfo;
import com.eisoo.dc.gateway.service.impl.GatewayCatalogServiceImpl;
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
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("视图单元测试")
public class ViewManagerControllerTest {

    @Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;
    private MockedStatic<HttpOpenUtils> httpClient;


    @MockBean
    private TblsMapper tblsMapper;
    @MockBean
    private GatewayCatalogServiceImpl catalogService;
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
    public void createViewTest_ok() throws Exception {
        when(tblsMapper.existViewByCatalog(any())).thenReturn(null);
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        when(catalogService.create(any())).thenReturn(ResponseEntity.ok(null));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FINISHED\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "  \"viewName\": \"agent1\",\n" +
                                "  \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void createViewTest_openlookengError() throws Exception {
        when(tblsMapper.existViewByCatalog(any())).thenReturn(null);
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"))
                .thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        when(catalogService.create(any())).thenReturn(ResponseEntity.ok(null));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt()))
                .thenThrow(new IORuntimeException(" SocketTimeoutException: connect timed out"));
        //1
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "  \"viewName\": \"agent1\",\n" +
                                "  \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
        //2
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "  \"viewName\": \"agent1\",\n" +
                                "  \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void createViewTest_catalogNameError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"1.default\",\n" +
                                "    \"viewName\": \"test\",\n" +
                                "    \"query\": \"select * from maria_umkwxlae.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createViewTest_catalogNotExist() throws Exception {
        when(tblsMapper.existViewByCatalog(anyString())).thenReturn(null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"test_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\",\n" +
                                "    \"query\": \"select * from maria_umkwxlae.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createViewTest_viewNameError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"viewName\": \"A\",\n" +
                                "  \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createViewTest_viewExist() throws Exception {
        ViewTableVo record = new ViewTableVo();
        when(tblsMapper.existViewByCatalog(anyString())).thenReturn(record);
        when(tblsMapper.existView(anyString(),anyString())).thenReturn("test");
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"test_vdm.default\",\n" +
                                "    \"viewName\": \"test\",\n" +
                                "    \"query\": \"select * from maria_umkwxlae.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createViewTest_failed() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        when(catalogService.create(any())).thenReturn(ResponseEntity.ok(null));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FAILED\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"viewName\": \"agent1\",\n" +
                                "  \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void createViewTest_error() throws Exception {
        httpClient.when(()->HttpOpenUtils.sendGet(anyString(),anyString())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"[]"));
        when(catalogService.create(any())).thenReturn(ResponseEntity.ok(null));
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"ERROR\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"viewName\": \"agent1\",\n" +
                                "  \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void viewListTest_ok() throws Exception {
        IPage<ViewTableVo> viewTableVoIPage = new Page<>();
        ArrayList<ViewTableVo> records = new ArrayList<>();
        ViewTableVo record = new ViewTableVo();
        records.add(record);
        viewTableVoIPage.setRecords(records);
        when(tblsMapper.queryList(any(),any(),any(),any())).thenReturn(viewTableVoIPage);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/view")
                        .header("X-Presto-User","admin")
                        .param("pageNum","2")
                        .param("pageSize","2"))
                .andExpect(MockMvcResultMatchers.status().isOk());


        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/view")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void viewListTest_paramError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/view")
                        .header("X-Presto-User","admin")
                        .param("pageNum","0")
                        .param("pageSize","0"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void replaceViewTest_ok() throws Exception {
        ViewTableVo record = new ViewTableVo();
        when(tblsMapper.existViewByCatalog(anyString())).thenReturn(record);
        when(tblsMapper.existView(anyString(),anyString())).thenReturn("test");
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\",\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FINISHED\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/replace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\",\n" +
                                "    \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void replaceViewTest_catalogNameError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/replace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"1.default\",\n" +
                                "    \"viewName\": \"agent1\",\n" +
                                "    \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void replaceViewTest_catalogNotExist() throws Exception {
        when(tblsMapper.existViewByCatalog(anyString())).thenReturn(null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/replace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"test_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\",\n" +
                                "    \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void replaceViewTest_viewNameError() throws Exception {
        ViewTableVo record = new ViewTableVo();
        when(tblsMapper.existViewByCatalog(anyString())).thenReturn(record);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/replace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"A\",\n" +
                                "    \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void replaceViewTest_viewNotExist() throws Exception {
        ViewTableVo record = new ViewTableVo();
        when(tblsMapper.existViewByCatalog(anyString())).thenReturn(record);
        when(tblsMapper.existView(anyString(),anyString())).thenReturn(null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/replace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\",\n" +
                                "    \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void replaceViewTest_failed() throws Exception {
        ViewTableVo record = new ViewTableVo();
        when(tblsMapper.existViewByCatalog(anyString())).thenReturn(record);
        when(tblsMapper.existView(anyString(),anyString())).thenReturn("test");
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\",\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FAILED\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/replace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\",\n" +
                                "    \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void replaceViewTest_error() throws Exception {
        ViewTableVo record = new ViewTableVo();
        when(tblsMapper.existViewByCatalog(anyString())).thenReturn(record);
        when(tblsMapper.existView(anyString(),anyString())).thenReturn("test");
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\",\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"ERROR\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/replace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\",\n" +
                                "    \"query\": \"select * from mysql1.af_main.agent limit 1000\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }

    @Test
    public void deleteViewTest_ok() throws Exception {
        when(tblsMapper.existView(anyString(),anyString())).thenReturn("test");
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\",\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FINISHED\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void deleteViewTest_defaultViewError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"olk_view_vdm\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void deleteViewTest_viewNotExist() throws Exception {
        when(tblsMapper.existView(anyString(),anyString())).thenReturn(null);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void deleteViewTest_failed() throws Exception {
        when(tblsMapper.existView(anyString(),anyString())).thenReturn("test");
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\",\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"FAILED\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void deleteViewTest_error() throws Exception {
        when(tblsMapper.existView(anyString(),anyString())).thenReturn("test");
        httpClient.when(()->HttpOpenUtils.sendPostOlk(anyString(),anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"id\": \"xxx\",\"nextUri\": \"xxx\"}"));
        httpClient.when(()->HttpOpenUtils.sendGetOlk(anyString(),anyString(),anyInt())).thenReturn(new HttpResInfo(HttpStatus.SUCCESS,"{\"stats\": {\"state\": \"ERROR\"},\"error\": {\"message\": \"xxx\",\"errorName\": \"xxx\"}}"));
        mockMvc.perform(MockMvcRequestBuilders.post("/api/virtual_engine_service/v1/view/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "    \"catalogName\": \"olk_view_vdm.default\",\n" +
                                "    \"viewName\": \"agent1\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.ERROR));
    }
}
