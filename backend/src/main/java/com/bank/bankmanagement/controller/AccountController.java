package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.AccountRequest;
import com.bank.bankmanagement.dto.AccountResponse;
import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.service.AccountService;

import org.springframework.http.ResponseEntity;
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
    public AccountResponse createAccount(
            @RequestBody AccountRequest request) {

        return accountService.createAccount(request);
    }

    // =========================================================
    // GET ALL ACCOUNTS
    // =========================================================

    @GetMapping
    public List<AccountResponse> getAllAccounts() {

        return accountService.getAllAccounts();
    }

    // =========================================================
    // GET ACCOUNT BY ID
    // =========================================================

    @GetMapping("/{id}")
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
    public AccountResponse deposit(
            @PathVariable Long id,
            @RequestParam BigDecimal amount) {

        return accountService.deposit(id, amount);
    }

    // =========================================================
    // WITHDRAW
    // =========================================================

    @PostMapping("/{id}/withdraw")
    public AccountResponse withdraw(
            @PathVariable Long id,
            @RequestParam BigDecimal amount) {

        return accountService.withdraw(id, amount);
    }

    // =========================================================
    // TRANSFER
    // =========================================================

    @PostMapping("/transfer")
    public ResponseEntity<String> transfer(
            @RequestBody TransferRequest request) {

        accountService.transfer(request);

        return ResponseEntity.ok("Transfer successful");
    }

    // =========================================================
    // UPDATE ACCOUNT
    // =========================================================

    @PutMapping("/{id}")
    public AccountResponse updateAccount(
            @PathVariable Long id,
            @RequestBody com.bank.bankmanagement.model.Account account) {

        return accountService.updateAccount(id, account);
    }

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable Long id) {

        accountService.deleteAccount(id);

        return ResponseEntity.noContent().build();
    }
}
