package com.campuscare.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStaffNoteRequest(
        @NotBlank(message = "Internal note text cannot be blank")
        @Size(max = 2000, message = "Note must not exceed 2000 characters")
        String body
) {}
