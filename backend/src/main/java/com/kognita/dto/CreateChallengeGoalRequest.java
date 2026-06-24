package com.kognita.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateChallengeGoalRequest(
    @NotNull Integer targetCount,
    @NotNull LocalDate deadlineDate
) {}
