package com.kognita.dto;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;

public record CreateFlashcardRequest(
    @NotBlank String question,
    @NotBlank String answer,
    UUID subjectId,
    String type,
    String options,
    Integer correctOptionIndex
) {}
