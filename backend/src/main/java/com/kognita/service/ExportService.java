package com.kognita.service;

import com.kognita.dto.ChallengeAttemptResponse;
import com.kognita.dto.ChallengeGoalResponse;
import com.kognita.dto.ErrorLogResponse;
import com.kognita.dto.ExportDataDTO;
import com.kognita.dto.GoalResponse;
import com.kognita.dto.StudySessionResponse;
import com.kognita.dto.SubjectResponse;
import com.kognita.dto.TaskResponse;
import com.kognita.repository.ChallengeAttemptRepository;
import com.kognita.repository.ChallengeGoalRepository;
import com.kognita.repository.ErrorLogRepository;
import com.kognita.repository.StudyGoalRepository;
import com.kognita.repository.StudySessionRepository;
import com.kognita.repository.SubjectRepository;
import com.kognita.repository.TaskRepository;
import com.kognita.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ExportService {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final TaskRepository taskRepository;
    private final StudySessionRepository studySessionRepository;
    private final StudyGoalRepository studyGoalRepository;
    private final ChallengeAttemptRepository challengeAttemptRepository;
    private final ChallengeGoalRepository challengeGoalRepository;
    private final ErrorLogRepository errorLogRepository;
    private final UserService userService;

    public ExportService(
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            TaskRepository taskRepository,
            StudySessionRepository studySessionRepository,
            StudyGoalRepository studyGoalRepository,
            ChallengeAttemptRepository challengeAttemptRepository,
            ChallengeGoalRepository challengeGoalRepository,
            ErrorLogRepository errorLogRepository,
            UserService userService) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.taskRepository = taskRepository;
        this.studySessionRepository = studySessionRepository;
        this.studyGoalRepository = studyGoalRepository;
        this.challengeAttemptRepository = challengeAttemptRepository;
        this.challengeGoalRepository = challengeGoalRepository;
        this.errorLogRepository = errorLogRepository;
        this.userService = userService;
    }

    public ExportDataDTO exportData(UUID userId) {
        return new ExportDataDTO(
                userService.findById(userId),
                subjectRepository.findByUserId(userId).stream().map(SubjectResponse::from).toList(),
                taskRepository.findByUserId(userId).stream().map(TaskResponse::from).toList(),
                studySessionRepository.findByUserId(userId).stream().map(StudySessionResponse::from).toList(),
                studyGoalRepository.findByUserId(userId).stream().map(GoalResponse::from).toList(),
                challengeAttemptRepository.findByUserId(userId).stream().map(ChallengeAttemptResponse::from).toList(),
                challengeGoalRepository.findByUserId(userId).stream().map(ChallengeGoalResponse::from).toList(),
                errorLogRepository.findByUserId(userId).stream().map(ErrorLogResponse::from).toList()
        );
    }
}
