package com.kognita.service;

import com.kognita.dto.CreateStudySessionRequest;
import com.kognita.dto.StudySessionResponse;
import com.kognita.model.StudySession;
import com.kognita.repository.StudySessionRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StudySessionService {

    private final StudySessionRepository repository;
    private final SubjectService subjectService;
    private final UserService userService;

    public StudySessionService(StudySessionRepository repository, SubjectService subjectService, UserService userService) {
        this.repository = repository;
        this.subjectService = subjectService;
        this.userService = userService;
    }

    public List<StudySessionResponse> findAllByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(StudySessionResponse::from).toList();
    }

    public Page<StudySessionResponse> findAllByUserPaginated(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "date"));
        return repository.findByUserId(userId, pageable).map(StudySessionResponse::from);
    }

    public Page<StudySessionResponse> findAllByUserFiltered(UUID userId, UUID subjectId, LocalDate startDate, LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "date"));
        return repository.findFiltered(userId, subjectId, startDate, endDate, pageable).map(StudySessionResponse::from);
    }

    @Transactional
    public StudySessionResponse create(CreateStudySessionRequest request, UUID userId) {
        var user = userService.findEntityById(userId);
        var subject = subjectService.findById(request.subjectId());
        var session = new StudySession();
        session.setSubject(subjectService.findEntityById(request.subjectId()));
        session.setUser(user);
        session.setDurationMinutes(request.durationMinutes());
        session.setNotes(request.notes());
        session.setDate(request.date() != null ? request.date() : LocalDate.now());
        return StudySessionResponse.from(repository.save(session));
    }

    @Transactional
    public StudySessionResponse update(UUID id, CreateStudySessionRequest request) {
        var session = repository.findById(id).orElseThrow();
        session.setSubject(subjectService.findEntityById(request.subjectId()));
        session.setDurationMinutes(request.durationMinutes());
        session.setNotes(request.notes());
        session.setDate(request.date() != null ? request.date() : LocalDate.now());
        return StudySessionResponse.from(repository.save(session));
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
