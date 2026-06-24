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

@Service
@Transactional(readOnly = true)
public class SubjectService {

    private final SubjectRepository repository;
    private final UserService userService;

    public SubjectService(SubjectRepository repository, UserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    public List<SubjectResponse> findAllByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(SubjectResponse::from).toList();
    }

    public Page<SubjectResponse> findAllByUser(UUID userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable).map(SubjectResponse::from);
    }

    public SubjectResponse findById(UUID id) {
        return repository.findById(id).map(SubjectResponse::from).orElseThrow();
    }

    @Transactional
    public SubjectResponse create(CreateSubjectRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var subject = new Subject();
        subject.setName(request.name());
        subject.setDescription(request.description());
        subject.setColor(request.color() != null ? request.color() : "#3B82F6");
        subject.setUser(user);
        return SubjectResponse.from(repository.save(subject));
    }

    @Transactional
    public SubjectResponse update(UUID id, CreateSubjectRequest request) {
        var subject = repository.findById(id).orElseThrow();
        subject.setName(request.name());
        subject.setDescription(request.description());
        subject.setColor(request.color() != null ? request.color() : "#3B82F6");
        return SubjectResponse.from(repository.save(subject));
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    Subject findEntityById(UUID id) {
        return repository.findById(id).orElseThrow();
    }
}
