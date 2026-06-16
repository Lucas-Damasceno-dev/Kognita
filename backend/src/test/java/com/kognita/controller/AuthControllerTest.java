package com.kognita.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kognita.config.JwtService;
import com.kognita.dto.CreateUserRequest;
import com.kognita.dto.LoginRequest;
import com.kognita.model.User;
import com.kognita.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

@Autowired
private MockMvc mvc;

private final ObjectMapper mapper = new ObjectMapper();

@MockitoBean
private UserRepository userRepository;

@MockitoBean
private PasswordEncoder passwordEncoder;

@MockitoBean
private JwtService jwtService;

    @Test
    void register_WithNewEmail_ReturnsToken() throws Exception {
        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("$2a$encoded");
        var saved = new User("Test", "new@test.com", "$2a$encoded");
        saved.setId(UUID.randomUUID());
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtService.generateToken(saved.getId().toString())).thenReturn("jwt-token");

        var request = new CreateUserRequest("Test", "new@test.com", "secret");

        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("jwt-token"))
            .andExpect(jsonPath("$.user.email").value("new@test.com"));
    }

    @Test
    void register_WithExistingEmail_ReturnsConflict() throws Exception {
        when(userRepository.findByEmail("dup@test.com")).thenReturn(Optional.of(new User()));

        var request = new CreateUserRequest("Dup", "dup@test.com", "secret");

        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
            .andExpect(status().isConflict());
    }

    @Test
    void login_WithValidCredentials_ReturnsToken() throws Exception {
        UUID userId = UUID.randomUUID();
        var user = new User("Test", "a@b.com", "$2a$encoded");
        user.setId(userId);
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "$2a$encoded")).thenReturn(true);
        when(jwtService.generateToken(userId.toString())).thenReturn("jwt-token");

        var request = new LoginRequest("a@b.com", "secret");

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void login_WithInvalidPassword_ReturnsUnauthorized() throws Exception {
        var user = new User("Test", "a@b.com", "$2a$encoded");
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "$2a$encoded")).thenReturn(false);

        var request = new LoginRequest("a@b.com", "wrong");

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }
}
