package com.kognita.dto;

import com.kognita.model.Flashcard;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record FlashcardResponse(
    UUID id,
    String question,
    String answer,
    UUID subjectId,
    String subjectName,
    LocalDate nextReview,
    Integer intervalDays,
    Double easeFactor,
    Integer repetitions,
    String type,
    String options,
    Integer correctOptionIndex,
    OffsetDateTime createdAt
) {
    public static FlashcardResponse from(Flashcard flashcard) {
        return new FlashcardResponse(
            flashcard.getId(),
            flashcard.getQuestion(),
            flashcard.getAnswer(),
            flashcard.getSubject() != null ? flashcard.getSubject().getId() : null,
            flashcard.getSubject() != null ? flashcard.getSubject().getName() : null,
            flashcard.getNextReview(),
            flashcard.getIntervalDays(),
            flashcard.getEaseFactor(),
            flashcard.getRepetitions(),
            flashcard.getType(),
            flashcard.getOptions(),
            flashcard.getCorrectOptionIndex(),
            flashcard.getCreatedAt()
        );
    }
}
