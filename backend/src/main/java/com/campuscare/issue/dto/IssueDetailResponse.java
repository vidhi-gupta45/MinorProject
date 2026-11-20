package com.campuscare.issue.dto;

import com.campuscare.auth.dto.DepartmentDto;
import com.campuscare.auth.dto.UserDto;
import com.campuscare.comment.entity.CommentVisibility;
import com.campuscare.issue.entity.Issue;

import java.util.List;

public record IssueDetailResponse(
        Long id,
        String publicIssueId,
        String title,
        String description,
        CategoryDto category,
        DepartmentDto department,
        UserDto reporter,
        UserDto assignedTo,
        String status,
        String priority,
        String location,
        String responseDueAt,
        String resolutionDueAt,
        String acknowledgedAt,
        String resolvedAt,
        String closedAt,
        String resolutionNotes,
        String rejectionReason,
        int reopenCount,
        int escalationLevel,
        boolean isOverdue,
        List<AttachmentResponse> attachments,
        List<CommentResponse> comments,
        List<IssueHistoryResponse> histories,
        String createdAt,
        String updatedAt
) {
    public static IssueDetailResponse fromEntity(Issue issue, boolean includeInternalNotes) {
        if (issue == null) return null;

        List<AttachmentResponse> attachmentList = issue.getAttachments() != null ?
                issue.getAttachments().stream().map(AttachmentResponse::fromEntity).toList() : List.of();

        List<CommentResponse> commentList = issue.getComments() != null ?
                issue.getComments().stream()
                        .filter(c -> includeInternalNotes || c.getVisibility() == CommentVisibility.STUDENT_VISIBLE)
                        .map(CommentResponse::fromEntity)
                        .toList() : List.of();

        List<IssueHistoryResponse> historyList = issue.getHistories() != null ?
                issue.getHistories().stream().map(IssueHistoryResponse::fromEntity).toList() : List.of();

        return new IssueDetailResponse(
                issue.getId(),
                issue.getPublicIssueId(),
                issue.getTitle(),
                issue.getDescription(),
                CategoryDto.fromEntity(issue.getCategory()),
                DepartmentDto.fromEntity(issue.getDepartment()),
                UserDto.fromEntity(issue.getReporter()),
                UserDto.fromEntity(issue.getAssignedTo()),
                issue.getStatus().name(),
                issue.getPriority().name(),
                issue.getLocation(),
                issue.getResponseDueAt() != null ? issue.getResponseDueAt().toString() : null,
                issue.getResolutionDueAt() != null ? issue.getResolutionDueAt().toString() : null,
                issue.getAcknowledgedAt() != null ? issue.getAcknowledgedAt().toString() : null,
                issue.getResolvedAt() != null ? issue.getResolvedAt().toString() : null,
                issue.getClosedAt() != null ? issue.getClosedAt().toString() : null,
                issue.getResolutionNotes(),
                issue.getRejectionReason(),
                issue.getReopenCount(),
                issue.getEscalationLevel(),
                issue.isOverdue(),
                attachmentList,
                commentList,
                historyList,
                issue.getCreatedAt().toString(),
                issue.getUpdatedAt().toString()
        );
    }
}
