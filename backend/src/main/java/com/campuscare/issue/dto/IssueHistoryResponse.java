package com.campuscare.issue.dto;

import com.campuscare.issue.entity.IssueHistory;

public record IssueHistoryResponse(
        Long id,
        String actorName,
        String actorRole,
        String eventType,
        String oldStatus,
        String newStatus,
        String comment,
        String createdAt
) {
    public static IssueHistoryResponse fromEntity(IssueHistory history) {
        if (history == null) return null;
        return new IssueHistoryResponse(
                history.getId(),
                history.getActor() != null ? history.getActor().getFullName() : "System",
                history.getActor() != null ? history.getActor().getRole().name() : "SYSTEM",
                history.getEventType(),
                history.getOldStatus(),
                history.getNewStatus(),
                history.getComment(),
                history.getCreatedAt().toString()
        );
    }
}
