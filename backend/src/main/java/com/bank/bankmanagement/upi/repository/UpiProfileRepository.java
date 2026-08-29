
package com.bank.bankmanagement.upi.repository;

import com.bank.bankmanagement.upi.model.UpiProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UpiProfileRepository
        extends JpaRepository<UpiProfile, Long> {

    Optional<UpiProfile> findByUpiId(String upiId);

    Optional<UpiProfile> findByAccount_Id(Long accountId);

    boolean existsByUpiId(String upiId);

    boolean existsByAccount_Id(Long accountId);

    // =========================================================
    // CURRENT USER UPI PROFILE
    // =========================================================

    @Query("""
            SELECT p
            FROM UpiProfile p
            JOIN FETCH p.account a
            JOIN FETCH a.customer c
            JOIN c.user u
            WHERE u.username = :username
            """)
    Optional<UpiProfile> findByOwnerUsername(String username);

    // =========================================================
    // UPI PROFILE OWNERSHIP
    // =========================================================

    @Query("""
            SELECT p
            FROM UpiProfile p
            JOIN p.account a
            JOIN a.customer c
            JOIN c.user u
            WHERE p.upiId = :upiId
            AND u.username = :username
            """)
    Optional<UpiProfile> findByUpiIdAndOwnerUsername(
            String upiId,
            String username
    );
}
