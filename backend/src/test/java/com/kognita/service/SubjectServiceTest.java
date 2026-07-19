package com.kognita.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.kognita.dto.CreateSubjectRequest;
import com.kognita.dto.SubjectResponse;
import com.kognita.model.Subject;
import com.kognita.model.User;
import com.kognita.repository.SubjectRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kognita.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
class SubjectServiceTest {

    @Mock
    private SubjectRepository repository;
    @Mock
    private UserService userService;
    @Mock
    private TaskRepository taskRepository;

    private SubjectService service;

    @BeforeEach
    void setUp() {
        service = new SubjectService(repository, userService, taskRepository);
    }

    @Test
    void findAllByUser_ReturnsSubjects() {
        UUID userId = UUID.randomUUID();
        var user = new User("u", "e", "p");
        user.setId(userId);
        var subject = new Subject();
        subject.setName("Math");
        subject.setUser(user);
        when(repository.findByUserId(userId)).thenReturn(List.of(subject));

        List<SubjectResponse> result = service.findAllByUser(userId);

        assertEquals(1, result.size());
        assertEquals("Math", result.getFirst().name());
    }

    @Test
    void create_SavesAndReturnsSubject() {
        UUID userId = UUID.randomUUID();
        var request = new CreateSubjectRequest("Physics", "Physics desc", "#FF0000");
        var user = new User("u", "e", "p");
        user.setId(userId);
        when(userService.findEntityById(userId)).thenReturn(user);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        SubjectResponse result = service.create(request, userId);

        assertEquals("Physics", result.name());
        assertEquals("#FF0000", result.color());
    }

    @Test
    void delete_DelegatesToRepository() {
        UUID id = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        var user = new User("u", "e", "p");
        user.setId(userId);
        var subject = new Subject();
        subject.setId(id);
        subject.setUser(user);
        when(repository.findById(id)).thenReturn(Optional.of(subject));

        service.delete(id, userId);
        verify(repository).delete(subject);
    }
}
