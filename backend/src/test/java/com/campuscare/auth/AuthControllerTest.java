package com.campuscare.auth;

import com.campuscare.auth.dto.LoginRequest;
import com.campuscare.auth.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should successfully authenticate seeded student user")
    void testSuccessfulLogin() throws Exception {
        LoginRequest loginRequest = new LoginRequest("student.alice@campuscare.edu", "Student@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.user.email", is("student.alice@campuscare.edu")))
                .andExpect(jsonPath("$.data.user.role", is("ROLE_STUDENT")));
    }

    @Test
    @DisplayName("Should reject invalid password with 401")
    void testFailedLoginInvalidPassword() throws Exception {
        LoginRequest loginRequest = new LoginRequest("student.alice@campuscare.edu", "WrongPassword@999");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.errorCode", is("INVALID_CREDENTIALS")));
    }

    @Test
    @DisplayName("Should register new student and enforce ROLE_STUDENT")
    void testStudentRegistration() throws Exception {
        String uniqueEmail = "new.student." + System.currentTimeMillis() + "@campuscare.edu";
        RegisterRequest registerRequest = new RegisterRequest(
                "Fresh Student",
                uniqueEmail,
                "Password@123",
                1L,
                "9998887776"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.role", is("ROLE_STUDENT")))
                .andExpect(jsonPath("$.data.user.email", is(uniqueEmail)));
    }

    @Test
    @DisplayName("Should reject registration with duplicate email")
    void testDuplicateEmailRegistration() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "Duplicate Alice",
                "student.alice@campuscare.edu",
                "Password@123",
                1L,
                "9998887776"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.errorCode", is("BAD_REQUEST")));
    }

    @Test
    @DisplayName("Should access /api/auth/me with valid Bearer token and reject without")
    void testCurrentUserProfileAccess() throws Exception {
        // 1. Without token -> 401
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        // 2. Perform login to get token
        LoginRequest loginRequest = new LoginRequest("admin@campuscare.edu", "Admin@123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).path("data").path("accessToken").asText();

        // 3. With token -> 200 OK
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("admin@campuscare.edu")))
                .andExpect(jsonPath("$.data.role", is("ROLE_ADMIN")));
    }
}
