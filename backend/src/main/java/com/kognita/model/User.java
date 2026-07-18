package com.kognita.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "total_experience")
    private long totalExperience = 0;

    @Column(name = "github_repo")
    private String githubRepo;

    private String title = "Recruta do Código";

    @Column(name = "avatar_border")
    private String avatarBorder = "border-none";

    @Column(name = "streak_count")
    private Integer streakCount = 0;

    @Column(name = "last_active_date")
    private java.time.LocalDate lastActiveDate;

    @Column(name = "streak_freezes")
    private Integer streakFreezes = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public User() {}

    public User(String name, String email, String passwordHash) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public long getTotalExperience() { return totalExperience; }
    public void setTotalExperience(long totalExperience) { this.totalExperience = totalExperience; }
    public String getGithubRepo() { return githubRepo; }
    public void setGithubRepo(String githubRepo) { this.githubRepo = githubRepo; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAvatarBorder() { return avatarBorder; }
    public void setAvatarBorder(String avatarBorder) { this.avatarBorder = avatarBorder; }
    public Integer getStreakCount() { return streakCount; }
    public void setStreakCount(Integer streakCount) { this.streakCount = streakCount; }
    public java.time.LocalDate getLastActiveDate() { return lastActiveDate; }
    public void setLastActiveDate(java.time.LocalDate lastActiveDate) { this.lastActiveDate = lastActiveDate; }
    public Integer getStreakFreezes() { return streakFreezes; }
    public void setStreakFreezes(Integer streakFreezes) { this.streakFreezes = streakFreezes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
