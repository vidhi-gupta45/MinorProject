package com.campuscare.workflow.validator;

import com.campuscare.common.exception.AccessDeniedCustomException;
import com.campuscare.common.exception.InvalidStateTransitionException;
import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
public class IssueStateValidator {

    private static final Map<IssueStatus, Set<IssueStatus>> ALLOWED_TRANSITIONS = Map.of(
            IssueStatus.SUBMITTED, Set.of(IssueStatus.ASSIGNED, IssueStatus.UNASSIGNED, IssueStatus.REJECTED),
            IssueStatus.UNASSIGNED, Set.of(IssueStatus.ASSIGNED, IssueStatus.REJECTED),
            IssueStatus.ASSIGNED, Set.of(IssueStatus.ACKNOWLEDGED, IssueStatus.ASSIGNED, IssueStatus.REJECTED),
            IssueStatus.ACKNOWLEDGED, Set.of(IssueStatus.IN_PROGRESS, IssueStatus.ASSIGNED),
            IssueStatus.IN_PROGRESS, Set.of(IssueStatus.RESOLVED, IssueStatus.ASSIGNED),
            IssueStatus.RESOLVED, Set.of(IssueStatus.CLOSED, IssueStatus.REOPENED),
            IssueStatus.REOPENED, Set.of(IssueStatus.IN_PROGRESS, IssueStatus.ASSIGNED),
            IssueStatus.CLOSED, Set.of(),
            IssueStatus.REJECTED, Set.of()
    );

    public void validateTransition(Issue issue, IssueStatus targetStatus, User actor) {
        IssueStatus currentStatus = issue.getStatus();

        // 1. Check if state transition is structurally allowed in the workflow state machine
        Set<IssueStatus> validNextStates = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!validNextStates.contains(targetStatus)) {
            throw new InvalidStateTransitionException(
                    currentStatus.name(),
                    targetStatus.name(),
                    String.format("Invalid lifecycle progression. Allowed transitions from %s are: %s",
                            currentStatus.name(), validNextStates)
            );
        }

        // 2. Validate Actor Permissions & Resource Ownership
        Role actorRole = actor.getRole();

        switch (targetStatus) {
            case ACKNOWLEDGED -> {
                if (actorRole != Role.ROLE_FACULTY && actorRole != Role.ROLE_HOD && actorRole != Role.ROLE_ADMIN) {
                    throw new AccessDeniedCustomException("Only authorized faculty or coordinators can acknowledge issues");
                }
                if (issue.getAssignedTo() == null || !issue.getAssignedTo().getId().equals(actor.getId())) {
                    throw new AccessDeniedCustomException("You can only acknowledge issues that are assigned to you");
                }
            }
            case IN_PROGRESS -> {
                if (actorRole != Role.ROLE_FACULTY && actorRole != Role.ROLE_HOD && actorRole != Role.ROLE_ADMIN) {
                    throw new AccessDeniedCustomException("Only authorized faculty or coordinators can start work on issues");
                }
                if (issue.getAssignedTo() == null || !issue.getAssignedTo().getId().equals(actor.getId())) {
                    throw new AccessDeniedCustomException("You can only start work on issues that are assigned to you");
                }
            }
            case RESOLVED -> {
                if (actorRole != Role.ROLE_FACULTY && actorRole != Role.ROLE_HOD && actorRole != Role.ROLE_ADMIN) {
                    throw new AccessDeniedCustomException("Only authorized faculty or coordinators can mark issues as resolved");
                }
                if (issue.getAssignedTo() == null || !issue.getAssignedTo().getId().equals(actor.getId())) {
                    throw new AccessDeniedCustomException("You can only resolve issues that are assigned to you");
                }
            }
            case CLOSED -> {
                boolean isReporter = issue.getReporter().getId().equals(actor.getId());
                boolean isHodOrAdmin = actorRole == Role.ROLE_HOD || actorRole == Role.ROLE_ADMIN;
                if (!isReporter && !isHodOrAdmin) {
                    throw new AccessDeniedCustomException("Only the student who reported this issue can confirm resolution and close it");
                }
            }
            case REOPENED -> {
                boolean isReporter = issue.getReporter().getId().equals(actor.getId());
                if (!isReporter) {
                    throw new AccessDeniedCustomException("Only the student who reported this issue can request reopening");
                }
            }
            case REJECTED -> {
                if (actorRole != Role.ROLE_HOD && actorRole != Role.ROLE_ADMIN) {
                    throw new AccessDeniedCustomException("Only Head of Department (HOD) or Administrator can reject issues");
                }
                if (actorRole == Role.ROLE_HOD && !issue.getDepartment().getId().equals(actor.getDepartment().getId())) {
                    throw new AccessDeniedCustomException("HOD can only reject complaints belonging to their own department");
                }
            }
            case ASSIGNED -> {
                if (actorRole != Role.ROLE_HOD && actorRole != Role.ROLE_ADMIN) {
                    throw new AccessDeniedCustomException("Only Head of Department (HOD) or Administrator can manually assign/reassign issues");
                }
            }
            default -> {}
        }
    }
}
