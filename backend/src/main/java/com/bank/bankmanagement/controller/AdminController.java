package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.AdminUserResponse;
import com.bank.bankmanagement.model.Customer;
import com.bank.bankmanagement.repository.CustomerRepository;
import com.bank.bankmanagement.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public AdminController(
            UserRepository userRepository,
            CustomerRepository customerRepository) {

        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping("/users")
    public List<AdminUserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(user -> new AdminUserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getRole()
                ))
                .toList();
    }

    @GetMapping("/customers")
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }
}