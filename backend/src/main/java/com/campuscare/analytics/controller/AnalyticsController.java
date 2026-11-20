package com.campuscare.analytics.controller;

import com.campuscare.analytics.dto.AnalyticsSummaryDto;
import com.campuscare.analytics.service.AnalyticsService;
import com.campuscare.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics & Insights", description = "Performance metrics, MTTR, SLA compliance rates, and issue distributions")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/department")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    @Operation(summary = "Get department-specific performance analytics and distributions for HOD")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDto>> getDepartmentAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {

        AnalyticsSummaryDto summary = analyticsService.getDepartmentAnalytics(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/institution")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get campus-wide institutional performance metrics and distribution breakdown for Admin")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDto>> getInstitutionalAnalytics() {
        AnalyticsSummaryDto summary = analyticsService.getInstitutionalAnalytics();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
