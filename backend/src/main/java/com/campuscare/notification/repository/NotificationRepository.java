package com.campuscare.notification.repository;

import com.campuscare.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n LEFT JOIN FETCH n.issue WHERE n.recipient.id = :recipientId ORDER BY n.createdAt DESC")
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(@Param("recipientId") Long recipientId, Pageable pageable);

    @Query("SELECT n FROM Notification n LEFT JOIN FETCH n.issue WHERE n.recipient.id = :recipientId AND n.isRead = :isRead ORDER BY n.createdAt DESC")
    Page<Notification> findByRecipientIdAndIsReadOrderByCreatedAtDesc(
            @Param("recipientId") Long recipientId,
            @Param("isRead") boolean isRead,
            Pageable pageable
    );

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.recipient.id = :recipientId AND n.isRead = false")
    int markAllAsReadByRecipientId(@Param("recipientId") Long recipientId);
}
