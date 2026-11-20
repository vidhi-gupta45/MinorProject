package com.campuscare.notification.listener;

import com.campuscare.issue.entity.Issue;
import com.campuscare.notification.event.IssueLifecycleEvent;
import com.campuscare.notification.service.EmailService;
import com.campuscare.notification.service.NotificationService;
import com.campuscare.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class IssueLifecycleEventListener {

    private static final Logger log = LoggerFactory.getLogger(IssueLifecycleEventListener.class);

    private final NotificationService notificationService;
    private final EmailService emailService;

    public IssueLifecycleEventListener(NotificationService notificationService, EmailService emailService) {
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Async
    @EventListener
    public void handleIssueLifecycleEvent(IssueLifecycleEvent event) {
        Issue issue = event.issue();
        User actor = event.actor();
        String eventType = event.eventType();
        String contextMessage = event.message();

        log.info("Processing IssueLifecycleEvent: type={}, issueId={}", eventType, issue.getPublicIssueId());

        User reporter = issue.getReporter();
        User assignedHandler = issue.getAssignedTo();

        switch (eventType) {
            case "ISSUE_CREATED" -> {
                // Notify Reporter
                notificationService.sendInAppNotification(
                        reporter,
                        issue,
                        "ISSUE_SUBMITTED",
                        "Issue Registered: " + issue.getPublicIssueId(),
                        "Your issue '" + issue.getTitle() + "' has been successfully registered."
                );
                emailService.sendNotificationEmail(
                        reporter.getEmail(),
                        reporter.getFullName(),
                        "CampusCare: Issue Registered (" + issue.getPublicIssueId() + ")",
                        "Your campus issue has been submitted",
                        "We received your issue report: \"" + issue.getTitle() + "\" at " + issue.getLocation() +
                                ". It has been registered in the system.",
                        issue.getPublicIssueId(),
                        "http://localhost:5173/student/issues/" + issue.getId()
                );

                // If auto-assigned, notify Handler
                if (assignedHandler != null) {
                    notificationService.sendInAppNotification(
                            assignedHandler,
                            issue,
                            "ISSUE_ASSIGNED",
                            "New Assigned Issue: " + issue.getPublicIssueId(),
                            "Issue '" + issue.getTitle() + "' at " + issue.getLocation() + " is assigned to your queue."
                    );
                    emailService.sendNotificationEmail(
                            assignedHandler.getEmail(),
                            assignedHandler.getFullName(),
                            "CampusCare: New Assigned Issue (" + issue.getPublicIssueId() + ")",
                            "A new campus issue is assigned to you",
                            "An issue titled \"" + issue.getTitle() + "\" reported at " + issue.getLocation() +
                                    " requires your review and acknowledgment.",
                            issue.getPublicIssueId(),
                            "http://localhost:5173/handler/issues/" + issue.getId()
                    );
                }
            }

            case "ISSUE_ACKNOWLEDGED" -> {
                String actorName = actor != null ? actor.getFullName() : "Department Coordinator";
                notificationService.sendInAppNotification(
                        reporter,
                        issue,
                        "ISSUE_ACKNOWLEDGED",
                        "Issue Acknowledged: " + issue.getPublicIssueId(),
                        actorName + " acknowledged your report and has scheduled remediation."
                );
                emailService.sendNotificationEmail(
                        reporter.getEmail(),
                        reporter.getFullName(),
                        "CampusCare: Issue Acknowledged (" + issue.getPublicIssueId() + ")",
                        "Your issue has been acknowledged",
                        actorName + " acknowledged \"" + issue.getTitle() + "\". Remediation work has been scheduled.",
                        issue.getPublicIssueId(),
                        "http://localhost:5173/student/issues/" + issue.getId()
                );
            }

            case "WORK_STARTED" -> {
                notificationService.sendInAppNotification(
                        reporter,
                        issue,
                        "ISSUE_IN_PROGRESS",
                        "Work Started: " + issue.getPublicIssueId(),
                        "Remediation is actively underway for '" + issue.getTitle() + "'."
                );
                emailService.sendNotificationEmail(
                        reporter.getEmail(),
                        reporter.getFullName(),
                        "CampusCare: Remediation Started (" + issue.getPublicIssueId() + ")",
                        "Active work in progress",
                        "Maintenance/IT personnel are actively working on resolving \"" + issue.getTitle() + "\".",
                        issue.getPublicIssueId(),
                        "http://localhost:5173/student/issues/" + issue.getId()
                );
            }

            case "ISSUE_RESOLVED" -> {
                notificationService.sendInAppNotification(
                        reporter,
                        issue,
                        "ISSUE_RESOLVED",
                        "Action Needed: Verify Resolution (" + issue.getPublicIssueId() + ")",
                        "The handler marked this issue as resolved. Please verify if the fix is satisfactory."
                );
                emailService.sendNotificationEmail(
                        reporter.getEmail(),
                        reporter.getFullName(),
                        "CampusCare: Resolution Proposed (" + issue.getPublicIssueId() + ")",
                        "Please verify your issue resolution",
                        "The handler has proposed a resolution for \"" + issue.getTitle() + "\". Notes: " +
                                (issue.getResolutionNotes() != null ? issue.getResolutionNotes() : "Remediation completed.") +
                                "\n\nPlease visit CampusCare to confirm resolution or report if problem persists.",
                        issue.getPublicIssueId(),
                        "http://localhost:5173/student/issues/" + issue.getId()
                );
            }

            case "ISSUE_CLOSED" -> {
                notificationService.sendInAppNotification(
                        reporter,
                        issue,
                        "ISSUE_CLOSED",
                        "Issue Closed: " + issue.getPublicIssueId(),
                        "Thank you for verifying! Your issue is now closed and completed."
                );
                if (assignedHandler != null) {
                    notificationService.sendInAppNotification(
                            assignedHandler,
                            issue,
                            "ISSUE_CLOSED",
                            "Resolution Verified: " + issue.getPublicIssueId(),
                            "Student verified resolution for issue '" + issue.getTitle() + "'. Ticket closed."
                    );
                }
            }

            case "ISSUE_REOPENED" -> {
                if (assignedHandler != null) {
                    notificationService.sendInAppNotification(
                            assignedHandler,
                            issue,
                            "ISSUE_REOPENED",
                            "Issue Reopened: " + issue.getPublicIssueId(),
                            "Student reported that the problem persists: " + (contextMessage != null ? contextMessage : "")
                    );
                    emailService.sendNotificationEmail(
                            assignedHandler.getEmail(),
                            assignedHandler.getFullName(),
                            "CampusCare: Issue Reopened (" + issue.getPublicIssueId() + ")",
                            "Student reported problem persists",
                            "The student reopened issue \"" + issue.getTitle() + "\". Reason: " +
                                    (contextMessage != null ? contextMessage : "Problem not fixed.") +
                                    "\n\nPlease review and take further remedial action.",
                            issue.getPublicIssueId(),
                            "http://localhost:5173/handler/issues/" + issue.getId()
                    );
                }
            }

            case "COMMENT_ADDED" -> {
                if (actor != null && reporter != null && actor.getId().equals(reporter.getId())) {
                    // Student commented -> notify handler
                    if (assignedHandler != null) {
                        notificationService.sendInAppNotification(
                                assignedHandler,
                                issue,
                                "NEW_COMMENT",
                                "Student Message on " + issue.getPublicIssueId(),
                                reporter.getFullName() + ": " + (contextMessage != null ? contextMessage : "")
                        );
                    }
                } else if (actor != null && reporter != null && !actor.getId().equals(reporter.getId())) {
                    // Handler or staff commented -> notify student
                    notificationService.sendInAppNotification(
                            reporter,
                            issue,
                            "NEW_COMMENT",
                            "Coordinator Message on " + issue.getPublicIssueId(),
                            actor.getFullName() + ": " + (contextMessage != null ? contextMessage : "")
                    );
                }
            }

            default -> log.debug("Unhandled event type: {}", eventType);
        }
    }
}
