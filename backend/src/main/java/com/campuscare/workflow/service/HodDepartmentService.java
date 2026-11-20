package com.campuscare.workflow.service;

import com.campuscare.common.exception.AccessDeniedCustomException;
import com.campuscare.common.exception.BadRequestException;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.issue.dto.IssueDetailResponse;
import com.campuscare.issue.dto.IssueSummaryResponse;
import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueHistory;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.issue.repository.IssueHistoryRepository;
import com.campuscare.issue.repository.IssueRepository;
import com.campuscare.notification.service.EmailService;
import com.campuscare.notification.service.NotificationService;
import com.campuscare.routing.dto.RoutingRuleDto;
import com.campuscare.routing.entity.RoutingRule;
import com.campuscare.routing.repository.RoutingRuleRepository;
import com.campuscare.auth.dto.UserDto;
import com.campuscare.user.entity.Department;
import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import com.campuscare.workflow.dto.HodDashboardSummary;
import com.campuscare.workflow.dto.ReassignIssueRequest;
import com.campuscare.workflow.dto.RejectIssueRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HodDepartmentService {

    private final IssueRepository issueRepository;
    private final IssueHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final RoutingRuleRepository routingRuleRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public HodDepartmentService(
            IssueRepository issueRepository,
            IssueHistoryRepository historyRepository,
            UserRepository userRepository,
            RoutingRuleRepository routingRuleRepository,
            NotificationService notificationService,
            EmailService emailService) {
        this.issueRepository = issueRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.routingRuleRepository = routingRuleRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public Page<IssueSummaryResponse> getDepartmentIssues(
            String hodEmail,
            IssueStatus status,
            Long categoryId,
            Long handlerId,
            Boolean overdueOnly,
            String search,
            Pageable pageable) {

        User hod = getUserByEmail(hodEmail);
        Department dept = getHodDepartment(hod);

        Page<Issue> page = issueRepository.findByDepartmentWithFilters(
                dept.getId(),
                status,
                categoryId,
                handlerId,
                overdueOnly,
                search != null && !search.isBlank() ? search.trim() : null,
                pageable
        );

        return page.map(IssueSummaryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public HodDashboardSummary getDepartmentSummary(String hodEmail) {
        User hod = getUserByEmail(hodEmail);
        Department dept = getHodDepartment(hod);
        Long deptId = dept.getId();

        long total = issueRepository.countByDepartmentId(deptId);
        long unassigned = issueRepository.countByDepartmentIdAndAssignedToIsNull(deptId);
        long inProgress = issueRepository.countByDepartmentIdAndStatus(deptId, IssueStatus.IN_PROGRESS);
        long resolved = issueRepository.countByDepartmentIdAndStatus(deptId, IssueStatus.RESOLVED);
        long closed = issueRepository.countByDepartmentIdAndStatus(deptId, IssueStatus.CLOSED);
        long overdue = issueRepository.countByDepartmentIdAndIsOverdueTrue(deptId);
        long handlersCount = userRepository.findAllByDepartmentIdAndRole(deptId, Role.ROLE_FACULTY).size();

        return new HodDashboardSummary(
                total,
                unassigned,
                inProgress,
                resolved,
                closed,
                overdue,
                handlersCount
        );
    }

    @Transactional
    public IssueDetailResponse reassignIssue(String hodEmail, Long issueId, ReassignIssueRequest request) {
        User hod = getUserByEmail(hodEmail);
        Department dept = getHodDepartment(hod);

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        if (!issue.getDepartment().getId().equals(dept.getId()) && hod.getRole() != Role.ROLE_ADMIN) {
            throw new AccessDeniedCustomException("You can only manage issues within your department");
        }

        User newAssignee = userRepository.findById(request.newAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.newAssigneeId()));

        User previousAssignee = issue.getAssignedTo();
        String oldStatus = issue.getStatus().name();

        issue.setAssignedTo(newAssignee);
        if (issue.getStatus() == IssueStatus.SUBMITTED || issue.getStatus() == IssueStatus.UNASSIGNED) {
            issue.setStatus(IssueStatus.ASSIGNED);
        }

        IssueHistory history = new IssueHistory(
                issue,
                hod,
                "REASSIGNED",
                oldStatus,
                issue.getStatus().name(),
                previousAssignee,
                newAssignee,
                "Reassigned by HOD " + hod.getFullName() + ": " + request.reason().trim()
        );
        historyRepository.save(history);
        issue.addHistory(history);

        Issue saved = issueRepository.save(issue);

        // Notify new assignee
        notificationService.sendInAppNotification(
                newAssignee,
                saved,
                "ISSUE_ASSIGNED",
                "Issue Reassigned: " + saved.getPublicIssueId(),
                "HOD reassigned issue '" + saved.getTitle() + "' to your queue. Note: " + request.reason().trim()
        );
        emailService.sendNotificationEmail(
                newAssignee.getEmail(),
                newAssignee.getFullName(),
                "CampusCare: Issue Reassigned to You (" + saved.getPublicIssueId() + ")",
                "HOD Reassigned Issue to Your Queue",
                "HOD " + hod.getFullName() + " has reassigned issue \"" + saved.getTitle() + "\" to you.\nReason: " +
                        request.reason().trim(),
                saved.getPublicIssueId(),
                "http://localhost:5173/handler/issues/" + saved.getId()
        );

        return IssueDetailResponse.fromEntity(saved, true);
    }

    @Transactional
    public IssueDetailResponse rejectIssue(String hodEmail, Long issueId, RejectIssueRequest request) {
        User hod = getUserByEmail(hodEmail);
        Department dept = getHodDepartment(hod);

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        if (!issue.getDepartment().getId().equals(dept.getId()) && hod.getRole() != Role.ROLE_ADMIN) {
            throw new AccessDeniedCustomException("You can only manage issues within your department");
        }

        if (issue.getStatus() == IssueStatus.CLOSED || issue.getStatus() == IssueStatus.RESOLVED) {
            throw new BadRequestException("Cannot reject an issue that is already resolved or closed");
        }

        String oldStatus = issue.getStatus().name();
        issue.setStatus(IssueStatus.REJECTED);
        issue.setRejectionReason(request.reason().trim());

        IssueHistory history = new IssueHistory(
                issue,
                hod,
                "REJECTED",
                oldStatus,
                IssueStatus.REJECTED.name(),
                null,
                null,
                "Issue rejected by HOD " + hod.getFullName() + ". Reason: " + request.reason().trim()
        );
        historyRepository.save(history);
        issue.addHistory(history);

        Issue saved = issueRepository.save(issue);

        // Notify reporter of rejection
        User reporter = saved.getReporter();
        notificationService.sendInAppNotification(
                reporter,
                saved,
                "ISSUE_REJECTED",
                "Issue Rejected: " + saved.getPublicIssueId(),
                "Your issue was reviewed and rejected by the Department Head. Reason: " + request.reason().trim()
        );
        emailService.sendNotificationEmail(
                reporter.getEmail(),
                reporter.getFullName(),
                "CampusCare: Issue Report Rejected (" + saved.getPublicIssueId() + ")",
                "Issue Report Rejected",
                "Your reported issue \"" + saved.getTitle() + "\" was rejected by HOD " + hod.getFullName() +
                        ".\nReason: " + request.reason().trim(),
                saved.getPublicIssueId(),
                "http://localhost:5173/student/issues/" + saved.getId()
        );

        return IssueDetailResponse.fromEntity(saved, true);
    }

    @Transactional(readOnly = true)
    public List<RoutingRuleDto> getDepartmentRoutingRules(String hodEmail) {
        User hod = getUserByEmail(hodEmail);
        Department dept = getHodDepartment(hod);

        return routingRuleRepository.findAllByDepartmentId(dept.getId())
                .stream()
                .map(RoutingRuleDto::fromEntity)
                .toList();
    }

    @Transactional
    public RoutingRuleDto updateRoutingRule(String hodEmail, Long ruleId, Long newAssigneeId) {
        User hod = getUserByEmail(hodEmail);
        Department dept = getHodDepartment(hod);

        RoutingRule rule = routingRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("RoutingRule", "id", ruleId));

        if (!rule.getDepartment().getId().equals(dept.getId()) && hod.getRole() != Role.ROLE_ADMIN) {
            throw new AccessDeniedCustomException("You can only modify routing rules for your department");
        }

        User newAssignee = userRepository.findById(newAssigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", newAssigneeId));

        rule.setAssignee(newAssignee);
        RoutingRule saved = routingRuleRepository.save(rule);

        return RoutingRuleDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getDepartmentHandlers(String hodEmail) {
        User hod = getUserByEmail(hodEmail);
        Department dept = getHodDepartment(hod);

        return userRepository.findAllByDepartmentIdAndRole(dept.getId(), Role.ROLE_FACULTY)
                .stream()
                .map(UserDto::fromEntity)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private Department getHodDepartment(User hod) {
        if (hod.getDepartment() == null) {
            throw new BadRequestException("User has no department assigned");
        }
        return hod.getDepartment();
    }
}
