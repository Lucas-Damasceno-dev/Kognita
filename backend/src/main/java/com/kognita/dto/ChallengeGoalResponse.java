package com.kognita.dto;

import com.kognita.model.ChallengeGoal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ChallengeGoalResponse(
    UUID id,
    Integer targetCount,
    Integer currentCount,
    LocalDate deadlineDate,
    UUID userId,
    OffsetDateTime createdAt
) {
    public static ChallengeGoalResponse from(ChallengeGoal goal) {
        return new ChallengeGoalResponse(
            goal.getId(),
            goal.getTargetCount(),
            goal.getCurrentCount(),
            goal.getDeadlineDate(),
            goal.getUser().getId(),
            goal.getCreatedAt()
        );
    }
}
