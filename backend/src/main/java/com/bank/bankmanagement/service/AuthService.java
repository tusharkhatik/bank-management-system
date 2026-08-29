package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.AuthRequest;
import com.bank.bankmanagement.model.Customer;
import com.bank.bankmanagement.model.User;
import com.bank.bankmanagement.repository.CustomerRepository;
import com.bank.bankmanagement.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public String register(AuthRequest request) {

        if (request == null) {
            throw new RuntimeException(
                    "Registration request is required"
            );
        }

        String username =
                request.getUsername() == null
                        ? ""
                        : request.getUsername().trim();

        String password =
                request.getPassword() == null
                        ? ""
                        : request.getPassword();

        String name =
                request.getName() == null
                        ? ""
                        : request.getName().trim();

        String email =
                request.getEmail() == null
                        ? ""
                        : request.getEmail().trim();

        String phone =
                request.getPhone() == null
                        ? ""
                        : request.getPhone().trim();

        if (username.isEmpty()) {
            throw new RuntimeException("Username is required");
        }

        if (password.isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        if (name.isEmpty()) {
            throw new RuntimeException("Name is required");
        }

        if (email.isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        if (phone.isEmpty()) {
            throw new RuntimeException("Phone is required");
        }

        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException(
                    "Username already exists"
            );
        }

        if (customerRepository.existsByEmail(email)) {
            throw new RuntimeException(
                    "Email already exists"
            );
        }

        User user = new User(
                username,
                passwordEncoder.encode(password),
                "USER"
        );

        User savedUser =
                userRepository.save(user);

        Customer customer = new Customer();

        customer.setName(name);
        customer.setEmail(email);
        customer.setPhone(phone);
        customer.setUser(savedUser);

        customerRepository.save(customer);

        return "User registered successfully";
    }

    public String login(AuthRequest request) {

        if (request == null) {
            throw new RuntimeException(
                    "Login request is required"
            );
        }

        String username =
                request.getUsername() == null
                        ? ""
                        : request.getUsername().trim();

        String password =
                request.getPassword() == null
                        ? ""
                        : request.getPassword();

        if (username.isEmpty()) {
            throw new RuntimeException(
                    "Username is required"
            );
        }

        if (password.isEmpty()) {
            throw new RuntimeException(
                    "Password is required"
            );
        }

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid username or password"
                        )
                );

        if (!passwordEncoder.matches(
                password,
                user.getPassword()
        )) {
            throw new RuntimeException(
                    "Invalid username or password"
            );
        }

        return jwtService.generateToken(user);
    }
}