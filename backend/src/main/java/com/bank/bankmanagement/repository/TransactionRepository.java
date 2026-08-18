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

    @Query("""
            SELECT DISTINCT t
            FROM Transaction t
            LEFT JOIN FETCH t.fromAccount
            LEFT JOIN FETCH t.toAccount
            ORDER BY t.timestamp DESC
            """)
    List<Transaction> findAllWithAccounts();

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

    List<Transaction> findByFromAccountIdOrToAccountId(
            Long fromAccountId,
            Long toAccountId
    );

    /*
     * Pagination queries.
     *
     * We intentionally do NOT use JOIN FETCH here because
     * Spring Data needs a count query for Page<T>.
     */

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
}
