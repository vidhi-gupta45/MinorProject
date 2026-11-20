package com.campuscare.issue;

import com.campuscare.auth.dto.LoginRequest;
import com.campuscare.issue.dto.CreateCommentRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StudentIssueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IssueCategoryRepository categoryRepository;

    private String aliceToken;
    private String bobToken;
    private Long academicCategoryId;

    @BeforeEach
    void setUp() throws Exception {
        // Login as Alice (Student)
        LoginRequest aliceLogin = new LoginRequest("student.alice@campuscare.edu", "Student@123");
        MvcResult aliceResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(aliceLogin)))
                .andExpect(status().isOk())
                .andReturn();

        aliceToken = objectMapper.readTree(aliceResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // Login as Bob (Student)
        LoginRequest bobLogin = new LoginRequest("student.bob@campuscare.edu", "Student@123");
        MvcResult bobResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bobLogin)))
                .andExpect(status().isOk())
                .andReturn();

        bobToken = objectMapper.readTree(bobResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // Get Academic Category ID
        IssueCategory category = categoryRepository.findByCode("ACADEMIC")
                .orElseThrow();
        academicCategoryId = category.getId();
    }

    @Test
    @DisplayName("Student should successfully submit an issue and receive formatted CC-YYYY-XXXXX ID")
    void testCreateIssue() throws Exception {
        CreateIssueRequest request = new CreateIssueRequest(
                "Broken Chair in Lecture Hall 101",
                "Two chairs in the third row are broken and unstable.",
                academicCategoryId,
                "Block C, Room 101",
                "MEDIUM"
        );

        mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.publicIssueId", matchesPattern("^CC-\\d{4}-\\d{5}$")))
                .andExpect(jsonPath("$.data.status", anyOf(is("SUBMITTED"), is("ASSIGNED"))))
                .andExpect(jsonPath("$.data.priority", is("MEDIUM")))
                .andExpect(jsonPath("$.data.reporter.email", is("student.alice@campuscare.edu")));
    }

    @Test
    @DisplayName("Student should query their reported issues list")
    void testGetMyIssues() throws Exception {
        mockMvc.perform(get("/api/issues/my")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", notNullValue()));
    }

    @Test
    @DisplayName("Security Scenario: Bob cannot access Alice's issue (403 Forbidden)")
    void testStudentCannotAccessOtherStudentsIssue() throws Exception {
        // 1. Alice creates an issue
        CreateIssueRequest request = new CreateIssueRequest(
                "Alice Private Complaint",
                "Private classroom issue description",
                academicCategoryId,
                "Room 202",
                "LOW"
        );

        MvcResult createResult = mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        long aliceIssueId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 2. Alice can view her issue -> 200 OK
        mockMvc.perform(get("/api/issues/" + aliceIssueId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is((int) aliceIssueId)));

        // 3. Bob attempts to view Alice's issue -> 403 Forbidden
        mockMvc.perform(get("/api/issues/" + aliceIssueId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.errorCode", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("Student can add comment to own issue and get student dashboard metrics")
    void testAddCommentAndMetrics() throws Exception {
        // 1. Alice creates an issue
        CreateIssueRequest request = new CreateIssueRequest(
                "Issue for comment test",
                "Description for comment",
                academicCategoryId,
                "Lab 3",
                "HIGH"
        );

        MvcResult createResult = mockMvc.perform(post("/api/issues")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        long issueId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 2. Alice adds a comment
        CreateCommentRequest commentReq = new CreateCommentRequest("Please inspect this as soon as possible.");
        mockMvc.perform(post("/api/issues/" + issueId + "/comments")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.authorName", is("Alice Student")))
                .andExpect(jsonPath("$.data.visibility", is("STUDENT_VISIBLE")));

        // 3. Alice gets dashboard metrics
        mockMvc.perform(get("/api/issues/student/dashboard")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalSubmitted", greaterThanOrEqualTo(1)));
    }
}
