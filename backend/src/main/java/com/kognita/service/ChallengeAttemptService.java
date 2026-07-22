package com.kognita.service;

import com.kognita.dto.ChallengeAttemptResponse;
import com.kognita.dto.CreateChallengeAttemptRequest;
import com.kognita.dto.SkillConfidenceResponse;
import com.kognita.dto.SkillConfidenceResponse.SkillConfidence;
import com.kognita.model.ChallengeAttempt;
import com.kognita.repository.ChallengeAttemptRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ChallengeAttemptService {

    private final ChallengeAttemptRepository repository;
    private final TaskService taskService;
    private final UserService userService;
    private final ChallengeGoalService challengeGoalService;

    public ChallengeAttemptService(ChallengeAttemptRepository repository, TaskService taskService, UserService userService, ChallengeGoalService challengeGoalService) {
        this.repository = repository;
        this.taskService = taskService;
        this.userService = userService;
        this.challengeGoalService = challengeGoalService;
    }

    public List<ChallengeAttemptResponse> findAllByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(ChallengeAttemptResponse::from).toList();
    }

    @Transactional
    public ChallengeAttemptResponse create(CreateChallengeAttemptRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var task = taskService.findEntityById(request.taskId());
        if (!task.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        var attempt = new ChallengeAttempt();
        attempt.setTask(task);
        attempt.setUser(user);
        attempt.setUsedAi(request.usedAi());
        attempt.setNotes(request.notes());
        attempt.setHowISolved(request.howISolved());
        attempt.setSkillCategory(task.getSkillCategory());
        attempt.setDate(request.date() != null ? request.date() : LocalDate.now());
        
        if (!request.usedAi()) {
            challengeGoalService.incrementProgress(userId);
            // Atualiza curva de esquecimento (spaced repetition) na Task
            int currentInterval = task.getReviewIntervalDays() != null ? task.getReviewIntervalDays() : 0;
            int nextInterval;
            if (currentInterval == 0) {
                nextInterval = 1;
            } else if (currentInterval == 1) {
                nextInterval = 7;
            } else if (currentInterval == 7) {
                nextInterval = 14;
            } else {
                nextInterval = 30;
            }
            task.setReviewIntervalDays(nextInterval);
            task.setNextReviewDate(LocalDate.now().plusDays(nextInterval));
        }
        
        return ChallengeAttemptResponse.from(repository.save(attempt));
    }

    @Transactional
    public ChallengeAttemptResponse update(UUID id, CreateChallengeAttemptRequest request, UUID userId) {
        var attempt = repository.findById(id).orElseThrow();
        if (!attempt.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        attempt.setHowISolved(request.howISolved());
        attempt.setNotes(request.notes());
        return ChallengeAttemptResponse.from(repository.save(attempt));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        var attempt = repository.findById(id).orElseThrow();
        if (!attempt.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        repository.delete(attempt);
    }

    public List<ChallengeAttemptResponse> getHistory(UUID userId, String skillCategory) {
        return repository.findHistory(userId, skillCategory).stream().map(ChallengeAttemptResponse::from).toList();
    }

    public SkillConfidenceResponse getStats(UUID userId) {
        var rawStats = repository.findConfidenceStatsByUser(userId);
        List<SkillConfidence> skills = new ArrayList<>();
        for (Object[] row : rawStats) {
            String name = (String) row[0];
            long total = ((Number) row[1]).longValue();
            long withoutAi = ((Number) row[2]).longValue();
            int pct = total > 0 ? (int) Math.round((withoutAi * 100.0) / total) : 0;
            skills.add(new SkillConfidence(name, total, withoutAi, pct));
        }

        var dates = repository.findDistinctDatesWithoutAi(userId);
        int streak = 0;
        LocalDate today = LocalDate.now();
        if (!dates.isEmpty()) {
            LocalDate startCheckDate = today;
            if (!dates.get(0).equals(startCheckDate)) {
                if (dates.get(0).equals(startCheckDate.minusDays(1))) {
                    startCheckDate = startCheckDate.minusDays(1);
                } else {
                    startCheckDate = null;
                }
            }
            if (startCheckDate != null) {
                for (int i = 0; i < dates.size(); i++) {
                    LocalDate expected = startCheckDate.minusDays(i);
                    if (dates.get(i).equals(expected)) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }


        long totalWithoutAi = rawStats.stream()
            .mapToLong(r -> ((Number) r[2]).longValue())
            .sum();

        boolean todayCompleted = repository.findByUserIdAndDate(userId, today)
            .stream().anyMatch(a -> !a.isUsedAi());

        return new SkillConfidenceResponse(skills, streak, (int) totalWithoutAi, todayCompleted);
    }
}
