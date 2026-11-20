package com.campuscare.admin;

import com.campuscare.admin.dto.CreateUserRequest;
import com.campuscare.admin.dto.UpdateSlaPolicyRequest;
import com.campuscare.admin.dto.UpdateUserRequest;
import com.campuscare.auth.dto.LoginRequest;
import com.campuscare.user.entity.Role;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String studentToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = loginAndGetToken("admin@campuscare.edu", "Admin@123");
        studentToken = loginAndGetToken("student.alice@campuscare.edu", "Student@123");
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data")
                .path("accessToken")
                .asText();
    }

    @Test
    @DisplayName("Admin stats: Admin can fetch high-level system indicators")
    void testAdminStats_Success() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers", greaterThan(0)))
                .andExpect(jsonPath("$.data.totalCategories", greaterThan(0)))
                .andExpect(jsonPath("$.data.systemStatus", is("OPERATIONAL")));
    }

    @Test
    @DisplayName("Security barrier: Student cannot access admin endpoints (403)")
    void testNonAdminAccess_Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User Management: Admin can provision, search, and update users")
    void testUserManagement_Crud() throws Exception {
        String uniqueEmail = "prof.new" + System.currentTimeMillis() + "@campuscare.edu";
        CreateUserRequest createReq = new CreateUserRequest();
        createReq.setFullName("Prof. New Member");
        createReq.setEmail(uniqueEmail);
        createReq.setPassword("Password@123");
        createReq.setRole(Role.ROLE_FACULTY);
        createReq.setPhoneNumber("9998887776");

        MvcResult createResult = mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email", is(uniqueEmail)))
                .andExpect(jsonPath("$.data.role", is("ROLE_FACULTY")))
                .andReturn();

        Long createdUserId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Search user
        mockMvc.perform(get("/api/admin/users")
                        .param("search", uniqueEmail)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email", is(uniqueEmail)));

        // Update user
        UpdateUserRequest updateReq = new UpdateUserRequest();
        updateReq.setFullName("Prof. New Member Updated");
        updateReq.setRole(Role.ROLE_FACULTY);
        updateReq.setActive(false);

        mockMvc.perform(put("/api/admin/users/" + createdUserId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName", is("Prof. New Member Updated")))
                .andExpect(jsonPath("$.data.active", is(false)));
    }

    @Test
    @DisplayName("Category & SLA Management: Admin can view categories and update SLA policies")
    void testCategoryAndSlaPolicy_Management() throws Exception {
        mockMvc.perform(get("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(9))));

        MvcResult slaResult = mockMvc.perform(get("/api/admin/sla-policies")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThan(0))))
                .andReturn();

        Long firstPolicyId = objectMapper.readTree(slaResult.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        UpdateSlaPolicyRequest updateSlaReq = new UpdateSlaPolicyRequest(4, 18, true);
        mockMvc.perform(put("/api/admin/sla-policies/" + firstPolicyId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateSlaReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.responseTargetHours", is(4)))
                .andExpect(jsonPath("$.data.resolutionTargetHours", is(18)));
    }

    @Test
    @DisplayName("Audit logs: Admin can query system audit event logs")
    void testAuditLogs_Query() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }
}
