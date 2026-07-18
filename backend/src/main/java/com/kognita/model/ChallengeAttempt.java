package com.kognita.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "challenge_attempts")
public class ChallengeAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "used_ai", nullable = false)
    private boolean usedAi;

    private String notes;

    @Column(name = "how_i_solved")
    private String howISolved;

    @Column(name = "skill_category", length = 50)
    private String skillCategory;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "git_commit_hash")
    private String gitCommitHash;

    @Column(name = "verified_by_git")
    private boolean verifiedByGit = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (date == null) {
            date = LocalDate.now();
        }
    }

    public ChallengeAttempt() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public boolean isUsedAi() { return usedAi; }
    public void setUsedAi(boolean usedAi) { this.usedAi = usedAi; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getHowISolved() { return howISolved; }
    public void setHowISolved(String howISolved) { this.howISolved = howISolved; }
    public String getSkillCategory() { return skillCategory; }
    public void setSkillCategory(String skillCategory) { this.skillCategory = skillCategory; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getGitCommitHash() { return gitCommitHash; }
    public void setGitCommitHash(String gitCommitHash) { this.gitCommitHash = gitCommitHash; }
    public boolean isVerifiedByGit() { return verifiedByGit; }
    public void setVerifiedByGit(boolean verifiedByGit) { this.verifiedByGit = verifiedByGit; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
