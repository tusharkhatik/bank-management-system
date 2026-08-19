package com.bank.bankmanagement.config;

import com.bank.bankmanagement.model.User;
import com.bank.bankmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    public AdminInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        if (adminUsername == null ||
                adminUsername.isBlank() ||
                adminPassword == null ||
                adminPassword.isBlank()) {

            return;
        }

        if (userRepository.existsByUsername(adminUsername)) {
            return;
        }

        User admin = new User(
                adminUsername.trim(),
                passwordEncoder.encode(adminPassword),
                "ADMIN"
        );

        userRepository.save(admin);
    }
}
