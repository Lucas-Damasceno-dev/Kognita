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
        var subject = subjectService.findEntityById(request.subjectId());
        if (!subject.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        var session = new StudySession();
        session.setSubject(subject);
        session.setUser(user);
        session.setDurationMinutes(request.durationMinutes());
        session.setNotes(request.notes());
        session.setDate(request.date() != null ? request.date() : LocalDate.now());
        var saved = repository.save(session);
        int xp = request.durationMinutes();
        if (subjectService.isWeeklySubject(subject.getId(), userId)) {
            xp = (int) (xp * 1.5);
        }
        userService.awardXp(userId, xp, "STUDY_SESSION", "Sessão de foco de " + request.durationMinutes() + "m: " + subject.getName());
        userService.registerActivity(userId);
        return StudySessionResponse.from(saved);
    }

    @Transactional
    public StudySessionResponse update(UUID id, CreateStudySessionRequest request, UUID userId) {
        var session = repository.findById(id).orElseThrow();
        if (!session.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        var subject = subjectService.findEntityById(request.subjectId());
        if (!subject.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        session.setSubject(subject);
        session.setDurationMinutes(request.durationMinutes());
        session.setNotes(request.notes());
        session.setDate(request.date() != null ? request.date() : LocalDate.now());
        return StudySessionResponse.from(repository.save(session));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        var session = repository.findById(id).orElseThrow();
        if (!session.getUser().getId().equals(userId)) {
            throw new com.kognita.exception.NotAuthorizedException("Not authorized");
        }
        repository.delete(session);
    }
}
