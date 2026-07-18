package com.kognita.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ReviewFlashcardRequest(
    @Min(1) @Max(5) int rating
) {}
