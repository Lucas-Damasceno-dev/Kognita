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

    public List<GoalResponse> findAllByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(GoalResponse::from).toList();
    }

    public Page<GoalResponse> findAllByUser(UUID userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable).map(GoalResponse::from);
    }

    @Transactional
    public GoalResponse create(CreateGoalRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var goal = new StudyGoal();
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setTargetHours(request.targetHours());
        goal.setDeadline(request.deadline());
        goal.setUser(user);
        return GoalResponse.from(repository.save(goal));
    }

    @Transactional
    public GoalResponse update(UUID id, CreateGoalRequest request) {
        var goal = repository.findById(id).orElseThrow();
        goal.setTitle(request.title());
        goal.setDescription(request.description());
        goal.setTargetHours(request.targetHours());
        goal.setDeadline(request.deadline());
        return GoalResponse.from(repository.save(goal));
    }

    @Transactional
    public GoalResponse updateProgress(UUID id, Integer hours) {
        var goal = repository.findById(id).orElseThrow();
        goal.setCurrentHours(goal.getCurrentHours() + hours);
        return GoalResponse.from(repository.save(goal));
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
