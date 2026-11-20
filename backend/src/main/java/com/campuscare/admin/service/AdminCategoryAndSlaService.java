package com.campuscare.admin.service;

import com.campuscare.admin.dto.CategoryAdminDto;
import com.campuscare.admin.dto.CreateCategoryRequest;
import com.campuscare.admin.dto.SlaPolicyDto;
import com.campuscare.admin.dto.UpdateCategoryRequest;
import com.campuscare.admin.dto.UpdateSlaPolicyRequest;
import com.campuscare.common.exception.BadRequestException;
import com.campuscare.common.exception.ResourceNotFoundException;
import com.campuscare.issue.entity.IssueCategory;
import com.campuscare.issue.entity.IssuePriority;
import com.campuscare.issue.entity.SlaPolicy;
import com.campuscare.issue.repository.IssueCategoryRepository;
import com.campuscare.issue.repository.SlaPolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminCategoryAndSlaService {

    private final IssueCategoryRepository categoryRepository;
    private final SlaPolicyRepository slaPolicyRepository;

    public AdminCategoryAndSlaService(IssueCategoryRepository categoryRepository,
                                     SlaPolicyRepository slaPolicyRepository) {
        this.categoryRepository = categoryRepository;
        this.slaPolicyRepository = slaPolicyRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryAdminDto> getAllCategories() {
        return categoryRepository.findAllByOrderByIdAsc().stream()
                .map(CategoryAdminDto::fromEntity)
                .toList();
    }

    @Transactional
    public CategoryAdminDto createCategory(CreateCategoryRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        if (categoryRepository.existsByCode(cleanCode)) {
            throw new BadRequestException("Category code already exists: " + cleanCode);
        }

        IssueCategory category = new IssueCategory(
                cleanCode,
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null
        );

        IssueCategory saved = categoryRepository.save(category);

        // Auto-provision standard default SLA policies for the new category
        seedDefaultSlaForCategory(saved);

        return CategoryAdminDto.fromEntity(saved);
    }

    @Transactional
    public CategoryAdminDto updateCategory(Long categoryId, UpdateCategoryRequest request) {
        IssueCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("IssueCategory", "id", categoryId));

        category.setName(request.getName().trim());
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription().trim());
        }
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }

        IssueCategory updated = categoryRepository.save(category);
        return CategoryAdminDto.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<SlaPolicyDto> getAllSlaPolicies() {
        return slaPolicyRepository.findAllByOrderByCategoryIdAscPriorityAsc().stream()
                .map(SlaPolicyDto::fromEntity)
                .toList();
    }

    @Transactional
    public SlaPolicyDto updateSlaPolicy(Long policyId, UpdateSlaPolicyRequest request) {
        SlaPolicy policy = slaPolicyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("SlaPolicy", "id", policyId));

        policy.setResponseTargetHours(request.getResponseTargetHours());
        policy.setResolutionTargetHours(request.getResolutionTargetHours());
        if (request.getActive() != null) {
            policy.setActive(request.getActive());
        }

        SlaPolicy saved = slaPolicyRepository.save(policy);
        return SlaPolicyDto.fromEntity(saved);
    }

    @Transactional
    public void seedDefaultSlaForCategory(IssueCategory category) {
        createPolicyIfNotExists(category, IssuePriority.CRITICAL, 2, 8);
        createPolicyIfNotExists(category, IssuePriority.HIGH, 6, 24);
        createPolicyIfNotExists(category, IssuePriority.MEDIUM, 12, 48);
        createPolicyIfNotExists(category, IssuePriority.LOW, 24, 96);
    }

    private void createPolicyIfNotExists(IssueCategory category, IssuePriority priority, int responseHours, int resolutionHours) {
        if (!slaPolicyRepository.existsByCategoryIdAndPriority(category.getId(), priority)) {
            slaPolicyRepository.save(new SlaPolicy(category, priority, responseHours, resolutionHours));
        }
    }
}
