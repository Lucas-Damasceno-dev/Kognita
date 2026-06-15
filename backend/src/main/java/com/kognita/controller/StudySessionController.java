package com.kognita.controller;

import com.kognita.dto.CreateStudySessionRequest;
import com.kognita.dto.StudySessionResponse;
import com.kognita.service.StudySessionService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/study-sessions")
public class StudySessionController {

    private final StudySessionService service;

    public StudySessionController(StudySessionService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudySessionResponse> findAllByUser(@RequestParam UUID userId) {
        return service.findAllByUser(userId);
    }

    @PostMapping
    public ResponseEntity<StudySessionResponse> create(@Valid @RequestBody CreateStudySessionRequest request, @RequestParam UUID userId) {
        var response = service.create(request, userId);
        return ResponseEntity.created(URI.create("/api/study-sessions/" + response.id())).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
