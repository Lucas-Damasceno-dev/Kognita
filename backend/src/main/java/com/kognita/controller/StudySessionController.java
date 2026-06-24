package com.kognita.controller;

import com.kognita.dto.CreateStudySessionRequest;
import com.kognita.dto.StudySessionResponse;
import com.kognita.model.User;
import com.kognita.service.StudySessionService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/study-sessions")
public class StudySessionController {

    private final StudySessionService service;

    public StudySessionController(StudySessionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<StudySessionResponse>> findAllByUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.findAllByUser(user.getId()));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<StudySessionResponse>> findAllByUserPaginated(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.findAllByUserFiltered(user.getId(), subjectId, startDate, endDate, page, size));
    }

    @PostMapping
    public ResponseEntity<StudySessionResponse> create(@Valid @RequestBody CreateStudySessionRequest request, @AuthenticationPrincipal User user) {
        var response = service.create(request, user.getId());
        return ResponseEntity.created(URI.create("/api/study-sessions/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudySessionResponse> update(@PathVariable UUID id, @Valid @RequestBody CreateStudySessionRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
