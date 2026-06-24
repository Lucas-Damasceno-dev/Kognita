package com.kognita.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateErrorLogRequest(
    @NotBlank String title,
    @NotBlank String description,
    String solution,
    @NotNull UUID taskId
) {}
