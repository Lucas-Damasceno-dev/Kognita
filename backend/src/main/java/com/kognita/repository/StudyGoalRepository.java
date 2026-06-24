package com.kognita.repository;

import com.kognita.model.StudyGoal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyGoalRepository extends JpaRepository<StudyGoal, UUID> {
    List<StudyGoal> findByUserId(UUID userId);
    Page<StudyGoal> findByUserId(UUID userId, Pageable pageable);
}
