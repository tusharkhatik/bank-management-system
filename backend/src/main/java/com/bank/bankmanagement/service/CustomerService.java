package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.CustomerResponse;
import com.bank.bankmanagement.dto.CustomerUpdateRequest;
import com.bank.bankmanagement.exception.BadRequestException;
import com.bank.bankmanagement.exception.NotFoundException;
import com.bank.bankmanagement.model.Customer;
import com.bank.bankmanagement.repository.CustomerRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    // =========================================================
    // ADMIN - GET ALL CUSTOMERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllCustomers() {

        return customerRepository.findAllWithUser()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // ADMIN - GET CUSTOMER BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {

        Customer customer =
                customerRepository.findByIdWithUser(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Customer not found"
                                ));

        return toResponse(customer);
    }

    // =========================================================
    // USER - GET OWN PROFILE
    // =========================================================

    @Transactional(readOnly = true)
    public CustomerResponse getMyProfile() {

        String username = getCurrentUsername();

        Customer customer =
                customerRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Customer profile not found"
                                ));

        return toResponse(customer);
    }

    // =========================================================
    // ADMIN - UPDATE CUSTOMER
    // =========================================================

    @Transactional
    public CustomerResponse updateCustomer(
            Long id,
            CustomerUpdateRequest request) {

        if (request == null) {
            throw new BadRequestException(
                    "Customer update request is required"
            );
        }

        Customer customer =
                customerRepository.findByIdWithUser(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Customer not found"
                                ));

        updateFields(customer, request);

        return toResponse(
                customerRepository.save(customer)
        );
    }

    // =========================================================
    // USER - UPDATE OWN PROFILE
    // =========================================================

    @Transactional
    public CustomerResponse updateMyProfile(
            CustomerUpdateRequest request) {

        if (request == null) {
            throw new BadRequestException(
                    "Customer update request is required"
            );
        }

        String username = getCurrentUsername();

        Customer customer =
                customerRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Customer profile not found"
                                ));

        updateFields(customer, request);

        return toResponse(
                customerRepository.save(customer)
        );
    }

    // =========================================================
    // ADMIN - DELETE CUSTOMER
    // =========================================================

    @Transactional
    public void deleteCustomer(Long id) {

        Customer customer =
                customerRepository.findById(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Customer not found"
                                ));

        customerRepository.delete(customer);
    }

    // =========================================================
    // UPDATE VALIDATION
    // =========================================================

    private void updateFields(
            Customer customer,
            CustomerUpdateRequest request) {

        if (request.getName() != null) {

            String name = request.getName().trim();

            if (name.isEmpty()) {
                throw new BadRequestException(
                        "Name cannot be empty"
                );
            }

            customer.setName(name);
        }

        if (request.getEmail() != null) {

            String email = request.getEmail().trim();

            if (email.isEmpty()) {
                throw new BadRequestException(
                        "Email cannot be empty"
                );
            }

            if (!email.equals(customer.getEmail())
                    && customerRepository.existsByEmail(email)) {

                throw new BadRequestException(
                        "Email already exists"
                );
            }

            customer.setEmail(email);
        }

        if (request.getPhone() != null) {

            String phone = request.getPhone().trim();

            if (phone.isEmpty()) {
                throw new BadRequestException(
                        "Phone cannot be empty"
                );
            }

            customer.setPhone(phone);
        }
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new BadRequestException(
                    "Authentication is required"
            );
        }

        return authentication.getName();
    }

    // =========================================================
    // RESPONSE MAPPER
    // =========================================================

    private CustomerResponse toResponse(Customer customer) {

        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getUser() != null
                        ? customer.getUser().getUsername()
                        : null
        );
    }
}
