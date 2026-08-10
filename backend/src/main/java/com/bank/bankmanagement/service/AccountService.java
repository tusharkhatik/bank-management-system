package com.bank.bankmanagement.service;
import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.TransactionRepository;

import com.bank.bankmanagement.dto.TransferRequest;
import org.springframework.transaction.annotation.Transactional;

import com.bank.bankmanagement.model.Account;
import com.bank.bankmanagement.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AccountService {
    public Account deposit(Long id, double amount) {

    Account account = accountRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Account not found"));

    if (amount <= 0) {
        throw new RuntimeException("Deposit amount must be greater than zero");
    }

    account.setBalance(account.getBalance() + amount);

    Account savedAccount = accountRepository.save(account);

    Transaction transaction = new Transaction(
            "DEPOSIT",
            amount,
            null,
            savedAccount
    );

    transactionRepository.save(transaction);

    return savedAccount;
}
public Account withdraw(Long id, double amount) {

    Account account = accountRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Account not found"));

    if (amount <= 0) {
        throw new RuntimeException("Withdrawal amount must be greater than zero");
    }

    if (amount > account.getBalance()) {
        throw new RuntimeException("Insufficient balance");
    }

    account.setBalance(account.getBalance() - amount);

    Account savedAccount = accountRepository.save(account);

    Transaction transaction = new Transaction(
            "WITHDRAW",
            amount,
            savedAccount,
            null
    );

    transactionRepository.save(transaction);

    return savedAccount;

}
@Transactional
public void transfer(TransferRequest request) {

    Account fromAccount = accountRepository.findById(request.getFromAccountId())
            .orElseThrow(() -> new RuntimeException("Sender account not found"));

    Account toAccount = accountRepository.findById(request.getToAccountId())
            .orElseThrow(() -> new RuntimeException("Receiver account not found"));

    double amount = request.getAmount();

    if (amount <= 0) {
        throw new RuntimeException("Transfer amount must be greater than zero");
    }

    if (fromAccount.getId().equals(toAccount.getId())) {
        throw new RuntimeException("Cannot transfer to the same account");
    }

    if (amount > fromAccount.getBalance()) {
        throw new RuntimeException("Insufficient balance");
    }

    fromAccount.setBalance(fromAccount.getBalance() - amount);
    toAccount.setBalance(toAccount.getBalance() + amount);

   Transaction transaction = new Transaction(
        "TRANSFER",
        amount,
        fromAccount,
        toAccount
);

transactionRepository.save(transaction);
}

    private final AccountRepository accountRepository;
     private final TransactionRepository transactionRepository;

   public AccountService(AccountRepository accountRepository,
                      TransactionRepository transactionRepository) {

    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
}

    public Account createAccount(Account account) {
        return accountRepository.save(account);
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Optional<Account> getAccountById(Long id) {
        return accountRepository.findById(id);
    }

    public Account updateAccount(Long id, Account accountDetails) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        account.setAccountNumber(accountDetails.getAccountNumber());
        account.setBalance(accountDetails.getBalance());
        account.setCustomer(accountDetails.getCustomer());

        return accountRepository.save(account);
    }

    public void deleteAccount(Long id) {
        accountRepository.deleteById(id);
    }
}