package com.campuscare.common.dto;

public record ErrorDetail(
        String field,
        String message
) {}
