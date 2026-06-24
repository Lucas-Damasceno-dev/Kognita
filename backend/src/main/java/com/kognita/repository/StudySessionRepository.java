package com.kognita.repository;

import com.kognita.model.StudySession;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {
    List<StudySession> findByUserId(UUID userId);
    Page<StudySession> findByUserId(UUID userId, Pageable pageable);
    Page<StudySession> findBySubjectId(UUID subjectId, Pageable pageable);
    Page<StudySession> findByUserIdAndDateBetween(UUID userId, LocalDate start, LocalDate end, Pageable pageable);

    @Query("""
        SELECT s FROM StudySession s 
        WHERE s.user.id = :userId
        AND (:subjectId IS NULL OR s.subject.id = :subjectId)
        AND (:startDate IS NULL OR s.date >= :startDate)
        AND (:endDate IS NULL OR s.date <= :endDate)
    """)
    Page<StudySession> findFiltered(@Param("userId") UUID userId,
                                     @Param("subjectId") UUID subjectId,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate,
                                     Pageable pageable);
}
