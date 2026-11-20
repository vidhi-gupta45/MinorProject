package com.campuscare.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReassignIssueRequest(
        @NotNull(message = "New assignee ID is required")
        Long newAssigneeId,

        @NotBlank(message = "Reason for reassignment is required")
        @Size(min = 5, max = 1000, message = "Reason must be at least 5 characters")
        String reason
) {}
