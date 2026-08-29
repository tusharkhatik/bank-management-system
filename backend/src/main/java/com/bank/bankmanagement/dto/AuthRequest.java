package com.bank.bankmanagement.dto;

import jakarta.validation.constraints.*;

public class AuthRequest {

    // =========================================================
    // USERNAME
    // =========================================================

    @NotBlank(message = "Username is required")
    @Size(
        min = 3,
        max = 50,
        message = "Username must be 3-50 characters"
    )
    @Pattern(
        regexp = "^[a-zA-Z0-9_.-]+$",
        message = "Username can only contain letters, numbers, dots, hyphens, and underscores"
    )
    private String username;

    // =========================================================
    // PASSWORD
    // =========================================================

    @NotBlank(message = "Password is required")
    @Size(
        min = 6,
        max = 128,
        message = "Password must be 6-128 characters"
    )
    private String password;

    // =========================================================
    // REGISTRATION FIELDS
    // =========================================================

    @Size(
        min = 2,
        max = 100,
        message = "Name must be 2-100 characters"
    )
    private String name;

    @Email(message = "Invalid email address")
    private String email;

    @Pattern(
        regexp = "^[0-9]{10}$",
        message = "Phone must be 10 digits"
    )
    private String phone;

    // =========================================================
    // LOGIN ROLE
    // =========================================================

    private String role;

    // =========================================================
    // CONSTRUCTORS
    // =========================================================

    public AuthRequest() {
    }

    // =========================================================
    // GETTERS / SETTERS
    // =========================================================

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}