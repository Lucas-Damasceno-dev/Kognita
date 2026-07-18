package com.kognita.dto;

import com.kognita.model.Task;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TaskResponse(
    UUID id,
    String title,
    String description,
    String status,
    String priority,
    UUID subjectId,
    String subjectName,
    UUID userId,
    LocalDate dueDate,
    String skillCategory,
    boolean requiresProof,
    boolean verifiedByGit,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getStatus(),
            task.getPriority(),
            task.getSubject() != null ? task.getSubject().getId() : null,
            task.getSubject() != null ? task.getSubject().getName() : null,
            task.getUser().getId(),
            task.getDueDate(),
            task.getSkillCategory(),
            task.isRequiresProof(),
            task.isVerifiedByGit(),
            task.getCreatedAt(),
            task.getUpdatedAt()
        );
    }
}
