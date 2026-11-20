package com.campuscare.workflow;

import com.campuscare.auth.dto.LoginRequest;
import com.campuscare.issue.dto.CreateIssueRequest;
import com.campuscare.issue.entity.IssueCategory;
import com.campuscare.issue.repository.IssueCategoryRepository;
import com.campuscare.workflow.dto.CreateStaffNoteRequest;
import com.campuscare.workflow.dto.ReopenIssueRequest;
import com.campuscare.workflow.dto.ResolveIssueRequest;
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
class HandlerWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IssueCategoryRepository categoryRepository;

    private String studentToken;
    private String itHandlerToken;
    private String maintHandlerToken;
    private Long itCategoryId;
    private Long otherCategoryId;

    @BeforeEach
    void setUp() throws Exception {
        studentToken = loginAndGetToken("student.alice@campuscare.edu", "Student@123");
        itHandlerToken = loginAndGetToken("faculty.it@campuscare.edu", "Faculty@123");
        maintHandlerToken = loginAndGetToken("faculty.maint@campuscare.edu", "Faculty@123");

        IssueCategory itCat = categoryRepository.findByCode("IT_TECHNICAL").orElseThrow();
        itCategoryId = itCat.getId();

        IssueCategory otherCat = categoryRepository.findByCode("OTHER").orElseThrow();
        otherCategoryId = otherCat.getId();
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
    @DisplayName("Auto-routing: Issue routes to assigned handler or falls back to UNASSIGNED")
    void testAutoRouting() throws Exception {
        // 1. Submit issue with IT_TECHNICAL category -> routes to IT handler
        CreateIssueRequest itRequest = new CreateIssueRequest(
                "Lab PC 5 Display not working",
                "Monitor keeps flickering in lab 2.",
                itCategoryId,
                "Lab 2, Block A",
                "MEDIUM"
        );

        mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("ASSIGNED")))
                .andExpect(jsonPath("$.data.assignedTo.email", is("faculty.it@campuscare.edu")));

        // 2. Submit issue with OTHER category (no active routing rule) -> UNASSIGNED
        CreateIssueRequest otherRequest = new CreateIssueRequest(
                "Unclassified Department Query",
                "General query with no active routing category rule.",
                otherCategoryId,
                "Office Corridor",
                "LOW"
        );

        mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otherRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("UNASSIGNED")))
                .andExpect(jsonPath("$.data.assignedTo", nullValue()));
    }

    @Test
    @DisplayName("Complete Handler Lifecycle: ASSIGNED -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED -> CLOSED")
    void testCompleteResolutionWorkflow() throws Exception {
        // 1. Student creates IT issue
        CreateIssueRequest request = new CreateIssueRequest(
                "Wi-Fi down in CSE seminar hall",
                "Access point has red indicator light blinking constantly.",
                itCategoryId,
                "Seminar Hall Block B",
                "HIGH"
        );

        MvcResult createResult = mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("ASSIGNED")))
                .andReturn();

        long issueId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 2. Unauthorized handler (Maintenance) tries to acknowledge -> 403 Forbidden
        mockMvc.perform(post("/api/issues/" + issueId + "/acknowledge")
                        .header("Authorization", "Bearer " + maintHandlerToken))
                .andExpect(status().isForbidden());

        // 3. Authorized IT handler acknowledges -> ACKNOWLEDGED
        mockMvc.perform(post("/api/issues/" + issueId + "/acknowledge")
                        .header("Authorization", "Bearer " + itHandlerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACKNOWLEDGED")))
                .andExpect(jsonPath("$.data.acknowledgedAt", notNullValue()));

        // 4. IT handler starts work -> IN_PROGRESS
        mockMvc.perform(post("/api/issues/" + issueId + "/start")
                        .header("Authorization", "Bearer " + itHandlerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")));

        // 5. IT handler adds an internal staff note
        CreateStaffNoteRequest noteRequest = new CreateStaffNoteRequest("Replaced PoE injector switch; monitoring throughput.");
        mockMvc.perform(post("/api/issues/" + issueId + "/internal-notes")
                        .header("Authorization", "Bearer " + itHandlerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noteRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.visibility", is("INTERNAL_STAFF")));

        // 6. Student views issue -> internal staff note MUST NOT be visible!
        mockMvc.perform(get("/api/issues/" + issueId)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.comments[?(@.visibility == 'INTERNAL_STAFF')]", empty()));

        // 7. IT handler marks RESOLVED with notes
        ResolveIssueRequest resolveReq = new ResolveIssueRequest("Firmware upgraded and PoE switch replaced. Wi-Fi verified with 150 Mbps.");
        mockMvc.perform(post("/api/issues/" + issueId + "/resolve")
                        .header("Authorization", "Bearer " + itHandlerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("RESOLVED")))
                .andExpect(jsonPath("$.data.resolutionNotes", containsString("Firmware upgraded")));

        // 8. Student confirms resolution -> CLOSED
        mockMvc.perform(post("/api/issues/" + issueId + "/confirm-resolution")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")))
                .andExpect(jsonPath("$.data.closedAt", notNullValue()));
    }

    @Test
    @DisplayName("Reopen Workflow: Student reports issue persists -> REOPENED with reopenCount increment")
    void testReopenWorkflow() throws Exception {
        // 1. Create and progress issue to RESOLVED
        CreateIssueRequest request = new CreateIssueRequest(
                "Projector lamp dim in Room 204",
                "Lamp brightness has deteriorated significantly.",
                itCategoryId,
                "Room 204",
                "MEDIUM"
        );

        MvcResult createResult = mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        long issueId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Acknowledge -> Start -> Resolve
        mockMvc.perform(post("/api/issues/" + issueId + "/acknowledge")
                .header("Authorization", "Bearer " + itHandlerToken));
        mockMvc.perform(post("/api/issues/" + issueId + "/start")
                .header("Authorization", "Bearer " + itHandlerToken));

        ResolveIssueRequest resolveReq = new ResolveIssueRequest("Cleaned lens and adjusted projector lamp brightness settings.");
        mockMvc.perform(post("/api/issues/" + issueId + "/resolve")
                .header("Authorization", "Bearer " + itHandlerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resolveReq)));

        // 2. Student reopens issue
        ReopenIssueRequest reopenReq = new ReopenIssueRequest("Lamp is still dim and projector shuts down after 5 minutes.");
        mockMvc.perform(post("/api/issues/" + issueId + "/reopen")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reopenReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("REOPENED")))
                .andExpect(jsonPath("$.data.reopenCount", is(1)));

        // 3. Handler restarts work on reopened issue -> IN_PROGRESS
        mockMvc.perform(post("/api/issues/" + issueId + "/start")
                        .header("Authorization", "Bearer " + itHandlerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")));
    }
}
