package com.campuscare.issue.controller;

import com.campuscare.common.dto.ApiResponse;
import com.campuscare.issue.dto.*;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.issue.service.StudentIssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@Tag(name = "Student Issues", description = "Student issue reporting, tracking, and comments")
public class StudentIssueController {

    private final StudentIssueService studentIssueService;

    public StudentIssueController(StudentIssueService studentIssueService) {
        this.studentIssueService = studentIssueService;
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Submit a new campus issue with optional photo attachments")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> createIssueMultipart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestPart("issue") @Valid CreateIssueRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {

        IssueDetailResponse response = studentIssueService.createIssue(userDetails.getUsername(), request, files);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Issue submitted successfully", response));
    }

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE})
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Submit a new campus issue without attachments (JSON)")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> createIssueJson(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateIssueRequest request) {

        IssueDetailResponse response = studentIssueService.createIssue(userDetails.getUsername(), request, null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Issue submitted successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get paginated list of issues reported by current student")
    public ResponseEntity<ApiResponse<Page<IssueSummaryResponse>>> getMyIssues(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<IssueSummaryResponse> issues = studentIssueService.getMyIssues(
                userDetails.getUsername(),
                status,
                search,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.ok(issues));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get issue details for student (enforces ownership)")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> getStudentIssueDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        IssueDetailResponse response = studentIssueService.getStudentIssueDetail(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Add a public student comment on own issue")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateCommentRequest request) {

        CommentResponse response = studentIssueService.addComment(userDetails.getUsername(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Comment added successfully", response));
    }

    @GetMapping("/student/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get KPI counts for student dashboard")
    public ResponseEntity<ApiResponse<StudentDashboardSummary>> getStudentDashboardSummary(
            @AuthenticationPrincipal UserDetails userDetails) {

        StudentDashboardSummary summary = studentIssueService.getStudentDashboardSummary(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
