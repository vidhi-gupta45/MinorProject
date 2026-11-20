package com.campuscare.analytics.dto;

import java.util.Map;

public record AnalyticsSummaryDto(
        long totalIssues,
        long openIssues,
        long inProgressIssues,
        long resolvedIssues,
        long closedIssues,
        long overdueIssues,
        double slaComplianceRate,
        double averageResolutionHours,
        Map<String, Long> statusDistribution,
        Map<String, Long> categoryDistribution,
        Map<String, Long> priorityDistribution
) {}
