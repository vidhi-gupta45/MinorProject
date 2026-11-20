package com.campuscare.admin.controller;

import com.campuscare.admin.dto.AdminAuditLogDto;
import com.campuscare.admin.dto.AdminStatsDto;
import com.campuscare.admin.service.AdminAuditService;
import com.campuscare.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin System Audit & Vitals", description = "System-wide audit trail logs and institution vitals")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AdminAuditService adminAuditService;

    public AdminAuditController(AdminAuditService adminAuditService) {
        this.adminAuditService = adminAuditService;
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get paginated system-wide audit logs with filters by event, actor, and date")
    public ResponseEntity<ApiResponse<Page<AdminAuditLogDto>>> getAuditLogs(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Long issueId,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Instant startInstant = startDate != null ? startDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : null;
        Instant endInstant = endDate != null ? endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant() : null;

        Pageable pageable = PageRequest.of(page, size);
        Page<AdminAuditLogDto> logs = adminAuditService.getAuditLogs(eventType, issueId, actorId, startInstant, endInstant, pageable);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get high-level system indicators and entity totals for Admin Dashboard")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getAdminStats() {
        AdminStatsDto stats = adminAuditService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
