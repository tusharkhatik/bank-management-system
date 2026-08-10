package com.bank.bankmanagement.repository;

import com.bank.bankmanagement.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {
}