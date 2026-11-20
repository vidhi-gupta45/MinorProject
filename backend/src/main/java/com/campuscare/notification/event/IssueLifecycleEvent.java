package com.campuscare.notification.event;

import com.campuscare.issue.entity.Issue;
import com.campuscare.user.entity.User;

public record IssueLifecycleEvent(
        Issue issue,
        String eventType,
        User actor,
        String message
) {}
