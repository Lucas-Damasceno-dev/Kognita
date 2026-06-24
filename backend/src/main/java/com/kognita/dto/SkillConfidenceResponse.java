package com.kognita.dto;

import java.util.List;

public record SkillConfidenceResponse(
    List<SkillConfidence> skills,
    int currentStreak,
    int totalWithoutAi,
    boolean todayCompleted
) {
    public record SkillConfidence(
        String name,
        long totalChallenges,
        long withoutAi,
        int confidencePercent
    ) {}
}
