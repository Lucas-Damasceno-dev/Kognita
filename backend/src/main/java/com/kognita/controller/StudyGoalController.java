package com.kognita.controller;

import com.kognita.dto.CreateGoalRequest;
import com.kognita.dto.GoalResponse;
import com.kognita.model.User;
import com.kognita.service.StudyGoalService;
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
@RequestMapping("/api/goals")
public class StudyGoalController {

    private final StudyGoalService service;

    public StudyGoalController(StudyGoalService service) {
        this.service = service;
    }

    @GetMapping
    public List<GoalResponse> findAllByUser(@AuthenticationPrincipal User user) {
        return service.findAllByUser(user.getId());
    }

    @GetMapping("/page")
    public Page<GoalResponse> findAllByUserPage(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.findAllByUser(user.getId(), PageRequest.of(page, size));
    }

    @PostMapping
    public ResponseEntity<GoalResponse> create(@Valid @RequestBody CreateGoalRequest request, @AuthenticationPrincipal User user) {
        var response = service.create(request, user.getId());
        return ResponseEntity.created(URI.create("/api/goals/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public GoalResponse update(@PathVariable UUID id, @Valid @RequestBody CreateGoalRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/progress")
    public GoalResponse updateProgress(@PathVariable UUID id, @RequestBody Integer hours) {
        return service.updateProgress(id, hours);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
