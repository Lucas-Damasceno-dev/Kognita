package com.kognita.controller;

import com.kognita.dto.CreateGoalRequest;
import com.kognita.dto.GoalResponse;
import com.kognita.service.StudyGoalService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
    public List<GoalResponse> findAllByUser(@RequestParam UUID userId) {
        return service.findAllByUser(userId);
    }

    @PostMapping
    public ResponseEntity<GoalResponse> create(@Valid @RequestBody CreateGoalRequest request, @RequestParam UUID userId) {
        var response = service.create(request, userId);
        return ResponseEntity.created(URI.create("/api/goals/" + response.id())).body(response);
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
