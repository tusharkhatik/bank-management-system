package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.AuthRequest;
import com.bank.bankmanagement.model.User;
import com.bank.bankmanagement.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    public String createAdmin() {

    if (userRepository.existsByUsername("admin")) {
        return "Admin already exists";
    }

    String encodedPassword =
            passwordEncoder.encode("admin123");

    User admin = new User(
            "admin",
            encodedPassword,
            "ADMIN"
    );

    userRepository.save(admin);

    return "Admin created successfully";
}


    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public String register(AuthRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        String encodedPassword =
                passwordEncoder.encode(request.getPassword());

        User user = new User(
                request.getUsername(),
                encodedPassword,
                "USER"
        );

        userRepository.save(user);

        return "User registered successfully";
    }

    public String login(AuthRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() ->
                        new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new RuntimeException("Invalid username or password");
        }

        return jwtService.generateToken(user);
    }
}