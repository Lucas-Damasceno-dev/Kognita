package com.kognita.dto;

import com.kognita.model.StudySession;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record StudySessionResponse(
    UUID id,
    UUID subjectId,
    String subjectName,
    UUID userId,
    Integer durationMinutes,
    String notes,
    LocalDate date,
    OffsetDateTime createdAt
) {
    public static StudySessionResponse from(StudySession session) {
        return new StudySessionResponse(
            session.getId(),
            session.getSubject().getId(),
            session.getSubject().getName(),
            session.getUser().getId(),
            session.getDurationMinutes(),
            session.getNotes(),
            session.getDate(),
            session.getCreatedAt()
        );
    }
}
