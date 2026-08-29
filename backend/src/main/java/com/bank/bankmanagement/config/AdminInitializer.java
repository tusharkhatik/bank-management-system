package com.bank.bankmanagement.config;

import com.bank.bankmanagement.model.User;
import com.bank.bankmanagement.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner createDefaultAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            String username = "admin";
            String password = "admin@123";

            if (!userRepository.existsByUsername(username)) {

                User admin = new User(
                        username,
                        passwordEncoder.encode(password),
                        "ADMIN"
                );

                userRepository.save(admin);

                System.out.println(
                        "========================================"
                );
                System.out.println(
                        "Default ADMIN user created"
                );
                System.out.println(
                        "Username: admin"
                );
                System.out.println(
                        "Password: admin@123"
                );
                System.out.println(
                        "========================================"
                );

            } else {

                System.out.println(
                        "ADMIN user already exists"
                );
            }
        };
    }
}
