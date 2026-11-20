package com.campuscare.issue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank(message = "Comment body cannot be blank")
        @Size(max = 2000, message = "Comment must not exceed 2000 characters")
        String body
) {}
