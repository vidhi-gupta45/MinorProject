package com.campuscare.issue.controller;

import com.campuscare.common.dto.ApiResponse;
import com.campuscare.issue.dto.CommentResponse;
import com.campuscare.issue.dto.IssueDetailResponse;
import com.campuscare.issue.dto.IssueSummaryResponse;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.workflow.dto.*;
import com.campuscare.workflow.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Handler & Workflow Operations", description = "Issue acknowledgment, remediation, resolution, confirmation, and internal notes")
public class HandlerIssueController {

    private final WorkflowService workflowService;

    public HandlerIssueController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping("/handler/issues")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    @Operation(summary = "Get paginated issues assigned to the current handler")
    public ResponseEntity<ApiResponse<Page<IssueSummaryResponse>>> getAssignedIssues(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<IssueSummaryResponse> issues = workflowService.getHandlerIssues(
                userDetails.getUsername(),
                status,
                search,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.ok(issues));
    }

    @GetMapping("/handler/issues/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    @Operation(summary = "Get issue details for handler (includes internal staff notes)")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> getHandlerIssueDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        IssueDetailResponse response = workflowService.getHandlerIssueDetail(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/issues/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    @Operation(summary = "Handler acknowledges an assigned issue")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> acknowledgeIssue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        IssueDetailResponse response = workflowService.acknowledgeIssue(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Issue acknowledged successfully", response));
    }

    @PostMapping("/issues/{id}/start")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    @Operation(summary = "Handler starts work on an acknowledged or reopened issue (moves to IN_PROGRESS)")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> startWork(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        IssueDetailResponse response = workflowService.startWork(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Work started on issue", response));
    }

    @PostMapping(value = "/issues/{id}/resolve", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    @Operation(summary = "Handler proposes resolution with resolution notes and optional evidence photos (multipart)")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> resolveIssueMultipart(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestPart("resolve") @Valid ResolveIssueRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {

        IssueDetailResponse response = workflowService.resolveIssue(
                userDetails.getUsername(),
                id,
                request,
                files
        );
        return ResponseEntity.ok(ApiResponse.ok("Issue marked as resolved", response));
    }

    @PostMapping(value = "/issues/{id}/resolve", consumes = {MediaType.APPLICATION_JSON_VALUE})
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    @Operation(summary = "Handler proposes resolution with notes (JSON)")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> resolveIssueJson(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ResolveIssueRequest request) {

        IssueDetailResponse response = workflowService.resolveIssue(
                userDetails.getUsername(),
                id,
                request,
                null
        );
        return ResponseEntity.ok(ApiResponse.ok("Issue marked as resolved", response));
    }

    @PostMapping("/issues/{id}/confirm-resolution")
    @PreAuthorize("hasAnyRole('STUDENT', 'HOD', 'ADMIN')")
    @Operation(summary = "Student confirms resolution fix and closes the issue")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> confirmResolution(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        IssueDetailResponse response = workflowService.confirmResolution(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Resolution confirmed. Issue is now closed.", response));
    }

    @PostMapping("/issues/{id}/reopen")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Student reports that the problem persists and reopens the issue")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> reopenIssue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReopenIssueRequest request) {

        IssueDetailResponse response = workflowService.reopenIssue(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Issue reopened. Handler notified.", response));
    }

    @PostMapping("/issues/{id}/internal-notes")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    @Operation(summary = "Add an internal staff-only note to an issue")
    public ResponseEntity<ApiResponse<CommentResponse>> addInternalNote(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateStaffNoteRequest request) {

        CommentResponse response = workflowService.addInternalNote(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Internal staff note recorded", response));
    }

    @GetMapping("/handler/workload")
    @PreAuthorize("hasAnyRole('FACULTY', 'HOD', 'ADMIN')")
    @Operation(summary = "Get workload KPI summary counts for handler dashboard")
    public ResponseEntity<ApiResponse<HandlerDashboardSummary>> getHandlerWorkload(
            @AuthenticationPrincipal UserDetails userDetails) {

        HandlerDashboardSummary summary = workflowService.getHandlerWorkloadSummary(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
