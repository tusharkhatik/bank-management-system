package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.AccountResponse;
import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.exception.InsufficientFundsException;
import com.bank.bankmanagement.model.Account;
import com.bank.bankmanagement.model.Customer;
import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.AccountRepository;
import com.bank.bankmanagement.repository.CustomerRepository;
import com.bank.bankmanagement.repository.TransactionRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AccountServiceTest {

    @Mock
    AccountRepository accountRepository;

    @Mock
    TransactionRepository transactionRepository;

    @Mock
    CustomerRepository customerRepository;

    @InjectMocks
    AccountService accountService;

    // =========================================================
    // DEPOSIT SUCCESS
    // =========================================================

    @Test
    public void deposit_success() {

        Customer customer = new Customer();
        customer.setId(2L);
        customer.setName("Tushar Khatik");
        customer.setEmail("tushar@example.com");
        customer.setPhone("9876543210");

        Account account =
                new Account(
                        "ACC1",
                        BigDecimal.valueOf(100),
                        customer
                );

        when(accountRepository.findByIdWithCustomer(1L))
                .thenReturn(Optional.of(account));

        when(accountRepository.save(any(Account.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AccountResponse updated =
                accountService.deposit(
                        1L,
                        BigDecimal.valueOf(50)
                );

        assertEquals(
                0,
                updated.getBalance()
                        .compareTo(BigDecimal.valueOf(150))
        );

        assertEquals(
                2L,
                updated.getCustomerId()
        );

        assertEquals(
                "Tushar Khatik",
                updated.getCustomerName()
        );

        verify(transactionRepository, times(1))
                .save(any(Transaction.class));
    }

    // =========================================================
    // WITHDRAW INSUFFICIENT
    // =========================================================

    @Test
    public void withdraw_insufficient() {

        Customer customer = new Customer();
        customer.setId(2L);
        customer.setName("Tushar Khatik");
        customer.setEmail("tushar@example.com");
        customer.setPhone("9876543210");

        Account account =
                new Account(
                        "ACC1",
                        BigDecimal.valueOf(100),
                        customer
                );

        when(accountRepository.findByIdWithCustomer(1L))
                .thenReturn(Optional.of(account));

        InsufficientFundsException ex =
                assertThrows(
                        InsufficientFundsException.class,
                        () -> accountService.withdraw(
                                1L,
                                BigDecimal.valueOf(200)
                        )
                );

        assertTrue(
                ex.getMessage().contains("Insufficient")
        );
    }

    // =========================================================
    // TRANSFER SUCCESS
    // =========================================================

    @Test
    public void transfer_success() {

        Customer customer = new Customer();
        customer.setId(2L);
        customer.setName("Tushar Khatik");
        customer.setEmail("tushar@example.com");
        customer.setPhone("9876543210");

        Account from =
                new Account(
                        "FROM",
                        BigDecimal.valueOf(200),
                        customer
                );

        Account to =
                new Account(
                        "TO",
                        BigDecimal.valueOf(50),
                        customer
                );

        when(accountRepository.findByIdWithCustomer(1L))
                .thenReturn(Optional.of(from));

        when(accountRepository.findByIdWithCustomer(2L))
                .thenReturn(Optional.of(to));

        when(accountRepository.save(any(Account.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        TransferRequest request =
                new TransferRequest();

        request.setFromAccountId(1L);
        request.setToAccountId(2L);
        request.setAmount(BigDecimal.valueOf(100));

        accountService.transfer(request);

        assertEquals(
                0,
                from.getBalance()
                        .compareTo(BigDecimal.valueOf(100))
        );

        assertEquals(
                0,
                to.getBalance()
                        .compareTo(BigDecimal.valueOf(150))
        );

        verify(transactionRepository, times(1))
                .save(any(Transaction.class));
    }
}
