package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.service.TransactionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

@GetMapping("/account/{accountId}")
public List<Transaction> getTransactionsByAccountId(
        @PathVariable Long accountId) {

    return transactionService.getTransactionsByAccountId(accountId);
}
    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/{id}")
    public Transaction getTransactionById(@PathVariable Long id) {
        return transactionService.getTransactionById(id);
    }
}