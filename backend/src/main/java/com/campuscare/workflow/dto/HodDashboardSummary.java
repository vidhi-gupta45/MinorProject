package com.campuscare.workflow.dto;

public record HodDashboardSummary(
        long totalIssues,
        long unassigned,
        long inProgress,
        long resolved,
        long closed,
        long overdue,
        long activeHandlersCount
) {}
