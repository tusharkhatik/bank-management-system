package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.TransactionPageResponse;
import com.bank.bankmanagement.dto.TransactionResponse;
import com.bank.bankmanagement.exception.BadRequestException;
import com.bank.bankmanagement.exception.NotFoundException;
import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.TransactionRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(
            TransactionRepository transactionRepository) {

        this.transactionRepository = transactionRepository;
    }

    // =========================================================
    // CURRENT USER TRANSACTIONS
    //
    // USER  -> ONLY OWN TRANSACTIONS
    // ADMIN -> CAN ALSO USE THIS METHOD IF REQUIRED
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsForCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new BadRequestException(
                    "Authentication is required"
            );
        }

        String username = authentication.getName();

        return transactionRepository
                .findByOwnerUsernameWithAccounts(username)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // ALL TRANSACTIONS
    //
    // ADMIN DASHBOARD
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions() {

        return transactionRepository
                .findAllWithAccounts()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // GET TRANSACTION BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long id) {

        if (id == null) {

            throw new BadRequestException(
                    "Transaction ID is required"
            );
        }

        Transaction transaction =
                transactionRepository
                        .findByIdWithAccounts(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Transaction not found"
                                ));

        return toResponse(transaction);
    }

    // =========================================================
    // GET ACCOUNT TRANSACTIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAccountTransactions(
            Long accountId) {

        if (accountId == null) {

            throw new BadRequestException(
                    "Account ID is required"
            );
        }

        return transactionRepository
                .findByAccountIdWithAccounts(accountId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // GET TRANSACTIONS BY TYPE
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByType(
            String type) {

        validateType(type);

        String normalizedType =
                type.trim().toUpperCase();

        return transactionRepository
                .findByTypeWithAccounts(normalizedType)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // GET ACCOUNT TRANSACTIONS BY TYPE
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAccountTransactionsByType(
            Long accountId,
            String type) {

        if (accountId == null) {

            throw new BadRequestException(
                    "Account ID is required"
            );
        }

        validateType(type);

        String normalizedType =
                type.trim().toUpperCase();

        return transactionRepository
                .findByAccountIdAndTypeWithAccounts(
                        accountId,
                        normalizedType
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // PAGINATED TRANSACTIONS
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionPageResponse getTransactionsPaginated(
            Pageable pageable) {

        Page<Transaction> page =
                transactionRepository
                        .findAllPaginated(pageable);

        return toPageResponse(page);
    }

    // =========================================================
    // PAGINATED ACCOUNT TRANSACTIONS
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionPageResponse getAccountTransactionsPaginated(
            Long accountId,
            Pageable pageable) {

        if (accountId == null) {

            throw new BadRequestException(
                    "Account ID is required"
            );
        }

        Page<Transaction> page =
                transactionRepository
                        .findByAccountIdPaginated(
                                accountId,
                                pageable
                        );

        return toPageResponse(page);
    }

    // =========================================================
    // PAGINATED TRANSACTIONS BY TYPE
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionPageResponse getTransactionsByTypePaginated(
            String type,
            Pageable pageable) {

        validateType(type);

        String normalizedType =
                type.trim().toUpperCase();

        Page<Transaction> page =
                transactionRepository
                        .findByTypePaginated(
                                normalizedType,
                                pageable
                        );

        return toPageResponse(page);
    }

    // =========================================================
    // PAGINATED ACCOUNT TRANSACTIONS BY TYPE
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionPageResponse
    getAccountTransactionsByTypePaginated(
            Long accountId,
            String type,
            Pageable pageable) {

        if (accountId == null) {

            throw new BadRequestException(
                    "Account ID is required"
            );
        }

        validateType(type);

        String normalizedType =
                type.trim().toUpperCase();

        Page<Transaction> page =
                transactionRepository
                        .findByAccountIdAndTypePaginated(
                                accountId,
                                normalizedType,
                                pageable
                        );

        return toPageResponse(page);
    }

    // =========================================================
    // VALIDATE TRANSACTION TYPE
    // =========================================================

    private void validateType(String type) {

        if (type == null ||
                type.trim().isEmpty()) {

            throw new BadRequestException(
                    "Transaction type is required"
            );
        }

        String normalizedType =
                type.trim().toUpperCase();

        if (!List.of(
                "DEPOSIT",
                "WITHDRAW",
                "TRANSFER"
        ).contains(normalizedType)) {

            throw new BadRequestException(
                    "Invalid transaction type"
            );
        }
    }

    // =========================================================
    // PAGE RESPONSE MAPPER
    // =========================================================

    private TransactionPageResponse toPageResponse(
            Page<Transaction> page) {

        return new TransactionPageResponse(

                page.getContent()
                        .stream()
                        .map(this::toResponse)
                        .toList(),

                page.getNumber(),

                page.getSize(),

                page.getTotalElements(),

                page.getTotalPages(),

                page.isFirst(),

                page.isLast()
        );
    }

    // =========================================================
    // TRANSACTION RESPONSE MAPPER
    // =========================================================

    private TransactionResponse toResponse(
            Transaction transaction) {

        Long fromId = null;
        String fromNumber = null;

        if (transaction.getFromAccount() != null) {

            fromId =
                    transaction
                            .getFromAccount()
                            .getId();

            fromNumber =
                    transaction
                            .getFromAccount()
                            .getAccountNumber();
        }

        Long toId = null;
        String toNumber = null;

        if (transaction.getToAccount() != null) {

            toId =
                    transaction
                            .getToAccount()
                            .getId();

            toNumber =
                    transaction
                            .getToAccount()
                            .getAccountNumber();
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