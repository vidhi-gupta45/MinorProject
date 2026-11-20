package com.campuscare.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateSlaPolicyRequest {

    @NotNull(message = "Response target hours is required")
    @Min(value = 1, message = "Response target hours must be at least 1")
    private Integer responseTargetHours;

    @NotNull(message = "Resolution target hours is required")
    @Min(value = 1, message = "Resolution target hours must be at least 1")
    private Integer resolutionTargetHours;

    private Boolean active;

    public UpdateSlaPolicyRequest() {}

    public UpdateSlaPolicyRequest(Integer responseTargetHours, Integer resolutionTargetHours, Boolean active) {
        this.responseTargetHours = responseTargetHours;
        this.resolutionTargetHours = resolutionTargetHours;
        this.active = active;
    }

    public Integer getResponseTargetHours() { return responseTargetHours; }
    public void setResponseTargetHours(Integer responseTargetHours) { this.responseTargetHours = responseTargetHours; }
    public Integer getResolutionTargetHours() { return resolutionTargetHours; }
    public void setResolutionTargetHours(Integer resolutionTargetHours) { this.resolutionTargetHours = resolutionTargetHours; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
