package com.campuscare.analytics.service;

import com.campuscare.analytics.dto.AnalyticsSummaryDto;
import com.campuscare.common.exception.BadRequestException;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.issue.repository.IssueRepository;
import com.campuscare.user.entity.Department;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    public AnalyticsService(IssueRepository issueRepository, UserRepository userRepository) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryDto getDepartmentAnalytics(String hodEmail) {
        User hod = userRepository.findByEmail(hodEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", hodEmail));

        Department dept = hod.getDepartment();
        if (dept == null) {
            throw new BadRequestException("User is not associated with any department");
        }

        List<Issue> deptIssues = issueRepository.findAllByDepartmentId(dept.getId());
        return calculateAnalytics(deptIssues);
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryDto getInstitutionalAnalytics() {
        List<Issue> allIssues = issueRepository.findAll();
        return calculateAnalytics(allIssues);
    }

    private AnalyticsSummaryDto calculateAnalytics(List<Issue> issues) {
        long total = issues.size();

        long open = issues.stream()
                .filter(i -> i.getStatus() != IssueStatus.RESOLVED &&
                             i.getStatus() != IssueStatus.CLOSED &&
                             i.getStatus() != IssueStatus.REJECTED)
                .count();

        long inProgress = issues.stream()
                .filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS)
                .count();

        long resolved = issues.stream()
                .filter(i -> i.getStatus() == IssueStatus.RESOLVED)
                .count();

        long closed = issues.stream()
                .filter(i -> i.getStatus() == IssueStatus.CLOSED)
                .count();

        long overdue = issues.stream()
                .filter(Issue::isOverdue)
                .count();

        double slaCompliance = total > 0
                ? Math.round(((double) (total - overdue) / total * 100.0) * 10.0) / 10.0
                : 100.0;

        // Calculate Mean Time to Resolution (MTTR) in hours
        List<Double> resolutionHours = issues.stream()
                .filter(i -> i.getResolvedAt() != null)
                .map(i -> (double) Duration.between(i.getCreatedAt(), i.getResolvedAt()).toMinutes() / 60.0)
                .toList();

        double avgResolutionHours = resolutionHours.isEmpty()
                ? 0.0
                : Math.round((resolutionHours.stream().mapToDouble(Double::doubleValue).average().orElse(0.0)) * 10.0) / 10.0;

        // Distributions
        Map<String, Long> statusDist = issues.stream()
                .collect(Collectors.groupingBy(i -> i.getStatus().name(), Collectors.counting()));

        Map<String, Long> catDist = issues.stream()
                .collect(Collectors.groupingBy(i -> i.getCategory().getName(), Collectors.counting()));

        Map<String, Long> priorityDist = issues.stream()
                .collect(Collectors.groupingBy(i -> i.getPriority().name(), Collectors.counting()));

        return new AnalyticsSummaryDto(
                total,
                open,
                inProgress,
                resolved,
                closed,
                overdue,
                slaCompliance,
                avgResolutionHours,
                statusDist,
                catDist,
                priorityDist
        );
    }
}
