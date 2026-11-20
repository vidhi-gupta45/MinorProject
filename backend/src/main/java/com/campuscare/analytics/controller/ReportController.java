package com.campuscare.analytics.controller;

import com.campuscare.analytics.service.CsvExportService;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.issue.entity.IssueStatus;
import com.campuscare.user.entity.Role;
import com.campuscare.user.entity.User;
import com.campuscare.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports & Data Export", description = "CSV report generation and audit data export")
public class ReportController {

    private final CsvExportService csvExportService;
    private final UserRepository userRepository;

    public ReportController(CsvExportService csvExportService, UserRepository userRepository) {
        this.csvExportService = csvExportService;
        this.userRepository = userRepository;
    }

    @GetMapping(value = "/issues/export", produces = "text/csv")
    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    @Operation(summary = "Export filtered issues to downloadable CSV file")
    public void exportIssuesCsv(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long departmentId,
            HttpServletResponse response) throws IOException {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userDetails.getUsername()));

        // If HOD, enforce department scope
        Long effectiveDeptId = departmentId;
        if (user.getRole() == Role.ROLE_HOD) {
            effectiveDeptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        }

        Instant startInstant = startDate != null ? startDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : null;
        Instant endInstant = endDate != null ? endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant() : null;

        String filename = "campuscare-issues-" + LocalDate.now() + ".csv";
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        csvExportService.exportIssuesToCsv(effectiveDeptId, status, startInstant, endInstant, response.getWriter());
    }
}
