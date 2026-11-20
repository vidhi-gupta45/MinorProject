package com.campuscare.admin.dto;

import com.campuscare.issue.entity.IssueHistory;
import java.time.Instant;

public class AdminAuditLogDto {
    private Long id;
    private Long issueId;
    private String publicIssueId;
    private String issueTitle;
    private Long actorId;
    private String actorName;
    private String actorEmail;
    private String eventType;
    private String oldStatus;
    private String newStatus;
    private String previousAssigneeName;
    private String newAssigneeName;
    private String comment;
    private Instant createdAt;

    public AdminAuditLogDto() {}

    public static AdminAuditLogDto fromEntity(IssueHistory history) {
        AdminAuditLogDto dto = new AdminAuditLogDto();
        dto.setId(history.getId());
        if (history.getIssue() != null) {
            dto.setIssueId(history.getIssue().getId());
            dto.setPublicIssueId(history.getIssue().getPublicIssueId());
            dto.setIssueTitle(history.getIssue().getTitle());
        }
        if (history.getActor() != null) {
            dto.setActorId(history.getActor().getId());
            dto.setActorName(history.getActor().getFullName());
            dto.setActorEmail(history.getActor().getEmail());
        } else {
            dto.setActorName("System Automation");
            dto.setActorEmail("system@campuscare.local");
        }
        dto.setEventType(history.getEventType());
        dto.setOldStatus(history.getOldStatus());
        dto.setNewStatus(history.getNewStatus());
        if (history.getPreviousAssignee() != null) {
            dto.setPreviousAssigneeName(history.getPreviousAssignee().getFullName());
        }
        if (history.getNewAssignee() != null) {
            dto.setNewAssigneeName(history.getNewAssignee().getFullName());
        }
        dto.setComment(history.getComment());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIssueId() { return issueId; }
    public void setIssueId(Long issueId) { this.issueId = issueId; }
    public String getPublicIssueId() { return publicIssueId; }
    public void setPublicIssueId(String publicIssueId) { this.publicIssueId = publicIssueId; }
    public String getIssueTitle() { return issueTitle; }
    public void setIssueTitle(String issueTitle) { this.issueTitle = issueTitle; }
    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getPreviousAssigneeName() { return previousAssigneeName; }
    public void setPreviousAssigneeName(String previousAssigneeName) { this.previousAssigneeName = previousAssigneeName; }
    public String getNewAssigneeName() { return newAssigneeName; }
    public void setNewAssigneeName(String newAssigneeName) { this.newAssigneeName = newAssigneeName; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
