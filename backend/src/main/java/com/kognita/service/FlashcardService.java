package com.kognita.service;

import com.kognita.dto.CreateFlashcardRequest;
import com.kognita.dto.FlashcardResponse;
import com.kognita.model.Flashcard;
import com.kognita.repository.FlashcardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class FlashcardService {

    private final FlashcardRepository repository;
    private final UserService userService;
    private final SubjectService subjectService;

    public FlashcardService(FlashcardRepository repository, UserService userService, SubjectService subjectService) {
        this.repository = repository;
        this.userService = userService;
        this.subjectService = subjectService;
    }

    public List<FlashcardResponse> findAllByUser(UUID userId) {
        return repository.findByUserId(userId).stream()
                .map(FlashcardResponse::from)
                .toList();
    }

    public List<FlashcardResponse> findDueCards(UUID userId) {
        return repository.findDueCards(userId, LocalDate.now()).stream()
                .map(FlashcardResponse::from)
                .toList();
    }

    @Transactional
    public FlashcardResponse create(CreateFlashcardRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var flashcard = new Flashcard();
        flashcard.setQuestion(request.question());
        flashcard.setAnswer(request.answer());
        flashcard.setUser(user);
        flashcard.setType(request.type() != null ? request.type() : "TEXT");
        flashcard.setOptions(request.options());
        flashcard.setCorrectOptionIndex(request.correctOptionIndex());

        if (request.subjectId() != null) {
            var subject = subjectService.findEntityById(request.subjectId());
            if (!subject.getUser().getId().equals(userId)) {
                throw new RuntimeException("Not authorized");
            }
            flashcard.setSubject(subject);
        }

        return FlashcardResponse.from(repository.save(flashcard));
    }

    @Transactional
    public FlashcardResponse update(UUID id, CreateFlashcardRequest request, UUID userId) {
        var flashcard = repository.findById(id).orElseThrow();
        if (!flashcard.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }

        flashcard.setQuestion(request.question());
        flashcard.setAnswer(request.answer());
        flashcard.setType(request.type() != null ? request.type() : "TEXT");
        flashcard.setOptions(request.options());
        flashcard.setCorrectOptionIndex(request.correctOptionIndex());

        if (request.subjectId() != null) {
            var subject = subjectService.findEntityById(request.subjectId());
            if (!subject.getUser().getId().equals(userId)) {
                throw new RuntimeException("Not authorized");
            }
            flashcard.setSubject(subject);
        } else {
            flashcard.setSubject(null);
        }

        return FlashcardResponse.from(repository.save(flashcard));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        var flashcard = repository.findById(id).orElseThrow();
        if (!flashcard.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        repository.delete(flashcard);
    }

    @Transactional
    public FlashcardResponse review(UUID id, int rating, UUID userId) {
        var flashcard = repository.findById(id).orElseThrow();
        if (!flashcard.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }

        // SM-2 Spaced Repetition Algorithm
        int repetitions = flashcard.getRepetitions();
        double easeFactor = flashcard.getEaseFactor();
        int intervalDays = flashcard.getIntervalDays();

        if (rating >= 3) {
            if (repetitions == 0) {
                intervalDays = 1;
            } else if (repetitions == 1) {
                intervalDays = 6;
            } else {
                intervalDays = (int) Math.round(intervalDays * easeFactor);
            }
            repetitions++;
        } else {
            repetitions = 0;
            intervalDays = 1;
        }

        // Adjust Ease Factor (EF)
        easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }

        flashcard.setRepetitions(repetitions);
        flashcard.setEaseFactor(easeFactor);
        flashcard.setIntervalDays(intervalDays);
        flashcard.setNextReview(LocalDate.now().plusDays(intervalDays));

        var saved = repository.save(flashcard);
        userService.registerActivity(userId);
        return FlashcardResponse.from(saved);
    }
}
