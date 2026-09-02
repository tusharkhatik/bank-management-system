package com.bank.bankmanagement.repository;

import com.bank.bankmanagement.model.Account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository
        extends JpaRepository<Account, Long> {

    // =========================================================
    // ADMIN - ALL ACCOUNTS
    // =========================================================

    @Query("""
            SELECT a
            FROM Account a
            JOIN FETCH a.customer c
            JOIN FETCH c.user
            """)
    List<Account> findAllWithCustomer();


    // =========================================================
    // ACCOUNT BY ID
    //
    // Used by ADMIN.
    // =========================================================

    @Query("""
            SELECT a
            FROM Account a
            JOIN FETCH a.customer c
            JOIN FETCH c.user
            WHERE a.id = :id
            """)
    Optional<Account> findByIdWithCustomer(
            @Param("id") Long id
    );


    // =========================================================
    // ACCOUNT BY ID + OWNER
    //
    // IMPORTANT SECURITY QUERY
    //
    // The account must belong to the authenticated username.
    //
    // Therefore:
    //
    // USER A cannot access:
    // /api/accounts/2
    //
    // if account 2 belongs to USER B.
    // =========================================================

    @Query("""
            SELECT a
            FROM Account a
            JOIN FETCH a.customer c
            JOIN FETCH c.user u
            WHERE a.id = :id
              AND u.username = :username
            """)
    Optional<Account> findByIdAndOwnerUsername(
            @Param("id") Long id,
            @Param("username") String username
    );


    // =========================================================
    // CURRENT USER ACCOUNTS
    //
    // USER sees only accounts belonging to their username.
    // =========================================================

    @Query("""
            SELECT a
            FROM Account a
            JOIN FETCH a.customer c
            JOIN FETCH c.user u
            WHERE u.username = :username
            ORDER BY a.id DESC
            """)
    List<Account> findAllByOwnerUsername(
            @Param("username") String username
    );
    // =========================================================
// FIND ACCOUNT BY ACCOUNT NUMBER
//
// Used for receiver lookup during transfer.
//
// This searches for ONE specific account.
// It does NOT expose all accounts to the USER.
// =========================================================

@Query("""
        SELECT a
        FROM Account a
        JOIN FETCH a.customer c
        JOIN FETCH c.user
        WHERE a.accountNumber = :accountNumber
        """)
Optional<Account> findByAccountNumberWithCustomer(
        @Param("accountNumber") String accountNumber
);
}