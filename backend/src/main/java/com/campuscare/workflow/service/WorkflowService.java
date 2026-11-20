package com.campuscare.workflow.service;

import com.campuscare.attachment.entity.AttachmentType;
import com.campuscare.attachment.service.AttachmentService;
import com.campuscare.comment.entity.CommentVisibility;
import com.campuscare.comment.entity.IssueComment;
import com.campuscare.comment.repository.IssueCommentRepository;
import com.campuscare.common.exception.AccessDeniedCustomException;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.issue.dto.CommentResponse;
import com.campuscare.issue.dto.IssueDetailResponse;
import com.campuscare.issue.dto.IssueSummaryResponse;
import com.campuscare.issue.entity.Issue;
import com.campuscare.issue.entity.IssueHistory;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.issue.repository.IssueHistoryRepository;
import com.campuscare.issue.repository.IssueRepository;
import com.campuscare.notification.event.IssueLifecycleEvent;
import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import com.campuscare.workflow.dto.*;
import com.campuscare.workflow.validator.IssueStateValidator;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@Service
public class WorkflowService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final IssueCommentRepository commentRepository;
    private final IssueHistoryRepository historyRepository;
    private final IssueStateValidator stateValidator;
    private final AttachmentService attachmentService;
    private final ApplicationEventPublisher eventPublisher;

    public WorkflowService(
            IssueRepository issueRepository,
            UserRepository userRepository,
            IssueCommentRepository commentRepository,
            IssueHistoryRepository historyRepository,
            IssueStateValidator stateValidator,
            AttachmentService attachmentService,
            ApplicationEventPublisher eventPublisher) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
        this.stateValidator = stateValidator;
        this.attachmentService = attachmentService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public IssueDetailResponse acknowledgeIssue(String handlerEmail, Long issueId) {
        User handler = getUserByEmail(handlerEmail);
        Issue issue = getIssueById(issueId);

        stateValidator.validateTransition(issue, IssueStatus.ACKNOWLEDGED, handler);

        String oldStatus = issue.getStatus().name();
        issue.setStatus(IssueStatus.ACKNOWLEDGED);
        issue.setAcknowledgedAt(Instant.now());

        IssueHistory history = new IssueHistory(
                issue,
                handler,
                "ACKNOWLEDGED",
                oldStatus,
                IssueStatus.ACKNOWLEDGED.name(),
                null,
                null,
                "Issue acknowledged by assigned handler " + handler.getFullName()
        );
        historyRepository.save(history);
        issue.addHistory(history);

        Issue saved = issueRepository.save(issue);
        eventPublisher.publishEvent(new IssueLifecycleEvent(saved, "ISSUE_ACKNOWLEDGED", handler, null));
        return IssueDetailResponse.fromEntity(saved, true);
    }

    @Transactional
    public IssueDetailResponse startWork(String handlerEmail, Long issueId) {
        User handler = getUserByEmail(handlerEmail);
        Issue issue = getIssueById(issueId);

        stateValidator.validateTransition(issue, IssueStatus.IN_PROGRESS, handler);

        String oldStatus = issue.getStatus().name();
        issue.setStatus(IssueStatus.IN_PROGRESS);

        IssueHistory history = new IssueHistory(
                issue,
                handler,
                "STATUS_CHANGED",
                oldStatus,
                IssueStatus.IN_PROGRESS.name(),
                null,
                null,
                "Remediation and active investigation initiated by handler"
        );
        historyRepository.save(history);
        issue.addHistory(history);

        Issue saved = issueRepository.save(issue);
        eventPublisher.publishEvent(new IssueLifecycleEvent(saved, "WORK_STARTED", handler, null));
        return IssueDetailResponse.fromEntity(saved, true);
    }

    @Transactional
    public IssueDetailResponse resolveIssue(
            String handlerEmail,
            Long issueId,
            ResolveIssueRequest request,
            List<MultipartFile> evidenceFiles) {

        User handler = getUserByEmail(handlerEmail);
        Issue issue = getIssueById(issueId);

        stateValidator.validateTransition(issue, IssueStatus.RESOLVED, handler);

        String oldStatus = issue.getStatus().name();
        issue.setStatus(IssueStatus.RESOLVED);
        issue.setResolvedAt(Instant.now());
        issue.setResolutionNotes(request.resolutionNotes().trim());

        IssueHistory history = new IssueHistory(
                issue,
                handler,
                "RESOLVED",
                oldStatus,
                IssueStatus.RESOLVED.name(),
                null,
                null,
                "Resolution proposed: " + request.resolutionNotes()
        );
        historyRepository.save(history);
        issue.addHistory(history);

        // Upload evidence photos if provided
        if (evidenceFiles != null && !evidenceFiles.isEmpty()) {
            for (MultipartFile file : evidenceFiles) {
                if (file != null && !file.isEmpty()) {
                    var evidence = attachmentService.uploadAttachment(
                            issue,
                            handler,
                            file,
                            AttachmentType.RESOLUTION_EVIDENCE
                    );
                    issue.addAttachment(evidence);
                }
            }
        }

        Issue saved = issueRepository.save(issue);
        eventPublisher.publishEvent(new IssueLifecycleEvent(saved, "ISSUE_RESOLVED", handler, request.resolutionNotes()));
        return IssueDetailResponse.fromEntity(saved, true);
    }

    @Transactional
    public IssueDetailResponse confirmResolution(String studentEmail, Long issueId) {
        User student = getUserByEmail(studentEmail);
        Issue issue = getIssueById(issueId);

        stateValidator.validateTransition(issue, IssueStatus.CLOSED, student);

        String oldStatus = issue.getStatus().name();
        issue.setStatus(IssueStatus.CLOSED);
        issue.setClosedAt(Instant.now());

        IssueHistory history = new IssueHistory(
                issue,
                student,
                "CLOSED",
                oldStatus,
                IssueStatus.CLOSED.name(),
                null,
                null,
                "Student verified and confirmed resolution; issue closed"
        );
        historyRepository.save(history);
        issue.addHistory(history);

        Issue saved = issueRepository.save(issue);
        eventPublisher.publishEvent(new IssueLifecycleEvent(saved, "ISSUE_CLOSED", student, null));
        return IssueDetailResponse.fromEntity(saved, false);
    }

    @Transactional
    public IssueDetailResponse reopenIssue(String studentEmail, Long issueId, ReopenIssueRequest request) {
        User student = getUserByEmail(studentEmail);
        Issue issue = getIssueById(issueId);

        stateValidator.validateTransition(issue, IssueStatus.REOPENED, student);

        String oldStatus = issue.getStatus().name();
        issue.setStatus(IssueStatus.REOPENED);
        issue.setReopenCount(issue.getReopenCount() + 1);

        IssueHistory history = new IssueHistory(
                issue,
                student,
                "REOPENED",
                oldStatus,
                IssueStatus.REOPENED.name(),
                null,
                null,
                "Student reported issue persists: " + request.reason().trim()
        );
        historyRepository.save(history);
        issue.addHistory(history);

        Issue saved = issueRepository.save(issue);
        eventPublisher.publishEvent(new IssueLifecycleEvent(saved, "ISSUE_REOPENED", student, request.reason().trim()));
        return IssueDetailResponse.fromEntity(saved, false);
    }

    @Transactional
    public CommentResponse addInternalNote(String staffEmail, Long issueId, CreateStaffNoteRequest request) {
        User staff = getUserByEmail(staffEmail);
        Issue issue = getIssueById(issueId);

        // Only Faculty, HOD, and Admin can add internal notes
        if (staff.getRole() == Role.ROLE_STUDENT) {
            throw new AccessDeniedCustomException("Students are not permitted to add internal staff notes");
        }

        IssueComment note = new IssueComment(
                issue,
                staff,
                request.body().trim(),
                CommentVisibility.INTERNAL_STAFF
        );

        IssueComment savedNote = commentRepository.save(note);

        IssueHistory history = new IssueHistory(
                issue,
                staff,
                "COMMENTED",
                issue.getStatus().name(),
                issue.getStatus().name(),
                null,
                null,
                "Internal staff note added by " + staff.getFullName()
        );
        historyRepository.save(history);

        return CommentResponse.fromEntity(savedNote);
    }

    @Transactional(readOnly = true)
    public Page<IssueSummaryResponse> getHandlerIssues(
            String handlerEmail,
            IssueStatus status,
            String search,
            Pageable pageable) {

        User handler = getUserByEmail(handlerEmail);
        String sanitizedSearch = (search != null && !search.trim().isBlank()) ? search.trim() : null;

        return issueRepository.findByAssignedToWithFilters(handler.getId(), status, sanitizedSearch, pageable)
                .map(IssueSummaryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IssueDetailResponse getHandlerIssueDetail(String staffEmail, Long issueId) {
        User staff = getUserByEmail(staffEmail);
        Issue issue = getIssueById(issueId);

        boolean isAssignedHandler = issue.getAssignedTo() != null && issue.getAssignedTo().getId().equals(staff.getId());
        boolean isHod = staff.getRole() == Role.ROLE_HOD && staff.getDepartment() != null &&
                staff.getDepartment().getId().equals(issue.getDepartment().getId());
        boolean isAdmin = staff.getRole() == Role.ROLE_ADMIN;

        if (!isAssignedHandler && !isHod && !isAdmin) {
            throw new AccessDeniedCustomException("You are not authorized to view this issue's handler details");
        }

        return IssueDetailResponse.fromEntity(issue, true);
    }

    @Transactional(readOnly = true)
    public HandlerDashboardSummary getHandlerWorkloadSummary(String handlerEmail) {
        User handler = getUserByEmail(handlerEmail);
        Long handlerId = handler.getId();

        long assigned = issueRepository.countByAssignedToIdAndStatus(handlerId, IssueStatus.ASSIGNED);
        long acknowledged = issueRepository.countByAssignedToIdAndStatus(handlerId, IssueStatus.ACKNOWLEDGED);
        long inProgress = issueRepository.countByAssignedToIdAndStatus(handlerId, IssueStatus.IN_PROGRESS);
        long resolved = issueRepository.countByAssignedToIdAndStatus(handlerId, IssueStatus.RESOLVED);
        long overdue = issueRepository.countByAssignedToIdAndIsOverdueTrue(handlerId);

        return new HandlerDashboardSummary(assigned, acknowledged, inProgress, resolved, overdue);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private Issue getIssueById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", id));
    }
}
