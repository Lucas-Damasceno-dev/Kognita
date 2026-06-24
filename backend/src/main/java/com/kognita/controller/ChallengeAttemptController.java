package com.kognita.controller;

import com.kognita.dto.ChallengeAttemptResponse;
import com.kognita.dto.CreateChallengeAttemptRequest;
import com.kognita.dto.SkillConfidenceResponse;
import com.kognita.model.User;
import com.kognita.service.ChallengeAttemptService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/challenge-attempts")
public class ChallengeAttemptController {

    private final ChallengeAttemptService service;

    public ChallengeAttemptController(ChallengeAttemptService service) {
        this.service = service;
    }

    @GetMapping
    public List<ChallengeAttemptResponse> findAllByUser(@AuthenticationPrincipal User user) {
        return service.findAllByUser(user.getId());
    }

    @PostMapping
    public ResponseEntity<ChallengeAttemptResponse> create(@Valid @RequestBody CreateChallengeAttemptRequest request, @AuthenticationPrincipal User user) {
        var response = service.create(request, user.getId());
        return ResponseEntity.created(URI.create("/api/challenge-attempts/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ChallengeAttemptResponse update(@PathVariable UUID id, @RequestBody CreateChallengeAttemptRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public SkillConfidenceResponse getStats(@AuthenticationPrincipal User user) {
        return service.getStats(user.getId());
    }

    @GetMapping("/history")
    public List<ChallengeAttemptResponse> getHistory(@AuthenticationPrincipal User user, @RequestParam(required = false) String skillCategory) {
        return service.getHistory(user.getId(), skillCategory);
    }
}
