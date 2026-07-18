package com.kognita.repository;

import com.kognita.model.ChallengeAttempt;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChallengeAttemptRepository extends JpaRepository<ChallengeAttempt, UUID> {
    List<ChallengeAttempt> findByUserId(UUID userId);

    long countByUserIdAndUsedAi(UUID userId, boolean usedAi);

    List<ChallengeAttempt> findByUserIdAndDate(UUID userId, LocalDate date);

    List<ChallengeAttempt> findByUserIdAndDateBetweenOrderByDateDesc(UUID userId, LocalDate start, LocalDate end);

    @Query("""
        SELECT c.skillCategory, COUNT(c), SUM(CASE WHEN c.usedAi = false THEN 1 ELSE 0 END)
        FROM ChallengeAttempt c
        WHERE c.user.id = :userId AND c.skillCategory IS NOT NULL
        GROUP BY c.skillCategory
    """)
    List<Object[]> findConfidenceStatsByUser(@Param("userId") UUID userId);

    @Query("""
        SELECT c FROM ChallengeAttempt c 
        WHERE c.user.id = :userId 
        AND c.usedAi = false
        AND (:skillCategory IS NULL OR c.skillCategory = :skillCategory)
        ORDER BY c.date DESC
    """)
    List<ChallengeAttempt> findHistory(@Param("userId") UUID userId, @Param("skillCategory") String skillCategory);

    @Query("""
        SELECT DISTINCT c.date FROM ChallengeAttempt c 
        WHERE c.user.id = :userId AND c.usedAi = false 
        ORDER BY c.date DESC
    """)
    List<LocalDate> findDistinctDatesWithoutAi(@Param("userId") UUID userId);
}
