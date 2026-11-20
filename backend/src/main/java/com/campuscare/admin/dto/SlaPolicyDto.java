package com.campuscare.admin.dto;

import com.campuscare.issue.entity.IssuePriority;
import com.campuscare.issue.entity.SlaPolicy;
import java.time.Instant;

public class SlaPolicyDto {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private IssuePriority priority;
    private int responseTargetHours;
    private int resolutionTargetHours;
    private boolean active;
    private Instant updatedAt;

    public SlaPolicyDto() {}

    public static SlaPolicyDto fromEntity(SlaPolicy entity) {
        SlaPolicyDto dto = new SlaPolicyDto();
        dto.setId(entity.getId());
        if (entity.getCategory() != null) {
            dto.setCategoryId(entity.getCategory().getId());
            dto.setCategoryName(entity.getCategory().getName());
            dto.setCategoryCode(entity.getCategory().getCode());
        }
        dto.setPriority(entity.getPriority());
        dto.setResponseTargetHours(entity.getResponseTargetHours());
        dto.setResolutionTargetHours(entity.getResolutionTargetHours());
        dto.setActive(entity.isActive());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getCategoryCode() { return categoryCode; }
    public void setCategoryCode(String categoryCode) { this.categoryCode = categoryCode; }
    public IssuePriority getPriority() { return priority; }
    public void setPriority(IssuePriority priority) { this.priority = priority; }
    public int getResponseTargetHours() { return responseTargetHours; }
    public void setResponseTargetHours(int responseTargetHours) { this.responseTargetHours = responseTargetHours; }
    public int getResolutionTargetHours() { return resolutionTargetHours; }
    public void setResolutionTargetHours(int resolutionTargetHours) { this.resolutionTargetHours = resolutionTargetHours; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
