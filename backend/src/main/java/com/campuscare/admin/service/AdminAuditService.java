package com.campuscare.admin.service;

import com.campuscare.admin.dto.AdminAuditLogDto;
import com.campuscare.admin.dto.AdminStatsDto;
import com.campuscare.issue.repository.IssueCategoryRepository;
import com.campuscare.issue.repository.IssueHistoryRepository;
import com.campuscare.issue.repository.IssueRepository;
import com.campuscare.issue.repository.SlaPolicyRepository;
import com.campuscare.user.entity.Role;
import com.campuscare.user.repository.DepartmentRepository;
import com.campuscare.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AdminAuditService {

    private final IssueHistoryRepository issueHistoryRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final IssueCategoryRepository issueCategoryRepository;
    private final IssueRepository issueRepository;
    private final SlaPolicyRepository slaPolicyRepository;

    public AdminAuditService(IssueHistoryRepository issueHistoryRepository,
                             UserRepository userRepository,
                             DepartmentRepository departmentRepository,
                             IssueCategoryRepository issueCategoryRepository,
                             IssueRepository issueRepository,
                             SlaPolicyRepository slaPolicyRepository) {
        this.issueHistoryRepository = issueHistoryRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.issueCategoryRepository = issueCategoryRepository;
        this.issueRepository = issueRepository;
        this.slaPolicyRepository = slaPolicyRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditLogDto> getAuditLogs(String eventType, Long issueId, Long actorId,
                                              Instant startDate, Instant endDate, Pageable pageable) {
        String cleanEvent = (eventType != null && !eventType.trim().isEmpty()) ? eventType.trim() : null;
        return issueHistoryRepository.findAuditLogs(cleanEvent, issueId, actorId, startDate, endDate, pageable)
                .map(AdminAuditLogDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public AdminStatsDto getAdminStats() {
        long totalUsers = userRepository.count();
        long totalDepartments = departmentRepository.count();
        long totalCategories = issueCategoryRepository.count();
        long totalIssues = issueRepository.count();
        long activeHandlers = userRepository.countByRole(Role.ROLE_FACULTY);
        long totalSlaPolicies = slaPolicyRepository.count();

        return new AdminStatsDto(
                totalUsers,
                totalDepartments,
                totalCategories,
                totalIssues,
                activeHandlers,
                totalSlaPolicies,
                "OPERATIONAL"
        );
    }
}
