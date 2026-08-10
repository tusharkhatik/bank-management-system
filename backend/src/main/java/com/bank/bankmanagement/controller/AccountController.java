package com.bank.bankmanagement.controller;

import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.model.Account;
import com.bank.bankmanagement.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @PostMapping("/{id}/deposit")
public Account deposit(
        @PathVariable Long id,
        @RequestParam double amount) {

    return accountService.deposit(id, amount);
  }
  @PostMapping("/{id}/withdraw")
public Account withdraw(
        @PathVariable Long id,
        @RequestParam double amount) {

    return accountService.withdraw(id, amount);
}

@PostMapping("/transfer")
public ResponseEntity<String> transfer(@RequestBody TransferRequest request) {

    accountService.transfer(request);

    return ResponseEntity.ok("Transfer successful");
}
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public Account createAccount(@RequestBody Account account) {
        return accountService.createAccount(account);
    }

    @GetMapping
    public List<Account> getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccountById(@PathVariable Long id) {
        return accountService.getAccountById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public Account updateAccount(
            @PathVariable Long id,
            @RequestBody Account account) {
        return accountService.updateAccount(id, account);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}