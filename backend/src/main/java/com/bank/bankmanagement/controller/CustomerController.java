package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.CustomerResponse;
import com.bank.bankmanagement.dto.CustomerUpdateRequest;
import com.bank.bankmanagement.service.CustomerService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // =========================================================
    // CURRENT USER PROFILE
    // =========================================================

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public CustomerResponse getMyProfile() {

        return customerService.getMyProfile();
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public CustomerResponse updateMyProfile(
            @RequestBody CustomerUpdateRequest request) {

        return customerService.updateMyProfile(request);
    }

    // =========================================================
    // ADMIN OPERATIONS
    // =========================================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<CustomerResponse> getAllCustomers() {

        return customerService.getAllCustomers();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerResponse getCustomerById(
            @PathVariable Long id) {

        return customerService.getCustomerById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerResponse updateCustomer(
            @PathVariable Long id,
            @RequestBody CustomerUpdateRequest request) {

        return customerService.updateCustomer(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable Long id) {

        customerService.deleteCustomer(id);

        return ResponseEntity.noContent().build();
    }
}
