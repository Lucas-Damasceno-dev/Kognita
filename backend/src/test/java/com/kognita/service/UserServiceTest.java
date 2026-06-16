package com.kognita.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.kognita.dto.CreateUserRequest;
import com.kognita.dto.UserResponse;
import com.kognita.model.User;
import com.kognita.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    private UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(repository);
    }

    @Test
    void findAll_ReturnsAllUsers() {
        when(repository.findAll()).thenReturn(List.of(new User("Alice", "a@b.com", "hash")));

        List<UserResponse> result = service.findAll();

        assertEquals(1, result.size());
        assertEquals("Alice", result.getFirst().name());
    }

    @Test
    void findById_WhenExists_ReturnsUser() {
        UUID id = UUID.randomUUID();
        var user = new User("Bob", "b@c.com", "hash");
        user.setId(id);
        when(repository.findById(id)).thenReturn(Optional.of(user));

        UserResponse result = service.findById(id);

        assertEquals("Bob", result.name());
    }

    @Test
    void findById_WhenMissing_Throws() {
        when(repository.findById(any())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.findById(UUID.randomUUID()));
    }

    @Test
    void create_SavesAndReturnsUser() {
        var request = new CreateUserRequest("Charlie", "c@d.com", "secret");
        var saved = new User("Charlie", "c@d.com", "encoded");
        when(repository.save(any())).thenReturn(saved);

        UserResponse result = service.create(request);

        assertEquals("Charlie", result.name());
        assertEquals("c@d.com", result.email());
    }

    @Test
    void delete_DelegatesToRepository() {
        UUID id = UUID.randomUUID();

        service.delete(id);

        verify(repository).deleteById(id);
    }
}
