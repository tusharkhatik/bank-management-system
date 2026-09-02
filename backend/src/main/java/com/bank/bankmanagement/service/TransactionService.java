package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.TransactionPageResponse;
import com.bank.bankmanagement.dto.TransactionResponse;
import com.bank.bankmanagement.exception.BadRequestException;
import com.bank.bankmanagement.exception.NotFoundException;
import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.AccountRepository;
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
    private final AccountRepository accountRepository;

    public TransactionService(
            TransactionRepository transactionRepository,
            AccountRepository accountRepository) {

        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    // =========================================================
    // CURRENT USER TRANSACTIONS
    // USER ONLY
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getTransactionsForCurrentUser() {

        Authentication authentication =
                getAuthentication();

        String username =
                authentication.getName();

        return transactionRepository
                .findByOwnerUsernameWithAccounts(username)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =========================================================
    // ADMIN - ALL TRANSACTIONS
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getAllTransactions() {

        requireAdmin();

        return transactionRepository
                .findAllWithAccounts()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =========================================================
    // TRANSACTION BY ID
    //
    // ADMIN -> any transaction
    // USER  -> own transaction only
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionResponse
    getTransactionById(Long id) {

        if (id == null) {
            throw new BadRequestException(
                    "Transaction ID is required"
            );
        }

        Authentication authentication =
                getAuthentication();

        Transaction transaction;

        if (isAdmin(authentication)) {

            transaction =
                    transactionRepository
                            .findByIdWithAccounts(id)
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Transaction not found"
                                    ));

        } else {

            String username =
                    authentication.getName();

            transaction =
                    transactionRepository
                            .findByIdAndOwnerUsername(
                                    id,
                                    username
                            )
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Transaction not found"
                                    ));
        }

        return toResponse(transaction);
    }


    // =========================================================
    // ACCOUNT TRANSACTIONS
    //
    // ADMIN -> any account
    // USER  -> own account only
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getAccountTransactions(Long accountId) {

        validateAccountId(accountId);

        Authentication authentication =
                getAuthentication();

        if (!isAdmin(authentication)) {

            String username =
                    authentication.getName();

            boolean owner =
                    accountRepository
                            .findByIdAndOwnerUsername(
                                    accountId,
                                    username
                            )
                            .isPresent();

            if (!owner) {
                throw new NotFoundException(
                        "Account not found"
                );
            }
        }

        return transactionRepository
                .findByAccountIdWithAccounts(accountId)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =========================================================
    // ADMIN - TRANSACTIONS BY TYPE
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getTransactionsByType(String type) {

        requireAdmin();

        String normalizedType =
                validateType(type);

        return transactionRepository
                .findByTypeWithAccounts(normalizedType)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =========================================================
    // ACCOUNT + TYPE
    //
    // ADMIN -> any account
    // USER  -> own account only
    // =========================================================

    @Transactional(readOnly = true)
    public List<TransactionResponse>
    getAccountTransactionsByType(
            Long accountId,
            String type) {

        validateAccountId(accountId);

        String normalizedType =
                validateType(type);

        Authentication authentication =
                getAuthentication();

        if (!isAdmin(authentication)) {

            String username =
                    authentication.getName();

            boolean owner =
                    accountRepository
                            .findByIdAndOwnerUsername(
                                    accountId,
                                    username
                            )
                            .isPresent();

            if (!owner) {
                throw new NotFoundException(
                        "Account not found"
                );
            }
        }

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
    // ADMIN - PAGINATED
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionPageResponse
    getTransactionsPaginated(Pageable pageable) {

        requireAdmin();

        Page<Transaction> page =
                transactionRepository
                        .findAllPaginated(pageable);

        return toPageResponse(page);
    }


    // =========================================================
    // ACCOUNT PAGINATION
    //
    // ADMIN -> any account
    // USER  -> own account only
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionPageResponse
    getAccountTransactionsPaginated(
            Long accountId,
            Pageable pageable) {

        validateAccountId(accountId);

        Authentication authentication =
                getAuthentication();

        if (!isAdmin(authentication)) {

            String username =
                    authentication.getName();

            boolean owner =
                    accountRepository
                            .findByIdAndOwnerUsername(
                                    accountId,
                                    username
                            )
                            .isPresent();

            if (!owner) {
                throw new NotFoundException(
                        "Account not found"
                );
            }
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
    // ADMIN - TYPE PAGINATION
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionPageResponse
    getTransactionsByTypePaginated(
            String type,
            Pageable pageable) {

        requireAdmin();

        String normalizedType =
                validateType(type);

        Page<Transaction> page =
                transactionRepository
                        .findByTypePaginated(
                                normalizedType,
                                pageable
                        );

        return toPageResponse(page);
    }


    // =========================================================
    // ACCOUNT + TYPE PAGINATION
    // =========================================================

    @Transactional(readOnly = true)
    public TransactionPageResponse
    getAccountTransactionsByTypePaginated(
            Long accountId,
            String type,
            Pageable pageable) {

        validateAccountId(accountId);

        String normalizedType =
                validateType(type);

        Authentication authentication =
                getAuthentication();

        if (!isAdmin(authentication)) {

            String username =
                    authentication.getName();

            boolean owner =
                    accountRepository
                            .findByIdAndOwnerUsername(
                                    accountId,
                                    username
                            )
                            .isPresent();

            if (!owner) {
                throw new NotFoundException(
                        "Account not found"
                );
            }
        }

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
    // AUTHENTICATION
    // =========================================================

    private Authentication getAuthentication() {

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

        return authentication;
    }


    // =========================================================
    // ADMIN CHECK
    // =========================================================

    private void requireAdmin() {

        Authentication authentication =
                getAuthentication();

        if (!isAdmin(authentication)) {

            throw new org.springframework.security.access
                    .AccessDeniedException(
                            "Admin access required"
                    );
        }
    }


    private boolean isAdmin(
            Authentication authentication) {

        return authentication
                .getAuthorities()
                .stream()
                .anyMatch(authority ->
                        "ROLE_ADMIN".equals(
                                authority.getAuthority()
                        )
                );
    }


    // =========================================================
    // ACCOUNT ID VALIDATION
    // =========================================================

    private void validateAccountId(Long accountId) {

        if (accountId == null) {

            throw new BadRequestException(
                    "Account ID is required"
            );
        }
    }


    // =========================================================
    // TYPE VALIDATION
    // =========================================================

    private String validateType(String type) {

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

        return normalizedType;
    }


    // =========================================================
    // PAGE RESPONSE
    // =========================================================

    private TransactionPageResponse
    toPageResponse(Page<Transaction> page) {

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
    // RESPONSE MAPPER
    // =========================================================

    private TransactionResponse
    toResponse(Transaction transaction) {

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