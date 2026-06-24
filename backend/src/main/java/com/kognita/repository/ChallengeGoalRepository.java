package com.kognita.repository;

import com.kognita.model.ChallengeGoal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeGoalRepository extends JpaRepository<ChallengeGoal, UUID> {
    List<ChallengeGoal> findByUserId(UUID userId);
}
