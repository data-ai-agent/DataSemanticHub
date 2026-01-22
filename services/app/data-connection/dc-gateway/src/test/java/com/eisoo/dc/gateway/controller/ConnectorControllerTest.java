package com.eisoo.dc.gateway.controller;

import com.eisoo.dc.gateway.util.HttpStatus;
import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.runner.RunWith;
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

@SpringBootTest
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("数据源连接器单元测试")
public class ConnectorControllerTest {
    @Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;

    @Before
    public void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    public void connectorListTest_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/connectors")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void connectorConfigTest_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/connectors/config/mysql")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void connectorConfigTest_typeUnsupported() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/connectors/config/tt")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void connectorImageTest_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/connectors/images/mysql")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void connectorImageTest_typeUnsupported() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/vega-data-source/v1/connectors/images/tt")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void connectorMappingTest_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/connectors/type/mapping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"sourceConnectorName\": \"mysql\",\n" +
                                "  \"targetConnectorName\": \"hive-hadoop2\",\n" +
                                "  \"type\": [\n" +
                                "    {\n" +
                                "      \"index\": 0,\n" +
                                "      \"sourceTypeName\": \"decimal\",\n" +
                                "      \"precision\": 12,\n" +
                                "      \"decimalDigits\": 1\n" +
                                "    },\n" +
                                "    {\n" +
                                "      \"index\": 1,\n" +
                                "      \"sourceTypeName\": \"int\"\n" +
                                "    }\n" +
                                "  ]\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void connectorMappingTest_MappingError() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/connectors/type/mapping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"sourceConnectorName\": \"hologres\",\n" +
                                "  \"targetConnectorName\": \"hologres\",\n" +
                                "  \"type\": [\n" +
                                "    {\n" +
                                "      \"index\": 0,\n" +
                                "      \"sourceTypeName\": \"decimal\",\n" +
                                "      \"precision\": 12,\n" +
                                "      \"decimalDigits\": 1\n" +
                                "    },\n" +
                                "    {\n" +
                                "      \"index\": 1,\n" +
                                "      \"sourceTypeName\": \"int\"\n" +
                                "    }\n" +
                                "  ]\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void connectorMappingTest_typeNull() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/connectors/type/mapping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"sourceConnectorName\": \"mysql\",\n" +
                                "  \"targetConnectorName\": \"hive-hadoop2\"\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void connectorMappingTest_sourceTypeUnsupported() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/connectors/type/mapping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"sourceConnectorName\": \"tt\",\n" +
                                "  \"targetConnectorName\": \"hive-hadoop2\",\n" +
                                "  \"type\": [\n" +
                                "    {\n" +
                                "      \"index\": 0,\n" +
                                "      \"sourceTypeName\": \"decimal\",\n" +
                                "      \"precision\": 12,\n" +
                                "      \"decimalDigits\": 1\n" +
                                "    },\n" +
                                "    {\n" +
                                "      \"index\": 1,\n" +
                                "      \"sourceTypeName\": \"int\"\n" +
                                "    }\n" +
                                "  ]\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }

    @Test
    public void connectorMappingTest_targetTypeUnsupported() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/vega-data-source/v1/connectors/type/mapping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Presto-User","admin")
                        .content("{\n" +
                                "  \"sourceConnectorName\": \"mysql\",\n" +
                                "  \"targetConnectorName\": \"tt\",\n" +
                                "  \"type\": [\n" +
                                "    {\n" +
                                "      \"index\": 0,\n" +
                                "      \"sourceTypeName\": \"decimal\",\n" +
                                "      \"precision\": 12,\n" +
                                "      \"decimalDigits\": 1\n" +
                                "    },\n" +
                                "    {\n" +
                                "      \"index\": 1,\n" +
                                "      \"sourceTypeName\": \"int\"\n" +
                                "    }\n" +
                                "  ]\n" +
                                "}"))
                .andExpect(MockMvcResultMatchers.status().is(HttpStatus.BAD_REQUEST));
    }
}
