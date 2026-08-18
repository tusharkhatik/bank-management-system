package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.TransactionResponse;
import com.bank.bankmanagement.exception.BadRequestException;
import com.bank.bankmanagement.exception.NotFoundException;
import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.TransactionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions() {

        return transactionRepository
                .findAllWithAccounts()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long id) {

        if (id == null) {
            throw new BadRequestException("Transaction ID is required");
        }

        Transaction transaction =
                transactionRepository.findByIdWithAccounts(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Transaction not found"
                                ));

        return toResponse(transaction);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAccountTransactions(Long accountId) {

        if (accountId == null) {
            throw new BadRequestException("Account ID is required");
        }

        return transactionRepository
                .findByAccountIdWithAccounts(accountId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByType(String type) {

        if (type == null || type.trim().isEmpty()) {
            throw new BadRequestException("Transaction type is required");
        }

        String normalizedType = type.trim().toUpperCase();

        if (!List.of("DEPOSIT", "WITHDRAW", "TRANSFER")
                .contains(normalizedType)) {

            throw new BadRequestException(
                    "Invalid transaction type"
            );
        }

        return transactionRepository
                .findByTypeWithAccounts(normalizedType)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAccountTransactionsByType(
            Long accountId,
            String type) {

        if (accountId == null) {
            throw new BadRequestException("Account ID is required");
        }

        if (type == null || type.trim().isEmpty()) {
            throw new BadRequestException("Transaction type is required");
        }

        String normalizedType = type.trim().toUpperCase();

        if (!List.of("DEPOSIT", "WITHDRAW", "TRANSFER")
                .contains(normalizedType)) {

            throw new BadRequestException(
                    "Invalid transaction type"
            );
        }

        return transactionRepository
                .findByAccountIdAndTypeWithAccounts(accountId, normalizedType)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TransactionResponse toResponse(Transaction transaction) {

        Long fromId = null;
        String fromNumber = null;

        if (transaction.getFromAccount() != null) {
            fromId = transaction.getFromAccount().getId();
            fromNumber = transaction.getFromAccount().getAccountNumber();
        }

        Long toId = null;
        String toNumber = null;

        if (transaction.getToAccount() != null) {
            toId = transaction.getToAccount().getId();
            toNumber = transaction.getToAccount().getAccountNumber();
        }

        return new TransactionResponse(
                transaction.getId(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getTimestamp(),
                fromId,
                fromNumber,
                toId,
                toNumber
        );
    }
}
