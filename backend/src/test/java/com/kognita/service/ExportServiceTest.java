package com.kognita.service;

import com.kognita.dto.ExportDataDTO;
import com.kognita.dto.UserResponse;
import com.kognita.repository.ChallengeAttemptRepository;
import com.kognita.repository.ChallengeGoalRepository;
import com.kognita.repository.ErrorLogRepository;
import com.kognita.repository.StudyGoalRepository;
import com.kognita.repository.StudySessionRepository;
import com.kognita.repository.SubjectRepository;
import com.kognita.repository.TaskRepository;
import com.kognita.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ExportServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private StudySessionRepository studySessionRepository;
    @Mock
    private StudyGoalRepository studyGoalRepository;
    @Mock
    private ChallengeAttemptRepository challengeAttemptRepository;
    @Mock
    private ChallengeGoalRepository challengeGoalRepository;
    @Mock
    private ErrorLogRepository errorLogRepository;
    @Mock
    private UserService userService;

    @InjectMocks
    private ExportService exportService;

    @Test
    void testExportData() {
        UUID userId = UUID.randomUUID();
        UserResponse mockUser = new UserResponse(userId, "Test User", "test@test.com", "avatar.png", java.time.OffsetDateTime.now());

        when(userService.findById(userId)).thenReturn(mockUser);
        when(subjectRepository.findByUserId(userId)).thenReturn(Collections.emptyList());
        when(taskRepository.findByUserId(userId)).thenReturn(Collections.emptyList());
        when(studySessionRepository.findByUserId(userId)).thenReturn(Collections.emptyList());
        when(studyGoalRepository.findByUserId(userId)).thenReturn(Collections.emptyList());
        when(challengeAttemptRepository.findByUserId(userId)).thenReturn(Collections.emptyList());
        when(challengeGoalRepository.findByUserId(userId)).thenReturn(Collections.emptyList());
        when(errorLogRepository.findByUserId(userId)).thenReturn(Collections.emptyList());

        ExportDataDTO result = exportService.exportData(userId);

        assertNotNull(result);
        assertEquals(mockUser, result.profile());
        assertEquals(0, result.subjects().size());
        assertEquals(0, result.tasks().size());
        assertEquals(0, result.studySessions().size());
        assertEquals(0, result.studyGoals().size());
        assertEquals(0, result.challengeAttempts().size());
        assertEquals(0, result.challengeGoals().size());
        assertEquals(0, result.errorLogs().size());

        verify(userService).findById(userId);
        verify(subjectRepository).findByUserId(userId);
        verify(taskRepository).findByUserId(userId);
        verify(studySessionRepository).findByUserId(userId);
        verify(studyGoalRepository).findByUserId(userId);
        verify(challengeAttemptRepository).findByUserId(userId);
        verify(challengeGoalRepository).findByUserId(userId);
        verify(errorLogRepository).findByUserId(userId);
    }
}
