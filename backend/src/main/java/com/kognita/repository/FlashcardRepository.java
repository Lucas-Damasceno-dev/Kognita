package com.kognita.repository;

import com.kognita.model.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {
    List<Flashcard> findByUserId(UUID userId);

    @Query("SELECT f FROM Flashcard f WHERE f.user.id = :userId AND f.nextReview <= :today")
    List<Flashcard> findDueCards(@Param("userId") UUID userId, @Param("today") LocalDate today);
}
