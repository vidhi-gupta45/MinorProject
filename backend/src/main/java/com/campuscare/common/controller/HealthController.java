package com.campuscare.common.controller;

import com.campuscare.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health Check", description = "System health check endpoints")
public class HealthController {

    @GetMapping
    @Operation(summary = "Get system health status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> status = Map.of(
                "status", "UP",
                "service", "campuscare-backend",
                "version", "1.0.0",
                "timestamp", Instant.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.ok("CampusCare backend is healthy", status));
    }
}
