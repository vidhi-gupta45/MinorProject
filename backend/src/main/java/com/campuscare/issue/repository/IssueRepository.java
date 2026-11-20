package com.campuscare.issue.repository;

import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

    Optional<Issue> findByPublicIssueId(String publicIssueId);

    @Query("SELECT i FROM Issue i WHERE i.reporter.id = :reporterId " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.location) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.publicIssueId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Issue> findByReporterWithFilters(
            @Param("reporterId") Long reporterId,
            @Param("status") IssueStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    long countByReporterId(Long reporterId);

    long countByReporterIdAndStatus(Long reporterId, IssueStatus status);

    @Query("SELECT COUNT(i) FROM Issue i WHERE i.reporter.id = :reporterId AND i.status IN ('ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED')")
    long countInProgressByReporterId(@Param("reporterId") Long reporterId);

    @Query("SELECT COUNT(i) FROM Issue i WHERE i.reporter.id = :reporterId AND i.status IN ('RESOLVED', 'CLOSED')")
    long countResolvedOrClosedByReporterId(@Param("reporterId") Long reporterId);

    @Query("SELECT i FROM Issue i WHERE i.assignedTo.id = :handlerId " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.location) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.publicIssueId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Issue> findByAssignedToWithFilters(
            @Param("handlerId") Long handlerId,
            @Param("status") IssueStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    long countByAssignedToIdAndStatus(Long handlerId, IssueStatus status);

    long countByAssignedToIdAndIsOverdueTrue(Long handlerId);

    @Query("SELECT i FROM Issue i WHERE i.department.id = :departmentId " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
           "AND (:handlerId IS NULL OR i.assignedTo.id = :handlerId) " +
           "AND (:overdueOnly IS NULL OR :overdueOnly = false OR i.isOverdue = true) " +
           "AND (:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.location) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.publicIssueId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Issue> findByDepartmentWithFilters(
            @Param("departmentId") Long departmentId,
            @Param("status") IssueStatus status,
            @Param("categoryId") Long categoryId,
            @Param("handlerId") Long handlerId,
            @Param("overdueOnly") Boolean overdueOnly,
            @Param("search") String search,
            Pageable pageable
    );

    long countByDepartmentId(Long departmentId);

    long countByDepartmentIdAndStatus(Long departmentId, IssueStatus status);

    long countByDepartmentIdAndAssignedToIsNull(Long departmentId);

    long countByDepartmentIdAndIsOverdueTrue(Long departmentId);

    @Query("SELECT i FROM Issue i WHERE i.isOverdue = false AND i.acknowledgedAt IS NULL AND i.status IN ('SUBMITTED', 'ASSIGNED') AND i.responseDueAt IS NOT NULL AND i.responseDueAt < :now")
    java.util.List<Issue> findResponseBreachedIssues(@Param("now") java.time.Instant now);

    @Query("SELECT i FROM Issue i WHERE i.isOverdue = false AND i.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') AND i.resolutionDueAt IS NOT NULL AND i.resolutionDueAt < :now")
    java.util.List<Issue> findResolutionBreachedIssues(@Param("now") java.time.Instant now);

    @Query("SELECT i FROM Issue i WHERE i.department.id = :departmentId ORDER BY i.createdAt DESC")
    java.util.List<Issue> findAllByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT i FROM Issue i WHERE (:departmentId IS NULL OR i.department.id = :departmentId) " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:startDate IS NULL OR i.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR i.createdAt <= :endDate) " +
           "ORDER BY i.createdAt DESC")
    java.util.List<Issue> findForReportExport(
            @Param("departmentId") Long departmentId,
            @Param("status") IssueStatus status,
            @Param("startDate") java.time.Instant startDate,
            @Param("endDate") java.time.Instant endDate
    );
}
