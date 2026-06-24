package com.kognita.service;

import com.kognita.dto.CreateChallengeGoalRequest;
import com.kognita.dto.ChallengeGoalResponse;
import com.kognita.model.ChallengeGoal;
import com.kognita.repository.ChallengeGoalRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ChallengeGoalService {

    private final ChallengeGoalRepository repository;
    private final UserService userService;

    public ChallengeGoalService(ChallengeGoalRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    public List<ChallengeGoalResponse> findAllByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(ChallengeGoalResponse::from).toList();
    }

    public ChallengeGoalResponse create(CreateChallengeGoalRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var goal = new ChallengeGoal();
        goal.setTargetCount(request.targetCount());
        goal.setDeadlineDate(request.deadlineDate());
        goal.setUser(user);
        return ChallengeGoalResponse.from(repository.save(goal));
    }

    public void delete(UUID id, UUID userId) {
        var goal = repository.findById(id).orElseThrow();
        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        repository.delete(goal);
    }

    public void incrementProgress(UUID userId) {
        var goals = repository.findByUserId(userId);
        for (var goal : goals) {
            goal.setCurrentCount(goal.getCurrentCount() + 1);
            repository.save(goal);
        }
    }
}
