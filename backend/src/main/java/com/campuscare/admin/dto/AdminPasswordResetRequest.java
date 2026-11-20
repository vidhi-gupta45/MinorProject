package com.campuscare.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminPasswordResetRequest {

    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 50, message = "Password must be between 6 and 50 characters")
    private String newPassword;

    public AdminPasswordResetRequest() {}

    public AdminPasswordResetRequest(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
