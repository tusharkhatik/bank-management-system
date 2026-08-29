package com.bank.bankmanagement.repository;

import com.bank.bankmanagement.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // =========================================================
    // ADMIN - ALL TRANSACTIONS
    // =========================================================

    @Query("""
            SELECT DISTINCT t
            FROM Transaction t
            LEFT JOIN FETCH t.fromAccount
            LEFT JOIN FETCH t.toAccount
            ORDER BY t.timestamp DESC
            """)
    List<Transaction> findAllWithAccounts();


    // =========================================================
    // USER - OWN TRANSACTIONS
    //
    // A transaction belongs to the user when either:
    // fromAccount.customer.user.username = username
    // OR
    // toAccount.customer.user.username = username
    // =========================================================

    @Query("""
            SELECT DISTINCT t
            FROM Transaction t
            LEFT JOIN FETCH t.fromAccount fa
            LEFT JOIN FETCH t.toAccount ta
            WHERE fa.customer.user.username = :username
               OR ta.customer.user.username = :username
            ORDER BY t.timestamp DESC
            """)
    List<Transaction> findByOwnerUsernameWithAccounts(
            @Param("username") String username
    );


    // =========================================================
    // GET TRANSACTION BY ID
    // =========================================================

    @Query("""
            SELECT DISTINCT t
            FROM Transaction t
            LEFT JOIN FETCH t.fromAccount
            LEFT JOIN FETCH t.toAccount
            WHERE t.id = :id
            """)
    Optional<Transaction> findByIdWithAccounts(
            @Param("id") Long id
    );


    // =========================================================
    // ACCOUNT TRANSACTIONS
    // =========================================================

    @Query("""
            SELECT DISTINCT t
            FROM Transaction t
            LEFT JOIN FETCH t.fromAccount
            LEFT JOIN FETCH t.toAccount
            WHERE t.fromAccount.id = :accountId
               OR t.toAccount.id = :accountId
            ORDER BY t.timestamp DESC
            """)
    List<Transaction> findByAccountIdWithAccounts(
            @Param("accountId") Long accountId
    );


    // =========================================================
    // TRANSACTIONS BY TYPE
    // =========================================================

    @Query("""
            SELECT DISTINCT t
            FROM Transaction t
            LEFT JOIN FETCH t.fromAccount
            LEFT JOIN FETCH t.toAccount
            WHERE t.type = :type
            ORDER BY t.timestamp DESC
            """)
    List<Transaction> findByTypeWithAccounts(
            @Param("type") String type
    );


    // =========================================================
    // ACCOUNT + TYPE
    // =========================================================

    @Query("""
            SELECT DISTINCT t
            FROM Transaction t
            LEFT JOIN FETCH t.fromAccount
            LEFT JOIN FETCH t.toAccount
            WHERE (t.fromAccount.id = :accountId
               OR t.toAccount.id = :accountId)
              AND t.type = :type
            ORDER BY t.timestamp DESC
            """)
    List<Transaction> findByAccountIdAndTypeWithAccounts(
            @Param("accountId") Long accountId,
            @Param("type") String type
    );


    // =========================================================
    // PAGINATION - ADMIN
    // =========================================================

    @Query(
            value = """
                    SELECT t
                    FROM Transaction t
                    LEFT JOIN FETCH t.fromAccount
                    LEFT JOIN FETCH t.toAccount
                    ORDER BY t.timestamp DESC
                    """,
            countQuery = """
                    SELECT COUNT(t)
                    FROM Transaction t
                    """
    )
    Page<Transaction> findAllPaginated(Pageable pageable);


    // =========================================================
    // PAGINATION - ACCOUNT
    // =========================================================

    @Query(
            value = """
                    SELECT t
                    FROM Transaction t
                    LEFT JOIN FETCH t.fromAccount
                    LEFT JOIN FETCH t.toAccount
                    WHERE (t.fromAccount.id = :accountId
                       OR t.toAccount.id = :accountId)
                    ORDER BY t.timestamp DESC
                    """,
            countQuery = """
                    SELECT COUNT(t)
                    FROM Transaction t
                    WHERE t.fromAccount.id = :accountId
                       OR t.toAccount.id = :accountId
                    """
    )
    Page<Transaction> findByAccountIdPaginated(
            @Param("accountId") Long accountId,
            Pageable pageable
    );


    // =========================================================
    // PAGINATION - TYPE
    // =========================================================

    @Query(
            value = """
                    SELECT t
                    FROM Transaction t
                    LEFT JOIN FETCH t.fromAccount
                    LEFT JOIN FETCH t.toAccount
                    WHERE t.type = :type
                    ORDER BY t.timestamp DESC
                    """,
            countQuery = """
                    SELECT COUNT(t)
                    FROM Transaction t
                    WHERE t.type = :type
                    """
    )
    Page<Transaction> findByTypePaginated(
            @Param("type") String type,
            Pageable pageable
    );


    // =========================================================
    // PAGINATION - ACCOUNT + TYPE
    // =========================================================

    @Query(
            value = """
                    SELECT t
                    FROM Transaction t
                    LEFT JOIN FETCH t.fromAccount
                    LEFT JOIN FETCH t.toAccount
                    WHERE (t.fromAccount.id = :accountId
                       OR t.toAccount.id = :accountId)
                      AND t.type = :type
                    ORDER BY t.timestamp DESC
                    """,
            countQuery = """
                    SELECT COUNT(t)
                    FROM Transaction t
                    WHERE (t.fromAccount.id = :accountId
                       OR t.toAccount.id = :accountId)
                      AND t.type = :type
                    """
    )
    Page<Transaction> findByAccountIdAndTypePaginated(
            @Param("accountId") Long accountId,
            @Param("type") String type,
            Pageable pageable
    );


    // =========================================================
    // EXISTING
    // =========================================================

    List<Transaction> findByFromAccountIdOrToAccountId(
            Long fromAccountId,
            Long toAccountId
    );
}