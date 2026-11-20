package com.campuscare.auth.dto;

import com.campuscare.user.entity.User;

public record UserDto(
        Long id,
        String fullName,
        String email,
        String role,
        DepartmentDto department,
        String phoneNumber,
        boolean active
) {
    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                DepartmentDto.fromEntity(user.getDepartment()),
                user.getPhoneNumber(),
                user.isActive()
        );
    }
}
