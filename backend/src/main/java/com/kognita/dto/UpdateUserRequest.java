package com.kognita.dto;

import jakarta.validation.constraints.Email;

public record UpdateUserRequest(
    String name,
    @Email String email,
    String currentPassword,
    String newPassword,
    String avatarUrl,
    String githubRepo,
    String title,
    String avatarBorder,
    Integer streakCount,
    java.time.LocalDate lastActiveDate,
    Integer streakFreezes
) {}
