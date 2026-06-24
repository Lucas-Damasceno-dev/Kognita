package com.kognita.dto;

import java.util.UUID;

public record CreateErrorLogRequest(
    String title,
    String description,
    String solution,
    UUID taskId
) {}
