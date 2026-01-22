package com.eisoo.dc.gateway.controller;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.eisoo.dc.common.metadata.entity.TableScanEntity;
import com.eisoo.dc.common.metadata.mapper.FieldScanMapper;
import com.eisoo.dc.common.metadata.mapper.TableScanMapper;
import com.eisoo.dc.gateway.domain.vo.Ext;
import com.eisoo.dc.gateway.domain.vo.IntrospectInfo;
import com.eisoo.dc.gateway.service.impl.GatewayCatalogServiceImpl;
import com.eisoo.dc.gateway.service.impl.GatewayGatewayViewServiceImpl;
import com.eisoo.dc.gateway.util.AFUtil;
import com.eisoo.dc.gateway.util.GatewayASUtil;
import com.eisoo.dc.gateway.util.HttpOpenUtils;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("Excel单元测试")
public class ExcelControllerTest {
    @Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;
    private MockedStatic<HttpOpenUtils> httpClient;
    private MockedStatic<GatewayASUtil> asUtil;

    @MockBean
    private GatewayCatalogServiceImpl catalogService;
    @MockBean
    private GatewayGatewayViewServiceImpl viewService;
    @MockBean
    private TableScanMapper tableScanMapper;
    @MockBean
    private FieldScanMapper fieldScanMapper;
    @MockBean
    private AFUtil afUtil;
    private final IntrospectInfo introspectInfo = new IntrospectInfo();

    @Before
    public void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
        this.httpClient = mockStatic(HttpOpenUtils.class);
        this.asUtil = mockStatic(GatewayASUtil.class);

