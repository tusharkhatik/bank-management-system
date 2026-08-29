package com.bank.bankmanagement.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class AccountRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotBlank(message = "Account number is required")
    @Pattern(
        regexp = "^[0-9]{10,12}$",
        message = "Account number must be 10-12 digits"
    )
    private String accountNumber;

    @NotBlank(message = "Account holder name is required")
    @Size(
        min = 3,
        max = 100,
        message = "Name must be 3-100 characters"
    )
    private String accountHolderName;

    @NotBlank(message = "Account type is required")
    private String accountType;

    @NotNull(message = "Initial balance is required")
    @DecimalMin(
        value = "0.0",
        inclusive = true,
        message = "Balance cannot be negative"
    )
    @DecimalMax(
        value = "999999999.99",
        message = "Balance exceeds maximum limit"
    )
    private BigDecimal initialBalance;

    @Email(message = "Invalid email address")
    private String email;

    @Pattern(
        regexp = "^[0-9]{10}$",
        message = "Phone must be 10 digits"
    )
    private String phone;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public BigDecimal getInitialBalance() {
        return initialBalance;
    }

    public void setInitialBalance(BigDecimal initialBalance) {
        this.initialBalance = initialBalance;
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
}
