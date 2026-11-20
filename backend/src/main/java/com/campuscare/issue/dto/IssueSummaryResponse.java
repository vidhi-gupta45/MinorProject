package com.campuscare.issue.dto;

import com.campuscare.issue.entity.Issue;

public record IssueSummaryResponse(
        Long id,
        String publicIssueId,
        String title,
        String categoryName,
        String categoryCode,
        String status,
        String priority,
        String location,
        String assignedHandlerName,
        int attachmentCount,
        int commentCount,
        String createdAt,
        String updatedAt
) {
    public static IssueSummaryResponse fromEntity(Issue issue) {
        if (issue == null) return null;
        return new IssueSummaryResponse(
                issue.getId(),
                issue.getPublicIssueId(),
                issue.getTitle(),
                issue.getCategory().getName(),
                issue.getCategory().getCode(),
                issue.getStatus().name(),
                issue.getPriority().name(),
                issue.getLocation(),
                issue.getAssignedTo() != null ? issue.getAssignedTo().getFullName() : "Unassigned",
                issue.getAttachments() != null ? issue.getAttachments().size() : 0,
                issue.getComments() != null ? issue.getComments().size() : 0,
                issue.getCreatedAt().toString(),
                issue.getUpdatedAt().toString()
        );
    }
}
