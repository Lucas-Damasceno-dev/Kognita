package com.kognita.service;

import com.kognita.dto.CreateUserRequest;
import com.kognita.dto.UserResponse;
import com.kognita.model.User;
import com.kognita.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
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

    User findEntityById(UUID id) {
        return repository.findById(id).orElseThrow();
    }
}
