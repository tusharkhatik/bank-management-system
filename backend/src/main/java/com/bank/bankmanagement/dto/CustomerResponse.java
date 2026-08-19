package com.bank.bankmanagement.dto;

public class CustomerResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String username;

    public CustomerResponse(
            Long id,
            String name,
            String email,
            String phone,
            String username) {

        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.username = username;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getUsername() {
        return username;
    }
}
