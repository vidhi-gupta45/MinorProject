package com.campuscare.auth.dto;

import com.campuscare.user.entity.Department;

public record DepartmentDto(
        Long id,
        String name,
        String departmentCode,
        boolean active
) {
    public static DepartmentDto fromEntity(Department dept) {
        if (dept == null) return null;
        return new DepartmentDto(
                dept.getId(),
                dept.getName(),
                dept.getDepartmentCode(),
                dept.isActive()
        );
    }
}
