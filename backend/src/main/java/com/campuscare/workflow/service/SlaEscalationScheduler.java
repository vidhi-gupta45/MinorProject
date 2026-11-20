package com.campuscare.workflow.service;

import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueHistory;
import com.campuscare.issue.repository.IssueHistoryRepository;
import com.campuscare.issue.repository.IssueRepository;
import com.campuscare.notification.service.EmailService;
import com.campuscare.notification.service.NotificationService;
import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Component
public class SlaEscalationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SlaEscalationScheduler.class);

    private final IssueRepository issueRepository;
    private final IssueHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public SlaEscalationScheduler(
            IssueRepository issueRepository,
            IssueHistoryRepository historyRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            EmailService emailService) {
        this.issueRepository = issueRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Scheduled(cron = "${app.sla.escalation-check-cron:0 */15 * * * *}")
    @Transactional
    public int checkAndEscalateBreachedIssues() {
        Instant now = Instant.now();
        List<Issue> responseBreaches = issueRepository.findResponseBreachedIssues(now);
        List<Issue> resolutionBreaches = issueRepository.findResolutionBreachedIssues(now);

        Map<Long, Issue> breachMap = new HashMap<>();
        for (Issue issue : responseBreaches) {
            breachMap.put(issue.getId(), issue);
        }
        for (Issue issue : resolutionBreaches) {
            breachMap.put(issue.getId(), issue);
        }

        if (breachMap.isEmpty()) {
            return 0;
        }

        log.warn("SLA Escalation Engine detected {} breached issues requiring automated escalation", breachMap.size());

        for (Issue issue : breachMap.values()) {
            issue.setOverdue(true);
            int newEscalationLevel = issue.getEscalationLevel() + 1;
            issue.setEscalationLevel(newEscalationLevel);

            IssueHistory history = new IssueHistory(
                    issue,
                    null, // System event
                    "ESCALATED",
                    issue.getStatus().name(),
                    issue.getStatus().name(),
                    null,
                    null,
                    "Automated SLA breach escalation (Level " + newEscalationLevel + "). Notification sent to HOD & Handler."
            );
            historyRepository.save(history);
            issue.addHistory(history);
            issueRepository.save(issue);

            // 1. Notify assigned handler if present
            if (issue.getAssignedTo() != null) {
                User handler = issue.getAssignedTo();
                notificationService.sendInAppNotification(
                        handler,
                        issue,
                        "SLA_BREACH",
                        "SLA Breached: " + issue.getPublicIssueId(),
                        "Issue '" + issue.getTitle() + "' at " + issue.getLocation() + " has exceeded its SLA turnaround deadline."
                );
                emailService.sendNotificationEmail(
                        handler.getEmail(),
                        handler.getFullName(),
                        "URGENT: SLA Breach Warning (" + issue.getPublicIssueId() + ")",
                        "Issue SLA deadline exceeded",
                        "Issue \"" + issue.getTitle() + "\" (" + issue.getPublicIssueId() + ") is overdue. Please expedite action.",
                        issue.getPublicIssueId(),
                        "http://localhost:5173/handler/issues/" + issue.getId()
                );
            }

            // 2. Notify Department HOD(s)
            if (issue.getDepartment() != null) {
                List<User> hodList = userRepository.findAllByDepartmentIdAndRole(issue.getDepartment().getId(), Role.ROLE_HOD);
                for (User hod : hodList) {
                    notificationService.sendInAppNotification(
                            hod,
                            issue,
                            "SLA_BREACH",
                            "Department SLA Escalation: " + issue.getPublicIssueId(),
                            "Issue '" + issue.getTitle() + "' in " + issue.getDepartment().getName() +
                                    " breached SLA (Escalation Level " + newEscalationLevel + ")."
                    );
                    emailService.sendNotificationEmail(
                            hod.getEmail(),
                            hod.getFullName(),
                            "SLA Escalation Notice: " + issue.getPublicIssueId(),
                            "Department Issue Escalated",
                            "An issue in your department has breached SLA turnaround time.\nIssue: \"" +
                                    issue.getTitle() + "\" (" + issue.getPublicIssueId() + ").\nAssigned to: " +
                                    (issue.getAssignedTo() != null ? issue.getAssignedTo().getFullName() : "UNASSIGNED"),
                            issue.getPublicIssueId(),
                            "http://localhost:5173/hod/issues"
                    );
                }
            }
        }

        return breachMap.size();
    }
}
