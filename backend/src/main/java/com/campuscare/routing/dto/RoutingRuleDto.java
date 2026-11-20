package com.campuscare.routing.dto;

import com.campuscare.routing.entity.RoutingRule;

public record RoutingRuleDto(
        Long id,
        Long departmentId,
        String departmentName,
        Long categoryId,
        String categoryName,
        String categoryCode,
        Long assigneeId,
        String assigneeName,
        String assigneeEmail,
        String priorityCondition,
        boolean active
) {
    public static RoutingRuleDto fromEntity(RoutingRule rule) {
        return new RoutingRuleDto(
                rule.getId(),
                rule.getDepartment().getId(),
                rule.getDepartment().getName(),
                rule.getCategory().getId(),
                rule.getCategory().getName(),
                rule.getCategory().getCode(),
                rule.getAssignee().getId(),
                rule.getAssignee().getFullName(),
                rule.getAssignee().getEmail(),
                rule.getPriorityCondition(),
                rule.isActive()
        );
    }
}
