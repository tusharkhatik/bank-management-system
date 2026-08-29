package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.AccountRequest;
import com.bank.bankmanagement.dto.AccountResponse;
import com.bank.bankmanagement.dto.AccountUpdateRequest;
import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.service.AccountService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

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
    // CREATE ACCOUNT - ADMIN ONLY
    // =========================================================

   @PostMapping
@PreAuthorize("hasRole('ADMIN')")
public AccountResponse createAccount(
        @Valid @RequestBody AccountRequest request) {  // ADD @Valid
    
    return accountService.createAccount(request);
}

    // =========================================================
    // GET ACCOUNTS
    // =========================================================
    //
    // ADMIN -> all accounts
    // USER  -> only own accounts
    //
    // AccountService handles the ownership filtering.
    // =========================================================

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<AccountResponse> getAccounts() {

        return accountService.getAccountsForCurrentUser();
    }

    // =========================================================
    // GET ACCOUNT BY ID
    // =========================================================

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountResponse> getAccountById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                accountService.getAccountById(id)
        );
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
        @Valid @RequestBody TransferRequest request) {  // ADD @Valid
    
    accountService.transfer(request);
    
    return ResponseEntity.ok("Transfer successful");
}

    // =========================================================
    // UPDATE ACCOUNT - ADMIN ONLY
    // =========================================================

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse updateAccount(
            @PathVariable Long id,
            @RequestBody AccountUpdateRequest request) {

        return accountService.updateAccount(id, request);
    }

    // =========================================================
    // BLOCK ACCOUNT - ADMIN ONLY
    // =========================================================

    @PatchMapping("/{id}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse blockAccount(
            @PathVariable Long id) {

        return accountService.blockAccount(id);
    }

    // =========================================================
    // UNBLOCK ACCOUNT - ADMIN ONLY
    // =========================================================

    @PatchMapping("/{id}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse unblockAccount(
            @PathVariable Long id) {

        return accountService.unblockAccount(id);
    }

    // =========================================================
    // CLOSE ACCOUNT - ADMIN ONLY
    // =========================================================

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse closeAccount(
            @PathVariable Long id) {

        return accountService.closeAccount(id);
    }

    // =========================================================
    // DELETE ACCOUNT - ADMIN ONLY
    // =========================================================

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable Long id) {

        accountService.deleteAccount(id);

        return ResponseEntity.noContent().build();
    }
}