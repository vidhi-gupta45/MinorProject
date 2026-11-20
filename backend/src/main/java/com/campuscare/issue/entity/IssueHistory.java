package com.campuscare.issue.entity;

import com.campuscare.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "issue_histories")
public class IssueHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "old_status", length = 30)
    private String oldStatus;

    @Column(name = "new_status", length = 30)
    private String newStatus;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "previous_assignee_id")
    private User previousAssignee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "new_assignee_id")
    private User newAssignee;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public IssueHistory() {}

    public IssueHistory(Issue issue, User actor, String eventType, String oldStatus, String newStatus,
                        User previousAssignee, User newAssignee, String comment) {
        this.issue = issue;
        this.actor = actor;
        this.eventType = eventType;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.previousAssignee = previousAssignee;
        this.newAssignee = newAssignee;
        this.comment = comment;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Issue getIssue() {
        return issue;
    }

    public void setIssue(Issue issue) {
        this.issue = issue;
    }

    public User getActor() {
        return actor;
    }

    public void setActor(User actor) {
        this.actor = actor;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(String oldStatus) {
        this.oldStatus = oldStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public User getPreviousAssignee() {
        return previousAssignee;
    }

    public void setPreviousAssignee(User previousAssignee) {
        this.previousAssignee = previousAssignee;
    }

    public User getNewAssignee() {
        return newAssignee;
    }

    public void setNewAssignee(User newAssignee) {
        this.newAssignee = newAssignee;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
