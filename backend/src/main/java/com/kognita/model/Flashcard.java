package com.kognita.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "flashcards")
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "next_review", nullable = false)
    private LocalDate nextReview = LocalDate.now();

    @Column(name = "interval_days", nullable = false)
    private Integer intervalDays = 0;

    @Column(name = "ease_factor", nullable = false)
    private Double easeFactor = 2.5;

    @Column(name = "repetitions", nullable = false)
    private Integer repetitions = 0;

    @Column(nullable = false)
    private String type = "TEXT";

    @Column(columnDefinition = "TEXT")
    private String options;

    @Column(name = "correct_option_index")
    private Integer correctOptionIndex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public Flashcard() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDate getNextReview() { return nextReview; }
    public void setNextReview(LocalDate nextReview) { this.nextReview = nextReview; }
    public Integer getIntervalDays() { return intervalDays; }
    public void setIntervalDays(Integer intervalDays) { this.intervalDays = intervalDays; }
    public Double getEaseFactor() { return easeFactor; }
    public void setEaseFactor(Double easeFactor) { this.easeFactor = easeFactor; }
    public Integer getRepetitions() { return repetitions; }
    public void setRepetitions(Integer repetitions) { this.repetitions = repetitions; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }
    public Integer getCorrectOptionIndex() { return correctOptionIndex; }
    public void setCorrectOptionIndex(Integer correctOptionIndex) { this.correctOptionIndex = correctOptionIndex; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
