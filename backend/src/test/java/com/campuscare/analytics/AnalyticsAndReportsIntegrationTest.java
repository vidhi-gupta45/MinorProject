package com.campuscare.analytics;

import com.campuscare.auth.dto.LoginRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AnalyticsAndReportsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String hodToken;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        hodToken = loginAndGetToken("hod.cs@campuscare.edu", "Hod@123");
        adminToken = loginAndGetToken("admin@campuscare.edu", "Admin@123");
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("HOD should receive aggregated department analytics with distributions and SLA rate")
    void testDepartmentAnalytics() throws Exception {
        mockMvc.perform(get("/api/analytics/department")
                        .header("Authorization", "Bearer " + hodToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalIssues", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.slaComplianceRate", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.data.statusDistribution", notNullValue()))
                .andExpect(jsonPath("$.data.categoryDistribution", notNullValue()))
                .andExpect(jsonPath("$.data.priorityDistribution", notNullValue()));
    }

    @Test
    @DisplayName("Admin should receive campus-wide institutional analytics")
    void testInstitutionalAnalytics() throws Exception {
        mockMvc.perform(get("/api/analytics/institution")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalIssues", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.slaComplianceRate", greaterThanOrEqualTo(0.0)));
    }

    @Test
    @DisplayName("HOD should successfully download RFC 4180 compliant CSV export")
    void testCsvExport() throws Exception {
        mockMvc.perform(get("/api/reports/issues/export")
                        .header("Authorization", "Bearer " + hodToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=\"campuscare-issues-")))
                .andExpect(content().string(containsString("Public Issue ID,Title,Category,Department,Priority,Status")));
    }
}
