package com.kognita.service;

import com.kognita.dto.CreateErrorLogRequest;
import com.kognita.dto.ErrorLogResponse;
import com.kognita.model.ErrorLog;
import com.kognita.repository.ErrorLogRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ErrorLogService {

    private final ErrorLogRepository repository;
    private final UserService userService;
    private final TaskService taskService;

    public ErrorLogService(ErrorLogRepository repository, UserService userService, TaskService taskService) {
        this.repository = repository;
        this.userService = userService;
        this.taskService = taskService;
    }

    public List<ErrorLogResponse> findAllByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(ErrorLogResponse::from).toList();
    }

    @Transactional
    public ErrorLogResponse create(CreateErrorLogRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var errorLog = new ErrorLog();
        errorLog.setTitle(request.title());
        errorLog.setDescription(request.description());
        errorLog.setSolution(request.solution());
        errorLog.setUser(user);
        if (request.taskId() != null) {
            var task = taskService.findEntityById(request.taskId());
            if (!task.getUser().getId().equals(userId)) {
                throw new RuntimeException("Not authorized");
            }
            errorLog.setTask(task);
        }
        return ErrorLogResponse.from(repository.save(errorLog));
    }

    @Transactional
    public ErrorLogResponse update(UUID id, CreateErrorLogRequest request, UUID userId) {
        var errorLog = repository.findById(id).orElseThrow();
        if (!errorLog.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        errorLog.setTitle(request.title());
        errorLog.setDescription(request.description());
        errorLog.setSolution(request.solution());
        if (request.taskId() != null) {
            var task = taskService.findEntityById(request.taskId());
            if (!task.getUser().getId().equals(userId)) {
                throw new RuntimeException("Not authorized");
            }
            errorLog.setTask(task);
        }
        return ErrorLogResponse.from(repository.save(errorLog));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        var errorLog = repository.findById(id).orElseThrow();
        if (!errorLog.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        repository.delete(errorLog);
    }

    public long countByUser(UUID userId) {
        return repository.countByUserId(userId);
    }

    @Transactional
    public com.kognita.dto.TaskResponse scheduleRechallenge(UUID id, UUID userId) {
        var errorLog = repository.findById(id).orElseThrow();
        if (!errorLog.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }

        var title = "Reimplementar Solução: " + errorLog.getTitle();
        var description = "Desafio de reforço baseado no erro cadastrado:\n" +
                errorLog.getDescription() + "\n\nSolução anterior:\n" + errorLog.getSolution();

        UUID subjectId = null;
        String skillCategory = null;
        if (errorLog.getTask() != null) {
            if (errorLog.getTask().getSubject() != null) {
                subjectId = errorLog.getTask().getSubject().getId();
            }
            skillCategory = errorLog.getTask().getSkillCategory();
        }

        var rechallengeRequest = new com.kognita.dto.CreateTaskRequest(
                title,
                description,
                "pending",
                "medium",
                subjectId,
                java.time.LocalDate.now().plusDays(3),
                skillCategory,
                false
        );

        return taskService.create(rechallengeRequest, userId);
    }
}
