package com.campuscare.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveIssueRequest(
        @NotBlank(message = "Resolution notes are required")
        @Size(min = 10, max = 3000, message = "Resolution notes must be at least 10 characters detailing the fix")
        String resolutionNotes
) {}
