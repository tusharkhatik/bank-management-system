package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.AccountRequest;
import com.bank.bankmanagement.dto.AccountResponse;
import com.bank.bankmanagement.dto.AccountUpdateRequest;
import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.service.AccountService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // =========================================================
    // CREATE ACCOUNT
    // =========================================================

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse createAccount(
            @RequestBody AccountRequest request) {

        return accountService.createAccount(request);
    }

    // =========================================================
    // GET ALL ACCOUNTS
    // =========================================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AccountResponse> getAllAccounts() {

        return accountService.getAllAccounts();
    }

    // =========================================================
    // GET ACCOUNT BY ID
    // =========================================================

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountResponse> getAccountById(
            @PathVariable Long id) {

        AccountResponse account =
                accountService.getAccountById(id);

        return ResponseEntity.ok(account);
    }

    // =========================================================
    // DEPOSIT
    // =========================================================

    @PostMapping("/{id}/deposit")
    @PreAuthorize("isAuthenticated()")
    public AccountResponse deposit(
            @PathVariable Long id,
            @RequestParam BigDecimal amount) {

        return accountService.deposit(id, amount);
    }

    // =========================================================
    // WITHDRAW
    // =========================================================

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("isAuthenticated()")
    public AccountResponse withdraw(
            @PathVariable Long id,
            @RequestParam BigDecimal amount) {

        return accountService.withdraw(id, amount);
    }

    // =========================================================
    // TRANSFER
    // =========================================================

    @PostMapping("/transfer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> transfer(
            @RequestBody TransferRequest request) {

        accountService.transfer(request);

        return ResponseEntity.ok("Transfer successful");
    }

    // =========================================================
    // UPDATE ACCOUNT
    // =========================================================

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse updateAccount(
            @PathVariable Long id,
            @RequestBody AccountUpdateRequest request) {

        return accountService.updateAccount(id, request);
    }

    // =========================================================
    // BLOCK ACCOUNT
    // =========================================================

    @PatchMapping("/{id}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse blockAccount(
            @PathVariable Long id) {

        return accountService.blockAccount(id);
    }

    // =========================================================
    // UNBLOCK ACCOUNT
    // =========================================================

    @PatchMapping("/{id}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse unblockAccount(
            @PathVariable Long id) {

        return accountService.unblockAccount(id);
    }

    // =========================================================
    // CLOSE ACCOUNT
    // =========================================================

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse closeAccount(
            @PathVariable Long id) {

        return accountService.closeAccount(id);
    }

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable Long id) {

        accountService.deleteAccount(id);

        return ResponseEntity.noContent().build();
    }
}
