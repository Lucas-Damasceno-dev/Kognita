package com.kognita.service;

import com.kognita.dto.CreateTaskRequest;
import com.kognita.dto.TaskResponse;
import com.kognita.model.Task;
import com.kognita.repository.TaskRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TaskService {

    private final TaskRepository repository;
    private final SubjectService subjectService;
    private final UserService userService;

    public TaskService(TaskRepository repository, SubjectService subjectService, UserService userService) {
        this.repository = repository;
        this.subjectService = subjectService;
        this.userService = userService;
    }

    public Page<TaskResponse> findAllByUser(UUID userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable).map(TaskResponse::from);
    }

    public List<TaskResponse> getPracticeTasks(UUID userId) {
        var all = repository.findByUserId(userId);
        Collections.shuffle(all);
        return all.stream().limit(3).map(TaskResponse::from).toList();
    }

    public TaskResponse findById(UUID id) {
        return repository.findById(id).map(TaskResponse::from).orElseThrow();
    }

    public TaskResponse create(CreateTaskRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var task = new Task();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status() != null ? request.status() : "pending");
        task.setPriority(request.priority() != null ? request.priority() : "medium");
        task.setDueDate(request.dueDate());
        task.setUser(user);
        task.setSkillCategory(request.skillCategory());
        if (request.requiresProof() != null) {
            task.setRequiresProof(request.requiresProof());
        }
        if (request.subjectId() != null) {
            task.setSubject(subjectService.findEntityById(request.subjectId()));
        }
        return TaskResponse.from(repository.save(task));
    }

    public TaskResponse update(UUID id, CreateTaskRequest request) {
        var task = repository.findById(id).orElseThrow();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status() != null ? request.status() : task.getStatus());
        task.setPriority(request.priority() != null ? request.priority() : task.getPriority());
        task.setDueDate(request.dueDate());
        task.setSkillCategory(request.skillCategory());
        if (request.requiresProof() != null) {
            task.setRequiresProof(request.requiresProof());
        }
        if (request.subjectId() != null) {
            task.setSubject(subjectService.findEntityById(request.subjectId()));
        } else {
            task.setSubject(null);
        }
        return TaskResponse.from(repository.save(task));
    }

    public TaskResponse updateStatus(UUID id, String status) {
        var task = repository.findById(id).orElseThrow();
        task.setStatus(status);
        return TaskResponse.from(repository.save(task));
    }

    public Page<TaskResponse> findAllByUserFiltered(UUID userId, String status, String priority, String search, Pageable pageable) {
        return repository.findFiltered(userId, status, priority, search, pageable).map(TaskResponse::from);
    }

    public Task findEntityById(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
