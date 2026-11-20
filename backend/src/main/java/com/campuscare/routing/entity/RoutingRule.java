package com.campuscare.routing.entity;

import com.campuscare.issue.entity.IssueCategory;
import com.campuscare.user.entity.Department;
import com.campuscare.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "routing_rules", uniqueConstraints = {
        @UniqueConstraint(name = "uq_dept_cat_priority", columnNames = {"department_id", "category_id", "priority_condition"})
})
public class RoutingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private IssueCategory category;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "assignee_id", nullable = false)
    private User assignee;

    @Column(name = "priority_condition", nullable = false, length = 20)
    private String priorityCondition = "ALL";

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public RoutingRule() {}

    public RoutingRule(Department department, IssueCategory category, User assignee, String priorityCondition) {
        this.department = department;
        this.category = category;
        this.assignee = assignee;
        this.priorityCondition = priorityCondition != null ? priorityCondition : "ALL";
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

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public IssueCategory getCategory() {
        return category;
    }

    public void setCategory(IssueCategory category) {
        this.category = category;
    }

    public User getAssignee() {
        return assignee;
    }

    public void setAssignee(User assignee) {
        this.assignee = assignee;
    }

    public String getPriorityCondition() {
        return priorityCondition;
    }

    public void setPriorityCondition(String priorityCondition) {
        this.priorityCondition = priorityCondition;
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
