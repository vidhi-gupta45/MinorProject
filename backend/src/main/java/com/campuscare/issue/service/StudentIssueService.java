package com.campuscare.issue.service;

import com.campuscare.attachment.entity.AttachmentType;
import com.campuscare.attachment.service.AttachmentService;
import com.campuscare.comment.entity.CommentVisibility;
import com.campuscare.comment.entity.IssueComment;
import com.campuscare.comment.repository.IssueCommentRepository;
import com.campuscare.common.exception.AccessDeniedCustomException;
import com.campuscare.common.exception.BadRequestException;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.issue.dto.*;
import com.campuscare.issue.entity.*;
import com.campuscare.issue.repository.IssueCategoryRepository;
import com.campuscare.issue.repository.IssueHistoryRepository;
import com.campuscare.issue.repository.IssueRepository;
import com.campuscare.notification.event.IssueLifecycleEvent;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class StudentIssueService {

    private final IssueRepository issueRepository;
    private final IssueCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final IssueCommentRepository commentRepository;
    private final IssueHistoryRepository historyRepository;
    private final IssueIdGenerator issueIdGenerator;
    private final AttachmentService attachmentService;
    private final com.campuscare.routing.service.RoutingEngineService routingEngineService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public StudentIssueService(
            IssueRepository issueRepository,
            IssueCategoryRepository categoryRepository,
            UserRepository userRepository,
            IssueCommentRepository commentRepository,
            IssueHistoryRepository historyRepository,
            IssueIdGenerator issueIdGenerator,
            AttachmentService attachmentService,
            com.campuscare.routing.service.RoutingEngineService routingEngineService,
            org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.issueRepository = issueRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
        this.issueIdGenerator = issueIdGenerator;
        this.attachmentService = attachmentService;
        this.routingEngineService = routingEngineService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public IssueDetailResponse createIssue(String studentEmail, CreateIssueRequest request, List<MultipartFile> files) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", studentEmail));

        IssueCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("IssueCategory", "id", request.categoryId()));

        if (student.getDepartment() == null) {
            throw new BadRequestException("Student must be assigned to a department to report an issue");
        }

        IssuePriority priority = IssuePriority.MEDIUM;
        if (request.priority() != null && !request.priority().isBlank()) {
            try {
                priority = IssuePriority.valueOf(request.priority().toUpperCase());
            } catch (IllegalArgumentException e) {
                priority = IssuePriority.MEDIUM;
            }
        }

        String publicId = issueIdGenerator.generateNextIssueId();
        Issue issue = new Issue(
                publicId,
                request.title().trim(),
                request.description().trim(),
                category,
                student.getDepartment(),
                student,
                priority,
                request.location().trim()
        );

        // Calculate initial SLA deadlines based on priority
        Instant now = Instant.now();
        switch (priority) {
            case CRITICAL -> {
                issue.setResponseDueAt(now.plus(Duration.ofHours(2)));
                issue.setResolutionDueAt(now.plus(Duration.ofHours(8)));
            }
            case HIGH -> {
                issue.setResponseDueAt(now.plus(Duration.ofHours(4)));
                issue.setResolutionDueAt(now.plus(Duration.ofHours(24)));
            }
            case MEDIUM -> {
                issue.setResponseDueAt(now.plus(Duration.ofHours(12)));
                issue.setResolutionDueAt(now.plus(Duration.ofHours(48)));
            }
            case LOW -> {
                issue.setResponseDueAt(now.plus(Duration.ofHours(24)));
                issue.setResolutionDueAt(now.plus(Duration.ofHours(96)));
            }
        }

        Issue savedIssue = issueRepository.save(issue);

        // Record initial audit event
        IssueHistory history = new IssueHistory(
                savedIssue,
                student,
                "CREATED",
                null,
                IssueStatus.SUBMITTED.name(),
                null,
                null,
                "Issue reported by student"
        );
        historyRepository.save(history);
        savedIssue.addHistory(history);

        // Process attachments if any
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    var attachment = attachmentService.uploadAttachment(
                            savedIssue,
                            student,
                            file,
                            AttachmentType.REPORT_ATTACHMENT
                    );
                    savedIssue.addAttachment(attachment);
                }
            }
        }

        // Auto-route issue based on category routing rules
        routingEngineService.routeIssue(savedIssue);
        savedIssue = issueRepository.save(savedIssue);

        eventPublisher.publishEvent(new IssueLifecycleEvent(savedIssue, "ISSUE_CREATED", student, null));

        return IssueDetailResponse.fromEntity(savedIssue, false);
    }

    @Transactional(readOnly = true)
    public Page<IssueSummaryResponse> getMyIssues(String studentEmail, IssueStatus status, String search, Pageable pageable) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", studentEmail));

        String sanitizedSearch = (search != null && !search.trim().isBlank()) ? search.trim() : null;

        return issueRepository.findByReporterWithFilters(student.getId(), status, sanitizedSearch, pageable)
                .map(IssueSummaryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IssueDetailResponse getStudentIssueDetail(String studentEmail, Long issueId) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", studentEmail));

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        if (!issue.getReporter().getId().equals(student.getId())) {
            throw new AccessDeniedCustomException("You are not authorized to view this issue");
        }

        return IssueDetailResponse.fromEntity(issue, false);
    }

    @Transactional
    public CommentResponse addComment(String studentEmail, Long issueId, CreateCommentRequest request) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", studentEmail));

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", "id", issueId));

        if (!issue.getReporter().getId().equals(student.getId())) {
            throw new AccessDeniedCustomException("You are not authorized to comment on this issue");
        }

        IssueComment comment = new IssueComment(
                issue,
                student,
                request.body().trim(),
                CommentVisibility.STUDENT_VISIBLE
        );

        IssueComment savedComment = commentRepository.save(comment);

        // Audit comment
        IssueHistory history = new IssueHistory(
                issue,
                student,
                "COMMENTED",
                issue.getStatus().name(),
                issue.getStatus().name(),
                null,
                null,
                "Student commented: " + (request.body().length() > 60 ? request.body().substring(0, 57) + "..." : request.body())
        );
        historyRepository.save(history);

        eventPublisher.publishEvent(new IssueLifecycleEvent(issue, "COMMENT_ADDED", student, savedComment.getBody()));

        return CommentResponse.fromEntity(savedComment);
    }

    @Transactional(readOnly = true)
    public StudentDashboardSummary getStudentDashboardSummary(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", studentEmail));

        Long studentId = student.getId();
        long totalSubmitted = issueRepository.countByReporterId(studentId);
        long inProgress = issueRepository.countInProgressByReporterId(studentId);
        long resolved = issueRepository.countByReporterIdAndStatus(studentId, IssueStatus.RESOLVED);
        long closed = issueRepository.countByReporterIdAndStatus(studentId, IssueStatus.CLOSED);

        return new StudentDashboardSummary(totalSubmitted, inProgress, resolved, closed);
    }
}
