package com.campuscare.notification.service;

import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.issue.entity.Issue;
import com.campuscare.notification.dto.NotificationResponse;
import com.campuscare.notification.entity.Notification;
import com.campuscare.notification.repository.NotificationRepository;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Notification sendInAppNotification(
            User recipient,
            Issue issue,
            String type,
            String title,
            String message
    ) {
        Notification notification = new Notification(recipient, issue, type, title, message);
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(String userEmail, Boolean unreadOnly, Pageable pageable) {
        User user = getUserByEmail(userEmail);

        Page<Notification> page = (unreadOnly != null && unreadOnly)
                ? notificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(user.getId(), false, pageable)
                : notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable);

        return page.map(NotificationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(String userEmail, Long notificationId) {
        User user = getUserByEmail(userEmail);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this notification");
        }

        notification.markAsRead();
        return NotificationResponse.fromEntity(notificationRepository.save(notification));
    }

    @Transactional
    public int markAllAsRead(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.markAllAsReadByRecipientId(user.getId());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
