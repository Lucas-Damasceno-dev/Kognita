package com.kognita.dto;

import com.kognita.model.ErrorLog;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ErrorLogResponse(
    UUID id,
    UUID userId,
    UUID taskId,
    String title,
    String description,
    String solution,
    OffsetDateTime createdAt
) {
    public static ErrorLogResponse from(ErrorLog errorLog) {
        return new ErrorLogResponse(
            errorLog.getId(),
            errorLog.getUser().getId(),
            errorLog.getTask() != null ? errorLog.getTask().getId() : null,
            errorLog.getTitle(),
            errorLog.getDescription(),
            errorLog.getSolution(),
            errorLog.getCreatedAt()
        );
    }
}
