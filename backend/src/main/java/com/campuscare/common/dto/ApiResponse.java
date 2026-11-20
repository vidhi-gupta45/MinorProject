package com.campuscare.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        List<ErrorDetail> errors,
        String errorCode,
        Instant timestamp
) {
    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data, null, null, Instant.now());
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ok("Operation successful", data);
    }

    public static <T> ApiResponse<T> error(String message, String errorCode, List<ErrorDetail> errors) {
        return new ApiResponse<>(false, message, null, errors, errorCode, Instant.now());
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return error(message, errorCode, null);
    }
}
