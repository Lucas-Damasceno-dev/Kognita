package com.kognita.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CreateChallengeAttemptRequest(
    @NotNull UUID taskId,
    @NotNull Boolean usedAi,
    String notes,
    String howISolved,
    LocalDate date
) {}
