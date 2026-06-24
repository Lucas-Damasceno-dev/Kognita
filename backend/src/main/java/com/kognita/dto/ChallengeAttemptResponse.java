package com.kognita.dto;

import com.kognita.model.ChallengeAttempt;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ChallengeAttemptResponse(
    UUID id,
    UUID taskId,
    String taskTitle,
    UUID userId,
    boolean usedAi,
    String notes,
    String howISolved,
    String skillCategory,
    LocalDate date,
    OffsetDateTime createdAt
) {
    public static ChallengeAttemptResponse from(ChallengeAttempt attempt) {
        return new ChallengeAttemptResponse(
            attempt.getId(),
            attempt.getTask().getId(),
            attempt.getTask().getTitle(),
            attempt.getUser().getId(),
            attempt.isUsedAi(),
            attempt.getNotes(),
            attempt.getHowISolved(),
            attempt.getSkillCategory(),
            attempt.getDate(),
            attempt.getCreatedAt()
        );
    }
}
