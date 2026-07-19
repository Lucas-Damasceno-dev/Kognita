package com.kognita.repository;

import com.kognita.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUserId(UUID userId);
    Page<Task> findByUserId(UUID userId, Pageable pageable);
    Page<Task> findBySubjectId(UUID subjectId, Pageable pageable);
    Page<Task> findByUserIdAndStatus(UUID userId, String status, Pageable pageable);

    @Query("""
        SELECT t FROM Task t 
        WHERE t.user.id = :userId 
        AND (:status IS NULL OR t.status = :status)
        AND (:priority IS NULL OR t.priority = :priority)
        AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        ORDER BY t.createdAt DESC
    """)
    Page<Task> findFiltered(@Param("userId") UUID userId, 
                             @Param("status") String status, 
                             @Param("priority") String priority, 
                             @Param("search") String search,
                             Pageable pageable);

    @Query("SELECT DISTINCT t.skillCategory FROM Task t WHERE t.user.id = :userId AND t.skillCategory IS NOT NULL")
    List<String> findDistinctSkillCategoriesByUserId(@Param("userId") UUID userId);

    void deleteBySubjectId(UUID subjectId);
    void deleteByUserIdAndSkillCategoryIgnoreCase(UUID userId, String skillCategory);
}
