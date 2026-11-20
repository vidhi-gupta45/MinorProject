package com.campuscare.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        UserDto user
) {
    public static AuthResponse of(String token, UserDto user) {
        return new AuthResponse(token, "Bearer", user);
    }
}
