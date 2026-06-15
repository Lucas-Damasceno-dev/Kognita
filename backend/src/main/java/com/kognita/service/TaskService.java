package com.kognita.service;

import com.kognita.dto.CreateTaskRequest;
import com.kognita.dto.TaskResponse;
import com.kognita.model.Task;
import com.kognita.repository.TaskRepository;
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

    public List<TaskResponse> findAllByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(TaskResponse::from).toList();
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
        if (request.subjectId() != null) {
            task.setSubject(subjectService.findEntityById(request.subjectId()));
        }
        return TaskResponse.from(repository.save(task));
    }

    public TaskResponse updateStatus(UUID id, String status) {
        var task = repository.findById(id).orElseThrow();
        task.setStatus(status);
        return TaskResponse.from(repository.save(task));
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
