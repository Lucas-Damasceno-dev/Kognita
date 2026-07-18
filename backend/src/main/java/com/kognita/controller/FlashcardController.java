package com.kognita.controller;

import com.kognita.dto.CreateFlashcardRequest;
import com.kognita.dto.FlashcardResponse;
import com.kognita.dto.ReviewFlashcardRequest;
import com.kognita.model.User;
import com.kognita.service.FlashcardService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcards")
public class FlashcardController {

    private final FlashcardService service;

    public FlashcardController(FlashcardService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<FlashcardResponse>> findAllByUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.findAllByUser(user.getId()));
    }

    @GetMapping("/due")
    public ResponseEntity<List<FlashcardResponse>> findDueCards(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.findDueCards(user.getId()));
    }

    @PostMapping
    public ResponseEntity<FlashcardResponse> create(@Valid @RequestBody CreateFlashcardRequest request, @AuthenticationPrincipal User user) {
        var response = service.create(request, user.getId());
        return ResponseEntity.created(URI.create("/api/flashcards/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FlashcardResponse> update(@PathVariable UUID id, @Valid @RequestBody CreateFlashcardRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, request, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        service.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<FlashcardResponse> review(@PathVariable UUID id, @Valid @RequestBody ReviewFlashcardRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.review(id, request.rating(), user.getId()));
    }
}
