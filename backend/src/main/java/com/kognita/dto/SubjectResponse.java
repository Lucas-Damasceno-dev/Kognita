package com.kognita.dto;

import com.kognita.model.Subject;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SubjectResponse(
    UUID id,
    String name,
    String description,
    String color,
    UUID userId,
    OffsetDateTime createdAt
) {
    public static SubjectResponse from(Subject subject) {
        return new SubjectResponse(
            subject.getId(),
            subject.getName(),
            subject.getDescription(),
            subject.getColor(),
            subject.getUser().getId(),
            subject.getCreatedAt()
        );
    }
}
