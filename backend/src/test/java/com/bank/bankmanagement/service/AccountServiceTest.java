package com.bank.bankmanagement.service;

import com.bank.bankmanagement.dto.TransferRequest;
import com.bank.bankmanagement.exception.InsufficientFundsException;
import com.bank.bankmanagement.model.Account;
import com.bank.bankmanagement.model.Transaction;
import com.bank.bankmanagement.repository.AccountRepository;
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

    @InjectMocks
    AccountService accountService;

    @Test
    public void deposit_success() {

        Account account =
                new Account("ACC1", BigDecimal.valueOf(100), null);

        account.setBalance(BigDecimal.valueOf(100));

        when(accountRepository.findById(1L))
                .thenReturn(Optional.of(account));

        when(accountRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        Account updated =
                accountService.deposit(
                        1L,
                        BigDecimal.valueOf(50)
                );

        assertEquals(
                0,
                updated.getBalance()
                        .compareTo(BigDecimal.valueOf(150))
        );

        verify(transactionRepository, times(1))
                .save(any(Transaction.class));
    }

    @Test
    public void withdraw_insufficient() {

        Account account =
                new Account("ACC1", BigDecimal.valueOf(100), null);

        when(accountRepository.findById(1L))
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

    @Test
    public void transfer_success() {

        Account from =
                new Account(
                        "FROM",
                        BigDecimal.valueOf(200),
                        null
                );

        from.setBalance(BigDecimal.valueOf(200));

        Account to =
                new Account(
                        "TO",
                        BigDecimal.valueOf(50),
                        null
                );

        when(accountRepository.findById(1L))
                .thenReturn(Optional.of(from));

        when(accountRepository.findById(2L))
                .thenReturn(Optional.of(to));

        when(accountRepository.save(any()))
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