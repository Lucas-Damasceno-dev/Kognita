package com.kognita.service;

import com.kognita.dto.CreateUserRequest;
import com.kognita.dto.UpdateUserRequest;
import com.kognita.dto.UserResponse;
import com.kognita.model.User;
import com.kognita.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> findAll() {
        return repository.findAll().stream().map(UserResponse::from).toList();
    }

    public UserResponse findById(UUID id) {
        return repository.findById(id).map(UserResponse::from).orElseThrow();
    }

    public UserResponse create(CreateUserRequest request) {
        var user = new User(request.name(), request.email(), request.password());
        return UserResponse.from(repository.save(user));
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }

    public UserResponse update(UUID id, UpdateUserRequest request) {
        var user = repository.findById(id).orElseThrow();

        if (request.name() != null) {
            user.setName(request.name());
        }
        if (request.email() != null) {
            user.setEmail(request.email());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }
        if (request.currentPassword() != null && request.newPassword() != null) {
            if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        return UserResponse.from(repository.save(user));
    }

    User findEntityById(UUID id) {
        return repository.findById(id).orElseThrow();
    }
}
