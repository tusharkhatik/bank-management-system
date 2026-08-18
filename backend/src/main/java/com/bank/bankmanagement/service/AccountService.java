package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.AccountRequest;
import com.bank.bankmanagement.dto.AccountResponse;
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

    // =========================================================
    // DEPOSIT
    // =========================================================

    @Transactional
    public AccountResponse deposit(Long id, BigDecimal amount) {

        validateAmount(amount, "Deposit");

        Account account = accountRepository.findByIdWithCustomer(id)
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

        return toAccountResponse(savedAccount);
    }

    // =========================================================
    // WITHDRAW
    // =========================================================

    @Transactional
    public AccountResponse withdraw(Long id, BigDecimal amount) {

        validateAmount(amount, "Withdrawal");

        Account account = accountRepository.findByIdWithCustomer(id)
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

        return toAccountResponse(savedAccount);
    }

    // =========================================================
    // TRANSFER
    // =========================================================

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

        BigDecimal amount = request.getAmount();

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
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

        Account fromAccount =
                accountRepository
                        .findByIdWithCustomer(
                                request.getFromAccountId()
                        )
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Sender account not found"
                                ));

        Account toAccount =
                accountRepository
                        .findByIdWithCustomer(
                                request.getToAccountId()
                        )
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Receiver account not found"
                                ));

        if (fromAccount.getBalance()
                .compareTo(amount) < 0) {

            throw new InsufficientFundsException(
                    "Insufficient balance"
            );
        }

        fromAccount.setBalance(
                fromAccount.getBalance()
                        .subtract(amount)
        );

        toAccount.setBalance(
                toAccount.getBalance()
                        .add(amount)
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

    // =========================================================
    // CREATE ACCOUNT
    // =========================================================

    @Transactional
    public AccountResponse createAccount(AccountRequest request) {

        if (request == null) {
            throw new BadRequestException(
                    "Account request is required"
            );
        }

        if (request.getCustomerId() == null) {
            throw new BadRequestException(
                    "Customer ID is required"
            );
        }

        if (request.getAccountNumber() == null ||
                request.getAccountNumber().trim().isEmpty()) {

            throw new BadRequestException(
                    "Account number is required"
            );
        }

        Customer customer =
                customerRepository
                        .findById(request.getCustomerId())
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Customer not found"
                                ));

        BigDecimal balance = request.getBalance();

        if (balance == null) {
            balance = BigDecimal.ZERO;
        }

        if (balance.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException(
                    "Initial balance cannot be negative"
            );
        }

        Account account = new Account(
                request.getAccountNumber().trim(),
                balance,
                customer
        );

        Account savedAccount = accountRepository.save(account);

        return toAccountResponse(savedAccount);
    }

    // =========================================================
    // GET ALL ACCOUNTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<AccountResponse> getAllAccounts() {

        return accountRepository.findAllWithCustomer()
                .stream()
                .map(this::toAccountResponse)
                .toList();
    }

    // =========================================================
    // GET ACCOUNT BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long id) {

        Account account =
                accountRepository.findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        return toAccountResponse(account);
    }

    // =========================================================
    // UPDATE ACCOUNT
    // =========================================================

    @Transactional
    public AccountResponse updateAccount(
            Long id,
            Account accountDetails) {

        if (accountDetails == null) {
            throw new BadRequestException(
                    "Account details are required"
            );
        }

        Account account =
                accountRepository.findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        if (accountDetails.getAccountNumber() != null &&
                !accountDetails.getAccountNumber()
                        .trim()
                        .isEmpty()) {

            account.setAccountNumber(
                    accountDetails
                            .getAccountNumber()
                            .trim()
            );
        }

        if (accountDetails.getBalance() != null) {

            if (accountDetails.getBalance()
                    .compareTo(BigDecimal.ZERO) < 0) {

                throw new BadRequestException(
                        "Balance cannot be negative"
                );
            }

            account.setBalance(
                    accountDetails.getBalance()
            );
        }

        if (accountDetails.getCustomer() != null &&
                accountDetails.getCustomer().getId() != null) {

            Long customerId =
                    accountDetails
                            .getCustomer()
                            .getId();

            Customer customer =
                    customerRepository
                            .findById(customerId)
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "Customer not found"
                                    ));

            account.setCustomer(customer);
        }

        Account savedAccount =
                accountRepository.save(account);

        return toAccountResponse(savedAccount);
    }

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    @Transactional
    public void deleteAccount(Long id) {

        Account account =
                accountRepository.findById(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        accountRepository.delete(account);
    }

    // =========================================================
    // ACCOUNT RESPONSE MAPPER
    // =========================================================

    private AccountResponse toAccountResponse(Account account) {

        Customer customer = account.getCustomer();

        return new AccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getBalance(),
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone()
        );
    }

    // =========================================================
    // VALIDATE AMOUNT
    // =========================================================

    private void validateAmount(
            BigDecimal amount,
            String operation) {

        if (amount == null ||
                amount.compareTo(BigDecimal.ZERO) <= 0) {

            throw new BadRequestException(
                    operation +
                    " amount must be greater than zero"
            );
        }
    }
}
