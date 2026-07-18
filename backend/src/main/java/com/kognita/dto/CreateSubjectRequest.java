package com.kognita.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSubjectRequest(
    @NotBlank String name,
    String description,
    String color,
    String notes,
    Boolean archived
) {
    public CreateSubjectRequest(String name, String description, String color) {
        this(name, description, color, null, false);
    }
    public CreateSubjectRequest(String name, String description, String color, String notes) {
        this(name, description, color, notes, false);
    }
}
