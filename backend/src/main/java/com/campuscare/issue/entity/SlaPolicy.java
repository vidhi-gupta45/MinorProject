package com.campuscare.issue.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sla_policies", uniqueConstraints = {
        @UniqueConstraint(name = "uq_cat_priority", columnNames = {"category_id", "priority"})
})
public class SlaPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private IssueCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IssuePriority priority;

    @Column(name = "response_target_hours", nullable = false)
    private int responseTargetHours;

    @Column(name = "resolution_target_hours", nullable = false)
    private int resolutionTargetHours;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public SlaPolicy() {}

    public SlaPolicy(IssueCategory category, IssuePriority priority, int responseTargetHours, int resolutionTargetHours) {
        this.category = category;
        this.priority = priority;
        this.responseTargetHours = responseTargetHours;
        this.resolutionTargetHours = resolutionTargetHours;
        this.active = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public IssueCategory getCategory() {
        return category;
    }

    public void setCategory(IssueCategory category) {
        this.category = category;
    }

    public IssuePriority getPriority() {
        return priority;
    }

    public void setPriority(IssuePriority priority) {
        this.priority = priority;
    }

    public int getResponseTargetHours() {
        return responseTargetHours;
    }

    public void setResponseTargetHours(int responseTargetHours) {
        this.responseTargetHours = responseTargetHours;
    }

    public int getResolutionTargetHours() {
        return resolutionTargetHours;
    }

    public void setResolutionTargetHours(int resolutionTargetHours) {
        this.resolutionTargetHours = resolutionTargetHours;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
