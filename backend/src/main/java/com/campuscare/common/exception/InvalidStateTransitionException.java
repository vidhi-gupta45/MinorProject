package com.campuscare.common.exception;

public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(String currentStatus, String targetStatus, String reason) {
        super(String.format("Cannot transition issue status from %s to %s: %s", currentStatus, targetStatus, reason));
    }

    public InvalidStateTransitionException(String message) {
        super(message);
    }
}
