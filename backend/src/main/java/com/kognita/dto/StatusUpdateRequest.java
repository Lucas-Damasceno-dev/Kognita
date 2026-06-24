package com.kognita.dto;

import jakarta.validation.constraints.NotBlank;

public record StatusUpdateRequest(@NotBlank String status) {}
