package com.kognita.controller;

import com.kognita.dto.CreateUserRequest;
import com.kognita.dto.UpdateUserRequest;
import com.kognita.dto.UserResponse;
import com.kognita.service.UserService;
import com.kognita.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        var response = service.create(request);
        return ResponseEntity.created(URI.create("/api/users/" + response.id())).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (!user.getId().equals(id)) {
            return ResponseEntity.status(403).build();
        }
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request, @AuthenticationPrincipal User user) {
        if (!user.getId().equals(id)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/achievements")
    public ResponseEntity<java.util.List<com.kognita.dto.AchievementResponse>> getAchievements(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getAchievements(user.getId()));
    }

    @PostMapping("/buy-freeze")
    public ResponseEntity<UserResponse> buyStreakFreeze(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.buyStreakFreeze(user.getId()));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<java.util.List<UserResponse>> getLeaderboard() {
        return ResponseEntity.ok(service.getLeaderboard());
    }

    @PostMapping("/buy-title")
    public ResponseEntity<UserResponse> buyTitle(@AuthenticationPrincipal User user, @RequestBody BuyTitleRequest request) {
        return ResponseEntity.ok(service.buyTitle(user.getId(), request.title(), request.cost()));
    }

    @PostMapping("/buy-border")
    public ResponseEntity<UserResponse> buyBorder(@AuthenticationPrincipal User user, @RequestBody BuyBorderRequest request) {
        return ResponseEntity.ok(service.buyBorder(user.getId(), request.border(), request.cost()));
    }

    @PostMapping("/daily-quest-claim")
    public ResponseEntity<UserResponse> claimDailyQuest(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.claimDailyQuest(user.getId()));
    }

    public record BuyTitleRequest(String title, int cost) {}
    public record BuyBorderRequest(String border, int cost) {}
}
