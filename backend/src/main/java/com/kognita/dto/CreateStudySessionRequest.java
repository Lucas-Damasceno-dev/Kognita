package com.kognita.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CreateStudySessionRequest(
    @NotNull UUID subjectId,
    @NotNull Integer durationMinutes,
    String notes,
    LocalDate date
) {}
