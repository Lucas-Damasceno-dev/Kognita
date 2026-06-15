package com.kognita.repository;

import com.kognita.model.Task;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUserId(UUID userId);
    List<Task> findBySubjectId(UUID subjectId);
    List<Task> findByUserIdAndStatus(UUID userId, String status);
}
