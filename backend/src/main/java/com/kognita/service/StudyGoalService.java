package com.kognita.service;

import com.kognita.dto.CreateGoalRequest;
import com.kognita.dto.GoalResponse;
import com.kognita.model.StudyGoal;
import com.kognita.repository.StudyGoalRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StudyGoalService {

    private final StudyGoalRepository repository;
    private final UserService userService;

    public StudyGoalService(StudyGoalRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @Transactional
    public List<GoalResponse> findAllByUser(UUID userId) {
        var goals = repository.findByUserId(userId);
        for (var goal : goals) {
            checkAndRolloverGoal(goal);
        }
        return goals.stream().map(GoalResponse::from).toList();
    }

    @Transactional
    public Page<GoalResponse> findAllByUser(UUID userId, Pageable pageable) {
        var page = repository.findByUserId(userId, pageable);
        for (var goal : page.getContent()) {
            checkAndRolloverGoal(goal);
        }
        return page.map(GoalResponse::from);
    }

    @Transactional
    public GoalResponse create(CreateGoalRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var goal = new StudyGoal();
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setTargetHours(request.targetHours());
        goal.setDeadline(request.deadline());
        goal.setIsRecurring(request.isRecurring() != null ? request.isRecurring() : false);
        goal.setRecurrencePeriod(request.recurrencePeriod() != null ? request.recurrencePeriod() : "none");
        goal.setStreakCount(0);
        goal.setUser(user);
        return GoalResponse.from(repository.save(goal));
    }

    @Transactional
    public GoalResponse update(UUID id, CreateGoalRequest request, UUID userId) {
        var goal = repository.findById(id).orElseThrow();
        if (!goal.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setTargetHours(request.targetHours());
        goal.setDeadline(request.deadline());
        goal.setIsRecurring(request.isRecurring() != null ? request.isRecurring() : false);
        goal.setRecurrencePeriod(request.recurrencePeriod() != null ? request.recurrencePeriod() : "none");
        return GoalResponse.from(repository.save(goal));
    }

    @Transactional
    public GoalResponse updateProgress(UUID id, Integer hours, UUID userId) {
        var goal = repository.findById(id).orElseThrow();
        if (!goal.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        goal.setCurrentHours(goal.getCurrentHours() + hours);
        return GoalResponse.from(repository.save(goal));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        var goal = repository.findById(id).orElseThrow();
        if (!goal.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        repository.delete(goal);
    }

    private void checkAndRolloverGoal(StudyGoal goal) {
        if (goal.getIsRecurring() != null && goal.getIsRecurring() && goal.getDeadline() != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDate deadline = goal.getDeadline();
            String period = goal.getRecurrencePeriod() != null ? goal.getRecurrencePeriod() : "weekly";
            boolean changed = false;

            while (deadline.isBefore(today)) {
                changed = true;
                boolean achieved = goal.getCurrentHours() >= goal.getTargetHours();
                if (achieved) {
                    goal.setStreakCount((goal.getStreakCount() != null ? goal.getStreakCount() : 0) + 1);
                } else {
                    goal.setStreakCount(0);
                }

                // Roll over current hours
                goal.setCurrentHours(0);

                if ("weekly".equals(period)) {
                    deadline = deadline.plusWeeks(1);
                } else if ("monthly".equals(period)) {
                    deadline = deadline.plusMonths(1);
                } else {
                    deadline = deadline.plusWeeks(1);
                    break;
                }
            }

            if (changed) {
                goal.setDeadline(deadline);
                repository.save(goal);
            }
        }
    }
}
