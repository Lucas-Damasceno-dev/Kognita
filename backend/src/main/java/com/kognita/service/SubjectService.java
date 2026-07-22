package com.kognita.service;

import com.kognita.dto.CreateSubjectRequest;
import com.kognita.dto.SubjectResponse;
import com.kognita.model.Subject;
import com.kognita.repository.SubjectRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kognita.repository.TaskRepository;

@Service
@Transactional(readOnly = true)
public class SubjectService {

    private final SubjectRepository repository;
    private final UserService userService;
    private final TaskRepository taskRepository;

    public SubjectService(SubjectRepository repository, UserService userService, TaskRepository taskRepository) {
        this.repository = repository;
        this.userService = userService;
        this.taskRepository = taskRepository;
    }

    public List<SubjectResponse> findAllByUser(UUID userId) {
        return findAllByUser(userId, true);
    }

    public List<SubjectResponse> findAllByUser(UUID userId, Boolean includeArchived) {
        var list = includeArchived 
            ? repository.findByUserId(userId) 
            : repository.findByUserIdAndArchivedFalse(userId);
        return list.stream().map(SubjectResponse::from).toList();
    }

    public Page<SubjectResponse> findAllByUser(UUID userId, Pageable pageable) {
        return findAllByUser(userId, pageable, true);
    }

    public Page<SubjectResponse> findAllByUser(UUID userId, Pageable pageable, Boolean includeArchived) {
        var page = includeArchived 
            ? repository.findByUserId(userId, pageable) 
            : repository.findByUserIdAndArchivedFalse(userId, pageable);
        return page.map(SubjectResponse::from);
    }

    public SubjectResponse findById(UUID id, UUID userId) {
        var subject = repository.findById(id).orElseThrow();
        if (!subject.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        return SubjectResponse.from(subject);
    }

    @Transactional
    public SubjectResponse create(CreateSubjectRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var subject = new Subject();
        subject.setName(request.name());
        subject.setDescription(request.description());
        subject.setColor(request.color() != null ? request.color() : "#3B82F6");
        subject.setNotes(request.notes());
        subject.setUser(user);
        return SubjectResponse.from(repository.save(subject));
    }

    @Transactional
    public SubjectResponse update(UUID id, CreateSubjectRequest request, UUID userId) {
        var subject = repository.findById(id).orElseThrow();
        if (!subject.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        subject.setName(request.name());
        subject.setDescription(request.description());
        subject.setColor(request.color() != null ? request.color() : "#3B82F6");
        subject.setNotes(request.notes());
        return SubjectResponse.from(repository.save(subject));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        var subject = repository.findById(id).orElseThrow();
        if (!subject.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        taskRepository.deleteBySubjectId(id);
        if (subject.getName() != null) {
            taskRepository.deleteByUserIdAndSkillCategoryIgnoreCase(userId, subject.getName());
        }
        repository.delete(subject);
    }

    public boolean isWeeklySubject(UUID subjectId, UUID userId) {
        var subjects = repository.findByUserIdAndArchivedFalse(userId);
        if (subjects == null || subjects.isEmpty()) {
            return false;
        }
        var ids = new java.util.ArrayList<>(subjects.stream().map(Subject::getId).toList());
        java.util.Collections.sort(ids);
        
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.temporal.WeekFields weekFields = java.time.temporal.WeekFields.of(java.util.Locale.getDefault());
        int weekOfYear = today.get(weekFields.weekOfYear());
        
        UUID weeklyId = ids.get(weekOfYear % ids.size());
        return weeklyId.equals(subjectId);
    }

    Subject findEntityById(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    @Transactional
    public SubjectResponse archive(UUID id, UUID userId) {
        var subject = repository.findById(id).orElseThrow();
        if (!subject.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        subject.setArchived(true);
        return SubjectResponse.from(repository.save(subject));
    }
}
