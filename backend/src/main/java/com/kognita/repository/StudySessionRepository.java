package com.kognita.repository;

import com.kognita.model.StudySession;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {
    List<StudySession> findByUserId(UUID userId);
    List<StudySession> findBySubjectId(UUID subjectId);
    List<StudySession> findByUserIdAndDateBetween(UUID userId, LocalDate start, LocalDate end);
}
