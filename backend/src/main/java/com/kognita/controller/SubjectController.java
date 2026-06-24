package com.kognita.controller;

import com.kognita.dto.CreateSubjectRequest;
import com.kognita.dto.SubjectResponse;
import com.kognita.model.User;
import com.kognita.service.SubjectService;
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
    public ResponseEntity<List<SubjectResponse>> findAllByUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.findAllByUser(user.getId()));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<SubjectResponse>> findAllByUserPage(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.findAllByUser(user.getId(), PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubjectResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<SubjectResponse> create(@Valid @RequestBody CreateSubjectRequest request, @AuthenticationPrincipal User user) {
        var response = service.create(request, user.getId());
        return ResponseEntity.created(URI.create("/api/subjects/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubjectResponse> update(@PathVariable UUID id, @Valid @RequestBody CreateSubjectRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
