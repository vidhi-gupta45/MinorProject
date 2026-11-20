package com.campuscare.admin.controller;

import com.campuscare.admin.dto.AdminPasswordResetRequest;
import com.campuscare.admin.dto.AdminUserDto;
import com.campuscare.admin.dto.CreateUserRequest;
import com.campuscare.admin.dto.UpdateUserRequest;
import com.campuscare.admin.service.AdminUserService;
import com.campuscare.common.dto.ApiResponse;
import com.campuscare.user.entity.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Admin User Management", description = "Global user provisioning, profile editing, role assignment, and password resets")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @Operation(summary = "Get paginated users with role, department, status, and search filters")
    public ResponseEntity<ApiResponse<Page<AdminUserDto>>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<AdminUserDto> users = adminUserService.getUsers(role, departmentId, active, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<ApiResponse<AdminUserDto>> getUserById(@PathVariable Long id) {
        AdminUserDto user = adminUserService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping
    @Operation(summary = "Provision a new user account with role and department assignment")
    public ResponseEntity<ApiResponse<AdminUserDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        AdminUserDto created = adminUserService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("User account provisioned successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user details, role, department, or active status")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {

        AdminUserDto updated = adminUserService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", updated));
    }

    @PutMapping("/{id}/password")
    @Operation(summary = "Reset password for a user account")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody AdminPasswordResetRequest request) {

        adminUserService.resetPassword(id, request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully", null));
    }
}