        JSONObject dirJson = new JSONObject();
        JSONArray filesArray = new JSONArray();
        JSONObject file = new JSONObject();
        file.put("name", "test.xlsx");
        file.put("docid", "gns://A5D9C6643A624D15B0876ED9763D8846/2C4B8C94E8CA4BFB898DD3DBBD126F86");
        filesArray.add(file);
        dirJson.put("files", filesArray);
        asUtil.when(()-> GatewayASUtil.getToken(anyString(),anyString(),anyString(),anyString())).thenReturn("mock_token");
        asUtil.when(()-> GatewayASUtil.getDocid(anyString(),anyString(),anyString())).thenReturn("docid");
        asUtil.when(()-> GatewayASUtil.loadDir(any(),any(),any())).thenReturn(dirJson);
        showCatalogInfo("excel", "test_dir/test.xlsx");
        getInputStream();

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
        when(afUtil.getIntrospectInfoByToken(any(),any(),any())).thenReturn(introspectInfo);
    }

    @After
    public void teardown() {
        this.httpClient.close();
        this.asUtil.close();
    }

    public void getInputStream() throws Exception {
        // 创建一个新的工作簿
        Workbook workbook = new XSSFWorkbook();
        // 创建一个工作表(sheet)
        Sheet sheet = workbook.createSheet("test_sheet");
        Row row = sheet.createRow(0);
        Cell cell = row.createCell(0);
        cell.setCellValue("test_cell");
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        ByteArrayInputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
        asUtil.when(()-> GatewayASUtil.getInputStream(anyString(),anyString(),anyString())).thenReturn(inputStream);
    }

    public void showCatalogInfo(String connectorName, String base) {
        JSONObject json = new JSONObject();
        json.put("excel.catalog", "test_catalog");
        json.put("excel.protocol","anyshare");
        json.put("connector.name", connectorName);
        json.put("excel.base", base);
        json.put("excel.host", "10.4.14.16");
        json.put("excel.port", "443");
        json.put("excel.username", "0a1c0d78-dc3a-4b95-a9c8-35cd00c0f273");
        json.put("excel.password", "test");
        when(catalogService.showCatalogInfo(any())).thenReturn(json.toJSONString());
    }

    @Test
    public void filesBaseFileTest_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/excel/files/{catalog}", "test_catalog")
                        .header("Authorization","Bearer xxx"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void filesBaseDirTest_ok() throws Exception {
        showCatalogInfo("excel", "test_dir/");
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/excel/files/{catalog}", "test_catalog")
                        .header("Authorization","Bearer xxx"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void filesCatalogTypeTest_error() throws Exception {
        JSONObject json = new JSONObject();
        json.put("connector.name", "vdm");
        when(catalogService.showCatalogInfo(any())).thenReturn(json.toJSONString());
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/excel/files/{catalog}", "test_catalog")
                        .header("Authorization","Bearer xxx"))
                .andExpect(MockMvcResultMatchers.status().is4xxClientError());
    }

    @Test
    public void sheetTest_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/excel/sheet")
                        .header("Authorization","Bearer xxx")
                        .header("X-Presto-User","admin")
                        .param("catalog","test_catalog")
                        .param("file_name","test.xlsx"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void columnsNotHeadersTest_ok() throws Exception {
        JSONObject json = new JSONObject();
        json.put("catalog", "test_catalog");
        json.put("vdm_catalog", "test_vdm");
        json.put("table_name", "test_table");
        json.put("file_name", "test.xlsx");
        json.put("sheet", "test_sheet");
        json.put("all_sheet", false);
        json.put("sheet_as_new_column", false);
        json.put("start_cell", "A1");
        json.put("end_cell", "B4");
        json.put("has_headers", false);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/excel/columns")
                        .header("Authorization","Bearer xxx")
                        .header("X-Presto-User","admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.toJSONString()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void columnsWithHeadersTest_ok() throws Exception {
        JSONObject json = new JSONObject();
        json.put("catalog", "test_catalog");
        json.put("vdm_catalog", "test_vdm");
        json.put("table_name", "test_table");
        json.put("file_name", "test.xlsx");
        json.put("sheet", "test_sheet");
        json.put("all_sheet", true);
        json.put("sheet_as_new_column", true);
        json.put("start_cell", "A1");
        json.put("end_cell", "B4");
        json.put("has_headers", true);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/excel/columns")
                        .header("Authorization","Bearer xxx")
                        .header("X-Presto-User","admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.toJSONString()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void createViewTest_ok() throws Exception {
        JSONObject json = new JSONObject();
        json.put("catalog", "test_catalog");
        json.put("vdm_catalog", "test_vdm");
        json.put("table_name", "test_table");
        json.put("file_name", "test.xlsx");
        json.put("sheet", "test_sheet");
        json.put("all_sheet", false);
        json.put("sheet_as_new_column", true);
        json.put("start_cell", "A1");
        json.put("end_cell", "A2");
        json.put("has_headers", true);

        JSONArray array = new JSONArray();
        JSONObject column1 = new JSONObject();
        column1.put("column", "test_column");
        column1.put("type", "varchar");
        array.add(column1);
        JSONObject column2 = new JSONObject();
        column2.put("column", "test_column2");
        column2.put("type", "varchar");
        array.add(column2);
        json.put("columns", array);

        when(viewService.createView(any(), anyString(), anyBoolean())).thenReturn(ResponseEntity.ok(null));
        when(tableScanMapper.insert(any())).thenReturn(0);
        when(fieldScanMapper.insert(any())).thenReturn(0);
        showCatalogInfo("vdm", "test_dir/test.xlsx");

        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/excel/view")
                        .header("Authorization","Bearer xxx")
                        .header("X-Presto-User","admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.toJSONString()))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void createViewTablenameIsNullTest_error() throws Exception {
        JSONObject json = new JSONObject();
        json.put("catalog", "test_catalog");
        json.put("vdm_catalog", "test_vdm");
        json.put("table_name", null);
        json.put("file_name", "test.xlsx");
        json.put("sheet", "test_sheet");
        json.put("all_sheet", false);
        json.put("sheet_as_new_column", true);
        json.put("start_cell", "A1");
        json.put("end_cell", "A2");
        json.put("has_headers", true);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/excel/view")
                        .header("Authorization","Bearer xxx")
                        .header("X-Presto-User","admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.toJSONString()))
                .andExpect(MockMvcResultMatchers.status().is4xxClientError());
    }

    @Test
    public void deleteViewTest_ok() throws Exception {
        showCatalogInfo("vdm", "test_dir/test.xlsx");
        List<TableScanEntity> list = new ArrayList<>();
        list.add(new TableScanEntity());
        when(tableScanMapper.selectList(any())).thenReturn(list);
        when(tableScanMapper.delete(any())).thenReturn(0);
        when(fieldScanMapper.delete(any())).thenReturn(0);
        when(viewService.deleteView(any(), anyString(), anyBoolean())).thenReturn(ResponseEntity.ok(null));

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/vega-data-source/v1/excel/view/{vdm_catalog}/{schema}/{view}",
                        "test_vdm", "default", "test_view")
                        .header("Authorization","Bearer xxx"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }
}
