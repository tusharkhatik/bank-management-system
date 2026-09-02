package com.bank.bankmanagement.dto;

import com.bank.bankmanagement.model.AccountStatus;
import com.bank.bankmanagement.model.AccountType;

public record ReceiverAccountResponse(
        Long id,
        String accountNumber,
        AccountType accountType,
        AccountStatus status,
        String customerName
) {
}