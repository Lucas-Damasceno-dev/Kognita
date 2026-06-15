package com.kognita.dto;

import com.kognita.model.StudyGoal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record GoalResponse(
    UUID id,
    String title,
    String description,
    Integer targetHours,
    Integer currentHours,
    LocalDate deadline,
    UUID userId,
    OffsetDateTime createdAt
) {
    public static GoalResponse from(StudyGoal goal) {
        return new GoalResponse(
            goal.getId(),
            goal.getTitle(),
            goal.getDescription(),
            goal.getTargetHours(),
            goal.getCurrentHours(),
            goal.getDeadline(),
            goal.getUser().getId(),
            goal.getCreatedAt()
        );
    }
}
