package com.kognita.controller;

import com.kognita.dto.CreateSubjectRequest;
import com.kognita.dto.SubjectResponse;
import com.kognita.service.SubjectService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService service;

    public SubjectController(SubjectService service) {
        this.service = service;
    }

    @GetMapping
    public List<SubjectResponse> findAllByUser(@RequestParam UUID userId) {
        return service.findAllByUser(userId);
    }

    @GetMapping("/{id}")
    public SubjectResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<SubjectResponse> create(@Valid @RequestBody CreateSubjectRequest request, @RequestParam UUID userId) {
        var response = service.create(request, userId);
        return ResponseEntity.created(URI.create("/api/subjects/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public SubjectResponse update(@PathVariable UUID id, @Valid @RequestBody CreateSubjectRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
