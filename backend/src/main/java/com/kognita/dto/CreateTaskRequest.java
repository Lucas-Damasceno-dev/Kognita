package com.kognita.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

public record CreateTaskRequest(
    @NotBlank String title,
    String description,
    String status,
    String priority,
    UUID subjectId,
    LocalDate dueDate,
    String skillCategory,
    Boolean requiresProof
) {}
