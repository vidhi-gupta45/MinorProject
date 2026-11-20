package com.campuscare.issue.dto;

public record StudentDashboardSummary(
        long totalSubmitted,
        long inProgress,
        long resolved,
        long closed
) {}
