package com.bank.bankmanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionResponse {

    private Long id;
    private String type;
    private BigDecimal amount;
    private LocalDateTime timestamp;

    private Long fromAccountId;
    private String fromAccountNumber;

    private Long toAccountId;
    private String toAccountNumber;

    public TransactionResponse() {
    }

    public TransactionResponse(
            Long id,
            String type,
            BigDecimal amount,
            LocalDateTime timestamp,
            Long fromAccountId,
            String fromAccountNumber,
            Long toAccountId,
            String toAccountNumber) {

        this.id = id;
        this.type = type;
        this.amount = amount;
        this.timestamp = timestamp;
        this.fromAccountId = fromAccountId;
        this.fromAccountNumber = fromAccountNumber;
        this.toAccountId = toAccountId;
        this.toAccountNumber = toAccountNumber;
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public Long getFromAccountId() {
        return fromAccountId;
    }

    public String getFromAccountNumber() {
        return fromAccountNumber;
    }

    public Long getToAccountId() {
        return toAccountId;
    }

    public String getToAccountNumber() {
        return toAccountNumber;
    }
}
