package com.kognita.controller;

import com.kognita.dto.CreateTaskRequest;
import com.kognita.dto.StatusUpdateRequest;
import com.kognita.dto.TaskResponse;
import com.kognita.model.User;
import com.kognita.service.TaskService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<TaskResponse>> findAllByUser(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.findAllByUserFiltered(user.getId(), status, priority, search, PageRequest.of(page, size)));
    }

    @GetMapping("/practice")
    public ResponseEntity<List<TaskResponse>> getPracticeTasks(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getPracticeTasks(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> findById(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.findById(id, user.getId()));
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(@Valid @RequestBody CreateTaskRequest request, @AuthenticationPrincipal User user) {
        var response = service.create(request, user.getId());
        return ResponseEntity.created(URI.create("/api/tasks/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> update(@PathVariable UUID id, @Valid @RequestBody CreateTaskRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, request, user.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable UUID id, @RequestBody StatusUpdateRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.updateStatus(id, request.status(), user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        service.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
