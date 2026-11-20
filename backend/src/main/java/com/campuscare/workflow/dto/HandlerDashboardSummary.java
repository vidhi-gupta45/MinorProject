package com.campuscare.workflow.dto;

public record HandlerDashboardSummary(
        long assigned,
        long acknowledged,
        long inProgress,
        long resolved,
        long overdue
) {}
