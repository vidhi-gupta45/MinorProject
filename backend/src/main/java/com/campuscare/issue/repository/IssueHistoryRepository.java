package com.campuscare.issue.repository;

import com.campuscare.issue.entity.IssueHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface IssueHistoryRepository extends JpaRepository<IssueHistory, Long> {

    List<IssueHistory> findAllByIssueIdOrderByCreatedAtDesc(Long issueId);

    @Query("SELECT h FROM IssueHistory h " +
           "LEFT JOIN FETCH h.actor " +
           "JOIN FETCH h.issue " +
           "WHERE (:eventType IS NULL OR h.eventType = :eventType) " +
           "AND (:issueId IS NULL OR h.issue.id = :issueId) " +
           "AND (:actorId IS NULL OR (h.actor IS NOT NULL AND h.actor.id = :actorId)) " +
           "AND (:startDate IS NULL OR h.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR h.createdAt <= :endDate) " +
           "ORDER BY h.createdAt DESC")
    Page<IssueHistory> findAuditLogs(
            @Param("eventType") String eventType,
            @Param("issueId") Long issueId,
            @Param("actorId") Long actorId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable);
}
