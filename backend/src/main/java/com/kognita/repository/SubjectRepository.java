package com.kognita.repository;

import com.kognita.model.Subject;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    List<Subject> findByUserId(UUID userId);
    List<Subject> findByUserIdAndArchivedFalse(UUID userId);
    Page<Subject> findByUserId(UUID userId, Pageable pageable);
    Page<Subject> findByUserIdAndArchivedFalse(UUID userId, Pageable pageable);
}
