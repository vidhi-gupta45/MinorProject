package com.campuscare.admin.controller;

import com.campuscare.admin.dto.CategoryAdminDto;
import com.campuscare.admin.dto.CreateCategoryRequest;
import com.campuscare.admin.dto.SlaPolicyDto;
import com.campuscare.admin.dto.UpdateCategoryRequest;
import com.campuscare.admin.dto.UpdateSlaPolicyRequest;
import com.campuscare.admin.service.AdminCategoryAndSlaService;
import com.campuscare.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Categories & SLA", description = "Campus category catalog and SLA response/resolution threshold governance")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final AdminCategoryAndSlaService adminCategoryAndSlaService;

    public AdminCategoryController(AdminCategoryAndSlaService adminCategoryAndSlaService) {
        this.adminCategoryAndSlaService = adminCategoryAndSlaService;
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all issue categories including active and inactive")
    public ResponseEntity<ApiResponse<List<CategoryAdminDto>>> getAllCategories() {
        List<CategoryAdminDto> categories = adminCategoryAndSlaService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @PostMapping("/categories")
    @Operation(summary = "Create a new campus issue category and initialize default SLA policies")
    public ResponseEntity<ApiResponse<CategoryAdminDto>> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CategoryAdminDto created = adminCategoryAndSlaService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Category created successfully", created));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update an issue category name, description, or active status")
    public ResponseEntity<ApiResponse<CategoryAdminDto>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {

        CategoryAdminDto updated = adminCategoryAndSlaService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Category updated successfully", updated));
    }

    @GetMapping("/sla-policies")
    @Operation(summary = "Get all configured SLA policies across categories and priority tiers")
    public ResponseEntity<ApiResponse<List<SlaPolicyDto>>> getAllSlaPolicies() {
        List<SlaPolicyDto> policies = adminCategoryAndSlaService.getAllSlaPolicies();
        return ResponseEntity.ok(ApiResponse.ok(policies));
    }

    @PutMapping("/sla-policies/{id}")
    @Operation(summary = "Update SLA response and resolution hour targets for a policy")
    public ResponseEntity<ApiResponse<SlaPolicyDto>> updateSlaPolicy(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSlaPolicyRequest request) {

        SlaPolicyDto updated = adminCategoryAndSlaService.updateSlaPolicy(id, request);
        return ResponseEntity.ok(ApiResponse.ok("SLA policy updated successfully", updated));
    }
}
