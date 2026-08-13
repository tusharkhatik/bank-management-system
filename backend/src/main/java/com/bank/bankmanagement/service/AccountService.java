package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.AccountRequest;
import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.exception.BadRequestException;
import com.bank.bankmanagement.exception.InsufficientFundsException;
import com.bank.bankmanagement.exception.NotFoundException;
import com.bank.bankmanagement.model.Account;
import com.bank.bankmanagement.model.Customer;
import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.AccountRepository;
import com.bank.bankmanagement.repository.CustomerRepository;
import com.bank.bankmanagement.repository.TransactionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final CustomerRepository customerRepository;

    public AccountService(
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            CustomerRepository customerRepository) {

        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public Account deposit(Long id, BigDecimal amount) {

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(
                    "Deposit amount must be greater than zero"
            );
        }

        Account account = accountRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException("Account not found"));

        account.setBalance(
                account.getBalance().add(amount)
        );

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

    @Transactional
    public Account withdraw(Long id, BigDecimal amount) {

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(
                    "Withdrawal amount must be greater than zero"
            );
        }

        Account account = accountRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException("Account not found"));

        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException(
                    "Insufficient balance"
            );
        }

        account.setBalance(
                account.getBalance().subtract(amount)
        );

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

        if (request == null ||
                request.getFromAccountId() == null ||
                request.getToAccountId() == null ||
                request.getAmount() == null) {

            throw new BadRequestException(
                    "Invalid transfer request"
            );
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(
                    "Transfer amount must be greater than zero"
            );
        }

        if (request.getFromAccountId()
                .equals(request.getToAccountId())) {

            throw new BadRequestException(
                    "Cannot transfer to the same account"
            );
        }

        Account fromAccount = accountRepository
                .findById(request.getFromAccountId())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Sender account not found"
                        ));

        Account toAccount = accountRepository
                .findById(request.getToAccountId())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Receiver account not found"
                        ));

        BigDecimal amount = request.getAmount();

        if (fromAccount.getBalance()
                .compareTo(amount) < 0) {

            throw new InsufficientFundsException(
                    "Insufficient balance"
            );
        }

        fromAccount.setBalance(
                fromAccount.getBalance().subtract(amount)
        );

        toAccount.setBalance(
                toAccount.getBalance().add(amount)
        );

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        Transaction transaction = new Transaction(
                "TRANSFER",
                amount,
                fromAccount,
                toAccount
        );

        transactionRepository.save(transaction);
    }

    public Account createAccount(AccountRequest request) {

        if (request.getCustomerId() == null) {
            throw new BadRequestException(
                    "Customer ID is required"
            );
        }

        Customer customer = customerRepository
                .findById(request.getCustomerId())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Customer not found"
                        ));

        BigDecimal balance = request.getBalance();

        if (balance == null) {
            balance = BigDecimal.ZERO;
        }

        Account account = new Account(
                request.getAccountNumber(),
                balance,
                customer
        );

        return accountRepository.save(account);
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Account getAccountById(Long id) {

        return accountRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "Account not found"
                        ));
    }

    public Account updateAccount(
            Long id,
            Account accountDetails) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "Account not found"
                        ));

        account.setAccountNumber(
                accountDetails.getAccountNumber()
        );

        if (accountDetails.getBalance() != null) {
            account.setBalance(
                    accountDetails.getBalance()
            );
        }

        if (accountDetails.getCustomer() != null &&
                accountDetails.getCustomer().getId() != null) {

            Long customerId =
                    accountDetails.getCustomer().getId();

            Customer customer = customerRepository
                    .findById(customerId)
                    .orElseThrow(() ->
                            new NotFoundException(
                                    "Customer not found"
                            ));

            account.setCustomer(customer);
        }

        return accountRepository.save(account);
    }

    public void deleteAccount(Long id) {

        Account account = accountRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "Account not found"
                        ));

        accountRepository.delete(account);
    }
}