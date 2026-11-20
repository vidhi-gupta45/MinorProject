package com.campuscare.issue.dto;

import com.campuscare.issue.entity.IssueCategory;

public record CategoryDto(
        Long id,
        String code,
        String name,
        String description,
        boolean active
) {
    public static CategoryDto fromEntity(IssueCategory category) {
        if (category == null) return null;
        return new CategoryDto(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.isActive()
        );
    }
}
