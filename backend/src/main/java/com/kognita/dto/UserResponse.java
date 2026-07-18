package com.kognita.dto;

import com.kognita.model.User;
import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String name,
    String email,
    String avatarUrl,
    OffsetDateTime createdAt,
    long totalExperience,
    String githubRepo,
    String title,
    String avatarBorder,
    Integer streakCount,
    java.time.LocalDate lastActiveDate,
    Integer streakFreezes
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getAvatarUrl(),
            user.getCreatedAt(),
            user.getTotalExperience(),
            user.getGithubRepo(),
            user.getTitle(),
            user.getAvatarBorder(),
            user.getStreakCount(),
            user.getLastActiveDate(),
            user.getStreakFreezes()
        );
    }
}
