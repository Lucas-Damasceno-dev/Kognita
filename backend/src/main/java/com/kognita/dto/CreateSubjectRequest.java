package com.kognita.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSubjectRequest(
    @NotBlank String name,
    String description,
    String color
) {}
