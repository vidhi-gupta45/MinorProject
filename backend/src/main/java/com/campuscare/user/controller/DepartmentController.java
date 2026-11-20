package com.campuscare.user.controller;

import com.campuscare.auth.dto.DepartmentDto;
import com.campuscare.common.dto.ApiResponse;
import com.campuscare.user.repository.DepartmentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@Tag(name = "Departments", description = "Department information endpoints")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    @Operation(summary = "Get list of all active departments")
    public ResponseEntity<ApiResponse<List<DepartmentDto>>> getActiveDepartments() {
        List<DepartmentDto> departments = departmentRepository.findAllByActiveTrue().stream()
                .map(DepartmentDto::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(departments));
    }
}
