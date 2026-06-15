package com.kognita.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateGoalRequest(
    @NotBlank String title,
    String description,
    @NotNull Integer targetHours,
    LocalDate deadline
) {}
