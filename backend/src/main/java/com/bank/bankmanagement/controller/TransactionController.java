package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.TransactionResponse;
import com.bank.bankmanagement.dto.TransactionPageResponse;
import com.bank.bankmanagement.service.TransactionService;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // =========================================================
    // GET ACCOUNT TRANSACTIONS
    // =========================================================

    @GetMapping("/account/{accountId}")
    public List<TransactionResponse> getTransactionsByAccountId(
            @PathVariable Long accountId) {

        return transactionService.getAccountTransactions(accountId);
    }

    // =========================================================
    // GET ALL TRANSACTIONS
    // =========================================================

    @GetMapping
    public List<TransactionResponse> getAllTransactions() {

        return transactionService.getAllTransactions();
    }

    // =========================================================
    // GET TRANSACTION BY ID
    // =========================================================

    @GetMapping("/{id}")
    public TransactionResponse getTransactionById(
            @PathVariable Long id) {

        return transactionService.getTransactionById(id);
    }

    // =========================================================
    // PAGINATED TRANSACTIONS
    // =========================================================

    @GetMapping("/page")
    public TransactionPageResponse getTransactionsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        return transactionService.getTransactionsPaginated(pageable);
    }

    @GetMapping("/account/{accountId}/page")
    public TransactionPageResponse getAccountTransactionsPaginated(
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        return transactionService.getAccountTransactionsPaginated(
                accountId,
                pageable
        );
    }

    @GetMapping("/type/{type}/page")
    public TransactionPageResponse getTransactionsByTypePaginated(
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        return transactionService.getTransactionsByTypePaginated(
                type,
                pageable
        );
    }

    @GetMapping("/account/{accountId}/type/{type}/page")
    public TransactionPageResponse getAccountTransactionsByTypePaginated(
            @PathVariable Long accountId,
            @PathVariable String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        return transactionService.getAccountTransactionsByTypePaginated(
                accountId,
                type,
                pageable
        );
    }

    // =========================================================
    // GET TRANSACTIONS BY TYPE
    // =========================================================

    @GetMapping("/type/{type}")
    public List<TransactionResponse> getTransactionsByType(
            @PathVariable String type) {

        return transactionService.getTransactionsByType(type);
    }

    // =========================================================
    // GET ACCOUNT TRANSACTIONS BY TYPE
    // =========================================================

    @GetMapping("/account/{accountId}/type/{type}")
    public List<TransactionResponse> getAccountTransactionsByType(
            @PathVariable Long accountId,
            @PathVariable String type) {

        return transactionService.getAccountTransactionsByType(
                accountId,
                type
        );
    }
}
