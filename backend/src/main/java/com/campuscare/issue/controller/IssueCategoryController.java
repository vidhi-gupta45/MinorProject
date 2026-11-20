package com.campuscare.issue.controller;

import com.campuscare.common.dto.ApiResponse;
import com.campuscare.issue.dto.CategoryDto;
import com.campuscare.issue.repository.IssueCategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Categories", description = "Issue categories endpoints")
public class IssueCategoryController {

    private final IssueCategoryRepository categoryRepository;

    public IssueCategoryController(IssueCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    @Operation(summary = "Get all active issue categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getActiveCategories() {
        List<CategoryDto> categories = categoryRepository.findAllByActiveTrue().stream()
                .map(CategoryDto::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }
}
