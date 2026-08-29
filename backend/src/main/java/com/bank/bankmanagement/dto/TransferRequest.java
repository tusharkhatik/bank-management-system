package com.bank.bankmanagement.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class TransferRequest {

    @NotNull(message = "Source account ID is required")
    @Positive(message = "Source account ID must be positive")
    private Long fromAccountId;

    @NotNull(message = "Destination account ID is required")
    @Positive(message = "Destination account ID must be positive")
    private Long toAccountId;

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(
        value = "0.01",
        message = "Transfer amount must be greater than 0"
    )
    @DecimalMax(
        value = "999999.99",
        message = "Transfer amount exceeds maximum limit"
    )
    private BigDecimal amount;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    // Getters and Setters
    public Long getFromAccountId() {
        return fromAccountId;
    }

    public void setFromAccountId(Long fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public Long getToAccountId() {
        return toAccountId;
    }

    public void setToAccountId(Long toAccountId) {
        this.toAccountId = toAccountId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}