package com.campuscare.workflow;

import com.campuscare.auth.dto.LoginRequest;
import com.campuscare.issue.dto.CreateIssueRequest;
import com.campuscare.issue.entity.IssueCategory;
import com.campuscare.issue.repository.IssueCategoryRepository;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import com.campuscare.workflow.dto.ReassignIssueRequest;
import com.campuscare.workflow.dto.RejectIssueRequest;
import com.campuscare.workflow.service.SlaEscalationScheduler;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HodDepartmentWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IssueCategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SlaEscalationScheduler slaEscalationScheduler;

    private String hodToken;
    private String aliceToken;
    private Long itCategoryId;
    private Long maintHandlerId;

    @BeforeEach
    void setUp() throws Exception {
        hodToken = loginAndGetToken("hod.cs@campuscare.edu", "Hod@123");
        aliceToken = loginAndGetToken("student.alice@campuscare.edu", "Student@123");

        IssueCategory itCat = categoryRepository.findByCode("IT_TECHNICAL").orElseThrow();
        itCategoryId = itCat.getId();

        User maint = userRepository.findByEmail("faculty.maint@campuscare.edu").orElseThrow();
        maintHandlerId = maint.getId();
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
    @DisplayName("HOD queries department workload summary and department issues list")
    void testHodDepartmentOverview() throws Exception {
        mockMvc.perform(get("/api/hod/summary")
                        .header("Authorization", "Bearer " + hodToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.activeHandlersCount", greaterThanOrEqualTo(1)));

        mockMvc.perform(get("/api/hod/issues")
                        .header("Authorization", "Bearer " + hodToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", notNullValue()));
    }

    @Test
    @DisplayName("HOD reassigns issue to another handler with audit logging")
    void testHodReassignIssue() throws Exception {
        // 1. Alice creates issue
        CreateIssueRequest createReq = new CreateIssueRequest(
                "Lab PC Blue Screen in Lab 3",
                "Workstation 12 displays blue screen stop code on startup.",
                itCategoryId,
                "Block C, Lab 3",
                "HIGH"
        );

        MvcResult createResult = mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long issueId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 2. HOD reassigns issue to Maintenance Handler
        ReassignIssueRequest reassignReq = new ReassignIssueRequest(
                maintHandlerId,
                "Hardware power supply faulty, assigning to electrical maintenance."
        );

        mockMvc.perform(post("/api/hod/issues/" + issueId + "/reassign")
                        .header("Authorization", "Bearer " + hodToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reassignReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.assignedTo.email", is("faculty.maint@campuscare.edu")))
                .andExpect(jsonPath("$.data.histories[?(@.eventType == 'REASSIGNED')]", not(empty())));
    }

    @Test
    @DisplayName("HOD rejects frivolous complaint with mandatory reason")
    void testHodRejectIssue() throws Exception {
        CreateIssueRequest createReq = new CreateIssueRequest(
                "Personal laptop battery drains too fast",
                "My personal laptop battery discharges within an hour in the canteen.",
                itCategoryId,
                "Campus Canteen",
                "LOW"
        );

        MvcResult createResult = mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long issueId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        RejectIssueRequest rejectReq = new RejectIssueRequest(
                "CampusCare only handles university-owned equipment and facilities. Personal device repairs are not covered."
        );

        mockMvc.perform(post("/api/hod/issues/" + issueId + "/reject")
                        .header("Authorization", "Bearer " + hodToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("REJECTED")))
                .andExpect(jsonPath("$.data.rejectionReason", containsString("Personal device repairs are not covered")));
    }

    @Test
    @DisplayName("SLA Escalation engine runs without error")
    void testSlaEscalationExecution() {
        int escalated = slaEscalationScheduler.checkAndEscalateBreachedIssues();
        org.junit.jupiter.api.Assertions.assertTrue(escalated >= 0);
    }
}
