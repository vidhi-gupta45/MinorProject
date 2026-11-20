package com.campuscare.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectIssueRequest(
        @NotBlank(message = "Rejection reason is mandatory")
        @Size(min = 5, max = 2000, message = "Rejection reason must be at least 5 characters")
        String reason
) {}
