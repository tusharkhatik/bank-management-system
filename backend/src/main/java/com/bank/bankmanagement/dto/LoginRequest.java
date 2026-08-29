package com.bank.bankmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank(message = "Username is required")
    @Size(
            min = 3,
            max = 50,
            message = "Username must be 3-50 characters"
    )
    private String username;

    @NotBlank(message = "Password is required")
    @Size(
            min = 6,
            max = 128,
            message = "Password must be 6-128 characters"
    )
    private String password;

    @NotBlank(message = "Account type is required")
    private String role;

    public LoginRequest() {
    }

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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}