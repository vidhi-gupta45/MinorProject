package com.campuscare.issue.dto;

import com.campuscare.attachment.entity.IssueAttachment;

public record AttachmentResponse(
        Long id,
        String originalFileName,
        String contentType,
        Long fileSize,
        String attachmentType,
        String downloadUrl,
        String createdAt
) {
    public static AttachmentResponse fromEntity(IssueAttachment attachment) {
        if (attachment == null) return null;
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getOriginalFileName(),
                attachment.getContentType(),
                attachment.getFileSize(),
                attachment.getAttachmentType().name(),
                "/api/attachments/" + attachment.getId() + "/download",
                attachment.getCreatedAt().toString()
        );
    }
}
