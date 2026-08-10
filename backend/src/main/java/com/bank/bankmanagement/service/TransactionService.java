package com.bank.bankmanagement.service;

import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {
    public List<Transaction> getTransactionsByAccountId(Long accountId) {

    return transactionRepository
            .findByFromAccountIdOrToAccountId(accountId, accountId);
}

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }
}