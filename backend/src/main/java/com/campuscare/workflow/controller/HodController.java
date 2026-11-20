package com.campuscare.workflow.controller;

import com.campuscare.auth.dto.UserDto;
import com.campuscare.common.dto.ApiResponse;
import com.campuscare.issue.dto.IssueDetailResponse;
import com.campuscare.issue.dto.IssueSummaryResponse;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.routing.dto.RoutingRuleDto;
import com.campuscare.workflow.dto.HodDashboardSummary;
import com.campuscare.workflow.dto.ReassignIssueRequest;
import com.campuscare.workflow.dto.RejectIssueRequest;
import com.campuscare.workflow.service.HodDepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hod")
@Tag(name = "HOD Department Console", description = "Department issue oversight, reassignment, rejection, routing rules, and workload metrics")
@PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
public class HodController {

    private final HodDepartmentService hodDepartmentService;

    public HodController(HodDepartmentService hodDepartmentService) {
        this.hodDepartmentService = hodDepartmentService;
    }

    @GetMapping("/issues")
    @Operation(summary = "Get paginated department issues with status, category, handler, and overdue filters")
    public ResponseEntity<ApiResponse<Page<IssueSummaryResponse>>> getDepartmentIssues(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long handlerId,
            @RequestParam(required = false) Boolean overdueOnly,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<IssueSummaryResponse> issues = hodDepartmentService.getDepartmentIssues(
                userDetails.getUsername(),
                status,
                categoryId,
                handlerId,
                overdueOnly,
                search,
                pageable
        );
        return ResponseEntity.ok(ApiResponse.ok(issues));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get live KPI summary counts for HOD department dashboard")
    public ResponseEntity<ApiResponse<HodDashboardSummary>> getDepartmentSummary(
            @AuthenticationPrincipal UserDetails userDetails) {

        HodDashboardSummary summary = hodDepartmentService.getDepartmentSummary(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @PostMapping("/issues/{id}/reassign")
    @Operation(summary = "HOD manually reassigns an issue to another department handler")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> reassignIssue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReassignIssueRequest request) {

        IssueDetailResponse response = hodDepartmentService.reassignIssue(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Issue reassigned successfully", response));
    }

    @PostMapping("/issues/{id}/reject")
    @Operation(summary = "HOD rejects a frivolous, invalid, or out-of-scope issue with mandatory reason")
    public ResponseEntity<ApiResponse<IssueDetailResponse>> rejectIssue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RejectIssueRequest request) {

        IssueDetailResponse response = hodDepartmentService.rejectIssue(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Issue rejected", response));
    }

    @GetMapping("/routing-rules")
    @Operation(summary = "Get category routing rules for the HOD's department")
    public ResponseEntity<ApiResponse<List<RoutingRuleDto>>> getRoutingRules(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<RoutingRuleDto> rules = hodDepartmentService.getDepartmentRoutingRules(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @PutMapping("/routing-rules/{id}")
    @Operation(summary = "Update designated handler for a department routing rule")
    public ResponseEntity<ApiResponse<RoutingRuleDto>> updateRoutingRule(
            @PathVariable Long id,
            @RequestParam Long assigneeId,
            @AuthenticationPrincipal UserDetails userDetails) {

        RoutingRuleDto updated = hodDepartmentService.updateRoutingRule(userDetails.getUsername(), id, assigneeId);
        return ResponseEntity.ok(ApiResponse.ok("Routing rule updated", updated));
    }

    @GetMapping("/handlers")
    @Operation(summary = "Get list of available faculty handlers in HOD's department")
    public ResponseEntity<ApiResponse<List<UserDto>>> getDepartmentHandlers(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<UserDto> handlers = hodDepartmentService.getDepartmentHandlers(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(handlers));
    }
}
