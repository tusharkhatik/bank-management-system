package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.AccountRequest;
import com.bank.bankmanagement.dto.AccountResponse;
import com.bank.bankmanagement.dto.AccountUpdateRequest;
import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.exception.BadRequestException;
import com.bank.bankmanagement.exception.InsufficientFundsException;
import com.bank.bankmanagement.exception.NotFoundException;
import com.bank.bankmanagement.model.Account;
import com.bank.bankmanagement.model.AccountStatus;
import com.bank.bankmanagement.model.Customer;
import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.AccountRepository;
import com.bank.bankmanagement.repository.CustomerRepository;
import com.bank.bankmanagement.repository.TransactionRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    // GET ACCOUNTS FOR CURRENT USER
    // ADMIN -> ALL ACCOUNTS
    // USER  -> OWN ACCOUNTS
    // =========================================================

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsForCurrentUser() {

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

        boolean isAdmin =
                authentication.getAuthorities()
                        .stream()
                        .anyMatch(authority ->
                                "ROLE_ADMIN".equals(
                                        authority.getAuthority()
                                )
                        );

        List<Account> accounts;

        if (isAdmin) {

            accounts = accountRepository.findAllWithCustomer();

        } else {

            accounts =
                    accountRepository
                            .findAllByOwnerUsername(username);
        }

        return accounts.stream()
                .map(this::toAccountResponse)
                .toList();
    }

    // =========================================================
    // DEPOSIT
    // =========================================================

    @Transactional
    public AccountResponse deposit(
            Long id,
            BigDecimal amount) {

        validateAmount(amount, "Deposit");

        Account account =
                findAccountForCurrentUser(id);

        validateAccountActive(account);

        account.setBalance(
                account.getBalance().add(amount)
        );

        Account savedAccount =
                accountRepository.save(account);

        Transaction transaction =
                new Transaction(
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
    public AccountResponse withdraw(
            Long id,
            BigDecimal amount) {

        validateAmount(amount, "Withdrawal");

        Account account =
                findAccountForCurrentUser(id);

        validateAccountActive(account);

        if (account.getBalance()
                .compareTo(amount) < 0) {

            throw new InsufficientFundsException(
                    "Insufficient balance"
            );
        }

        account.setBalance(
                account.getBalance().subtract(amount)
        );

        Account savedAccount =
                accountRepository.save(account);

        Transaction transaction =
                new Transaction(
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
    public void transfer(
            TransferRequest request) {

        if (request == null ||
                request.getFromAccountId() == null ||
                request.getToAccountId() == null ||
                request.getAmount() == null) {

            throw new BadRequestException(
                    "Invalid transfer request"
            );
        }

        BigDecimal amount =
                request.getAmount();

        validateAmount(
                amount,
                "Transfer"
        );

        if (request.getFromAccountId()
                .equals(request.getToAccountId())) {

            throw new BadRequestException(
                    "Cannot transfer to the same account"
            );
        }

        Account fromAccount =
                findAccountForCurrentUser(
                        request.getFromAccountId()
                );

        Account toAccount =
                accountRepository
                        .findByIdWithCustomer(
                                request.getToAccountId()
                        )
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Receiver account not found"
                                ));

        validateAccountActive(fromAccount);
        validateAccountActive(toAccount);

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

        Transaction transaction =
                new Transaction(
                        "TRANSFER",
                        amount,
                        fromAccount,
                        toAccount
                );

        transactionRepository.save(transaction);
    }

    // =========================================================
    // CREATE ACCOUNT - ADMIN
    // =========================================================

    @Transactional
    public AccountResponse createAccount(
            AccountRequest request) {

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
                request.getAccountNumber()
                        .trim()
                        .isEmpty()) {

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

        BigDecimal balance =
                request.getInitialBalance();

        if (balance == null) {
            balance = BigDecimal.ZERO;
        }

        if (balance.compareTo(
                BigDecimal.ZERO) < 0) {

            throw new BadRequestException(
                    "Initial balance cannot be negative"
            );
        }

        Account account =
                new Account(
                        request.getAccountNumber()
                                .trim(),
                        balance,
                        customer
                );

        Account savedAccount =
                accountRepository.save(account);

        return toAccountResponse(savedAccount);
    }

    // =========================================================
    // GET ACCOUNT BY ID
    // =========================================================

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(
            Long id) {

        Account account =
                findAccountForCurrentUser(id);

        return toAccountResponse(account);
    }

    // =========================================================
    // UPDATE ACCOUNT - ADMIN
    // =========================================================

    @Transactional
    public AccountResponse updateAccount(
            Long id,
            AccountUpdateRequest request) {

        if (request == null) {
            throw new BadRequestException(
                    "Account update request is required"
            );
        }

        Account account =
                accountRepository
                        .findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        if (request.getAccountNumber() != null) {

            String accountNumber =
                    request.getAccountNumber().trim();

            if (accountNumber.isEmpty()) {

                throw new BadRequestException(
                        "Account number cannot be empty"
                );
            }

            account.setAccountNumber(
                    accountNumber
            );
        }

        if (request.getAccountType() != null) {

            account.setAccountType(
                    request.getAccountType()
            );
        }

        Account savedAccount =
                accountRepository.save(account);

        return toAccountResponse(savedAccount);
    }

    // =========================================================
    // BLOCK ACCOUNT - ADMIN
    // =========================================================

    @Transactional
    public AccountResponse blockAccount(
            Long id) {

        Account account =
                accountRepository
                        .findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        if (account.getStatus() ==
                AccountStatus.CLOSED) {

            throw new BadRequestException(
                    "Closed account cannot be blocked"
            );
        }

        account.setStatus(
                AccountStatus.BLOCKED
        );

        return toAccountResponse(
                accountRepository.save(account)
        );
    }

    // =========================================================
    // UNBLOCK ACCOUNT - ADMIN
    // =========================================================

    @Transactional
    public AccountResponse unblockAccount(
            Long id) {

        Account account =
                accountRepository
                        .findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        if (account.getStatus() ==
                AccountStatus.CLOSED) {

            throw new BadRequestException(
                    "Closed account cannot be unblocked"
            );
        }

        account.setStatus(
                AccountStatus.ACTIVE
        );

        return toAccountResponse(
                accountRepository.save(account)
        );
    }

    // =========================================================
    // CLOSE ACCOUNT - ADMIN
    // =========================================================

    @Transactional
    public AccountResponse closeAccount(
            Long id) {

        Account account =
                accountRepository
                        .findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        if (account.getStatus() ==
                AccountStatus.CLOSED) {

            throw new BadRequestException(
                    "Account is already closed"
            );
        }

        if (account.getBalance()
                .compareTo(BigDecimal.ZERO) != 0) {

            throw new BadRequestException(
                    "Account balance must be zero before closing"
            );
        }

        account.setStatus(
                AccountStatus.CLOSED
        );

        return toAccountResponse(
                accountRepository.save(account)
        );
    }

    // =========================================================
    // DELETE ACCOUNT - ADMIN
    // =========================================================

    @Transactional
    public void deleteAccount(
            Long id) {

        Account account =
                accountRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        accountRepository.delete(account);
    }

    // =========================================================
    // FIND ACCOUNT FOR CURRENT USER
    // =========================================================

    private Account findAccountForCurrentUser(
            Long id) {

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

        String username =
                authentication.getName();

        boolean isAdmin =
                authentication.getAuthorities()
                        .stream()
                        .anyMatch(authority ->
                                "ROLE_ADMIN".equals(
                                        authority.getAuthority()
                                )
                        );

        if (isAdmin) {

            return accountRepository
                    .findByIdWithCustomer(id)
                    .orElseThrow(() ->
                            new NotFoundException(
                                    "Account not found"
                            ));
        }

        return accountRepository
                .findByIdAndOwnerUsername(
                        id,
                        username
                )
                .orElseThrow(() ->
                        new NotFoundException(
                                "Account not found"
                        ));
    }

    // =========================================================
    // VALIDATE ACCOUNT STATUS
    // =========================================================

    private void validateAccountActive(
            Account account) {

        if (account.getStatus() !=
                AccountStatus.ACTIVE) {

            throw new BadRequestException(
                    "Account is " +
                    account.getStatus()
                            .name()
                            .toLowerCase() +
                    " and cannot perform this transaction"
            );
        }
    }

    // =========================================================
    // ACCOUNT RESPONSE MAPPER
    // =========================================================

    private AccountResponse toAccountResponse(
            Account account) {

        Customer customer =
                account.getCustomer();

        return new AccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getBalance(),
                account.getAccountType(),
                account.getStatus(),
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
                amount.compareTo(
                        BigDecimal.ZERO) <= 0) {

            throw new BadRequestException(
                    operation +
                    " amount must be greater than zero"
            );
        }
    }
}

