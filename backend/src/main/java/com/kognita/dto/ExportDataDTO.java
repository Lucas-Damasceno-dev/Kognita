package com.kognita.dto;

import java.util.List;

public record ExportDataDTO(
        UserResponse profile,
        List<SubjectResponse> subjects,
        List<TaskResponse> tasks,
        List<StudySessionResponse> studySessions,
        List<GoalResponse> studyGoals,
        List<ChallengeAttemptResponse> challengeAttempts,
        List<ChallengeGoalResponse> challengeGoals,
        List<ErrorLogResponse> errorLogs
) {
}
