package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.AuthRequest;
import com.bank.bankmanagement.model.User;
import com.bank.bankmanagement.repository.UserRepository;
import com.bank.bankmanagement.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(
            AuthService authService,
            UserRepository userRepository
    ) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    // ============================================================
    // REGISTER
    // ============================================================

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody AuthRequest request) {

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        authService.register(request)
                )
        );
    }

    // ============================================================
    // LOGIN
    // ============================================================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody AuthRequest request) {

        String token = authService.login(request);

        User user = userRepository
                .findByUsername(request.getUsername())
                .orElseThrow();

        Map<String, Object> response = new HashMap<>();

        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole());

        return ResponseEntity.ok(response);
    }
}