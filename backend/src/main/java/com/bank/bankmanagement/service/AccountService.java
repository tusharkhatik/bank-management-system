package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.ReceiverAccountResponse;
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
    // GET ACCOUNTS
    //
    // ADMIN -> ALL
    // USER  -> OWN ONLY
    // =========================================================

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsForCurrentUser() {

        Authentication authentication =
                getAuthenticatedUser();

        String username =
                authentication.getName();

        if (isAdmin(authentication)) {

            return accountRepository
                    .findAllWithCustomer()
                    .stream()
                    .map(this::toAccountResponse)
                    .toList();
        }

        return accountRepository
                .findAllByOwnerUsername(username)
                .stream()
                .map(this::toAccountResponse)
                .toList();
    }
    // =========================================================
// LOOKUP RECEIVER
//
// USER can search for a specific account number.
//
// This does NOT require the receiver to belong to
// the current user.
//
// Only minimal receiver information is returned.
// =========================================================

@Transactional(readOnly = true)
public ReceiverAccountResponse lookupReceiver(
        String accountNumber) {

    if (accountNumber == null
            || accountNumber.trim().isEmpty()) {

        throw new BadRequestException(
                "Account number is required"
        );
    }

    String normalizedAccountNumber =
            accountNumber.trim();

    Account account =
            accountRepository
                    .findByAccountNumberWithCustomer(
                            normalizedAccountNumber
                    )
                    .orElseThrow(() ->
                            new NotFoundException(
                                    "Receiver account not found"
                            ));

    return new ReceiverAccountResponse(
            account.getId(),
            account.getAccountNumber(),
            account.getAccountType(),
            account.getStatus(),
            account.getCustomer().getName()
    );
}

    // =========================================================
    // DEPOSIT
    //
    // ADMIN -> ANY ACCOUNT
    // USER  -> OWN ACCOUNT ONLY
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
    //
    // ADMIN -> ANY ACCOUNT
    // USER  -> OWN ACCOUNT ONLY
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
    //
    // USER:
    //   fromAccount MUST belong to current user.
    //
    // ADMIN:
    //   fromAccount can belong to anyone.
    //
    // Receiver can belong to another user.
    // =========================================================

    @Transactional
    public void transfer(
            TransferRequest request) {

        if (request == null
                || request.getFromAccountId() == null
                || request.getToAccountId() == null
                || request.getAmount() == null) {

            throw new BadRequestException(
                    "Invalid transfer request"
            );
        }

        Long fromAccountId =
                request.getFromAccountId();

        Long toAccountId =
                request.getToAccountId();

        BigDecimal amount =
                request.getAmount();

        validateAmount(
                amount,
                "Transfer"
        );

        if (fromAccountId.equals(toAccountId)) {

            throw new BadRequestException(
                    "Cannot transfer to the same account"
            );
        }

        /*
         * SECURITY CHECK:
         *
         * USER can only use their own account as
         * the sender.
         *
         * ADMIN can use any account.
         */
        Account fromAccount =
                findAccountForCurrentUser(
                        fromAccountId
                );

        /*
         * Receiver does not need to belong to
         * current user.
         *
         * A USER must be able to transfer money
         * to another user's account.
         */
        Account toAccount =
                accountRepository
                        .findByIdWithCustomer(toAccountId)
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
    // CREATE ACCOUNT
    //
    // Controller already restricts this to ADMIN.
    // =========================================================

    @Transactional
    public AccountResponse createAccount(
            AccountRequest request) {

        requireAdmin();

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

        if (request.getAccountNumber() == null
                || request.getAccountNumber()
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
                        request.getAccountNumber().trim(),
                        balance,
                        customer
                );

        Account savedAccount =
                accountRepository.save(account);

        return toAccountResponse(savedAccount);
    }

    // =========================================================
    // GET ACCOUNT BY ID
    //
    // ADMIN -> ANY
    // USER  -> OWN ONLY
    // =========================================================

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(
            Long id) {

        Account account =
                findAccountForCurrentUser(id);

        return toAccountResponse(account);
    }

    // =========================================================
    // UPDATE ACCOUNT
    //
    // ADMIN ONLY
    // =========================================================

    @Transactional
    public AccountResponse updateAccount(
            Long id,
            AccountUpdateRequest request) {

        requireAdmin();

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

        return toAccountResponse(
                accountRepository.save(account)
        );
    }

    // =========================================================
    // BLOCK
    //
    // ADMIN ONLY
    // =========================================================

    @Transactional
    public AccountResponse blockAccount(
            Long id) {

        requireAdmin();

        Account account =
                accountRepository
                        .findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        if (account.getStatus()
                == AccountStatus.CLOSED) {

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
    // UNBLOCK
    //
    // ADMIN ONLY
    // =========================================================

    @Transactional
    public AccountResponse unblockAccount(
            Long id) {

        requireAdmin();

        Account account =
                accountRepository
                        .findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        if (account.getStatus()
                == AccountStatus.CLOSED) {

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
    // CLOSE
    //
    // ADMIN ONLY
    // =========================================================

    @Transactional
    public AccountResponse closeAccount(
            Long id) {

        requireAdmin();

        Account account =
                accountRepository
                        .findByIdWithCustomer(id)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Account not found"
                                ));

        if (account.getStatus()
                == AccountStatus.CLOSED) {

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
    // DELETE
    //
    // ADMIN ONLY
    // =========================================================

    @Transactional
    public void deleteAccount(
            Long id) {

        requireAdmin();

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
    //
    // THIS IS THE MAIN OWNERSHIP SECURITY METHOD.
    // =========================================================

    private Account findAccountForCurrentUser(
            Long id) {

        if (id == null) {

            throw new BadRequestException(
                    "Account ID is required"
            );
        }

        Authentication authentication =
                getAuthenticatedUser();

        String username =
                authentication.getName();

        /*
         * ADMIN:
         *
         * Can access any account.
         */
        if (isAdmin(authentication)) {

            return accountRepository
                    .findByIdWithCustomer(id)
                    .orElseThrow(() ->
                            new NotFoundException(
                                    "Account not found"
                            ));
        }

        /*
         * USER:
         *
         * The SQL query itself verifies ownership.
         *
         * We do NOT:
         *
         * 1. Load account by ID first
         * 2. Then check ownership later
         *
         * Instead the database query requires:
         *
         * account.id = requested ID
         * AND
         * owner.username = authenticated username
         */
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
    // GET AUTHENTICATED USER
    // =========================================================

    private Authentication getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()) {

            throw new BadRequestException(
                    "Authentication is required"
            );
        }

        return authentication;
    }

    // =========================================================
    // CHECK ADMIN
    // =========================================================

    private boolean isAdmin(
            Authentication authentication) {

        return authentication
                .getAuthorities()
                .stream()
                .anyMatch(authority ->
                        "ROLE_ADMIN".equals(
                                authority.getAuthority()
                        ));
    }

    // =========================================================
    // REQUIRE ADMIN
    // =========================================================

    private void requireAdmin() {

        Authentication authentication =
                getAuthenticatedUser();

        if (!isAdmin(authentication)) {

            throw new org.springframework.security.access.AccessDeniedException(
                    "Admin access required"
            );
        }
    }

    // =========================================================
    // VALIDATE ACCOUNT STATUS
    // =========================================================

    private void validateAccountActive(
            Account account) {

        if (account.getStatus()
                != AccountStatus.ACTIVE) {

            throw new BadRequestException(
                    "Account is "
                            + account.getStatus()
                            .name()
                            .toLowerCase()
                            + " and cannot perform this transaction"
            );
        }
    }

    // =========================================================
    // ACCOUNT RESPONSE
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

        if (amount == null
                || amount.compareTo(
                        BigDecimal.ZERO) <= 0) {

            throw new BadRequestException(
                    operation
                            + " amount must be greater than zero"
            );
        }
    }
}