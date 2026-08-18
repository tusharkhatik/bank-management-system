package com.bank.bankmanagement.repository;

import com.bank.bankmanagement.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    @Query("""
            SELECT a
            FROM Account a
            JOIN FETCH a.customer
            """)
    List<Account> findAllWithCustomer();

    @Query("""
            SELECT a
            FROM Account a
            JOIN FETCH a.customer
            WHERE a.id = :id
            """)
    Optional<Account> findByIdWithCustomer(Long id);
}
