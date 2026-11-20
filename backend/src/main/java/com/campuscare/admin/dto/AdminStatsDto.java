package com.campuscare.admin.dto;

public class AdminStatsDto {
    private long totalUsers;
    private long totalDepartments;
    private long totalCategories;
    private long totalIssues;
    private long activeHandlers;
    private long totalSlaPolicies;
    private String systemStatus;

    public AdminStatsDto() {}

    public AdminStatsDto(long totalUsers, long totalDepartments, long totalCategories,
                         long totalIssues, long activeHandlers, long totalSlaPolicies, String systemStatus) {
        this.totalUsers = totalUsers;
        this.totalDepartments = totalDepartments;
        this.totalCategories = totalCategories;
        this.totalIssues = totalIssues;
        this.activeHandlers = activeHandlers;
        this.totalSlaPolicies = totalSlaPolicies;
        this.systemStatus = systemStatus;
    }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getTotalDepartments() { return totalDepartments; }
    public void setTotalDepartments(long totalDepartments) { this.totalDepartments = totalDepartments; }
    public long getTotalCategories() { return totalCategories; }
    public void setTotalCategories(long totalCategories) { this.totalCategories = totalCategories; }
    public long getTotalIssues() { return totalIssues; }
    public void setTotalIssues(long totalIssues) { this.totalIssues = totalIssues; }
    public long getActiveHandlers() { return activeHandlers; }
    public void setActiveHandlers(long activeHandlers) { this.activeHandlers = activeHandlers; }
    public long getTotalSlaPolicies() { return totalSlaPolicies; }
    public void setTotalSlaPolicies(long totalSlaPolicies) { this.totalSlaPolicies = totalSlaPolicies; }
    public String getSystemStatus() { return systemStatus; }
    public void setSystemStatus(String systemStatus) { this.systemStatus = systemStatus; }
}
