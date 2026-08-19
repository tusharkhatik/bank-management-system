package com.bank.bankmanagement.dto;

import com.bank.bankmanagement.model.AccountType;

public class AccountUpdateRequest {

    private String accountNumber;
    private AccountType accountType;

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }
}
