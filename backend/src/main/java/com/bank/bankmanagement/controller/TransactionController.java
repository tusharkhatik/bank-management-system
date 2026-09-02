package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.TransactionPageResponse;
import com.bank.bankmanagement.dto.TransactionResponse;
import com.bank.bankmanagement.service.TransactionService;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(
            TransactionService transactionService) {

        this.transactionService = transactionService;
    }


    // =========================================================
    // USER - OWN TRANSACTIONS
    // =========================================================

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public List<TransactionResponse> getMyTransactions() {

        return transactionService
                .getTransactionsForCurrentUser();
    }


    // =========================================================
    // ADMIN - ALL TRANSACTIONS
    // =========================================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<TransactionResponse> getAllTransactions() {

        return transactionService
                .getAllTransactions();
    }


    // =========================================================
    // TRANSACTION BY ID
    //
    // ADMIN -> any
    // USER  -> own only
    // =========================================================

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public TransactionResponse getTransactionById(
            @PathVariable Long id) {

        return transactionService
                .getTransactionById(id);
    }


    // =========================================================
    // ACCOUNT TRANSACTIONS
    //
    // ADMIN -> any account
    // USER  -> own account
    // =========================================================

    @GetMapping("/account/{accountId}")
    @PreAuthorize("isAuthenticated()")
    public List<TransactionResponse>
    getTransactionsByAccountId(
            @PathVariable Long accountId) {

        return transactionService
                .getAccountTransactions(accountId);
    }


    // =========================================================
    // ADMIN - PAGINATED
    // =========================================================

    @GetMapping("/page")
    @PreAuthorize("hasRole('ADMIN')")
    public TransactionPageResponse
    getTransactionsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable =
                PageRequest.of(page, size);

        return transactionService
                .getTransactionsPaginated(pageable);
    }


    // =========================================================
    // ACCOUNT PAGINATION
    // =========================================================

    @GetMapping("/account/{accountId}/page")
    @PreAuthorize("isAuthenticated()")
    public TransactionPageResponse
    getAccountTransactionsPaginated(
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable =
                PageRequest.of(page, size);

        return transactionService
                .getAccountTransactionsPaginated(
                        accountId,
                        pageable
                );
    }


    // =========================================================
    // ADMIN - TYPE
    // =========================================================

    @GetMapping("/type/{type}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TransactionResponse>
    getTransactionsByType(
            @PathVariable String type) {

        return transactionService
                .getTransactionsByType(type);
    }


    // =========================================================
    // ADMIN - TYPE PAGINATION
    // =========================================================

    @GetMapping("/type/{type}/page")
    @PreAuthorize("hasRole('ADMIN')")
    public TransactionPageResponse
    getTransactionsByTypePaginated(
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable =
                PageRequest.of(page, size);

        return transactionService
                .getTransactionsByTypePaginated(
                        type,
                        pageable
                );
    }


    // =========================================================
    // ACCOUNT + TYPE
    // =========================================================

    @GetMapping("/account/{accountId}/type/{type}")
    @PreAuthorize("isAuthenticated()")
    public List<TransactionResponse>
    getAccountTransactionsByType(
            @PathVariable Long accountId,
            @PathVariable String type) {

        return transactionService
                .getAccountTransactionsByType(
                        accountId,
                        type
                );
    }


    // =========================================================
    // ACCOUNT + TYPE PAGINATION
    // =========================================================

    @GetMapping(
            "/account/{accountId}/type/{type}/page"
    )
    @PreAuthorize("isAuthenticated()")
    public TransactionPageResponse
    getAccountTransactionsByTypePaginated(
            @PathVariable Long accountId,
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable =
                PageRequest.of(page, size);

        return transactionService
                .getAccountTransactionsByTypePaginated(
                        accountId,
                        type,
                        pageable
                );
    }
}