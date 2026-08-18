package com.bank.bankmanagement.dto;

import com.bank.bankmanagement.model.AccountStatus;
import com.bank.bankmanagement.model.AccountType;

import java.math.BigDecimal;

public class AccountResponse {

    private Long id;
    private String accountNumber;
    private BigDecimal balance;

    private AccountType accountType;
    private AccountStatus status;

    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    public AccountResponse() {
    }

    public AccountResponse(
            Long id,
            String accountNumber,
            BigDecimal balance,
            AccountType accountType,
            AccountStatus status,
            Long customerId,
            String customerName,
            String customerEmail,
            String customerPhone) {

        this.id = id;
        this.accountNumber = accountNumber;
        this.balance = balance;
        this.accountType = accountType;
        this.status = status;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
    }

    public Long getId() {
        return id;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }
}
