package com.campuscare.notification.dto;

import com.campuscare.notification.entity.Notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        String notificationType,
        Long issueId,
        String publicIssueId,
        boolean isRead,
        LocalDateTime readAt,
        LocalDateTime createdAt
) {
    public static NotificationResponse fromEntity(Notification notification) {
        Long issueId = notification.getIssue() != null ? notification.getIssue().getId() : null;
        String publicIssueId = notification.getIssue() != null ? notification.getIssue().getPublicIssueId() : null;

        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getNotificationType(),
                issueId,
                publicIssueId,
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}
