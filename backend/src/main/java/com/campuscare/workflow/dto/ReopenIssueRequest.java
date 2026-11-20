package com.campuscare.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReopenIssueRequest(
        @NotBlank(message = "Reopening reason is required")
        @Size(min = 5, max = 2000, message = "Please explain why the issue persists (at least 5 characters)")
        String reason
) {}
