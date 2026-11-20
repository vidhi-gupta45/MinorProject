package com.campuscare.issue.dto;

import com.campuscare.comment.entity.IssueComment;

public record CommentResponse(
        Long id,
        Long authorId,
        String authorName,
        String authorRole,
        String body,
        String visibility,
        String createdAt
) {
    public static CommentResponse fromEntity(IssueComment comment) {
        if (comment == null) return null;
        return new CommentResponse(
                comment.getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getFullName(),
                comment.getAuthor().getRole().name(),
                comment.getBody(),
                comment.getVisibility().name(),
                comment.getCreatedAt().toString()
        );
    }
}
