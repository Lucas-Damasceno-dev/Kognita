package com.kognita.dto;

import java.time.OffsetDateTime;

public record AchievementResponse(
    String id,
    String title,
    String description,
    String icon,
    boolean unlocked,
    OffsetDateTime unlockedAt
) {}
