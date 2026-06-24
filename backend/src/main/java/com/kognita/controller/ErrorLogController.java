package com.kognita.controller;

import com.kognita.dto.CreateErrorLogRequest;
import com.kognita.dto.ErrorLogResponse;
import com.kognita.model.User;
import com.kognita.service.ErrorLogService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/error-logs")
public class ErrorLogController {

    private final ErrorLogService service;

    public ErrorLogController(ErrorLogService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ErrorLogResponse>> findAllByUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.findAllByUser(user.getId()));
    }

    @GetMapping("/count")
    public ResponseEntity<Long> countByUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.countByUser(user.getId()));
    }

    @PostMapping
    public ResponseEntity<ErrorLogResponse> create(@Valid @RequestBody CreateErrorLogRequest request, @AuthenticationPrincipal User user) {
        var response = service.create(request, user.getId());
        return ResponseEntity.created(URI.create("/api/error-logs/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ErrorLogResponse> update(@PathVariable UUID id, @Valid @RequestBody CreateErrorLogRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, request, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        service.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
