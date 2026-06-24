package com.kognita.controller;

import com.kognita.dto.CreateChallengeGoalRequest;
import com.kognita.dto.ChallengeGoalResponse;
import com.kognita.model.User;
import com.kognita.service.ChallengeGoalService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/challenge-goals")
public class ChallengeGoalController {

    private final ChallengeGoalService service;

    public ChallengeGoalController(ChallengeGoalService service) {
        this.service = service;
    }

    @GetMapping
    public List<ChallengeGoalResponse> findAllByUser(@AuthenticationPrincipal User user) {
        return service.findAllByUser(user.getId());
    }

    @PostMapping
    public ResponseEntity<ChallengeGoalResponse> create(@Valid @RequestBody CreateChallengeGoalRequest request, @AuthenticationPrincipal User user) {
        var response = service.create(request, user.getId());
        return ResponseEntity.created(URI.create("/api/challenge-goals/" + response.id())).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        service.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
