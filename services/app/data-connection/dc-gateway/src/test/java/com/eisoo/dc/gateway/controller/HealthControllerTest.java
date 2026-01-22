package com.eisoo.dc.gateway.controller;

import org.junit.Before;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@AutoConfigureMockMvc
@RunWith(SpringRunner.class)
@DisplayName("健康检查单元测试")
public class HealthControllerTest {

    @Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;

    @Before
    public void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    public void readyTest_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/health/ready")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    public void aliveTest_ok() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/virtual_engine_service/v1/health/alive")
                        .header("X-Presto-User","admin"))
                .andExpect(MockMvcResultMatchers.status().isOk());
    }
}
