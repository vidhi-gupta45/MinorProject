package com.campuscare.notification;

import com.campuscare.auth.dto.LoginRequest;
import com.campuscare.issue.dto.CreateIssueRequest;
import com.campuscare.issue.entity.IssueCategory;
import com.campuscare.issue.repository.IssueCategoryRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class NotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IssueCategoryRepository categoryRepository;

    private String aliceToken;
    private String itHandlerToken;
    private Long itCategoryId;

    @BeforeEach
    void setUp() throws Exception {
        aliceToken = loginAndGetToken("student.alice@campuscare.edu", "Student@123");
        itHandlerToken = loginAndGetToken("faculty.it@campuscare.edu", "Faculty@123");

        IssueCategory itCat = categoryRepository.findByCode("IT_TECHNICAL").orElseThrow();
        itCategoryId = itCat.getId();
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
    @DisplayName("Issue creation and workflow events should generate in-app notifications and support read transitions")
    void testNotificationLifecycle() throws Exception {
        // 1. Alice creates an IT issue (auto-assigned to IT handler)
        CreateIssueRequest createReq = new CreateIssueRequest(
                "Projector Bulb Blinking in Seminar Hall",
                "The ceiling projector keeps shutting down every 3 minutes.",
                itCategoryId,
                "Seminar Hall B",
                "HIGH"
        );

        mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        // Give async event processing a brief moment
        Thread.sleep(500);

        // 2. Alice queries unread notification count
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", greaterThanOrEqualTo(1)));

        // 3. Alice gets notifications list
        MvcResult notifResult = mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andReturn();

        long firstNotificationId = objectMapper.readTree(notifResult.getResponse().getContentAsString())
                .path("data").path("content").get(0).path("id").asLong();

        // 4. Mark single notification as read
        mockMvc.perform(patch("/api/notifications/" + firstNotificationId + "/read")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isRead", is(true)));

        // 5. Mark all as read
        mockMvc.perform(post("/api/notifications/mark-all-read")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 6. Verify unread count is now 0 for Alice
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is(0)));
    }
}
