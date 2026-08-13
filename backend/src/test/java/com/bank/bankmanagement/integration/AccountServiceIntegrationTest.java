package com.bank.bankmanagement.integration;

import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.model.Account;
import com.bank.bankmanagement.model.Customer;
import com.bank.bankmanagement.repository.AccountRepository;
import com.bank.bankmanagement.repository.CustomerRepository;
import com.bank.bankmanagement.repository.TransactionRepository;
import com.bank.bankmanagement.service.AccountService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@Rollback
public class AccountServiceIntegrationTest {

    @Autowired
    AccountService accountService;

    @Autowired
    AccountRepository accountRepository;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    TransactionRepository transactionRepository;

    @Test
    public void transfer_integration() {

        // Create customer
        Customer customer = new Customer();
        customer.setName("Test Customer");
        customer.setEmail("test@example.com");
        customer.setPhone("9999999999");

        customer = customerRepository.save(customer);

        // Create accounts for the customer
        Account a1 = new Account(
                "A1",
                BigDecimal.valueOf(500),
                customer
        );

        Account a2 = new Account(
                "A2",
                BigDecimal.valueOf(100),
                customer
        );

        a1 = accountRepository.save(a1);
        a2 = accountRepository.save(a2);

        // Create transfer request
        TransferRequest req = new TransferRequest();
        req.setFromAccountId(a1.getId());
        req.setToAccountId(a2.getId());
        req.setAmount(BigDecimal.valueOf(200));

        // Execute transfer
        accountService.transfer(req);

        // Get updated accounts
        Account refreshedFrom =
                accountRepository.findById(a1.getId()).orElseThrow();

        Account refreshedTo =
                accountRepository.findById(a2.getId()).orElseThrow();

        // Verify balances
        assertEquals(
                0,
                refreshedFrom.getBalance()
                        .compareTo(BigDecimal.valueOf(300))
        );

        assertEquals(
                0,
                refreshedTo.getBalance()
                        .compareTo(BigDecimal.valueOf(300))
        );

        // Verify transaction was created
        assertFalse(
                transactionRepository.findAll().isEmpty()
        );
    }   
}