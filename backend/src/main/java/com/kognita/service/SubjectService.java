package com.kognita.service;

import com.kognita.dto.CreateSubjectRequest;
import com.kognita.dto.SubjectResponse;
import com.kognita.model.Subject;
import com.kognita.repository.SubjectRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
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

    public SubjectResponse findById(UUID id) {
        return repository.findById(id).map(SubjectResponse::from).orElseThrow();
    }

    public SubjectResponse create(CreateSubjectRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var subject = new Subject();
        subject.setName(request.name());
        subject.setDescription(request.description());
        subject.setColor(request.color() != null ? request.color() : "#3B82F6");
        subject.setUser(user);
        return SubjectResponse.from(repository.save(subject));
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
